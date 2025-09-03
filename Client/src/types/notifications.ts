
export type NotificationType = 
  | 'lab_assigned' 
  | 'lab_completed' 
  | 'assessment_assigned'
  | 'assessment_completed'
  | 'user_registered'
  | 'organization_created'
  | 'batch_started'
  | 'batch_completed'
  | 'payment_received'
  | 'system_update'
  | 'maintenance'
  | 'security_alert'
  | 'resource_usage'
  | 'vm_status'
  | 'course_update'
  | 'deadline_reminder'
    'software_expiry';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: Date;
  userId: string;
  metadata?: {
    labId?: string;
    assessmentId?: string;
    organizationId?: string;
    userId?: string;
    amount?: number;
    url?: string;
  };
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: {
    [K in NotificationType]?: boolean;
  };
  pushNotifications: {
    [K in NotificationType]?: boolean;
  };
  inAppNotifications: {
    [K in NotificationType]?: boolean;
  };
   emailnotifications: {
    [K in NotificationType]?: boolean;
  };
  pushnotifications: {
    [K in NotificationType]?: boolean;
  };
  inappnotifications: {
    [K in NotificationType]?: boolean;
  };
  digestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export const NotificationTypeLabels: Record<NotificationType, string> = {
  lab_assigned: 'Lab Assignments',
  lab_completed: 'Lab Completions',
  assessment_assigned: 'Assessment Assignments',
  assessment_completed: 'Assessment Completions',
  user_registered: 'User Registrations',
  organization_created: 'Organization Updates',
  batch_started: 'Batch Started',
  batch_completed: 'Batch Completed',
  payment_received: 'Payment Notifications',
  system_update: 'System Updates',
  maintenance: 'Maintenance Alerts',
  security_alert: 'Security Alerts',
  resource_usage: 'Resource Usage',
  vm_status: 'VM Status Updates',
  course_update: 'Course Updates',
  deadline_reminder: 'Deadline Reminders',
  software_expiry:'Software Expires',
};

export const RoleNotificationTypes: Record<string, NotificationType[]> = {
  superadmin: [
    'user_registered',
    'organization_created',
    'payment_received',
    'system_update',
    'maintenance',
    'security_alert',
    'resource_usage',
    'vm_status'
  ],
  orgsuperadmin: [
    'user_registered',
    'lab_assigned',
    'lab_completed',
    'assessment_assigned',
    'assessment_completed',
    'batch_started',
    'batch_completed',
    'payment_received',
    'resource_usage',
    'vm_status',
    'course_update',
    'software_expiry',
  ],
  orgadmin: [
    'user_registered',
    'lab_assigned',
    'lab_completed',
    'assessment_assigned',
    'assessment_completed',
    'batch_started',
    'batch_completed',
    'resource_usage',
    'course_update',
    'deadline_reminder'
  ],
  trainer: [
    'lab_assigned',
    'lab_completed',
    'assessment_assigned',
    'assessment_completed',
    'batch_started',
    'batch_completed',
    'course_update',
    'deadline_reminder'
  ],
  user: [
    'lab_assigned',
    'lab_completed',
    'assessment_assigned',
    'assessment_completed',
    'course_update',
    'deadline_reminder'
  ]
};
