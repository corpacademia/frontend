
import { NotificationType, NotificationPriority, Notification } from '../types/notifications';
import { format } from 'date-fns';

interface NotificationEmailData {
  title: string;
  icon: string;
  priority: NotificationPriority;
  message: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  notificationType: string;
  formattedDate: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

const NOTIFICATION_CONFIGS: Record<NotificationType, {
  icon: string;
  titleTemplate: string;
  messageTemplate: string;
  actionText?: string;
  actionUrlTemplate?: string;
}> = {
  lab_assigned: {
    icon: '🧪',
    titleTemplate: 'New Lab Assignment',
    messageTemplate: 'You have been assigned a new lab: {{labTitle}}. Start your hands-on learning experience now!',
    actionText: 'Start Lab',
    actionUrlTemplate: '/dashboard/my-labs/{{labId}}'
  },
  lab_completed: {
    icon: '✅',
    titleTemplate: 'Lab Completed Successfully',
    messageTemplate: 'Congratulations! You have successfully completed the lab: {{labTitle}}. Great job on finishing this hands-on exercise!',
    actionText: 'View Certificate',
    actionUrlTemplate: '/dashboard/my-labs/{{labId}}/certificate'
  },
  assessment_assigned: {
    icon: '📝',
    titleTemplate: 'New Assessment Assignment',
    messageTemplate: 'You have been assigned a new assessment: {{assessmentTitle}}. Please complete it by the due date.',
    actionText: 'Take Assessment',
    actionUrlTemplate: '/dashboard/assessments/{{assessmentId}}'
  },
  assessment_completed: {
    icon: '🎯',
    titleTemplate: 'Assessment Completed',
    messageTemplate: 'You have successfully completed the assessment: {{assessmentTitle}}. Your results are now available.',
    actionText: 'View Results',
    actionUrlTemplate: '/dashboard/assessments/{{assessmentId}}/results'
  },
  user_registered: {
    icon: '👤',
    titleTemplate: 'New User Registration',
    messageTemplate: 'A new user has registered in your organization: {{userName}} ({{userEmail}}). Please review their profile and assign appropriate access.',
    actionText: 'View User Profile',
    actionUrlTemplate: '/dashboard/users/{{userId}}'
  },
  organization_created: {
    icon: '🏢',
    titleTemplate: 'New Organization Created',
    messageTemplate: 'A new organization has been created: {{organizationName}}. Admin review required for approval.',
    actionText: 'Review Organization',
    actionUrlTemplate: '/dashboard/organizations/{{organizationId}}'
  },
  batch_started: {
    icon: '🚀',
    titleTemplate: 'Training Batch Started',
    messageTemplate: 'The training batch "{{batchName}}" has started. All participants can now access their assigned labs and materials.',
    actionText: 'View Batch',
    actionUrlTemplate: '/dashboard/batches/{{batchId}}'
  },
  batch_completed: {
    icon: '🏆',
    titleTemplate: 'Training Batch Completed',
    messageTemplate: 'The training batch "{{batchName}}" has been completed. Review the final results and participant progress.',
    actionText: 'View Results',
    actionUrlTemplate: '/dashboard/batches/{{batchId}}/results'
  },
  payment_received: {
    icon: '💳',
    titleTemplate: 'Payment Received',
    messageTemplate: 'We have received your payment of ${{amount}}. Thank you for your purchase! Your services are now active.',
    actionText: 'View Invoice',
    actionUrlTemplate: '/dashboard/billing/{{paymentId}}'
  },
  system_update: {
    icon: '🔄',
    titleTemplate: 'System Update Available',
    messageTemplate: 'A new system update is available with improved features and security enhancements. The update will be applied during the maintenance window.',
    actionText: 'View Update Details',
    actionUrlTemplate: '/dashboard/system/updates'
  },
  maintenance: {
    icon: '🔧',
    titleTemplate: 'Scheduled Maintenance',
    messageTemplate: 'Scheduled maintenance is planned for {{maintenanceDate}}. Some services may be temporarily unavailable during this time.',
    actionText: 'View Schedule',
    actionUrlTemplate: '/dashboard/system/maintenance'
  },
  security_alert: {
    icon: '🔒',
    titleTemplate: 'Security Alert',
    messageTemplate: 'A security event has been detected on your account. Please review your recent activities and change your password if necessary.',
    actionText: 'Review Security',
    actionUrlTemplate: '/dashboard/security'
  },
  resource_usage: {
    icon: '📊',
    titleTemplate: 'Resource Usage Alert',
    messageTemplate: 'Your resource usage has reached {{usagePercent}}% of your allocated quota. Consider upgrading your plan or optimizing usage.',
    actionText: 'View Usage',
    actionUrlTemplate: '/dashboard/usage'
  },
  vm_status: {
    icon: '💻',
    titleTemplate: 'VM Status Update',
    messageTemplate: 'Your virtual machine "{{vmName}}" status has changed to: {{status}}. Please check if any action is required.',
    actionText: 'View VM',
    actionUrlTemplate: '/dashboard/vms/{{vmId}}'
  },
  course_update: {
    icon: '📚',
    titleTemplate: 'Course Content Updated',
    messageTemplate: 'The course "{{courseTitle}}" has been updated with new content and materials. Check out the latest additions!',
    actionText: 'View Course',
    actionUrlTemplate: '/dashboard/courses/{{courseId}}'
  },
  deadline_reminder: {
    icon: '⏰',
    titleTemplate: 'Deadline Reminder',
    messageTemplate: 'Reminder: Your assignment "{{assignmentTitle}}" is due on {{dueDate}}. Please complete it before the deadline.',
    actionText: 'Complete Assignment',
    actionUrlTemplate: '/dashboard/assignments/{{assignmentId}}'
  },
  software_expiry: {
    icon: '⚠️',
    titleTemplate: 'Software License Expiring',
    messageTemplate: 'Your license for "{{softwareName}}" will expire on {{expiryDate}}. Please renew to continue using this software.',
    actionText: 'Renew License',
    actionUrlTemplate: '/dashboard/licenses/{{licenseId}}'
  }
};

export class NotificationEmailGenerator {
  static generateEmailData(notification: Notification, userEmail: string): NotificationEmailData {
    const config = NOTIFICATION_CONFIGS[notification.type];
    const baseUrl = window.location.origin;
    
    if (!config) {
      throw new Error(`No configuration found for notification type: ${notification.type}`);
    }

    // Replace placeholders in message
    let processedMessage = config.messageTemplate;
    if (notification.metadata) {
      Object.keys(notification.metadata).forEach(key => {
        const placeholder = `{{${key}}}`;
        if (processedMessage.includes(placeholder)) {
          processedMessage = processedMessage.replace(
            new RegExp(placeholder, 'g'), 
            String(notification.metadata![key])
          );
        }
      });
    }

    // Replace remaining placeholders with notification data
    processedMessage = processedMessage.replace(/{{title}}/g, notification.title);
    processedMessage = processedMessage.replace(/{{message}}/g, notification.message);

    // Generate action URL if template exists
    let actionUrl: string | undefined;
    if (config.actionUrlTemplate && notification.metadata) {
      actionUrl = config.actionUrlTemplate;
      Object.keys(notification.metadata).forEach(key => {
        actionUrl = actionUrl?.replace(`{{${key}}}`, String(notification.metadata![key]));
      });
      actionUrl = `${baseUrl}${actionUrl}`;
    }

    return {
      title: config.titleTemplate,
      icon: config.icon,
      priority: notification.priority,
      message: processedMessage,
      actionUrl,
      actionText: config.actionText,
      metadata: notification.metadata,
      notificationType: notification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      formattedDate: format(new Date(notification.created_at), 'PPpp'),
      unsubscribeUrl: `${baseUrl}/dashboard/settings?tab=notifications&unsubscribe=${notification.type}`,
      preferencesUrl: `${baseUrl}/dashboard/settings?tab=notifications`
    };
  }

