import handler from "../../automations/YoutubeAlbums";
import {createMessageBus} from "../../common/TestHelpers";
import {Messages} from "../Messages";
import {YoutubeAlbumsMessageChannel} from "./YoutubeAlbumsMessageChannel";

jest.mock("../../automations/YoutubeAlbums", () => jest.fn());

describe("YoutubeAlbumsMessageChannel", () => {
    const messageBus = createMessageBus();
    const createChannel = () => new YoutubeAlbumsMessageChannel(messageBus);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns correct message keys", () => {
        const channel = createChannel();

        expect((channel as any).messageKeys).toEqual({
            execute: Messages.GetYoutubeAlbums,
            completed: Messages.GetYoutubeAlbumsCompleted,
            cancel: Messages.GetYoutubeAlbumsCancel,
            canceled: Messages.GetYoutubeAlbumsCanceled,
        });
    });

    test("returns YoutubeAlbums handler", () => {
        const channel = createChannel();

        expect((channel as any).messageHandler).toBe(handler);
    });
});
