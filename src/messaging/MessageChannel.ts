import {IpcMainEvent} from "electron";
import {i18n as i18next} from "i18next";
import {LaunchOptions} from "puppeteer";

import {GetYoutubeParams, GetYoutubeResult} from "../common/Messaging";
import {ProgressInfo} from "../common/Reporter";
import i18n from "../i18next";
import {MessageBus} from "./MessageBus";
import {Messages} from "./Messages";

export type MessageHandler = (params: MessageHandlerParams) => Promise<void>

export type MessageHandlerParams = {
    params: GetYoutubeParams;
    options: LaunchOptions;
    i18n: i18next;
    onUpdate: (data: ProgressInfo<GetYoutubeResult>) => void;
    signal: AbortSignal;
}

export type MessageKeys = {
    execute: Messages;
    completed: Messages;
    cancel: Messages;
    canceled: Messages;
}

export abstract class MessageChannel {
    private messageBus: MessageBus;

    protected abstract get messageKeys(): MessageKeys;
    protected abstract get messageHandler(): MessageHandler;

    constructor(messageBus: MessageBus) {
        this.messageBus = messageBus;
        this.initialize();
    }

    public initialize = () => {
        this.messageBus.ipcMain.on(this.messageKeys.execute, this.execute);
        this.messageBus.ipcMain.on(this.messageKeys.cancel, this.cancel);
    };
    
    public execute = async (event: IpcMainEvent, params: GetYoutubeParams, options: LaunchOptions) => {
        const controller = new AbortController();
            
        this.messageBus.controllers.set(this.messageKeys.execute, controller);
        
        try {
            await this.messageHandler({params, options, i18n, onUpdate: this.complete, signal: controller.signal});
        } catch (error) {
            if (controller.signal.aborted) {
                this.messageBus.mainWindow.webContents.send(this.messageKeys.canceled);
            }
        } finally {
            this.messageBus.controllers.delete(this.messageKeys.execute);
        }
    };

    public complete = (data: ProgressInfo<GetYoutubeResult>) => {
        this.messageBus.mainWindow.webContents.send(this.messageKeys.completed, data);
    };

    public cancel = () => {
        this.messageBus.controllers.get(this.messageKeys.execute)?.abort();
    };
};
