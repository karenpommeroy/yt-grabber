import handler from "../../automations/YoutubeResolvePlaylists";
import {MessageChannel, MessageHandler} from "../MessageChannel";
import {Messages} from "../Messages";

export class ResolveYoutubePlaylistsMessageChannel extends MessageChannel {
    protected get messageKeys() {
        return {
            execute: Messages.ResolveYoutubePlaylists,
            completed: Messages.ResolveYoutubePlaylistsCompleted,
            cancel: Messages.ResolveYoutubePlaylistsCancel,
            canceled: Messages.ResolveYoutubePlaylistsCanceled,
        };
    }

    protected get messageHandler(): MessageHandler {
        return handler;
    }
};
