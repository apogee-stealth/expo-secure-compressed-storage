/**
 * Validates a storage key to ensure it meets security and naming requirements.
 *
 * @param key - The key string to validate
 * @throws {Error} If the key is empty, not a string, contains invalid characters, or conflicts with internal metadata keys
 *
 * @example
 * ```typescript
 * validateKey("user_data"); // ✅ Valid
 * validateKey(""); // ❌ Throws: Key must be a non-empty string
 * validateKey("data_master"); // ❌ Throws: Key cannot end with _master
 * validateKey("data_chunk_0"); // ❌ Throws: Key cannot contain _chunk_
 * validateKey("data@invalid"); // ❌ Throws: Key can only contain alphanumeric characters and underscores
 * ```
 */
export function validateKey(key: string): void {
    if (!key || typeof key !== "string") {
        throw new Error("Key must be a non-empty string");
    }

    // Prevent key collision with internal metadata
    if (key.endsWith("_master") || key.includes("_chunk_")) {
        throw new Error("Key cannot end with _master or contain _chunk_");
    }

    // Prevent path traversal and other special characters
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
        throw new Error("Key can only contain alphanumeric characters and underscores");
    }
}

/**
 * Generates the master key for storing metadata about chunked data
 *
 * @param key - The base storage key
 * @returns The master key used to store metadata
 *
 * @example
 * ```typescript
 * const masterKey = getMasterKey("user_data");
 * // Returns: "user_data_master"
 * ```
 */
export function getMasterKey(key: string): string {
    return `${key}_master`;
}

/**
 * Generates a chunk key for storing individual chunks
 *
 * @param key - The base storage key
 * @param chunkNumber - The zero-based index of the chunk
 * @returns The chunk key used to store this specific chunk
 *
 * @example
 * ```typescript
 * const chunkKey = getChunkKey("user_data", 0);
 * // Returns: "user_data_chunk_0"
 * ```
 */
export function getChunkKey(key: string, chunkNumber: number): string {
    return `${key}_chunk_${chunkNumber}`;
}
