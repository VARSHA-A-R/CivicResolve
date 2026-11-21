import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../context/ComplaintContext';
import { useAuth } from '../context/AuthContext';
import { ComplaintCard } from '../components/complaints/ComplaintCard';
import { Button } from '../components/ui/Button';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  Search,
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { complaints, stats, loading } = useComplaints();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'reported' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter complaints based on tab and search
  const displayedComplaints = complaints.filter((c) => {
    if (activeTab !== 'all' && c.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchId = c.id.toLowerCase().includes(q);
      const matchLoc = c.location.address.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchId || matchLoc;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
              Citizen Portal
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Ward 142 — Indiranagar & Central
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.displayName || 'Citizen'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track your submitted civic issues and monitor municipal resolution progress in real time.
          </p>
        </div>

        {/* Quick Report CTA Button */}
        <div className="flex items-center gap-3">
          <Link to="/report">
            <Button
              variant="teal"
              size="md"
              leftIcon={<PlusCircle className="w-5 h-5" />}
              className="shadow-sm font-semibold"
            >
              Report New Issue
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Overview Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Filed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-civic-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Issues
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats?.totalComplaints || complaints.length}
            </span>
            <span className="text-xs text-slate-500">filed in area</span>
          </div>
        </div>

        {/* Reported / Under Review */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-civic-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {stats?.pendingCount ?? complaints.filter((c) => c.status === 'reported').length}
            </span>
            <span className="text-xs text-amber-700 font-medium">Awaiting dispatch</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-civic-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
              {stats?.inProgressCount ?? complaints.filter((c) => c.status === 'in_progress').length}
            </span>
            <span className="text-xs text-blue-700 font-medium">Crew deployed</span>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-civic-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resolved & Closed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats?.resolvedCount ?? complaints.filter((c) => c.status === 'resolved').length}
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              {stats ? `${stats.resolutionRate}% rate` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Action / Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Issues ({complaints.length})
          </button>
          <button
            onClick={() => setActiveTab('reported')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'reported'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending ({complaints.filter((c) => c.status === 'reported').length})
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'in_progress'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            In Progress ({complaints.filter((c) => c.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'resolved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Resolved ({complaints.filter((c) => c.status === 'resolved').length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, keyword, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Complaints Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm">Loading civic grievances...</p>
        </div>
      ) : displayedComplaints.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No complaints found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No complaints match the active filter or search query. Click below to file a new report.
          </p>
          <div className="mt-4">
            <Link to="/report">
              <Button variant="teal" size="sm">
                Report an Issue
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedComplaints.map((item) => (
            <ComplaintCard key={item.id} complaint={item} />
          ))}
        </div>
      )}
    </div>
  );
};
