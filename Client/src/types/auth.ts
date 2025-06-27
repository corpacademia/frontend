export type UserRole = 'superadmin' | 'orgadmin' | 'trainer' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  createdAt: Date;
  lastLogin?: Date;
  profilePhoto?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}