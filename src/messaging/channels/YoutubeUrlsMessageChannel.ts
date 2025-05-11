import handler from "../../automations/Youtube";
import {MessageChannel, MessageHandler} from "../MessageChannel";
import {Messages} from "../Messages";

export class YoutubeUrlsMessageChannel extends MessageChannel {
    protected get messageKeys() {
        return {
            execute: Messages.GetYoutubeUrls,
            completed: Messages.GetYoutubeUrlsCompleted,
            cancel: Messages.GetYoutubeUrlsCancel,
            canceled: Messages.GetYoutubeUrlsCanceled
        };
    }

    protected get messageHandler(): MessageHandler {
        return handler;
    }
};
