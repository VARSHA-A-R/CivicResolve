import { describe, it, expect, beforeEach } from 'vitest';
import { complaintService } from '../services/complaintService';

describe('complaintService local persistence & CRUD', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retrieves an empty list when the local store is empty', async () => {
    const list = await complaintService.getAllComplaints();
    expect(list).toEqual([]);
  });

  it('does not create a complaint without an authenticated Firebase user', async () => {
    await expect(complaintService.createComplaint({
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
        reason: 'Continuous pressurized potable water escape under sidewalk.',
        recommendedAction: 'Isolate distribution valve segment and install repair sleeve.',
        estimatedResolutionDays: 1,
        keyActionItems: ['Isolate pipe', 'Repair clamp'],
        estimatedResolutionTime: '1 day',
        safetyHazard: false,
        confidenceScore: 0.9,
        source: 'civic-rule-engine-fallback',
      },
    })).rejects.toThrow(/signed in to Firebase/);
  });

  it('rejects complaint status changes without verified officer authorization', async () => {
    await expect(
      complaintService.updateComplaintStatus(
        'CR-2026-TEST',
        'resolved',
        'Resolution note',
        '',
        false
      )
    ).rejects.toThrow(/only verified municipal officials/i);
  });

  it('returns an unsubscribe function for the complaint listener', () => {
    const unsubscribe = complaintService.subscribeToComplaints(() => {});

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});
