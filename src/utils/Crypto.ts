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
    console.log("[Crypto] Deriving key from password...");
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
    console.log("[Crypto] Key derived. Extractable:", key.extractable);
    return key;
}

export function generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16))
}

export function exportSalt(salt: Uint8Array) {
    return btoa(String.fromCharCode(...salt))
}

export function importSalt(base64Salt: string) {
    return Uint8Array.from(atob(base64Salt), c => c.charCodeAt(0))
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
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encodedText = encoder.encode(text)

    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encodedText
    )

    const encryptedBytes = new Uint8Array(encryptedBuffer)

    return {
        iv: btoa(String.fromCharCode(...iv)),
        data: btoa(String.fromCharCode(...encryptedBytes))
    }
}

export async function decrypt(
    data: string,
    iv: string,
    key: CryptoKey
) {
    const encryptedBytes = Uint8Array.from(atob(data), c => c.charCodeAt(0))
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0))

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        key,
        encryptedBytes
    )

    return decoder.decode(decryptedBuffer)
}
