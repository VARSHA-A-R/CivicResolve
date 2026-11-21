import { describe, it, expect, beforeEach } from 'vitest';
import { complaintService } from '../services/complaintService';

describe('complaintService local persistence & CRUD', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retrieves default seeded complaints when store is empty', async () => {
    const list = await complaintService.getAllComplaints();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toContain('CR-2025-');
  });

  it('creates a new complaint with generated ID and initial timeline events', async () => {
    const created = await complaintService.createComplaint({
      title: 'Water pipe leak on 5th main',
      description: 'Potable water leaking continuously from under pavement.',
      location: { address: '5th Main, Ward 12' },
      status: 'reported',
      priority: 'high',
      category: 'water',
      department: 'Water Supply & Sewerage',
      citizenName: 'Dev Sharma',
      citizenContact: '+91 98450 00000',
      aiAnalysis: {
        category: 'water',
        categoryLabel: 'Water Supply',
        priority: 'high',
        recommendedDepartment: 'Water Supply & Sewerage',
        urgencyScore: 8,
        summary: 'Water pipe leak requiring valve inspection',
        keyActionItems: ['Isolate pipe', 'Repair clamp'],
        estimatedResolutionTime: '24 hours',
        safetyHazard: false,
        confidenceScore: 0.9,
        source: 'civic-rule-engine-fallback',
      },
    });

    expect(created.id).toMatch(/^CR-2025-\d{4}$/);
    expect(created.timeline.length).toBeGreaterThanOrEqual(2);
    expect(created.timeline[0].status).toBe('reported');

    // Retrieve by ID
    const retrieved = await complaintService.getComplaintById(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Water pipe leak on 5th main');
  });

  it('updates complaint status and appends a timeline entry', async () => {
    const list = await complaintService.getAllComplaints();
    const target = list[0];

    const updated = await complaintService.updateComplaintStatus(
      target.id,
      'resolved',
      'Bitumen patching completed and verified by site engineer.',
      'Er. Verma'
    );

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('resolved');
    expect(updated?.resolvedAt).toBeDefined();

    const lastEvent = updated?.timeline[updated.timeline.length - 1];
    expect(lastEvent?.status).toBe('resolved');
    expect(lastEvent?.actor).toBe('Er. Verma');
  });
});
