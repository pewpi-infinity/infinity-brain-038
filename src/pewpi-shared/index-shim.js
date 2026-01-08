/**
 * Pewpi-Shared Index Shim
 * Safe initialization loader for the pewpi-shared system
 * 
 * This loader initializes all pewpi-shared modules defensively,
 * ensuring graceful degradation if any component fails to load.
 */

(function(global) {
  'use strict';

  // Create namespace
  const PewpiShared = {
    version: '1.0.0',
    initialized: false,
    modules: {},
    errors: []
  };

  /**
   * Safe module loader
   * @param {string} name - Module name
   * @param {Function} loader - Loader function
   */
  function loadModule(name, loader) {
    try {
      PewpiShared.modules[name] = loader();
      console.log(`[PewpiShared] Loaded: ${name}`);
      return true;
    } catch (error) {
      console.error(`[PewpiShared] Failed to load ${name}:`, error);
      PewpiShared.errors.push({ module: name, error: error.message });
      return false;
    }
  }

  /**
   * Initialize pewpi-shared system
   * @param {Object} config - Configuration options
   */
  function initialize(config = {}) {
    if (PewpiShared.initialized) {
      console.warn('[PewpiShared] Already initialized');
      return PewpiShared;
    }

    console.log('[PewpiShared] Initializing...');

    // Storage provider (defaults to localStorage in browser)
    const storage = config.storage || (typeof window !== 'undefined' ? window.localStorage : null);

    // Load core modules defensively
    loadModule('TokenService', () => {
      if (typeof TokenService !== 'undefined') {
        return new TokenService(storage);
      }
      throw new Error('TokenService not found');
    });

    loadModule('AuthService', () => {
      if (typeof AuthService !== 'undefined') {
        return new AuthService(PewpiShared.modules.TokenService, storage);
      }
      throw new Error('AuthService not found');
    });

    loadModule('WalletUnified', () => {
      if (typeof WalletUnified !== 'undefined') {
        return new WalletUnified(storage);
      }
      throw new Error('WalletUnified not found');
    });

    loadModule('IntegrationListener', () => {
      if (typeof IntegrationListener !== 'undefined') {
        return new IntegrationListener();
      }
      throw new Error('IntegrationListener not found');
    });

    loadModule('MachineAdapter', () => {
      if (typeof MachineAdapter !== 'undefined') {
        return new MachineAdapter();
      }
      throw new Error('MachineAdapter not found');
    });

    // Load UI modules (optional, may not be available in all environments)
    loadModule('UINotification', () => {
      if (typeof UINotification !== 'undefined') {
        return new UINotification(config.notification || {});
      }
      throw new Error('UINotification not found');
    });

    loadModule('UIModal', () => {
      if (typeof UIModal !== 'undefined') {
        return new UIModal();
      }
      throw new Error('UIModal not found');
    });

    PewpiShared.initialized = true;

    // Setup periodic token cleanup if TokenService loaded
    if (PewpiShared.modules.TokenService) {
      setInterval(() => {
        try {
          PewpiShared.modules.TokenService.cleanupExpired();
        } catch (e) {
          console.error('[PewpiShared] Token cleanup error:', e);
        }
      }, 300000); // Every 5 minutes
    }

    // Log initialization result
    const loadedCount = Object.keys(PewpiShared.modules).length;
    const totalModules = 7;
    console.log(`[PewpiShared] Initialized: ${loadedCount}/${totalModules} modules loaded`);
    
    if (PewpiShared.errors.length > 0) {
      console.warn('[PewpiShared] Errors during initialization:', PewpiShared.errors);
    }

    return PewpiShared;
  }

  /**
   * Get module instance
   * @param {string} name - Module name
   * @returns {*} Module instance or null
   */
  function getModule(name) {
    return PewpiShared.modules[name] || null;
  }

  /**
   * Check if system is ready
   * @returns {boolean}
   */
  function isReady() {
    return PewpiShared.initialized;
  }

  /**
   * Get system status
   * @returns {Object}
   */
  function getStatus() {
    return {
      initialized: PewpiShared.initialized,
      version: PewpiShared.version,
      modules: Object.keys(PewpiShared.modules),
      errors: PewpiShared.errors
    };
  }

  // Expose API
  PewpiShared.initialize = initialize;
  PewpiShared.getModule = getModule;
  PewpiShared.isReady = isReady;
  PewpiShared.getStatus = getStatus;

  // Export to global scope
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PewpiShared;
  }
  if (typeof global !== 'undefined') {
    global.PewpiShared = PewpiShared;
  }
  if (typeof window !== 'undefined') {
    window.PewpiShared = PewpiShared;
  }

  // Auto-initialize if config is provided
  if (typeof window !== 'undefined' && window.PewpiSharedConfig) {
    window.addEventListener('DOMContentLoaded', function() {
      initialize(window.PewpiSharedConfig);
    });
  }

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
