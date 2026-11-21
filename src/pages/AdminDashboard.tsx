import React from 'react';
import { useComplaints } from '../context/ComplaintContext';
import { ComplaintTable } from '../components/complaints/ComplaintTable';
import { Button } from '../components/ui/Button';
import {
  CheckCircle2,
  Clock,
  Layers,
  Filter,
  RefreshCw,
  Search,
  Download,
  AlertTriangle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    filteredComplaints,
    complaints,
    stats,
    loading,
    complaintError,
    filter,
    setFilter,
    resetFilter,
    refreshComplaints,
    updateComplaintStatus,
  } = useComplaints();

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Title',
      'Category',
      'Priority',
      'Department',
      'Status',
      'Address',
      'UrgencyScore',
      'CreatedAt',
    ];
    const rows = filteredComplaints.map((c) => [
      c.id,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.priority,
      `"${c.department}"`,
      c.status,
      `"${c.location.address.replace(/"/g, '""')}"`,
      c.aiAnalysis?.urgencyScore ?? '',
      c.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CivicResolve_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Officer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
              Municipal Operations Desk
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Complaint Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Officer Complaint Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review citizen-submitted complaints, inspect saved AI assessments, and publish status updates.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshComplaints}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Feed
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Backlog */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-civic-card">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tickets</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.totalComplaints ?? complaints.length}
            </span>
            <span className="text-xs text-slate-500">all wards</span>
          </div>
        </div>

        {/* Critical & High Priority */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-civic-card">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider">Critical Priority</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">
              {complaints.filter((c) => c.priority === 'critical' && c.status !== 'resolved').length}
            </span>
            <span className="text-xs text-rose-700 font-medium">Require &lt;24h action</span>
          </div>
        </div>

        {/* In Progress Field Deployments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-civic-card">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold uppercase tracking-wider">Active Crews</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600">
              {complaints.filter((c) => c.status === 'in_progress').length}
            </span>
            <span className="text-xs text-blue-700 font-medium">Under repair</span>
          </div>
        </div>

        {/* Resolved complaints */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-civic-card">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">
              {stats?.resolvedCount ?? complaints.filter((c) => c.status === 'resolved').length}
            </span>
            <span className="text-xs text-emerald-700 font-medium">resolved complaints</span>
          </div>
        </div>
      </div>

      {/* Filters Bar: Category, Priority, Status, Search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Filter Complaints ({filteredComplaints.length} matching)
            </h3>
          </div>
          {(filter.category !== 'all' ||
            filter.priority !== 'all' ||
            filter.status !== 'all' ||
            filter.search) && (
            <button
              onClick={resetFilter}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Filter complaints by status">
          {[
            { value: 'all', label: 'All Complaints', count: complaints.length },
            { value: 'reported', label: 'Pending Review', count: complaints.filter((c) => c.status === 'reported').length },
            { value: 'in_progress', label: 'In Progress', count: complaints.filter((c) => c.status === 'in_progress').length },
            { value: 'resolved', label: 'Resolved', count: complaints.filter((c) => c.status === 'resolved').length },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter((prev) => ({ ...prev, status: item.value }))}
              aria-pressed={filter.status === item.value}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                filter.status === item.value
                  ? 'bg-teal-700 text-white'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search keyword, ID, location..."
              value={filter.search}
              onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filter.category}
              onChange={(e) => setFilter((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Infrastructure Domains</option>
              <option value="roads">Roads & Pavement</option>
              <option value="garbage">Solid Waste & Sanitation</option>
              <option value="streetlights">Street Lighting</option>
              <option value="water">Water Supply & Pipelines</option>
              <option value="drainage">Drainage & Stormwater</option>
              <option value="encroachment">Encroachment</option>
              <option value="other">General Municipal</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filter.priority}
              onChange={(e) => setFilter((prev) => ({ ...prev, priority: e.target.value }))}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical Priority Only</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filter.status}
              onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Lifecycles</option>
              <option value="reported">Reported (Pending)</option>
              <option value="in_progress">In Progress (Field Deployed)</option>
              <option value="resolved">Resolved & Closed</option>
              <option value="rejected">Rejected / Ineligible</option>
            </select>
          </div>
        </div>
      </div>

      {complaintError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Could not load the live officer complaint feed: {complaintError}
        </div>
      )}
      {loading ? (
        <div role="status" className="py-12 text-center text-sm text-slate-500">
          Loading complaints from Firestore...
        </div>
      ) : (
        <ComplaintTable
          complaints={filteredComplaints}
          onUpdateStatus={updateComplaintStatus}
        />
      )}
    </div>
  );
};
