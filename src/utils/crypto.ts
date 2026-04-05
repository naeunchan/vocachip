import { Buffer } from "buffer";
import CryptoJS from "crypto-js";

export async function digestSha256(input: string): Promise<string> {
    return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
}

export async function getRandomBytesAsync(byteLength: number): Promise<Uint8Array> {
    if (globalThis.crypto?.getRandomValues) {
        const bytes = new Uint8Array(byteLength);
        globalThis.crypto.getRandomValues(bytes);
        return bytes;
    }

    const wordArray = CryptoJS.lib.WordArray.random(byteLength);
    return Uint8Array.from(Buffer.from(wordArray.toString(CryptoJS.enc.Hex), "hex"));
}
