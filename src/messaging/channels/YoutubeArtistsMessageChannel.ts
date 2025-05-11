import handler from "../../automations/YoutubeArtists";
import {MessageChannel, MessageHandler} from "../MessageChannel";
import {Messages} from "../Messages";

export class YoutubeArtistsMessageChannel extends MessageChannel {
    protected get messageKeys() {
        return {
            execute: Messages.GetYoutubeArtists,
            completed: Messages.GetYoutubeArtistsCompleted,
            cancel: Messages.GetYoutubeArtistsCancel,
            canceled: Messages.GetYoutubeArtistsCanceled
        };
    }

    protected get messageHandler(): MessageHandler {
        return handler;
    }
};
