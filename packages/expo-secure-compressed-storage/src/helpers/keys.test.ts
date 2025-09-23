/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

describe("shared > lib > expo-secure-compressed-storage > helpers > keys", () => {
    let validateKey: any, getMasterKey: any, getChunkKey: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        jest.resetModules();
        const mod = await import("./keys");
        validateKey = mod.validateKey;
        getMasterKey = mod.getMasterKey;
        getChunkKey = mod.getChunkKey;
    });

    describe("with validateKey", () => {
        describe("when the key is valid", () => {
            it("should not throw for a simple alphanumeric key", () => {
                expect(() => validateKey("user_data")).not.toThrow();
            });

            it("should not throw for a key with underscores", () => {
                expect(() => validateKey("user_preferences_data")).not.toThrow();
            });

            it("should not throw for a key with numbers", () => {
                expect(() => validateKey("data123")).not.toThrow();
            });

            it("should not throw for a key with mixed case", () => {
                expect(() => validateKey("UserData123")).not.toThrow();
            });
        });

        describe("when the key is invalid", () => {
            it("should throw when key is empty string", () => {
                expect(() => validateKey("")).toThrow("Key must be a non-empty string");
            });

            it("should throw when key is not a string", () => {
                expect(() => validateKey(null as any)).toThrow("Key must be a non-empty string");
            });

            it("should throw when key is undefined", () => {
                expect(() => validateKey(undefined as any)).toThrow(
                    "Key must be a non-empty string"
                );
            });

            it("should throw when key is a number", () => {
                expect(() => validateKey(123 as any)).toThrow("Key must be a non-empty string");
            });

            it("should throw when key is an object", () => {
                expect(() => validateKey({} as any)).toThrow("Key must be a non-empty string");
            });

            it("should throw when key ends with _master", () => {
                expect(() => validateKey("data_master")).toThrow(
                    "Key cannot end with _master or contain _chunk_"
                );
            });

            it("should throw when key contains _chunk_", () => {
                expect(() => validateKey("data_chunk_0")).toThrow(
                    "Key cannot end with _master or contain _chunk_"
                );
            });

            it("should throw when key contains special characters", () => {
                expect(() => validateKey("data@invalid")).toThrow(
                    "Key can only contain alphanumeric characters and underscores"
                );
            });
        });
    });

    describe("with getMasterKey", () => {
        it("should return the key with _master suffix", () => {
            expect(getMasterKey("user_data")).toBe("user_data_master");
        });
    });

    describe("with getChunkKey", () => {
        it("should return the key with chunk suffix and zero index", () => {
            expect(getChunkKey("user_data", 0)).toBe("user_data_chunk_0");
        });
    });
});
