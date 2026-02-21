import {TimeoutError} from "puppeteer-core";
import puppeteer from "puppeteer-extra";

import {UserAgent} from "../common/PuppeteerOptions";
import {Reporter} from "../common/Reporter";
import {
    createBrowserMock, createI18n, createPageMock, createYoutubeParams
} from "../common/TestHelpers";
import {navigateToPage, resolveValidYoutubePlaylistUrl, setCookies} from "./Helpers";
import execute from "./YoutubeResolvePlaylists";

jest.mock("./Helpers", () => ({
    ...require("@tests/mocks/automations/Helpers"),
    resolveValidYoutubePlaylistUrl: jest.fn(),
}));
jest.mock("puppeteer-core", () => require("@tests/mocks/puppeteer-core"));
jest.mock("puppeteer-extra", () => require("@tests/mocks/puppeteer-extra"));
jest.mock("puppeteer-extra-plugin-stealth", () => require("@tests/mocks/puppeteer-extra-plugin-stealth"));
jest.mock("../common/Reporter", () => require("@tests/mocks/common/Reporter"));

const navigateToPageMock = navigateToPage as jest.Mock;
const setCookiesMock = setCookies as jest.Mock;
const resolveValidYoutubePlaylistUrlMock = resolveValidYoutubePlaylistUrl as jest.Mock;
const launchMock = puppeteer.launch as jest.Mock;
const reporterInstance = new Reporter(() => {});
const reporterFinishMock = reporterInstance.finish as jest.Mock;
const baseYoutubeParams = {
    values: ["https://music.youtube.com/watch?v=abc123"],
    lang: "en",
    url: "https://music.youtube.com",
};

