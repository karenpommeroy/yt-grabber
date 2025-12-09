import "moment-duration-format";

import {spawn} from "child_process";
import fs from "fs-extra";

import {isAlbumTrack, isPlaylistTrack} from "./Formatters";
import {AudioType, MediaFormat, VideoType} from "./Media";
import {createAlbumInfo, createApplicationOptions, createTrackInfo} from "./TestHelpers";
import {
    convertOutputToFormat, createGifUsingPalette, generateColorPalette, getOutputFile,
    getOutputFileParts, getOutputFilePath, getYtdplRequestParams, mergeOutputFiles, optimizeGif
} from "./YtdplUtils";

jest.mock("./Formatters", () => require("@tests/mocks/common/Formatters"));
jest.mock("child_process", () => require("@tests/mocks/child-process"));
jest.mock("fs-extra", () => ({removeSync: jest.fn()}));

const isAlbumTrackMock = isAlbumTrack as jest.Mock;
const isPlaylistTrackMock = isPlaylistTrack as jest.Mock;
const mockedStoreGet = store.get as jest.Mock;
const spawnMock = spawn as jest.MockedFunction<typeof spawn>;
const removeSyncMock = fs.removeSync as jest.MockedFunction<typeof fs.removeSync>;

const setApplicationOptions = (overrides: Record<string, any> = {}) => {
    mockedStoreGet.mockImplementation((key: string) => {
        if (key === "application") {
            return createApplicationOptions(overrides);
        }

        if (key === "application.ffmpegExecutablePath") {
            return overrides.ffmpegExecutablePath ?? createApplicationOptions().ffmpegExecutablePath;
        }

        if (key === "application.gifsicleExecutablePath") {
            return overrides.gifsicleExecutablePath ?? createApplicationOptions().gifsicleExecutablePath;
        }

        if (key === "application.ytdlpExecutablePath") {
            return overrides.ytdlpExecutablePath ?? createApplicationOptions().ytdlpExecutablePath;
        }

        return {};
    });
};

const createSpawnStub = () => {
    const listeners: Record<string, (...args: any[]) => void> = {};
    const stderrListeners: Record<string, (...args: any[]) => void> = {};
    const proc = {
        on: jest.fn((event: string, handler: (...args: any[]) => void) => {
            listeners[event] = handler;
        }),
        stderr: {
            on: jest.fn((event: string, handler: (...args: any[]) => void) => {
                stderrListeners[event] = handler;
            }),
        },
        emit: (event: string, ...args: any[]) => listeners[event]?.(...args),
        emitStderr: (event: string, ...args: any[]) => stderrListeners[event]?.(...args),
    } as any;

    spawnMock.mockReturnValue(proc);

    return proc;
};

