import "moment-duration-format";

import {isAlbumTrack, isPlaylistTrack} from "./Formatters";
import {AudioType, MediaFormat} from "./Media";
import {AlbumInfo, TrackInfo} from "./Youtube";
import {getOutputFile, getOutputFileParts, getYtdplRequestParams} from "./YtdplUtils";

jest.mock("./Formatters", () => require("@tests/mocks/common/Formatters"));

const isAlbumTrackMock = isAlbumTrack as jest.Mock;
const isPlaylistTrackMock = isPlaylistTrack as jest.Mock;
const store = global.store as unknown as {get: jest.Mock};

const buildTrack = (overrides: Partial<TrackInfo> = {}): TrackInfo => ({
    album: "Test Album",
    artist: "Track Artist",
    channel: "Channel",
    creators: ["Track Artist"],
    duration: 180,
    id: "track-1",
    uploader: "Uploader",
    original_url: "https://example.com/track",
    playlist: "",
    playlist_title: "Playlist Title",
    playlist_id: "playlist-1",
    playlist_autonumber: 1,
    playlist_count: 5,
    playlist_uploader: "Playlist Uploader",
    playlist_uploader_id: "Playlist Uploader Id",
    playlist_channel: "Playlist Channel",
    playlist_channel_id: "Playlist Channel Id",
    release_year: 2023,
    title: "Track Title",
    thumbnail: "https://example.com/thumb.jpg",
    formats: [],
    timestamp: 1_600_000_000,
    filesize_approx: 0,
    thumbnails: [],
    ...overrides,
});

const buildAlbum = (overrides: Partial<AlbumInfo> = {}): AlbumInfo => ({
    id: "album-1",
    artist: "Album Artist",
    title: "Album Title",
    releaseYear: 2023,
    tracksNumber: 12,
    duration: 3600,
    thumbnail: "https://example.com/album.jpg",
    url: "https://example.com/playlist",
    ...overrides,
});

const setApplicationOptions = (overrides: Record<string, any> = {}) => {
    store.get.mockImplementation((key: string) => {
        if (key === "application") {
            return {
                alwaysOverwrite: false,
                outputDirectory: "./downloads",
                playlistOutputTemplate: "{{albumTitle}}/{{trackTitle}}",
                albumOutputTemplate: "{{artist}}/[{{releaseYear}}] {{albumTitle}}/{{trackNo}} - {{trackTitle}}",
                trackOutputTemplate: "{{artist}} - {{trackTitle}}",
                videoOutputTemplate: "{{artist}} - {{trackTitle}}",
                ...overrides,
            };
        }

        return {};
    });
};

describe("YtdplUtils", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setApplicationOptions();
        isAlbumTrackMock.mockReturnValue(false);
        isPlaylistTrackMock.mockReturnValue(false);
    });

    test("getYtdplRequestParams builds audio request with cuts and overwrite", () => {
        setApplicationOptions({alwaysOverwrite: true});
        const track = buildTrack();
        const album = buildAlbum();
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
        const track = buildTrack();
        const album = buildAlbum();
        const format = {type: MediaFormat.Audio, extension: AudioType.Mp3};

        const files = getOutputFileParts(track, album, format, 2);

        expect(files).toEqual([
            "./downloads/Album Artist - Track Title 001.mp3",
            "./downloads/Album Artist - Track Title 002.mp3",
        ]);
    });

    test("getOutputFile builds album path when album track", () => {
        isAlbumTrackMock.mockReturnValue(true);
        const track = buildTrack({playlist_autonumber: 3});
        const album = buildAlbum({artist: "Test Artist", title: "Great Album"});

        const path = getOutputFile(track, album, {type: MediaFormat.Audio});

        expect(path).toBe("./downloads/Test Artist/[2023] Great Album/3 - Track Title");
    });
});
