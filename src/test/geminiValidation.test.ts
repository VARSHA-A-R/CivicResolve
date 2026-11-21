import { describe, it, expect } from 'vitest';
import { validateGeminiResponse, analyzeCivicIssueWithGemini } from '../services/geminiService';

describe('Gemini Response Validation & Error Handling', () => {
  it('successfully validates a conforming Gemini response', () => {
    const validRaw = {
      category: 'roads',
      priority: 'HIGH',
      urgencyScore: 8,
      department: 'Roads & Infrastructure',
      reason: 'Deep road cavity on active bus lane causing transit disruption.',
      recommendedAction: 'Deploy asphalt cold-mix compaction team with safety cones.',
      estimatedResolutionDays: 2,
    };

    const validated = validateGeminiResponse(validRaw);
    expect(validated.category).toBe('roads');
    expect(validated.priority).toBe('HIGH');
    expect(validated.urgencyScore).toBe(8);
    expect(validated.department).toBe('Roads & Infrastructure');
    expect(validated.reason).toBe(validRaw.reason);
    expect(validated.recommendedAction).toBe(validRaw.recommendedAction);
    expect(validated.estimatedResolutionDays).toBe(2);
  });

  it('rejects invalid priority values', () => {
    const invalidPriority = {
      category: 'roads',
      priority: 'EXTREMELY_URGENT',
      urgencyScore: 8,
      department: 'Roads & Infrastructure',
      reason: 'Pothole issue',
      recommendedAction: 'Patch road',
      estimatedResolutionDays: 2,
    };

    expect(() => validateGeminiResponse(invalidPriority)).toThrowError(
      /invalid priority/i
    );
  });

  it('rejects out-of-bounds urgencyScore (score > 10 or score < 1)', () => {
    const invalidScore = {
      category: 'water',
      priority: 'CRITICAL',
      urgencyScore: 12,
      department: 'Water Supply & Sewerage',
      reason: 'Pipe rupture',
      recommendedAction: 'Isolate valve',
      estimatedResolutionDays: 1,
    };

    expect(() => validateGeminiResponse(invalidScore)).toThrowError(
      /invalid urgencyScore/i
    );
  });

  it('rejects responses with missing required text fields', () => {
    const missingAction = {
      category: 'streetlights',
      priority: 'LOW',
      urgencyScore: 3,
      department: 'Electrical & Street Lighting',
      reason: 'Bulb off',
      recommendedAction: '',
      estimatedResolutionDays: 3,
    };

    expect(() => validateGeminiResponse(missingAction)).toThrowError(
      /missing or empty "recommendedAction"/i
    );
  });

  it('rejects non-object or null input', () => {
    expect(() => validateGeminiResponse(null)).toThrowError(/not a valid JSON object/i);
    expect(() => validateGeminiResponse('string response')).toThrowError(/not a valid JSON object/i);
  });

  it('gracefully falls back to labeled offline heuristic engine when AI fails or unconfigured', async () => {
    // When Firebase credentials are not active, it falls back transparently
    const result = await analyzeCivicIssueWithGemini(
      'Deep pothole on Indiranagar 100ft road',
      'Two-wheelers are skidding and falling daily during evening hours.'
    );

    expect(result).toBeDefined();
    expect(result.category).toBe('roads');
    expect(result.source).toBe('civic-rule-engine-fallback');
    expect(result.summary).toBeDefined();
    expect(result.recommendedDepartment).toBe('Roads & Infrastructure');
  });
});
