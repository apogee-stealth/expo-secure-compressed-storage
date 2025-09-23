import * as SecureStore from "expo-secure-store";
import { processValueForStorage } from "../helpers/chunking";
import { validateKey } from "../helpers/keys";
import { getLogger } from "../config/configure";
import { StorageType } from "../types";
import { deleteItemAsync } from "./deleteItemAsync";

/**
 * Stores an item in secure storage with optional compression and automatic chunking
 *
 * @param key - The storage key to use
 * @param value - The value to store (will be JSON stringified)
 * @param storageType - Optional storage type override (defaults to COMPRESSED)
 * @returns Promise that resolves when storage is complete
 * @template T - The type of the value being stored
 * @throws {Error} If the key is invalid or storage fails
 *
 * @example
 * ```typescript
 * await setItemAsync("user_data", { name: "John", age: 30 });
 * await setItemAsync("config", settings, StorageType.UNCOMPRESSED);
 * ```
 */
export const setItemAsync = async <T>(
    key: string,
    value: T,
    storageType?: StorageType
): Promise<void> => {
    const logger = getLogger();
    try {
        validateKey(key);
        // delete in order to clear any existing chunk entries, etc.
        await deleteItemAsync(key);

        const {
            entries,
            storageType: actualStorageType,
            unCompressedSize,
            processedSize,
        } = processValueForStorage(key, JSON.stringify(value), storageType);

        logger.debug("setItemAsync", {
            key,
            storageType: actualStorageType,
            entryCount: entries.length,
            unCompressedSize,
            processedSize,
        });

        // Store all entries - if any fail, the whole operation fails
        await Promise.all(entries.map((entry) => SecureStore.setItemAsync(entry.key, entry.value)));
    } catch (error) {
        logger.error("setItemAsync", { key, error });
        throw error;
    }
};
