import {BrowserWindow, IpcMain} from "electron";

import {Messages} from "./Messages";

export class MessageBus {
    public ipcMain: IpcMain;
    public mainWindow: BrowserWindow;
    public controllers = new Map<Messages, AbortController>();

    constructor(ipcMain: IpcMain, mainWindow: BrowserWindow) {
        this.ipcMain = ipcMain;
        this.mainWindow = mainWindow;
    }
};