  static async generateEmailHTML(notification: Notification, userEmail: string): Promise<string> {
    const emailData = this.generateEmailData(notification, userEmail);
    
    try {
      // Fetch the email template
      const response = await fetch('/templates/notification-email-template.html');
      let template = await response.text();

      // Replace all placeholders in the template
      Object.keys(emailData).forEach(key => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(placeholder, String((emailData as any)[key] || ''));
      });

      // Handle conditional sections (metadata)
      if (emailData.metadata) {
        // Replace {{#if metadata}} sections
        template = template.replace(/{{#if metadata}}([\s\S]*?){{\/if}}/g, '$1');
        
        // Handle individual metadata fields
        Object.keys(emailData.metadata).forEach(key => {
          const conditionalRegex = new RegExp(`{{#if metadata\\.${key}}}([\\s\\S]*?){{\/if}}`, 'g');
          if (emailData.metadata![key]) {
            template = template.replace(conditionalRegex, '$1');
          } else {
            template = template.replace(conditionalRegex, '');
          }
        });
      } else {
        // Remove metadata sections if no metadata
        template = template.replace(/{{#if metadata}}[\s\S]*?{{\/if}}/g, '');
      }

      // Handle action URL conditional
      if (emailData.actionUrl) {
        template = template.replace(/{{#if actionUrl}}([\s\S]*?){{\/if}}/g, '$1');
      } else {
        template = template.replace(/{{#if actionUrl}}[\s\S]*?{{\/if}}/g, '');
      }

      return template;
    } catch (error) {
      console.error('Error generating email HTML:', error);
      throw error;
    }
  }

  static getNotificationConfig(type: NotificationType) {
    return NOTIFICATION_CONFIGS[type];
  }

  static getAllNotificationConfigs() {
    return NOTIFICATION_CONFIGS;
  }
}
