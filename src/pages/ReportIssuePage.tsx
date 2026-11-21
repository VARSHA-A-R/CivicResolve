import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../context/ComplaintContext';
import { useAuth } from '../context/AuthContext';
import {
  analyzeCivicIssueWithGemini,
} from '../services/geminiService';
import { AIAnalysisCard } from '../components/complaints/AIAnalysisCard';
import { Button } from '../components/ui/Button';
import type { AIAnalysisResult } from '../types';
import {
  Camera,
  MapPin,
  Sparkles,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  Copy,
  ArrowRight,
  Navigation,
  Info,
} from 'lucide-react';

export const ReportIssuePage: React.FC = () => {
  const { createComplaint } = useComplaints();
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [citizenName, setCitizenName] = useState(user?.displayName || 'Citizen Contributor');
  const [citizenContact, setCitizenContact] = useState(user?.phoneNumber || '+91 98450 12345');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // AI & Submission State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPreviewResult, setAiPreviewResult] = useState<AIAnalysisResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaintId, setSubmittedComplaintId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Trigger automated AI Analysis when title or description change (with debounce)
  useEffect(() => {
    if (title.trim().length < 5 && description.trim().length < 10) {
      setAiPreviewResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const result = await analyzeCivicIssueWithGemini(
          title,
          description,
          imagePreview || undefined
        );
        setAiPreviewResult(result);
      } catch (err) {
        console.error('AI preview failed:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [title, description, imagePreview]);

  // Handle Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
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
        setAddress(`Near Lat: ${lat}, Lng: ${lng}, Indiranagar Ward 142, Bangalore`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setAddress('100ft Ring Road, Indiranagar, Bangalore - 560038');
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Handle Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter an issue title.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please enter a detailed description.');
      return;
    }
    if (!address.trim()) {
      setFormError('Please provide the location address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Final Gemini analysis or reuse current preview
      let finalAI = aiPreviewResult;
      if (!finalAI) {
        finalAI = await analyzeCivicIssueWithGemini(
          title,
          description,
          imagePreview || undefined
        );
      }

      const created = await createComplaint({
        title: title.trim(),
        description: description.trim(),
        location: {
          address: address.trim(),
          landmark: landmark.trim() || undefined,
          city: 'Bangalore',
        },
        imageUrl: imagePreview || undefined,
        status: 'reported',
        priority: finalAI.priority,
        category: finalAI.category,
        department: finalAI.recommendedDepartment,
        citizenName: citizenName.trim(),
        citizenContact: citizenContact.trim(),
        aiAnalysis: finalAI,
      });

      setSubmittedComplaintId(created.id);
    } catch (err) {
      console.error('Complaint submission error:', err);
      setFormError('Failed to submit complaint. Please check fields and try again.');
    } finally {
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
            Grievance Registered Successfully
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Your issue has been logged, triaged with Google Gemini AI, and routed to the municipal
            ward division with an active resolution SLA.
          </p>
        </div>

        {/* Tracking ID Callout */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto space-y-3">
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
              Track This Issue Live
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
          Describe the problem below. Our integrated Google Gemini AI engine will analyze hazard severity and automatically dispatch it to the correct municipal authority.
        </p>
      </div>

      {formError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Form + Live AI Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (7 Cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-civic-card">
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
                onChange={(e) => setAddress(e.target.value)}
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
              Photographic Evidence (Optional, Multimodal Gemini Support)
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
                  Click to snap photo or upload image
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, or WEBP up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
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
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
              className="w-full font-bold shadow-sm"
            >
              Submit Civic Grievance
            </Button>
          </div>
        </form>

        {/* Right Column: Dedicated AI Analysis Preview Section (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-civic-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Dedicated AI Analysis Preview
                </h3>
              </div>
              {isAnalyzing && (
                <span className="text-[11px] font-semibold text-teal-600 animate-pulse">
                  Triage in progress...
                </span>
              )}
            </div>

            <div className="mt-4">
              {aiPreviewResult ? (
                <AIAnalysisCard analysis={aiPreviewResult} isPreview={true} />
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">
                    Type your report to see live AI triage
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                    As you type title and description, Google Gemini automatically calculates priority, assigns the correct department, and projects the repair SLA in real time.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Municipal Service Guarantee Card */}
          <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl border border-slate-800 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Info className="w-4 h-4 text-teal-400" />
              <span>Municipal Charter Guarantee</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Every ticket filed through CivicResolve receives an immutable timestamp, public tracking ID, and guaranteed official review within 24 hours under the Citizens' Right to Public Services Act.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
