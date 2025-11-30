import {createMessageBus} from "../common/TestHelpers";
import {Messages} from "./Messages";
import {
    MultiMessageChannel, MultiMessageDefintion, MultiMessageHandler, MultiMessageHandlerParams
} from "./MultiMessageChannel";

import type {IpcMainEvent} from "electron";

let definitions: MultiMessageDefintion[] = [];

class TestMultiChannel extends MultiMessageChannel {
    protected get messages() {
        return definitions;
    }
}

describe("MultiMessageChannel", () => {
    const messageBus = createMessageBus();

    beforeEach(() => {
        jest.clearAllMocks();
        definitions = [];
    });

    test("registers listeners for each definition", () => {
        const handler: MultiMessageHandler = jest.fn();
        definitions = [
            {executeMessageKey: Messages.GetYoutubeUrls, completedMessageKey: Messages.GetYoutubeUrlsCompleted, messageHandler: handler},
            {executeMessageKey: Messages.GetYoutubeArtists, completedMessageKey: Messages.GetYoutubeArtistsCompleted, messageHandler: handler},
        ];
        
        new TestMultiChannel(messageBus);

        expect(messageBus.ipcMain.on).toHaveBeenCalledWith(Messages.GetYoutubeUrls, expect.any(Function));
        expect(messageBus.ipcMain.on).toHaveBeenCalledWith(Messages.GetYoutubeArtists, expect.any(Function));
    });

    test("execute resolves handler and sends completed event with dynamic key", async () => {
        const firstHandler: MultiMessageHandler = jest.fn(async () => ({items: [1]}));
        const secondHandler: MultiMessageHandler = jest.fn(async () => ({items: [2]}));
        
        definitions = [
            {executeMessageKey: Messages.GetYoutubeUrls, completedMessageKey: Messages.GetYoutubeUrlsCompleted, messageHandler: firstHandler},
            {executeMessageKey: Messages.GetYoutubeArtists, completedMessageKey: Messages.GetYoutubeArtistsCompleted, messageHandler: secondHandler},
        ];

        const channel = new TestMultiChannel(messageBus);
        const params: MultiMessageHandlerParams = {id: "string", foo: "bar"};

        await channel.execute({} as IpcMainEvent, params, Messages.GetYoutubeArtists);

        expect(firstHandler).not.toHaveBeenCalled();
        expect(secondHandler).toHaveBeenCalledWith(params);
        expect(messageBus.mainWindow.webContents.send).toHaveBeenCalledWith(`${Messages.GetYoutubeArtistsCompleted}_${params.id}`, {items: [2]});
    });
});
