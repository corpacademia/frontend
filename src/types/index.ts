export type UserRole = 'individual' | 'trainer' | 'institute' | 'enterprise' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  organization?: string;
  subscription?: {
    type: string;
    validUntil: Date;
  };
}

export interface Lab {
  id: string;
  title: string;
  description: string;
  type: 'catalogue' | 'cloud-vm' | 'dedicated-vm' | 'cluster' | 'cloud-slice' | 'emulator' | 'hardware' | 'demo';
  duration: number;
  price: number;
  technologies: string[];
  prerequisites?: string[];
  status: 'available' | 'in-progress' | 'completed';
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  labs: Lab[];
  aiRecommended: boolean;
  duration: number;
  price: number;
}