describe("YtdplUtils", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setApplicationOptions();
        isAlbumTrackMock.mockReturnValue(false);
        isPlaylistTrackMock.mockReturnValue(false);
        spawnMock.mockReset();
        removeSyncMock.mockReset();
    });

    test("getYtdplRequestParams builds audio request with cuts and overwrite", () => {
        setApplicationOptions({alwaysOverwrite: true});
        const track = createTrackInfo();
        const album = createAlbumInfo();
        const format = {type: MediaFormat.Audio, extension: AudioType.Mp3, audioQuality: 2};
        const trackCuts: Record<string, [number, number][]> = {
            [track.id]: [
                [0, 10],
                [10, 20],
            ],
        };

        const params = getYtdplRequestParams(track, album, trackCuts, format, "--custom-flag");

        expect(params).toEqual(expect.arrayContaining([
            "--extract-audio",
            "--audio-format",
            AudioType.Mp3,
            "--embed-thumbnail",
            "--audio-quality",
            "8",
            "--progress",
            "--download-sections",
            "--force-keyframes-at-cuts",
            "-S",
            "proto:https",
            "--force-overwrite",
            "--postprocessor-args",
            expect.stringContaining("metadata title=\"Track Title\""),
            "--output",
            expect.stringContaining("%(autonumber)03d"),
            "--custom-flag",
        ]));

        const downloadSections = params.filter((value, index) => params[index - 1] === "--download-sections");
        expect(downloadSections[0]).toMatch(/^\*\d+/);
    });

    test("getOutputFileParts expands numbered part paths", () => {
        const track = createTrackInfo();
        const album = createAlbumInfo();
        const format = {type: MediaFormat.Audio, extension: AudioType.Mp3};

        const files = getOutputFileParts(track, album, format, 2);

        expect(files).toEqual([
            "./downloads/Album Artist - Track Title 001.mp3",
            "./downloads/Album Artist - Track Title 002.mp3",
        ]);
    });

    test("getOutputFile builds album path when album track", () => {
        isAlbumTrackMock.mockReturnValue(true);
        const track = createTrackInfo({playlist_autonumber: 3});
        const album = createAlbumInfo({artist: "Test Artist", title: "Great Album"});

        const path = getOutputFile(track, album, {type: MediaFormat.Audio});

        expect(path).toBe("./downloads/Test Artist/[2023] Great Album/3 - Track Title");
    });

    test("getYtdplRequestParams builds video request with mapped extension", () => {
        const track = createTrackInfo();
        const album = createAlbumInfo();
        const format = {type: MediaFormat.Video, extension: VideoType.Mkv, videoQuality: "1920x1080"};

        const params = getYtdplRequestParams(track, album, {}, format, "--extra-flag");

        expect(params).toEqual(expect.arrayContaining([
            "-f",
            expect.stringContaining("height<=1080"),
            expect.stringContaining("ext=webm"),
            "--output",
            expect.stringContaining("%(ext)s"),
            "--extra-flag",
        ]));
        expect(params).not.toContain("--download-sections");
    });

    test("getOutputFile falls back to default playlist template on error", () => {
        setApplicationOptions({playlistOutputTemplate: "{{(function(){throw new Error('boom')})()}}"});
        isPlaylistTrackMock.mockReturnValue(true);

        const track = createTrackInfo();
        const album = createAlbumInfo({title: "Playlist Album"});

        const result = getOutputFile(track, album, {type: MediaFormat.Audio});

        expect(result).toBe("./downloads/Playlist Album/Track Title");
    });

    test("getOutputFilePath appends extension", () => {
        const track = createTrackInfo();
        const album = createAlbumInfo();
        const path = getOutputFilePath(track, album, {type: MediaFormat.Audio, extension: AudioType.Flac});

        expect(path.endsWith(".flac")).toBe(true);
        expect(path).toContain("Track Title");
    });

    test("mergeOutputFiles invokes ffmpeg with concat args and succeeds", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        mergeOutputFiles("/dir", "file", "mp3", callback);

        expect(spawnMock).toHaveBeenCalledWith(
            "/custom/ffmpeg",
            expect.arrayContaining(["-i", "/dir/file.txt", "-i", "/dir/file 001.mp3", "-map_metadata", "0", "/dir/file.mp3"])
        );

        proc.emit("close", 0);

        expect(callback).toHaveBeenCalledWith();
    });

    test("mergeOutputFiles forwards errors on failure", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        mergeOutputFiles("/dir", "file", "mp3", callback);
        proc.emitStderr("data", "oops");
        proc.emit("close", 1);

        expect(callback).toHaveBeenCalledWith(expect.any(Error));
        expect((callback.mock.calls[0][0] as Error).message).toContain("code 1");
        expect((callback.mock.calls[0][0] as Error).message).toContain("oops");
    });

    test("convertOutputToFormat skips unsupported extensions", () => {
        const callback = jest.fn();

        convertOutputToFormat("/dir", "file", "gif", callback);

        expect(spawnMock).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith();
    });

    test("convertOutputToFormat spawns ffmpeg for mp4", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        convertOutputToFormat("/dir", "file", "mp4", callback);

        expect(spawnMock).toHaveBeenCalledWith(
            "/custom/ffmpeg",
            expect.arrayContaining(["-i", "/dir/file.mkv", "/dir/file.mp4"])
        );

        proc.emit("close", 0);

        expect(callback).toHaveBeenCalledWith();
    });

    test("generateColorPalette uses video width in scale filter", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        generateColorPalette("/dir", "file", {videoQuality: "640x480"}, "mp4", callback);

        expect(spawnMock).toHaveBeenCalledWith(
            "/custom/ffmpeg",
            expect.arrayContaining(["-vf", expect.stringContaining("scale=640:-1:flags=lanczos,palettegen")])
        );

        proc.emit("close", 0);

        expect(callback).toHaveBeenCalledWith();
    });

    test("createGifUsingPalette removes palette file and reports errors", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        createGifUsingPalette("/dir", "file", {videoQuality: "640x480", gifTopText: "Hi"}, callback);

        proc.emit("close", 1);

        expect(callback).toHaveBeenCalledWith(expect.any(Error));
        expect(removeSyncMock).toHaveBeenCalledWith("/dir/file-palette.png");
    });

    test("optimizeGif uses gifsicle path", () => {
        setApplicationOptions({gifsicleExecutablePath: "/custom/gifsicle"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        optimizeGif("/dir", "file", callback);

        expect(spawnMock).toHaveBeenCalledWith(
            "/custom/gifsicle",
            expect.arrayContaining(["/dir/file.gif"])
        );

        proc.emit("close", 0);

        expect(callback).toHaveBeenCalledWith();
    });

    test("optimizeGif reports failure with error message", () => {
        setApplicationOptions({gifsicleExecutablePath: "/custom/gifsicle"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        optimizeGif("/dir", "file", callback);
        proc.emit("error", new Error("gifsicle not found"));
        proc.emit("close", 1);

        expect(callback).toHaveBeenCalledWith(expect.any(Error));
        expect((callback.mock.calls[0][0] as Error).message).toContain("Gifsicle exited with code 1");
    });

    test("mergeOutputFiles uses default ffmpeg path when not configured", () => {
        setApplicationOptions({ffmpegExecutablePath: ""});
        const proc = createSpawnStub();
        const callback = jest.fn();

        mergeOutputFiles("/dir", "file", "wav", callback);

        expect(spawnMock).toHaveBeenCalled();
        const firstArg = spawnMock.mock.calls[0][0];
        expect(firstArg).toContain("ffmpeg.exe");
        proc.emit("close", 0);
        expect(callback).toHaveBeenCalledWith();
    });

    test("mergeOutputFiles uses m4a specific args with attached_pic disposition", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        mergeOutputFiles("/dir", "file", "m4a", callback);

        expect(spawnMock).toHaveBeenCalledWith(
            "/custom/ffmpeg",
            expect.arrayContaining([
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", "/dir/file.txt",
                "-i", "/dir/file 001.m4a",
                "-map", "0:a",
                "-map", "1:v",
                "-c:a", "copy",
                "-c:v", "copy",
                "-disposition:v:0", "attached_pic",
                "-map_metadata", "1",
                "/dir/file.m4a",
            ])
        );

        proc.emit("close", 0);
        expect(callback).toHaveBeenCalledWith();
    });

    test("mergeOutputFiles uses flac specific args with disposition", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        mergeOutputFiles("/dir", "file", "flac", callback);

        expect(spawnMock).toHaveBeenCalledWith(
            "/custom/ffmpeg",
            expect.arrayContaining([
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", "/dir/file.txt",
                "-i", "/dir/file 001.flac",
                "-map", "0:a",
                "-map", "1:v",
                "-c", "copy",
                "-map_metadata", "0",
                "-disposition:v:1", "attached_pic",
                "/dir/file.flac",
            ])
        );

        proc.emit("close", 0);
        expect(callback).toHaveBeenCalledWith();
    });

    test("mergeOutputFiles uses default args for other extensions like wav", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        mergeOutputFiles("/dir", "file", "wav", callback);

        expect(spawnMock).toHaveBeenCalledWith(
            "/custom/ffmpeg",
            expect.arrayContaining([
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", "/dir/file.txt",
                "-c", "copy",
                "/dir/file.wav",
            ])
        );

        proc.emit("close", 0);
        expect(callback).toHaveBeenCalledWith();
    });

    test("mergeOutputFiles handles spawn error", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        mergeOutputFiles("/dir", "file", "mp3", callback);
        proc.emit("error", new Error("ENOENT"));
        proc.emit("close", 1);

        expect(callback).toHaveBeenCalledWith(expect.any(Error));
        expect((callback.mock.calls[0][0] as Error).message).toContain("ENOENT");
    });

    test("convertOutputToFormat spawns ffmpeg for mov format", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        convertOutputToFormat("/dir", "file", "mov", callback);

        expect(spawnMock).toHaveBeenCalledWith(
            "/custom/ffmpeg",
            expect.arrayContaining([
                "-y",
                "-i", "/dir/file.mkv",
                "-c:v", "libx264",
                "-c:a", "aac",
                "/dir/file.mov",
            ])
        );

        proc.emit("close", 0);
        expect(callback).toHaveBeenCalledWith();
    });

    test("convertOutputToFormat spawns ffmpeg for avi format", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        convertOutputToFormat("/dir", "file", "avi", callback);

        expect(spawnMock).toHaveBeenCalledWith(
            "/custom/ffmpeg",
            expect.arrayContaining([
                "-y",
                "-i", "/dir/file.mkv",
                "-c:v", "mpeg4",
                "-vtag", "xvid",
                "-qscale:v", "1",
                "-c:a", "mp3",
                "/dir/file.avi",
            ])
        );

        proc.emit("close", 0);
        expect(callback).toHaveBeenCalledWith();
    });

    test("convertOutputToFormat spawns ffmpeg for mpeg format", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        convertOutputToFormat("/dir", "file", "mpeg", callback);

        expect(spawnMock).toHaveBeenCalledWith(
            "/custom/ffmpeg",
            expect.arrayContaining([
                "-y",
                "-i", "/dir/file.mkv",
                "-f", "mpeg",
                "-c:v", "mpeg2video",
                "-q:v", "1",
                "-c:a", "mp2",
                "-b:a", "192k",
                "/dir/file.mpeg",
            ])
        );

        proc.emit("close", 0);
        expect(callback).toHaveBeenCalledWith();
    });

    test("convertOutputToFormat handles spawn error for mp4", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        convertOutputToFormat("/dir", "file", "mp4", callback);
        proc.emit("error", new Error("ENOENT"));
        proc.emitStderr("data", "ffmpeg stderr output");
        proc.emit("close", 1);

        expect(callback).toHaveBeenCalledWith(expect.any(Error));
        expect((callback.mock.calls[0][0] as Error).message).toContain("ENOENT");
        expect((callback.mock.calls[0][0] as Error).message).toContain("ffmpeg stderr output");
    });

    test("generateColorPalette handles spawn error", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        generateColorPalette("/dir", "file", {videoQuality: "640x480"}, "mp4", callback);
        proc.emit("error", new Error("ENOENT"));
        proc.emit("close", 1);

        expect(callback).toHaveBeenCalledWith(expect.any(Error));
        expect((callback.mock.calls[0][0] as Error).message).toContain("ENOENT");
    });

    test("generateColorPalette uses default ffmpeg path when not configured", () => {
        setApplicationOptions({ffmpegExecutablePath: ""});
        const proc = createSpawnStub();
        const callback = jest.fn();

        generateColorPalette("/dir", "file", {videoQuality: "1280x720"}, "mp4", callback);

        expect(spawnMock).toHaveBeenCalled();
        const firstArg = spawnMock.mock.calls[0][0];
        expect(firstArg).toContain("ffmpeg.exe");
        proc.emit("close", 0);
        expect(callback).toHaveBeenCalledWith();
    });

    test("createGifUsingPalette applies GIF filter with top and bottom text", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        createGifUsingPalette("/dir", "file", {videoQuality: "640x480", gifTopText: "Top", gifBottomText: "Bottom"}, callback);

        expect(spawnMock).toHaveBeenCalledWith(
            "/custom/ffmpeg",
            expect.arrayContaining([
                "-i", "/dir/file.mkv",
                "-i", "/dir/file-palette.png",
                "-filter_complex", expect.stringContaining("Top"),
            ])
        );

        proc.emit("close", 0);
        expect(callback).toHaveBeenCalledWith();
        expect(removeSyncMock).toHaveBeenCalledWith("/dir/file-palette.png");
    });

    test("createGifUsingPalette handles spawn error", () => {
        setApplicationOptions({ffmpegExecutablePath: "/custom/ffmpeg"});
        const proc = createSpawnStub();
        const callback = jest.fn();

        createGifUsingPalette("/dir", "file", {videoQuality: "640x480"}, callback);
        proc.emit("error", new Error("ENOENT"));
        proc.emit("close", 1);

        expect(callback).toHaveBeenCalledWith(expect.any(Error));
        expect((callback.mock.calls[0][0] as Error).message).toContain("ENOENT");
        expect(removeSyncMock).toHaveBeenCalledWith("/dir/file-palette.png");
    });

    test("createGifUsingPalette uses default ffmpeg path when not configured", () => {
        setApplicationOptions({ffmpegExecutablePath: ""});
        const proc = createSpawnStub();
        const callback = jest.fn();

        createGifUsingPalette("/dir", "file", {videoQuality: "1280x720"}, callback);

        expect(spawnMock).toHaveBeenCalled();
        const firstArg = spawnMock.mock.calls[0][0];
        expect(firstArg).toContain("ffmpeg.exe");
        proc.emit("close", 0);
        expect(callback).toHaveBeenCalledWith();
    });

    test("getOutputFile falls back to default video template on error when not album track", () => {
        setApplicationOptions({videoOutputTemplate: "{{(function(){throw new Error('boom')})()}}"});
        isAlbumTrackMock.mockReturnValue(false);

        const track = createTrackInfo();
        const album = createAlbumInfo();

        const result = getOutputFile(track, album, {type: MediaFormat.Video});

        expect(result).toBe("./downloads/Album Artist - Track Title");
    });

    test("getOutputFile uses playlist template for album track with video format", () => {
        isAlbumTrackMock.mockReturnValue(true);

        const track = createTrackInfo({playlist_autonumber: 3});
        const album = createAlbumInfo({title: "Playlist Title"});

        const result = getOutputFile(track, album, {type: MediaFormat.Video});

        expect(result).toBe("./downloads/Playlist Title/Track Title");
    });

    test("getOutputFile falls back to default video playlist template on error for album track", () => {
        setApplicationOptions({playlistOutputTemplate: "{{(function(){throw new Error('boom')})()}}"});
        isAlbumTrackMock.mockReturnValue(true);

        const track = createTrackInfo({playlist_autonumber: 3});
        const album = createAlbumInfo({title: "Playlist Title"});

        const result = getOutputFile(track, album, {type: MediaFormat.Video});

        expect(result).toBe("./downloads/Playlist Title/Track Title");
    });

    test("getYtdplRequestParams returns download sections args when cuts have values", () => {
        const track = createTrackInfo();
        const album = createAlbumInfo();
        const format = {type: MediaFormat.Audio, extension: AudioType.Mp3};
        const trackCuts: Record<string, [number, number][]> = {
            [track.id]: [[5, 15]],
        };

        const params = getYtdplRequestParams(track, album, trackCuts, format);

        expect(params).toContain("--download-sections");
        expect(params).toContain("--force-keyframes-at-cuts");
        expect(params).toContain("-S");
        expect(params).toContain("proto:https");

        const downloadSectionsIndex = params.indexOf("--download-sections");
        expect(downloadSectionsIndex).toBeGreaterThan(-1);
        expect(params[downloadSectionsIndex + 1]).toMatch(/^\*.*-.*$/);
    });

    test("optimizeGif uses default gifsicle path when not configured", () => {
        setApplicationOptions({gifsicleExecutablePath: ""});
        const proc = createSpawnStub();
        const callback = jest.fn();

        optimizeGif("/dir", "file", callback);

        expect(spawnMock).toHaveBeenCalled();
        const firstArg = spawnMock.mock.calls[0][0];
        expect(firstArg).toContain("gifsicle.exe");
        proc.emit("close", 0);
        expect(callback).toHaveBeenCalledWith();
    });

    test("convertOutputToFormat uses default ffmpeg path when not configured", () => {
        setApplicationOptions({ffmpegExecutablePath: ""});
        const proc = createSpawnStub();
        const callback = jest.fn();

        convertOutputToFormat("/dir", "file", "mp4", callback);

        expect(spawnMock).toHaveBeenCalled();
        const firstArg = spawnMock.mock.calls[0][0];
        expect(firstArg).toContain("ffmpeg.exe");
        proc.emit("close", 0);
        expect(callback).toHaveBeenCalledWith();
    });

    test("getYtdplRequestParams generates download sections with multiple cuts", () => {
        const track = createTrackInfo();
        const album = createAlbumInfo();
        const format = {type: MediaFormat.Audio, extension: AudioType.Mp3};
        const trackCuts: Record<string, [number, number][]> = {
            [track.id]: [
                [60, 120],
                [180, 240],
            ],
        };

        const params = getYtdplRequestParams(track, album, trackCuts, format);

        const downloadSectionIndices: number[] = [];
        params.forEach((param, index) => {
            if (param === "--download-sections") {
                downloadSectionIndices.push(index);
            }
        });

        expect(downloadSectionIndices.length).toBe(2);
        expect(params).toContain("--force-keyframes-at-cuts");
    });

    test("getOutputFile uses video template for non-album track video format", () => {
        isAlbumTrackMock.mockReturnValue(false);
        isPlaylistTrackMock.mockReturnValue(false);

        const track = createTrackInfo();
        const album = createAlbumInfo();

        const result = getOutputFile(track, album, {type: MediaFormat.Video});

        expect(result).toBe("./downloads/Album Artist - Track Title");
    });
});
