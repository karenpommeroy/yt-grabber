import {i18n, TFunction} from "i18next";
import {map} from "lodash-es";

import {MessageBus} from "../messaging/MessageBus";
import {useDataState} from "../react/contexts/DataContext";
import {
    AudioType, Format, FormatScope, InputMode, MediaFormat, MultiMatchAction, SortOrder,
    TabsOrderKey
} from "./Media";
import {GetYoutubeParams} from "./Messaging";
import {ApplicationOptions} from "./Store";
import {AlbumInfo, FormatInfo, PlaylistInfo, TrackInfo, TrackStatusInfo} from "./Youtube";

import type {ElementHandle, Keyboard, Page} from "puppeteer-core";
type PageStub = Pick<Page, "goto"> & InstanceType<typeof Page> & {
    keyboard: InstanceType<typeof Keyboard>;
    cookies: jest.Mock;
    setCookie: jest.Mock;
};

type MockedDataState = Record<string, unknown> & {
    errors: Array<{url: string; message: string;}>;
    warnings: Array<{url: string; message: string;}>;
    trackStatus: TrackStatusInfo[];
    queue: string[];
    formats: Record<string, Format>;
    playlists: PlaylistInfo[];
    setPlaylists: jest.Mock;
    setTrackCuts: jest.Mock;
    setFormats: jest.Mock;
    tracks: TrackInfo[];
    trackCuts: {[key: string]: [number, number][];};
    setTracks: jest.Mock;
    setTrackStatus: jest.Mock;
};

export const createApplicationOptions = (overrides: Partial<ApplicationOptions> = {}): ApplicationOptions => {
    return {
        youtubeUrl: "https://music.youtube.com",
        outputDirectory: "./downloads",
        ytdlpExecutablePath: "C:/yt/yt-dlp.exe",
        ffmpegExecutablePath: "C:/ffmpeg.exe",
        gifsicleExecutablePath: "C:/gifsicle.exe",
        chromeExecutablePath: "C:/chrome.exe",
        albumOutputTemplate: "{{artist}}/[{{releaseYear}}] {{albumTitle}}/{{trackNo}} - {{trackTitle}}",
        playlistOutputTemplate: "{{albumTitle}}/{{trackTitle}}",
        videoOutputTemplate: "{{artist}} - {{trackTitle}}",
        trackOutputTemplate: "{{artist}} - {{trackTitle}}",
        customYtdlpArgs: "",
        concurrency: 5,
        quality: 8,
        language: "en-GB",
        debugMode: false,
        inputMode: InputMode.Auto,
        showAdvancedSearchOptions: false,
        playlistCheckMaxItemsCount: 3,
        playlistCountThreshold: 10,
        urls: [],
        defaultMediaFormat: MediaFormat.Audio,
        formatScope: FormatScope.Global,
        multiMatchAction: MultiMatchAction.UseFirst,
        tabsOrder: [TabsOrderKey.Default, SortOrder.Asc],
        downloadAlbums: true,
        downloadSinglesAndEps: false,
        alwaysOverwrite: false,
        mergeParts: true,
        ...overrides,
    };
};

export const createApplicationOptionsMock = (overrides: Partial<{formatScope: FormatScope;}> = {}) => {
    const mockedStoreGet = store.get as jest.Mock;

    mockedStoreGet.mockImplementation((key: string) => {
        if (key === "application") {
            return {formatScope: FormatScope.Global, ...overrides};
        }

        return {};
    });
};

export const createMessageBus = (): InstanceType<typeof MessageBus> => {
    const messageBus = {
        ipcMain: {
            on: jest.fn(),
            removeListener: jest.fn(),
        },
        mainWindow: {
            webContents: {
                send: jest.fn(),
            },
            setAlwaysOnTop: jest.fn(),
        },
        controllers: new Map(),
    } as unknown as InstanceType<typeof MessageBus>;

    return messageBus;
};

