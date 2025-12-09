import handler from "../../automations/YoutubeArtists";
import {createMessageBus} from "../../common/TestHelpers";
import {Messages} from "../Messages";
import {YoutubeArtistsMessageChannel} from "./YoutubeArtistsMessageChannel";

jest.mock("../../automations/YoutubeArtists", () => jest.fn());

describe("YoutubeArtistsMessageChannel", () => {
    const messageBus = createMessageBus();
    const createChannel = () => new YoutubeArtistsMessageChannel(messageBus);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns correct message keys", () => {
        const channel = createChannel();

        expect((channel as any).messageKeys).toEqual({
            execute: Messages.GetYoutubeArtists,
            completed: Messages.GetYoutubeArtistsCompleted,
            cancel: Messages.GetYoutubeArtistsCancel,
            canceled: Messages.GetYoutubeArtistsCanceled,
            pause: Messages.GetYoutubeArtistsPause,
            resume: Messages.GetYoutubeArtistsResume,
        });
    });

    test("returns YoutubeArtists handler", () => {
        const channel = createChannel();

        expect((channel as any).messageHandler).toBe(handler);
    });
});
