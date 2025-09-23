/* eslint-disable @typescript-eslint/no-explicit-any */
export default {};

const mockSecureStore = {
    getItemAsync: jest.fn(),
};
jest.mock("expo-secure-store", () => {
    return mockSecureStore;
});

const mockLZString = {
    decompress: jest.fn(),
};
jest.mock("lz-string", () => {
    return mockLZString;
});

const mockGetChunkKey = jest.fn();
const mockGetMasterKey = jest.fn();
jest.mock("../helpers/keys", () => {
    return {
        getChunkKey: mockGetChunkKey,
        getMasterKey: mockGetMasterKey,
    };
});

const mockGetLogger = jest.fn();
jest.mock("../config/configure", () => {
    return {
        getLogger: mockGetLogger,
    };
});

import { StorageType } from "../types";

describe("expo-secure-compressed-storage > storageApi > getItemAsync", () => {
    let mockLogger: any, result: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        mockGetLogger.mockReturnValue(mockLogger);
    });

    describe("when no master metadata is found", () => {
        beforeEach(async () => {
            mockGetMasterKey.mockReturnValue("TEST_KEY_master");
            mockSecureStore.getItemAsync.mockResolvedValueOnce(null);
            const mod = await import("./getItemAsync");
            result = await mod.getItemAsync("TEST_KEY");
        });

        it("should call getMasterKey with the provided key", () => {
            expect(mockGetMasterKey).toHaveBeenCalledWith("TEST_KEY");
        });

        it("should call SecureStore.getItemAsync with the master key", () => {
            expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith("TEST_KEY_master");
        });

        it("should return null", () => {
            expect(result).toBeNull();
        });
    });

    describe("when master metadata is found", () => {
        let masterMetadata: any;

        beforeEach(() => {
            masterMetadata = {
                storageType: StorageType.COMPRESSED,
                chunkCount: 2,
            };
            mockGetMasterKey.mockReturnValue("TEST_KEY_master");
            mockSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(masterMetadata));
            mockGetChunkKey
                .mockReturnValueOnce("TEST_KEY_chunk_0")
                .mockReturnValueOnce("TEST_KEY_chunk_1");
            mockSecureStore.getItemAsync
                .mockResolvedValueOnce("CHUNK_0_DATA")
                .mockResolvedValueOnce("CHUNK_1_DATA");
            mockLZString.decompress.mockReturnValue('{"name":"Cal Zone","id":"8675309"}');
        });

        describe("when all chunks are found and data is compressed", () => {
            beforeEach(async () => {
                const mod = await import("./getItemAsync");
                result = await mod.getItemAsync<{ name: string; id: string }>("TEST_KEY");
            });

            it("should call getMasterKey with the provided key", () => {
                expect(mockGetMasterKey).toHaveBeenCalledWith("TEST_KEY");
            });

            it("should call SecureStore.getItemAsync with the master key", () => {
                expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith("TEST_KEY_master");
            });

            it("should call getChunkKey for each chunk", () => {
                expect(mockGetChunkKey).toHaveBeenNthCalledWith(1, "TEST_KEY", 0);
                expect(mockGetChunkKey).toHaveBeenNthCalledWith(2, "TEST_KEY", 1);
            });

            it("should call SecureStore.getItemAsync for each chunk", () => {
                expect(mockSecureStore.getItemAsync).toHaveBeenNthCalledWith(2, "TEST_KEY_chunk_0");
                expect(mockSecureStore.getItemAsync).toHaveBeenNthCalledWith(3, "TEST_KEY_chunk_1");
            });

            it("should call LZString.decompress with the joined chunk values", () => {
                expect(mockLZString.decompress).toHaveBeenCalledWith("CHUNK_0_DATACHUNK_1_DATA");
            });

            it("should return the parsed JSON result", () => {
                expect(result).toEqual({ name: "Cal Zone", id: "8675309" });
            });
        });

        describe("when all chunks are found and data is uncompressed", () => {
            beforeEach(async () => {
                masterMetadata.storageType = StorageType.UNCOMPRESSED;
                mockSecureStore.getItemAsync.mockReset();
                mockSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(masterMetadata));
                mockSecureStore.getItemAsync
                    .mockResolvedValueOnce('{"name":"Cal Zone","id":"8675309"}')
                    .mockResolvedValueOnce("");
                const mod = await import("./getItemAsync");
                result = await mod.getItemAsync<{ name: string; id: string }>("TEST_KEY");
            });

            it("should not call LZString.decompress", () => {
                expect(mockLZString.decompress).not.toHaveBeenCalled();
            });

            it("should return the parsed JSON result from uncompressed data", () => {
                expect(result).toEqual({ name: "Cal Zone", id: "8675309" });
            });
        });

        describe("when one or more chunks are missing", () => {
            beforeEach(async () => {
                mockSecureStore.getItemAsync.mockReset();
                mockSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(masterMetadata));
                mockSecureStore.getItemAsync
                    .mockResolvedValueOnce("CHUNK_0_DATA")
                    .mockResolvedValueOnce(null);
                const mod = await import("./getItemAsync");
                result = await mod.getItemAsync("TEST_KEY");
            });

            it("should log an error message", () => {
                expect(mockLogger.error).toHaveBeenCalledWith("getItemAsync", {
                    key: "TEST_KEY",
                    message: "One or more chunks missing",
                });
            });

            it("should return null", () => {
                expect(result).toBeNull();
            });
        });
    });

    describe("when JSON parsing fails", () => {
        beforeEach(async () => {
            mockGetMasterKey.mockReturnValue("TEST_KEY_master");
            mockSecureStore.getItemAsync.mockResolvedValueOnce("INVALID_JSON");
            const mod = await import("./getItemAsync");
            try {
                result = await mod.getItemAsync("TEST_KEY");
            } catch (err) {
                result = err;
            }
        });

        it("should throw an error", () => {
            expect(result).toBeInstanceOf(Error);
        });
    });

    describe("when LZString.decompress returns null", () => {
        beforeEach(async () => {
            const masterMetadata = {
                storageType: StorageType.COMPRESSED,
                chunkCount: 1,
            };
            mockGetMasterKey.mockReturnValue("TEST_KEY_master");
            mockSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(masterMetadata));
            mockGetChunkKey.mockReturnValueOnce("TEST_KEY_chunk_0");
            mockSecureStore.getItemAsync.mockResolvedValueOnce("CHUNK_0_DATA");
            mockLZString.decompress.mockReturnValue(null);
            const mod = await import("./getItemAsync");
            result = await mod.getItemAsync("TEST_KEY");
        });

        it("should return null when decompression fails", () => {
            expect(result).toBeNull();
        });
    });
});
