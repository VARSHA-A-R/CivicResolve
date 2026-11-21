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

export interface AIAnalysisResult {
  category: ComplaintCategory;
  categoryLabel: string;
  priority: ComplaintPriority;
  recommendedDepartment: CivicDepartment;
  urgencyScore: number; // 1 to 10
  summary: string;
  keyActionItems: string[];
  estimatedResolutionTime: string;
  safetyHazard: boolean;
  confidenceScore: number; // 0.0 to 1.0
  source: 'google-gemini-live' | 'civic-rule-engine-fallback';
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
  citizenContact: string;
  citizenEmail?: string;
  createdAt: string;
  updatedAt: string;
  aiAnalysis: AIAnalysisResult;
  timeline: ComplaintTimelineEvent[];
  assignedOfficer?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'citizen' | 'admin';
  department?: CivicDepartment;
  phoneNumber?: string;
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
