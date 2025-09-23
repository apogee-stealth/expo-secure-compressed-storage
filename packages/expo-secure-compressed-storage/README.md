# @apogeelabs/expo-secure-compressed-storage

A wrapper around `expo-secure-store` that adds automatic compression and chunking for large data storage.

## Features

- **Automatic compression** using LZ-String for significant space savings
- **Automatic chunking** for data larger than secure store limits (~2KB)
- **Transparent API** - works exactly like `expo-secure-store` but handles large data
- **TypeScript support** with full type definitions
- **Configurable** chunk size and logging

## Installation

```bash
npm install @apogeelabs/expo-secure-compressed-storage
# or
yarn add @apogeelabs/expo-secure-compressed-storage
```

## Usage

```typescript
import {
    setItemAsync,
    getItemAsync,
    deleteItemAsync,
} from "@apogeelabs/expo-secure-compressed-storage";

// Store data (automatically compresses and chunks)
await setItemAsync("user_data", largeObject);

// Retrieve data (automatically decompresses and reconstructs)
const data = await getItemAsync("user_data");
// data is already parsed - no need for JSON.parse()

// Delete data
await deleteItemAsync("user_data");
```

## API

### `setItemAsync<T>(key: string, value: T, storageType?: StorageType): Promise<void>`

Stores a value with automatic compression and chunking.

- **key**: Alphanumeric with underscores only (e.g., `user_data`, `settings_v2`)
- **value**: Any value to store (will be JSON stringified)
- **storageType**: Optional override for storage behavior

### `getItemAsync<T>(key: string): Promise<T | null>`

Retrieves stored data with automatic decompression and reconstruction. Returns the parsed object directly.

### `deleteItemAsync(key: string): Promise<void>`

Removes all data associated with the key.

## Configuration

```typescript
import { configure } from "@apogeelabs/expo-secure-compressed-storage";

configure({
    chunkSize: 2000, // Default: 2048
    logger: {
        error: (msg, ...args) => console.error(msg, ...args),
        // ... other log methods
    },
});
```

## Storage Types

- `COMPRESSED`: Data is compressed using LZ-String before storage
- `UNCOMPRESSED`: Data is stored without compression

Note: All data is automatically chunked for consistent behavior, regardless of storage type.

## Requirements

- React Native with Expo
- Node.js >= 18
- `expo-secure-store` ~13.0.2

## License

ISC
