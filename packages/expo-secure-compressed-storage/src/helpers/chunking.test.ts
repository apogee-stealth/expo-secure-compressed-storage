/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

const mockLZString = {
    compress: jest.fn(),
};
jest.mock("lz-string", () => {
    return mockLZString;
});

const mockGetChunkKey = jest.fn();
const mockGetMasterKey = jest.fn();
jest.mock("./keys", () => {
    return {
        getChunkKey: mockGetChunkKey,
        getMasterKey: mockGetMasterKey,
    };
});

const mockGetChunkSize = jest.fn();
jest.mock("../config/configure", () => {
    return {
        getChunkSize: mockGetChunkSize,
    };
});

import { StorageType } from "../types";

describe("expo-secure-compressed-storage > helpers > chunking", () => {
    let mockChunkSize: any,
        mockValue: any,
        mockKey: any,
        mockCompressedValue: any,
        mockMasterKey: any,
        result: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        mockChunkSize = 4; // Small chunk size for testing
        mockGetChunkSize.mockReturnValue(mockChunkSize);
        mockValue = "Hello World";
        mockKey = "test_data";
        mockCompressedValue = "COMPRESSED_DATA";
        mockMasterKey = "test_data_master";
        mockGetMasterKey.mockReturnValue(mockMasterKey);
    });

    describe("with processValueForStorage", () => {
        describe("when targetStorageType is not provided", () => {
            beforeEach(async () => {
                mockLZString.compress.mockReturnValue(mockCompressedValue);
                // Mock chunk keys for the expected number of chunks
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_0");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_1");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_2");
                const mod = await import("./chunking");
                result = mod.processValueForStorage(mockKey, mockValue);
            });

            it("should use COMPRESSED as the default storage type", () => {
                expect(result.storageType).toBe(StorageType.COMPRESSED);
            });

            it("should compress the value using LZString", () => {
                expect(mockLZString.compress).toHaveBeenCalledWith(mockValue);
            });

            it("should call getChunkSize to get the chunk size", () => {
                expect(mockGetChunkSize).toHaveBeenCalledTimes(1);
            });

            it("should create master metadata entry with correct values", () => {
                expect(mockGetMasterKey).toHaveBeenCalledWith(mockKey);
                expect(result.entries[0]).toEqual({
                    key: mockMasterKey,
                    value: JSON.stringify({
                        storageType: StorageType.COMPRESSED,
                        chunkCount: 3,
                    }),
                });
            });

            it("should create chunk entries for each chunk", () => {
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 0);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 1);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 2);
                expect(result.entries).toHaveLength(4); // 1 master + 3 chunks
            });

            it("should return the expected result structure", () => {
                expect(result.entries[0]).toEqual({
                    key: mockMasterKey,
                    value: JSON.stringify({
                        storageType: StorageType.COMPRESSED,
                        chunkCount: 3,
                    }),
                });
                expect(result.storageType).toBe(StorageType.COMPRESSED);
                expect(result.entries).toHaveLength(4);
            });
        });

        describe("when targetStorageType is COMPRESSED", () => {
            beforeEach(async () => {
                mockLZString.compress.mockReturnValue(mockCompressedValue);
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_0");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_1");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_2");
                const mod = await import("./chunking");
                result = mod.processValueForStorage(mockKey, mockValue, StorageType.COMPRESSED);
            });

            it("should use COMPRESSED storage type", () => {
                expect(result.storageType).toBe(StorageType.COMPRESSED);
            });

            it("should compress the value using LZString", () => {
                expect(mockLZString.compress).toHaveBeenCalledWith(mockValue);
            });
        });

        describe("when targetStorageType is UNCOMPRESSED", () => {
            beforeEach(async () => {
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_0");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_1");
                const mod = await import("./chunking");
                result = mod.processValueForStorage(mockKey, mockValue, StorageType.UNCOMPRESSED);
            });

            it("should use UNCOMPRESSED storage type", () => {
                expect(result.storageType).toBe(StorageType.UNCOMPRESSED);
            });

            it("should not compress the value", () => {
                expect(mockLZString.compress).not.toHaveBeenCalled();
            });

            it("should create master metadata with UNCOMPRESSED type", () => {
                expect(result.entries[0]).toEqual({
                    key: mockMasterKey,
                    value: JSON.stringify({
                        storageType: StorageType.UNCOMPRESSED,
                        chunkCount: 2,
                    }),
                });
            });
        });

        describe("when the value fits in a single chunk", () => {
            beforeEach(async () => {
                mockValue = "Hi";
                mockGetChunkKey.mockReset();
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_0");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_1");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_2");
                const mod = await import("./chunking");
                result = mod.processValueForStorage(mockKey, mockValue);
            });

            it("should create multiple chunk entries for compressed data", () => {
                expect(mockGetChunkKey).toHaveBeenCalledTimes(3);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 0);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 1);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 2);
            });

            it("should set chunkCount to 3 in master metadata", () => {
                expect(result.entries[0].value).toBe(
                    JSON.stringify({
                        storageType: StorageType.COMPRESSED,
                        chunkCount: 3,
                    })
                );
            });

            it("should create four entries total", () => {
                expect(result.entries).toHaveLength(4);
            });
        });

        describe("when the value requires multiple chunks", () => {
            beforeEach(async () => {
                mockValue = "This is a longer string that will be chunked";
                mockGetChunkKey.mockReset();
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_0");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_1");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_2");
                const mod = await import("./chunking");
                result = mod.processValueForStorage(mockKey, mockValue);
            });

            it("should create multiple chunk entries", () => {
                expect(mockGetChunkKey).toHaveBeenCalledTimes(3);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 0);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 1);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 2);
            });

            it("should set correct chunkCount in master metadata", () => {
                expect(result.entries[0].value).toBe(
                    JSON.stringify({
                        storageType: StorageType.COMPRESSED,
                        chunkCount: 3,
                    })
                );
            });

            it("should create correct number of total entries", () => {
                expect(result.entries).toHaveLength(4); // 1 master + 3 chunks
            });
        });

        describe("when the value is empty", () => {
            beforeEach(async () => {
                mockValue = "";
                mockGetChunkKey.mockReset();
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_0");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_1");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_2");
                const mod = await import("./chunking");
                result = mod.processValueForStorage(mockKey, mockValue);
            });

            it("should create multiple chunk entries for compressed empty value", () => {
                expect(result.entries[1]).toEqual({
                    key: "test_data_chunk_0",
                    value: "COMP",
                });
            });

            it("should set chunkCount to 3", () => {
                expect(result.entries[0].value).toBe(
                    JSON.stringify({
                        storageType: StorageType.COMPRESSED,
                        chunkCount: 3,
                    })
                );
            });
        });

        describe("when the value contains only ASCII characters", () => {
            beforeEach(async () => {
                mockValue = "Hello World";
                mockGetChunkKey.mockReset();
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_0");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_1");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_2");
                const mod = await import("./chunking");
                result = mod.processValueForStorage(mockKey, mockValue);
            });

            it("should handle ASCII characters correctly", () => {
                expect(result.entries).toHaveLength(4); // 1 master + 3 chunks
                expect(result.entries[0].key).toBe("test_data_master");
            });
        });

        describe("when the value contains complex unicode characters", () => {
            beforeEach(async () => {
                mockValue = "🚀🌟🎉";
                mockGetChunkKey.mockReset();
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_0");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_1");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_2");
                const mod = await import("./chunking");
                result = mod.processValueForStorage(mockKey, mockValue);
            });

            it("should handle unicode characters correctly", () => {
                expect(result.entries).toHaveLength(4); // 1 master + 3 chunks
                expect(result.entries[0].key).toBe("test_data_master");
            });
        });

        describe("when the value contains UTF-8 characters that would be split at chunk boundaries", () => {
            beforeEach(async () => {
                // Use a smaller chunk size to force UTF-8 boundary preservation logic
                mockChunkSize = 2; // Very small chunk size to force splitting
                mockGetChunkSize.mockReturnValue(mockChunkSize);

                // Use a string with multi-byte UTF-8 characters that will be split at chunk boundaries
                // This will trigger the UTF-8 boundary preservation logic (line 30: chunkEnd--)
                mockValue = "世界"; // Chinese characters that are 3 bytes each in UTF-8
                mockGetChunkKey.mockReset();
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_0");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_1");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_2");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_3");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_4");
                const mod = await import("./chunking");
                result = mod.processValueForStorage(mockKey, mockValue);
            });

            it("should preserve UTF-8 character boundaries when chunking", () => {
                expect(result.entries).toHaveLength(6); // 1 master + 5 chunks
                expect(result.entries[0].key).toBe("test_data_master");
            });

            it("should create correct number of chunk entries", () => {
                expect(mockGetChunkKey).toHaveBeenCalledTimes(5);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 0);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 1);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 2);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 3);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 4);
            });

            it("should set correct chunkCount in master metadata", () => {
                expect(result.entries[0].value).toBe(
                    JSON.stringify({
                        storageType: StorageType.COMPRESSED,
                        chunkCount: 5,
                    })
                );
            });
        });

        describe("when testing UTF-8 boundary preservation with UNCOMPRESSED storage", () => {
            beforeEach(async () => {
                // Use a smaller chunk size to force UTF-8 boundary preservation logic
                mockChunkSize = 2; // Very small chunk size to force splitting
                mockGetChunkSize.mockReturnValue(mockChunkSize);

                // Use a string with multi-byte UTF-8 characters that will be split at chunk boundaries
                // This will trigger the UTF-8 boundary preservation logic (line 30: chunkEnd--)
                mockValue = "世界"; // Chinese characters that are 3 bytes each in UTF-8
                mockGetChunkKey.mockReset();
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_0");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_1");
                mockGetChunkKey.mockReturnValueOnce("test_data_chunk_2");
                const mod = await import("./chunking");
                result = mod.processValueForStorage(mockKey, mockValue, StorageType.UNCOMPRESSED);
            });

            it("should preserve UTF-8 character boundaries when chunking uncompressed data", () => {
                expect(result.entries).toHaveLength(4); // 1 master + 3 chunks
                expect(result.entries[0].key).toBe("test_data_master");
            });

            it("should create correct number of chunk entries for uncompressed data", () => {
                expect(mockGetChunkKey).toHaveBeenCalledTimes(3);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 0);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 1);
                expect(mockGetChunkKey).toHaveBeenCalledWith(mockKey, 2);
            });

            it("should set correct chunkCount in master metadata for uncompressed data", () => {
                expect(result.entries[0].value).toBe(
                    JSON.stringify({
                        storageType: StorageType.UNCOMPRESSED,
                        chunkCount: 3,
                    })
                );
            });
        });
    });
});
