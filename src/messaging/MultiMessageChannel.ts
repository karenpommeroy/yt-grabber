import {IpcMainEvent} from "electron";
import _find from "lodash/find";
import _forEach from "lodash/forEach";
import _partialRight from "lodash/partialRight";

import {MessageBus} from "./MessageBus";
import {Messages} from "./Messages";

export type MultiMessageHandler = (params: MultiMessageHandlerParams) => Promise<any>

export type MultiMessageHandlerParams = {
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
        _forEach(this.messages, (m) => {
            this.messageBus.ipcMain.on(m.executeMessageKey, _partialRight(this.execute, m.executeMessageKey));
        });
    };
    
    public execute = async (event: IpcMainEvent, params: MultiMessageHandlerParams, messageKey: Messages) => {
        const messageDef = _find(this.messages, ["executeMessageKey", messageKey]);
        const result = await messageDef.messageHandler(params);

        this.messageBus.mainWindow.webContents.send(messageDef.completedMessageKey, result);
    };
};
