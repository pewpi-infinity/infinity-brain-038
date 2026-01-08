# Pewpi-Shared Integration Guide

## Overview

The pewpi-shared library provides a unified authentication, wallet, and token management system for the pewpi-infinity distributed brain network. This document describes how to integrate and use the library safely.

## Architecture

The pewpi-shared system consists of the following core modules:

- **TokenService**: Token generation, validation, and storage
- **AuthService**: User authentication and authorization
- **WalletUnified**: Multi-wallet management system
- **IntegrationListener**: Event-driven integration framework
- **MachineAdapter**: State machine management
- **UI Components**: Notification and modal systems

## Installation

### Browser Usage

Include the modules in your HTML in the correct order:

```html
<!-- Core modules (order matters) -->
<script src="src/pewpi-shared/token-service.js"></script>
<script src="src/pewpi-shared/auth-service.js"></script>
<script src="src/pewpi-shared/wallet-unified.js"></script>
<script src="src/pewpi-shared/integration-listener.js"></script>
<script src="src/pewpi-shared/machines/adapter.js"></script>

<!-- UI modules (optional) -->
<script src="src/pewpi-shared/ui-notification.js"></script>
<script src="src/pewpi-shared/ui-modal.js"></script>

<!-- Initialize -->
<script src="src/pewpi-shared/index-shim.js"></script>
```

### Node.js Usage

```javascript
const TokenService = require('./src/pewpi-shared/token-service');
const AuthService = require('./src/pewpi-shared/auth-service');
const WalletUnified = require('./src/pewpi-shared/wallet-unified');
const IntegrationListener = require('./src/pewpi-shared/integration-listener');
const MachineAdapter = require('./src/pewpi-shared/machines/adapter');
```

## Initialization

### Automatic Initialization (Browser)

Set up configuration before including index-shim.js:

```html
<script>
  window.PewpiSharedConfig = {
    storage: localStorage, // or custom storage adapter
    notification: {
      position: 'top-right',
      maxNotifications: 5
    }
  };
</script>
<script src="src/pewpi-shared/index-shim.js"></script>
```

### Manual Initialization

```javascript
// Wait for DOMContentLoaded or manual trigger
PewpiShared.initialize({
  storage: localStorage,
  notification: { position: 'top-right' }
});

// Check if ready
if (PewpiShared.isReady()) {
  console.log('System ready!');
}

// Get status
const status = PewpiShared.getStatus();
console.log('Loaded modules:', status.modules);
```

## Module Usage

### TokenService

Generate, validate, and manage tokens:

```javascript
const tokenService = PewpiShared.getModule('TokenService');

// Generate a token
const token = tokenService.generateToken('auth', 
  { userId: 'user123' }, 
  3600000 // 1 hour expiry
);

// Validate token
const isValid = tokenService.validateToken(token.id);

// Retrieve token
const retrievedToken = tokenService.getToken(token.id);

// Revoke token
tokenService.revokeToken(token.id);

// Cleanup expired tokens
tokenService.cleanupExpired();
```

### AuthService

Handle user authentication:

```javascript
const authService = PewpiShared.getModule('AuthService');

// Authenticate user
const result = await authService.authenticate({
  username: 'user@example.com',
  password: 'securepassword'
});

if (result.success) {
  console.log('Authenticated:', result.user);
  console.log('Token:', result.token);
}

// Check authentication status
const isAuthenticated = authService.isAuthenticated();

// Get current user
const user = authService.getCurrentUser();

// Listen to auth changes
authService.onAuthChange((authState) => {
  console.log('Auth changed:', authState);
});

// Logout
authService.logout();
```

### WalletUnified

Manage multiple wallets:

```javascript
const wallet = PewpiShared.getModule('WalletUnified');

// Create wallet
const newWallet = wallet.createWallet({
  type: 'ethereum',
  name: 'My ETH Wallet'
});

// Set active wallet
wallet.setActiveWallet(newWallet.id);

// Get active wallet
const active = wallet.getActiveWallet();

// Update balance
wallet.updateBalance(newWallet.id, 1.5);

// Add token
wallet.addToken(newWallet.id, {
  symbol: 'USDT',
  name: 'Tether',
  balance: 100
});

// Record transaction
wallet.recordTransaction(newWallet.id, {
  type: 'transfer',
  amount: 0.5,
  from: active.address,
  to: '0x...',
  hash: '0xabc...'
});

// Listen to wallet changes
wallet.onWalletChange((change) => {
  console.log('Wallet change:', change);
});
```

