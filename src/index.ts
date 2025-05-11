import {app, BrowserWindow, ipcMain} from "electron";
import installExtension, {REACT_DEVELOPER_TOOLS} from "electron-devtools-installer";
import electronReload from "electron-reload";
import Store from "electron-store";
import path from "path";

import {MessagingService} from "./messaging/MessagingService";

const isDev = () => !app.isPackaged;

isDev() && electronReload(__dirname, {
    electron: path.join(__dirname, "..", 'node_modules', "electron", 'dist', "electron.exe"),
    interval: 2000,
});

/* Alternative reload using different electron binary */

// require("electron-reload")(__dirname, {
//     electron: path.join(__dirname, "..", "node_modules", ".bin", "electron.cmd"),
//     hardReset: true,
//     livenessThreshold: 2000,
// });

let mainWindow: BrowserWindow | null;

process.traceProcessWarnings = true;
Store.initRenderer();

const createWindow = async () => {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 900,
        frame: true,
        roundedCorners: true,
        title: "YT Grabber",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    mainWindow.loadFile(path.join(__dirname, "index.html"));

    if (isDev()) {
        mainWindow.webContents.openDevTools({mode: "detach",});
    } else {
        mainWindow.removeMenu();
        mainWindow.setMenu(null);
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    
    const messaggingService = new MessagingService(ipcMain, mainWindow);
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
    isDev() && installExtension(REACT_DEVELOPER_TOOLS)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log("An error occurred: ", err));
});
