import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, LockKeyhole, Shield, UserRound, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { getOfficerApplication } from '../services/officerApplicationService';

type Portal = 'citizen' | 'officer';

export const LoginPage: React.FC = () => {
  const {
    user,
    role,
    isVerifiedOfficer,
    loading,
    signIn,
    signInOfficer,
    signUp,
    isFirebaseActive,
    authError,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const continueToApplication = searchParams.get('continue') === 'officer-application';
  const [portal, setPortal] = useState<Portal | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const actionInProgress = useRef(false);

  useEffect(() => {
    if (loading || !user || actionInProgress.current || error) return;
    if (isVerifiedOfficer && role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (user.profileComplete === false) {
      navigate(continueToApplication
        ? '/complete-profile?continue=officer-application'
        : '/complete-profile', { replace: true });
    } else {
      navigate(continueToApplication ? '/officer-application' : '/dashboard', { replace: true });
    }
  }, [loading, user, isVerifiedOfficer, role, error, continueToApplication, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!portal || actionInProgress.current) return;

    actionInProgress.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const profile = isRegistering
        ? await signUp(email.trim(), password, displayName.trim(), phoneNumber)
        : portal === 'officer'
          ? await signInOfficer(email.trim(), password)
          : await signIn(email.trim(), password);

      if (portal === 'citizen' && profile.profileComplete === false) {
        navigate(continueToApplication
          ? '/complete-profile?continue=officer-application'
          : '/complete-profile', { replace: true });
        return;
      }

      if (portal === 'officer' && !profile.isVerifiedOfficer) {
        const application = await getOfficerApplication(profile.uid);
        if (application) {
          navigate('/officer-application', { replace: true });
        } else {
          setError('This account is not authorized for the Officer Portal and has no officer application. Contact your system administrator.');
        }
        return;
      }

      if (portal === 'citizen' && continueToApplication) {
        navigate('/officer-application', { replace: true });
        return;
      }

      navigate(profile.isVerifiedOfficer && profile.role === 'admin' ? '/admin' : '/dashboard', {
        replace: true,
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to sign in. Please try again.';
      setError(message.replace(/^Firebase:\s*/i, ''));
    } finally {
      actionInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <p role="status">Checking your sign-in...</p>
      </main>
    );
  }

  if (user && !actionInProgress.current && !error) {
    return <Navigate to={isVerifiedOfficer && role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700 bg-white text-slate-900 shadow-2xl">
        <div className="grid md:grid-cols-2">
          <div className="bg-gradient-to-br from-slate-900 to-teal-950 p-8 sm:p-10 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-teal-400/15 text-teal-300 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </span>
                <span className="text-xl font-extrabold">Civic<span className="text-teal-300">Resolve</span></span>
              </div>
              <h1 className="mt-12 text-3xl font-extrabold leading-tight">Your civic portal</h1>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Sign in to report and track local issues, or manage complaints as an authorized municipal officer.
              </p>
            </div>
            <p className="mt-12 text-xs text-slate-400">
              Access is based on your authenticated account and verified portal permissions.
            </p>
          </div>

          <div className="p-7 sm:p-10">
            {portal === null ? (
              <>
                <h2 className="text-xl font-bold">Choose your portal</h2>
                <p className="mt-1 text-sm text-slate-500">Select the account type you want to use.</p>
                <div className="mt-7 space-y-3">
                  <button
                    type="button"
                    onClick={() => { setPortal('citizen'); setError(null); }}
                    className="w-full flex items-center gap-4 rounded-xl border border-slate-200 p-4 text-left hover:border-teal-500 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    <span className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                      <UserRound className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block font-bold">Citizen Login</span>
                      <span className="block text-xs text-slate-500 mt-0.5">Report and track civic issues</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPortal('officer'); setError(null); setIsRegistering(false); }}
                    className="w-full flex items-center gap-4 rounded-xl border border-slate-200 p-4 text-left hover:border-teal-500 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    <span className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block font-bold">Officer Login</span>
                      <span className="block text-xs text-slate-500 mt-0.5">For authorized municipal staff only</span>
                    </span>
                  </button>
                </div>
                {!isFirebaseActive && (
                  <p className="mt-5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Firebase Authentication is not configured. Sign-in is unavailable until Firebase credentials are added.
                  </p>
                )}
                {authError && (
                  <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    {authError}
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setPortal(null); setIsRegistering(false); setError(null); }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  <ArrowLeft className="w-4 h-4" /> Change portal
                </button>
                <h2 className="mt-5 text-xl font-bold">
                  {portal === 'officer' ? 'Officer Login' : isRegistering ? 'Create citizen account' : 'Citizen Login'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {portal === 'officer'
                    ? 'Use your existing authorized Firebase account.'
                    : 'Sign in to your account or create a new citizen account.'}
                </p>

                {error && (
                  <div role="alert" className="mt-5 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {!error && authError && (
                  <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {isRegistering && portal === 'citizen' && (
                    <label className="block text-sm font-medium text-slate-700">
                      Full name
                      <input
                        type="text"
                        autoComplete="name"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                        required
                      />
                    </label>
                  )}
                  {isRegistering && portal === 'citizen' && (
                    <label className="block text-sm font-medium text-slate-700">
                      Mobile number
                      <input
                        type="tel"
                        autoComplete="tel"
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                        required
                      />
                    </label>
                  )}
                  <label className="block text-sm font-medium text-slate-700">
                    Email address
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                    <span className="relative mt-1 block">
                      <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        autoComplete={isRegistering ? 'new-password' : 'current-password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                        minLength={6}
                        required
                      />
                    </span>
                  </label>
                  <Button type="submit" variant="teal" isLoading={isSubmitting} className="w-full font-bold">
                    {isRegistering ? 'Create Account' : portal === 'officer' ? 'Officer Sign In' : 'Sign In'}
                  </Button>
                </form>

                {portal === 'officer' && (
                  <p className="mt-5 text-center text-sm text-slate-600">
                    Need officer access?{' '}
                    <Link
                      to="/officer-application"
                      className="font-semibold text-teal-800 underline underline-offset-2"
                    >
                      Apply for Officer Access / Create Officer Application
                    </Link>
                  </p>
                )}

                {portal === 'citizen' && (
                  <p className="mt-5 text-center text-sm text-slate-600">
                    {isRegistering ? 'Already registered?' : 'New to CivicResolve?'}{' '}
                    <button
                      type="button"
                      onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                      className="font-semibold text-teal-800 underline underline-offset-2"
                    >
                      {isRegistering ? 'Sign in' : 'Create a citizen account'}
                    </button>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};
