/* eslint-disable @typescript-eslint/no-empty-function */
import { Logger } from "../types";

/**
 * Configuration options for configuring the expo-secure-compressed-storage library
 */
export interface ExpoSecureCompressedStorageConfigArgs {
    /** Optional logger instance for debugging and monitoring */
    logger?: Logger;
    /** Optional chunk size in bytes for splitting large data (default: 2048) */
    chunkSize?: number;
}

let _configured = false;
let _logger: Logger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
};
let _chunkSize = 2048;

/**
 * Configures the expo-secure-compressed-storage library with the given configuration options
 *
 * @param args - Configuration options for the library
 * @param args.logger - Optional logger instance for debugging and monitoring
 * @param args.chunkSize - Optional chunk size in bytes for splitting large data (default: 2048)
 * @throws {Error} If the library has already been configured
 *
 * @example
 * ```typescript
 * import { configure } from 'expo-secure-compressed-storage';
 *
 * configure({
 *   logger: console,
 *   chunkSize: 1024
 * });
 * ```
 */
export function configure({
    logger = _logger,
    chunkSize = _chunkSize,
}: ExpoSecureCompressedStorageConfigArgs) {
    if (_configured) {
        throw new Error("expo-secure-compressed-storage already configured");
    }
    _logger = logger;
    _chunkSize = chunkSize;
    _configured = true;
}

/**
 * Gets the current logger instance
 *
 * @returns The configured logger instance
 * @package expo-secure-compressed-storage
 */
export function getLogger() {
    return _logger;
}

/**
 * Gets the current chunk size configuration
 *
 * @returns The configured chunk size in bytes
 * @package expo-secure-compressed-storage
 */
export function getChunkSize() {
    return _chunkSize;
}
