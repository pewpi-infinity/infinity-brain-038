/**
 * UI Modal Shim
 * Provides a lightweight modal dialog system
 */

class UIModal {
  constructor() {
    this.overlay = null;
    this.modal = null;
    this.isOpen = false;
    this.onCloseCallback = null;
  }

  /**
   * Show a modal
   * @param {Object} config - Modal configuration
   * @param {string} config.title - Modal title
   * @param {string} config.content - Modal content (HTML or text)
   * @param {Array} config.buttons - Array of button configurations
   * @param {boolean} config.closeOnOverlay - Close on overlay click
   */
  show(config = {}) {
    if (this.isOpen) {
      this.close();
    }

    this._createModal(config);
    this.isOpen = true;

    // Add to DOM
    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(this.overlay);
      document.body.appendChild(this.modal);
      
      // Trigger animation
      setTimeout(() => {
        this.overlay.style.opacity = '1';
        this.modal.style.opacity = '1';
        this.modal.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 10);
    }
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.isOpen) return;

    if (this.overlay) {
      this.overlay.style.opacity = '0';
    }
    if (this.modal) {
      this.modal.style.opacity = '0';
      this.modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
    }

    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.overlay = null;
      this.modal = null;
      this.isOpen = false;

      if (this.onCloseCallback) {
        this.onCloseCallback();
        this.onCloseCallback = null;
      }
    }, 300);
  }

  /**
   * Register close callback
   * @param {Function} callback - Callback function
   */
  onClose(callback) {
    this.onCloseCallback = callback;
  }

  /**
   * Show confirm dialog
   * @param {string} message - Confirmation message
   * @param {Object} options - Dialog options
   * @returns {Promise<boolean>} Promise resolving to true/false
   */
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      this.show({
        title: options.title || 'Confirm',
        content: message,
        buttons: [
          {
            text: options.cancelText || 'Cancel',
            type: 'secondary',
            onClick: () => {
              this.close();
              resolve(false);
            }
          },
          {
            text: options.confirmText || 'Confirm',
            type: 'primary',
            onClick: () => {
              this.close();
              resolve(true);
            }
          }
        ],
        closeOnOverlay: options.closeOnOverlay !== false
      });
    });
  }

  /**
   * Show alert dialog
   * @param {string} message - Alert message
   * @param {Object} options - Dialog options
   * @returns {Promise<void>}
   */
  alert(message, options = {}) {
    return new Promise((resolve) => {
      this.show({
        title: options.title || 'Alert',
        content: message,
        buttons: [
          {
            text: options.buttonText || 'OK',
            type: 'primary',
            onClick: () => {
              this.close();
              resolve();
            }
          }
        ],
        closeOnOverlay: options.closeOnOverlay !== false
      });
    });
  }

  /**
   * Create modal elements
   * @private
   */
  _createModal(config) {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    if (config.closeOnOverlay !== false) {
      this.overlay.addEventListener('click', () => this.close());
    }

    // Create modal
    this.modal = document.createElement('div');
    this.modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      z-index: 9999;
      max-width: 500px;
      width: 90%;
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    // Create header
    if (config.title) {
      const header = document.createElement('div');
      header.style.cssText = `
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        font-weight: 600;
        font-size: 18px;
        color: #333;
      `;
      header.textContent = config.title;
      this.modal.appendChild(header);
    }

    // Create content
    if (config.content) {
      const content = document.createElement('div');
      content.style.cssText = `
        padding: 20px;
        color: #666;
        line-height: 1.5;
      `;
      
      if (config.content.includes('<')) {
        content.innerHTML = config.content;
      } else {
        content.textContent = config.content;
      }
      
      this.modal.appendChild(content);
    }

    // Create buttons
    if (config.buttons && config.buttons.length > 0) {
      const footer = document.createElement('div');
      footer.style.cssText = `
        padding: 15px 20px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      `;

      config.buttons.forEach(btnConfig => {
        const button = document.createElement('button');
        button.textContent = btnConfig.text || 'Button';
        
        const isPrimary = btnConfig.type === 'primary';
        button.style.cssText = `
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          background: ${isPrimary ? '#2196F3' : '#f5f5f5'};
          color: ${isPrimary ? 'white' : '#666'};
          transition: background 0.2s ease;
        `;

        button.addEventListener('click', () => {
          if (btnConfig.onClick) {
            btnConfig.onClick();
          } else {
            this.close();
          }
        });

        footer.appendChild(button);
      });

      this.modal.appendChild(footer);
    }
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIModal;
}
if (typeof window !== 'undefined') {
  window.UIModal = UIModal;
}
