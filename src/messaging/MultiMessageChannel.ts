import {IpcMainEvent} from "electron";
import {find, forEach, partialRight} from "lodash-es";

import {MessageBus} from "./MessageBus";
import {Messages} from "./Messages";

export type MultiMessageHandler = (params: MultiMessageHandlerParams) => Promise<any>

export type MultiMessageHandlerParams = {
    id: "string";
    [key: string]: any;
}

export type MultiMessageDefintion = {
    executeMessageKey: Messages;
    completedMessageKey: Messages;
    messageHandler: MultiMessageHandler;
}

export abstract class MultiMessageChannel {
    protected messageBus: MessageBus;
    protected abstract get messages(): MultiMessageDefintion[];

    constructor(messageBus: MessageBus) {
        this.messageBus = messageBus;
        this.initialize();
    }

    public initialize = () => {
        forEach(this.messages, (m) => {
            this.messageBus.ipcMain.on(m.executeMessageKey, partialRight(this.execute, m.executeMessageKey));
        });
    };
    
    public destroy = () => {
        forEach(this.messages, (m) => {
            this.messageBus.ipcMain.removeListener(m.executeMessageKey, partialRight(this.execute, m.executeMessageKey));
        });
    };
    
    public execute = async (event: IpcMainEvent, params: MultiMessageHandlerParams, messageKey: Messages) => {
        const messageDef = find(this.messages, ["executeMessageKey", messageKey]);
        const result = await messageDef.messageHandler(params);

        this.messageBus.mainWindow.webContents.send(`${messageDef.completedMessageKey}_${params.id}`, result);
    };
};
