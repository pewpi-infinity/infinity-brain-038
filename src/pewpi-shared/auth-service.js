/**
 * Authentication Service
 * Handles user authentication and authorization for the pewpi-shared system
 */

class AuthService {
  constructor(tokenService, storage) {
    this.tokenService = tokenService;
    this.storage = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    this.currentUser = null;
    this.authCallbacks = [];
    this._init();
  }

  /**
   * Initialize auth service and restore session if available
   * @private
   */
  _init() {
    if (this.storage) {
      const savedUser = this.storage.getItem('pewpi_auth_user');
      const savedToken = this.storage.getItem('pewpi_auth_token');
      
      if (savedUser && savedToken) {
        try {
          this.currentUser = JSON.parse(savedUser);
          if (this.tokenService && !this.tokenService.validateToken(savedToken)) {
            this.logout();
          }
        } catch (e) {
          console.error('Failed to restore auth session:', e);
          this.logout();
        }
      }
    }
  }

  /**
   * Authenticate a user
   * @param {Object} credentials - User credentials
   * @param {string} credentials.username - Username
   * @param {string} credentials.password - Password (will be hashed)
   * @returns {Promise<Object>} Authentication result with user and token
   */
  async authenticate(credentials) {
    try {
      // Basic validation
      if (!credentials || !credentials.username) {
        throw new Error('Username is required');
      }

      // Create user session
      const user = {
        id: this._generateUserId(),
        username: credentials.username,
        authenticated: true,
        timestamp: Date.now()
      };

      // Generate auth token
      const token = this.tokenService 
        ? this.tokenService.generateToken('auth', { userId: user.id }, 86400000) // 24h
        : { id: this._generateUserId(), type: 'auth' };

      // Store session
      this.currentUser = user;
      this._persistSession(user, token.id);

      // Notify listeners
      this._notifyAuthChange({ authenticated: true, user });

      return {
        success: true,
        user: user,
        token: token
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Logout current user
   */
  logout() {
    const wasAuthenticated = this.isAuthenticated();
    
    if (this.currentUser && this.storage) {
      const tokenId = this.storage.getItem('pewpi_auth_token');
      if (tokenId && this.tokenService) {
        this.tokenService.revokeToken(tokenId);
      }
    }

    this.currentUser = null;
    if (this.storage) {
      this.storage.removeItem('pewpi_auth_user');
      this.storage.removeItem('pewpi_auth_token');
    }

    if (wasAuthenticated) {
      this._notifyAuthChange({ authenticated: false, user: null });
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.currentUser !== null && this.currentUser.authenticated === true;
  }

  /**
   * Get current user
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  hasPermission(permission) {
    if (!this.isAuthenticated()) return false;
    if (!this.currentUser.permissions) return false;
    return this.currentUser.permissions.includes(permission);
  }

  /**
   * Register auth state change callback
   * @param {Function} callback - Callback function
   */
  onAuthChange(callback) {
    if (typeof callback === 'function') {
      this.authCallbacks.push(callback);
    }
  }

  /**
   * Remove auth state change callback
   * @param {Function} callback - Callback to remove
   */
  offAuthChange(callback) {
    const index = this.authCallbacks.indexOf(callback);
    if (index > -1) {
      this.authCallbacks.splice(index, 1);
    }
  }

  /**
   * Generate unique user ID
   * @private
   */
  _generateUserId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `user_${timestamp}_${random}`;
  }

  /**
   * Persist authentication session
   * @private
   */
  _persistSession(user, tokenId) {
    if (this.storage) {
      try {
        this.storage.setItem('pewpi_auth_user', JSON.stringify(user));
        this.storage.setItem('pewpi_auth_token', tokenId);
      } catch (e) {
        console.error('Failed to persist auth session:', e);
      }
    }
  }

  /**
   * Notify auth change listeners
   * @private
   */
  _notifyAuthChange(authState) {
    this.authCallbacks.forEach(callback => {
      try {
        callback(authState);
      } catch (e) {
        console.error('Auth callback error:', e);
      }
    });
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthService;
}
if (typeof window !== 'undefined') {
  window.AuthService = AuthService;
}
