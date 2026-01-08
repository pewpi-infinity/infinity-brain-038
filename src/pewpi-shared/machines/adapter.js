/**
 * Machine Adapter
 * Provides state machine integration and adaptation for the pewpi-shared system
 */

class MachineAdapter {
  constructor() {
    this.machines = new Map();
    this.transitions = new Map();
    this.stateCallbacks = new Map();
  }

  /**
   * Register a state machine
   * @param {string} machineId - Unique machine identifier
   * @param {Object} config - Machine configuration
   * @returns {Object} Machine instance
   */
  registerMachine(machineId, config = {}) {
    if (this.machines.has(machineId)) {
      console.warn(`Machine ${machineId} already registered, overwriting`);
    }

    const machine = {
      id: machineId,
      currentState: config.initialState || 'idle',
      states: config.states || {},
      context: config.context || {},
      history: [],
      created: Date.now()
    };

    this.machines.set(machineId, machine);
    this.transitions.set(machineId, new Map());
    this.stateCallbacks.set(machineId, []);

    // Register transitions if provided
    if (config.transitions) {
      Object.entries(config.transitions).forEach(([from, transitions]) => {
        Object.entries(transitions).forEach(([event, to]) => {
          this.registerTransition(machineId, from, event, to);
        });
      });
    }

    return machine;
  }

  /**
   * Register a state transition
   * @param {string} machineId - Machine identifier
   * @param {string} fromState - Source state
   * @param {string} event - Event that triggers transition
   * @param {string|Function} toStateOrHandler - Target state or handler function
   */
  registerTransition(machineId, fromState, event, toStateOrHandler) {
    const machineTransitions = this.transitions.get(machineId);
    if (!machineTransitions) {
      throw new Error(`Machine ${machineId} not registered`);
    }

    const key = `${fromState}:${event}`;
    machineTransitions.set(key, toStateOrHandler);
  }

  /**
   * Send an event to a machine
   * @param {string} machineId - Machine identifier
   * @param {string} event - Event name
   * @param {*} payload - Event payload
   * @returns {Object} Transition result
   */
  send(machineId, event, payload = null) {
    const machine = this.machines.get(machineId);
    if (!machine) {
      throw new Error(`Machine ${machineId} not found`);
    }

    const machineTransitions = this.transitions.get(machineId);
    const key = `${machine.currentState}:${event}`;
    const transition = machineTransitions.get(key);

    if (!transition) {
      console.warn(`No transition for ${machineId} from ${machine.currentState} on ${event}`);
      return {
        success: false,
        fromState: machine.currentState,
        toState: machine.currentState,
        event: event
      };
    }

    const fromState = machine.currentState;
    let toState;
    let transitionData = {};

    // Handle function transitions
    if (typeof transition === 'function') {
      const result = transition(machine.context, payload);
      toState = result.state || machine.currentState;
      transitionData = result.data || {};
      
      // Update context if provided
      if (result.context) {
        machine.context = { ...machine.context, ...result.context };
      }
    } else {
      toState = transition;
    }

    // Execute transition
    machine.currentState = toState;
    machine.history.push({
      fromState: fromState,
      toState: toState,
      event: event,
      payload: payload,
      timestamp: Date.now()
    });

    // Limit history size
    if (machine.history.length > 100) {
      machine.history = machine.history.slice(-100);
    }

    // Notify state change callbacks
    this._notifyStateChange(machineId, {
      fromState: fromState,
      toState: toState,
      event: event,
      payload: payload,
      context: machine.context,
      ...transitionData
    });

    return {
      success: true,
      fromState: fromState,
      toState: toState,
      event: event,
      context: machine.context
    };
  }

  /**
   * Get current state of a machine
   * @param {string} machineId - Machine identifier
   * @returns {string|null} Current state
   */
  getState(machineId) {
    const machine = this.machines.get(machineId);
    return machine ? machine.currentState : null;
  }

  /**
   * Get machine context
   * @param {string} machineId - Machine identifier
   * @returns {Object|null} Machine context
   */
  getContext(machineId) {
    const machine = this.machines.get(machineId);
    return machine ? machine.context : null;
  }

  /**
   * Update machine context
   * @param {string} machineId - Machine identifier
   * @param {Object} updates - Context updates
   */
  updateContext(machineId, updates) {
    const machine = this.machines.get(machineId);
    if (machine) {
      machine.context = { ...machine.context, ...updates };
    }
  }

  /**
   * Check if machine is in a specific state
   * @param {string} machineId - Machine identifier
   * @param {string} state - State to check
   * @returns {boolean}
   */
  isInState(machineId, state) {
    const machine = this.machines.get(machineId);
    return machine ? machine.currentState === state : false;
  }

  /**
   * Get machine history
   * @param {string} machineId - Machine identifier
   * @param {number} limit - Maximum number of entries
   * @returns {Array} History entries
   */
  getHistory(machineId, limit = 10) {
    const machine = this.machines.get(machineId);
    if (!machine) return [];
    
    return machine.history.slice(-limit);
  }

  /**
   * Register state change callback
   * @param {string} machineId - Machine identifier
   * @param {Function} callback - Callback function
   */
  onStateChange(machineId, callback) {
    const callbacks = this.stateCallbacks.get(machineId);
    if (callbacks && typeof callback === 'function') {
      callbacks.push(callback);
    }
  }

  /**
   * Remove state change callback
   * @param {string} machineId - Machine identifier
   * @param {Function} callback - Callback to remove
   */
  offStateChange(machineId, callback) {
    const callbacks = this.stateCallbacks.get(machineId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Reset machine to initial state
   * @param {string} machineId - Machine identifier
   * @param {boolean} clearHistory - Whether to clear history
   */
  reset(machineId, clearHistory = false) {
    const machine = this.machines.get(machineId);
    if (!machine) return;

    const machineTransitions = this.transitions.get(machineId);
    
    // Find initial state from first registered transition or use 'idle'
    let initialState = 'idle';
    if (machineTransitions) {
      for (const key of machineTransitions.keys()) {
        const [state] = key.split(':');
        initialState = state;
        break;
      }
    }

    machine.currentState = initialState;
    machine.context = {};
    
    if (clearHistory) {
      machine.history = [];
    }
  }

  /**
   * Remove a machine
   * @param {string} machineId - Machine identifier
   */
  unregisterMachine(machineId) {
    this.machines.delete(machineId);
    this.transitions.delete(machineId);
    this.stateCallbacks.delete(machineId);
  }

  /**
   * Get all registered machines
   * @returns {Array} Array of machine IDs
   */
  getMachines() {
    return Array.from(this.machines.keys());
  }

  /**
   * Notify state change callbacks
   * @private
   */
  _notifyStateChange(machineId, changeData) {
    const callbacks = this.stateCallbacks.get(machineId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(changeData);
        } catch (error) {
          console.error(`Error in state change callback for ${machineId}:`, error);
        }
      });
    }
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MachineAdapter;
}
if (typeof window !== 'undefined') {
  window.MachineAdapter = MachineAdapter;
}
