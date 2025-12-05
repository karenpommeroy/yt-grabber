import {TimeoutError} from "puppeteer-core";
import puppeteer from "puppeteer-extra";

import {UserAgent} from "../common/PuppeteerOptions";
import {Reporter} from "../common/Reporter";
import {
    createBrowserMock, createI18n, createPageMock, createYoutubeParams
} from "../common/TestHelpers";
import {clearInput, navigateToPage, setCookies} from "./Helpers";
import {
    YtMusicAlbumsChipSelector, YtMusicSearchInputSelector, YtMusicSearchResultsArtistsLinkSelector
} from "./Selectors";
import execute from "./YoutubeAlbums";

jest.mock("./Helpers", () => require("@tests/mocks/automations/Helpers"));
jest.mock("puppeteer-core", () => require("@tests/mocks/puppeteer-core"));
jest.mock("puppeteer-extra", () => require("@tests/mocks/puppeteer-extra"));
jest.mock("puppeteer-extra-plugin-stealth", () => require("@tests/mocks/puppeteer-extra-plugin-stealth"));
jest.mock("../common/Reporter", () => require("@tests/mocks/common/Reporter"));

const navigateToPageMock = navigateToPage as jest.Mock;
const setCookiesMock = setCookies as jest.Mock;
const clearInputMock = clearInput as jest.Mock;
const launchMock = puppeteer.launch as jest.Mock;
const ReporterMock = new Reporter(() => {});
const reporterFinishMock = ReporterMock.finish as jest.Mock;

const baseYoutubeParams = {
    values: ["Brian Eno - Apollo"],
    lang: "en",
    url: "https://music.youtube.com",
};

describe("YoutubeAlbums automation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearInputMock.mockResolvedValue(undefined);
    });

    test("searches albums when input is not a playlist url", async () => {
        const searchInput = {type: jest.fn()};
        const albumsChip = {click: jest.fn()};
        const page = createPageMock();

        page.waitForSelector.mockImplementation((selector: string) => {
            if (selector.includes(YtMusicSearchInputSelector)) {
                return Promise.resolve(searchInput);
            }

            if (selector.includes(YtMusicAlbumsChipSelector)) {
                return Promise.resolve(albumsChip);
            }

            if (selector.includes(YtMusicSearchResultsArtistsLinkSelector)) {
                return Promise.resolve({});
            }

            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });

        page.$$.mockResolvedValue([
            {
                evaluate: jest.fn().mockImplementation((cb: (el: {getAttribute: () => string;}) => string) =>
                    Promise.resolve(cb({getAttribute: () => "browse/album/123"}))),
            },
        ]);

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams(baseYoutubeParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new globalThis.AbortController().signal,
        });

        expect(page.setUserAgent).toHaveBeenCalledWith(UserAgent);
        expect(clearInputMock).toHaveBeenCalledWith(searchInput, page);
        expect(searchInput.type).toHaveBeenCalledWith("Brian Eno - Apollo");
        expect(page.keyboard.press).toHaveBeenCalledWith("Enter");
        expect(albumsChip.click).toHaveBeenCalledTimes(1);
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: ["https://music.youtube.com/browse/album/123"],
            errors: [],
            warnings: [],
        }));
    });

    test("returns playlist url as-is", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams({...baseYoutubeParams, values: ["https://music.youtube.com/playlist?list=PL1"]}),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new globalThis.AbortController().signal,
        });

        expect(page.waitForSelector).not.toHaveBeenCalled();
        expect(clearInputMock).not.toHaveBeenCalled();
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: ["https://music.youtube.com/playlist?list=PL1"],
        }));
    });

    test("returns empty list when search fails", async () => {
        const page = createPageMock();
        page.waitForSelector.mockRejectedValue(new Error("not found"));

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams(baseYoutubeParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new globalThis.AbortController().signal,
        });

        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: [],
            errors: [],
            warnings: [],
        }));
    });

    test("reports timeout errors", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        setCookiesMock.mockResolvedValue(undefined);
        navigateToPageMock.mockRejectedValue(new TimeoutError("timeout"));

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

        await execute({
            params: createYoutubeParams(baseYoutubeParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new globalThis.AbortController().signal,
        });

        const [, result] = reporterFinishMock.mock.calls[0];

        expect(result.errors).toEqual([
            {
                title: "exceptionTimeout",
                description: "exceptionTimeoutText",
            },
        ]);
        expect(result.warnings ?? []).toEqual([]);
        expect(result.values ?? []).toEqual([]);
        expect(page.close).toHaveBeenCalledTimes(1);
        expect(browser.close).toHaveBeenCalledTimes(1);
        consoleErrorSpy.mockRestore();
    });

    test("aborts execution when signal fires", async () => {
        const page = createPageMock();
        page.waitForSelector.mockImplementation(() => Promise.resolve({}));

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        const controller = new globalThis.AbortController();

        const execution = execute({
            params: createYoutubeParams(baseYoutubeParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: controller.signal,
        });

        controller.abort();

        await expect(execution).rejects.toThrow("aborted");
    });
});
