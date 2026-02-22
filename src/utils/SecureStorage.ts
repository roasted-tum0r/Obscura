import { Compressor } from "./Compressor";
import { encrypt, decrypt } from "./Crypto";

/**
 * SecureStorage provides high-level utilities for compressing and encrypting strings.
 * This is used to store sensitive editor content in memory or external storage (like Gists).
 */
export const SecureStorage = {
    /**
     * Encrypts a string by compressing it first, then encoding to Base64, then encrypting.
     * @param text The plain text string to encrypt.
     * @param key The CryptoKey to use for encryption.
     * @returns An object containing the base64 encoded IV and encrypted data.
     */
    async encryptString(text: string, key: CryptoKey): Promise<{ iv: string, data: string }> {
        // 1. Compress the string using Gzip
        const compressed = await Compressor.compressGzip(text);

        // 2. Convert compressed bytes to Base64 (Intermediate step as requested)
        const compressedBase64 = Compressor.toBase64(compressed);

        // 3. Encrypt the Base64 string
        return await encrypt(compressedBase64, key);
    },

    /**
     * Decrypts a string by decrypting first, then decoding Base64, then decompressing.
     * @param data The encrypted data (base64).
     * @param iv The initialization vector (base64).
     * @param key The CryptoKey to use for decryption.
     * @returns The original plain text string.
     */
    async decryptString(data: string, iv: string, key: CryptoKey): Promise<string> {
        // 1. Decrypt the data back to the intermediate Base64 string
        const decryptedBase64 = await decrypt(data, iv, key);

        // 2. Convert Base64 back to compressed bytes
        const compressedBytes = Compressor.fromBase64(decryptedBase64);

        // 3. Decompress the bytes back to the original string
        return await Compressor.decompressGzip(compressedBytes);
    }
}
