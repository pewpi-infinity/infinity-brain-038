# Pewpi-Shared

A unified authentication, wallet, and token management library for the pewpi-infinity distributed brain network.

## Features

- 🔐 **Token Service**: Secure token generation, validation, and lifecycle management
- 👤 **Auth Service**: User authentication with session management
- 💰 **Wallet Unified**: Multi-wallet support with transaction tracking
- 🔌 **Integration Listener**: Event-driven architecture for loose coupling
- 🤖 **Machine Adapter**: State machine management for complex workflows
- 🎨 **UI Components**: Notifications and modals for user interaction

## Quick Start

### Browser

```html
<!-- Include all modules -->
<script src="src/pewpi-shared/token-service.js"></script>
<script src="src/pewpi-shared/auth-service.js"></script>
<script src="src/pewpi-shared/wallet-unified.js"></script>
<script src="src/pewpi-shared/integration-listener.js"></script>
<script src="src/pewpi-shared/machines/adapter.js"></script>
<script src="src/pewpi-shared/ui-notification.js"></script>
<script src="src/pewpi-shared/ui-modal.js"></script>
<script src="src/pewpi-shared/index-shim.js"></script>

<script>
  // Initialize
  PewpiShared.initialize();
  
  // Use modules
  const auth = PewpiShared.getModule('AuthService');
  const wallet = PewpiShared.getModule('WalletUnified');
</script>
```

### Node.js

```javascript
const TokenService = require('./src/pewpi-shared/token-service');
const AuthService = require('./src/pewpi-shared/auth-service');
const WalletUnified = require('./src/pewpi-shared/wallet-unified');

const tokenService = new TokenService();
const authService = new AuthService(tokenService);
const walletService = new WalletUnified();
```

## Core Modules

### TokenService

Generate and manage authentication tokens with expiration.

```javascript
const tokenService = PewpiShared.getModule('TokenService');
const token = tokenService.generateToken('auth', { userId: '123' }, 3600000);
const isValid = tokenService.validateToken(token.id);
```

### AuthService

Handle user authentication with session persistence.

```javascript
const authService = PewpiShared.getModule('AuthService');
const result = await authService.authenticate({ username: 'user@example.com' });
console.log('Authenticated:', result.success);
```

### WalletUnified

Manage multiple cryptocurrency wallets.

```javascript
const wallet = PewpiShared.getModule('WalletUnified');
const myWallet = wallet.createWallet({ type: 'ethereum', name: 'Main Wallet' });
wallet.updateBalance(myWallet.id, 1.5);
```

### IntegrationListener

Event-driven system integration.

```javascript
const listener = PewpiShared.getModule('IntegrationListener');
listener.on('payment.complete', (event) => {
  console.log('Payment:', event.data);
});
listener.emit('payment.complete', { amount: 100 });
```

### MachineAdapter

State machine for workflow management.

```javascript
const adapter = PewpiShared.getModule('MachineAdapter');
adapter.registerMachine('checkout', {
  initialState: 'cart',
  transitions: {
    cart: { CHECKOUT: 'payment' },
    payment: { SUCCESS: 'complete' }
  }
});
adapter.send('checkout', 'CHECKOUT');
```

## UI Components

### Notifications

```javascript
const notify = PewpiShared.getModule('UINotification');
notify.success('Operation completed!');
notify.error('Something went wrong');
```

### Modals

```javascript
const modal = PewpiShared.getModule('UIModal');
const confirmed = await modal.confirm('Are you sure?');
if (confirmed) {
  // Proceed
}
```

## Documentation

- [Integration Guide](./INTEGRATION.md) - Comprehensive integration documentation
- [API Reference](#modules) - Detailed API documentation

## Architecture

```
pewpi-shared/
├── token-service.js         # Token management
├── auth-service.js          # Authentication
├── wallet-unified.js        # Wallet operations
├── integration-listener.js  # Event system
├── machines/
│   └── adapter.js          # State machines
├── ui-notification.js       # UI notifications
├── ui-modal.js             # UI modals
├── index-shim.js           # Safe loader
├── INTEGRATION.md          # Integration guide
└── README.md               # This file
```

## Dependencies

The library has no external dependencies for core functionality. Optional dependencies:

- **dexie** - For IndexedDB storage (optional)
- **crypto-js** - For enhanced encryption (optional)

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Opera: Latest 2 versions

## Node.js Support

- Node.js 14.x or higher

## License

Part of the pewpi-infinity distributed brain network.

## Contributing

This library is designed for the pewpi-infinity ecosystem. For modifications or enhancements, please follow the existing code patterns and maintain backward compatibility.

## Version

**1.0.0** - Initial release

## Features Overview

### Security
- Token expiration management
- Session persistence
- Secure storage adapters

### Flexibility
- Modular architecture
- Multiple storage backends
- Event-driven design

### Reliability
- Defensive initialization
- Graceful degradation
- Error isolation

### Developer Experience
- Simple API
- Comprehensive documentation
- No external dependencies (core)

## Example Application

```javascript
// Initialize system
PewpiShared.initialize({
  storage: localStorage,
  notification: { position: 'top-right' }
});

// Authenticate user
const auth = PewpiShared.getModule('AuthService');
const result = await auth.authenticate({ 
  username: 'user@example.com' 
});

if (result.success) {
  // Create wallet
  const wallet = PewpiShared.getModule('WalletUnified');
  const myWallet = wallet.createWallet({ 
    type: 'ethereum', 
    name: 'Main Wallet' 
  });
  
  // Show notification
  const notify = PewpiShared.getModule('UINotification');
  notify.success('Wallet created successfully!');
  
  // Setup listeners
  const listener = PewpiShared.getModule('IntegrationListener');
  listener.on('transaction.confirmed', (event) => {
    notify.success(`Transaction confirmed: ${event.data.hash}`);
  });
}
```

## Support

For issues, questions, or contributions related to pewpi-shared, please refer to the main pewpi-infinity repository.
