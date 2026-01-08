#!/usr/bin/env node
/**
 * Test script to verify pewpi-shared modules load correctly in Node.js
 */

console.log('🧱 Testing Pewpi-Shared Modules...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    failed++;
  }
}

// Test TokenService
test('TokenService loads', () => {
  const TokenService = require('./src/pewpi-shared/token-service.js');
  if (typeof TokenService !== 'function') throw new Error('Not a constructor');
  
  const service = new TokenService();
  if (!service.generateToken) throw new Error('Missing generateToken method');
  if (!service.validateToken) throw new Error('Missing validateToken method');
});

// Test AuthService
test('AuthService loads', () => {
  const AuthService = require('./src/pewpi-shared/auth-service.js');
  if (typeof AuthService !== 'function') throw new Error('Not a constructor');
  
  const service = new AuthService();
  if (!service.authenticate) throw new Error('Missing authenticate method');
  if (!service.isAuthenticated) throw new Error('Missing isAuthenticated method');
});

// Test WalletUnified
test('WalletUnified loads', () => {
  const WalletUnified = require('./src/pewpi-shared/wallet-unified.js');
  if (typeof WalletUnified !== 'function') throw new Error('Not a constructor');
  
  const wallet = new WalletUnified();
  if (!wallet.createWallet) throw new Error('Missing createWallet method');
  if (!wallet.getActiveWallet) throw new Error('Missing getActiveWallet method');
});

// Test IntegrationListener
test('IntegrationListener loads', () => {
  const IntegrationListener = require('./src/pewpi-shared/integration-listener.js');
  if (typeof IntegrationListener !== 'function') throw new Error('Not a constructor');
  
  const listener = new IntegrationListener();
  if (!listener.on) throw new Error('Missing on method');
  if (!listener.emit) throw new Error('Missing emit method');
});

// Test MachineAdapter
test('MachineAdapter loads', () => {
  const MachineAdapter = require('./src/pewpi-shared/machines/adapter.js');
  if (typeof MachineAdapter !== 'function') throw new Error('Not a constructor');
  
  const adapter = new MachineAdapter();
  if (!adapter.registerMachine) throw new Error('Missing registerMachine method');
  if (!adapter.send) throw new Error('Missing send method');
});

// Test functional integration
test('TokenService generates tokens', () => {
  const TokenService = require('./src/pewpi-shared/token-service.js');
  const service = new TokenService();
  
  const token = service.generateToken('test', { data: 'value' }, 3600000);
  if (!token.id) throw new Error('Token missing id');
  if (!token.value) throw new Error('Token missing value');
  if (token.type !== 'test') throw new Error('Token type mismatch');
  
  const isValid = service.validateToken(token.id);
  if (!isValid) throw new Error('Token validation failed');
});

test('AuthService authenticates users', async () => {
  const AuthService = require('./src/pewpi-shared/auth-service.js');
  const service = new AuthService();
  
  const result = await service.authenticate({ username: 'test@example.com' });
  if (!result.success) throw new Error('Authentication failed');
  if (!result.user) throw new Error('No user returned');
  if (!result.token) throw new Error('No token returned');
  
  const isAuth = service.isAuthenticated();
  if (!isAuth) throw new Error('Not authenticated after login');
});

test('WalletUnified creates wallets', () => {
  const WalletUnified = require('./src/pewpi-shared/wallet-unified.js');
  const wallet = new WalletUnified();
  
  const newWallet = wallet.createWallet({ type: 'ethereum', name: 'Test' });
  if (!newWallet.id) throw new Error('Wallet missing id');
  if (!newWallet.address) throw new Error('Wallet missing address');
  
  wallet.setActiveWallet(newWallet.id);
  const active = wallet.getActiveWallet();
  if (active.id !== newWallet.id) throw new Error('Active wallet mismatch');
});

test('IntegrationListener handles events', (done) => {
  const IntegrationListener = require('./src/pewpi-shared/integration-listener.js');
  const listener = new IntegrationListener();
  
  let eventReceived = false;
  listener.on('test.event', (event) => {
    if (event.data.test === 'value') {
      eventReceived = true;
    }
  });
  
  listener.emit('test.event', { test: 'value' });
  
  // Give async processing time
  setTimeout(() => {
    if (!eventReceived) throw new Error('Event not received');
  }, 100);
});

test('MachineAdapter manages state', () => {
  const MachineAdapter = require('./src/pewpi-shared/machines/adapter.js');
  const adapter = new MachineAdapter();
  
  adapter.registerMachine('test', {
    initialState: 'idle',
    transitions: {
      idle: { START: 'running' },
      running: { STOP: 'idle' }
    }
  });
  
  const initialState = adapter.getState('test');
  if (initialState !== 'idle') throw new Error('Initial state incorrect');
  
  const result = adapter.send('test', 'START');
  if (!result.success) throw new Error('Transition failed');
  if (result.toState !== 'running') throw new Error('State not updated');
  
  const currentState = adapter.getState('test');
  if (currentState !== 'running') throw new Error('State mismatch');
});

// Summary
setTimeout(() => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(50)}`);
  
  if (failed === 0) {
    console.log('✓ All tests passed!');
    process.exit(0);
  } else {
    console.error('✗ Some tests failed');
    process.exit(1);
  }
}, 200);
