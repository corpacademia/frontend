export type UserRole = 'superadmin' | 'orgsuperadmin' | 'labadmin' | 'trainer' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  org_id?: string;
  createdAt: Date;
  lastLogin?: Date;
  profilePhoto?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}