import {transports} from "winston";

import {consoleFormat, createLogger} from "./Logger";

import type {TransformableInfo} from "logform";

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

describe("consoleFormat", () => {
    const formatSymbol = Symbol.for("message");
    const stripAnsi = (value: string) => value.replace(/\u001b\[[0-9;]*m/g, "");
    const render = (info: TransformableInfo & Record<string | symbol, unknown>) => {
        const payload = consoleFormat.transform({...info}) as TransformableInfo & Record<symbol, string>;
        return payload?.[formatSymbol] ?? "";
    };

    test("should append meta information", () => {
        const message = render({
            level: "info",
            message: "Processed",
            timestamp: "12:00:00:000",
            meta: "value",
        });

        expect(stripAnsi(message)).toContain("{\"meta\":\"value\"}");
    });

    test("should highlight splat replacements in message", () => {
        const SPLAT = Symbol.for("splat");
        const highlighted = "file.mp3";

        const message = render({
            level: "info",
            message: `Downloading ${highlighted}`,
            timestamp: "12:00:00:000",
            [SPLAT]: [highlighted],
        });

        const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const highlightPattern = new RegExp(`\u001b\\[[0-9;]*m${escapeRegExp(highlighted)}\u001b\\[[0-9;]*m`);

        expect(message).toMatch(highlightPattern);
    });
});
