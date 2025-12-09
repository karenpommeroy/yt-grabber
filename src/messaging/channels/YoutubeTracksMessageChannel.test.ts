import handler from "../../automations/YoutubeTracks";
import {createMessageBus} from "../../common/TestHelpers";
import {Messages} from "../Messages";
import {YoutubeTracksMessageChannel} from "./YoutubeTracksMessageChannel";

jest.mock("../../automations/YoutubeTracks", () => jest.fn());

describe("YoutubeTracksMessageChannel", () => {
    const messageBus = createMessageBus();
    const createChannel = () => new YoutubeTracksMessageChannel(messageBus);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns correct message keys", () => {
        const channel = createChannel();

        expect((channel as any).messageKeys).toEqual({
            execute: Messages.GetYoutubeTracks,
            completed: Messages.GetYoutubeTracksCompleted,
            cancel: Messages.GetYoutubeTracksCancel,
            canceled: Messages.GetYoutubeTracksCanceled,
        });
    });

    test("returns YoutubeTracks handler", () => {
        const channel = createChannel();

        expect((channel as any).messageHandler).toBe(handler);
    });
});
