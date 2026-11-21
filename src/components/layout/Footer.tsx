import React from 'react';
import { Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Footer: React.FC = () => {
  const { isVerifiedOfficer } = useAuth();
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-xl text-white">
                Civic<span className="text-teal-400">Resolve</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed">
              Empowering citizens and municipal administrations with multimodal Google Gemini AI to rapidly triage,
              dispatch, and resolve civic infrastructure issues with complete transparency.
            </p>
            <p className="text-xs text-slate-400">Submit reports, track updates, and support accountable civic response.</p>
          </div>

          {/* Civic Portals */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/report" className="hover:text-teal-400 transition-colors">
                  Report Civic Issue
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-teal-400 transition-colors">
                  Track Complaint Status
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-teal-400 transition-colors">
                  Citizen Dashboard
                </Link>
              </li>
              {isVerifiedOfficer && (
                <li>
                  <Link to="/admin" className="hover:text-teal-400 transition-colors">
                    Municipal Officer Portal
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CivicResolve. Built for public good and municipal accountability.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for Google Hackathon
          </p>
        </div>
      </div>
    </footer>
  );
};