export const createPage = (): PageStub => ({
    goto: jest.fn(),
    keyboard: {
        press: jest.fn(),
        up: jest.fn(),
        down: jest.fn(),
        sendCharacter: jest.fn(),
        type: jest.fn(),
    },
    cookies: jest.fn(),
    setCookie: jest.fn(),
    $eval: jest.fn(),
} as unknown as PageStub);

export const createInput = (): ElementHandle<Element> => ({
    click: jest.fn(),
} as unknown as ElementHandle<Element>);

export const createFormatInfo = (overrides: Partial<FormatInfo> = {}): FormatInfo => ({
    ext: "mp4",
    acodec: "aac",
    vcodec: "h264",
    audio_ext: "m4a",
    video_ext: "mp4",
    format_id: "1",
    format_note: "",
    filesize: 1000,
    fps: 30,
    quality: 1,
    has_drm: false,
    width: 1920,
    height: 1080,
    resolution: "1920x1080",
    protocol: "https",
    ...overrides,
});

export const createAlbumInfo = (overrides: Partial<AlbumInfo> = {}): AlbumInfo => ({
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

export const createPlaylistInfo = (overrides: Partial<PlaylistInfo> = {}): PlaylistInfo => {
    const {url = "album-1", album, tracks} = overrides;

    return {
        url,
        album: createAlbumInfo(album),
        tracks: map(tracks, (track) => createTrackInfo(track)),
    };
};

export const createTrackInfo = (overrides: Partial<TrackInfo> = {}): TrackInfo => ({
    id: "track-1",
    title: "Track Title",
    duration: 300,
    album: "Test Album",
    artist: "Track Artist",
    channel: "Channel",
    creators: ["Track Artist"],
    thumbnail: "https://example.com/thumb.jpg",
    release_year: 2000,
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
    formats: [],
    timestamp: 1_600_000_000,
    filesize_approx: 0,
    thumbnails: [],
    ...overrides,
} as TrackInfo);

export const setupDataState = (overrides: Partial<MockedDataState> = {}) => {
    const useDataStateMock = useDataState as unknown as jest.MockedFunction<typeof useDataState>;
    const state: MockedDataState = {
        errors: overrides.errors ?? [],
        warnings: overrides.warnings ?? [],
        trackStatus: overrides.trackStatus ?? [],
        tracks: overrides.tracks ?? [],
        trackCuts: overrides.trackCuts ?? {},
        queue: overrides.queue ?? [],
        setPlaylists: jest.fn(),
        setTrackCuts: jest.fn(),
        setTracks: jest.fn(),
        setTrackStatus: jest.fn(),
        formats: overrides.formats ?? {global: {type: MediaFormat.Audio, extension: AudioType.Mp3, audioQuality: 5}},
        playlists: overrides.playlists,
        activeTab: overrides.activeTab ?? "tab-1",
        setFormats: overrides.setFormats ?? jest.fn(),
        ...overrides,
    };

    useDataStateMock.mockReturnValue(state as any);

    return state;
};

export const createPageMock = () => ({
    setUserAgent: jest.fn().mockResolvedValue(undefined),
    waitForSelector: jest.fn(),
    waitForNetworkIdle: jest.fn().mockResolvedValue(undefined),
    $$: jest.fn().mockResolvedValue([]),
    $$eval: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    keyboard: {press: jest.fn()},
});

export const createBrowserMock = (page: ReturnType<typeof createPageMock>) => ({
    pages: jest.fn().mockResolvedValue([page]),
    close: jest.fn().mockResolvedValue(undefined),
});

export const createI18n = (): i18n => ({
    t: ((key: string) => key) as TFunction,
    changeLanguage: jest.fn().mockResolvedValue(undefined),
} as unknown as i18n);

export const createElements = (hrefs: string[]) => hrefs.map((href) => ({
    getAttribute: () => href,
}));

export const createYoutubeParams = (overwrites?: GetYoutubeParams): GetYoutubeParams => {
    return {
        values: ["https://music.youtube.com/channel/UC123"],
        lang: "en",
        url: "https://music.youtube.com",
        ...overwrites
    };
};
