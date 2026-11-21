import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readComplaintImageAsDataUrl, validateComplaintImage } from '../services/storageService';
import { complaintService } from '../services/complaintService';
import { normalizePhoneNumber, verifyOfficerInFirestore } from '../services/authService';
import type { ComplaintSubmission } from '../types';

describe('Security & Authorization Validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Image Upload Validation', () => {
    it('normalizes phone numbers for profile persistence', () => {
      expect(normalizePhoneNumber('+91 (90000) 00000')).toBe('+919000000000');
    });

    it('accepts valid JPEG, PNG, and WebP images within 5MB limit', () => {
      const validJpg = new File(['fake-jpg-content'], 'evidence.jpg', { type: 'image/jpeg' });
      const validPng = new File(['fake-png-content'], 'evidence.png', { type: 'image/png' });
      const validWebp = new File(['fake-webp-content'], 'evidence.webp', { type: 'image/webp' });

      expect(validateComplaintImage(validJpg).valid).toBe(true);
      expect(validateComplaintImage(validPng).valid).toBe(true);
      expect(validateComplaintImage(validWebp).valid).toBe(true);
    });

    it('rejects forbidden file types (e.g. PDF, executable, scripts)', () => {
      const invalidPdf = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
      const invalidExe = new File(['binary'], 'script.exe', { type: 'application/x-msdownload' });
      const invalidHtml = new File(['<html></html>'], 'page.html', { type: 'text/html' });

      const resPdf = validateComplaintImage(invalidPdf);
      expect(resPdf.valid).toBe(false);
      expect(resPdf.error).toMatch(/only jpeg, png, and webp/i);

      const resExe = validateComplaintImage(invalidExe);
      expect(resExe.valid).toBe(false);

      const resHtml = validateComplaintImage(invalidHtml);
      expect(resHtml.valid).toBe(false);
    });

    it('rejects image files exceeding 5MB size limit', () => {
      // 6 MB dummy array
      const bigBuffer = new Uint8Array(6 * 1024 * 1024);
      const oversizedFile = new File([bigBuffer], 'giant_photo.jpg', { type: 'image/jpeg' });

      const result = validateComplaintImage(oversizedFile);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/exceeds the 5mb maximum limit/i);
    });

    it('rejects photo preparation when FileReader does not complete in time', async () => {
      class StalledFileReader extends FileReader {
        override readAsDataURL(): void {}
        override abort(): void {}
      }
      const readerSpy = vi.spyOn(globalThis, 'FileReader').mockImplementation(
        () => new StalledFileReader()
      );
      vi.useFakeTimers();
      try {
        const failure = expect(
          readComplaintImageAsDataUrl(new File(['image'], 'photo.jpg', { type: 'image/jpeg' }))
        ).rejects.toThrow(/timed out/i);
        await vi.advanceTimersByTimeAsync(10_000);
        await failure;
      } finally {
        vi.useRealTimers();
        readerSpy.mockRestore();
      }
    });
  });

  describe('Officer Authorization & Protection', () => {
    it('fails closed when Firestore cannot verify a citizen account', async () => {
      await expect(
        verifyOfficerInFirestore('citizen-123', 'citizen.jane@gmail.com')
      ).rejects.toThrow(/officer authorization lookup failed \(permission-denied\)/i);
    });

    it('does not trust an officer-like email domain when Firestore verification is denied', async () => {
      await expect(
        verifyOfficerInFirestore('officer-456', 'ward14.engineer@civicresolve.gov')
      ).rejects.toThrow(/officer authorization lookup failed \(permission-denied\)/i);
    });

    it('rejects complaint creation without a signed-in Firebase account', async () => {
      const complaint = {
        title: 'Water leak',
        description: 'Water is leaking from the pipe.',
        location: { address: 'Main Street' },
        status: 'reported',
        priority: 'medium',
        category: 'water',
        department: 'Water Supply & Sewerage',
        citizenName: 'Citizen',
        citizenContact: '0000000000',
        citizenUid: 'citizen-test',
        aiAnalysis: {
          category: 'water',
          categoryLabel: 'Water Supply & Pipelines',
          priority: 'medium',
          recommendedDepartment: 'Water Supply & Sewerage',
          urgencyScore: 5,
          summary: 'Water leak report.',
          keyActionItems: [],
          estimatedResolutionTime: '3 days',
          safetyHazard: false,
          confidenceScore: 0.5,
          source: 'civic-rule-engine-fallback',
        },
      } satisfies ComplaintSubmission;

      await expect(complaintService.createComplaint(complaint)).rejects.toThrow(/signed in to Firebase/);
    });

    it('protects complaint status updates from unauthorized non-officers', async () => {
      await expect(
        complaintService.updateComplaintStatus(
          'CR-2026-TEST',
          'in_progress',
          'Unauthorized status change',
          '',
          false
        )
      ).rejects.toThrow(/only verified municipal officials/i);
    });
  });
});
