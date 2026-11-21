import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  PlusCircle,
  Menu,
  X,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { role, user, isVerifiedOfficer, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = isVerifiedOfficer ? [
    { name: 'Home', path: '/home' },
    { name: 'Officer Dashboard', path: '/admin' },
    { name: 'Complaints', path: '/admin' },
  ] : [
    { name: 'Home', path: '/home' },
    { name: 'Citizen Dashboard', path: '/dashboard' },
    { name: 'Report Issue', path: '/report' },
    { name: 'Track Issue', path: '/track' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-8">
              <Link to="/home" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-teal-400 shadow-sm group-hover:bg-slate-800 transition">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xl tracking-tight text-slate-900">
                      Civic<span className="text-teal-600">Resolve</span>
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      <Sparkles className="w-2.5 h-2.5" /> AI
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest -mt-0.5">
                    Municipal Intelligence
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Action Bar */}
            <div className="hidden md:flex items-center gap-3">
              {/* Account Sign In / Profile Button */}
              {user ? (
                <button
                  onClick={() => void handleLogout()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5 text-teal-600" />
                  <span className="truncate max-w-[100px]">{user.displayName} · Logout</span>
                </button>
              ) : null}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {user?.displayName} ({role === 'admin' ? 'Officer' : 'Citizen'})
              </span>
              <button onClick={() => void handleLogout()} className="text-xs font-semibold text-teal-700 underline">
                Logout
              </button>
            </div>

            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive(link.path)
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {!isVerifiedOfficer && <div className="pt-2">
              <Link
                to="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-teal-600 text-white font-medium text-sm shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report New Civic Issue</span>
              </Link>
            </div>}
          </div>
        )}
      </header>

    </>
  );
};
