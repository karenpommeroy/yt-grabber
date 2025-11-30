import {map} from "lodash-es";

import {MessageBus} from "../messaging/MessageBus";
import {useDataState} from "../react/contexts/DataContext";
import {
    AudioType, Format, FormatScope, MediaFormat, MultiMatchAction, SortOrder, TabsOrderKey
} from "./Media";
import {ApplicationOptions} from "./Store";
import {AlbumInfo, FormatInfo, PlaylistInfo, TrackInfo, TrackStatusInfo} from "./Youtube";

import type {ElementHandle, Keyboard, Page} from "puppeteer-core";
type PageStub = Pick<Page, "goto"> & InstanceType<typeof Page> & {
    keyboard: InstanceType<typeof Keyboard>;
    cookies: jest.Mock;
    setCookie: jest.Mock;
};

type MockedDataState = Record<string, unknown> &{
    errors: Array<{url: string; message: string}>;
    warnings: Array<{url: string; message: string}>;
    trackStatus: TrackStatusInfo[];
    queue: string[];
    formats: Record<string, Format>;
    playlists: PlaylistInfo[];
    setPlaylists: jest.Mock;
    setTrackCuts: jest.Mock;
    setFormats: jest.Mock;
    tracks: TrackInfo[];
    trackCuts: {[key: string]: [number, number][]};
    setTracks: jest.Mock;
    setTrackStatus: jest.Mock;
};

export const createApplicationOptions = (overrides: Partial<ApplicationOptions> = {}): ApplicationOptions => {
    return {
        youtubeUrl: "https://music.youtube.com",
        outputDirectory: "C:/downloads",
        ytdlpExecutablePath: "C:/yt/yt-dlp.exe",
        ffmpegExecutablePath: "C:/ffmpeg.exe",
        gifsicleExecutablePath: "C:/gifsicle.exe",
        chromeExecutablePath: "C:/chrome.exe",
        albumOutputTemplate: "{{artist}}/{{trackTitle}}",
        playlistOutputTemplate: "{{albumTitle}}/{{trackTitle}}",
        videoOutputTemplate: "{{artist}} - {{trackTitle}}",
        trackOutputTemplate: "{{artist}} - {{trackTitle}}",
        customYtdlpArgs: "",
        concurrency: 5,
        quality: 8,
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

export const createApplicationOptionsMock = (overrides: Partial<{formatScope: FormatScope}> = {}) => {
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
    artist: "Artist",
    title: "Album",
    releaseYear: 1999,
    tracksNumber: 1,
    duration: 300,
    thumbnail: "thumbnail.jpg",
    url: "https://example.com",
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
    title: "track",
    duration: 300,
    artist: "artist",
    album: "album",
    creators: ["artist"],
    timestamp: Date.now(),
    release_year: 2000,
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