describe("YoutubeResolvePlaylists automation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resolveValidYoutubePlaylistUrlMock.mockReset();
    });

    test("resolves single playlist url successfully", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);
        resolveValidYoutubePlaylistUrlMock.mockResolvedValue("https://music.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf");

        await execute({
            params: createYoutubeParams(baseYoutubeParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(page.setUserAgent).toHaveBeenCalledWith(UserAgent);
        expect(resolveValidYoutubePlaylistUrlMock).toHaveBeenCalledWith("https://music.youtube.com/watch?v=abc123", page);
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: ["https://music.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"],
            errors: [],
            warnings: [],
        }));
        expect(page.close).toHaveBeenCalledTimes(1);
        expect(browser.close).toHaveBeenCalledTimes(1);
    });

    test("resolves multiple playlist urls", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);
        resolveValidYoutubePlaylistUrlMock
            .mockResolvedValueOnce("https://music.youtube.com/playlist?list=PL1")
            .mockResolvedValueOnce("https://music.youtube.com/playlist?list=PL2")
            .mockResolvedValueOnce("https://music.youtube.com/playlist?list=PL3");

        await execute({
            params: createYoutubeParams({
                values: [
                    "https://music.youtube.com/watch?v=abc123",
                    "https://music.youtube.com/browse/VLOPL456",
                    "https://music.youtube.com/watch?v=xyz789",
                ],
                lang: "en",
                url: "https://music.youtube.com",
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(resolveValidYoutubePlaylistUrlMock).toHaveBeenCalledTimes(3);
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: [
                "https://music.youtube.com/playlist?list=PL1",
                "https://music.youtube.com/playlist?list=PL2",
                "https://music.youtube.com/playlist?list=PL3",
            ],
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

    test("treats detached navigation as warning", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        setCookiesMock.mockResolvedValue(undefined);
        navigateToPageMock.mockRejectedValue(new Error("Navigating frame was detached"));

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

        await execute({
            params: createYoutubeParams(baseYoutubeParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        const [, result] = reporterFinishMock.mock.calls[0];

        expect(result.errors ?? []).toEqual([]);
        expect(result.warnings).toEqual([
            {
                title: "exceptionYoutubeResolvePlaylists",
                description: "exceptionYoutubeResolvePlaylistsText",
            },
        ]);
        expect(result.values ?? []).toEqual([]);
        expect(page.close).toHaveBeenCalledTimes(1);
        expect(browser.close).toHaveBeenCalledTimes(1);
        consoleErrorSpy.mockRestore();
    });

    test("reports generic errors during resolution", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

        launchMock.mockResolvedValue(browser);
        setCookiesMock.mockResolvedValue(undefined);
        navigateToPageMock.mockRejectedValue(new Error("network error"));

        await execute({
            params: createYoutubeParams(baseYoutubeParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        const [, result] = reporterFinishMock.mock.calls[0];

        expect(result.errors).toEqual([
            {
                title: "exceptionYoutubeResolvePlaylists",
                description: "exceptionYoutubeResolvePlaylistsText",
            },
        ]);
        expect(result.warnings ?? []).toEqual([]);
        expect(page.close).toHaveBeenCalledTimes(1);
        expect(browser.close).toHaveBeenCalledTimes(1);
        consoleErrorSpy.mockRestore();
    });

    test("aborts execution when signal fires", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        
        // Make navigate, setCookies delay a bit to allow abort to fire during execution
        navigateToPageMock.mockImplementation(() => new Promise((resolve) => {
            setTimeout(resolve, 50);
        }));
        setCookiesMock.mockResolvedValue(undefined);
        resolveValidYoutubePlaylistUrlMock.mockImplementation(() => new Promise((resolve) => {
            setTimeout(() => resolve("https://music.youtube.com/playlist?list=PLtest"), 50);
        }));

        const controller = new AbortController();

        const execution = execute({
            params: createYoutubeParams(baseYoutubeParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: controller.signal,
        });

        // Abort after a brief delay to let setup complete but still during execution
        setTimeout(() => controller.abort(), 20);

        await expect(execution).rejects.toThrow("aborted");
        expect(page.close).toHaveBeenCalledTimes(1);
        expect(browser.close).toHaveBeenCalledTimes(1);
    });

    test("returns original url when resolution fails", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);
        const originalUrl = "https://music.youtube.com/browse/VLOPL456";
        resolveValidYoutubePlaylistUrlMock.mockResolvedValue(originalUrl);

        await execute({
            params: createYoutubeParams({
                values: [originalUrl],
                lang: "en",
                url: "https://music.youtube.com",
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: [originalUrl],
            errors: [],
            warnings: [],
        }));
    });

    test("handles multiple resolutions with mixed results", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);
        
        const results = [
            "https://music.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
            "https://music.youtube.com/browse/VLOPL456", // unchanged, resolution didn't work
            "https://music.youtube.com/playlist?list=PLanotherlist",
        ];
        
        resolveValidYoutubePlaylistUrlMock
            .mockResolvedValueOnce(results[0])
            .mockResolvedValueOnce(results[1])
            .mockResolvedValueOnce(results[2]);

        const urls = [
            "https://music.youtube.com/watch?v=abc123",
            "https://music.youtube.com/browse/VLOPL456",
            "https://music.youtube.com/watch?v=xyz789",
        ];

        await execute({
            params: createYoutubeParams({
                values: urls,
                lang: "en",
                url: "https://music.youtube.com",
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: results,
            errors: [],
            warnings: [],
        }));
    });

    test("cleans up resources on error", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        setCookiesMock.mockResolvedValue(undefined);
        navigateToPageMock.mockRejectedValue(new Error("network error"));

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

        await execute({
            params: createYoutubeParams(baseYoutubeParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        // Verify cleanup happened
        expect(page.close).toHaveBeenCalledTimes(1);
        expect(browser.close).toHaveBeenCalledTimes(1);
        consoleErrorSpy.mockRestore();
    });

    test("calls onUpdate with progress", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);
        resolveValidYoutubePlaylistUrlMock.mockResolvedValue("https://music.youtube.com/playlist?list=PLtest");

        const onUpdate = jest.fn();

        await execute({
            params: createYoutubeParams(baseYoutubeParams),
            options: {},
            i18n: createI18n(),
            onUpdate,
            signal: new AbortController().signal,
        });

        // onUpdate should be called at least once with progress
        expect(onUpdate).toHaveBeenCalled();
    });

    test("sets user agent correctly", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);
        resolveValidYoutubePlaylistUrlMock.mockResolvedValue("https://music.youtube.com/playlist?list=PLtest");

        await execute({
            params: createYoutubeParams(baseYoutubeParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(page.setUserAgent).toHaveBeenCalledWith(UserAgent);
    });

    test("navigates to base url before processing", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);
        resolveValidYoutubePlaylistUrlMock.mockResolvedValue("https://music.youtube.com/playlist?list=PLtest");

        const baseUrl = "https://music.youtube.com";

        await execute({
            params: createYoutubeParams({
                values: ["https://music.youtube.com/watch?v=abc123"],
                lang: "en",
                url: baseUrl,
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(navigateToPageMock).toHaveBeenCalledWith(baseUrl, page);
    });

    test("handles empty values array", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams({
                values: [],
                lang: "en",
                url: "https://music.youtube.com",
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(resolveValidYoutubePlaylistUrlMock).not.toHaveBeenCalled();
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: [],
            errors: [],
            warnings: [],
        }));
    });

    test("includes source urls in result", async () => {
        const page = createPageMock();
        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);
        resolveValidYoutubePlaylistUrlMock.mockResolvedValue("https://music.youtube.com/playlist?list=PLtest");

        const sourceUrls = ["https://music.youtube.com/watch?v=abc123"];

        await execute({
            params: createYoutubeParams({
                values: sourceUrls,
                lang: "en",
                url: "https://music.youtube.com",
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            sources: sourceUrls,
        }));
    });
});
