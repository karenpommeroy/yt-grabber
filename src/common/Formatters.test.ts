import {getAlbumInfo, isAlbumTrack, isPlaylistTrack} from "./Formatters";
import {TrackInfo} from "./Youtube";

const store = global.store as unknown as {get: jest.Mock};

const buildTrack = (overrides: Partial<TrackInfo> = {}): TrackInfo => ({
    album: "Test Album",
    artist: "Track Artist",
    channel: "Channel",
    creators: ["Creator"],
    duration: 120,
    id: "track-id",
    uploader: "Uploader",
    original_url: "https://example.com/track",
    playlist: "",
    playlist_title: "Playlist Title",
    playlist_id: "playlist-id",
    playlist_autonumber: 1,
    playlist_count: 1,
    playlist_uploader: "Playlist Uploader",
    playlist_uploader_id: "playlist-uploader-id",
    playlist_channel: "Playlist Channel",
    playlist_channel_id: "playlist-channel-id",
    release_year: 2020,
    title: "Track Title",
    thumbnail: "https://example.com/thumb.jpg",
    formats: [],
    timestamp: 1_600_000_000,
    filesize_approx: 0,
    thumbnails: [
        {id: "1", url: "https://example.com/thumb-1.jpg"},
        {id: "2", url: "https://example.com/thumb-2.jpg"},
    ],
    ...overrides,
});

describe("Formatters", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        store.get.mockImplementation((key: string) => {
            if (key === "application") {
                return {playlistCountThreshold: 0};
            }

            return {};
        });
    });

    describe("getAlbumInfo", () => {
        test("builds album info for playlist results", () => {
            store.get.mockImplementation((key: string) => {
                if (key === "application") {
                    return {playlistCountThreshold: 5};
                }

                return {};
            });

            const firstTrack = buildTrack({
                playlist_count: 10,
                uploader: "Playlist Owner",
                playlist: "",
                thumbnail: undefined as unknown as string,
            });
            const secondTrack = buildTrack({id: "track-2", duration: 200});

            const info = getAlbumInfo([firstTrack, secondTrack], "https://example.com/playlist");

            expect(info).toEqual({
                id: "playlist-id",
                artist: "Playlist Owner",
                title: "Track Title",
                releaseYear: 2020,
                tracksNumber: 10,
                duration: 320,
                thumbnail: "https://example.com/thumb-2.jpg",
                url: "https://example.com/playlist",
            });
        });

        test("falls back to timestamp year when release_year is missing", () => {
            const track = buildTrack({
                release_year: undefined as unknown as number,
                timestamp: new Date("2015-06-15T00:00:00Z").getTime() / 1000,
                playlist_id: undefined as unknown as string,
            });

            const info = getAlbumInfo([track]);

            expect(info.id).toBe("track-id");
            expect(info.releaseYear).toBe(2015);
        });

        test("builds album info for non-playlist album track", () => {
            store.get.mockImplementation((key: string) => {
                if (key === "application") {
                    return {playlistCountThreshold: 100};
                }

                return {};
            });

            const track = buildTrack({
                playlist_count: 5,
                playlist: "Album Name",
                album: "Album Title",
                creators: ["Album Artist"],
            });

            const info = getAlbumInfo([track], "https://example.com/album");

            expect(info).toEqual({
                id: "playlist-id",
                artist: "Album Artist",
                title: "Album Title",
                releaseYear: 2020,
                tracksNumber: 5,
                duration: 120,
                thumbnail: "https://example.com/thumb.jpg",
                url: "https://example.com/album",
            });
        });
    });

    describe("isPlaylistTrack", () => {
        test("returns true when playlist_count exceeds threshold", () => {
            store.get.mockImplementation((key: string) => {
                if (key === "application") {
                    return {playlistCountThreshold: 2};
                }

                return {};
            });

            expect(isPlaylistTrack(buildTrack({playlist_count: 5}))).toBe(true);
        });

        test("returns false when playlist_count is within threshold", () => {
            store.get.mockImplementation((key: string) => {
                if (key === "application") {
                    return {playlistCountThreshold: 10};
                }

                return {};
            });

            expect(isPlaylistTrack(buildTrack({playlist_count: 4}))).toBe(false);
        });
    });

    describe("isAlbumTrack", () => {
        test("returns true when playlist data present", () => {
            expect(isAlbumTrack(buildTrack({playlist: "Album Playlist"}))).toBe(true);
        });

        test("returns false when playlist data missing", () => {
            expect(isAlbumTrack(buildTrack({playlist: ""}))).toBe(false);
        });
    });
});
