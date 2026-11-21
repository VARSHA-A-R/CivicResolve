import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AIAnalysisResult,
  ComplaintCategory,
  ComplaintPriority,
  CivicDepartment,
} from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const isGeminiConfigured = (): boolean => {
  return typeof GEMINI_API_KEY === 'string' && GEMINI_API_KEY.trim().length > 0;
};

const CATEGORY_MAP: Record<ComplaintCategory, { label: string; department: CivicDepartment }> = {
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

/**
 * Heuristic civic analysis used as an intelligent offline fallback
 * when the Google Gemini API key has not yet been set in .env.
 * Explicitly labeled as 'civic-rule-engine-fallback' for transparency.
 */
export function analyzeCivicIssueOffline(
  title: string,
  description: string,
  categoryHint?: string
): AIAnalysisResult {
  const text = `${title} ${description} ${categoryHint || ''}`.toLowerCase();

  let category: ComplaintCategory = 'other';
  let priority: ComplaintPriority = 'medium';
  let urgencyScore = 5;
  let safetyHazard = false;
  let estimatedResolutionTime = '3 to 5 business days';

  // Keyword categorization
  if (text.match(/pothole|crater|asphalt|road|tarmac|divider|speed breaker|pavement|sidewalk/i)) {
    category = 'roads';
    urgencyScore = 6;
  } else if (text.match(/garbage|trash|waste|dump|stench|litter|bins?|decay|debris/i)) {
    category = 'garbage';
    urgencyScore = 6;
  } else if (text.match(/streetlight|lamp|dark|bulb|short circuit|wire|electric pole|pole/i)) {
    category = 'streetlights';
    urgencyScore = 7;
  } else if (text.match(/leak|burst|pipe|potable water|drinking water|supply|low pressure/i)) {
    category = 'water';
    urgencyScore = 7;
  } else if (text.match(/drain|gutter|clog|overflow|manhole|sewer|waterlogging|stagnant/i)) {
    category = 'drainage';
    urgencyScore = 8;
  } else if (text.match(/encroach|illegal shop|footpath occupied|stall|blocked passage/i)) {
    category = 'encroachment';
    urgencyScore = 4;
  }

  // Priority & safety hazard evaluation
  if (text.match(/urgent|danger|accident|injury|electrocute|sparking|sinkhole|burst pipe|hazard|falling/i)) {
    priority = 'critical';
    urgencyScore = Math.max(urgencyScore, 9);
    safetyHazard = true;
    estimatedResolutionTime = 'Within 12 to 24 hours';
  } else if (text.match(/deep|flooding|school|hospital|major traffic|severe|infection|health/i)) {
    priority = 'high';
    urgencyScore = Math.max(urgencyScore, 8);
    safetyHazard = true;
    estimatedResolutionTime = '24 to 48 hours';
  } else if (text.match(/minor|cosmetic|small|paint|faded/i)) {
    priority = 'low';
    urgencyScore = Math.min(urgencyScore, 3);
    safetyHazard = false;
    estimatedResolutionTime = '5 to 7 business days';
  } else if (priority === 'medium') {
    estimatedResolutionTime = '2 to 4 business days';
  }

  const categoryMeta = CATEGORY_MAP[category];

  const actionMap: Record<ComplaintCategory, string[]> = {
    roads: [
      'Dispatch road repair crew for cold-mix / bitumen patch repair',
      'Deploy traffic cones and warning indicators around the damaged area',
      'Inspect structural foundation for subsurface cavitation',
    ],
    garbage: [
      'Route sanitation compactor truck to specified coordinates',
      'Conduct disinfection and lime powder spraying post clearing',
      'Issue warning note if repeated commercial dumping is detected',
    ],
    streetlights: [
      'Dispatch electrical lineworker vehicle with hoist mechanism',
      'Test subterranean feeder cable for voltage drop or insulation breakdown',
      'Replace luminaire with energy-efficient smart LED unit',
    ],
    water: [
      'Isolate distribution valve segment to minimize potable water loss',
      'Excavate pipeline joint and install rapid repair clamp',
      'Test water pressure at downstream residential junctions',
    ],
    drainage: [
      'Mobilize jetting & suction machine to clear debris obstruction',
      'Inspect cover integrity and replace missing manhole lid immediately',
      'Check stormwater gravity gradient to prevent monsoon waterlogging',
    ],
    encroachment: [
      'Issue formal notice under Municipal Corporation Act',
      'Deploy enforcement squad with local police escort',
      'Clear pedestrian pathway and restore public right-of-way',
    ],
    other: [
      'Assign municipal liaison officer for on-ground site inspection',
      'Coordinate with pertinent municipal board or public utility',
      'Update complainant with preliminary assessment within 48 hours',
    ],
  };

  return {
    category,
    categoryLabel: categoryMeta.label,
    priority,
    recommendedDepartment: categoryMeta.department,
    urgencyScore,
    summary: `Heuristic classification: ${categoryMeta.label} issue with ${priority} priority. Immediate inspection recommended.`,
    keyActionItems: actionMap[category],
    estimatedResolutionTime,
    safetyHazard,
    confidenceScore: 0.88,
    source: 'civic-rule-engine-fallback',
  };
}

/**
 * Analyzes a civic issue using Google Gemini AI with fallback to heuristic logic.
 * Supports image context if imageBase64 is supplied.
 */
export async function analyzeCivicIssueWithGemini(
  title: string,
  description: string,
  imageBase64?: string
): Promise<AIAnalysisResult> {
  if (!isGeminiConfigured()) {
    // Transparently use offline rule engine and indicate fallback
    return analyzeCivicIssueOffline(title, description);
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use gemini-1.5-flash for fastest sub-second response in civic UI
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const systemPrompt = `You are the CivicResolve Municipal AI Engine for automated civic issue classification and triage.
Analyze the citizen's report and output strict JSON with this exact schema:
{
  "category": "roads" | "garbage" | "streetlights" | "water" | "drainage" | "encroachment" | "other",
  "categoryLabel": string,
  "priority": "low" | "medium" | "high" | "critical",
  "recommendedDepartment": "Roads & Infrastructure" | "Waste Management & Sanitation" | "Electrical & Street Lighting" | "Water Supply & Sewerage" | "Town Planning & Enforcement" | "Public Health & Environment",
  "urgencyScore": number (1 to 10),
  "summary": string (concise 1-2 sentence municipal assessment),
  "keyActionItems": string[] (3 actionable steps for the municipal field team),
  "estimatedResolutionTime": string (e.g. "Within 24 hours", "2-3 business days"),
  "safetyHazard": boolean,
  "confidenceScore": number (0.0 to 1.0)
}`;

    const promptText = `Citizen Report:
Title: ${title}
Description: ${description}`;

    let result;
    if (imageBase64) {
      // Clean base64 header if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      result = await model.generateContent([
        systemPrompt,
        promptText,
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg',
          },
        },
      ]);
    } else {
      result = await model.generateContent([systemPrompt, promptText]);
    }

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return {
      category: parsed.category || 'other',
      categoryLabel: parsed.categoryLabel || CATEGORY_MAP[parsed.category as ComplaintCategory]?.label || 'General',
      priority: parsed.priority || 'medium',
      recommendedDepartment: parsed.recommendedDepartment || 'Roads & Infrastructure',
      urgencyScore: Number(parsed.urgencyScore) || 5,
      summary: parsed.summary || 'Analyzed by Google Gemini AI.',
      keyActionItems: Array.isArray(parsed.keyActionItems) ? parsed.keyActionItems : [
        'Inspect site within 24 hours',
        'Deploy designated departmental crew',
        'Submit post-action photographic verification',
      ],
      estimatedResolutionTime: parsed.estimatedResolutionTime || '2 to 3 business days',
      safetyHazard: Boolean(parsed.safetyHazard),
      confidenceScore: Number(parsed.confidenceScore) || 0.95,
      source: 'google-gemini-live',
    };
  } catch (error) {
    console.error('[CivicResolve] Gemini API call failed, reverting to civic rule fallback:', error);
    const fallback = analyzeCivicIssueOffline(title, description);
    return fallback;
  }
}
