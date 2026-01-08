/**
 * Unified Wallet Service
 * Provides a unified interface for wallet operations across the pewpi-shared system
 */

class WalletUnified {
  constructor(storage) {
    this.storage = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    this.wallets = new Map();
    this.activeWallet = null;
    this.walletCallbacks = [];
    this._init();
  }

  /**
   * Initialize wallet service
   * @private
   */
  _init() {
    if (this.storage) {
      const savedWallets = this.storage.getItem('pewpi_wallets');
      const activeWalletId = this.storage.getItem('pewpi_active_wallet');
      
      if (savedWallets) {
        try {
          const walletsData = JSON.parse(savedWallets);
          walletsData.forEach(wallet => {
            this.wallets.set(wallet.id, wallet);
          });
          
          if (activeWalletId && this.wallets.has(activeWalletId)) {
            this.activeWallet = this.wallets.get(activeWalletId);
          }
        } catch (e) {
          console.error('Failed to restore wallets:', e);
        }
      }
    }
  }

  /**
   * Create a new wallet
   * @param {Object} config - Wallet configuration
   * @param {string} config.type - Wallet type (e.g., 'ethereum', 'bitcoin', 'custom')
   * @param {string} config.name - Wallet name
   * @returns {Object} Created wallet
   */
  createWallet(config = {}) {
    const wallet = {
      id: this._generateWalletId(),
      type: config.type || 'custom',
      name: config.name || `Wallet ${this.wallets.size + 1}`,
      address: this._generateAddress(config.type),
      balance: 0,
      tokens: [],
      transactions: [],
      created: Date.now(),
      metadata: config.metadata || {}
    };

    this.wallets.set(wallet.id, wallet);
    this._persistWallets();
    this._notifyWalletChange({ action: 'created', wallet });

    return wallet;
  }

  /**
   * Get wallet by ID
   * @param {string} walletId - Wallet ID
   * @returns {Object|null} Wallet or null
   */
  getWallet(walletId) {
    return this.wallets.get(walletId) || null;
  }

  /**
   * Get all wallets
   * @returns {Array} Array of wallets
   */
  getAllWallets() {
    return Array.from(this.wallets.values());
  }

  /**
   * Set active wallet
   * @param {string} walletId - Wallet ID to activate
   * @returns {boolean} Success status
   */
  setActiveWallet(walletId) {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      console.error('Wallet not found:', walletId);
      return false;
    }

    this.activeWallet = wallet;
    if (this.storage) {
      this.storage.setItem('pewpi_active_wallet', walletId);
    }
    
    this._notifyWalletChange({ action: 'activated', wallet });
    return true;
  }

  /**
   * Get active wallet
   * @returns {Object|null} Active wallet or null
   */
  getActiveWallet() {
    return this.activeWallet;
  }

  /**
   * Update wallet balance
   * @param {string} walletId - Wallet ID
   * @param {number} amount - New balance amount
   */
  updateBalance(walletId, amount) {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      console.error('Wallet not found:', walletId);
      return;
    }

    wallet.balance = amount;
    wallet.lastUpdated = Date.now();
    this._persistWallets();
    this._notifyWalletChange({ action: 'balance_updated', wallet });
  }

  /**
   * Add token to wallet
   * @param {string} walletId - Wallet ID
   * @param {Object} token - Token details
   */
  addToken(walletId, token) {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      console.error('Wallet not found:', walletId);
      return;
    }

    const tokenEntry = {
      id: token.id || this._generateTokenId(),
      symbol: token.symbol,
      name: token.name,
      balance: token.balance || 0,
      decimals: token.decimals || 18,
      added: Date.now()
    };

    wallet.tokens.push(tokenEntry);
    this._persistWallets();
    this._notifyWalletChange({ action: 'token_added', wallet, token: tokenEntry });
  }

  /**
   * Record a transaction
   * @param {string} walletId - Wallet ID
   * @param {Object} transaction - Transaction details
   */
  recordTransaction(walletId, transaction) {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      console.error('Wallet not found:', walletId);
      return;
    }

    const txEntry = {
      id: transaction.id || this._generateTxId(),
      type: transaction.type || 'transfer',
      amount: transaction.amount,
      from: transaction.from,
      to: transaction.to,
      timestamp: Date.now(),
      status: transaction.status || 'pending',
      hash: transaction.hash
    };

    wallet.transactions.unshift(txEntry);
    
    // Keep only last 100 transactions
    if (wallet.transactions.length > 100) {
      wallet.transactions = wallet.transactions.slice(0, 100);
    }

    this._persistWallets();
    this._notifyWalletChange({ action: 'transaction_recorded', wallet, transaction: txEntry });
  }

  /**
   * Delete wallet
   * @param {string} walletId - Wallet ID to delete
   * @returns {boolean} Success status
   */
  deleteWallet(walletId) {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      return false;
    }

    this.wallets.delete(walletId);
    
    if (this.activeWallet && this.activeWallet.id === walletId) {
      this.activeWallet = null;
      if (this.storage) {
        this.storage.removeItem('pewpi_active_wallet');
      }
    }

    this._persistWallets();
    this._notifyWalletChange({ action: 'deleted', wallet });
    return true;
  }

  /**
   * Register wallet change callback
   * @param {Function} callback - Callback function
   */
  onWalletChange(callback) {
    if (typeof callback === 'function') {
      this.walletCallbacks.push(callback);
    }
  }

  /**
   * Remove wallet change callback
   * @param {Function} callback - Callback to remove
   */
  offWalletChange(callback) {
    const index = this.walletCallbacks.indexOf(callback);
    if (index > -1) {
      this.walletCallbacks.splice(index, 1);
    }
  }

  /**
   * Generate wallet ID
   * @private
   */
  _generateWalletId() {
    return `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate wallet address
   * @private
   */
  _generateAddress(type) {
    const prefix = type === 'ethereum' ? '0x' : '';
    const hash = Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return `${prefix}${hash}`;
  }

  /**
   * Generate token ID
   * @private
   */
  _generateTokenId() {
    return `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate transaction ID
   * @private
   */
  _generateTxId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Persist wallets to storage
   * @private
   */
  _persistWallets() {
    if (this.storage) {
      try {
        const walletsArray = Array.from(this.wallets.values());
        this.storage.setItem('pewpi_wallets', JSON.stringify(walletsArray));
      } catch (e) {
        console.error('Failed to persist wallets:', e);
      }
    }
  }

  /**
   * Notify wallet change listeners
   * @private
   */
  _notifyWalletChange(changeData) {
    this.walletCallbacks.forEach(callback => {
      try {
        callback(changeData);
      } catch (e) {
        console.error('Wallet callback error:', e);
      }
    });
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WalletUnified;
}
if (typeof window !== 'undefined') {
  window.WalletUnified = WalletUnified;
}
