import {
    createLogger as createWinston, format, LeveledLogMethod, Logger, LoggerOptions, transport,
    transports
} from "winston";

export interface ILoggerOptions extends LoggerOptions {
    logFile?: boolean;
    logFilePath?: string;
};

export interface ILogger extends Logger {
    success: LeveledLogMethod;
};

const levels = {
    error: 0,
    warn: 1,
    success: 1,
    info: 3,
    verbose: 4,
    debug: 5,
};

const colorizer = format.colorize({
    colors: {
        error: "red",
        warn: "yellow",
        success: "green",
        info: "blue",
        verbose: "grey",
        debug: "magenta",
    },
});

const timeFormat = format.timestamp({format: "HH:mm:ss:SSS"});
export const fileFormat = format.printf(({level, message, timestamp, ...meta}) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
});
export const consoleFormat = format.printf(({level, message, timestamp, ...meta}) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    const symbols = Object.getOwnPropertySymbols(meta);
    const splatSymbol = symbols.find(sym => sym.description === "splat");

    if (splatSymbol && typeof message === "string") {
        const splat = meta[splatSymbol] as any[];

        for (const item of splat) {
            message = (message as string).replace(item, (match) => colorizer.colorize("verbose", match));
        }
    }
    
    return `${timestamp} [${colorizer.colorize(level, level.toUpperCase())}]: ${message}${colorizer.colorize("verbose", metaString)}`;
});

export const createLogger = (options: ILoggerOptions): ILogger => {
    const {level = "error", logFile, logFilePath = "log.log"} = options;
    const transportsArray: transport[] = [
        new transports.Console({format: format.combine(format.splat(), timeFormat, consoleFormat), level})
    ];

    if (logFile) {
        transportsArray.push(new transports.File({filename: logFilePath, level, format: format.combine(format.splat(), timeFormat, fileFormat)}));
    }

    return createWinston({
        level,
        levels,
        format: format.combine(timeFormat, format.json()),
        transports: transportsArray,
    }) as ILogger;
};
