/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

const mockSecureStore = {
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
};
jest.mock("expo-secure-store", () => {
    return mockSecureStore;
});

const mockValidateKey = jest.fn();
const mockGetMasterKey = jest.fn();
const mockGetChunkKey = jest.fn();
jest.mock("../helpers/keys", () => {
    return {
        validateKey: mockValidateKey,
        getMasterKey: mockGetMasterKey,
        getChunkKey: mockGetChunkKey,
    };
});

const mockGetLogger = jest.fn();
jest.mock("../config/configure", () => {
    return { getLogger: mockGetLogger };
});

import { MasterMetadata, StorageType } from "../types";

describe("expo-secure-compressed-storage > storageApi > deleteItemAsync", () => {
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
        mockValidateKey.mockImplementation(() => {
            // no-op
        });
        mockGetMasterKey.mockReturnValue("USER_DATA_master");
        mockGetChunkKey.mockImplementation(
            (key: string, chunkNumber: number) => `${key}_chunk_${chunkNumber}`
        );
    });

    describe("when calling deleteItemAsync", () => {
        describe("when everything goes splendiferously", () => {
            beforeEach(async () => {
                const masterMetadata: MasterMetadata = {
                    storageType: StorageType.COMPRESSED,
                    chunkCount: 3,
                };
                mockSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(masterMetadata));
                mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);

                const mod = await import("./deleteItemAsync");
                result = await mod.deleteItemAsync("USER_DATA");
            });

            it("should call validateKey with the provided key", () => {
                expect(mockValidateKey).toHaveBeenCalledTimes(1);
                expect(mockValidateKey).toHaveBeenCalledWith("USER_DATA");
            });

            it("should call getLogger to get the logger instance", () => {
                expect(mockGetLogger).toHaveBeenCalledTimes(1);
            });

            it("should call getMasterKey with the provided key", () => {
                expect(mockGetMasterKey).toHaveBeenCalledTimes(1);
                expect(mockGetMasterKey).toHaveBeenCalledWith("USER_DATA");
            });

            it("should call SecureStore.getItemAsync with the master key", () => {
                expect(mockSecureStore.getItemAsync).toHaveBeenCalledTimes(1);
                expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith("USER_DATA_master");
            });

            it("should call getChunkKey for each chunk", () => {
                expect(mockGetChunkKey).toHaveBeenCalledTimes(3);
                expect(mockGetChunkKey).toHaveBeenNthCalledWith(1, "USER_DATA", 0);
                expect(mockGetChunkKey).toHaveBeenNthCalledWith(2, "USER_DATA", 1);
                expect(mockGetChunkKey).toHaveBeenNthCalledWith(3, "USER_DATA", 2);
            });

            it("should call SecureStore.deleteItemAsync for master key and all chunks", () => {
                expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledTimes(4);
                expect(mockSecureStore.deleteItemAsync).toHaveBeenNthCalledWith(
                    1,
                    "USER_DATA_master"
                );
                expect(mockSecureStore.deleteItemAsync).toHaveBeenNthCalledWith(
                    2,
                    "USER_DATA_chunk_0"
                );
                expect(mockSecureStore.deleteItemAsync).toHaveBeenNthCalledWith(
                    3,
                    "USER_DATA_chunk_1"
                );
                expect(mockSecureStore.deleteItemAsync).toHaveBeenNthCalledWith(
                    4,
                    "USER_DATA_chunk_2"
                );
            });

            it("should resolve without returning a value", () => {
                expect(result).toBeUndefined();
            });
        });

        describe("when no master metadata exists", () => {
            beforeEach(async () => {
                mockSecureStore.getItemAsync.mockResolvedValueOnce(null);

                const mod = await import("./deleteItemAsync");
                result = await mod.deleteItemAsync("USER_DATA");
            });

            it("should call validateKey with the provided key", () => {
                expect(mockValidateKey).toHaveBeenCalledTimes(1);
                expect(mockValidateKey).toHaveBeenCalledWith("USER_DATA");
            });

            it("should call getLogger to get the logger instance", () => {
                expect(mockGetLogger).toHaveBeenCalledTimes(1);
            });

            it("should call getMasterKey with the provided key", () => {
                expect(mockGetMasterKey).toHaveBeenCalledTimes(1);
                expect(mockGetMasterKey).toHaveBeenCalledWith("USER_DATA");
            });

            it("should call SecureStore.getItemAsync with the master key", () => {
                expect(mockSecureStore.getItemAsync).toHaveBeenCalledTimes(1);
                expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith("USER_DATA_master");
            });

            it("should not call SecureStore.deleteItemAsync", () => {
                expect(mockSecureStore.deleteItemAsync).not.toHaveBeenCalled();
            });

            it("should resolve without returning a value", () => {
                expect(result).toBeUndefined();
            });
        });

        describe("when master metadata exists with zero chunks", () => {
            beforeEach(async () => {
                const masterMetadata: MasterMetadata = {
                    storageType: StorageType.UNCOMPRESSED,
                    chunkCount: 0,
                };
                mockSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(masterMetadata));
                mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);

                const mod = await import("./deleteItemAsync");
                result = await mod.deleteItemAsync("USER_DATA");
            });

            it("should call SecureStore.deleteItemAsync only for the master key", () => {
                expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
                expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith("USER_DATA_master");
            });

            it("should not call getChunkKey", () => {
                expect(mockGetChunkKey).not.toHaveBeenCalled();
            });

            it("should resolve without returning a value", () => {
                expect(result).toBeUndefined();
            });
        });

        describe("when master metadata exists with single chunk", () => {
            beforeEach(async () => {
                const masterMetadata: MasterMetadata = {
                    storageType: StorageType.COMPRESSED,
                    chunkCount: 1,
                };
                mockSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(masterMetadata));
                mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);

                const mod = await import("./deleteItemAsync");
                result = await mod.deleteItemAsync("USER_DATA");
            });

            it("should call getChunkKey for the single chunk", () => {
                expect(mockGetChunkKey).toHaveBeenCalledTimes(1);
                expect(mockGetChunkKey).toHaveBeenCalledWith("USER_DATA", 0);
            });

            it("should call SecureStore.deleteItemAsync for master key and single chunk", () => {
                expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
                expect(mockSecureStore.deleteItemAsync).toHaveBeenNthCalledWith(
                    1,
                    "USER_DATA_master"
                );
                expect(mockSecureStore.deleteItemAsync).toHaveBeenNthCalledWith(
                    2,
                    "USER_DATA_chunk_0"
                );
            });

            it("should resolve without returning a value", () => {
                expect(result).toBeUndefined();
            });
        });

        describe("when JSON.parse throws an error", () => {
            beforeEach(async () => {
                mockSecureStore.getItemAsync.mockResolvedValueOnce("INVALID_JSON");
                // Mock JSON.parse to throw an error
                const originalJSONParse = JSON.parse;
                JSON.parse = jest.fn().mockImplementationOnce(() => {
                    throw new Error("E_MALFORMED_JSON");
                });

                const mod = await import("./deleteItemAsync");
                try {
                    await mod.deleteItemAsync("USER_DATA");
                } catch (thrownErr) {
                    result = thrownErr;
                } finally {
                    JSON.parse = originalJSONParse;
                }
            });

            it("should call validateKey with the provided key", () => {
                expect(mockValidateKey).toHaveBeenCalledTimes(1);
                expect(mockValidateKey).toHaveBeenCalledWith("USER_DATA");
            });

            it("should call getMasterKey with the provided key", () => {
                expect(mockGetMasterKey).toHaveBeenCalledTimes(1);
                expect(mockGetMasterKey).toHaveBeenCalledWith("USER_DATA");
            });

            it("should call SecureStore.getItemAsync with the master key", () => {
                expect(mockSecureStore.getItemAsync).toHaveBeenCalledTimes(1);
                expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith("USER_DATA_master");
            });

            it("should not call getChunkKey", () => {
                expect(mockGetChunkKey).not.toHaveBeenCalled();
            });

            it("should not call SecureStore.deleteItemAsync", () => {
                expect(mockSecureStore.deleteItemAsync).not.toHaveBeenCalled();
            });

            it("should throw the JSON parse error", () => {
                expect(result).toEqual(new Error("E_MALFORMED_JSON"));
            });
        });
    });
});
