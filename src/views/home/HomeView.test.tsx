import {ipcRenderer} from "electron";
import fs from "fs-extra";
import React from "react";
import * as ytdlpWrapMock from "yt-dlp-wrap";

import {act, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {FormatScope, InputMode, MediaFormat, VideoType} from "../../common/Media";
import {createApplicationOptions} from "../../common/TestHelpers";
import * as YtdplUtils from "../../common/YtdplUtils";
import {Messages} from "../../messaging/Messages";
import {DataState, useDataState} from "../../react/contexts/DataContext";
import HomeView from "./HomeView";

jest.mock("fs-extra", () => require("@tests/mocks/fs-extra"));
jest.mock("yt-dlp-wrap", () => require("@tests/mocks/yt-dlp-wrap"));
jest.mock("../../common/Logger", () => require("@tests/mocks/common/Logger"));
jest.mock("../../react/contexts/AppContext", () => require("@tests/mocks/react/contexts/AppContext"));
jest.mock("../../react/contexts/DataContext", () => require("@tests/mocks/react/contexts/DataContext"));
jest.mock("../../common/YtdplUtils", () => {
    return {
        __esModule: true,
        getOutputFile: jest.fn(() => "C:/tmp/output/file"),
        getOutputFileParts: jest.fn(() => ["C:/tmp/output/file.part1", "C:/tmp/output/file.part2"]),
        getOutputFilePath: jest.fn(() => "C:/tmp/output/file"),
        getYtdplRequestParams: jest.fn(() => ["--foo"]),
        mergeOutputFiles: jest.fn((dir: string, name: string, ext: string, cb: (err?: Error) => void) => cb && cb()),
        convertOutputToFormat: jest.fn((dir: string, name: string, ext: string, cb: (err?: Error) => void) => cb && cb()),
        generateColorPalette: jest.fn((dir: string, name: string, format: any, ext: string, cb: (err?: Error) => void) => cb && cb()),
        createGifUsingPalette: jest.fn((dir: string, name: string, format: any, cb: (err?: Error) => void) => cb && cb()),
        optimizeGif: jest.fn((dir: string, name: string, cb: (err?: Error) => void) => cb && cb()),
    };
});

const inputPanelMock = jest.fn();

jest.mock("../../components/youtube/inputPanel/InputPanel", () => {
    const React = require("react");
    return {
        __esModule: true,
        default: (props: React.PropsWithChildren<Record<string, unknown>>) => {
            inputPanelMock(props);
            return <div data-testid="input-panel" />;
        },
    };
});

const stubbedProps: Record<string, any> = {};

function stubComponent(testId: string) {
    const React = require("react");

    return () => ({
        __esModule: true,
        default: (props: any) => {
            stubbedProps[testId] = props;
            return <div data-testid={testId} />;
        },
    });
}

jest.mock("../../components/youtube/formatSelector/FormatSelector", stubComponent("format-selector"));
jest.mock("../../components/youtube/infoBar/InfoBar", stubComponent("info-bar"));
jest.mock("../../components/youtube/playlistTabs/PlaylistTabs", stubComponent("playlist-tabs"));
jest.mock("../../components/modals/selectArtistModal/SelectArtistModal", stubComponent("select-artist-modal"));
jest.mock("../../components/modals/failuresModal/FailuresModal", stubComponent("failures-modal"));

type InputPanelHandlers = {
    onChange: (value: string[]) => void;
    onLoadInfo: (urls: string[], fromYear: string, untilYear: string) => void;
    onCancel: () => void;
    onDownload: (urls: string[], fromYear?: string, untilYear?: string) => void;
};

type StoreOverrides = {
    inputMode?: InputMode;
    options?: Record<string, unknown>;
    application?: Partial<ReturnType<typeof createApplicationOptions>>;
    playlistCheckItemsCount?: number;
    playlistCountThreshold?: number;
    additional?: Record<string, unknown>;
};

const storeGetMock = store.get as jest.Mock;
const storeSetMock = store.set as jest.Mock;
const storeOnDidAnyChangeMock = store.onDidAnyChange as jest.Mock;
const useDataStateMock = useDataState as jest.MockedFunction<typeof useDataState>;

let storeConfig: {application: ReturnType<typeof createApplicationOptions>; options: Record<string, unknown>};

const configureStore = (overrides: StoreOverrides = {}) => {
    const application = {...createApplicationOptions(), ...overrides.application};
    const options = overrides.options ?? {};
    const inputMode = overrides.inputMode ?? InputMode.Albums;
    const playlistCheckItemsCount = overrides.playlistCheckItemsCount ?? 3;
    const playlistCountThreshold = overrides.playlistCountThreshold ?? 10;

    storeGetMock.mockImplementation((key: string) => {
        switch (key) {
        case "application":
            return application;
        case "application.ytdlpExecutablePath":
            return application.ytdlpExecutablePath;
        case "application.inputMode":
            return inputMode;
        case "application.playlistCheckItemsCount":
            return playlistCheckItemsCount;
        case "application.playlistCountThreshold":
            return playlistCountThreshold;
        case "application.mergeParts":
            return application.mergeParts;
        case "application.customYtdlpArgs":
            return application.customYtdlpArgs;
        case "application.formatScope":
            return application.formatScope ?? FormatScope.Global;
        case "options":
            return options;
        default:
            return overrides.additional?.[key];
        }
    });

    storeConfig = {application, options};
};

const createDataState = (overrides: Record<string, unknown> = {}): DataState => ({
    errors: [],
    warnings: [],
    operation: undefined,
    playlists: [],
    tracks: [],
    trackStatus: [],
    trackCuts: {},
    formats: {global: {type: MediaFormat.Audio, extension: VideoType.Mp4}},
    autoDownload: false,
    queue: [],
    urls: [],
    setOperation: jest.fn(),
    setPlaylists: jest.fn(),
    setTracks: jest.fn(),
    setTrackStatus: jest.fn(),
    setAutoDownload: jest.fn(),
    setQueue: jest.fn(),
    setErrors: jest.fn(),
    setWarnings: jest.fn(),
    clear: jest.fn(),
    setActiveTab: jest.fn(),
    setTrackCuts: jest.fn(),
    setFormats: jest.fn(),
    setUrls: jest.fn(),
    ...overrides,
});

const getInputPanelHandlers = (): InputPanelHandlers => {
    const props = inputPanelMock.mock.calls.at(-1)?.[0];
    if (!props) {
        throw new Error("InputPanel props have not been captured");
    }

    return props as InputPanelHandlers;
};

const getIpcHandler = (message: Messages) => {
    return (ipcRenderer.on as jest.Mock).mock.calls.find(([msg]) => msg === message)?.[1];
};

beforeAll(() => {
    (global as any).logger = {
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    };
});

beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(stubbedProps).forEach((key) => delete stubbedProps[key]);
    (ytdlpWrapMock as any).exec.mockImplementation(() => ({
        on: jest.fn().mockReturnThis(),
    }));
    (ytdlpWrapMock as any).execPromise.mockImplementation(() => Promise.resolve(""));
    configureStore();
    useDataStateMock.mockReturnValue(createDataState() as any);
});

