export interface UserStats {
  completedLabs: number;
  activeAssessments: number;
  averageScore: number;
  totalPurchases: number;
  learningHours?: number;
  certifications?: string[];
}

export interface TrainerStats {
  totalStudents: number;
  activeBatches: number;
  completedBatches: number;
  labsCreated: number;
  assessmentsCreated: number;
  averageRating: number;
  totalEarnings: number;
  specializations: string[];
  upcomingSessions: number;
}

export interface OrgAdminStats {
  totalTrainers?: number;
  activeStudents: number;
  totalCourses?: number;
  activeBatches?: number;
  revenue?: {
    monthly: number;
    annual: number;
    growth: number;
  };
  resourceUtilization: number;
  upcomingBatches?: number;
  popularCourses?: string[];
  // Educational institution specific
  departments?: number;
  facultyCount?: number;
  studentCount?: number;
  labResources?: {
    virtualLabs: number;
    physicalLabs: number;
    cloudCredits: number;
  };
  academicMetrics?: {
    averageCompletion: number;
    certificationRate: number;
    researchProjects: number;
  };
  collaborations?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  organizationType?: 'training' | 'education';
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  lastActive: Date;
  stats?: UserStats;
  trainerStats?: TrainerStats;
  orgAdminStats?: OrgAdminStats;
  subscription?: {
    plan: string;
    status: string;
    validUntil: Date;
  };
}