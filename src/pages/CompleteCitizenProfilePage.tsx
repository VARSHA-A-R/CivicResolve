import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const CompleteCitizenProfilePage: React.FC = () => {
  const { user, isVerifiedOfficer, completeCitizenProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [error, setError] = useState(user?.profileError || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName === 'Citizen' ? '' : user.displayName);
    setPhoneNumber(user.phoneNumber || '');
    setError(user.profileError || null);
  }, [user]);

  if (!user) return <Navigate to="/" replace />;
  if (isVerifiedOfficer) return <Navigate to="/admin" replace />;
  if (user.profileComplete) return <Navigate to="/dashboard" replace />;

  const continueToApplication = searchParams.get('continue') === 'officer-application';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await completeCitizenProfile(displayName, phoneNumber);
      navigate(continueToApplication ? '/officer-application' : '/dashboard', { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Citizen profile could not be saved.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <h1 className="text-2xl font-extrabold text-slate-900">Complete your citizen profile</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Your Firebase account is signed in, but its citizen profile is missing or incomplete.
          Save the profile to continue. This recovery will not create another Authentication account.
        </p>

        {error && (
          <div role="alert" className="mt-5 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Account email
            <input
              type="email"
              value={user.email}
              readOnly
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Mobile number
            <input
              type="tel"
              autoComplete="tel"
              required
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </label>
          <Button type="submit" variant="teal" isLoading={isSubmitting} className="w-full font-bold">
            {error ? 'Retry profile save' : 'Save profile and continue'}
          </Button>
        </form>
      </section>
    </main>
  );
};
