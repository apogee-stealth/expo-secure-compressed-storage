/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

describe("src > shared > lib > expo-secure-compressed-storage > config > configure", () => {
    let mockLogger: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
    });

    describe("with configure", () => {
        describe("when called for the first time", () => {
            let mod: any;

            beforeEach(async () => {
                mod = await import("./configure");
                mod.configure({ logger: mockLogger, chunkSize: 1024 });
            });

            it("should set the logger to the provided logger", () => {
                expect(mod.getLogger()).toBe(mockLogger);
            });

            it("should set the chunk size to the provided value", () => {
                expect(mod.getChunkSize()).toBe(1024);
            });

            it("should mark the library as configured", () => {
                expect(() => mod.configure({})).toThrow(
                    "expo-secure-compressed-storage already configured"
                );
            });
        });

        describe("when called with only logger", () => {
            let mod: any;

            beforeEach(async () => {
                mod = await import("./configure");
                mod.configure({ logger: mockLogger });
            });

            it("should set the logger to the provided logger", () => {
                expect(mod.getLogger()).toBe(mockLogger);
            });

            it("should use the default chunk size", () => {
                expect(mod.getChunkSize()).toBe(2048);
            });
        });

        describe("when called with only chunk size", () => {
            let mod: any;

            beforeEach(async () => {
                mod = await import("./configure");
                mod.configure({ chunkSize: 4096 });
            });

            it("should use the default logger", () => {
                const logger = mod.getLogger();
                expect(logger).toEqual({
                    debug: expect.any(Function),
                    info: expect.any(Function),
                    warn: expect.any(Function),
                    error: expect.any(Function),
                });
            });

            it("should set the chunk size to the provided value", () => {
                expect(mod.getChunkSize()).toBe(4096);
            });
        });

        describe("when called with no arguments", () => {
            let mod: any;

            beforeEach(async () => {
                mod = await import("./configure");
                mod.configure({});
            });

            it("should use the default logger", () => {
                const logger = mod.getLogger();
                expect(logger).toEqual({
                    debug: expect.any(Function),
                    info: expect.any(Function),
                    warn: expect.any(Function),
                    error: expect.any(Function),
                });
            });

            it("should use the default chunk size", () => {
                expect(mod.getChunkSize()).toBe(2048);
            });
        });

        describe("when called after already being configured", () => {
            let mod: any;

            beforeEach(async () => {
                mod = await import("./configure");
                mod.configure({ logger: mockLogger, chunkSize: 1024 });
            });

            it("should throw an error", () => {
                expect(() => mod.configure({ logger: mockLogger, chunkSize: 2048 })).toThrow(
                    "expo-secure-compressed-storage already configured"
                );
            });
        });
    });

    describe("with getLogger", () => {
        describe("when library has not been configured", () => {
            let mod: any;

            beforeEach(async () => {
                mod = await import("./configure");
            });

            it("should return the default logger", () => {
                const logger = mod.getLogger();
                expect(logger).toEqual({
                    debug: expect.any(Function),
                    info: expect.any(Function),
                    warn: expect.any(Function),
                    error: expect.any(Function),
                });
            });
        });

        describe("when library has been configured", () => {
            let mod: any;

            beforeEach(async () => {
                mod = await import("./configure");
                mod.configure({ logger: mockLogger });
            });

            it("should return the configured logger", () => {
                expect(mod.getLogger()).toBe(mockLogger);
            });
        });
    });

    describe("with getChunkSize", () => {
        describe("when library has not been configured", () => {
            let mod: any;

            beforeEach(async () => {
                mod = await import("./configure");
            });

            it("should return the default chunk size", () => {
                expect(mod.getChunkSize()).toBe(2048);
            });
        });

        describe("when library has been configured", () => {
            let mod: any;

            beforeEach(async () => {
                mod = await import("./configure");
                mod.configure({ chunkSize: 3072 });
            });

            it("should return the configured chunk size", () => {
                expect(mod.getChunkSize()).toBe(3072);
            });
        });
    });
});
