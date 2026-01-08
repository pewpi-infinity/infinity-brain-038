/**
 * UI Notification Shim
 * Provides a lightweight notification system for UI updates
 */

class UINotification {
  constructor(options = {}) {
    this.container = null;
    this.notifications = [];
    this.maxNotifications = options.maxNotifications || 5;
    this.defaultDuration = options.defaultDuration || 3000;
    this.position = options.position || 'top-right';
    this._init();
  }

  /**
   * Initialize notification system
   * @private
   */
  _init() {
    if (typeof document === 'undefined') return;

    this.container = document.createElement('div');
    this.container.id = 'pewpi-notifications';
    this.container.style.cssText = this._getContainerStyles();
    
    if (document.body) {
      document.body.appendChild(this.container);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.container);
      });
    }
  }

  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {Object} options - Notification options
   */
  show(message, options = {}) {
    if (!this.container) return;

    const notification = {
      id: this._generateId(),
      message: message,
      type: options.type || 'info',
      duration: options.duration !== undefined ? options.duration : this.defaultDuration
    };

    const element = this._createElement(notification);
    this.container.appendChild(element);
    this.notifications.push({ ...notification, element });

    // Auto-remove if duration is set
    if (notification.duration > 0) {
      setTimeout(() => this.remove(notification.id), notification.duration);
    }

    // Remove oldest if exceeding max
    if (this.notifications.length > this.maxNotifications) {
      const oldest = this.notifications[0];
      this.remove(oldest.id);
    }
  }

  /**
   * Show info notification
   * @param {string} message - Message
   */
  info(message) {
    this.show(message, { type: 'info' });
  }

  /**
   * Show success notification
   * @param {string} message - Message
   */
  success(message) {
    this.show(message, { type: 'success' });
  }

  /**
   * Show warning notification
   * @param {string} message - Message
   */
  warning(message) {
    this.show(message, { type: 'warning' });
  }

  /**
   * Show error notification
   * @param {string} message - Message
   */
  error(message) {
    this.show(message, { type: 'error', duration: 5000 });
  }

  /**
   * Remove a notification
   * @param {string} id - Notification ID
   */
  remove(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) return;

    const notification = this.notifications[index];
    if (notification.element && notification.element.parentNode) {
      notification.element.style.opacity = '0';
      setTimeout(() => {
        if (notification.element.parentNode) {
          notification.element.parentNode.removeChild(notification.element);
        }
      }, 300);
    }

    this.notifications.splice(index, 1);
  }

  /**
   * Clear all notifications
   */
  clear() {
    this.notifications.forEach(n => this.remove(n.id));
  }

  /**
   * Create notification element
   * @private
   */
  _createElement(notification) {
    const element = document.createElement('div');
    element.className = `pewpi-notification pewpi-notification-${notification.type}`;
    element.style.cssText = this._getNotificationStyles(notification.type);
    element.textContent = notification.message;

    element.addEventListener('click', () => this.remove(notification.id));

    return element;
  }

  /**
   * Get container styles
   * @private
   */
  _getContainerStyles() {
    const positions = {
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;',
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;'
    };

    return `
      position: fixed;
      ${positions[this.position] || positions['top-right']}
      z-index: 10000;
      pointer-events: none;
    `;
  }

  /**
   * Get notification styles
   * @private
   */
  _getNotificationStyles(type) {
    const colors = {
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336'
    };

    return `
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 20px;
      margin-bottom: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      cursor: pointer;
      pointer-events: auto;
      transition: opacity 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
    `;
  }

  /**
   * Generate unique ID
   * @private
   */
  _generateId() {
    return `notification_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UINotification;
}
if (typeof window !== 'undefined') {
  window.UINotification = UINotification;
}
