import {app, BrowserWindow, ipcMain, IpcMainEvent} from "electron";
import installExtension, {REACT_DEVELOPER_TOOLS} from "electron-devtools-installer";
import Store from "electron-store";
import path from "path";
import {LaunchOptions} from "puppeteer";

import {ProgressInfo} from "./common/Reporter";
import i18n from "./i18next";
import execute, {cancel} from "./workflows/Generic";

let mainWindow: BrowserWindow | null;

process.traceProcessWarnings = true;
Store.initRenderer();

const isDev = () => !app.isPackaged;

const createWindow = async () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 900,
        frame: true,
        roundedCorners: true,
        title: "YT Grabber",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    mainWindow.removeMenu();
    mainWindow.setMenu(null);
    mainWindow.loadFile(path.join(__dirname, "index.html"));

    if (isDev()) {
        mainWindow.webContents.openDevTools({mode: "detach"});
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on("before-quit", () => {
    if (mainWindow !== null) {
        mainWindow.removeAllListeners("closed");
    }
});

app.whenReady().then(() => {
    installExtension(REACT_DEVELOPER_TOOLS)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log("An error occurred: ", err));
});

ipcMain.on("transfer-to-agresso", async (event: IpcMainEvent, options: LaunchOptions) => {
    const onProgress = (data: ProgressInfo) => mainWindow.webContents.send("progress", data);

    execute(options, i18n, onProgress);
});

ipcMain.on("transfer-to-agresso-cancel", async (event: IpcMainEvent, options: LaunchOptions) => {
    cancel();
});
