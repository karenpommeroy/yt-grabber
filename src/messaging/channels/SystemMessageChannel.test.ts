import type {IpcMainEvent} from "electron";

import {dialog, shell} from "electron";

import {createMessageBus} from "../../common/TestHelpers";
import {Messages} from "../Messages";
import {SystemMessageChannel} from "./SystemMessageChannel";

import type {MultiMessageHandlerParams} from "../MultiMessageChannel";
describe("SystemMessageChannel", () => {
    const messageBus = createMessageBus();
    const createChannel = () => new SystemMessageChannel(messageBus);

    beforeEach(() => {
        jest.clearAllMocks();
        (shell.openExternal as jest.Mock).mockClear();
        (shell.openPath as jest.Mock).mockClear();
        (shell.showItemInFolder as jest.Mock).mockClear();
        (dialog.showOpenDialog as jest.Mock).mockReset();
    });

    test("opens browser and returns serialized payload", async () => {
        const channel = createChannel();
        const params: MultiMessageHandlerParams = {id: "string", url: "https://example.com"};

        await channel.execute({} as IpcMainEvent, params, Messages.OpenUrlInBrowser);

        expect(shell.openExternal).toHaveBeenCalledWith("https://example.com");
        expect(messageBus.mainWindow.webContents.send).toHaveBeenCalledWith(
            `${Messages.OpenUrlInBrowserCompleted}_${params.id}`,
            JSON.stringify(params),
        );
    });

    test("opens directory and clears always-on-top", async () => {
        jest.useFakeTimers();
        const channel = createChannel();
        const params: MultiMessageHandlerParams = {id: "string", dirpath: "C:/tmp"};

        const execPromise = channel.execute({} as IpcMainEvent, params, Messages.OpenSystemPath);
        jest.advanceTimersByTime(500);
        await execPromise;

        expect(shell.openPath).toHaveBeenCalledWith("C:/tmp");
        expect(messageBus.mainWindow.setAlwaysOnTop).toHaveBeenCalledWith(false);
        expect(messageBus.mainWindow.webContents.send).toHaveBeenCalledWith(
            `${Messages.OpenSystemPathCompleted}_${params.id}`,
            JSON.stringify(params),
        );
        jest.useRealTimers();
    });

    test("shows open dialog and resolves selected path", async () => {
        const channel = createChannel();
        (dialog.showOpenDialog as jest.Mock).mockResolvedValue({canceled: false, filePaths: ["D:/music"]});
        const params: MultiMessageHandlerParams = {
            id: "string",
            directory: true,
            multiple: false,
            defaultPath: "D:/",
        };

        await channel.execute({} as IpcMainEvent, params, Messages.OpenSelectPathDialog);

        expect(dialog.showOpenDialog).toHaveBeenCalledWith(messageBus.mainWindow, {
            properties: ["openDirectory", undefined],
            defaultPath: "D:/",
        });
        expect(messageBus.mainWindow.webContents.send).toHaveBeenCalledWith(
            `${Messages.OpenSelectPathDialogCompleted}_${params.id}`,
            JSON.stringify({paths: "D:/music"}),
        );
    });
});
