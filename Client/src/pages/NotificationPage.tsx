
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle, 
  Trash2, 
  Filter, 
  Search, 
  MoreVertical,
  Clock,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { GradientText } from '../components/ui/GradientText';
import { Notification, NotificationType, NotificationPriority } from '../types/notifications';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const NotificationPage: React.FC = () => {
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications
  } = useNotificationStore();

  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const {user} = useAuthStore();
  useEffect(() => {
    if(user?.id){
    clearNotifications();
    fetchNotifications(user?.id);
  }
  }, [user?.id]);

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.is_read) ||
      notification.type === filter;
    
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getPriorityIcon = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'high':
        return <Zap className="h-4 w-4 text-orange-400" />;
      case 'medium':
        return <Info className="h-4 w-4 text-blue-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500/30 bg-red-500/5';
      case 'high':
        return 'border-orange-500/30 bg-orange-500/5';
      case 'medium':
        return 'border-blue-500/30 bg-blue-500/5';
      default:
        return 'border-gray-500/20 bg-gray-500/5';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Handle navigation based on notification type and metadata
    if (notification.metadata?.url) {
      window.location.href = notification.metadata.url;
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedNotifications) {
      await deleteNotification(id);
    }
    setSelectedNotifications(new Set());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                <GradientText>Notifications</GradientText>
              </h1>
              <p className="text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead(user?.id)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Mark all read</span>
                </button>
              )}
              
              {selectedNotifications.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="btn-danger flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete ({selectedNotifications.size})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass-panel p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 placeholder-gray-400 focus:border-primary-500/40 focus:outline-none"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="lg:w-64">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-4 py-3 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread</option>
                <option value="lab_assigned">Lab Assignments</option>
                <option value="assessment_assigned">Assessments</option>
                <option value="system_update">System Updates</option>
                <option value="payment_received">Payments</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">
                {searchTerm || filter !== 'all' ? 'No matching notifications' : 'No notifications yet'}
              </h3>
              <p className="text-gray-400">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'When you have new notifications, they\'ll appear here'
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`glass-panel border-l-4 transition-all duration-200 hover:shadow-lg
                  ${getPriorityColor(notification.priority)}
                  ${!notification.is_read ? 'border-l-primary-500' : 'border-l-gray-600'}
                  ${selectedNotifications.has(notification.id) ? 'ring-2 ring-primary-500/50' : ''}
                `}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start space-x-4">
                    {/* Selection Checkbox */}
                    <div className="flex items-center pt-1">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.has(notification.id)}
                        onChange={() => handleSelectNotification(notification.id)}
                        className="w-4 h-4 text-primary-500 bg-dark-400 border-gray-600 rounded
                                 focus:ring-primary-500 focus:ring-2"
                      />
                    </div>

                    {/* Content */}
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getPriorityIcon(notification.priority)}
                            <h3 className={`font-semibold ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            )}
                          </div>
                          
                          <p className="text-gray-400 text-sm mb-3 line-clamp-3">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium
                                ${notification.priority === 'urgent' ? 'bg-red-500/20 text-red-300' :
                                  notification.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                  notification.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                                  'bg-gray-500/20 text-gray-300'
                                }`}>
                                {notification.priority}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
