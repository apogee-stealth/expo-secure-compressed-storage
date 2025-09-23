export interface Logger {
    /**
     * Log a debug message
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    debug(message: string, ...args: unknown[]): void;

    /**
     * Log an info message
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    info(message: string, ...args: unknown[]): void;

    /**
     * Log a warning message
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    warn(message: string, ...args: unknown[]): void;

    /**
     * Log an error message
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    error(message: string, ...args: unknown[]): void;
}

/**
 * Enum representing the storage type for data persistence
 */
export const enum StorageType {
    /** Data will be compressed using LZString before storage */
    COMPRESSED = "COMPRESSED",
    /** Data will be stored without compression */
    UNCOMPRESSED = "UNCOMPRESSED",
}

/**
 * Represents a single storage entry with key-value pair
 */
export interface StorageEntry {
    /** The storage key for this entry */
    key: string;
    /** The storage value for this entry */
    value: string;
}

/**
 * Metadata stored with the master key containing information about chunked data
 */
export interface MasterMetadata {
    /** The storage type used for this data (compressed or uncompressed) */
    storageType: StorageType;
    /** The total number of chunks this data was split into */
    chunkCount: number;
}
