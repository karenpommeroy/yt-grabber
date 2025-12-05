import {ipcRenderer} from "electron";
import React from "react";

import {act} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {FormatScope, InputMode, MediaFormat, VideoType} from "../../common/Media";
import {createApplicationOptions} from "../../common/TestHelpers";
import {Messages} from "../../messaging/Messages";
import {DataState, useDataState} from "../../react/contexts/DataContext";
import HomeView from "./HomeView";

jest.mock("fs-extra", () => require("@tests/mocks/fs-extra"));
jest.mock("yt-dlp-wrap", () => require("@tests/mocks/yt-dlp-wrap"));
jest.mock("../../common/Logger", () => require("@tests/mocks/common/Logger"));
jest.mock("../../react/contexts/AppContext", () => require("@tests/mocks/react/contexts/AppContext"));
jest.mock("../../react/contexts/DataContext", () => require("@tests/mocks/react/contexts/DataContext"));

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

function stubComponent(testId: string) {
    const React = require("react");

    return () => ({
        __esModule: true,
        default: () => <div data-testid={testId} />,
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

beforeAll(() => {
    (global as any).logger = {
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    };
});

beforeEach(() => {
    jest.clearAllMocks();
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
});
