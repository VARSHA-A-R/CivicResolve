import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { isFirebaseConfigured } from '../../services/firebase';
import { isGeminiConfigured } from '../../services/geminiService';
import { Sparkles, Database, X } from 'lucide-react';

export const Layout: React.FC = () => {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const firebaseLive = isFirebaseConfigured();
  const geminiLive = isGeminiConfigured();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      {/* Cloud Integration Status Pill / Notification */}
      {!bannerDismissed && (
        <div className="bg-slate-900 text-slate-300 text-xs px-4 py-2 border-b border-slate-800 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                System Status:
              </span>

              {/* Gemini Status */}
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  Gemini AI:{' '}
                  {geminiLive ? (
                    <span className="text-teal-400 font-medium">Live Google GenAI Connected</span>
                  ) : (
                    <span className="text-amber-300 font-medium">
                      Intelligent Heuristic Fallback Active (Provide VITE_GEMINI_API_KEY in .env for live)
                    </span>
                  )}
                </span>
              </div>

              {/* Firebase Status */}
              <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-700">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Firebase:{' '}
                  {firebaseLive ? (
                    <span className="text-emerald-400 font-medium">Cloud Firestore Connected</span>
                  ) : (
                    <span className="text-slate-400 font-medium">
                      Local Offline Store Active (Provide VITE_FIREBASE_* in .env for live)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={() => setBannerDismissed(true)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
