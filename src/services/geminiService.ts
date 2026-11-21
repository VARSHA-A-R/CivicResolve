import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { app, isFirebaseConfigured } from './firebase';
import type {
  AIAnalysisResult,
  ComplaintCategory,
  ComplaintPriority,
  CivicDepartment,
  RawGeminiResponse,
  LocationInfo,
} from '../types';

export const CATEGORY_MAP: Record<ComplaintCategory, { label: string; department: CivicDepartment }> = {
  roads: {
    label: 'Roads & Pavement',
    department: 'Roads & Infrastructure',
  },
  garbage: {
    label: 'Solid Waste & Sanitation',
    department: 'Waste Management & Sanitation',
  },
  streetlights: {
    label: 'Street Lighting & Electrical',
    department: 'Electrical & Street Lighting',
  },
  water: {
    label: 'Water Supply & Pipelines',
    department: 'Water Supply & Sewerage',
  },
  drainage: {
    label: 'Storm Drainage & Sewage',
    department: 'Water Supply & Sewerage',
  },
  encroachment: {
    label: 'Public Space & Encroachment',
    department: 'Town Planning & Enforcement',
  },
  other: {
    label: 'General Municipal Affairs',
    department: 'Public Health & Environment',
  },
};

const VALID_CATEGORIES: ComplaintCategory[] = [
  'roads',
  'garbage',
  'streetlights',
  'water',
  'drainage',
  'encroachment',
  'other',
];

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const GEMINI_REQUEST_TIMEOUT_MS = 15_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Gemini analysis timed out after ${timeoutMs / 1000} seconds`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Validates the raw JSON output returned by Gemini.
 * Throws a descriptive Error if the structure or types are invalid.
 */
export function validateGeminiResponse(raw: unknown): RawGeminiResponse {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Gemini response validation failed: response is not a valid JSON object');
  }

  const obj = raw as Record<string, unknown>;

  // Validate category
  const rawCategory = typeof obj.category === 'string' ? obj.category.trim().toLowerCase() : '';
  const categoryMatch = VALID_CATEGORIES.find((cat) => cat === rawCategory) || 'other';

  // Validate priority
  const rawPriority = typeof obj.priority === 'string' ? obj.priority.trim().toUpperCase() : '';
  if (!VALID_PRIORITIES.includes(rawPriority as (typeof VALID_PRIORITIES)[number])) {
    throw new Error(`Gemini response validation failed: invalid priority "${obj.priority}". Expected LOW, MEDIUM, HIGH, or CRITICAL.`);
  }

  // Validate urgencyScore (must be integer between 1 and 10)
  const urgencyNum = Number(obj.urgencyScore);
  if (isNaN(urgencyNum) || urgencyNum < 1 || urgencyNum > 10) {
    throw new Error(`Gemini response validation failed: invalid urgencyScore "${obj.urgencyScore}". Expected a number between 1 and 10.`);
  }

  // Validate department
  if (!obj.department || typeof obj.department !== 'string' || obj.department.trim().length === 0) {
    throw new Error('Gemini response validation failed: missing or empty "department" string.');
  }

  // Validate reason
  if (!obj.reason || typeof obj.reason !== 'string' || obj.reason.trim().length === 0) {
    throw new Error('Gemini response validation failed: missing or empty "reason" string.');
  }

  // Validate recommendedAction
  if (!obj.recommendedAction || typeof obj.recommendedAction !== 'string' || obj.recommendedAction.trim().length === 0) {
    throw new Error('Gemini response validation failed: missing or empty "recommendedAction" string.');
  }

  // Validate estimatedResolutionDays
  const daysNum = Number(obj.estimatedResolutionDays);
  if (isNaN(daysNum) || daysNum <= 0) {
    throw new Error(`Gemini response validation failed: invalid estimatedResolutionDays "${obj.estimatedResolutionDays}". Expected a positive number.`);
  }

  return {
    category: categoryMatch,
    priority: rawPriority as (typeof VALID_PRIORITIES)[number],
    urgencyScore: Math.round(urgencyNum),
    department: obj.department.trim(),
    reason: obj.reason.trim(),
    recommendedAction: obj.recommendedAction.trim(),
    estimatedResolutionDays: Math.round(daysNum),
  };
}

/**
 * Heuristic civic analysis used as an intelligent offline/demo fallback
 * when Firebase is not configured or network/credentials fail.
 * Explicitly labeled as 'civic-rule-engine-fallback' for 100% transparency.
 */
export function analyzeCivicIssueOffline(
  title: string,
  description: string,
  location?: LocationInfo | string,
  categoryHint?: string
): AIAnalysisResult {
  const locText = typeof location === 'string' ? location : location?.address || '';
  const text = `${title} ${description} ${locText} ${categoryHint || ''}`.toLowerCase();

  let category: ComplaintCategory = 'other';
  let priority: ComplaintPriority = 'medium';
  let urgencyScore = 5;
  let safetyHazard = false;
  let estimatedResolutionDays = 3;

  // Keyword categorization
  if (text.match(/pothole|crater|asphalt|road|tarmac|divider|speed breaker|pavement|sidewalk/i)) {
    category = 'roads';
    urgencyScore = 6;
    estimatedResolutionDays = 2;
  } else if (text.match(/garbage|trash|waste|dump|stench|litter|bins?|decay|debris/i)) {
    category = 'garbage';
    urgencyScore = 6;
    estimatedResolutionDays = 1;
  } else if (text.match(/streetlight|lamp|dark|bulb|short circuit|wire|electric pole|pole/i)) {
    category = 'streetlights';
    urgencyScore = 7;
    estimatedResolutionDays = 2;
  } else if (text.match(/leak|burst|pipe|potable water|drinking water|supply|low pressure/i)) {
    category = 'water';
    urgencyScore = 7;
    estimatedResolutionDays = 1;
  } else if (text.match(/drain|gutter|clog|overflow|manhole|sewer|waterlogging|stagnant/i)) {
    category = 'drainage';
    urgencyScore = 8;
    estimatedResolutionDays = 2;
  } else if (text.match(/encroach|illegal shop|footpath occupied|stall|blocked passage/i)) {
    category = 'encroachment';
    urgencyScore = 4;
    estimatedResolutionDays = 4;
  }

  // Priority & safety hazard evaluation
  if (text.match(/urgent|danger|accident|injury|electrocute|sparking|sinkhole|burst pipe|hazard|falling/i)) {
    priority = 'critical';
    urgencyScore = Math.max(urgencyScore, 9);
    safetyHazard = true;
    estimatedResolutionDays = 1;
  } else if (text.match(/deep|flooding|school|hospital|major traffic|severe|infection|health/i)) {
    priority = 'high';
    urgencyScore = Math.max(urgencyScore, 8);
    safetyHazard = true;
    estimatedResolutionDays = 2;
  } else if (text.match(/minor|cosmetic|small|paint|faded/i)) {
    priority = 'low';
    urgencyScore = Math.min(urgencyScore, 3);
    safetyHazard = false;
    estimatedResolutionDays = 5;
  }

  const categoryMeta = CATEGORY_MAP[category];

  const actionMap: Record<ComplaintCategory, string> = {
    roads: 'Deploy asphalt road crew with cold-tar compaction equipment and erect traffic safety cones.',
    garbage: 'Dispatch hydraulic compactor truck to clear overflow and sanitize site with disinfectant.',
    streetlights: 'Deploy cherry-picker vehicle to repair subterranean cabling junction and replace LED luminaire.',
    water: 'Isolate localized distribution valve, excavate collar section, and seat rapid pipe repair clamp.',
    drainage: 'Mobilize high-pressure jetting machine to extract silt blockage and seat heavy-duty manhole cover.',
    encroachment: 'Issue municipal formal violation notice and deploy enforcement team to clear public pedestrian walkway.',
    other: 'Dispatch ward liaison officer for preliminary physical site inspection and stakeholder consultation.',
  };

  const recommendedAction = actionMap[category];
  const reason = `Heuristic classification assessed ${categoryMeta.label} issue with ${priority.toUpperCase()} urgency based on reported civic incident description.`;

  return {
    category,
    categoryLabel: categoryMeta.label,
    priority,
    recommendedDepartment: categoryMeta.department,
    urgencyScore,
    summary: reason,
    reason,
    recommendedAction,
    estimatedResolutionDays,
    keyActionItems: [
      recommendedAction,
      'Deploy designated ward engineering inspection team',
      'Upload verified post-remediation photographic proof',
    ],
    estimatedResolutionTime: `${estimatedResolutionDays} day${estimatedResolutionDays > 1 ? 's' : ''}`,
    safetyHazard,
    confidenceScore: 0.88,
    source: 'civic-rule-engine-fallback',
  };
}

/**
 * Analyzes a civic issue using Firebase AI Logic and the currently supported gemini-3.8-flash model.
 * Includes complaint title, description, location, and optional uploaded image.
 * Uses structured JSON output with strict response validation.
 * Falls back to explicitly labeled heuristic engine when offline or unconfigured.
 */
export async function analyzeCivicIssueWithGemini(
  title: string,
  description: string,
  location?: LocationInfo | string,
  imageBase64?: string
): Promise<AIAnalysisResult> {
  // If Firebase is not configured, transparently use offline heuristic fallback
  if (!isFirebaseConfigured() || !app) {
    console.info('[CivicResolve] Firebase is not configured. Utilizing labeled heuristic engine fallback.');
    return analyzeCivicIssueOffline(title, description, location);
  }

  try {
    // Official Firebase AI Logic Web SDK
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, {
      model: 'gemini-3.8-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const locationStr = typeof location === 'string' ? location : location ? `${location.address}${location.landmark ? ` (Landmark: ${location.landmark})` : ''}` : 'Not provided';

    const systemPrompt = `You are CivicResolve, an AI civic issue triage engine.
