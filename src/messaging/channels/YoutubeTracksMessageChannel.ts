import handler from "../../automations/YoutubeTracks";
import {MessageChannel, MessageHandler} from "../MessageChannel";
import {Messages} from "../Messages";

export class YoutubeTracksMessageChannel extends MessageChannel {
    protected get messageKeys() {
        return {
            execute: Messages.GetYoutubeTracks,
            completed: Messages.GetYoutubeTracksCompleted,
            cancel: Messages.GetYoutubeTracksCancel,
            canceled: Messages.GetYoutubeTracksCanceled
        };
    }

    protected get messageHandler(): MessageHandler {
        return handler;
    }
};
