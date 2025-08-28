
import { Notification } from '../types/notifications';
import { NotificationEmailGenerator } from '../utils/notificationEmailGenerator';

export interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  priority: string;
}

export class NotificationEmailService {
  static async generateNotificationEmail(
    notification: Notification, 
    recipientEmail: string,
    userPreferences?: any
  ): Promise<EmailConfig | null> {
    try {
      // Check if user has email notifications enabled for this type
      if (userPreferences?.emailNotifications && 
          !userPreferences.emailNotifications[notification.type]) {
        console.log(`Email notifications disabled for ${notification.type}`);
        return null;
      }

      // Generate email HTML content
      const emailHTML = await NotificationEmailGenerator.generateEmailHTML(
        notification, 
        recipientEmail
      );

      // Prepare email configuration
      const emailConfig: EmailConfig = {
        to: recipientEmail,
        subject: this.generateSubject(notification),
        html: emailHTML,
        priority: notification.priority
      };

      return emailConfig;
    } catch (error) {
      console.error('Failed to generate notification email:', error);
      return null;
    }
  }

  static async generateBulkNotificationEmails(
    notification: Notification,
    recipients: Array<{ email: string; preferences?: any }>
  ): Promise<EmailConfig[]> {
    const emailConfigs: EmailConfig[] = [];

    for (const recipient of recipients) {
      try {
        const emailConfig = await this.generateNotificationEmail(
          notification,
          recipient.email,
          recipient.preferences
        );
        
        if (emailConfig) {
          emailConfigs.push(emailConfig);
        }
      } catch (error) {
        console.error(`Failed to generate email for ${recipient.email}:`, error);
      }
    }

    return emailConfigs;
  }

  private static generateSubject(notification: Notification): string {
    const priorityPrefix = notification.priority === 'urgent' ? '[URGENT] ' : 
                          notification.priority === 'high' ? '[HIGH] ' : '';
    
    return `${priorityPrefix}${notification.title} - GoLabing.ai`;
  }

  static async generateTestEmailTemplate(
    notificationType: string,
    recipientEmail: string
  ): Promise<EmailConfig | null> {
    try {
      // Create a test notification
      const testNotification: Notification = {
        id: 'test-' + Date.now(),
        type: notificationType as any,
        title: 'Test Notification',
        message: 'This is a test notification to verify email template rendering.',
        priority: 'medium',
        is_read: false,
        created_at: new Date(),
        userId: 'test-user',
        metadata: {
          labId: 'test-lab-123',
          assessmentId: 'test-assessment-456',
          organizationId: 'test-org-789',
          amount: 99.99,
          userId: 'test-user-id'
        }
      };

      return await this.generateNotificationEmail(testNotification, recipientEmail);
    } catch (error) {
      console.error('Failed to generate test email:', error);
      return null;
    }
  }

  static downloadEmailAsHTML(emailConfig: EmailConfig): void {
    const blob = new Blob([emailConfig.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-${emailConfig.to.replace('@', '_at_')}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static copyEmailToClipboard(emailConfig: EmailConfig): Promise<boolean> {
    return navigator.clipboard.writeText(emailConfig.html)
      .then(() => true)
      .catch(() => false);
  }
}
