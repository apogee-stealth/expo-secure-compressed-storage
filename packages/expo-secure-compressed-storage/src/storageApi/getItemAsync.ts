import * as SecureStore from "expo-secure-store";
import LZString from "lz-string";
import { getChunkKey, getMasterKey } from "../helpers/keys";
import { getLogger } from "../config/configure";
import { MasterMetadata, StorageType } from "../types";

/**
 * Retrieves an item from secure storage, automatically handling decompression and chunk reconstruction
 *
 * @param key - The storage key to retrieve
 * @returns Promise that resolves to the stored value or null if not found
 * @template T - The expected type of the stored value
 *
 * @example
 * ```typescript
 * const userData = await getItemAsync<UserData>("user_data");
 * if (userData) {
 *   console.log(userData.name);
 * }
 * ```
 */
export const getItemAsync = async <T>(key: string): Promise<T | null> => {
    const logger = getLogger();

    // Always check for master metadata
    const masterKey = getMasterKey(key);
    const masterMetadataString = await SecureStore.getItemAsync(masterKey);

    if (!masterMetadataString) {
        logger.debug("getItemAsync", { key, message: "No data found" });
        return null;
    }

    // Reconstruct from chunks using metadata
    const masterMetadata: MasterMetadata = JSON.parse(masterMetadataString);

    // Fetch all chunk values
    const chunkPromises = [];
    for (let i = 0; i < masterMetadata.chunkCount; i++) {
        const chunkKey = getChunkKey(key, i);
        chunkPromises.push(SecureStore.getItemAsync(chunkKey));
    }

    const chunkValues = await Promise.all(chunkPromises);

    // Check that all chunks were found
    if (chunkValues.some((chunk) => chunk === null)) {
        logger.error("getItemAsync", { key, message: "One or more chunks missing" });
        return null;
    }

    // Reconstruct the compressed value from chunks
    const compressedValue = chunkValues.join("");

    // Check metadata to determine if we need to decompress
    let finalValue: string;
    if (masterMetadata.storageType === StorageType.COMPRESSED) {
        finalValue = LZString.decompress(compressedValue);
    } else {
        finalValue = compressedValue; // Already uncompressed
    }

    const result = JSON.parse(finalValue) as T;
    return result;
};
