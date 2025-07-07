class NotificationService {
  constructor() {
    this.notifications = new Set();
    this.initializeStyles();
  }

  initializeStyles() {
    if (document.getElementById('notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 1001;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
      }
      
      .notification--success {
        background: var(--color-success, #10b981);
      }
      
      .notification--error {
        background: var(--color-error, #ef4444);
      }
      
      .notification--info {
        background: var(--color-info, #3b82f6);
      }
      
      .notification--warning {
        background: var(--color-warning, #f59e0b);
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .notification--slide-out {
        animation: slideOut 0.3s ease-in !important;
      }
      
      .notification--stack {
        position: relative;
        margin-bottom: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  showNotification(message, type = 'info', duration = 3000) {
    const notification = this.createNotificationElement(message, type);
    this.positionNotification(notification);
    document.body.appendChild(notification);
    this.notifications.add(notification);

    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }

    return notification;
  }

  createNotificationElement(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    notification.addEventListener('click', () => {
      this.removeNotification(notification);
    });
    
    return notification;
  }

  positionNotification(newNotification) {
    const existingNotifications = Array.from(this.notifications);
    let topOffset = 20;
    
    existingNotifications.forEach(notification => {
      if (notification.parentNode) {
        const rect = notification.getBoundingClientRect();
        topOffset = Math.max(topOffset, rect.bottom + 8);
      }
    });
    
    newNotification.style.top = `${topOffset}px`;
  }

  removeNotification(notification) {
    if (!notification || !notification.parentNode) return;
    
    notification.classList.add('notification--slide-out');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.notifications.delete(notification);
      this.repositionNotifications();
    }, 300);
  }

  repositionNotifications() {
    const existingNotifications = Array.from(this.notifications).filter(n => n.parentNode);
    let topOffset = 20;
    
    existingNotifications.forEach(notification => {
      notification.style.top = `${topOffset}px`;
      const rect = notification.getBoundingClientRect();
      topOffset = rect.bottom + 8;
    });
  }

  clearAllNotifications() {
    this.notifications.forEach(notification => {
      this.removeNotification(notification);
    });
  }

  showSuccess(message, duration = 3000) {
    return this.showNotification(message, 'success', duration);
  }

  showError(message, duration = 5000) {
    return this.showNotification(message, 'error', duration);
  }

  showInfo(message, duration = 3000) {
    return this.showNotification(message, 'info', duration);
  }

  showWarning(message, duration = 4000) {
    return this.showNotification(message, 'warning', duration);
  }

  showPersistent(message, type = 'info') {
    return this.showNotification(message, type, 0);
  }

  getNotificationCount() {
    return Array.from(this.notifications).filter(n => n.parentNode).length;
  }

  hasNotifications() {
    return this.getNotificationCount() > 0;
  }
}

if (typeof window !== 'undefined') {
  window.NotificationService = NotificationService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationService;
}