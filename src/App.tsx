import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ComplaintProvider } from './context/ComplaintContext';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { ComplaintTrackingPage } from './pages/ComplaintTrackingPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { OfficerApplicationPage } from './pages/OfficerApplicationPage';
import { CompleteCitizenProfilePage } from './pages/CompleteCitizenProfilePage';
import { getOfficerApplication } from './services/officerApplicationService';

type OfficerRouteState = 'checking' | 'application' | 'denied' | 'error';

const RouteLoading: React.FC = () => (
  <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
    <p role="status">Checking your sign-in...</p>
  </main>
);

const AuthenticatedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoading />;
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
};

const CitizenRoute: React.FC = () => {
  const { user, loading, isVerifiedOfficer } = useAuth();
  if (loading) return <RouteLoading />;
  if (!user) return <Navigate to="/" replace />;
  if (isVerifiedOfficer) return <Navigate to="/admin" replace />;
  if (user.profileComplete === false) return <Navigate to="/complete-profile" replace />;
  return <Outlet />;
};

const OfficerRoute: React.FC = () => {
  const { user, loading, isVerifiedOfficer, role, verifyOfficerAccess } = useAuth();
  const [routeState, setRouteState] = useState<OfficerRouteState>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || (isVerifiedOfficer && role === 'admin')) return;
    let active = true;
    setRouteState('checking');
    setErrorMessage(null);
    void (async () => {
      try {
        const authorized = await verifyOfficerAccess();
        if (!active) return;
        if (authorized) {
          setRouteState('checking');
          return;
        }
        const application = await getOfficerApplication(user.uid);
        if (active) setRouteState(application ? 'application' : 'denied');
      } catch (error) {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : 'Officer access could not be verified.');
        setRouteState('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [loading, user?.uid, isVerifiedOfficer, role, verifyOfficerAccess]);

  if (loading) return <RouteLoading />;
  if (!user) return <Navigate to="/" replace />;
  if (isVerifiedOfficer && role === 'admin') return <Outlet />;
  if (routeState === 'checking') return <RouteLoading />;
  if (routeState === 'application') return <Navigate to="/officer-application" replace />;
  if (routeState === 'denied') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p role="alert" className="text-sm text-slate-700">
          This account is not authorized for the Officer Portal and has no officer application.
        </p>
        <Link to="/dashboard" className="font-semibold text-teal-800 underline">Return to Citizen Dashboard</Link>
      </main>
    );
  }
  if (routeState === 'error') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p role="alert" className="max-w-xl text-sm text-rose-800">{errorMessage}</p>
        <Link to="/dashboard" className="font-semibold text-teal-800 underline">Return to Citizen Dashboard</Link>
      </main>
    );
  }
  return <Outlet />;
};

export const App: React.FC = () => (
  <AuthProvider>
    <ComplaintProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/officer-application" element={<OfficerApplicationPage />} />

          <Route element={<AuthenticatedRoute />}>
            <Route path="/complete-profile" element={<CompleteCitizenProfilePage />} />
          </Route>

          <Route element={<AuthenticatedRoute />}>
            <Route element={<Layout />}>
              <Route path="/home" element={<LandingPage />} />
            </Route>
          </Route>

          <Route element={<CitizenRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<CitizenDashboard />} />
              <Route path="/report" element={<ReportIssuePage />} />
              <Route path="/track" element={<ComplaintTrackingPage />} />
            </Route>
          </Route>

          <Route element={<OfficerRoute />}>
            <Route element={<Layout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/officer" element={<AdminDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ComplaintProvider>
  </AuthProvider>
);

export default App;
