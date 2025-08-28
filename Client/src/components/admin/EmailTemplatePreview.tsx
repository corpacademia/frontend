import React, { useState, useEffect } from 'react';
import { Mail, Send, Eye, Download } from 'lucide-react';
import { NotificationEmailGenerator } from '../../utils/notificationEmailGenerator';
import { NotificationEmailService } from '../../services/notificationEmailService';
import { NotificationType, NotificationPriority } from '../../types/notifications';
import { GradientText } from '../ui/GradientText';

interface EmailTemplatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailTemplatePreview: React.FC<EmailTemplatePreviewProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedType, setSelectedType] = useState<NotificationType>('lab_assigned');
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority>('medium');
  const [testEmail, setTestEmail] = useState('');
  const [previewHTML, setPreviewHTML] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notificationTypes = Object.keys(NotificationEmailGenerator.getAllNotificationConfigs()) as NotificationType[];

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
  }, [selectedType, selectedPriority, isOpen]);

  const generatePreview = async () => {
    try {
      const testNotification = {
        id: 'preview-' + Date.now(),
        type: selectedType,
        title: 'Sample Notification Title',
        message: 'This is a sample notification message for preview purposes.',
        priority: selectedPriority,
        is_read: false,
        created_at: new Date(),
        userId: 'sample-user',
        metadata: {
          labId: 'sample-lab-123',
          assessmentId: 'sample-assessment-456',
          organizationId: 'sample-org-789',
          amount: 99.99,
          userName: 'John Doe',
          userEmail: 'john.doe@example.com',
          labTitle: 'Advanced React Development',
          courseTitle: 'Full Stack Web Development',
          vmName: 'Ubuntu-Dev-VM',
          status: 'Running'
        }
      };

      const html = await NotificationEmailGenerator.generateEmailHTML(
        testNotification as any,
        'preview@example.com'
      );
      setPreviewHTML(html);
    } catch (error) {
      console.error('Error generating preview:', error);
      setMessage({ type: 'error', text: 'Failed to generate preview' });
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Please enter a test email address' });
      return;
    }

    setIsLoading(true);
    try {
      // Removed backend call to NotificationEmailService.testEmailTemplate
      // The functionality is now limited to generating and downloading the HTML.
      // We simulate success for the button state management.
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate some processing time
      setMessage({ type: 'success', text: 'Email HTML generated. Download it now!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error generating email HTML' });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadHTML = () => {
    if (!previewHTML) {
      setMessage({ type: 'error', text: 'No preview HTML to download. Please generate preview first.' });
      return;
    }
    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-${selectedType}-preview.html`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'HTML file downloaded successfully!' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-200 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-6 w-6 text-primary-400" />
              <h2 className="text-xl font-bold">
                <GradientText>Email Template Preview</GradientText>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Controls */}
          <div className="w-80 p-6 border-r border-gray-700 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notification Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as NotificationType)}
                className="w-full bg-dark-300 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                {notificationTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority Level
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as NotificationPriority)}
                className="w-full bg-dark-300 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full bg-dark-300 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={sendTestEmail}
                disabled={isLoading || !testEmail}
                className="w-full flex items-center justify-center space-x-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>{isLoading ? 'Generating...' : 'Generate & Download Test Email'}</span>
              </button>

              <button
                onClick={downloadHTML}
                disabled={!previewHTML}
                className="w-full flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download HTML</span>
              </button>

              <button
                onClick={generatePreview}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>Refresh Preview</span>
              </button>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 p-6">
            <div className="h-full bg-white rounded-lg overflow-hidden">
              {previewHTML ? (
                <iframe
                  srcDoc={previewHTML}
                  className="w-full h-full border-0"
                  title="Email Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Loading preview...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};