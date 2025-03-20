export interface DashboardMetrics {
  users: {
    total: number;
    trainers: number;
    institutes: number;
    enterprises: number;
  };
  labs: {
    total: number;
    active: number;
    completed: number;
  };
  cloud: {
    budget: number;
    usage: number;
    savings: number;
  };
  revenue: {
    monthly: number;
    annual: number;
    growth: number;
  };
}

export interface ActivityItem {
  id: string;
  type: 'signup' | 'approval' | 'purchase' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'pending' | 'completed' | 'rejected';
}

export interface CloudResource {
  id: string;
  provider: 'aws' | 'azure' | 'gcp' | 'ibm' | 'oracle';
  type: string;
  usage: number;
  cost: number;
  organization: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'pay-as-you-go' | 'fixed' | 'enterprise';
  price: number;
  features: string[];
  active: boolean;
}