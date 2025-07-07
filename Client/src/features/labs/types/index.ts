// Lab Types
export type LabType = 
  | 'workspace'
  | 'catalogue' 
  | 'cloud-vm'
  | 'cloud-slice'
  | 'dedicated-vm'
  | 'cluster'
  | 'emulator';

export type CloudProvider = 
  | 'aws'
  | 'azure'
  | 'gcp'
  | 'ibm'
  | 'oracle';

export type EmulatorType =
  | 'eve-ng'
  | 'pnetlab'
  | 'gns3'
  | 'netsim';

export interface Lab {
  lab_id: string;
  title: string;
  description: string;
  type: LabType;
  thumbnail?: string;
  duration: number;
  price: number;
  technologies: string[];
  prerequisites?: string[];
  status: 'available' | 'in-progress' | 'completed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating?: number;
  totalEnrollments?: number;
  
  // Guacamole configuration
  guacamole?: {
    name: string;
    url: string;
  };
  
  // Specific fields based on lab type
  cloudProvider?: CloudProvider;
  emulatorType?: EmulatorType;
  specifications?: {
    cpu: number;
    ram: number;
    storage: number;
    networkInterfaces?: number;
  };
  clusterConfig?: {
    nodes: number;
    topology: string;
    networkSchema: string;
  };
  cloudSlice?: {
    provider: CloudProvider;
    services: string[];
    budget: number;
    duration: number;
    labType?: 'without-modules' | 'with-modules';
  };
}

export interface LabCategory {
  id: string;
  name: string;
  description: string;
  labCount: number;
  thumbnail?: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  labs: Lab[];
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  technologies: string[];
  aiRecommended: boolean;
  completionRate?: number;
  enrollments?: number;
}

export interface CloudSlice {
  id: string;
  name: string;
  description: string;
  provider: CloudProvider;
  region: string;
  services: string[];
  status: 'active' | 'inactive' | 'pending' | 'expired';
  startDate: string;
  endDate: string;
  cleanupPolicy: string;
  credits: number;
  labType: 'without-modules' | 'with-modules';
}