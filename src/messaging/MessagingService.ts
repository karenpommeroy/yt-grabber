import {BrowserWindow, IpcMain} from "electron";

import {
    ResolveYoutubePlaylistsMessageChannel
} from "./channels/ResolveYoutubePlaylistsMessageChannel";
import {SystemMessageChannel} from "./channels/SystemMessageChannel";
import {YoutubeAlbumsMessageChannel} from "./channels/YoutubeAlbumsMessageChannel";
import {YoutubeArtistsMessageChannel} from "./channels/YoutubeArtistsMessageChannel";
import {YoutubeTracksMessageChannel} from "./channels/YoutubeTracksMessageChannel";
import {YoutubeUrlsMessageChannel} from "./channels/YoutubeUrlsMessageChannel";
import {MessageBus} from "./MessageBus";
import {MessageChannel} from "./MessageChannel";
import {Messages} from "./Messages";
import {MultiMessageChannel} from "./MultiMessageChannel";

export class MessagingService {
    public id: number;
    
    private messageBus: MessageBus;
    private channels = new Map<string, MessageChannel | MultiMessageChannel>();

    constructor(ipcMain: IpcMain, mainWindow: BrowserWindow) {
        this.messageBus = new MessageBus(ipcMain, mainWindow);
        this.channels.set(Messages.GetYoutubeUrls, new YoutubeUrlsMessageChannel(this.messageBus));
        this.channels.set(Messages.GetYoutubeArtists, new YoutubeArtistsMessageChannel(this.messageBus));
        this.channels.set(Messages.GetYoutubeAlbums, new YoutubeAlbumsMessageChannel(this.messageBus));
        this.channels.set(Messages.GetYoutubeTracks, new YoutubeTracksMessageChannel(this.messageBus));
        this.channels.set(Messages.OpenUrlInBrowser, new SystemMessageChannel(this.messageBus));
        this.channels.set(Messages.ResolveYoutubePlaylists, new ResolveYoutubePlaylistsMessageChannel(this.messageBus));
        this.id = Date.now();
    }
}