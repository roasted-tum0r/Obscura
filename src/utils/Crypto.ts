// crypto.ts

// Converts strings <-> bytes
// Encryption works only on bytes, not plain strings
const encoder = new TextEncoder()
const decoder = new TextDecoder()

// --------------------------------------------------
// 1️⃣ Key Generation & Derivation
// --------------------------------------------------
export async function generateKey() {
    console.log("[Crypto] Generating new key...");
    const key = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    )
    console.log("[Crypto] Key generated. Extractable:", key.extractable);
    return key;
}

export async function deriveKeyFromPassword(password: string, salt: Uint8Array) {
    const saltB64 = exportSalt(salt);
    console.log(`[CRYPTO-DEEP] deriveKeyFromPassword: 
        Pass length: ${password.length}
        Salt B64: ${saltB64}
        Salt Length: ${salt.length} bytes
        Iterations: 100000
        Hash: SHA-256`);
    const passwordBytes = encoder.encode(password)
    const baseKey = await crypto.subtle.importKey(
        "raw",
        passwordBytes,
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    )

    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as any,
            iterations: 100000,
            hash: "SHA-256"
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    )
    console.log("[CRYPTO-DEEP] deriveKeyFromPassword: Key derived SUCCESSFULLY.");
    return key;
}

export function generateSalt() {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    console.log("[CRYPTO-DEEP] generateSalt: New salt generated.");
    return salt;
}

export function exportSalt(salt: Uint8Array) {
    return btoa(String.fromCharCode(...salt))
}

export function importSalt(base64Salt: string) {
    console.log(`[CRYPTO-DEEP] importSalt: Decoding salt (b64): ${base64Salt}`);
    try {
        const bytes = Uint8Array.from(atob(base64Salt), c => c.charCodeAt(0));
        console.log(`[CRYPTO-DEEP] importSalt: Success. Decoded ${bytes.length} bytes.`);
        return bytes;
    } catch (e) {
        console.error(`[CRYPTO-DEEP] importSalt: FAILED to decode salt.`, e);
        throw e;
    }
}

// --------------------------------------------------
// 2️⃣ Export/Import Keys
// --------------------------------------------------
export async function exportKey(key: CryptoKey) {
    console.log("[Crypto] Exporting key... Extractable:", key.extractable, "Type:", key.type);
    const raw = await crypto.subtle.exportKey("raw", key)
    const bytes = new Uint8Array(raw)
    return btoa(String.fromCharCode(...bytes))
}

export async function importKey(base64Key: string) {
    console.log("[Crypto] Importing key from base64...");
    const raw = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0))
    const key = await crypto.subtle.importKey(
        "raw",
        raw,
        { name: "AES-GCM" },
        true, // 🔥 CRITICAL: Must be true so we can export it again during save
        ["decrypt", "encrypt"]
    )
    console.log("[Crypto] Key imported. Extractable:", key.extractable);
    return key;
}

// --------------------------------------------------
// 3️⃣ Encryption & Decryption
// --------------------------------------------------
export async function encrypt(text: string, key: CryptoKey) {
    console.log(`[CRYPTO-DETAIL] encrypt: Starting. Text length: ${text.length}`);
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encodedText = encoder.encode(text)
    console.log(`[CRYPTO-DETAIL] encrypt: IV generated (12 bytes). Encoded text length: ${encodedText.length} bytes.`);

    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encodedText
    )

    const encryptedBytes = new Uint8Array(encryptedBuffer)
    const result = {
        iv: btoa(String.fromCharCode(...iv)),
        data: btoa(String.fromCharCode(...encryptedBytes))
    }
    console.log(`[CRYPTO-DETAIL] encrypt: Finished. Encrypted data length (b64): ${result.data.length}`);
    return result;
}

export async function decrypt(
    data: string,
    iv: string,
    key: CryptoKey
) {
    console.log(`[CRYPTO-DETAIL] decrypt: Starting. Data length (b64): ${data.length}, IV (b64): ${iv}`);
    try {
        const encryptedBytes = Uint8Array.from(atob(data), c => c.charCodeAt(0))
        const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0))
        console.log(`[CRYPTO-DETAIL] decrypt: Decoded bytes. Data: ${encryptedBytes.length} bytes, IV: ${ivBytes.length} bytes.`);

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivBytes },
            key,
            encryptedBytes
        )

        const decoded = decoder.decode(decryptedBuffer)
        console.log(`[CRYPTO-DETAIL] decrypt: Successful. Decoded text length: ${decoded.length}`);
        return decoded;
    } catch (e) {
        console.error(`[CRYPTO-DETAIL] decrypt: FAILED.`, e);
        throw e;
    }
}
