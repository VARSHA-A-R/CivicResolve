import React from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../context/ComplaintContext';
import {
  Sparkles,
  ArrowRight,
  Camera,
  Cpu,
  Truck,
  CheckCircle2,
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
      sla: 'SLA: 24h - 48h',
    },
    {
      icon: <Trash2 className="w-6 h-6 text-emerald-600" />,
      title: 'Garbage & Sanitation',
      description: 'Overflowing bins, illegal dumping spots, and biohazard clearances.',
      sla: 'SLA: 12h - 24h',
    },
    {
      icon: <Lightbulb className="w-6 h-6 text-yellow-600" />,
      title: 'Defective Streetlights',
      description: 'Dark corridors, flickering bulbs, and hazardous exposed wires.',
      sla: 'SLA: 24h - 72h',
    },
    {
      icon: <Droplets className="w-6 h-6 text-cyan-600" />,
      title: 'Water Leakage & Mains',
      description: 'Burst potable water mains, low pressure, and sewage contamination.',
      sla: 'SLA: 6h - 24h',
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
                <span>Google Gemini AI Municipal Intelligence</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Fixing our city's civic issues,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200">
                  powered by Gemini AI.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Report potholes, overflowing garbage, and broken streetlights in seconds.
                Our multimodal Gemini AI classifies the issue, evaluates public hazard severity,
                and routes work orders directly to responsible municipal engineers.
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
                    className="w-full sm:w-auto bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700/80"
                  >
                    Track Complaint Status
                  </Button>
                </Link>
              </div>

              {/* Trust markers */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Verified Municipal Authority</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>Real-time Public Audit Trail</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  <span>Zero Bureaucracy Bottleneck</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive AI Simulation Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-6 shadow-2xl relative">
                {/* Floating pill */}
                <div className="absolute -top-3 right-6 bg-teal-500 text-slate-950 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  Live AI Workflow
                </div>

                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-mono">CR-2025-1042</div>
                      <div className="text-sm font-bold text-white">Main St. Road Cavitation</div>
                    </div>
                  </div>

                  {/* AI Triage Steps */}
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700 flex items-start gap-2.5">
                      <Cpu className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-teal-300">Google Gemini Multimodal Analysis</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Identified 45cm deep pothole on high-transit road. Priority elevated to Critical.
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700 flex items-start gap-2.5">
                      <Truck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-blue-300">Auto-Dispatched Work Order</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Assigned to Roads & Infrastructure Division, Ward #14. SLA: 24h.
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-emerald-300">Transparent Resolution Verification</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Field engineer posts geo-tagged photographic evidence upon completion.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/track?id=CR-2025-1042"
                      className="block text-center text-xs font-semibold text-teal-400 hover:text-teal-300 transition py-1.5 bg-slate-900 rounded-lg border border-slate-700"
                    >
                      View Live Dossier for CR-2025-1042 →
                    </Link>
                  </div>
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
                {stats?.totalComplaints ? stats.totalComplaints + 12450 : '12,450+'}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Issues Handled
              </div>
            </div>

            {/* Stat 2 */}
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-teal-600 tracking-tight">
                {stats?.resolutionRate ? `${stats.resolutionRate}%` : '94.2%'}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Resolution Rate
              </div>
            </div>

            {/* Stat 3 */}
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {stats?.avgResolutionDays ? `${stats.avgResolutionDays} Days` : '2.4 Days'}
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
            From citizen camera snapshot to city municipal dispatch in under 60 seconds.
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
              Take a quick photo of the civic issue or write a brief 1-sentence note. Add your location or use auto-GPS.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-civic-card text-center relative group hover:border-teal-500 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg border border-teal-100 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Gemini AI Triage</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Google Gemini evaluates safety hazards, categorizes the grievance, and assigns urgency ratings from 1 to 10.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-civic-card text-center relative group hover:border-teal-500 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg border border-teal-100 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Auto Ward Dispatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The ticket is dispatched immediately to the designated municipal department with actionable instructions.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-civic-card text-center relative group hover:border-teal-500 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg border border-teal-100 group-hover:scale-110 transition-transform">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Track & Verify</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Citizens track live status from Reported → In Progress → Resolved with verified before/after photographic proof.
            </p>
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
                <span className="inline-block text-[11px] font-mono font-medium text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                  {cat.sla}
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
            Don't wait for potholes to cause accidents or garbage to spread disease. File a verified report in 60 seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/report">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-slate-900 hover:bg-slate-100 font-bold"
              >
                Report an Issue Now
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="bg-teal-800/60 border-teal-500 text-white hover:bg-teal-800"
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
