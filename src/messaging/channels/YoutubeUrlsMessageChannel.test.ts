import handler from "../../automations/Youtube";
import {createMessageBus} from "../../common/TestHelpers";
import {Messages} from "../Messages";
import {YoutubeUrlsMessageChannel} from "./YoutubeUrlsMessageChannel";

jest.mock("../../automations/Youtube", () => jest.fn());

describe("YoutubeUrlsMessageChannel", () => {
    const messageBus = createMessageBus();
    const createChannel = () => new YoutubeUrlsMessageChannel(messageBus);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns correct message keys", () => {
        const channel = createChannel();

        expect((channel as any).messageKeys).toEqual({
            execute: Messages.GetYoutubeUrls,
            completed: Messages.GetYoutubeUrlsCompleted,
            cancel: Messages.GetYoutubeUrlsCancel,
            canceled: Messages.GetYoutubeUrlsCanceled,
        });
    });

    test("returns YoutubeUrls handler", () => {
        const channel = createChannel();

        expect((channel as any).messageHandler).toBe(handler);
    });
});
