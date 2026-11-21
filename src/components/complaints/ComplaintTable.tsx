import React, { useState } from 'react';
import type { Complaint, ComplaintStatus } from '../../types';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { AIAnalysisCard } from './AIAnalysisCard';
import { StatusTimeline } from './StatusTimeline';
import {
  MapPin,
  User,
  Phone,
  FileCheck2,
} from 'lucide-react';

interface ComplaintTableProps {
  complaints: Complaint[];
  onUpdateStatus: (id: string, status: ComplaintStatus, note: string, actor: string) => Promise<void>;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({ complaints, onUpdateStatus }) => {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ComplaintStatus>('in_progress');
  const [officialNote, setOfficialNote] = useState('');
  const [officerName, setOfficerName] = useState('Er. Rajesh Kumar (Municipal Engineer)');

  const handleOpenDetail = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setTargetStatus(complaint.status === 'reported' ? 'in_progress' : 'resolved');
    setOfficialNote('');
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(
        selectedComplaint.id,
        targetStatus,
        officialNote || `Status updated to ${targetStatus} by municipal engineering desk.`,
        officerName
      );
      // Close modal
      setSelectedComplaint(null);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Complaint ID
              </th>
              <th scope="col" className="px-5 py-3.5">
                Issue & Location
              </th>
              <th scope="col" className="px-5 py-3.5">
                Category
              </th>
              <th scope="col" className="px-5 py-3.5">
                Priority
              </th>
              <th scope="col" className="px-5 py-3.5">
                Department
              </th>
              <th scope="col" className="px-5 py-3.5">
                Status
              </th>
              <th scope="col" className="px-5 py-3.5">
                Reported
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  No civic issues match the active filter criteria.
                </td>
              </tr>
            ) : (
              complaints.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  onClick={() => handleOpenDetail(item)}
                >
                  {/* ID */}
                  <td className="px-5 py-4 font-mono font-bold text-teal-700 text-xs whitespace-nowrap">
                    {item.id}
                  </td>

                  {/* Title & Location */}
                  <td className="px-5 py-4 max-w-xs">
                    <div className="font-semibold text-slate-900 line-clamp-1 group-hover:text-teal-700 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="truncate">{item.location.address}</span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <CategoryBadge category={item.category} />
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <PriorityBadge priority={item.priority} size="sm" />
                  </td>

                  {/* Department */}
                  <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-700 font-medium">
                    {item.department}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusBadge status={item.status} size="sm" />
                  </td>

                  {/* Reported Date */}
                  <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                    {formatDate(item.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(item);
                      }}
                      className="text-xs"
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Comprehensive Complaint Management Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={Boolean(selectedComplaint)}
          onClose={() => setSelectedComplaint(null)}
          title={`Civic Dossier — ${selectedComplaint.id}`}
          subtitle={`Reported by ${selectedComplaint.citizenName} on ${formatDate(
            selectedComplaint.createdAt
          )}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Top Overview & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedComplaint.status} />
                <PriorityBadge priority={selectedComplaint.priority} />
                <CategoryBadge category={selectedComplaint.category} />
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Assigned SLA: {selectedComplaint.aiAnalysis.estimatedResolutionTime}
              </span>
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{selectedComplaint.title}</h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Image Preview if available */}
            {selectedComplaint.imageUrl && (
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Photographic Evidence Attached by Citizen
                </span>
                <div className="rounded-lg overflow-hidden border border-slate-200 max-h-64 bg-slate-100">
                  <img
                    src={selectedComplaint.imageUrl}
                    alt="Citizen evidence"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Location & Citizen Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Location Coordinates
                </span>
                <p className="font-medium text-slate-900 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedComplaint.location.address}</span>
                </p>
                {selectedComplaint.location.landmark && (
                  <p className="text-slate-500 pl-5">
                    Landmark: {selectedComplaint.location.landmark}
                  </p>
                )}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Citizen Contact
                </span>
                <p className="font-medium text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{selectedComplaint.citizenName}</span>
                </p>
                <p className="text-slate-600 flex items-center gap-1.5 pl-5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedComplaint.citizenContact}</span>
                </p>
              </div>
            </div>

            {/* AI Classification & Urgency Assessment */}
            <AIAnalysisCard analysis={selectedComplaint.aiAnalysis} />

            {/* Lifecycle Progression Timeline */}
            <StatusTimeline
              currentStatus={selectedComplaint.status}
              events={selectedComplaint.timeline}
            />

            {/* Official Status Update Controls Form */}
            <form onSubmit={handleStatusSubmit} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <FileCheck2 className="w-5 h-5 text-teal-700" />
                <h4 className="font-bold text-sm text-slate-900">
                  Municipal Official Action & Status Update
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Update Complaint Status
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as ComplaintStatus)}
                    className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="reported">Reported (Under Review)</option>
                    <option value="in_progress">In Progress (Field Crew Assigned)</option>
                    <option value="resolved">Resolved (Work Completed)</option>
                    <option value="rejected">Rejected (Out of Municipal Scope)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Acting Official / Engineer Name
                  </label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Verification & Progress Notes (Visible on Public Tracker)
                </label>
                <textarea
                  rows={2}
                  value={officialNote}
                  onChange={(e) => setOfficialNote(e.target.value)}
                  placeholder="e.g. Dispatched asphalt patching vehicle with crew #4. Material compaction completed."
                  className="w-full text-sm rounded-lg border border-slate-300 bg-white p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedComplaint(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="teal"
                  isLoading={isUpdating}
                  leftIcon={<FileCheck2 className="w-4 h-4" />}
                >
                  Commit Status Update
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
