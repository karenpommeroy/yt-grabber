import {TimeoutError} from "puppeteer-core";
import puppeteer from "puppeteer-extra";

import {UserAgent} from "../common/PuppeteerOptions";
import {Reporter} from "../common/Reporter";
import {
    createBrowserMock, createI18n, createPageMock, createYoutubeParams
} from "../common/TestHelpers";
import {clearInput, navigateToPage, setCookies} from "./Helpers";
import {
    YtMusicSearchInputSelector, YtMusicSearchResultsArtistsLinkSelector, YtMusicSongsChipSelector
} from "./Selectors";
import execute from "./YoutubeTracks";

jest.mock("./Helpers", () => require("@tests/mocks/automations/Helpers"));
jest.mock("puppeteer-core", () => require("@tests/mocks/puppeteer-core"));
jest.mock("puppeteer-extra", () => require("@tests/mocks/puppeteer-extra"));
jest.mock("puppeteer-extra-plugin-stealth", () => require("@tests/mocks/puppeteer-extra-plugin-stealth"));
jest.mock("../common/Reporter", () => require("@tests/mocks/common/Reporter"));

const navigateToPageMock = navigateToPage as jest.Mock;
const setCookiesMock = setCookies as jest.Mock;
const clearInputMock = clearInput as jest.Mock;
const launchMock = puppeteer.launch as jest.Mock;
const ReporterInstance = new Reporter(() => {});
const reporterFinishMock = ReporterInstance.finish as jest.Mock;

const baseParams = {
    values: ["The Mission - Like a Hurricane"],
    lang: "en",
    url: "https://music.youtube.com",
};

describe("YoutubeTracks automation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearInputMock.mockResolvedValue(undefined);
    });

    test("searches track and returns first result", async () => {
        const page = createPageMock();
        const songsChip = {click: jest.fn()};
        const searchInput = {type: jest.fn()};

        page.waitForSelector.mockImplementation((selector: string) => {
            if (selector.includes(YtMusicSearchInputSelector)) {
                return Promise.resolve(searchInput);
            }

            if (selector.includes(YtMusicSongsChipSelector)) {
                return Promise.resolve(songsChip);
            }

            if (selector.includes(YtMusicSearchResultsArtistsLinkSelector)) {
                return Promise.resolve({});
            }

            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });

        page.$$.mockResolvedValue([
            {
                evaluate: jest.fn().mockImplementation((cb: (el: {getAttribute: () => string;}) => string) =>
                    Promise.resolve(cb({getAttribute: () => "watch?v=xyz"}))),
            },
        ]);

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams(baseParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        } as any);

        expect(page.setUserAgent).toHaveBeenCalledWith(UserAgent);
        expect(clearInputMock).toHaveBeenCalledWith(searchInput, page);
        expect(searchInput.type).toHaveBeenCalledWith("The Mission - Like a Hurricane");
        expect(page.keyboard.press).toHaveBeenCalledWith("Enter");
        expect(songsChip.click).toHaveBeenCalledTimes(1);
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: ["https://music.youtube.com/watch?v=xyz"],
            errors: [],
            warnings: [],
        }));
    });

    test("returns direct watch url unchanged", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);

        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams({...baseParams, values: ["https://music.youtube.com/watch?v=abc"]}),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        } as any);

        expect(page.waitForSelector).not.toHaveBeenCalled();
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: ["https://music.youtube.com/watch?v=abc"],
        }));
    });

    test("returns empty list on search failure", async () => {
        const page = createPageMock();
        page.waitForSelector.mockRejectedValue(new Error("search failed"));

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams(baseParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        } as any);

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
        navigateToPageMock.mockRejectedValue(new TimeoutError("timeout"));
        setCookiesMock.mockResolvedValue(undefined);

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

        await execute({
            params: createYoutubeParams(baseParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        } as any);

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

    test("aborts execution when signal is triggered", async () => {
        const page = createPageMock();
        page.waitForSelector.mockResolvedValue({});

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        const controller = new AbortController();

        const execution = execute({
            params: createYoutubeParams(baseParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: controller.signal,
        } as any);

        controller.abort();

        await expect(execution).rejects.toThrow("aborted");
    });
});
