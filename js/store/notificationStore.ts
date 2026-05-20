import { create } from 'zustand';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  link?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifs: Notification[]) => void;
  addNotification: (notif: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  
  setNotifications: (notifs) => set({ 
    notifications: notifs,
    unreadCount: notifs.filter(n => !n.is_read).length
  }),
  
  addNotification: (notif) => set((state) => {
    const newNotifs = [notif, ...state.notifications];
    return {
      notifications: newNotifs,
      unreadCount: newNotifs.filter(n => !n.is_read).length
    };
  }),
  
  markAsRead: (id) => set((state) => {
    const newNotifs = state.notifications.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    );
    return {
      notifications: newNotifs,
      unreadCount: newNotifs.filter(n => !n.is_read).length
    };
  }),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, is_read: true })),
    unreadCount: 0
  })),
}));
