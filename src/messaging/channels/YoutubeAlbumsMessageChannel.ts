import handler from "../../automations/YoutubeAlbums";
import {MessageChannel, MessageHandler} from "../MessageChannel";
import {Messages} from "../Messages";

export class YoutubeAlbumsMessageChannel extends MessageChannel {
    protected get messageKeys() {
        return {
            execute: Messages.GetYoutubeAlbums,
            completed: Messages.GetYoutubeAlbumsCompleted,
            cancel: Messages.GetYoutubeAlbumsCancel,
            canceled: Messages.GetYoutubeAlbumsCanceled
        };
    }

    protected get messageHandler(): MessageHandler {
        return handler;
    }
};
