import handler from "../../automations/YoutubeResolvePlaylists";
import {createMessageBus} from "../../common/TestHelpers";
import {Messages} from "../Messages";
import {ResolveYoutubePlaylistsMessageChannel} from "./ResolveYoutubePlaylistsMessageChannel";

jest.mock("../../automations/YoutubeResolvePlaylists", () => jest.fn());

describe("ResolveYoutubePlaylistsMessageChannel", () => {
    const messageBus = createMessageBus();
    const createChannel = () => new ResolveYoutubePlaylistsMessageChannel(messageBus);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns correct message keys", () => {
        const channel = createChannel();

        expect((channel as any).messageKeys).toEqual({
            execute: Messages.ResolveYoutubePlaylists,
            completed: Messages.ResolveYoutubePlaylistsCompleted,
            cancel: Messages.ResolveYoutubePlaylistsCancel,
            canceled: Messages.ResolveYoutubePlaylistsCanceled,
        });
    });

    test("returns YoutubeResolvePlaylists handler", () => {
        const channel = createChannel();

        expect((channel as any).messageHandler).toBe(handler);
    });
});
