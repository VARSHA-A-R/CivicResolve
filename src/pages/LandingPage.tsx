import React from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../context/ComplaintContext';
import {
  Sparkles,
  ArrowRight,
  Camera,
  Cpu,
  Clock,
  ShieldCheck,
  Building2,
  Lightbulb,
  Droplets,
  Trash2,
  Construction,
  Search,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const { stats } = useComplaints();

  const categories = [
    {
      icon: <Construction className="w-6 h-6 text-amber-600" />,
      title: 'Potholes & Broken Roads',
      description: 'Report road craters, broken pavers, and dangerous highway hazards.',
    },
    {
      icon: <Trash2 className="w-6 h-6 text-emerald-600" />,
      title: 'Garbage & Sanitation',
      description: 'Overflowing bins, illegal dumping spots, and biohazard clearances.',
    },
    {
      icon: <Lightbulb className="w-6 h-6 text-yellow-600" />,
      title: 'Defective Streetlights',
      description: 'Dark corridors, flickering bulbs, and hazardous exposed wires.',
    },
    {
      icon: <Droplets className="w-6 h-6 text-cyan-600" />,
      title: 'Water Leakage & Mains',
      description: 'Burst potable water mains, low pressure, and sewage contamination.',
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-navy-900 to-slate-950 text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Citizen reporting and complaint tracking</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Report local civic issues and follow their status,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200">
                  with AI-assisted triage.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Submit an issue with its location and details. AI classification can help organize reports;
                authorized municipal officers review complaints and provide status updates.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/report" className="w-full sm:w-auto">
                  <Button
                    variant="teal"
                    size="lg"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                    className="w-full sm:w-auto font-bold shadow-civic-glow"
                  >
                    Report an Issue Now
                  </Button>
                </Link>

                <Link to="/track" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    leftIcon={<Search className="w-4 h-4 text-slate-300" />}
                    className="w-full sm:w-auto"
                  >
                    Track Complaint Status
                  </Button>
                </Link>
              </div>

              {/* Trust markers */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Officer access is verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>Complaint status can be tracked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  <span>Officers make final decisions</span>
                </div>
              </div>
            </div>

            {/* Right Column: Report handling overview */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-6 shadow-2xl relative">
                <div className="space-y-4 text-left">
                  <div className="pb-3 border-b border-slate-700">
                    <div className="text-sm font-bold text-white">From report to review</div>
                    <p className="mt-1 text-xs text-slate-400">
                      Each submission is saved with a tracking ID after the report is accepted.
                    </p>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700 flex items-start gap-2.5">
                      <Camera className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-teal-300">Citizen report</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Add a description, location, and optional photograph.
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700 flex items-start gap-2.5">
                      <Cpu className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-blue-300">AI-supported classification</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Gemini classification or an offline heuristic may suggest a category and priority.
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700 flex items-start gap-2.5">
                      <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-emerald-300">Municipal review and updates</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Authorized officers make decisions and publish complaint status updates.
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="pt-1 text-[11px] leading-relaxed text-slate-400">
                    AI results are decision support only. No response time or resolution is guaranteed by this portal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Civic Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="bg-white rounded-2xl shadow-civic-hover border border-slate-200 p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Stat 1 */}
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {stats?.totalComplaints ?? 0}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Issues Handled
              </div>
            </div>

            {/* Stat 2 */}
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-teal-600 tracking-tight">
                {stats ? `${stats.resolutionRate}%` : '0%'}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Resolution Rate
              </div>
            </div>

            {/* Stat 3 */}
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {stats ? `${stats.avgResolutionDays} Days` : '—'}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Average Resolution Time
              </div>
            </div>

            {/* Stat 4 */}
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">
                100%
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Public Transparency
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider mb-3">
            Civic Process
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            How CivicResolve Works
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Submit a report, receive a tracking ID, and follow updates from municipal staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-civic-card text-center relative group hover:border-teal-500 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg border border-teal-100 group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Snap & Describe</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Describe the issue and provide a street address or use your device location.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-civic-card text-center relative group hover:border-teal-500 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg border border-teal-100 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">AI-Assisted Triage</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gemini or the offline heuristic can suggest a category and priority for officer review.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-civic-card text-center relative group hover:border-teal-500 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg border border-teal-100 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Officer Review</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Authorized municipal officers review reports and decide what action to take.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-civic-card text-center relative group hover:border-teal-500 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg border border-teal-100 group-hover:scale-110 transition-transform">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Track & Verify</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              View the current status and citizen-visible updates for a submitted complaint.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture and data handling */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Platform overview</span>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Built around authenticated reporting and human review
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              CivicResolve uses React and TypeScript in the browser, Firebase Authentication for accounts,
              Cloud Firestore for complaint records, and Firebase Storage when available for photographs.
              AI classification is optional decision support; officers retain responsibility for final actions.
            </p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <ShieldCheck className="h-5 w-5 text-teal-700" />
              <h3 className="mt-2 text-sm font-bold text-slate-900">Account access</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Firebase Authentication and server-side Firestore rules protect account and officer data.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <Cpu className="h-5 w-5 text-teal-700" />
              <h3 className="mt-2 text-sm font-bold text-slate-900">AI decision support</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Gemini assessment can fall back to the labeled offline heuristic when unavailable.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <Building2 className="h-5 w-5 text-teal-700" />
              <h3 className="mt-2 text-sm font-bold text-slate-900">Officer decisions</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Only accounts provisioned in the officer registry can access officer tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Handled */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Coverage Scope
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 text-white">
              Civic Infrastructure Domains
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              CivicResolve handles end-to-end routing across primary municipal divisions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 hover:border-teal-500/60 transition"
              >
                <div className="p-3 bg-slate-900 rounded-lg inline-block mb-3 border border-slate-800">
                  {cat.icon}
                </div>
                <h3 className="font-bold text-sm text-white mb-1">{cat.title}</h3>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">{cat.description}</p>
                <span className="inline-block text-[11px] font-medium text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                  Common report type
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white rounded-3xl p-10 sm:p-14 shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Notice a civic issue in your neighborhood?
          </h2>
          <p className="text-base text-teal-100 max-w-2xl mx-auto mb-8">
            Submit a civic issue report with its location and follow updates using its tracking ID.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/report">
              <Button
                variant="primary"
                size="lg"
                className="font-bold"
              >
                Report an Issue Now
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="font-bold"
              >
                Browse Citizen Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
