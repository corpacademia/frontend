import { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import axios from 'axios';

// Comprehensive mock user profiles
const mockUserProfiles: Record<string, UserProfile> = {
  // 1. Individual User
  'user-1': {
    id: 'user-1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    lastActive: new Date(),
    stats: {
      completedLabs: 8,
      activeAssessments: 2,
      averageScore: 85,
      totalPurchases: 3,
      learningHours: 45,
      certifications: ['AWS Cloud Practitioner', 'Docker Essentials']
    },
    subscription: {
      plan: 'Professional',
      status: 'active',
      validUntil: new Date('2024-12-31')
    }
  },

  // 2. Independent Trainer
  'trainer-1': {
    id: 'trainer-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'trainer',
    status: 'active',
    createdAt: new Date('2023-11-20'),
    lastActive: new Date(),
    trainerStats: {
      totalStudents: 156,
      activeBatches: 4,
      completedBatches: 12,
      labsCreated: 15,
      assessmentsCreated: 28,
      averageRating: 4.8,
      totalEarnings: 12500,
      specializations: ['Cloud Architecture', 'DevOps', 'Kubernetes'],
      upcomingSessions: 3
    }
  },

  // 3. Training Organization Admin
  'orgadmin-1': {
    id: 'orgadmin-1',
    name: 'Michael Chen',
    email: 'michael.chen@techtraining.com',
    role: 'orgadmin',
    organization: 'TechTraining Solutions',
    organizationType: 'training',
    status: 'active',
    createdAt: new Date('2023-09-15'),
    lastActive: new Date(),
    orgAdminStats: {
      totalTrainers: 12,
      activeStudents: 450,
      totalCourses: 25,
      activeBatches: 8,
      revenue: {
        monthly: 45000,
        annual: 540000,
        growth: 15
      },
      resourceUtilization: 85,
      upcomingBatches: 3,
      popularCourses: [
        'Cloud Architecture Masterclass',
        'DevOps Professional',
        'Full Stack Development'
      ]
    }
  },

  // 4. Educational Institution Admin
  'orgadmin-2': {
    id: 'orgadmin-2',
    name: 'Dr. Patricia Williams',
    email: 'p.williams@techuniversity.edu',
    role: 'orgadmin',
    organization: 'Tech University',
    organizationType: 'education',
    status: 'active',
    createdAt: new Date('2023-10-01'),
    lastActive: new Date(),
    orgAdminStats: {
      departments: 5,
      facultyCount: 45,
      studentCount: 1200,
      activeCourses: 32,
      labResources: {
        virtualLabs: 25,
        physicalLabs: 8,
        cloudCredits: 50000
      },
      academicMetrics: {
        averageCompletion: 88,
        certificationRate: 92,
        researchProjects: 15
      },
      collaborations: [
        'AWS Academy',
        'Microsoft Learn',
        'Google Cloud Education'
      ]
    }
  }
};

export const useUserProfile = (userId: string) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Simulate API call
        // await new Promise(resolve => setTimeout(resolve, 500));
        
        // const userData = mockUserProfiles[userId];
        const userData = await axios.post(`http://localhost:3000/api/v1/user_ms/getuserdata/${userId}`)
        if (!userData.data.success) {
          throw new Error('User not found');
        }
        setUser(userData.data.response);
      } 
      catch (err) {
        setError(err as Error);
      } 
      finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, isLoading, error };
};