/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

const mockSecureStore = {
    setItemAsync: jest.fn(),
};
jest.mock("expo-secure-store", () => {
    return mockSecureStore;
});

const mockProcessValueForStorage = jest.fn();
jest.mock("../helpers/chunking", () => {
    return {
        processValueForStorage: mockProcessValueForStorage,
    };
});

const mockValidateKey = jest.fn();
jest.mock("../helpers/keys", () => {
    return {
        validateKey: mockValidateKey,
    };
});

const mockGetLogger = jest.fn();
jest.mock("../config/configure", () => {
    return {
        getLogger: mockGetLogger,
    };
});

const mockDeleteItemAsync = jest.fn();
jest.mock("./deleteItemAsync", () => {
    return {
        deleteItemAsync: mockDeleteItemAsync,
    };
});

import { StorageType } from "../types";

describe("expo-secure-compressed-storage > storageApi > setItemAsync", () => {
    let mockLogger: any,
        result: any,
        testKey: any,
        testValue: any,
        testStorageType: any,
        mockProcessedValue: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        mockLogger = {
            debug: jest.fn(),
            error: jest.fn(),
        };
        mockGetLogger.mockReturnValue(mockLogger);

        testKey = "USER_DATA";
        testValue = { name: "Cal Zone", email: "cal@zone.com" };
        testStorageType = StorageType.COMPRESSED;

        mockProcessedValue = {
            entries: [
                { key: "USER_DATA_master", value: '{"storageType":"COMPRESSED","chunkCount":2}' },
                { key: "USER_DATA_chunk_0", value: "chunk1" },
                { key: "USER_DATA_chunk_1", value: "chunk2" },
            ],
            storageType: StorageType.COMPRESSED,
            unCompressedSize: 1024,
            processedSize: 512,
        };

        mockProcessValueForStorage.mockReturnValue(mockProcessedValue);
        mockDeleteItemAsync.mockResolvedValue(undefined);
        mockSecureStore.setItemAsync.mockResolvedValue(undefined);
    });

    describe("when everything goes splendiferously", () => {
        beforeEach(async () => {
            const mod = await import("./setItemAsync");
            result = await mod.setItemAsync(testKey, testValue, testStorageType);
        });

        it("should validate the key", () => {
            expect(mockValidateKey).toHaveBeenCalledTimes(1);
            expect(mockValidateKey).toHaveBeenCalledWith(testKey);
        });

        it("should delete existing item before storing new one", () => {
            expect(mockDeleteItemAsync).toHaveBeenCalledTimes(1);
            expect(mockDeleteItemAsync).toHaveBeenCalledWith(testKey);
        });

        it("should process the value for storage", () => {
            expect(mockProcessValueForStorage).toHaveBeenCalledTimes(1);
            expect(mockProcessValueForStorage).toHaveBeenCalledWith(
                testKey,
                JSON.stringify(testValue),
                testStorageType
            );
        });

        it("should store all entries using SecureStore", () => {
            expect(mockSecureStore.setItemAsync).toHaveBeenCalledTimes(3);
            expect(mockSecureStore.setItemAsync).toHaveBeenNthCalledWith(
                1,
                "USER_DATA_master",
                '{"storageType":"COMPRESSED","chunkCount":2}'
            );
            expect(mockSecureStore.setItemAsync).toHaveBeenNthCalledWith(
                2,
                "USER_DATA_chunk_0",
                "chunk1"
            );
            expect(mockSecureStore.setItemAsync).toHaveBeenNthCalledWith(
                3,
                "USER_DATA_chunk_1",
                "chunk2"
            );
        });

        it("should resolve without returning a value", () => {
            expect(result).toBeUndefined();
        });
    });

    describe("when called without storageType parameter", () => {
        beforeEach(async () => {
            const mod = await import("./setItemAsync");
            result = await mod.setItemAsync(testKey, testValue);
        });

        it("should process the value with undefined storageType", () => {
            expect(mockProcessValueForStorage).toHaveBeenCalledTimes(1);
            expect(mockProcessValueForStorage).toHaveBeenCalledWith(
                testKey,
                JSON.stringify(testValue),
                undefined
            );
        });
    });

    describe("when called with UNCOMPRESSED storage type", () => {
        beforeEach(async () => {
            const mod = await import("./setItemAsync");
            result = await mod.setItemAsync(testKey, testValue, StorageType.UNCOMPRESSED);
        });

        it("should process the value with UNCOMPRESSED storage type", () => {
            expect(mockProcessValueForStorage).toHaveBeenCalledTimes(1);
            expect(mockProcessValueForStorage).toHaveBeenCalledWith(
                testKey,
                JSON.stringify(testValue),
                StorageType.UNCOMPRESSED
            );
        });
    });

    describe("when an error is thrown", () => {
        let storageError: any, caughtError: any;

        beforeEach(async () => {
            storageError = new Error("E_STORAGE_QUOTA_EXCEEDED");
            mockSecureStore.setItemAsync.mockRejectedValueOnce(storageError);

            try {
                const mod = await import("./setItemAsync");
                await mod.setItemAsync(testKey, testValue, testStorageType);
            } catch (error) {
                caughtError = error;
            }
        });

        it("should log the error and re-throw it", () => {
            expect(caughtError).toBe(storageError);
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith("setItemAsync", {
                key: testKey,
                error: storageError,
            });
        });
    });
});
