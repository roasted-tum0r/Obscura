export const Compressor = {
    async compressGzip(text: string): Promise<Uint8Array> {
        const bytes = new TextEncoder().encode(text);
        const stream = new Blob([bytes]).stream();
        const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
        const arrayBuffer = await new Response(compressedStream).arrayBuffer();
        return new Uint8Array(arrayBuffer);
    },
    async decompressGzip(buffer: Uint8Array): Promise<string> {
        // Ensuring we're working with a standard Uint8Array to satisfy Blob requirements
        const bytes = new Uint8Array(buffer);
        const blob = new Blob([bytes]);
        const decompressedStream = blob.stream().pipeThrough(new DecompressionStream("gzip"));
        const text = await new Response(decompressedStream).text();
        return text;
    },
    toBase64(buffer: Uint8Array): string {
        // We use a helper to handle the binary conversion safely
        const binary = Array.from(buffer).map(b => String.fromCharCode(b)).join('');
        return btoa(binary);
    },
    fromBase64(base64: string): Uint8Array {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
}