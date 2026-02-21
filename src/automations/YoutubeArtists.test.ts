import {TimeoutError} from "puppeteer-core";
import puppeteer from "puppeteer-extra";

import {MultiMatchAction} from "../common/Media";
import {UserAgent} from "../common/PuppeteerOptions";
import {Reporter} from "../common/Reporter";
import {
    createBrowserMock, createElements, createI18n, createPageMock, createYoutubeParams
} from "../common/TestHelpers";
import {clearInput, navigateToPage, resolveValidYoutubePlaylistUrl, setCookies} from "./Helpers";
import {
    AlbumFilterSelector, AlbumsDirectLinkSelector, AlbumsHrefSelector, SingleFilterSelector,
    SinglesDirectLinkSelector, SinglesHrefSelector, YtMusicArtistBestResultLinkSelector,
    YtMusicArtistsChipSelector, YtMusicSearchInputSelector, YtMusicSearchResultsArtistsLinkSelector
} from "./Selectors";
import execute from "./YoutubeArtists";

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
const clearInputMock = clearInput as jest.Mock;
const resolveValidYoutubePlaylistUrlMock = resolveValidYoutubePlaylistUrl as jest.Mock;
const launchMock = puppeteer.launch as jest.Mock;
const reporterInstance = new Reporter(() => {});
const reporterFinishMock = reporterInstance.finish as jest.Mock;
const baseYoutubeParams = {
    values: ["https://music.youtube.com/channel/UC999999"],
    lang: "en",
    url: "https://music.youtube.com",
    options: {downloadAlbums: true, downloadSinglesAndEps: true},
};

