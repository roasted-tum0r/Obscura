// crypto.ts

// Converts strings <-> bytes
// Encryption works only on bytes, not plain strings
const encoder = new TextEncoder()
const decoder = new TextDecoder()

// --------------------------------------------------
// 1️⃣ Generate a new AES-256 key
// --------------------------------------------------
export async function generateKey() {
    return crypto.subtle.generateKey(
        {
            name: "AES-GCM",   // Modern authenticated encryption mode
            length: 256        // 256-bit key (strong)
        },
        true,                // Key is exportable (so we can store/share it)
        ["encrypt", "decrypt"] // Allowed usages
    )
}

// --------------------------------------------------
// 2️⃣ Export CryptoKey to base64 string
// --------------------------------------------------
export async function exportKey(key: CryptoKey) {

    // Export key as raw binary
    const raw = await crypto.subtle.exportKey("raw", key)
    console.log(key, 'key got')

    // Convert ArrayBuffer -> Uint8Array
    const bytes = new Uint8Array(raw)

    // Convert bytes -> string -> base64
    return btoa(String.fromCharCode(...bytes))
}

// --------------------------------------------------
// 3️⃣ Import base64 string back into CryptoKey
// --------------------------------------------------
export async function importKey(base64Key: string) {

    // Convert base64 -> bytes
    const raw = Uint8Array.from(
        atob(base64Key),
        c => c.charCodeAt(0)
    )

    // Import into Web Crypto as AES-GCM key
    return crypto.subtle.importKey(
        "raw",
        raw,
        { name: "AES-GCM" },
        false, // not exportable after import
        ["decrypt", "encrypt"]
    )
}

// --------------------------------------------------
// 4️⃣ Encrypt text
// --------------------------------------------------
export async function encrypt(text: string, key: CryptoKey) {

    // Generate random 12-byte IV
    // Must be unique per encryption
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Convert plaintext string -> bytes
    const encodedText = encoder.encode(text)

    // Perform encryption
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encodedText
    )

    // Convert encrypted ArrayBuffer -> base64
    const encryptedBytes = new Uint8Array(encryptedBuffer)

    return {
        iv: btoa(String.fromCharCode(...iv)), // store IV
        data: btoa(String.fromCharCode(...encryptedBytes)) // store ciphertext
    }
}

// --------------------------------------------------
// 5️⃣ Decrypt text
// --------------------------------------------------
export async function decrypt(
    data: string,
    iv: string,
    key: CryptoKey
) {

    // Convert base64 -> bytes
    const encryptedBytes = Uint8Array.from(
        atob(data),
        c => c.charCodeAt(0)
    )

    const ivBytes = Uint8Array.from(
        atob(iv),
        c => c.charCodeAt(0)
    )

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        key,
        encryptedBytes
    )

    // Convert decrypted bytes -> string
    return decoder.decode(decryptedBuffer)
}
