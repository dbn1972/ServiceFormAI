import { OfflineStore } from './offlineStore';

export class EncryptionService {
  constructor(private offlineStore: OfflineStore) {}

  /**
   * Returns true if the Web Crypto API is available (requires HTTPS or localhost).
   */
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.crypto?.subtle;
  }

  /**
   * Retrieves an existing AES-GCM key for the consumer, or generates and stores a new one.
   */
  async getOrCreateKey(consumerId: string): Promise<CryptoKey> {
    const existing = await this.offlineStore.getEncryptionKey(consumerId);
    if (existing) return existing;

    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-exportable
      ['encrypt', 'decrypt'],
    );

    await this.offlineStore.saveEncryptionKey(consumerId, key);
    return key;
  }

  /**
   * Encrypts arbitrary JSON-serializable data for the given consumer.
   * Generates a unique 12-byte IV per operation.
   */
  async encrypt(
    consumerId: string,
    data: unknown,
  ): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
    const key = await this.getOrCreateKey(consumerId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    return { ciphertext, iv };
  }

  /**
   * Decrypts ciphertext back to the original data for the given consumer.
   */
  async decrypt<T>(consumerId: string, ciphertext: ArrayBuffer, iv: Uint8Array): Promise<T> {
    const key = await this.getOrCreateKey(consumerId);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded) as T;
  }

  /**
   * Deletes the encryption key for the given consumer (on logout or session clear).
   */
  async deleteKey(consumerId: string): Promise<void> {
    await this.offlineStore.deleteEncryptionKey(consumerId);
  }
}
