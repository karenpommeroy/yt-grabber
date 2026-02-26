import {BrowserWindow, ipcMain} from "electron";

import {SystemMessageChannel} from "./channels/SystemMessageChannel";
import {YoutubeAlbumsMessageChannel} from "./channels/YoutubeAlbumsMessageChannel";
import {YoutubeArtistsMessageChannel} from "./channels/YoutubeArtistsMessageChannel";
import {YoutubeTracksMessageChannel} from "./channels/YoutubeTracksMessageChannel";
import {YoutubeUrlsMessageChannel} from "./channels/YoutubeUrlsMessageChannel";
import {MessageBus} from "./MessageBus";
import {Messages} from "./Messages";
import {MessagingService} from "./MessagingService";

const messageBusMock = {
    ipcMain: {
        on: ipcMain.on as jest.Mock,
        once: ipcMain.once as jest.Mock,
    },
    mainWindow: {
        webContents: {
            send: jest.fn(),
        },
    },
    controllers: new Map(),
};

const mainWindow = messageBusMock.mainWindow as unknown as BrowserWindow;
const ipcMainOnMock = ipcMain.on as jest.Mock;
const ipcMainOnceMock = ipcMain.once as jest.Mock;
const mainWindowSendMock = messageBusMock.mainWindow.webContents.send as jest.Mock;

jest.mock("./MessageBus", () => ({
    MessageBus: jest.fn().mockImplementation(() => messageBusMock),
}));

describe("MessagingService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        ipcMainOnMock.mockClear();
        ipcMainOnceMock.mockClear();
        mainWindowSendMock.mockClear();
        messageBusMock.controllers.clear();
    });

    test("constructs message bus and registers default channels", () => {
        const nowSpy = jest.spyOn(Date, "now").mockReturnValue(123456);
        const service = new MessagingService(ipcMain, mainWindow) as unknown as {
            channels: Map<string, unknown>;
            id: number;
        };

        expect(service.id).toBe(123456);

        const channels = service.channels;
        
        expect(channels.get(Messages.GetYoutubeUrls)).toBeInstanceOf(YoutubeUrlsMessageChannel);
        expect(channels.get(Messages.GetYoutubeArtists)).toBeInstanceOf(YoutubeArtistsMessageChannel);
        expect(channels.get(Messages.GetYoutubeAlbums)).toBeInstanceOf(YoutubeAlbumsMessageChannel);
        expect(channels.get(Messages.GetYoutubeTracks)).toBeInstanceOf(YoutubeTracksMessageChannel);
        expect(channels.get(Messages.OpenUrlInBrowser)).toBeInstanceOf(SystemMessageChannel);
        expect(MessageBus).toHaveBeenCalledWith(ipcMain, mainWindow);
        expect(messageBusMock.ipcMain.on).toHaveBeenCalled();

        nowSpy.mockRestore();
    });

    test("destroy calls destroy on all channels and clears the map", () => {
        const service = new MessagingService(ipcMain, mainWindow);
        const serviceWithChannels = service as unknown as {
            channels: Map<string, {destroy: jest.Mock}>;
        };

        serviceWithChannels.channels.forEach((channel) => {
            channel.destroy = jest.fn();
        });

        service.destroy();

        serviceWithChannels.channels.forEach((channel) => {
            expect(channel.destroy).toHaveBeenCalled();
        });

        expect(serviceWithChannels.channels.size).toBe(0);
    });
});