describe("HomeView", () => {
    const ipcRendererSendMock = ipcRenderer.send as jest.Mock;
    const ipcRendererOnMock = ipcRenderer.on as jest.Mock;
    const ipcRendererOffMock = ipcRenderer.off as jest.Mock;

    test("registers and cleans up IPC listeners", async () => {
        const unsubscribe = jest.fn();
        storeOnDidAnyChangeMock.mockReturnValue(unsubscribe);

        const shell = await render(<HomeView />);

        const listenedMessages = [
            Messages.GetYoutubeUrlsCompleted,
            Messages.GetYoutubeArtistsCompleted,
            Messages.GetYoutubeAlbumsCompleted,
            Messages.GetYoutubeTracksCompleted,
            Messages.GetYoutubeUrlsCanceled,
            Messages.GetYoutubeArtistsCanceled,
            Messages.GetYoutubeAlbumsCanceled,
            Messages.GetYoutubeTracksCanceled,
            Messages.GetYoutubeArtistsPause,
        ];

        for (const message of listenedMessages) {
            expect(ipcRendererOnMock).toHaveBeenCalledWith(message, expect.any(Function));
        }

        await act(async () => {
            shell.unmount();
        });

        expect(unsubscribe).toHaveBeenCalledTimes(1);

        for (const message of listenedMessages) {
            expect(ipcRendererOffMock).toHaveBeenCalledWith(message, expect.any(Function));
        }
    });

    test("persists urls when InputPanel value changes", async () => {
        await render(<HomeView />);

        const handlers = getInputPanelHandlers();
        const urls = ["https://youtube.com/watch?v=abc"];

        handlers.onChange(urls);

        expect(storeSetMock).toHaveBeenCalledWith("application.urls", urls);
    });

    test("requests artist info when load info is triggered in artist mode", async () => {
        configureStore({inputMode: InputMode.Artists});
        await render(<HomeView />);

        const handlers = getInputPanelHandlers();
        const urls = ["https://music.youtube.com/channel/artist"];

        ipcRendererSendMock.mockClear();
        handlers.onLoadInfo(urls, "1990", "2020");

        expect(ipcRenderer.send).toHaveBeenCalledWith(
            Messages.GetYoutubeArtists,
            {
                values: urls,
                lang: expect.any(String),
                url: storeConfig.application.youtubeUrl,
                options: {
                    downloadAlbums: storeConfig.application.downloadAlbums,
                    downloadSinglesAndEps: storeConfig.application.downloadSinglesAndEps,
                    multiMatchAction: storeConfig.application.multiMatchAction,
                    fromYear: "1990",
                    untilYear: "2020",
                },
            },
            storeConfig.options,
        );
    });

    test("requests album info when load info is triggered in album mode", async () => {
        configureStore({inputMode: InputMode.Albums});
        await render(<HomeView />);

        const handlers = getInputPanelHandlers();
        const urls = ["https://youtube.com/playlist?list=123"];

        ipcRendererSendMock.mockClear();
        handlers.onLoadInfo(urls, "", "");

        expect(ipcRenderer.send).toHaveBeenCalledWith(
            Messages.GetYoutubeAlbums,
            {
                values: urls,
                lang: expect.any(String),
                url: storeConfig.application.youtubeUrl,
            },
            storeConfig.options,
        );
    });

    test("requests track info when load info is triggered in songs mode", async () => {
        configureStore({inputMode: InputMode.Songs});
        await render(<HomeView />);

        const handlers = getInputPanelHandlers();
        const urls = ["https://youtube.com/watch?v=track"];

        ipcRendererSendMock.mockClear();
        handlers.onLoadInfo(urls, "", "");

        expect(ipcRenderer.send).toHaveBeenCalledWith(
            Messages.GetYoutubeTracks,
            {
                values: urls,
                lang: expect.any(String),
                url: storeConfig.application.youtubeUrl,
            },
            storeConfig.options,
        );
    });

    test("sends cancel messages when cancel is requested", async () => {
        await render(<HomeView />);

        const handlers = getInputPanelHandlers();

        ipcRendererSendMock.mockClear();
        act(() => {
            handlers.onCancel();
        });
        
        expect(ipcRendererSendMock).toHaveBeenNthCalledWith(1, Messages.GetYoutubeUrlsCancel);
        expect(ipcRendererSendMock).toHaveBeenNthCalledWith(2, Messages.GetYoutubeArtistsCancel);
        expect(ipcRendererSendMock).toHaveBeenNthCalledWith(3, Messages.GetYoutubeAlbumsCancel);
        expect(ipcRendererSendMock).toHaveBeenNthCalledWith(4, Messages.GetYoutubeTracksCancel);
    });

    test("opens select artist modal and cancels when no selection", async () => {
        await render(<HomeView />);

        const pauseHandler = ipcRendererOnMock.mock.calls.find(([msg]) => msg === Messages.GetYoutubeArtistsPause)?.[1];
        expect(pauseHandler).toBeDefined();

        await act(async () => {
            pauseHandler?.({} as any, [{id: "artist-1"} as any]);
        });

        await waitFor(() => expect(stubbedProps["select-artist-modal"].open).toBe(true));

        ipcRendererSendMock.mockClear();
        act(() => stubbedProps["select-artist-modal"].onClose());

        expect(ipcRendererSendMock).toHaveBeenNthCalledWith(1, Messages.GetYoutubeUrlsCancel);
        expect(ipcRendererSendMock).toHaveBeenNthCalledWith(2, Messages.GetYoutubeArtistsCancel);
        expect(ipcRendererSendMock).toHaveBeenNthCalledWith(3, Messages.GetYoutubeAlbumsCancel);
        expect(ipcRendererSendMock).toHaveBeenNthCalledWith(4, Messages.GetYoutubeTracksCancel);
        await waitFor(() => expect(stubbedProps["select-artist-modal"].open).toBe(false));
    });

    test("resumes artist flow when selection provided", async () => {
        await render(<HomeView />);

        const pauseHandler = ipcRendererOnMock.mock.calls.find(([msg]) => msg === Messages.GetYoutubeArtistsPause)?.[1];
        await act(async () => {
            pauseHandler?.({} as any, [{id: "artist-1"} as any]);
        });

        ipcRendererSendMock.mockClear();
        const selected = {id: "artist-1", name: "Artist"} as any;
        act(() => stubbedProps["select-artist-modal"].onClose(selected));

        expect(ipcRendererSendMock).toHaveBeenCalledWith(Messages.GetYoutubeArtistsResume, selected);
        await waitFor(() => expect(stubbedProps["select-artist-modal"].open).toBe(false));
    });

    test("shows failures modal on errors and retries downloads", async () => {
        const setQueue = jest.fn();
        const setTrackStatus = jest.fn();

        useDataStateMock.mockReturnValue(createDataState({
            trackStatus: [{trackId: "t1", error: true}],
            urls: ["u1"],
            setQueue,
            setTrackStatus,
        }) as any);

        await render(<HomeView />);

        await waitFor(() => expect(stubbedProps["failures-modal"].open).toBe(true));

        act(() => stubbedProps["failures-modal"].onConfirm());

        expect(setQueue).toHaveBeenCalledWith(expect.any(Function));
        expect(setTrackStatus).toHaveBeenCalledWith(expect.any(Function));

        act(() => stubbedProps["failures-modal"].onCancel());
        await waitFor(() => expect(stubbedProps["failures-modal"].open).toBe(false));
    });

    test("loads media in debug mode and queues single load", async () => {
        configureStore({inputMode: InputMode.Auto, application: {debugMode: true}});
        const setQueue = jest.fn();
        const setTracks = jest.fn();
        const setPlaylists = jest.fn();

        useDataStateMock.mockReturnValue(createDataState({
            setQueue,
            setTracks,
            setPlaylists,
            formats: {global: {type: MediaFormat.Audio, extension: VideoType.Mp4}},
        }) as any);

        await render(<HomeView />);

        const handlers = getInputPanelHandlers();
        const urls = ["https://youtube.com/watch?v=abc", "https://youtube.com/playlist?list=xyz"];

        await act(async () => handlers.onLoadInfo(urls, "", ""));

        expect(setQueue).toHaveBeenCalledWith(expect.any(Function));
        const queueUpdater = setQueue.mock.calls[0][0];
        expect(queueUpdater([])).toEqual(["load-single"]);
    });

    test("handles youtube completed by adding playlists and clearing queue", async () => {
        configureStore({application: {debugMode: true}});
        const setQueue = jest.fn();
        const setPlaylists = jest.fn();
        const setTracks = jest.fn();

        useDataStateMock.mockReturnValue(createDataState({
            setQueue,
            setPlaylists,
            setTracks,
        }) as any);

        await render(<HomeView />);

        const completedHandler = getIpcHandler(Messages.GetYoutubeUrlsCompleted);

        await act(async () => {
            await completedHandler?.({} as any, {
                result: {
                    errors: [{title: "oops", description: "bad"}],
                    values: ["url-1"],
                    sources: ["url-1"],
                },
            } as any);
        });

        expect(setPlaylists).toHaveBeenCalledWith(expect.any(Function));

        const queueUpdater = setQueue.mock.calls.at(-1)?.[0];
        expect(queueUpdater?.(["load-multi"])).toEqual([]);
    });

    test("handles youtube cancellation by filtering playlists and queue", async () => {
        const setQueue = jest.fn();
        const setPlaylists = jest.fn();

        useDataStateMock.mockReturnValue(createDataState({
            setQueue,
            setPlaylists,
            playlists: [
                {url: "u1", album: {}},
                {url: "u2", album: {id: "a1"}},
            ],
            queue: ["load-multi", "t1"],
        }) as any);

        await render(<HomeView />);

        const cancelHandler = getIpcHandler(Messages.GetYoutubeUrlsCanceled);
        cancelHandler?.({} as any);

        const playlistsUpdater = setPlaylists.mock.calls.at(-1)?.[0];
        expect(playlistsUpdater?.(useDataStateMock.mock.results[0].value.playlists)).toEqual([{url: "u2", album: {id: "a1"}}]);

        const queueUpdater = setQueue.mock.calls.at(-1)?.[0];
        expect(queueUpdater?.(["load-multi", "t1"])).toEqual(["t1"]);
    });

    test("loads discography info for artist urls", async () => {
        const setQueue = jest.fn();
        configureStore({inputMode: InputMode.Auto});
        useDataStateMock.mockReturnValue(createDataState({setQueue}) as any);

        await render(<HomeView />);

        const handlers = getInputPanelHandlers();
        const urls = ["https://music.youtube.com/channel/artist"];

        ipcRendererSendMock.mockClear();
        handlers.onLoadInfo(urls, "", "");

        expect(setQueue).toHaveBeenCalledWith(expect.any(Function));
        expect(ipcRendererSendMock).toHaveBeenCalledWith(
            Messages.GetYoutubeUrls,
            {
                values: urls,
                lang: expect.any(String),
                url: storeConfig.application.youtubeUrl,
            },
            storeConfig.options,
        );
    });

    test("updates tracks and warnings from yt-dlp results", async () => {
        const setTracks = jest.fn();
        const setPlaylists = jest.fn();
        const setWarnings = jest.fn();

        configureStore({inputMode: InputMode.Auto, application: {debugMode: false}});
        (ytdlpWrapMock as any).execPromise.mockResolvedValueOnce(
            "{\"id\":\"t1\",\"duration\":120,\"original_url\":\"url1\"}\n{\"id\":\"t2\",\"duration\":0,\"original_url\":\"url2\"}",
        );

        useDataStateMock.mockReturnValue(createDataState({
            setTracks,
            setPlaylists,
            setWarnings,
            formats: {global: {type: MediaFormat.Audio, extension: VideoType.Mp4}},
        }) as any);

        await render(<HomeView />);

        const handlers = getInputPanelHandlers();
        const urls = ["https://youtube.com/watch?v=abc"];

        await act(async () => handlers.onLoadInfo(urls, "", ""));

        await waitFor(() => expect(setTracks).toHaveBeenCalled());

        const tracksUpdater = setTracks.mock.calls.at(-1)?.[0];
        expect(tracksUpdater?.([])).toEqual([
            expect.objectContaining({id: "t1", duration: 120, original_url: "url1"}),
        ]);

        const warningsUpdater = setWarnings.mock.calls.at(-1)?.[0];
        expect(warningsUpdater?.([])).toEqual([
            expect.objectContaining({url: urls[0], message: expect.any(String)}),
        ]);

        const playlistUpdater = setPlaylists.mock.calls.find(([arg]) => typeof arg === "function")?.[0];
        const updatedPlaylists = playlistUpdater?.([{url: urls[0], album: {}, tracks: []}]);
        expect(updatedPlaylists?.[0].tracks).toEqual(tracksUpdater([]));
    });

    test("requests flat playlist when validation prefers flattened playlist", async () => {
        const setTracks = jest.fn();
        const setPlaylists = jest.fn();

        configureStore({
            inputMode: InputMode.Auto,
            playlistCheckItemsCount: 1,
            playlistCountThreshold: 2,
        });

        (ytdlpWrapMock as any).execPromise.mockImplementation((args: string[]) => {
            if (args.includes("--playlist-items")) {
                return Promise.resolve("{\"id\":\"p1\",\"duration\":120,\"playlist_count\":3}");
            }

            return Promise.resolve("{\"id\":\"track1\",\"duration\":321,\"original_url\":\"url1\"}");
        });

        useDataStateMock.mockReturnValue(createDataState({
            setTracks,
            setPlaylists,
            formats: {global: {type: MediaFormat.Audio, extension: VideoType.Mp4}},
        }) as any);

        await render(<HomeView />);

        const handlers = getInputPanelHandlers();
        const urls = ["https://youtube.com/playlist?list=abc"];

        await act(async () => handlers.onLoadInfo(urls, "", ""));

        await waitFor(() => expect(setTracks).toHaveBeenCalled());

        const validationArgs = (ytdlpWrapMock as any).execPromise.mock.calls[0][0];
        expect(validationArgs).toEqual(expect.arrayContaining(["--flat-playlist", "--playlist-items", "1"]));

        const downloadArgs = (ytdlpWrapMock as any).execPromise.mock.calls[1][0];
        expect(downloadArgs).toEqual(expect.arrayContaining(["--flat-playlist"]));
    });

    test("marks error when albums are incomplete during download", async () => {
        const playlistWithMissingInfo = {
            url: "u1",
            album: {title: "Album", releaseYear: undefined},
            tracks: [],
        } as any;

        useDataStateMock.mockReturnValue(createDataState({
            playlists: [playlistWithMissingInfo],
        }) as any);

        const shell = await render(<HomeView />);
        const handlers = getInputPanelHandlers();

        await act(async () => handlers.onDownload([playlistWithMissingInfo.url]));

        expect(shell.getByText("missingMediaInfoError")).toBeInTheDocument();
    });

    test("downloadAll effect queues all tracks and resets auto download", async () => {
        const setQueue = jest.fn();
        const setOperation = jest.fn();
        const setAutoDownload = jest.fn();
        const setTrackStatus = jest.fn();

        useDataStateMock.mockReturnValue(createDataState({
            autoDownload: true,
            playlists: [{url: "p1", album: {id: "a1"}} as any],
            tracks: [{id: "t1"}, {id: "t2"}] as any,
            formats: {global: {type: MediaFormat.Audio, extension: VideoType.Mp4}},
            setQueue,
            setOperation,
            setAutoDownload,
            setTrackStatus,
        }) as any);

        await render(<HomeView />);

        expect(setTrackStatus).toHaveBeenCalledWith([]);
        expect(setAutoDownload).toHaveBeenCalledWith(false);
        const queueUpdater = setQueue.mock.calls.at(-1)?.[0];
        expect(queueUpdater?.([])).toEqual(["t1", "t2"]);
        expect(setOperation).toHaveBeenCalledWith("download");
    });

    test("downloads album and queues its tracks", async () => {
        const setTrackStatus = jest.fn();
        const setQueue = jest.fn();
        const setOperation = jest.fn();
        const playlists = [{
            url: "p1",
            album: {id: "album-1"},
            tracks: [{id: "t1"}],
        }];

        useDataStateMock.mockReturnValue(createDataState({
            playlists,
            setTrackStatus,
            setQueue,
            setOperation,
        }) as any);

        await render(<HomeView />);

        act(() => stubbedProps["playlist-tabs"].onDownloadPlaylist("album-1"));

        expect(setTrackStatus).toHaveBeenCalledWith(expect.any(Function));
        const queueUpdater = setQueue.mock.calls.at(-1)?.[0];
        expect(queueUpdater?.([])).toEqual(["t1"]);
        expect(setOperation).toHaveBeenCalledWith("download");
    });

    test("downloads track and processes progress, merge and convert flow", async () => {
        (fs as any).writeFileSync = jest.fn();
        (fs as any).statSync = jest.fn(() => ({size: 111}));
        (fs as any).existsSync = jest.fn(() => false);
        (fs as any).removeSync = jest.fn();

        const setTrackStatus = jest.fn();
        const setQueue = jest.fn();
        const setErrors = jest.fn();

        configureStore({application: {formatScope: FormatScope.Tab}});

        const playlists = [{
            url: "p1",
            album: {id: "album-1", url: "p1"},
            tracks: [{id: "t1", original_url: "url1", filesize_approx: 0}],
        }];

        useDataStateMock.mockReturnValue(createDataState({
            playlists,
            tracks: playlists[0].tracks,
            trackCuts: {t1: [[0, 1], [2, 3]]},
            formats: {global: {type: MediaFormat.Video, extension: VideoType.Mov}, p1: {type: MediaFormat.Video, extension: VideoType.Mov}},
            setTrackStatus,
            setQueue,
            setErrors,
        }) as any);

        let capturedHandlers: Record<string, Function> = {};
        (ytdlpWrapMock as any).exec.mockImplementation(() => {
            capturedHandlers = {};
            const api = {
                on: (event: string, cb: Function) => {
                    capturedHandlers[event] = cb;
                    return api;
                },
            };
            return api;
        });

        await render(<HomeView />);

        act(() => stubbedProps["playlist-tabs"].onDownloadTrack("t1"));

        expect(setTrackStatus).toHaveBeenCalled();
        expect(setQueue).toHaveBeenCalledWith(expect.any(Function));

        await waitFor(() => expect(capturedHandlers.close).toBeDefined());

        capturedHandlers.progress?.({percent: 50});
        capturedHandlers.ytDlpEvent?.("info");

        await act(async () => {
            capturedHandlers.close?.();
        });

        await waitFor(() => expect(YtdplUtils.mergeOutputFiles).toHaveBeenCalled());
        await waitFor(() => expect(YtdplUtils.convertOutputToFormat).toHaveBeenCalled());
    });

    test("updates progress status across yt-dlp events", async () => {
        (fs as any).existsSync = jest.fn(() => false);

        const setTrackStatus = jest.fn();
        const playlists = [{
            url: "p1",
            album: {id: "album-1", url: "p1"},
            tracks: [{id: "t1", original_url: "url1", filesize_approx: 0} as any],
        }];

        useDataStateMock.mockReturnValue(createDataState({
            playlists,
            tracks: playlists[0].tracks,
            trackCuts: {},
            formats: {global: {type: MediaFormat.Audio, extension: VideoType.Mp4}},
            setTrackStatus,
        }) as any);

        let capturedHandlers: Record<string, Function> = {};
        (ytdlpWrapMock as any).exec.mockImplementation(() => {
            capturedHandlers = {};
            const api = {
                on: (event: string, cb: Function) => {
                    capturedHandlers[event] = cb;
                    return api;
                },
            };
            return api;
        });

        await render(<HomeView />);

        act(() => stubbedProps["playlist-tabs"].onDownloadTrack("t1"));

        const reduceCalls = (startIndex: number, initial: any[]) => {
            const fns = setTrackStatus.mock.calls.slice(startIndex).map(([fn]) => fn);

            return fns.reduce((state, fn) => fn(state), initial);
        };

        let state: any[] = [];
        state = reduceCalls(0, state); // add initial track status

        await waitFor(() => expect(capturedHandlers.ytDlpEvent).toBeDefined());

        const expectEvent = (eventType: string, expected: {percent?: number; status?: string}) => {
            const start = setTrackStatus.mock.calls.length;
            capturedHandlers.ytDlpEvent?.(eventType);
            state = reduceCalls(start, state);

            if (expected.percent !== undefined) {
                expect(state[0].percent).toBe(expected.percent);
            }
            if (expected.status !== undefined) {
                expect(state[0].status).toBe(expected.status);
            }
        };

        expectEvent("youtube", {percent: 5, status: "reading"});
        expectEvent("info", {percent: 10, status: "startingDownload"});
        expectEvent("download", {status: "downloading"});
        expectEvent("ExtractAudio", {percent: 90, status: "extractingAudio"});
        expectEvent("Merger", {percent: 85, status: "merging"});
        expectEvent("convertingThumbnail", {percent: 90});
        expectEvent("embeddingThumbnail", {percent: 95});
        expectEvent("other-event", {});
    });

    test("merges file parts when parts exceed one", async () => {
        (fs as any).writeFileSync = jest.fn();
        (fs as any).statSync = jest.fn(() => ({size: 222}));
        (fs as any).existsSync = jest.fn(() => false);
        (fs as any).removeSync = jest.fn();

        configureStore({application: {mergeParts: true}});

        const setTrackStatus = jest.fn();
        const setQueue = jest.fn();
        const playlists = [{
            url: "p1",
            album: {id: "album-1", url: "p1"},
            tracks: [{id: "t1", original_url: "url1", filesize_approx: 0} as any],
        }];

        useDataStateMock.mockReturnValue(createDataState({
            playlists,
            tracks: playlists[0].tracks,
            trackCuts: {t1: [[0, 1], [2, 3]]},
            formats: {global: {type: MediaFormat.Video, extension: VideoType.Mp4}},
            setTrackStatus,
            setQueue,
        }) as any);

        let capturedHandlers: Record<string, Function> = {};
        (ytdlpWrapMock as any).exec.mockImplementation(() => {
            capturedHandlers = {};
            const api = {
                on: (event: string, cb: Function) => {
                    capturedHandlers[event] = cb;
                    return api;
                },
            };
            return api;
        });

        await render(<HomeView />);

        act(() => stubbedProps["playlist-tabs"].onDownloadTrack("t1"));

        await waitFor(() => expect(capturedHandlers.close).toBeDefined());

        await act(async () => {
            capturedHandlers.close?.();
        });

        await waitFor(() => expect(YtdplUtils.mergeOutputFiles).toHaveBeenCalled());

        const lastStatusUpdater = setTrackStatus.mock.calls.at(-1)?.[0];
        const updatedState = lastStatusUpdater?.([{trackId: "t1", percent: 85, totalSize: 0}]);
        expect(updatedState?.[0].percent).toBeGreaterThanOrEqual(90);
    });

    test("cancels track and records skipped status when not started", async () => {
        const setTrackStatus = jest.fn();
        const setQueue = jest.fn();

        useDataStateMock.mockReturnValue(createDataState({
            playlists: [{url: "p1", album: {id: "a1"}, tracks: [{id: "t2"}]}],
            queue: ["t2", "t3"],
            setTrackStatus,
            setQueue,
        }) as any);

        await render(<HomeView />);

        act(() => stubbedProps["playlist-tabs"].onCancelTrack("t2"));

        const queueUpdater = setQueue.mock.calls.at(-1)?.[0];
        expect(queueUpdater?.(["t2", "t3"])).toEqual(["t3"]);

        const statusUpdater = setTrackStatus.mock.calls.find(([arg]) => typeof arg === "function")?.[0];
        const updatedStatus = statusUpdater?.([]);
        expect(updatedStatus).toContainEqual(expect.objectContaining({trackId: "t2", skipped: true, totalSize: 0}));
    });

    test("cancels playlist and tracks", async () => {
        const setTrackStatus = jest.fn();
        const setQueue = jest.fn();

        useDataStateMock.mockReturnValue(createDataState({
            playlists: [{url: "p1", album: {id: "a1"}, tracks: [{id: "t1"}, {id: "t2"}]}],
            queue: ["t1", "t2"],
            setTrackStatus,
            setQueue,
        }) as any);

        await render(<HomeView />);

        act(() => stubbedProps["playlist-tabs"].onCancelPlaylist("p1"));
        expect(setTrackStatus).toHaveBeenCalled();
        expect(setQueue).toHaveBeenCalledWith(expect.any(Function));

        act(() => stubbedProps["playlist-tabs"].onCancelTrack("t2"));
        expect(setQueue).toHaveBeenCalled();
    });
});
