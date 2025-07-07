/**
 * @jest-environment jsdom
 */
const NotificationService = require('../../js/services/NotificationService');

describe('NotificationService', () => {
  let notificationService;
  let originalDocument;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    notificationService = new NotificationService();
    
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    notificationService.clearAllNotifications();
  });

  describe('constructor', () => {
    test('should initialize with empty notifications set', () => {
      expect(notificationService.notifications).toBeInstanceOf(Set);
      expect(notificationService.notifications.size).toBe(0);
    });

    test('should initialize styles', () => {
      const styleElement = document.getElementById('notification-styles');
      expect(styleElement).toBeTruthy();
      expect(styleElement.textContent).toContain('.notification');
    });

    test('should not duplicate styles on multiple instances', () => {
      new NotificationService();
      const styleElements = document.querySelectorAll('#notification-styles');
      expect(styleElements.length).toBe(1);
    });
  });

  describe('createNotificationElement', () => {
    test('should create notification element with correct structure', () => {
      const element = notificationService.createNotificationElement('Test message', 'success');
      
      expect(element.tagName).toBe('DIV');
      expect(element.className).toBe('notification notification--success');
      expect(element.textContent).toBe('Test message');
    });

    test('should add click handler for dismissal', () => {
      const element = notificationService.createNotificationElement('Test', 'info');
      const clickSpy = jest.spyOn(notificationService, 'removeNotification');
      
      element.click();
      
      expect(clickSpy).toHaveBeenCalledWith(element);
    });
  });

  describe('showNotification', () => {
    test('should show notification with default parameters', () => {
      const notification = notificationService.showNotification('Test message');
      
      expect(document.body.contains(notification)).toBe(true);
      expect(notification.className).toContain('notification--info');
      expect(notification.textContent).toBe('Test message');
      expect(notificationService.notifications.has(notification)).toBe(true);
    });

    test('should show notification with custom type and duration', () => {
      const notification = notificationService.showNotification('Error message', 'error', 5000);
      
      expect(notification.className).toContain('notification--error');
      expect(notification.textContent).toBe('Error message');
    });

    test('should auto-remove notification after duration', () => {
      const notification = notificationService.showNotification('Test', 'info', 3000);
      const removeSpy = jest.spyOn(notificationService, 'removeNotification');
      
      jest.advanceTimersByTime(3000);
      
      expect(removeSpy).toHaveBeenCalledWith(notification);
    });

    test('should not auto-remove notification with duration 0', () => {
      const notification = notificationService.showNotification('Persistent', 'info', 0);
      const removeSpy = jest.spyOn(notificationService, 'removeNotification');
      
      jest.advanceTimersByTime(5000);
      
      expect(removeSpy).not.toHaveBeenCalled();
      expect(document.body.contains(notification)).toBe(true);
    });
  });

  describe('positionNotification', () => {
    test('should position first notification at top', () => {
      const notification = notificationService.createNotificationElement('First', 'info');
      notificationService.positionNotification(notification);
      
      expect(notification.style.top).toBe('20px');
    });

    test('should stack multiple notifications', () => {
      // Create first notification
      const first = notificationService.showNotification('First', 'info', 0);
      
      // Mock getBoundingClientRect for first notification
      first.getBoundingClientRect = jest.fn().mockReturnValue({
        bottom: 60 // 20px top + 40px height
      });
      
      // Create second notification
      const second = notificationService.createNotificationElement('Second', 'info');
      notificationService.positionNotification(second);
      
      expect(parseInt(second.style.top)).toBeGreaterThan(20);
    });
  });

  describe('removeNotification', () => {
    test('should remove notification from DOM and set', async () => {
      const notification = notificationService.showNotification('Test', 'info', 0);
      
      notificationService.removeNotification(notification);
      
      expect(notification.className).toContain('notification--slide-out');
      
      // Fast-forward animation
      jest.advanceTimersByTime(300);
      
      expect(document.body.contains(notification)).toBe(false);
      expect(notificationService.notifications.has(notification)).toBe(false);
    });

    test('should handle removing non-existent notification gracefully', () => {
      const fakeElement = document.createElement('div');
      
      expect(() => {
        notificationService.removeNotification(fakeElement);
      }).not.toThrow();
    });

    test('should handle null notification gracefully', () => {
      expect(() => {
        notificationService.removeNotification(null);
      }).not.toThrow();
    });
  });

  describe('repositionNotifications', () => {
    test('should reposition remaining notifications after removal', () => {
      const first = notificationService.showNotification('First', 'info', 0);
      const second = notificationService.showNotification('Second', 'info', 0);
      
      // Mock getBoundingClientRect
      first.getBoundingClientRect = jest.fn().mockReturnValue({ bottom: 60 });
      second.getBoundingClientRect = jest.fn().mockReturnValue({ bottom: 100 });
      
      notificationService.repositionNotifications();
      
      expect(first.style.top).toBe('20px');
      expect(parseInt(second.style.top)).toBeGreaterThan(60);
    });
  });

  describe('clearAllNotifications', () => {
    test('should remove all notifications', () => {
      notificationService.showNotification('First', 'info', 0);
      notificationService.showNotification('Second', 'error', 0);
      notificationService.showNotification('Third', 'success', 0);
      
      expect(notificationService.getNotificationCount()).toBe(3);
      
      notificationService.clearAllNotifications();
      
      // Fast-forward all animations
      jest.advanceTimersByTime(300);
      
      expect(notificationService.getNotificationCount()).toBe(0);
    });
  });

  describe('convenience methods', () => {
    test('showSuccess should create success notification', () => {
      const notification = notificationService.showSuccess('Success!');
      expect(notification.className).toContain('notification--success');
      expect(notification.textContent).toBe('Success!');
    });

    test('showError should create error notification', () => {
      const notification = notificationService.showError('Error!');
      expect(notification.className).toContain('notification--error');
      expect(notification.textContent).toBe('Error!');
    });

    test('showInfo should create info notification', () => {
      const notification = notificationService.showInfo('Info!');
      expect(notification.className).toContain('notification--info');
      expect(notification.textContent).toBe('Info!');
    });

    test('showWarning should create warning notification', () => {
      const notification = notificationService.showWarning('Warning!');
      expect(notification.className).toContain('notification--warning');
      expect(notification.textContent).toBe('Warning!');
    });

    test('showPersistent should create persistent notification', () => {
      const notification = notificationService.showPersistent('Persistent message');
      const removeSpy = jest.spyOn(notificationService, 'removeNotification');
      
      jest.advanceTimersByTime(5000);
      
      expect(removeSpy).not.toHaveBeenCalled();
      expect(document.body.contains(notification)).toBe(true);
    });
  });

  describe('utility methods', () => {
    test('getNotificationCount should return correct count', () => {
      expect(notificationService.getNotificationCount()).toBe(0);
      
      notificationService.showNotification('First', 'info', 0);
      expect(notificationService.getNotificationCount()).toBe(1);
      
      notificationService.showNotification('Second', 'info', 0);
      expect(notificationService.getNotificationCount()).toBe(2);
    });

    test('hasNotifications should return correct boolean', () => {
      expect(notificationService.hasNotifications()).toBe(false);
      
      notificationService.showNotification('Test', 'info', 0);
      expect(notificationService.hasNotifications()).toBe(true);
    });

    test('should not count removed notifications', () => {
      const notification = notificationService.showNotification('Test', 'info', 0);
      expect(notificationService.getNotificationCount()).toBe(1);
      
      notificationService.removeNotification(notification);
      jest.advanceTimersByTime(300);
      
      expect(notificationService.getNotificationCount()).toBe(0);
      expect(notificationService.hasNotifications()).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle very long messages', () => {
      const longMessage = 'A'.repeat(500);
      const notification = notificationService.showNotification(longMessage, 'info');
      
      expect(notification.textContent).toBe(longMessage);
      expect(notification.style.maxWidth).toBeFalsy(); // CSS handles this
    });

    test('should handle empty messages', () => {
      const notification = notificationService.showNotification('', 'info');
      expect(notification.textContent).toBe('');
    });

    test('should handle special characters in messages', () => {
      const specialMessage = '<script>alert("xss")</script> & symbols';
      const notification = notificationService.showNotification(specialMessage, 'info');
      
      // textContent should escape HTML
      expect(notification.innerHTML).not.toContain('<script>');
      expect(notification.textContent).toContain('script');
    });

    test('should handle rapid notification creation', () => {
      for (let i = 0; i < 10; i++) {
        notificationService.showNotification(`Message ${i}`, 'info', 0);
      }
      
      expect(notificationService.getNotificationCount()).toBe(10);
    });
  });

  describe('CSS styles integration', () => {
    test('should inject correct CSS classes', () => {
      const styleElement = document.getElementById('notification-styles');
      const cssText = styleElement.textContent;
      
      expect(cssText).toContain('.notification--success');
      expect(cssText).toContain('.notification--error');
      expect(cssText).toContain('.notification--info');
      expect(cssText).toContain('.notification--warning');
      expect(cssText).toContain('@keyframes slideIn');
      expect(cssText).toContain('@keyframes slideOut');
    });

    test('should use CSS variables for colors', () => {
      const styleElement = document.getElementById('notification-styles');
      const cssText = styleElement.textContent;
      
      expect(cssText).toContain('var(--color-success');
      expect(cssText).toContain('var(--color-error');
      expect(cssText).toContain('var(--color-info');
      expect(cssText).toContain('var(--color-warning');
    });
  });
});