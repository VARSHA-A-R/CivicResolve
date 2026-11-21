export type ComplaintCategory =
  | 'roads'
  | 'garbage'
  | 'streetlights'
  | 'water'
  | 'drainage'
  | 'encroachment'
  | 'other';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintStatus = 'reported' | 'in_progress' | 'resolved' | 'rejected';

export type CivicDepartment =
  | 'Roads & Infrastructure'
  | 'Waste Management & Sanitation'
  | 'Electrical & Street Lighting'
  | 'Water Supply & Sewerage'
  | 'Town Planning & Enforcement'
  | 'Public Health & Environment';

export interface LocationInfo {
  address: string;
  landmark?: string;
  pincode?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface RawGeminiResponse {
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'low' | 'medium' | 'high' | 'critical';
  urgencyScore: number;
  department: string;
  reason: string;
  recommendedAction: string;
  estimatedResolutionDays: number;
}

export interface AIAnalysisResult {
  category: ComplaintCategory;
  categoryLabel: string;
  priority: ComplaintPriority;
  recommendedDepartment: CivicDepartment;
  urgencyScore: number; // 1 to 10
  summary: string;
  reason?: string;
  recommendedAction?: string;
  estimatedResolutionDays?: number;
  keyActionItems: string[];
  estimatedResolutionTime: string;
  safetyHazard: boolean;
  confidenceScore: number; // 0.0 to 1.0
  source: 'firebase-gemini-3.8-flash' | 'civic-rule-engine-fallback';
}

export interface ComplaintTimelineEvent {
  id: string;
  status: ComplaintStatus;
  statusLabel: string;
  timestamp: string;
  actor: string;
  actorRole: 'citizen' | 'ai_system' | 'officer' | 'field_worker';
  note: string;
}

export interface OfficerNote {
  id: string;
  actorUid: string;
  actorName: string;
  timestamp: string;
  note: string;
}

export interface Complaint {
  id: string; // e.g. "CR-2025-4102"
  title: string;
  description: string;
  location: LocationInfo;
  imageUrl?: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  category: ComplaintCategory;
  department: CivicDepartment;
  citizenName: string;
  citizenContact?: string;
  citizenEmail?: string;
  citizenUid?: string;
  createdAt: string;
  updatedAt: string;
  aiAnalysis?: AIAnalysisResult;
  officerNotes?: OfficerNote[];
  timeline: ComplaintTimelineEvent[];
  assignedOfficer?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  isDemo?: boolean;
}

export type ComplaintSubmission = Omit<
  Complaint,
  'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'aiAnalysis' | 'citizenContact' | 'officerNotes'
> & {
  aiAnalysis: AIAnalysisResult;
  citizenContact: string;
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'citizen' | 'admin';
  department?: CivicDepartment;
  phoneNumber?: string;
  isVerifiedOfficer?: boolean;
  profileComplete?: boolean;
  profileError?: string;
}

export interface OfficerApplication {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  department: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface CivicStats {
  totalComplaints: number;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  resolutionRate: number; // e.g. 91.4
  avgResolutionDays: number;
  criticalPendingCount: number;
}
