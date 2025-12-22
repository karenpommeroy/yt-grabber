import {app, BrowserWindow, ipcMain} from "electron";
import installExtension, {REACT_DEVELOPER_TOOLS} from "electron-devtools-installer";
import electronReload from "electron-reload";
import Store from "electron-store";
import path from "path";

import {isDebugMode, isDevApplication} from "./common/Helpers";
import {createLogger} from "./common/Logger";
import {MessagingService} from "./messaging/MessagingService";

const logger = createLogger({
    level: isDebugMode() ? "debug" : "error",
    logFile: true,
    logFilePath: "init.log",
});

if (isDevApplication(app)) {
    electronReload(__dirname, {
        electron: path.join(__dirname, "..", "node_modules", "electron", "dist", "electron.exe"),
        interval: 2000,
    });

    /* Alternative reload using different electron binary */

    // require("electron-reload")(__dirname, {
    //     electron: path.join(__dirname, "..", "node_modules", ".bin", "electron.cmd"),
    //     hardReset: true,
    //     livenessThreshold: 2000,
    // });

    logger.debug("Electron reload initialized.");
}

let mainWindow: BrowserWindow | null;

process.traceProcessWarnings = true;
Store.initRenderer();

const createWindow = async () => {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 970,
        frame: true,
        roundedCorners: true,
        title: "YT Grabber",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    mainWindow.loadFile(path.join(__dirname, "index.html"));
    logger.debug("Main window created.");

    if (isDevApplication(app)) {
        mainWindow.webContents.openDevTools({mode: "detach"});
        logger.debug("DevTools opened.");
    } else {
        mainWindow.removeMenu();
        mainWindow.setMenu(null);
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
        logger.debug("Main window closed.");
    });
    

    const messaggingService = new MessagingService(ipcMain, mainWindow);
    logger.debug("Messaging service initialized: %s", messaggingService.id);
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
    if (isDevApplication(app)) {
        installExtension(REACT_DEVELOPER_TOOLS)
            .then((name) => logger.debug("Added extension: %s", name))
            .catch((err) => logger.error("An error occurred: %s", err));
    }
});
