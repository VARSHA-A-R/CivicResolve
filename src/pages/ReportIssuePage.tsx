import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../context/ComplaintContext';
import { useAuth } from '../context/AuthContext';
import { analyzeCivicIssueWithGemini } from '../services/geminiService';
import {
  readComplaintImageAsDataUrl,
  uploadComplaintImage,
  validateComplaintImage,
} from '../services/storageService';
import { Button } from '../components/ui/Button';
import {
  Camera,
  MapPin,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  Copy,
  ArrowRight,
  Navigation,
} from 'lucide-react';

function createSubmissionKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function runSubmissionStage<T>(stage: string, operation: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  if (import.meta.env.DEV) console.info(`[CivicResolve] Complaint submission started: ${stage}`);
  try {
    const result = await operation();
    if (import.meta.env.DEV) {
      console.info(`[CivicResolve] Complaint submission completed: ${stage} (${Date.now() - startedAt}ms)`);
    }
    return result;
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    if (import.meta.env.DEV) {
      console.error(`[CivicResolve] Complaint submission failed: ${stage} (${errorName})`);
    }
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    throw new Error(`${stage} failed: ${message}`);
  }
}

function logValidationFailure(field: string): void {
  if (import.meta.env.DEV) {
    console.warn(`[CivicResolve] Complaint submission blocked: validation (${field}).`);
  }
}

