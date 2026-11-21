import { describe, it, expect } from 'vitest';
import { analyzeCivicIssueOffline } from '../services/geminiService';

describe('CivicResolve AI Service Heuristics', () => {
  it('classifies pothole as road infrastructure with appropriate actions', () => {
    const result = analyzeCivicIssueOffline(
      'Deep pothole on arterial road',
      'Cars and motorcycles are swerving dangerously to avoid the crater.'
    );

    expect(result.category).toBe('roads');
    expect(result.recommendedDepartment).toBe('Roads & Infrastructure');
    expect(result.urgencyScore).toBeGreaterThanOrEqual(6);
    expect(result.keyActionItems.length).toBeGreaterThan(0);
    expect(result.source).toBe('civic-rule-engine-fallback');
  });

  it('classifies overflowing garbage bins under Waste Management & Sanitation', () => {
    const result = analyzeCivicIssueOffline(
      'Overflowing community garbage dump',
      'Waste spilling into the street with foul smell and flies.'
    );

    expect(result.category).toBe('garbage');
    expect(result.recommendedDepartment).toBe('Waste Management & Sanitation');
  });

  it('elevates priority to critical when hazardous or accident terms are present', () => {
    const result = analyzeCivicIssueOffline(
      'Open live electric wire sparking from streetlight pole',
      'Extreme urgent accident danger for passing children during rain.'
    );

    expect(result.priority).toBe('critical');
    expect(result.safetyHazard).toBe(true);
    expect(result.urgencyScore).toBeGreaterThanOrEqual(9);
  });

  it('sets low priority for cosmetic issues', () => {
    const result = analyzeCivicIssueOffline(
      'Minor cosmetic paint faded on curb',
      'Small aesthetic scratch on sidewalk divider.'
    );

    expect(result.priority).toBe('low');
    expect(result.safetyHazard).toBe(false);
  });
});
