import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { StatusTimeline } from '../components/complaints/StatusTimeline';
import { ComplaintTable } from '../components/complaints/ComplaintTable';
import type { Complaint } from '../types';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isVerifiedOfficer: true,
    user: { displayName: 'Verified Officer', email: 'officer@example.com' },
  }),
}));

const officerComplaint: Complaint = {
  id: 'CR-2026-TEST',
  title: 'Blocked storm drain',
  description: 'The storm drain is blocked and water is pooling near the crossing.',
  location: {
    address: '12 Main Street',
    landmark: 'Near the public library',
    coordinates: { lat: 12.9, lng: 77.6 },
  },
  status: 'reported',
  priority: 'high',
  category: 'drainage',
  department: 'Water Supply & Sewerage',
  citizenName: 'Test Citizen',
  citizenContact: '9000000000',
  createdAt: '2026-11-20T08:30:00.000Z',
  updatedAt: '2026-11-20T08:30:00.000Z',
  aiAnalysis: {
    category: 'drainage',
    categoryLabel: 'Storm Drainage & Sewage',
    priority: 'high',
    recommendedDepartment: 'Water Supply & Sewerage',
    urgencyScore: 8,
    summary: 'The report describes standing water caused by a blocked drain.',
    reason: 'Standing water may create a pedestrian hazard.',
    recommendedAction: 'Inspect the drain and remove the obstruction.',
    estimatedResolutionDays: 2,
    keyActionItems: ['Inspect drain', 'Clear obstruction'],
    estimatedResolutionTime: '2 days',
    safetyHazard: true,
    confidenceScore: 0.9,
    source: 'civic-rule-engine-fallback',
  },
  timeline: [
    {
      id: 'event-1',
      status: 'reported',
      statusLabel: 'Complaint Lodged',
      timestamp: '2026-11-20T08:30:00.000Z',
      actor: 'Test Citizen',
      actorRole: 'citizen',
      note: 'Complaint filed through CivicResolve portal.',
    },
  ],
};

describe('UI Components', () => {
  it('renders status badges correctly', () => {
    const { rerender } = render(<StatusBadge status="reported" />);
    expect(screen.getByText('Reported')).toBeInTheDocument();

    rerender(<StatusBadge status="in_progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();

    rerender(<StatusBadge status="resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('renders priority badges with critical alert', () => {
    render(<PriorityBadge priority="critical" />);
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('renders status timeline milestones and notes', () => {
    render(
      <StatusTimeline
        currentStatus="in_progress"
        events={[
          {
            id: '1',
            status: 'reported',
            statusLabel: 'Complaint Filed',
            timestamp: '2025-05-18T08:30:00.000Z',
            actor: 'Citizen User',
            actorRole: 'citizen',
            note: 'Initial report filed with photo evidence.',
          },
        ]}
      />
    );

    expect(screen.getByText('Lifecycle Progression')).toBeInTheDocument();
    expect(screen.getByText('Initial report filed with photo evidence.')).toBeInTheDocument();
    expect(screen.getByText('Citizen User')).toBeInTheDocument();
  });

  it('shows saved assessment details and submits public and private officer notes separately', async () => {
    const user = userEvent.setup();
    const onUpdateStatus = vi.fn().mockResolvedValue(undefined);
    render(<ComplaintTable complaints={[officerComplaint]} onUpdateStatus={onUpdateStatus} />);

    await user.click(screen.getByRole('button', { name: 'Manage' }));
    expect(screen.getByText('CR-2026-TEST')).toBeInTheDocument();
    expect(screen.getAllByText('12 Main Street')).toHaveLength(2);
    expect(screen.getByText('9000000000')).toBeInTheDocument();
    expect(screen.getByText('Offline Heuristic Engine')).toBeInTheDocument();
    expect(screen.getByText('8 / 10')).toBeInTheDocument();
    expect(screen.getByText('Inspect the drain and remove the obstruction.')).toBeInTheDocument();
    expect(screen.getByText(/decision support only/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Update Complaint Status'), 'resolved');
    await user.type(
      screen.getByLabelText('Citizen-visible status update'),
      'Drain cleared and water flow restored.'
    );
    await user.type(
      screen.getByLabelText(/Private officer note/),
      'Crew reference 42.'
    );
    await user.click(screen.getByRole('button', { name: 'Commit Status Update' }));

    await waitFor(() => {
      expect(onUpdateStatus).toHaveBeenCalledWith(
        'CR-2026-TEST',
        'resolved',
        'Drain cleared and water flow restored.',
        'Crew reference 42.'
      );
    });
  });
});
