/**
 * Integration Listener
 * Provides event listening and integration capabilities for the pewpi-shared system
 */

class IntegrationListener {
  constructor() {
    this.listeners = new Map();
    this.eventQueue = [];
    this.maxQueueSize = 1000;
    this.processing = false;
  }

  /**
   * Register an event listener
   * @param {string} eventType - Type of event to listen for
   * @param {Function} handler - Handler function
   * @param {Object} options - Listener options
   * @returns {string} Listener ID
   */
  on(eventType, handler, options = {}) {
    const listenerId = this._generateListenerId();
    
    const listener = {
      id: listenerId,
      eventType: eventType,
      handler: handler,
      once: options.once || false,
      priority: options.priority || 0,
      filter: options.filter || null,
      created: Date.now()
    };

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const typeListeners = this.listeners.get(eventType);
    typeListeners.push(listener);
    
    // Sort by priority (higher priority first)
    typeListeners.sort((a, b) => b.priority - a.priority);

    return listenerId;
  }

  /**
   * Register a one-time event listener
   * @param {string} eventType - Type of event to listen for
   * @param {Function} handler - Handler function
   * @returns {string} Listener ID
   */
  once(eventType, handler) {
    return this.on(eventType, handler, { once: true });
  }

  /**
   * Remove an event listener
   * @param {string} listenerId - Listener ID to remove
   * @returns {boolean} Success status
   */
  off(listenerId) {
    for (const [eventType, listeners] of this.listeners.entries()) {
      const index = listeners.findIndex(l => l.id === listenerId);
      if (index > -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          this.listeners.delete(eventType);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Remove all listeners for an event type
   * @param {string} eventType - Event type
   */
  removeAllListeners(eventType) {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Emit an event
   * @param {string} eventType - Type of event
   * @param {*} data - Event data
   * @param {Object} options - Emit options
   */
  emit(eventType, data, options = {}) {
    const event = {
      id: this._generateEventId(),
      type: eventType,
      data: data,
      timestamp: Date.now(),
      source: options.source || 'unknown'
    };

    if (options.async !== false) {
      this._queueEvent(event);
    } else {
      this._processEvent(event);
    }
  }

  /**
   * Wait for a specific event
   * @param {string} eventType - Event type to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Promise that resolves with event data
   */
  waitFor(eventType, timeout = 30000) {
    return new Promise((resolve, reject) => {
      let listenerId;
      let timeoutId;

      const cleanup = () => {
        if (listenerId) this.off(listenerId);
        if (timeoutId) clearTimeout(timeoutId);
      };

      listenerId = this.once(eventType, (event) => {
        cleanup();
        resolve(event.data);
      });

      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`Timeout waiting for event: ${eventType}`));
        }, timeout);
      }
    });
  }

  /**
   * Get listener count for event type
   * @param {string} eventType - Event type
   * @returns {number} Number of listeners
   */
  listenerCount(eventType) {
    const listeners = this.listeners.get(eventType);
    return listeners ? listeners.length : 0;
  }

  /**
   * Get all registered event types
   * @returns {Array<string>} Array of event types
   */
  eventTypes() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Queue an event for processing
   * @private
   */
  _queueEvent(event) {
    this.eventQueue.push(event);
    
    // Limit queue size
    if (this.eventQueue.length > this.maxQueueSize) {
      this.eventQueue.shift();
    }

    if (!this.processing) {
      this._processQueue();
    }
  }

  /**
   * Process event queue
   * @private
   */
  async _processQueue() {
    if (this.processing) return;
    
    this.processing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      await this._processEvent(event);
    }

    this.processing = false;
  }

  /**
   * Process a single event
   * @private
   */
  async _processEvent(event) {
    const listeners = this.listeners.get(event.type);
    if (!listeners || listeners.length === 0) {
      return;
    }

    const toRemove = [];

    for (const listener of listeners) {
      // Apply filter if present
      if (listener.filter && !listener.filter(event)) {
        continue;
      }

      try {
        await listener.handler(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }

      // Mark for removal if it's a one-time listener
      if (listener.once) {
        toRemove.push(listener.id);
      }
    }

    // Remove one-time listeners
    toRemove.forEach(id => this.off(id));
  }

  /**
   * Generate listener ID
   * @private
   */
  _generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate event ID
   * @private
   */
  _generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IntegrationListener;
}
if (typeof window !== 'undefined') {
  window.IntegrationListener = IntegrationListener;
}
