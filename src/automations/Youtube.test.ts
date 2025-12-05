import {TimeoutError} from "puppeteer-core";
import puppeteer from "puppeteer-extra";

import {UserAgent} from "../common/PuppeteerOptions";
import {Reporter} from "../common/Reporter";
import {
    createBrowserMock, createElements, createI18n, createPageMock, createYoutubeParams
} from "../common/TestHelpers";
import {navigateToPage, setCookies} from "./Helpers";
import {
    AlbumFilterSelector, AlbumLinkSelector, AlbumsDirectLinkSelector, AlbumsHrefSelector
} from "./Selectors";
import execute from "./Youtube";

jest.mock("./Helpers", () => require("@tests/mocks/automations/Helpers"));
jest.mock("puppeteer-core", () => require("@tests/mocks/puppeteer-core"));
jest.mock("puppeteer-extra", () => require("@tests/mocks/puppeteer-extra"));
jest.mock("puppeteer-extra-plugin-stealth", () => require("@tests/mocks/puppeteer-extra-plugin-stealth"));
jest.mock("../common/Reporter", () => require("@tests/mocks/common/Reporter"));

const navigateToPageMock = navigateToPage as jest.Mock;
const setCookiesMock = setCookies as jest.Mock;
const launchMock = puppeteer.launch as jest.Mock;
const ReporterMock = new Reporter(() => {});
const reporterFinishMock = ReporterMock.finish as jest.Mock;

describe("Youtube automation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("collects album links via filtered listing", async () => {
        const page = createPageMock();
        page.waitForSelector.mockImplementation((selector: string) => {
            if (selector.includes(AlbumsHrefSelector)) {
                return Promise.resolve({evaluate: jest.fn().mockResolvedValue("channel/albums")});
            }

            if (selector.includes(AlbumFilterSelector)) {
                return Promise.resolve({click: jest.fn()});
            }

            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });

        page.$$eval.mockImplementation((selector: string, callback: (elements: Array<{getAttribute: () => string;}>) => string[]) => {
            if (selector === "xpath/" + AlbumLinkSelector) {
                return Promise.resolve(callback(createElements(["album/one", "album/two"])));
            }

            if (selector === "xpath/" + AlbumsDirectLinkSelector) {
                return Promise.resolve(callback(createElements([])));
            }
            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams(),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal
        });

        expect(page.setUserAgent).toHaveBeenCalledWith(UserAgent);
        expect(navigateToPageMock).toHaveBeenCalledWith("https://music.youtube.com", page);
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            errors: [],
            warnings: [],
            values: [
                "https://music.youtube.com/album/one",
                "https://music.youtube.com/album/two",
            ],
            sources: ["https://music.youtube.com/channel/UC123"],
        }));
        expect(page.close).toHaveBeenCalledTimes(1);
        expect(browser.close).toHaveBeenCalledTimes(1);
    });

    test("falls back to direct album links when filters fail", async () => {
        const page = createPageMock();
        page.waitForSelector.mockRejectedValue(new Error("Not available"));
        page.$$eval.mockImplementation((selector: string, callback: (elements: Array<{getAttribute: () => string;}>) => string[]) => {
            if (selector === "xpath/" + AlbumsDirectLinkSelector) {
                return Promise.resolve(callback(createElements(["direct/one"])));
            }

            return Promise.reject(new Error(`Unexpected selector ${selector}`));
        });

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams(),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(page.$$eval).toHaveBeenCalledWith("xpath/" + AlbumsDirectLinkSelector, expect.any(Function));
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: ["https://music.youtube.com/direct/one"],
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
            params: createYoutubeParams(),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
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

    test("reports navigation detach as warning", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

        launchMock.mockResolvedValue(browser);
        setCookiesMock.mockResolvedValue(undefined);
        navigateToPageMock.mockRejectedValue(new Error("Navigating frame was detached"));

        await execute({
            params: createYoutubeParams(),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        const [, result] = reporterFinishMock.mock.calls[0];

        expect(result.errors ?? []).toEqual([]);
        expect(result.warnings).toEqual([
            {
                title: "exceptionGetYoutubeUrls",
                description: "exceptionGetYoutubeUrlsText",
            },
        ]);
        expect(page.close).toHaveBeenCalledTimes(1);
        expect(browser.close).toHaveBeenCalledTimes(1);
        consoleErrorSpy.mockRestore();
    });

    test("reports generic errors", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

        launchMock.mockResolvedValue(browser);
        setCookiesMock.mockResolvedValue(undefined);
        navigateToPageMock.mockRejectedValue(new Error("boom"));

        await execute({
            params: createYoutubeParams(),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        const [, result] = reporterFinishMock.mock.calls[0];

        expect(result.errors).toEqual([
            {
                title: "exceptionGetYoutubeUrls",
                description: "exceptionGetYoutubeUrlsText",
            },
        ]);
        expect(result.warnings ?? []).toEqual([]);
        expect(page.close).toHaveBeenCalledTimes(1);
        expect(browser.close).toHaveBeenCalledTimes(1);
        consoleErrorSpy.mockRestore();
    });

    test("cancels operation properly", async () => {
        const page = createPageMock();
        const abortController = new AbortController();

        page.waitForSelector.mockImplementation(() => {
            abortController.abort();
        });

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        expect(execute({
            params: createYoutubeParams(),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: abortController.signal,
        })).rejects.toThrow("aborted");
    });
});
