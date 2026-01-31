import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export type NotificationType = 'info' | 'warning' | 'success' | 'assignment' | 'message';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  from?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'academy-notifications';

function loadNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((n: Notification) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
    }
  } catch (e) {
    console.warn('Failed to load notifications:', e);
  }
  return getDefaultNotifications();
}

function saveNotifications(notifications: Notification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.warn('Failed to save notifications:', e);
  }
}

function getDefaultNotifications(): Notification[] {
  return [
    {
      id: 'welcome-1',
      title: 'Welcome to The Academy',
      message: 'Your journey begins now. Explore the campus and meet your fellow students.',
      type: 'info',
      timestamp: new Date(),
      read: false,
    },
    {
      id: 'assignment-1',
      title: 'Assignment Due Soon',
      message: 'Mathematical Reasoning Chapter 1 quiz is due tomorrow.',
      type: 'assignment',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
    },
    {
      id: 'message-1',
      title: 'New Message from Censorium',
      message: 'You have received a message from the Censorium faction representative.',
      type: 'message',
      timestamp: new Date(Date.now() - 7200000),
      read: false,
      from: 'Censorium Faction',
    },
  ];
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => loadNotifications());

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextType {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
}

export { NotificationsContext };
