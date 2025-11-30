import type {BrowserWindow, IpcMain} from "electron";

import {MessageBus} from "./MessageBus";
import {Messages} from "./Messages";

describe("MessageBus", () => {
    test("stores ipc and window references", () => {
        const ipcMain = {} as IpcMain;
        const mainWindow = {id: 1} as unknown as BrowserWindow;

        const bus = new MessageBus(ipcMain, mainWindow);

        expect(bus.ipcMain).toBe(ipcMain);
        expect(bus.mainWindow).toBe(mainWindow);
        expect(bus.controllers).toBeInstanceOf(Map);
        expect(bus.controllers.size).toBe(0);
    });

    test("controllers map keyed by Messages enum", () => {
        const bus = new MessageBus({} as IpcMain, {} as BrowserWindow);
        const controller = new AbortController();

        bus.controllers.set(Messages.OpenSystemPath, controller);

        expect(bus.controllers.get(Messages.OpenSystemPath)).toBe(controller);
    });
});
