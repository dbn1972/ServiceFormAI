/**
 * Unit tests for EncryptionService
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.6, 11.7
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { OfflineStore } from '../offlineStore';
import { EncryptionService } from '../encryptionService';

// Use fake-indexeddb for all tests
function createStore(): OfflineStore {
  // Each test gets a fresh IDB instance
  (globalThis as any).indexedDB = new IDBFactory();
  return new OfflineStore();
}

describe('EncryptionService', () => {
  let store: OfflineStore;
  let service: EncryptionService;

  beforeEach(() => {
    store = createStore();
    service = new EncryptionService(store);
  });

  // (a) isAvailable() returns true in jsdom with window.crypto.subtle
  it('isAvailable() returns true when window.crypto.subtle is present', () => {
    expect(EncryptionService.isAvailable()).toBe(true);
  });

  // (f) isAvailable() returns false when window.crypto is undefined
  it('isAvailable() returns false when window.crypto is undefined', () => {
    // Spy on window.crypto and return undefined
    const spy = vi.spyOn(window, 'crypto', 'get').mockReturnValue(undefined as any);
    expect(EncryptionService.isAvailable()).toBe(false);
    spy.mockRestore();
  });

  // (b) encrypt then decrypt returns original data for strings
  it('encrypt then decrypt returns original string data', async () => {
    const data = 'hello world';
    const { ciphertext, iv } = await service.encrypt('user1', data);
    const result = await service.decrypt<string>('user1', ciphertext, iv);
    expect(result).toBe(data);
  });

  // (b) encrypt then decrypt returns original data for numbers
  it('encrypt then decrypt returns original number data', async () => {
    const data = 42;
    const { ciphertext, iv } = await service.encrypt('user1', data);
    const result = await service.decrypt<number>('user1', ciphertext, iv);
    expect(result).toBe(data);
  });

  // (b) encrypt then decrypt returns original data for nested objects
  it('encrypt then decrypt returns original nested object', async () => {
    const data = { name: 'Ananya', age: 25, address: { city: 'Mumbai', pin: '400001' } };
    const { ciphertext, iv } = await service.encrypt('user1', data);
    const result = await service.decrypt<typeof data>('user1', ciphertext, iv);
    expect(result).toEqual(data);
  });

  // (b) encrypt then decrypt returns original data for arrays
  it('encrypt then decrypt returns original array data', async () => {
    const data = [1, 'two', { three: 3 }];
    const { ciphertext, iv } = await service.encrypt('user1', data);
    const result = await service.decrypt<typeof data>('user1', ciphertext, iv);
    expect(result).toEqual(data);
  });

  // (c) encrypting the same data twice produces different ciphertexts (IV uniqueness)
  it('encrypting the same data twice produces different ciphertexts', async () => {
    const data = { field: 'value' };
    const enc1 = await service.encrypt('user1', data);
    const enc2 = await service.encrypt('user1', data);

    // IVs should be different
    expect(Buffer.from(enc1.iv).toString('hex')).not.toBe(
      Buffer.from(enc2.iv).toString('hex'),
    );

    // Ciphertexts should be different (different IVs produce different ciphertexts)
    expect(Buffer.from(enc1.ciphertext).toString('hex')).not.toBe(
      Buffer.from(enc2.ciphertext).toString('hex'),
    );
  });

  // (d) decrypting with wrong consumer ID throws
  it('decrypting with wrong consumer ID throws', async () => {
    const data = { secret: 'value' };
    const { ciphertext, iv } = await service.encrypt('user1', data);

    // user2 has a different key — decryption should fail
    await expect(service.decrypt('user2', ciphertext, iv)).rejects.toThrow();
  });

  // (e) deleteKey() removes key from store
  it('deleteKey() removes key from store so next encrypt generates a new key', async () => {
    const data = { field: 'value' };
    const { ciphertext, iv } = await service.encrypt('user1', data);

    // Delete the key
    await service.deleteKey('user1');

    // After deletion, decrypting with old ciphertext should fail (new key generated)
    await expect(service.decrypt('user1', ciphertext, iv)).rejects.toThrow();
  });
});
