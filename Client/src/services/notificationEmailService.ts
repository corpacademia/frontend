
import axios from 'axios';
import { Notification } from '../types/notifications';
import { NotificationEmailGenerator } from '../utils/notificationEmailGenerator';

export interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  priority: string;
}

export class NotificationEmailService {
  private static readonly EMAIL_ENDPOINT = `${import.meta.env.VITE_BACKEND_URL}/api/v1/notifications/send-email`;

  static async sendNotificationEmail(
    notification: Notification, 
    recipientEmail: string,
    userPreferences?: any
  ): Promise<boolean> {
    try {
      // Check if user has email notifications enabled for this type
      if (userPreferences?.emailNotifications && 
          !userPreferences.emailNotifications[notification.type]) {
        console.log(`Email notifications disabled for ${notification.type}`);
        return false;
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

      // Send email via backend
      const response = await axios.post(this.EMAIL_ENDPOINT, emailConfig, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.success;
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }
  }

  static async sendBulkNotificationEmails(
    notification: Notification,
    recipients: Array<{ email: string; preferences?: any }>
  ): Promise<{ success: number; failed: number }> {
    const results = { success: 0, failed: 0 };

    for (const recipient of recipients) {
      try {
        const sent = await this.sendNotificationEmail(
          notification,
          recipient.email,
          recipient.preferences
        );
        
        if (sent) {
          results.success++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        results.failed++;
      }
    }

    return results;
  }

  private static generateSubject(notification: Notification): string {
    const priorityPrefix = notification.priority === 'urgent' ? '[URGENT] ' : 
                          notification.priority === 'high' ? '[HIGH] ' : '';
    
    return `${priorityPrefix}${notification.title} - GoLabing.ai`;
  }

  static async testEmailTemplate(
    notificationType: string,
    recipientEmail: string
  ): Promise<boolean> {
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

      return await this.sendNotificationEmail(testNotification, recipientEmail);
    } catch (error) {
      console.error('Failed to send test email:', error);
      return false;
    }
  }
}
