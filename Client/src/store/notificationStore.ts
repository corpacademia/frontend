
import { create } from 'zustand';
import axios from 'axios';
import { Notification, NotificationPreferences } from '../types/notifications';

interface NotificationStore {
  notifications: Notification[];
  preferences: NotificationPreferences | null;
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  preferences: null,
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/notifications`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const notifications = response.data.data;
        const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;
        
        set({ 
          notifications,
          unreadCount,
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  fetchPreferences: async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/notifications/preferences`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        set({ preferences: response.data.data });
      }
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/notifications/${notificationId}/read`,
        {},
        { withCredentials: true }
      );
      
      const { notifications } = get();
      const updatedNotifications = notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
      
      set({ 
        notifications: updatedNotifications,
        unreadCount
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/notifications/read-all`,
        {},
        { withCredentials: true }
      );
      
      const { notifications } = get();
      const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
      
      set({ 
        notifications: updatedNotifications,
        unreadCount: 0
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/notifications/${notificationId}`,
        { withCredentials: true }
      );
      
      const { notifications } = get();
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
      
      set({ 
        notifications: updatedNotifications,
        unreadCount
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  updatePreferences: async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/notifications/preferences`,
        newPreferences,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        set({ preferences: response.data.data });
      }
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  },

  addNotification: (notification: Notification) => {
    const { notifications, unreadCount } = get();
    set({ 
      notifications: [notification, ...notifications],
      unreadCount: unreadCount + 1
    });
  }
}));
