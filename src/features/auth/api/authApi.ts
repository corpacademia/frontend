// import axios from 'axios';
// import { User, AuthResponse } from '../../../types/auth';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// const demoUsers = {
//   superadmin: {
//     id: '1',
//     email: 'superadmin@golabing.ai',
//     name: 'Super Admin',
//     role: 'superadmin',
//     createdAt: new Date(),
//   },
//   orgadmin: {
//     id: '2',
//     email: 'orgadmin@golabing.ai',
//     name: 'Organization Admin',
//     role: 'orgadmin',
//     organization: 'Demo Training Company',
//     createdAt: new Date(),
//   },
//   trainer: {
//     id: '3',
//     email: 'trainer@golabing.ai',
//     name: 'Demo Trainer',
//     role: 'trainer',
//     organization: 'Demo Training Company',
//     createdAt: new Date(),
//   },
//   demouser: {
//     id: '4',
//     email: 'demo@golabing.ai',
//     name: 'Demo User',
//     role: 'user',
//     createdAt: new Date(),
//   },
// } as const;

// export const authApi = {
//   login: async (email: string, password: string): Promise<AuthResponse> => {
//     // Demo authentication logic
//     const userKey = Object.keys(demoUsers).find(
//       key => demoUsers[key as keyof typeof demoUsers].email === email
//     );

//     if (userKey && password === 'demo') {
//       return {
//         user: demoUsers[userKey as keyof typeof demoUsers] as User,
//         token: 'demo-token',
//       };
//     }

//     throw new Error('Invalid credentials');
//   },

//   signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
//     // Demo signup logic - always creates a regular user
//     const newUser: User = {
//       id: Math.random().toString(36).substr(2, 9),
//       email,
//       name,
//       role: 'user',
//       createdAt: new Date(),
//     };

//     return {
//       user: newUser,
//       token: 'demo-token',
//     };
//   },

//   logout: async (): Promise<void> => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('userKey');
//   },

//   getCurrentUser: async (): Promise<User | null> => {
//     const token = localStorage.getItem('token');
//     if (!token) return null;

//     const userKey = localStorage.getItem('userKey');
//     return userKey ? (demoUsers[userKey as keyof typeof demoUsers] as User) : null;
//   },
// };