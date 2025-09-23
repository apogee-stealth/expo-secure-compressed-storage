import LZString from "lz-string";
import { TextDecoder, TextEncoder } from "text-encoding";
import { getChunkKey, getMasterKey } from "./keys";
import { getChunkSize } from "../config/configure";
import { MasterMetadata, StorageEntry, StorageType } from "../types";

/**
 * Safely chunks a string by byte size without breaking UTF-8 characters
 *
 * @param value - The string to chunk
 * @param chunkSize - The maximum chunk size in bytes
 * @returns Array of string chunks that preserve UTF-8 character boundaries
 *
 * @example
 * ```typescript
 * const chunks = chunkStringBySize("Hello 世界", 4);
 * // Returns: ["Hell", "o 世", "界"]
 * ```
 */
function chunkStringBySize(value: string, chunkSize: number): string[] {
    const bytes = new TextEncoder().encode(value);
    const chunks: string[] = [];

    for (let i = 0; i < bytes.length; i += chunkSize) {
        let chunkEnd = Math.min(i + chunkSize, bytes.length);

        /* 
            Ensure we don't break UTF-8 characters. We're basically asking
            "Does this byte (bytes[chunkEnd] & 0xc0) start with the pattern
            10 (0x80)?" (0x80 is a continuation byte, which means the byte
            is part of a multi-byte character). If it does, we move the
            chunk boundary back. If not, it's all good, we can chunk.
        */
        // eslint-disable-next-line no-bitwise
        while (chunkEnd > i && (bytes[chunkEnd] & 0xc0) === 0x80) {
            chunkEnd--;
        }

        const chunkBytes = bytes.slice(i, chunkEnd);
        const chunkString = new TextDecoder().decode(chunkBytes);
        chunks.push(chunkString);

        // Adjust i to the actual end of the chunk
        i = chunkEnd - 1; // Will be incremented by the for loop
    }

    return chunks;
}

/**
 * Processes a value for storage by optionally compressing and chunking it
 *
 * @param key - The storage key for this value
 * @param value - The string value to process
 * @param targetStorageType - Optional storage type override (defaults to COMPRESSED)
 * @returns Object containing storage entries, metadata, and size information
 *
 * @example
 * ```typescript
 * const result = processValueForStorage("user_data", JSON.stringify(data));
 * // Returns: { entries: [...], storageType: "COMPRESSED", unCompressedSize: 1024, processedSize: 512 }
 * ```
 */
export function processValueForStorage(
    key: string,
    value: string,
    targetStorageType?: StorageType
): {
    entries: StorageEntry[];
    storageType: StorageType;
    unCompressedSize: number;
    processedSize: number;
} {
    const actualTargetStorageType = targetStorageType ?? StorageType.COMPRESSED;
    const unCompressedSize = new TextEncoder().encode(value).length;
    const shouldCompress = actualTargetStorageType === StorageType.COMPRESSED;
    let processedValue = value;
    let processedSize = unCompressedSize;
    const chunkSize = getChunkSize();

    if (shouldCompress) {
        processedValue = LZString.compress(value);
        processedSize = new TextEncoder().encode(processedValue).length;
    }

    const entries: StorageEntry[] = [];

    // Always break into chunks for consistent behavior
    const chunks = chunkStringBySize(processedValue, chunkSize);

    // Create master metadata entry
    const masterMetadata: MasterMetadata = {
        storageType: actualTargetStorageType,
        chunkCount: chunks.length,
    };

    entries.push({
        key: getMasterKey(key),
        value: JSON.stringify(masterMetadata),
    });

    // Create chunk entries
    chunks.forEach((chunk, index) => {
        entries.push({
            key: getChunkKey(key, index),
            value: chunk,
        });
    });

    return {
        entries,
        storageType: actualTargetStorageType,
        unCompressedSize,
        processedSize,
    };
}
