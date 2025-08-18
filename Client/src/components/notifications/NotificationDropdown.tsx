
import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, MoreVertical } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications
  } = useNotificationStore();
 const {user} = useAuthStore();
  // Get only recent notifications (last 10)
  const recentNotifications = notifications?.slice(0, 10);
  useEffect(() => {
    clearNotifications();
    fetchNotifications(user?.id);
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 text-xs bg-red-500 text-white rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-dark-200 rounded-lg shadow-xl border border-dark-300 z-50 max-h-[32rem] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-300">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead(user?.id)}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Mark all read
                </button>
              )}
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-300"
              >
                View all
              </Link>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-300">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-dark-100/50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-primary-500/5 border-l-2 border-l-primary-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-medium truncate ${
                            !notification.is_read ? 'text-white' : 'text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 ml-2"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            notification.priority === 'urgent' ? 'bg-red-500/20 text-red-300' :
                            notification.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                            notification.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {notification.priority}
                          </span>
                        </div>
                      </div>
                      
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1 hover:bg-dark-300 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3 text-green-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="p-3 border-t border-dark-300 bg-dark-100/30">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
