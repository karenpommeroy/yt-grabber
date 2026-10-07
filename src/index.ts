import {ChildProcess, spawn} from "child_process";
import {app, BrowserWindow, ipcMain} from "electron";
import installExtension, {REACT_DEVELOPER_TOOLS} from "electron-devtools-installer";
import electronReload from "electron-reload";
import Store from "electron-store";
import {replace} from "lodash-es";
import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";
import path from "path";
import treeKill from "tree-kill";

import {isDebugMode, isDevApplication} from "./common/Helpers";
import {createLogger} from "./common/Logger";
import {MessagingService} from "./messaging/MessagingService";

const logger = createLogger({
    level: isDebugMode() || isDevApplication(app) ? "debug" : "warn",
    logFile: true,
    logFilePath: "init.log",
});
let tokenProviderProc: ChildProcess;

momentDurationFormatSetup(moment);

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
let messagingService: MessagingService | null;

process.traceProcessWarnings = true;
Store.initRenderer();

const store = new Store();
const useProofOfOriginToken = store.get("application.useProofOfOriginToken");
const tokenProviderPath = path.resolve(process.cwd(), "./server/build");

const createWindow = async () => {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 920,
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

    logger.info(`Running Proof-of-origin token provider from: ${tokenProviderPath}`);
    
    if (useProofOfOriginToken) {
        tokenProviderProc = startTokenProvider();
    }

    messagingService = new MessagingService(ipcMain, mainWindow);
    logger.debug("Messaging service initialized: %s", messagingService.id);
};

const startTokenProvider = () => {
    const proc = spawn("node", ["main.js"], {
        cwd: tokenProviderPath,
        windowsHide: true,
        shell: false,
    });

    proc.stdout.on("data", (data) => {
        const message = replace(data.toString(), /\n/g, "");

        logger.info(`TokenProvider: ${message}`);
    });

    proc.stderr.on("data", (data) => {
        const message = replace(data.toString(), /\n/g, "");
        logger.error(`TokenProvider process error: ${message}`);
    });

    proc.stderr.on("error", (error) => {
        logger.error(`TokenProvider process error: ${error.message}`);
    });

    proc.on("error", (error) => {
        logger.error(`TokenProvider process error: ${error.message}`);
    });

    proc.on("close", (code) => {
        logger.info(`TokenProvider process exited with code: ${code}`);
    });

    return proc;
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if(tokenProviderProc) {
        tokenProviderProc.kill();
    }

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

    if(tokenProviderProc) {
        tokenProviderProc.kill();
    }

    if (messagingService) {
        messagingService.destroy();
        messagingService = null;
    }
});

app.whenReady().then(() => {
    if (isDevApplication(app)) {
        installExtension(REACT_DEVELOPER_TOOLS)
            .then((name) => logger.debug("Added extension: %s", name))
            .catch((err) => logger.error("An error occurred: %s", err));
    }
});

const stopTokenProvider = () => {
    if (tokenProviderProc?.pid) {
        treeKill(tokenProviderProc.pid, "SIGKILL", (err) => {
            if (err) console.error("tree-kill failed:", err);
        });
        tokenProviderProc = null;
    }
};

app.on("before-quit", stopTokenProvider);
app.on("window-all-closed", stopTokenProvider);
process.on("exit", stopTokenProvider);
process.on("SIGINT", () => { stopTokenProvider(); process.exit(); });
process.on("SIGTERM", () => { stopTokenProvider(); process.exit(); });