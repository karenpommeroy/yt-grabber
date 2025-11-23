import {transports} from "winston";

import {createLogger} from "./Logger";

describe("createLogger", () => {
    if (typeof global.setImmediate === "undefined") {
        (global as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) => setTimeout(fn, 0, ...args);
    }

    test("should create a logger with console transport by default", () => {
        const logger = createLogger({ level: "info" });

        expect(logger).toBeDefined();
        expect(logger.transports).toHaveLength(1);
        expect(logger.transports[0]).toBeInstanceOf(transports.Console);
    });

    test("should create a logger with file transport when logFile is true", () => {
        const logger = createLogger({ level: "info", logFile: true, logFilePath: "app.log" });

        expect(logger.transports).toHaveLength(2);
        expect(logger.transports[1]).toBeInstanceOf(transports.File);
        expect((logger.transports[1] as transports.FileTransportInstance).dirname).toBe(".");
        expect((logger.transports[1] as transports.FileTransportInstance).filename).toBe("app.log");
    });

    test("should log messages at different levels", () => {
        const logger = createLogger({ level: "debug" });
        const spy = jest.spyOn(logger, "info");

        logger.info("Test message");

        expect(spy).toHaveBeenCalledWith("Test message");
    });
});
