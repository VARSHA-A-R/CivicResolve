import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useComplaints } from '../context/ComplaintContext';
import { StatusTimeline } from '../components/complaints/StatusTimeline';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { Complaint } from '../types';
import {
  Search,
  MapPin,
  Calendar,
  Building,
  AlertCircle,
  Share2,
} from 'lucide-react';

export const ComplaintTrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getComplaintById, complaints } = useComplaints();

  const initialId = searchParams.get('id') || '';
  const [searchInput, setSearchInput] = useState(initialId);
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load complaint when query param or initial ID is available
  useEffect(() => {
    const queryId = searchParams.get('id');
    if (queryId) {
      setSearchInput(queryId);
      lookupComplaint(queryId);
    } else if (complaints.length > 0) {
      // Default to first complaint if no ID given so page is never empty
      setActiveComplaint(complaints[0]);
      setSearchInput(complaints[0].id);
    }
  }, [searchParams, complaints]);

  const lookupComplaint = async (id: string) => {
    if (!id.trim()) return;
    setIsSearching(true);
    setNotFound(false);
    try {
      const found = await getComplaintById(id);
      if (found) {
        setActiveComplaint(found);
        setNotFound(false);
      } else {
        setActiveComplaint(null);
        setNotFound(true);
      }
    } catch (err) {
      console.error('Lookup failed', err);
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearchParams({ id: searchInput.trim().toUpperCase() });
    lookupComplaint(searchInput.trim());
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
            My Civic Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Track Grievance Progression
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enter your complaint tracking ID to see its current status and citizen-visible progress updates.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Complaint ID (e.g. CR-2025-1042)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase tracking-wider"
              required
            />
          </div>
          <Button
            type="submit"
            variant="teal"
            size="md"
            isLoading={isSearching}
            className="font-bold sm:w-36"
          >
            Track Status
          </Button>
        </form>

      </div>

      {/* Not Found Alert */}
      {notFound && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="font-bold text-base">No Complaint Found for ID "{searchInput}"</h3>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            Please verify the complaint tracking number or file a new issue.
          </p>
          <div className="pt-2">
            <Link to="/report">
              <Button variant="teal" size="sm">
                Report a New Civic Issue
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Active Complaint Dossier */}
      {activeComplaint && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-civic-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-lg font-black text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                  {activeComplaint.id}
                </span>
                <StatusBadge status={activeComplaint.status} />
                <PriorityBadge priority={activeComplaint.priority} />
                <CategoryBadge category={activeComplaint.category} />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                  title="Copy permanent share link"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied Link!' : 'Share Dossier'}</span>
                </button>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {activeComplaint.title}
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {activeComplaint.description}
              </p>
            </div>

            {/* Location & Metadata Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Incident Location
                </span>
                <div className="font-medium text-slate-900 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{activeComplaint.location.address}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Assigned Authority
                </span>
                <div className="font-medium text-slate-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{activeComplaint.department}</span>
                </div>
                {activeComplaint.assignedOfficer && (
                  <div className="text-[11px] text-teal-700 font-medium mt-1">
                    Officer: {activeComplaint.assignedOfficer}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Registration Timestamp
                </span>
                <div className="font-medium text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{formatDate(activeComplaint.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Attached Photo Evidence */}
            {activeComplaint.imageUrl && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Photographic Evidence
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-80 bg-slate-100">
                  <img
                    src={activeComplaint.imageUrl}
                    alt={activeComplaint.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Complaint Status & Public Updates
              </h3>
            </div>
            <StatusTimeline
              currentStatus={activeComplaint.status}
              events={activeComplaint.timeline}
            />
          </div>
        </div>
      )}
    </div>
  );
};
