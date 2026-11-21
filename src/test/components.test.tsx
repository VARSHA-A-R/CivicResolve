import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { StatusTimeline } from '../components/complaints/StatusTimeline';

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
});
