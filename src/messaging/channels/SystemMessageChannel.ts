import {dialog, OpenDialogOptions, shell} from "electron";

import {Messages} from "../Messages";
import {MultiMessageChannel} from "../MultiMessageChannel";

export class SystemMessageChannel extends MultiMessageChannel {
    protected get messages() {
        return [
            {
                executeMessageKey: Messages.OpenUrlInBrowser,
                completedMessageKey: Messages.OpenUrlInBrowserCompleted,
                messageHandler: (params: any) => new Promise((resolve, reject) => {
                    if (params.url) {
                        shell.openExternal(params.url);
                    }
                    resolve(JSON.stringify(params));
                })
            },
            {
                executeMessageKey: Messages.OpenSystemPath,
                completedMessageKey: Messages.OpenSystemPathCompleted,
                messageHandler: (params: any) => new Promise((resolve, reject) => {
                    if (params.dirpath) {
                        shell.openPath(params.dirpath);
                    }
                    if (params.filepath) {
                        Promise.resolve(shell.showItemInFolder(params.filepath));
                    }

                    setTimeout(() => {
                        this.messageBus.mainWindow.setAlwaysOnTop(false);
                        
                        resolve(JSON.stringify(params));
                    }, 500);
                })
            },
            {
                executeMessageKey: Messages.OpenSelectPathDialog,
                completedMessageKey: Messages.OpenSelectPathDialogCompleted,
                messageHandler: (params: any) => new Promise((resolve, reject) => {
                    try {
                        const {directory, multiple, defaultPath} = params;
                        const properties: OpenDialogOptions["properties"] = [
                            directory ? "openDirectory" : "openFile",
                            multiple ? "multiSelections" : undefined,
                        ];
            
                        dialog.showOpenDialog(this.messageBus.mainWindow, {properties, defaultPath}).then((result) => {
                            resolve(JSON.stringify({paths: result.canceled ? undefined : result.filePaths[0]}));
                        });
                        
                    } catch (error) {
                        console.error(error);
                    }
                })
            }
        ];
    }
};
