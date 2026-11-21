import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AlertCircle, Building2, CheckCircle2, Clock3 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getOfficerApplication, submitOfficerApplication } from '../services/officerApplicationService';
import type { OfficerApplication } from '../types';

export const OfficerApplicationPage: React.FC = () => {
  const { user, isVerifiedOfficer } = useAuth();
  const [application, setApplication] = useState<OfficerApplication | null>(null);
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [department, setDepartment] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    void getOfficerApplication(user.uid)
      .then((savedApplication) => {
        if (active) setApplication(savedApplication);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'Could not load your officer application.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.uid]);

  if (isVerifiedOfficer) return <Navigate to="/admin" replace />;
  if (!user) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-12">
        <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <h1 className="text-2xl font-extrabold text-slate-900">Apply for Officer Access</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Sign in to an existing CivicResolve account or create a citizen account before submitting an application.
            An application does not grant officer privileges; an administrator must review and provision access.
          </p>
          <Link
            to="/?continue=officer-application"
            className="mt-6 inline-block rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white"
          >
            Sign in or create an account to apply
          </Link>
        </section>
      </main>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !user.uid) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await submitOfficerApplication(user.uid, { fullName, phoneNumber, department, reason });
      setApplication(await getOfficerApplication(user.uid));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not submit your application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
            <Building2 className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Officer access</p>
            <h1 className="text-2xl font-extrabold text-slate-900">Officer application</h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Your account is not currently authorized for officer tools. Submit an application for review.
          Applying does not grant access; an administrator must review and provision officer access separately.
        </p>

        {error && (
          <div role="alert" className="mt-5 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <p role="status" className="mt-6 text-sm text-slate-600">Checking application status...</p>
        ) : application ? (
          <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              {application.status === 'approved'
                ? <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                : <Clock3 className="h-5 w-5 text-amber-700" />}
              Application {application.status}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {application.status === 'pending'
                ? 'Your application is awaiting administrator review. It does not grant officer access.'
                : application.status === 'approved'
                  ? 'Your application was approved. Officer access will be available after an administrator provisions your account.'
                  : 'Your application was not approved. Your account remains a citizen account; contact the system administrator for questions.'}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Submitted {new Date(application.createdAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                autoComplete="name"
                required
                minLength={2}
                maxLength={120}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </label>
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
              Contact phone
              <input
                type="tel"
                autoComplete="tel"
                required
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Municipal department
              <input
                required
                minLength={2}
                maxLength={120}
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Reason for requesting officer access
              <textarea
                required
                minLength={20}
                maxLength={2000}
                rows={4}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </label>
            <Button type="submit" variant="teal" isLoading={isSubmitting} className="w-full font-bold">
              Submit officer application
            </Button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-5 text-sm">
          <Link to="/dashboard" className="font-semibold text-teal-800 underline underline-offset-2">
            Continue to citizen dashboard
          </Link>
        </div>
      </section>
    </main>
  );
};
