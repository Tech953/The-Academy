import { useState, useEffect } from 'react';
import { X, Bell, MessageCircle, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';

export type NotificationType = 'info' | 'warning' | 'success' | 'message' | 'assignment';

interface FuzzyBubbleNotificationProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  from?: string;
  onDismiss: (id: string) => void;
  autoHide?: boolean;
  duration?: number;
}

const TYPE_CONFIG: Record<NotificationType, { color: string; icon: React.ReactNode }> = {
  info: { color: '#00ffff', icon: <Bell size={16} /> },
  warning: { color: '#ffaa00', icon: <AlertTriangle size={16} /> },
  success: { color: '#00ff00', icon: <CheckCircle size={16} /> },
  message: { color: '#00ff00', icon: <MessageCircle size={16} /> },
  assignment: { color: '#cc66ff', icon: <BookOpen size={16} /> },
};

export function FuzzyBubbleNotification({
  id,
  type,
  title,
  message,
  from,
  onDismiss,
  autoHide = true,
  duration = 5000,
}: FuzzyBubbleNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const config = TYPE_CONFIG[type];

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    if (autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300);
  };

  return (
    <div
      className="fuzzy-bubble"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        maxWidth: '320px',
        background: `linear-gradient(135deg, ${config.color}15 0%, ${config.color}08 100%)`,
        borderColor: `${config.color}40`,
        boxShadow: `0 0 25px ${config.color}20, inset 0 0 15px ${config.color}08`,
        transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(120%)',
        opacity: isVisible && !isExiting ? 1 : 0,
        transition: 'all 0.3s ease-out',
        marginBottom: '10px',
      }}
    >
      <div style={{
        color: config.color,
        filter: `drop-shadow(0 0 6px ${config.color})`,
        flexShrink: 0,
        marginTop: '2px',
      }}>
        {config.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '4px',
        }}>
          <span style={{
            color: config.color,
            fontWeight: 'bold',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            textShadow: `0 0 8px ${config.color}60`,
          }}>
            {title}
          </span>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: `${config.color}80`,
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {from && (
          <div style={{
            fontSize: '10px',
            color: `${config.color}80`,
            marginBottom: '4px',
          }}>
            {'>'} from {from}
          </div>
        )}

        <div style={{
          fontSize: '11px',
          color: '#aaa',
          lineHeight: '1.4',
          wordBreak: 'break-word',
        }}>
          {message}
        </div>
      </div>
    </div>
  );
}

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  from?: string;
}

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
    }}>
      {notifications.map((notification) => (
        <FuzzyBubbleNotification
          key={notification.id}
          {...notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (notification: Omit<NotificationItem, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
  };
}
