import * as SecureStore from "expo-secure-store";
import { getChunkKey, getMasterKey, validateKey } from "../helpers/keys";
import { getLogger } from "../config/configure";
import { MasterMetadata } from "../types";

/**
 * Deletes an item and all its associated chunks from secure storage
 *
 * @param key - The storage key to delete
 * @returns Promise that resolves when deletion is complete
 * @throws {Error} If the key is invalid or validation fails
 *
 * @example
 * ```typescript
 * await deleteItemAsync("user_data");
 * // Deletes "user_data_master" and all "user_data_chunk_*" entries
 * ```
 */
export const deleteItemAsync = async (key: string): Promise<void> => {
    validateKey(key);
    const logger = getLogger();

    // Always check for master metadata
    const masterKey = getMasterKey(key);
    const masterMetadataString = await SecureStore.getItemAsync(masterKey);

    if (!masterMetadataString) {
        logger.debug("deleteItemAsync", { key, message: "No data found to delete" });
        return;
    }

    // Delete master and all chunks
    const masterMetadata: MasterMetadata = JSON.parse(masterMetadataString);

    // Create array of all keys to delete
    const keysToDelete = [masterKey]; // Start with master key

    // Add all chunk keys
    for (let i = 0; i < masterMetadata.chunkCount; i++) {
        keysToDelete.push(getChunkKey(key, i));
    }

    // Delete all keys - if any fail, the whole operation fails
    await Promise.all(keysToDelete.map((keyToDelete) => SecureStore.deleteItemAsync(keyToDelete)));
};