export const ReportIssuePage: React.FC = () => {
  const { createComplaint } = useComplaints();
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [landmark, setLandmark] = useState('');
  const [citizenName, setCitizenName] = useState(user?.displayName || 'Citizen Contributor');
  const [citizenContact, setCitizenContact] = useState(user?.phoneNumber || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isReadingImage, setIsReadingImage] = useState(false);

  // AI & Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);
  const submissionAttempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const [submittedComplaintId, setSubmittedComplaintId] = useState<string | null>(null);
  const [submittedTitle, setSubmittedTitle] = useState('');
  const [submittedAt, setSubmittedAt] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync user display name if changed
  useEffect(() => {
    if (user?.displayName && citizenName === 'Citizen Contributor') {
      setCitizenName(user.displayName);
    }
    if (user?.phoneNumber && !citizenContact) {
      setCitizenContact(user.phoneNumber);
    }
  }, [user, citizenName, citizenContact]);

  // Handle Image Selection & Validation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;

    const validation = validateComplaintImage(file);
    if (!validation.valid) {
      setFormError(validation.error || 'Invalid image file.');
      return;
    }

    setSelectedFile(file);
    setFormError(null);

    setIsReadingImage(true);
    void readComplaintImageAsDataUrl(file)
      .then(setImagePreview)
      .catch((error: unknown) => {
        setSelectedFile(null);
        setFormError(
          error instanceof Error
            ? `Photo preparation failed: ${error.message}`
            : 'Photo preparation failed. The selected photograph could not be read.'
        );
      })
      .finally(() => setIsReadingImage(false));
  };

  const removeImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setIsReadingImage(false);
  };

  // Browser Geolocation Helper
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setAddress(`GPS coordinates: ${lat}, ${lng}`);
        setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setFormError('Could not detect your current location. Please enter the street address manually.');
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Handle Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionInFlight.current) return;
    setFormError(null);

    if (!title.trim() || title.trim().length < 5) {
      logValidationFailure('title');
      setFormError('Please enter a descriptive issue title (minimum 5 characters).');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      logValidationFailure('description');
      setFormError('Please enter a detailed description (minimum 10 characters).');
      return;
    }
    if (!address.trim()) {
      logValidationFailure('location');
      setFormError('Please provide the location address.');
      return;
    }
    if (isReadingImage) {
      logValidationFailure('photo preparation');
      setFormError('Please wait for the selected photograph to finish preparing.');
      return;
    }
    if (!user?.uid) {
      logValidationFailure('authentication');
      setFormError('Please sign in again before submitting a complaint.');
      return;
    }

    const fingerprint = JSON.stringify([
      title.trim(),
      description.trim(),
      address.trim(),
      landmark.trim(),
      citizenName.trim(),
      citizenContact.trim(),
      selectedFile ? [selectedFile.name, selectedFile.size, selectedFile.lastModified] : null,
    ]);
    if (submissionAttempt.current?.fingerprint !== fingerprint) {
      submissionAttempt.current = { fingerprint, key: createSubmissionKey() };
    }

    submissionInFlight.current = true;
    setIsSubmitting(true);

    try {
      if (import.meta.env.DEV) console.info('[CivicResolve] Complaint submission validation completed.');
      // 1. Upload photographic evidence to Firebase Storage if a file was selected
      let finalImageUrl: string | undefined = undefined;
      if (selectedFile) {
        finalImageUrl = await runSubmissionStage(
          'Photo upload',
          () => uploadComplaintImage(selectedFile, user.uid)
        );
      } else if (import.meta.env.DEV) {
        console.info('[CivicResolve] Complaint submission photo upload skipped: no photo selected.');
      }

      // 2. Generate assessment once; Gemini failure transparently falls back to heuristic
      const finalAI = await runSubmissionStage(
        'AI classification',
        () => analyzeCivicIssueWithGemini(
          title,
          description,
          address,
          imagePreview || undefined
        )
      );
      if (import.meta.env.DEV) {
        console.info(`[CivicResolve] Complaint assessment source: ${finalAI.source}`);
      }

      // 3. Create verified complaint record in Cloud Firestore
      const created = await runSubmissionStage('Firestore save', () =>
        createComplaint({
          title: title.trim(),
          description: description.trim(),
          location: {
            address: address.trim(),
            ...(landmark.trim() ? { landmark: landmark.trim() } : {}),
            city: 'Bangalore',
            ...(coordinates ? { coordinates } : {}),
          },
          ...(finalImageUrl ? { imageUrl: finalImageUrl } : {}),
          status: 'reported',
          priority: finalAI.priority,
          category: finalAI.category,
          department: finalAI.recommendedDepartment,
          citizenName: citizenName.trim(),
          citizenContact: citizenContact.trim(),
          ...(user.email ? { citizenEmail: user.email } : {}),
          citizenUid: user.uid,
          aiAnalysis: finalAI,
        }, submissionAttempt.current!.key)
      );

      setSubmittedComplaintId(created.id);
      setSubmittedTitle(created.title);
      setSubmittedAt(created.createdAt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit complaint. Please check fields and try again.';
      setFormError(msg);
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!submittedComplaintId) return;
    navigator.clipboard.writeText(submittedComplaintId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Success Confirmation Screen
  if (submittedComplaintId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Complaint submitted successfully
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Your civic issue report has been saved and assigned a tracking ID.
          </p>
        </div>

        {/* Tracking ID Callout */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto space-y-3">
          <div className="text-sm font-semibold text-slate-800">{submittedTitle}</div>
          {submittedAt && (
            <div className="text-xs text-slate-500">
              Submitted {new Date(submittedAt).toLocaleString()}
            </div>
          )}
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Your Official Tracking ID
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-2xl font-black text-teal-700 bg-teal-50 px-4 py-1.5 rounded-lg border border-teal-200">
              {submittedComplaintId}
            </span>
            <button
              onClick={handleCopyId}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
              title="Copy Tracking ID"
            >
              {copiedId ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Keep this ID to monitor real-time repair progress and verify photo closure.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link to={`/track?id=${submittedComplaintId}`}>
            <Button variant="teal" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Track Complaint
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="lg">
              Return to Citizen Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
          Public Grievance Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Report a Civic Infrastructure Issue
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Describe the issue and provide its location. Your report will be classified and routed for municipal review.
        </p>
      </div>

      {formError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-civic-card">
          {/* Issue Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Deep pothole on 100ft road causing two-wheeler skids"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
              required
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Describe the severity, how long it has been present, and any immediate hazard to traffic or pedestrians..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 p-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400 leading-relaxed"
              required
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Tip: Include keywords like "flooding", "sparking", "school nearby" for urgent AI safety elevation.
            </span>
          </div>

          {/* Location Input & Geolocation helper */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Location & Street Address <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition"
              >
                <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Detecting GPS...' : 'Use Current Location'}</span>
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Street address, Cross, Ward, or Road name..."
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setCoordinates(undefined);
                }}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {/* Landmark */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nearby Landmark (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Opposite Metro Pillar 182, Next to City Bakery"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
            />
          </div>

          {/* Photo Evidence Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Photographic Evidence (Validated Image Upload & Multimodal AI)
            </label>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-100 max-h-56">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-teal-50/30 transition group">
                <Camera className="w-8 h-8 text-slate-400 group-hover:text-teal-600 transition mb-2" />
                <span className="text-xs font-semibold text-slate-700">
                  {isReadingImage ? 'Preparing photograph...' : 'Click to snap photo or upload image'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG, or WebP up to 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={isReadingImage}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Citizen Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number for SMS Tracking
              </label>
              <input
                type="tel"
                value={citizenContact}
                onChange={(e) => setCitizenContact(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="teal"
              size="lg"
              isLoading={isSubmitting || isReadingImage}
              leftIcon={<Send className="w-4 h-4" />}
              className="w-full font-bold shadow-sm"
            >
              Submit Civic Grievance
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};
