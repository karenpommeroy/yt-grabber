import "moment-duration-format";

import * as lodashEs from "lodash-es";

import {
    escapePathString, formatFileSize, formatTime, getDataAttributes, getProcessArgs,
    getRealFileExtension, getUrlType, isArtist, isDebugMode, isDev, isDevApplication, isPlaylist,
    isTrack, mapRange, resolveMockData, sanitizeFilePath, splitDataAttributes, timeStringToNumber,
    unformatTime, waitFor
} from "./Helpers";
import {VideoType} from "./Media";
import {UrlType} from "./Youtube";

import type {App} from "electron";

jest.mock("lodash-es", () => {
    const actual = jest.requireActual("lodash-es");
    return {
        __esModule: true,
        ...actual,
        groupBy: jest.fn(actual.groupBy),
    };
});

describe("Helpers", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalArgv = [...process.argv];

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        process.argv = [...originalArgv];
        jest.useRealTimers();
        (lodashEs.groupBy as jest.Mock).mockReset();
    });

    test("isDev detects development environment", () => {
        process.env.NODE_ENV = "development";
        expect(isDev()).toBe(true);

        process.env.NODE_ENV = "production";
        expect(isDev()).toBe(false);
    });

    test("isDevApplication reflects app packaging state", () => {
        const devApp = {isPackaged: false} as unknown as App;
        const prodApp = {isPackaged: true} as unknown as App;

        expect(isDevApplication(devApp)).toBe(true);
        expect(isDevApplication(prodApp)).toBe(false);
    });

    test("getProcessArgs parses flags with and without values", () => {
        process.argv = ["node", "script", "--debug-mode", "--port=8080", "plain-arg", "--flag"];

        expect(getProcessArgs()).toEqual({"debug-mode": true, port: "8080", flag: true});
    });

    test("isDebugMode checks parsed arguments", () => {
        process.argv = ["node", "script", "--debug-mode"];
        expect(isDebugMode()).toBe(true);

        process.argv = ["node", "script", "--other"];
        expect(isDebugMode()).toBe(false);
    });

    test("formatTime returns padded values", () => {
        expect(formatTime("5")).toBe("00:05");
        expect(formatTime("3661")).toBe("01:01:01");
    });

    test("unformatTime converts strings back to seconds", () => {
        expect(unformatTime("05")).toBe("5");
        expect(unformatTime("01:02:03")).toBe("3723");
        expect(unformatTime("02:30")).toBe("150");
    });

    test("timeStringToNumber returns numeric seconds", () => {
        expect(timeStringToNumber("01:02:03")).toBe(3723);
        expect(timeStringToNumber("02:30")).toBe(150);
    });

    test("formatFileSize formats bytes", () => {
        expect(formatFileSize(0)).toBe("0 Bytes");
        expect(formatFileSize(1024)).toBe("1 KB");
        expect(formatFileSize(1536)).toBe("1.5 KB");
        expect(formatFileSize(undefined as unknown as number)).toBe("");
    });

    test("mapRange maps between ranges", () => {
        expect(mapRange(5, [0, 10], [0, 100])).toBe(50);
    });

    test("escapePathString replaces slashes", () => {
        expect(escapePathString("folder/sub")).toBe("folder-sub");
    });

    describe("sanitizeFilePath", () => {
        test("replaces Windows-illegal characters with default replacement", () => {
            expect(sanitizeFilePath("./output/a<b>c:d:e:f:g|h?i*j#k")).toBe("./output/a-b-c-d-e-f-g-h-i-j-k");
        });

        test("replaces ASCII control characters", () => {
            expect(sanitizeFilePath("./output/a\u0000b\u001Fc.mkv")).toBe("./output/a-b-c.mkv");
        });

        test("collapses consecutive replacement characters", () => {
            expect(sanitizeFilePath("a??b***c")).toBe("./a-b-c");
            expect(sanitizeFilePath("a####b")).toBe("./a-b");
        });

        test("trims and removes trailing dots", () => {
            expect(sanitizeFilePath("  hello world...  ")).toBe("./hello world.  ");
            expect(sanitizeFilePath("file.")).toBe("./file");
        });

        test("prefixes reserved Windows device names", () => {
            expect(sanitizeFilePath("con")).toBe("./-con");
            expect(sanitizeFilePath("NUL")).toBe("./-NUL");
            expect(sanitizeFilePath("Com1")).toBe("./-Com1");
            expect(sanitizeFilePath("lpt9")).toBe("./-lpt9");
        });

        test("returns fallback when result becomes empty", () => {
            expect(sanitizeFilePath("")).toBe("");
            expect(sanitizeFilePath("./output/???***###")).toBe("./output/unnamed");
            expect(sanitizeFilePath("./output/   ...   ")).toBe("./output/unnamed.   ");
        });

        test("supports custom replacement character", () => {
            expect(sanitizeFilePath("./output/a:b?c", "_")).toBe("./output/a_b_c");
        });
    });


    test("resolveMockData resolves after timers run for each group", async () => {
        jest.useFakeTimers();

        (lodashEs.groupBy as jest.Mock).mockReturnValue({
            p1: [{id: "a", playlist_id: "p1"}],
            p2: [{id: "b", playlist_id: "p2"}],
        });

        const promises = resolveMockData(100);
        const allPromise = Promise.all(promises);

        expect(promises).toHaveLength(2);

        jest.runAllTimers();
        await expect(allPromise).resolves.toHaveLength(2);
    });

    test("waitFor resolves after timeout", async () => {
        jest.useFakeTimers();
        const promise = waitFor(200);
        jest.advanceTimersByTime(200);
        await expect(promise).resolves.toBeUndefined();
    });

    test("URL helpers detect url type", () => {
        const playlistUrl = "https://music.youtube.com/playlist?list=PL123";
        const artistUrl = "https://youtube.com/channel/UC123";
        const trackUrl = "https://music.youtube.com/watch?v=abc123";
        const otherUrl = "https://example.com";

        expect(isPlaylist(playlistUrl)).toBe(true);
        expect(isArtist(artistUrl)).toBe(true);
        expect(isTrack(trackUrl)).toBe(true);

        expect(getUrlType(playlistUrl)).toBe(UrlType.Playlist);
        expect(getUrlType(artistUrl)).toBe(UrlType.Artist);
        expect(getUrlType(trackUrl)).toBe(UrlType.Track);
        expect(getUrlType(otherUrl)).toBe(UrlType.Other);
    });

    test("URL helpers return false for non-matching urls", () => {
        const otherUrl = "https://example.com";

        expect(isPlaylist(otherUrl)).toBe(false);
        expect(isArtist(otherUrl)).toBe(false);
        expect(isTrack(otherUrl)).toBe(false);
    });

    test("isPlaylist detects watch url with list param", () => {
        const watchWithList = "https://music.youtube.com/watch?v=abc123&list=PL456";
        expect(isPlaylist(watchWithList)).toBe(true);
    });

    test("getRealFileExtension normalises video formats", () => {
        expect(getRealFileExtension(VideoType.Mov)).toBe(VideoType.Mkv);
        expect(getRealFileExtension(VideoType.Avi)).toBe(VideoType.Mkv);
        expect(getRealFileExtension(VideoType.Mpeg)).toBe(VideoType.Mkv);
        expect(getRealFileExtension(VideoType.Gif)).toBe(VideoType.Mkv);
        expect(getRealFileExtension(VideoType.Mp4)).toBe(VideoType.Mp4);
        expect(getRealFileExtension(VideoType.Mkv)).toBe(VideoType.Mkv);
        expect(getRealFileExtension("test")).toBe("test");
    });

    test("getDataAttributes picks only data prefixed keys", () => {
        const attrs = getDataAttributes({id: "1", "data-test": "value", "data-extra": 5});
        expect(attrs).toEqual({"data-test": "value", "data-extra": 5});
    });

    test("getDataAttributes returns empty object when no data attributes", () => {
        const attrs = getDataAttributes({id: "1", className: "cls"});
        expect(attrs).toEqual({});
    });

    test("splitDataAttributes separates data and other props", () => {
        const [dataProps, restProps] = splitDataAttributes({id: "1", "data-test": "value", className: "cls"});
        expect(dataProps).toEqual({"data-test": "value"});
        expect(restProps).toEqual({id: "1", className: "cls"});
    });

    test("splitDataAttributes handles only data attributes", () => {
        const [dataProps, restProps] = splitDataAttributes({"data-id": "1", "data-name": "test"});
        expect(dataProps).toEqual({"data-id": "1", "data-name": "test"});
        expect(restProps).toEqual({});
    });

    test("splitDataAttributes handles only non-data attributes", () => {
        const [dataProps, restProps] = splitDataAttributes({id: "1", name: "test"});
        expect(dataProps).toEqual({});
        expect(restProps).toEqual({id: "1", name: "test"});
    });
});
