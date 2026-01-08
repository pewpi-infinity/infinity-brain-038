/**
 * Token Service
 * Handles token generation, validation, and storage for the pewpi-shared system
 */

class TokenService {
  constructor(storage) {
    this.storage = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    this.tokenCache = new Map();
  }

  /**
   * Generate a new token
   * @param {string} type - Token type (e.g., 'auth', 'session', 'api')
   * @param {Object} payload - Token payload data
   * @param {number} expiresIn - Expiration time in milliseconds
   * @returns {Object} Token object with id, value, type, and expiry
   */
  generateToken(type, payload = {}, expiresIn = 3600000) {
    const tokenId = this._generateId();
    const timestamp = Date.now();
    const expiry = timestamp + expiresIn;
    
    const token = {
      id: tokenId,
      type: type,
      value: this._encodePayload(payload),
      created: timestamp,
      expiry: expiry,
      payload: payload
    };

    this.tokenCache.set(tokenId, token);
    this._persistToken(token);
    
    return {
      id: token.id,
      value: token.value,
      type: token.type,
      expiry: token.expiry
    };
  }

  /**
   * Validate a token
   * @param {string} tokenId - Token ID to validate
   * @returns {boolean} True if token is valid and not expired
   */
  validateToken(tokenId) {
    const token = this.getToken(tokenId);
    if (!token) return false;
    
    const now = Date.now();
    if (token.expiry && token.expiry < now) {
      this.revokeToken(tokenId);
      return false;
    }
    
    return true;
  }

  /**
   * Retrieve a token
   * @param {string} tokenId - Token ID
   * @returns {Object|null} Token object or null if not found
   */
  getToken(tokenId) {
    if (this.tokenCache.has(tokenId)) {
      return this.tokenCache.get(tokenId);
    }
    
    if (this.storage) {
      const stored = this.storage.getItem(`token_${tokenId}`);
      if (stored) {
        try {
          const token = JSON.parse(stored);
          this.tokenCache.set(tokenId, token);
          return token;
        } catch (e) {
          console.error('Failed to parse stored token:', e);
        }
      }
    }
    
    return null;
  }

  /**
   * Revoke a token
   * @param {string} tokenId - Token ID to revoke
   */
  revokeToken(tokenId) {
    this.tokenCache.delete(tokenId);
    if (this.storage) {
      this.storage.removeItem(`token_${tokenId}`);
    }
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpired() {
    const now = Date.now();
    const toRemove = [];
    
    this.tokenCache.forEach((token, id) => {
      if (token.expiry && token.expiry < now) {
        toRemove.push(id);
      }
    });
    
    toRemove.forEach(id => this.revokeToken(id));
  }

  /**
   * Generate a unique token ID
   * @private
   */
  _generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  }

  /**
   * Encode payload to token value
   * @private
   */
  _encodePayload(payload) {
    if (typeof btoa !== 'undefined') {
      return btoa(JSON.stringify(payload));
    }
    // Node.js fallback
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(JSON.stringify(payload)).toString('base64');
    }
    return JSON.stringify(payload);
  }

  /**
   * Persist token to storage
   * @private
   */
  _persistToken(token) {
    if (this.storage) {
      try {
        this.storage.setItem(`token_${token.id}`, JSON.stringify(token));
      } catch (e) {
        console.error('Failed to persist token:', e);
      }
    }
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TokenService;
}
if (typeof window !== 'undefined') {
  window.TokenService = TokenService;
}