Analyze the citizen grievance and return strict JSON with this exact schema:
{
  "category": "roads" | "garbage" | "streetlights" | "water" | "drainage" | "encroachment" | "other",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "urgencyScore": number (integer 1-10),
  "department": "Roads & Infrastructure" | "Waste Management & Sanitation" | "Electrical & Street Lighting" | "Water Supply & Sewerage" | "Town Planning & Enforcement" | "Public Health & Environment",
  "reason": string (1-2 sentences explaining why this priority and hazard level were assigned),
  "recommendedAction": string (the primary remediation step required by the municipal field crew),
  "estimatedResolutionDays": number (positive integer representing expected days to resolve)
}`;

    const promptText = `Citizen Grievance Report:
Title: ${title}
Description: ${description}
Location: ${locationStr}`;

    const generatePromise = (async () => {
      if (imageBase64) {
        const mimeMatch = imageBase64.match(/^data:(image\/(?:jpeg|png|webp));base64,/);
        const mimeType = mimeMatch?.[1] || 'image/jpeg';
        const cleanBase64 = imageBase64.replace(/^data:image\/[^;]+;base64,/, '');
        return await model.generateContent([
          systemPrompt,
          promptText,
          { inlineData: { data: cleanBase64, mimeType } },
        ]);
      }
      return await model.generateContent([systemPrompt, promptText]);
    })();

    const result = await withTimeout(generatePromise, GEMINI_REQUEST_TIMEOUT_MS);

    const responseText = result.response.text();
    const rawParsed = JSON.parse(responseText);

    // Strict validation
    const validated = validateGeminiResponse(rawParsed);

    const categoryKey = validated.category as ComplaintCategory;
    const categoryMeta = CATEGORY_MAP[categoryKey] || CATEGORY_MAP.other;
    const priorityKey = validated.priority.toLowerCase() as ComplaintPriority;
    const departmentName = (validated.department as CivicDepartment) || categoryMeta.department;

    return {
      category: categoryKey,
      categoryLabel: categoryMeta.label,
      priority: priorityKey,
      recommendedDepartment: departmentName,
      urgencyScore: validated.urgencyScore,
      summary: validated.reason,
      reason: validated.reason,
      recommendedAction: validated.recommendedAction,
      estimatedResolutionDays: validated.estimatedResolutionDays,
      keyActionItems: [
        validated.recommendedAction,
        'Deploy ward engineering crew with specialized equipment',
        'Capture and attach geocoded photographic verification on closure',
      ],
      estimatedResolutionTime: `${validated.estimatedResolutionDays} day${validated.estimatedResolutionDays > 1 ? 's' : ''}`,
      safetyHazard: validated.urgencyScore >= 8 || validated.priority === 'CRITICAL' || validated.priority === 'HIGH',
      confidenceScore: 0.96,
      source: 'firebase-gemini-3.8-flash',
    };
  } catch (error) {
    console.warn(
      '[CivicResolve] Firebase Gemini analysis failed or validation errored. Using the labeled heuristic fallback.',
      error instanceof Error ? error.name : 'UnknownError'
    );
    return analyzeCivicIssueOffline(title, description, location);
  }
}
