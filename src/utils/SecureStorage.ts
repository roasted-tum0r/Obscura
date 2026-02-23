import { Compressor } from "./Compressor";
import { encrypt, decrypt, exportKey } from "./Crypto";
import type { INoteAppSettings } from "../types/Types";

/**
 * SecureStorage provides high-level utilities for compressing and encrypting strings.
 * V2 implements a multi-layer pipeline:
 * - Outer: Session-encrypted metadata + encrypted content (or encrypted Gid).
 * - Inner: Password/Session-encrypted content.
 */
export const SecureStorage = {
    // --- V1 (Backward Compatibility) ---
    async encryptString(text: string, key: CryptoKey): Promise<{ iv: string, data: string }> {
        const compressed = await Compressor.compressGzip(text);
        const compressedBase64 = Compressor.toBase64(compressed);
        return await encrypt(compressedBase64, key);
    },

    async decryptString(data: string, iv: string, key: CryptoKey): Promise<string> {
        const decryptedBase64 = await decrypt(data, iv, key);
        const compressedBytes = Compressor.fromBase64(decryptedBase64);
        return await Compressor.decompressGzip(compressedBytes);
    },

    // --- V2 (Multi-layer Pipeline) ---
    async v2Encrypt(
        content: string,
        innerKey: CryptoKey,
        settings: INoteAppSettings,
        outerKey: CryptoKey,
        onGistSave?: (encryptedContent: string) => Promise<string>
    ): Promise<{ hash: string, settings: INoteAppSettings }> {
        console.log(`[STEP 1] [SecureStorage.ts:27] v2Encrypt: Starting Inner Layer encryption. Mode: ${settings.mode}`);
        
        // 1. Inner Layer: Content -> Gzip -> Encrypt
        const compressed = await Compressor.compressGzip(content);
        const b64 = Compressor.toBase64(compressed);
        const innerResult = await encrypt(b64, innerKey);
        console.log(`[STEP 2] [SecureStorage.ts:36] v2Encrypt: Inner Layer encrypted. Payload size: ${innerResult.data.length}`);

        let finalD = innerResult.data;
        let finalIv = innerResult.iv;
        let storageType: "url" | "gist" = "url";
        let gistIv: string | undefined = undefined;

        // 2. Storage Check (> 2k chars)
        if (innerResult.data.length > 2000 && onGistSave) {
            console.log(`[STORAGE-DEBUG] v2Encrypt: Content length ${innerResult.data.length} > 2k. Moving to Gist.`);
            const gid = await onGistSave(innerResult.data);
            
            // The content IV is innerResult.iv. We need to save this!
            gistIv = innerResult.iv; 

            // IMPORTANT: Gzip the Gid string before encrypting it, 
            // so decryptString (which always decompressGzip) works correctly and consistently.
            const compressedGid = await Compressor.compressGzip(gid);
            const gidB64 = Compressor.toBase64(compressedGid);

            // Encrypt Gid with innerKey. We'll use a NEW IV for the Gid itself.
            const gidResult = await encrypt(gidB64, innerKey);
            finalD = gidResult.data;
            finalIv = gidResult.iv; // This is the IV for the Gid
            storageType = "gist";
            console.log(`[STORAGE-DEBUG] v2Encrypt: Gid encrypted (gzipped). Gid IV: ${finalIv.slice(0, 8)}, Content IV: ${gistIv.slice(0, 8)}`);
        }

        // 3. Update Settings Object
        const updatedSettings: INoteAppSettings = {
            ...settings,
            v: 2,
            d: finalD,
            iv: finalIv,
            iv_gist: gistIv, // Store the content IV here
            storageType,
            k_inner: settings.mode === "open" ? await exportKey(innerKey) : undefined
        };
        console.log(`[STORAGE-DETAIL] [SecureStorage.ts:54] v2Encrypt: Inner Encryption details stored in metadata. IV: ${finalIv}, Salt in metadata: ${settings.s}`);

        // 4. Outer Layer: Stringify -> Gzip -> Encrypt with Outer Key
        const settingsJson = JSON.stringify(updatedSettings);
        console.log(`[STORAGE-DETAIL] v2Encrypt: Stringified metadata length: ${settingsJson.length}. Fingerprint: ${settingsJson.slice(0, 20)}...`);
        const settingsCompressed = await Compressor.compressGzip(settingsJson);
        const settingsB64 = Compressor.toBase64(settingsCompressed);
        const outerResult = await encrypt(settingsB64, outerKey);
        console.log(`[STEP 6] [SecureStorage.ts] v2Encrypt: Outer Layer (Metadata) encrypted. 
            Outer IV: ${outerResult.iv}
            Outer Data Fingerprint: ${outerResult.data.slice(0, 16)}...`);

        // 5. Final Package: { d, iv, k } where k is exported outerKey
        const finalPackage = {
            d: outerResult.data,
            iv: outerResult.iv,
            k: await exportKey(outerKey)
        };
        console.log(`[STEP 7] [SecureStorage.ts] v2Encrypt: Final URL hash package prepared.`);

        return {
            hash: btoa(JSON.stringify(finalPackage)),
            settings: updatedSettings
        };
    },

    async v2DecryptOuter(
        hash: string,
        outerKey: CryptoKey
    ): Promise<INoteAppSettings> {
        console.log(`[STEP 8] [SecureStorage.ts:82] v2DecryptOuter: Starting outer decryption.`);
        const parsed = JSON.parse(atob(hash));
        console.log(`[STORAGE-DETAIL] [SecureStorage.ts:84] v2DecryptOuter: Parsed outer package. Outer IV: ${parsed.iv}`);
        const decryptedB64 = await decrypt(parsed.d, parsed.iv, outerKey);
        const compressedBytes = Compressor.fromBase64(decryptedB64);
        const json = await Compressor.decompressGzip(compressedBytes);
        const settings = JSON.parse(json);
        console.log(`[STEP 9] [SecureStorage.ts:87] v2DecryptOuter: Metadata recovered. Storage: ${settings.storageType}`);
        return settings;
    }
}