describe("YoutubeArtists automation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearInputMock.mockReset();
    });

    test("collects albums and singles when selectors succeed", async () => {
        const page = createPageMock();
        const albumFilterButton = {click: jest.fn()};
        const singleFilterButton = {click: jest.fn()};
        let currentShelf: "root" | "albums" | "singles" = "root";

        page.waitForSelector.mockImplementation((selector: string) => {
            if (selector.includes(YtMusicSearchInputSelector)) {
                return Promise.resolve({});
            }

            if (selector.includes(AlbumsHrefSelector)) {
                return Promise.resolve({
                    evaluate: jest.fn().mockImplementation((cb: (el: {getAttribute: () => string;}) => string) =>
                        Promise.resolve(cb({getAttribute: () => "channel/albums"}))),
                });
            }

            if (selector.includes(AlbumFilterSelector)) {
                return Promise.resolve(albumFilterButton);
            }

            if (selector.includes(SinglesHrefSelector)) {
                return Promise.resolve({
                    evaluate: jest.fn().mockImplementation((cb: (el: {getAttribute: () => string;}) => string) =>
                        Promise.resolve(cb({getAttribute: () => "channel/singles"}))),
                });
            }

            if (selector.includes(SingleFilterSelector)) {
                return Promise.resolve(singleFilterButton);
            }

            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });

        const shelvesUsed: string[] = [];

        page.$$eval.mockImplementation((_selector: string, callback: (elements: Array<{getAttribute: () => string;}>) => string[]) => {
            shelvesUsed.push(currentShelf);
            const href = currentShelf === "singles" ? "single/one" : "album/one";

            return Promise.resolve(callback(createElements([href])));
        });
        
        resolveValidYoutubePlaylistUrlMock.mockImplementation((url: string) => Promise.resolve(url));

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockImplementation((url: string) => {
            if (url.includes("channel/albums")) {
                currentShelf = "albums";
            } else if (url.includes("channel/singles")) {
                currentShelf = "singles";
            } else {
                currentShelf = "root";
            }

            return Promise.resolve(undefined);
        });
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams(baseYoutubeParams),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new globalThis.AbortController().signal,
        });

        expect(page.setUserAgent).toHaveBeenCalledWith(UserAgent);
        expect(clearInputMock).not.toHaveBeenCalled();
        expect(albumFilterButton.click).toHaveBeenCalledTimes(1);
        expect(singleFilterButton.click).toHaveBeenCalledTimes(1);
        expect(shelvesUsed).toEqual(["albums", "singles"]);
        expect(navigateToPageMock).toHaveBeenCalledWith("https://music.youtube.com/channel/albums", page);
        expect(navigateToPageMock).toHaveBeenCalledWith("https://music.youtube.com/channel/singles", page);
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: [
                "https://music.youtube.com/album/one",
                "https://music.youtube.com/single/one",
            ],
            errors: [],
            warnings: [],
        }));
    });

    test("falls back to direct links when shelf selectors fail", async () => {
        const page = createPageMock();

        page.waitForSelector.mockImplementation((selector: string) => {
            if (selector.includes(YtMusicSearchInputSelector)) {
                return Promise.resolve({});
            }

            if (selector.includes(AlbumsHrefSelector) || selector.includes(SinglesHrefSelector)) {
                return Promise.reject(new Error("shelf missing"));
            }

            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });

        page.$$eval.mockImplementation((selector: string, callback: (elements: Array<{getAttribute: () => string;}>) => string[]) => {
            if (selector === `xpath/${AlbumsDirectLinkSelector}`) {
                return Promise.resolve(callback(createElements(["direct/album"])));
            }

            if (selector === `xpath/${SinglesDirectLinkSelector}`) {
                return Promise.resolve(callback(createElements(["direct/single"])));
            }

            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });
        
        resolveValidYoutubePlaylistUrlMock.mockImplementation((url: string) => Promise.resolve(url));

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
            values: [
                "https://music.youtube.com/direct/album",
                "https://music.youtube.com/direct/single",
            ],
            errors: [],
            warnings: [],
        }));
    });

    test("returns channel url when artist value is channel link", async () => {
        const page = createPageMock();
        page.waitForSelector.mockResolvedValue({});

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams({
                ...baseYoutubeParams,
                values: ["https://music.youtube.com/channel/UCCHANNEL"],
                options: {downloadAlbums: false, downloadSinglesAndEps: false},
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(navigateToPageMock).toHaveBeenCalledWith("https://music.youtube.com/channel/UCCHANNEL", page);
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({values: []}));
    });

    test("uses onPause to pick artist when multiple matches", async () => {
        const page = createPageMock();
        const searchInput = {type: jest.fn()};
        const artistsChip = {click: jest.fn()};
        clearInputMock.mockResolvedValue(undefined);
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

        page.waitForSelector.mockImplementation((selector: string) => {
            if (selector.includes(YtMusicSearchInputSelector)) return Promise.resolve(searchInput);
            if (selector.includes(YtMusicArtistsChipSelector)) return Promise.resolve(artistsChip);
            if (selector.includes(YtMusicSearchResultsArtistsLinkSelector)) return Promise.resolve({});
            if (selector.includes(YtMusicArtistBestResultLinkSelector)) {
                return Promise.resolve({
                    evaluate: jest.fn().mockResolvedValue("channel/fallback"),
                });
            }

            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });

        const makeArtistEl = (name: string, href: string) => ({
            $$: jest.fn().mockImplementation(() => {
                return Promise.resolve([{
                    evaluate: jest.fn().mockImplementation((cb: (el: any) => any) => {
                        return Promise.resolve(cb({
                            getAttribute: (attr: string) => attr === "src" ? `${name}-thumb` : href,
                            textContent: name,
                        }));
                    }),
                }]);
            }),
        });

        const artistElements = [makeArtistEl("Artist One", "channel/one"), makeArtistEl("Artist Two", "channel/two")];
        page.$$.mockResolvedValue(artistElements);

        const onPause = jest.fn().mockResolvedValue({
            name: "Artist Two",
            thumbnail: "Artist Two-thumb",
            url: "https://music.youtube.com/channel/two",
        });

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams({
                ...baseYoutubeParams,
                values: ["Artist"],
                options: {multiMatchAction: MultiMatchAction.Ask, downloadAlbums: false, downloadSinglesAndEps: false},
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            onPause,
            signal: new AbortController().signal,
        });

        expect(onPause).toHaveBeenCalledTimes(1);
        expect(onPause).toHaveBeenCalledWith([
            {
                name: "Artist One",
                thumbnail: "Artist One-thumb",
                url: "https://music.youtube.com/channel/one",
            },
            {
                name: "Artist Two",
                thumbnail: "Artist Two-thumb",
                url: "https://music.youtube.com/channel/two",
            },
        ]);
        expect(navigateToPageMock).toHaveBeenCalledWith("https://music.youtube.com/channel/two", page);
        consoleErrorSpy.mockRestore();
    });

    test("uses first artist when multiMatchAction is UseFirst", async () => {
        const page = createPageMock();
        const searchInput = {type: jest.fn()};
        const artistsChip = {click: jest.fn()};
        clearInputMock.mockResolvedValue(undefined);

        page.waitForSelector.mockImplementation((selector: string) => {
            if (selector.includes(YtMusicSearchInputSelector)) return Promise.resolve(searchInput);
            if (selector.includes(YtMusicArtistsChipSelector)) return Promise.resolve(artistsChip);
            if (selector.includes(YtMusicSearchResultsArtistsLinkSelector)) return Promise.resolve({});

            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });

        const artistLinkEl = {
            evaluate: jest.fn().mockResolvedValue("channel/first-artist"),
        };
        page.$$.mockResolvedValue([artistLinkEl]);

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams({
                ...baseYoutubeParams,
                values: ["Artist"],
                options: {multiMatchAction: MultiMatchAction.UseFirst, downloadAlbums: false, downloadSinglesAndEps: false},
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(artistLinkEl.evaluate).toHaveBeenCalled();
        expect(navigateToPageMock).toHaveBeenCalledWith("https://music.youtube.com/channel/first-artist", page);
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({values: []}));
    });

    test("uses first artist when only single match found", async () => {
        const page = createPageMock();
        const searchInput = {type: jest.fn()};
        const artistsChip = {click: jest.fn()};
        clearInputMock.mockResolvedValue(undefined);

        page.waitForSelector.mockImplementation((selector: string) => {
            if (selector.includes(YtMusicSearchInputSelector)) return Promise.resolve(searchInput);
            if (selector.includes(YtMusicArtistsChipSelector)) return Promise.resolve(artistsChip);
            if (selector.includes(YtMusicSearchResultsArtistsLinkSelector)) return Promise.resolve({});

            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });

        const artistLinkEl = {
            evaluate: jest.fn().mockResolvedValue("channel/only-match"),
        };
        // Single element returned - triggers the length === 1 branch
        page.$$.mockResolvedValue([artistLinkEl]);

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams({
                ...baseYoutubeParams,
                values: ["Artist"],
                options: {multiMatchAction: MultiMatchAction.Ask, downloadAlbums: false, downloadSinglesAndEps: false},
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(artistLinkEl.evaluate).toHaveBeenCalled();
        expect(navigateToPageMock).toHaveBeenCalledWith("https://music.youtube.com/channel/only-match", page);
    });

    test("warns when album filter is already applied", async () => {
        const page = createPageMock();
        const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

        page.waitForSelector.mockImplementation((selector: string) => {
            if (selector.includes(YtMusicSearchInputSelector)) return Promise.resolve({});
            if (selector.includes(AlbumsHrefSelector)) {
                return Promise.resolve({
                    evaluate: jest.fn().mockResolvedValue("channel/albums"),
                });
            }
            if (selector.includes(AlbumFilterSelector)) {
                return Promise.reject(new Error("filter not found"));
            }

            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });

        page.$$eval.mockImplementation((_selector: string, callback: (elements: Array<{getAttribute: () => string;}>) => string[]) => {
            return Promise.resolve(callback(createElements(["album/one"])));
        });
        
        resolveValidYoutubePlaylistUrlMock.mockImplementation((url: string) => Promise.resolve(url));

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams({
                ...baseYoutubeParams,
                values: ["https://music.youtube.com/channel/UC123"],
                options: {downloadAlbums: true, downloadSinglesAndEps: false},
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(consoleWarnSpy).toHaveBeenCalledWith("Albums already filtered");
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: ["https://music.youtube.com/album/one"],
        }));
        consoleWarnSpy.mockRestore();
    });

    test("warns when single filter is already applied", async () => {
        const page = createPageMock();
        const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

        page.waitForSelector.mockImplementation((selector: string) => {
            if (selector.includes(YtMusicSearchInputSelector)) return Promise.resolve({});
            if (selector.includes(SinglesHrefSelector)) {
                return Promise.resolve({
                    evaluate: jest.fn().mockResolvedValue("channel/singles"),
                });
            }
            if (selector.includes(SingleFilterSelector)) {
                return Promise.reject(new Error("filter not found"));
            }

            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });

        page.$$eval.mockImplementation((_selector: string, callback: (elements: Array<{getAttribute: () => string;}>) => string[]) => {
            return Promise.resolve(callback(createElements(["single/one"])));
        });
        
        resolveValidYoutubePlaylistUrlMock.mockImplementation((url: string) => Promise.resolve(url));

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams({
                ...baseYoutubeParams,
                values: ["https://music.youtube.com/channel/UC123"],
                options: {downloadAlbums: false, downloadSinglesAndEps: true},
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(consoleWarnSpy).toHaveBeenCalledWith("Singles already filtered");
        expect(reporterFinishMock).toHaveBeenCalledWith("done", expect.objectContaining({
            values: ["https://music.youtube.com/single/one"],
        }));
        consoleWarnSpy.mockRestore();
    });

    test("falls back to best result when search fails", async () => {
        const page = createPageMock();

        page.waitForSelector.mockImplementation((selector: string) => {
            if (selector.includes(YtMusicSearchInputSelector)) {
                return Promise.reject(new Error("fail"));
            }

            if (selector.includes(YtMusicArtistBestResultLinkSelector)) {
                return Promise.resolve({
                    evaluate: jest.fn().mockImplementation((cb: (el: {getAttribute: () => string;}) => string) =>
                        Promise.resolve(cb({getAttribute: () => "channel/best"}))),
                });
            }

            return Promise.reject(new Error(`Unexpected selector: ${selector}`));
        });

        const browser = createBrowserMock(page);
        launchMock.mockResolvedValue(browser);
        navigateToPageMock.mockResolvedValue(undefined);
        setCookiesMock.mockResolvedValue(undefined);

        await execute({
            params: createYoutubeParams({
                ...baseYoutubeParams,
                values: ["Artist"],
                options: {downloadAlbums: false, downloadSinglesAndEps: false},
            }),
            options: {},
            i18n: createI18n(),
            onUpdate: jest.fn(),
            signal: new AbortController().signal,
        });

        expect(navigateToPageMock).toHaveBeenCalledWith("https://music.youtube.com/channel/best", page);
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
            signal: new globalThis.AbortController().signal,
        });

        const [, result] = reporterFinishMock.mock.calls[0];

        expect(result.errors ?? []).toEqual([]);
        expect(result.warnings).toEqual([
            {
                title: "exceptionGetYoutubeUrls",
                description: "exceptionGetYoutubeUrlsText",
            },
        ]);
        expect(result.values ?? []).toEqual([]);
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
            params: createYoutubeParams(baseYoutubeParams),
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


    test("aborts execution when signal fires", async () => {
        const page = createPageMock();
        page.waitForSelector.mockResolvedValue({});

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
