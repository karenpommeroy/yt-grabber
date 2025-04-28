import {
    app, BrowserWindow, dialog, ipcMain, IpcMainEvent, OpenDialogOptions, shell
} from "electron";
import installExtension, {REACT_DEVELOPER_TOOLS} from "electron-devtools-installer";
import electronReload from "electron-reload";
import Store from "electron-store";
import path from "path";
import {LaunchOptions} from "puppeteer";

import getYoutubeUrls, {cancel as getYoutubeUrlsCancel} from "./automations/Youtube";
import getYoutubeAlbums, {cancel as getYoutubeAlbumsCancel} from "./automations/YoutubeAlbums";
import getYoutubeArtists, {cancel as getYoutubeArtistsCancel} from "./automations/YoutubeArtists";
import getYoutubeSongs, {cancel as getYoutubeSongsCancel} from "./automations/YoutubeSongs";
import {
    GetYoutubeAlbumsParams, GetYoutubeArtistsParams, GetYoutubeSongsParams, GetYoutubeUrlParams,
    GetYoutubeUrlResult, OpenSelectPathDialogParams, OpenSystemPathParams, OpenUrlInBrowserParams
} from "./common/Messaging";
import {ProgressInfo} from "./common/Reporter";
import i18n from "./i18next";

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

ipcMain.on(
    "open-system-path",
    async (event: IpcMainEvent, params: OpenSystemPathParams) => {
        if (params.dirpath) {
            shell.openPath(params.dirpath);
        }
        if (params.filepath) {
            shell.showItemInFolder(params.filepath);
        }
        
        setTimeout(() => {
            if (mainWindow) {
                mainWindow.setAlwaysOnTop(false);
            }
            
            mainWindow.webContents.send("open-system-path-completed", JSON.stringify(params));
        }, 500);
    },
);

ipcMain.on(
    "open-select-path-dialog",
    async (event: IpcMainEvent, params: OpenSelectPathDialogParams) => {
        try {
            const {directory, multiple, defaultPath} = params;
            const properties: OpenDialogOptions["properties"] = [
                directory ? "openDirectory" : "openFile",
                multiple ? "multiSelections" : undefined,
            ];

            const result = await dialog.showOpenDialog(mainWindow, {properties, defaultPath});
            
            mainWindow.webContents.send("open-select-path-dialog-completed", JSON.stringify({paths: result.canceled ? undefined : result.filePaths[0]}));
        } catch (error) {
            console.error(error);
        }
    },
);

ipcMain.on(
    "open-url-in-browser",
    async (event: IpcMainEvent, params: OpenUrlInBrowserParams) => {
        if (params.url) {
            shell.openExternal(params.url);
        }
        
        mainWindow.webContents.send("open-url-in-browser-completed", JSON.stringify(params));
    },
);

ipcMain.on(
    "get-youtube-urls",
    async (
        event: IpcMainEvent,
        params: GetYoutubeUrlParams,
        options: LaunchOptions,
    ) => {
        const onProgress = (data: ProgressInfo<GetYoutubeUrlResult>) => mainWindow.webContents.send("get-youtube-urls-progress", data);
        
        getYoutubeUrls(params, options, i18n, onProgress);
    },
);

ipcMain.on(
    "get-youtube-artists",
    async (
        event: IpcMainEvent,
        params: GetYoutubeArtistsParams,
        options: LaunchOptions,
    ) => {
        const onProgress = (data: ProgressInfo<GetYoutubeUrlResult>) => mainWindow.webContents.send("get-youtube-artists-progress", data);
        
        getYoutubeArtists(params, options, i18n, onProgress);
    },
);

ipcMain.on(
    "get-youtube-albums",
    async (
        event: IpcMainEvent,
        params: GetYoutubeAlbumsParams,
        options: LaunchOptions,
    ) => {
        const onProgress = (data: ProgressInfo<GetYoutubeUrlResult>) => mainWindow.webContents.send("get-youtube-albums-progress", data);
        
        getYoutubeAlbums(params, options, i18n, onProgress);
    },
);

ipcMain.on(
    "get-youtube-songs",
    async (
        event: IpcMainEvent,
        params: GetYoutubeSongsParams,
        options: LaunchOptions,
    ) => {
        const onProgress = (data: ProgressInfo<GetYoutubeUrlResult>) => mainWindow.webContents.send("get-youtube-songs-progress", data);
        
        getYoutubeSongs(params, options, i18n, onProgress);
    },
);

ipcMain.on(
    "get-youtube-urls-cancel",
    async (event: IpcMainEvent, options: LaunchOptions) => {
        await getYoutubeUrlsCancel();
        mainWindow.webContents.send("get-youtube-urls-cancelled");
    },
);

ipcMain.on(
    "get-youtube-artists-cancel",
    async (event: IpcMainEvent, options: LaunchOptions) => {
        await getYoutubeArtistsCancel();
        mainWindow.webContents.send("get-youtube-artists-cancelled");
    },
);

ipcMain.on(
    "get-youtube-albums-cancel",
    async (event: IpcMainEvent, options: LaunchOptions) => {
        await getYoutubeAlbumsCancel();
        mainWindow.webContents.send("get-youtube-albums-cancelled");
    },
);

ipcMain.on(
    "get-youtube-songs-cancel",
    async (event: IpcMainEvent, options: LaunchOptions) => {
        await getYoutubeSongsCancel();
        mainWindow.webContents.send("get-youtube-songs-cancelled");
    },
);