### IntegrationListener

Event-driven integration:

```javascript
const listener = PewpiShared.getModule('IntegrationListener');

// Register listener
const listenerId = listener.on('user.login', (event) => {
  console.log('User logged in:', event.data);
}, { priority: 10 });

// One-time listener
listener.once('wallet.created', (event) => {
  console.log('Wallet created:', event.data);
});

// Emit event
listener.emit('user.login', { userId: 'user123' });

// Wait for event
try {
  const data = await listener.waitFor('payment.complete', 30000);
  console.log('Payment completed:', data);
} catch (error) {
  console.error('Timeout waiting for payment');
}

// Remove listener
listener.off(listenerId);
```

### MachineAdapter

State machine management:

```javascript
const adapter = PewpiShared.getModule('MachineAdapter');

// Register machine
adapter.registerMachine('payment', {
  initialState: 'idle',
  states: {
    idle: {},
    processing: {},
    completed: {},
    failed: {}
  },
  transitions: {
    idle: { START: 'processing' },
    processing: { 
      SUCCESS: 'completed',
      FAIL: 'failed'
    },
    completed: { RESET: 'idle' },
    failed: { RESET: 'idle' }
  },
  context: { amount: 0 }
});

// Send event
const result = adapter.send('payment', 'START');
console.log('Transition:', result);

// Check state
const isProcessing = adapter.isInState('payment', 'processing');

// Get context
const context = adapter.getContext('payment');

// Listen to state changes
adapter.onStateChange('payment', (change) => {
  console.log('State changed:', change);
});
```

### UI Components

#### Notifications

```javascript
const notification = PewpiShared.getModule('UINotification');

notification.info('Operation started');
notification.success('Operation completed');
notification.warning('Low balance');
notification.error('Operation failed');
```

#### Modals

```javascript
const modal = PewpiShared.getModule('UIModal');

// Alert
await modal.alert('Operation completed!');

// Confirm
const confirmed = await modal.confirm('Are you sure?');
if (confirmed) {
  // User confirmed
}

// Custom modal
modal.show({
  title: 'Custom Dialog',
  content: '<p>Custom HTML content</p>',
  buttons: [
    {
      text: 'Cancel',
      type: 'secondary',
      onClick: () => modal.close()
    },
    {
      text: 'Proceed',
      type: 'primary',
      onClick: () => {
        // Handle action
        modal.close();
      }
    }
  ]
});
```

## Error Handling

The pewpi-shared system uses defensive initialization. Failed modules won't crash the system:

```javascript
// Check initialization status
const status = PewpiShared.getStatus();
console.log('Errors:', status.errors);

// Check if module loaded
const tokenService = PewpiShared.getModule('TokenService');
if (!tokenService) {
  console.error('TokenService failed to load');
  // Fallback logic
}
```

## Security Considerations

1. **Token Management**: Tokens are stored in localStorage by default. For sensitive applications, provide a custom secure storage adapter.

2. **Authentication**: The default AuthService provides basic authentication. Integrate with your backend authentication system for production use.

3. **Storage**: All modules accept a custom storage adapter for server-side or secure storage solutions.

## Custom Storage Adapter

Implement a custom storage adapter:

```javascript
class SecureStorage {
  setItem(key, value) {
    // Encrypted storage logic
  }
  
  getItem(key) {
    // Retrieve and decrypt
  }
  
  removeItem(key) {
    // Remove from storage
  }
}

const secureStorage = new SecureStorage();
PewpiShared.initialize({ storage: secureStorage });
```

## Best Practices

1. **Initialize Early**: Initialize pewpi-shared at application startup
2. **Error Handling**: Always check if modules loaded successfully
3. **Event Cleanup**: Remove event listeners when components unmount
4. **Token Lifecycle**: Set appropriate expiration times for tokens
5. **State Machines**: Use state machines for complex workflows

## Support

For issues or questions, please refer to the main repository documentation or contact the pewpi-infinity team.

## Version

Current version: 1.0.0
