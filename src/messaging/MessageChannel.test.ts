import type {IpcMainEvent} from "electron";
import type {LaunchOptions} from "puppeteer-core";

import type {ProgressInfo} from "../common/Reporter";
import type {GetYoutubeResult} from "../common/Messaging";
import {MessageChannel, MessageHandler, MessageKeys} from "./MessageChannel";
import {Messages} from "./Messages";

const defaultKeys: MessageKeys = {
    execute: Messages.GetYoutubeUrls,
    completed: Messages.GetYoutubeUrlsCompleted,
    cancel: Messages.GetYoutubeUrlsCancel,
    canceled: Messages.GetYoutubeUrlsCanceled,
};

let activeKeys: MessageKeys = defaultKeys;
let activeHandler: MessageHandler = jest.fn();

class TestChannel extends MessageChannel {
    protected get messageKeys(): MessageKeys {
        return activeKeys;
    }

    protected get messageHandler(): MessageHandler {
        return activeHandler;
    }
}

type MessageBusStub = {
    ipcMain: {
        on: jest.Mock;
        once: jest.Mock;
        removeListener: jest.Mock;
    };
    mainWindow: {webContents: {send: jest.Mock}};
    controllers: Map<Messages, AbortController>;
};

const createMessageBus = () => {
    const stub: MessageBusStub = {
        ipcMain: {
            on: jest.fn(),
            once: jest.fn(),
            removeListener: jest.fn(),
        },
        mainWindow: {
            webContents: {
                send: jest.fn(),
            },
        },
        controllers: new Map(),
    };

    return {stub, bus: stub as unknown as any};
};

describe("MessageChannel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        activeKeys = defaultKeys;
        activeHandler = jest.fn().mockResolvedValue(undefined);
    });

    test("registers execute and cancel listeners on construction", () => {
        const {stub, bus} = createMessageBus();

        const channel = new TestChannel(bus);

        expect(stub.ipcMain.on).toHaveBeenCalledWith(defaultKeys.execute, channel.execute);
        expect(stub.ipcMain.on).toHaveBeenCalledWith(defaultKeys.cancel, channel.cancel);
    });

    test("execute stores controller, invokes handler, and reports completion", async () => {
        const resultPayload: ProgressInfo<GetYoutubeResult> = {
            progress: 100,
            task: "done",
            subtask: "",
            result: {values: [], sources: []},
        };
        activeHandler = jest.fn(async ({onUpdate}) => {
            onUpdate(resultPayload);
        });
        const {stub, bus} = createMessageBus();
        const channel = new TestChannel(bus);

        await channel.execute({} as IpcMainEvent, {url: ""} as any, {} as LaunchOptions);

        expect(activeHandler).toHaveBeenCalled();
        expect(stub.controllers.size).toBe(0);
        expect(stub.mainWindow.webContents.send).toHaveBeenCalledWith(defaultKeys.completed, resultPayload);
    });

    test("execute notifies canceled when aborted signal rejects", async () => {
        activeHandler = jest.fn(({signal}) => new Promise((_, reject) => {
            signal.addEventListener("abort", () => reject(new Error("aborted")));
        }));
        const {stub, bus} = createMessageBus();
        const channel = new TestChannel(bus);

        const execution = channel.execute({} as IpcMainEvent, {url: ""} as any, {} as LaunchOptions).catch((): void => undefined);
        const controller = stub.controllers.get(defaultKeys.execute);
        controller?.abort();

        await execution;

        expect(stub.mainWindow.webContents.send).toHaveBeenCalledWith(defaultKeys.canceled);
        expect(stub.controllers.size).toBe(0);
    });

    test("cancel aborts stored controller", () => {
        const {stub, bus} = createMessageBus();
        const channel = new TestChannel(bus);
        const controller = new AbortController();

        stub.controllers.set(defaultKeys.execute, controller);
        const abortSpy = jest.spyOn(controller, "abort");

        channel.cancel();

        expect(abortSpy).toHaveBeenCalled();
    });

    test("pause sends pause event and resolves with resume payload", async () => {
        activeKeys = {
            ...defaultKeys,
            pause: Messages.GetYoutubeArtistsPause,
            resume: Messages.GetYoutubeArtistsResume,
        };
        const {stub, bus} = createMessageBus();
        const channel = new TestChannel(bus);

        const pausePromise = channel.pause(["pending"]);

        expect(stub.mainWindow.webContents.send).toHaveBeenCalledWith(activeKeys.pause, ["pending"]);
        expect(stub.ipcMain.once).toHaveBeenCalledWith(activeKeys.resume, expect.any(Function));

        const resumeHandler = stub.ipcMain.once.mock.calls[0][1];
        resumeHandler({}, {status: "ok"});

        await expect(pausePromise).resolves.toEqual({status: "ok"});
    });

    test("destroy removes execute and cancel listeners and clears controllers", () => {
        const {stub, bus} = createMessageBus();
        const channel = new TestChannel(bus);
        const removeListenerSpy = jest.spyOn(stub.ipcMain, "removeListener");

        stub.controllers.set(defaultKeys.execute, new AbortController());
        channel.destroy();

        expect(removeListenerSpy).toHaveBeenCalledWith(defaultKeys.execute, channel.execute);
        expect(removeListenerSpy).toHaveBeenCalledWith(defaultKeys.cancel, channel.cancel);
        expect(stub.controllers.size).toBe(0);
    });
});
