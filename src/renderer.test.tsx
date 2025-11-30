import Store from "electron-store";
import {createRoot} from "react-dom/client";

import {getProcessArgs} from "./common/Helpers";
import {createLogger, ILogger} from "./common/Logger";
import schema from "./common/Store";

jest.mock("react-dom/client", () => require("@tests/mocks/react-dom-client"));
jest.mock("./common/Helpers", () => require("@tests/mocks/common/Helpers"));
jest.mock("./common/Logger", () => require("@tests/mocks/common/Logger"));

describe("renderer", () => {
    const loadRenderer = async () => {
        let bootstrapInstance;

        await jest.isolateModulesAsync(async () => {
            const {Bootstrap} = await import("./bootstrap");
            bootstrapInstance = Bootstrap;
            await import("./renderer");
        });

        return {bootstrapInstance};
    };

    const mockedStore = Store as jest.MockedClass<typeof Store>;
    const mockedCreateRoot = createRoot as jest.MockedFunction<typeof createRoot>;
    const mockedGetProcessArgs = getProcessArgs as jest.MockedFunction<typeof getProcessArgs>;
    const mockedCreateLogger = createLogger as jest.MockedFunction<typeof createLogger>;

    beforeEach(() => {
        document.body.innerHTML = "<div id=\"root\"></div>";
        delete (globalThis as any).logger;
        delete (globalThis as any).store;
    });

    test("configures debug logging when the debug flag is present", async () => {
        const storeInstance = {} as InstanceType<typeof Store>;
        const renderSpy = jest.fn();
        const rootMock = {render: renderSpy, unmount: jest.fn()} as ReturnType<typeof createRoot>;
        const loggerMock = {debug: jest.fn(), success: jest.fn()} as unknown as ILogger;

        mockedStore.mockImplementation(() => storeInstance);
        mockedCreateRoot.mockReturnValue(rootMock);
        mockedGetProcessArgs.mockReturnValue({debug: true});
        mockedCreateLogger.mockReturnValue(loggerMock);

        const {bootstrapInstance} = await loadRenderer();

        expect(mockedGetProcessArgs).toHaveBeenCalledTimes(1);
        expect(mockedCreateLogger).toHaveBeenCalledWith({
            level: "debug",
            logFile: true,
            logFilePath: "application.log",
        });
        expect(global.logger).toBe(loggerMock);
        expect(mockedStore).toHaveBeenCalledWith({schema, clearInvalidConfig: true});
        expect(global.store).toBe(storeInstance);

        const container = document.getElementById("root");
        expect(mockedCreateRoot).toHaveBeenCalledWith(container);
        expect(renderSpy).toHaveBeenCalledWith(expect.objectContaining({type: bootstrapInstance}));

        expect(loggerMock.debug).toHaveBeenNthCalledWith(1, "Electron store initialized.");
        expect(loggerMock.debug).toHaveBeenNthCalledWith(2, "Application rendered.");
    });

    test("falls back to error level logging when the flag is missing", async () => {
        const storeInstance = {} as InstanceType<typeof Store>;
        const renderSpy = jest.fn();
        const rootMock = {render: renderSpy, unmount: jest.fn()} as ReturnType<typeof createRoot>;
        const loggerMock = {debug: jest.fn(), success: jest.fn()} as unknown as ILogger;

        mockedStore.mockImplementation(() => storeInstance);
        mockedCreateRoot.mockReturnValue(rootMock);
        mockedGetProcessArgs.mockReturnValue({});
        mockedCreateLogger.mockReturnValue(loggerMock);

        const {bootstrapInstance} = await loadRenderer();

        expect(mockedCreateLogger).toHaveBeenCalledWith({
            level: "error",
            logFile: true,
            logFilePath: "application.log",
        });
        expect(renderSpy).toHaveBeenCalledWith(expect.objectContaining({type: bootstrapInstance}));
        expect(loggerMock.debug).toHaveBeenCalledTimes(2);
    });
});
