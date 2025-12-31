import {ipcRenderer} from "electron";
import path from "path";

import {fireEvent, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {SortOrder, TabsOrderKey} from "../../../common/Media";
import {createPlaylistInfo} from "../../../common/TestHelpers";
import {TrackInfo} from "../../../common/Youtube";
import {Messages} from "../../../messaging/Messages";
import {useAppContext} from "../../../react/contexts/AppContext";
import {useDataState} from "../../../react/contexts/DataContext";
import PlaylistTabs from "./PlaylistTabs";

jest.mock("../../../react/contexts/AppContext", () => require("@tests/mocks/react/contexts/AppContext"));
jest.mock("../../../react/contexts/DataContext", () => require("@tests/mocks/react/contexts/DataContext"));

jest.mock("../mediaInfoPanel/MediaInfoPanel", () => (props: any) => (
    <div data-testid="media-info">
        <button data-testid="download-album" onClick={() => props.onDownload?.(props.playlist.album.id)}>download-album</button>
        <button data-testid="cancel-album" onClick={() => props.onCancel?.()}>cancel-album</button>
        <button data-testid="open-output" onClick={() => props.onOpenOutput?.()}>open-output</button>
    </div>
));

jest.mock("../trackList/TrackList", () => (props: any) => (
    <div data-testid="track-list">
        <button data-testid="download-track" onClick={() => props.onDownloadTrack?.("track-1")}>download-track</button>
        <button data-testid="cancel-track" onClick={() => props.onCancelTrack?.("track-1")}>cancel-track</button>
        <button data-testid="open-url" onClick={() => props.onOpenUrl?.("https://example.com")}>open-url</button>
        <button data-testid="open-file" onClick={() => props.onOpenFile?.("track-1")}>open-file</button>
    </div>
));

const useDataStateMock = useDataState as jest.Mock;
const useAppContextMock = useAppContext as jest.Mock;
const storeGetMock = (global as any).store.get as jest.Mock;

const basePlaylist = createPlaylistInfo({
    url: "playlist-1",
    album: {
        id: "album-1",
        title: "Album One",
        thumbnail: "thumb-1",
        url: "https://music.youtube.com/album-1",
        duration: 3600,
        tracksNumber: 1,
    },
    tracks: [
        {id: "track-1", title: "Track One"} as TrackInfo,
    ],
});

const secondPlaylist = createPlaylistInfo({
    url: "playlist-2",
    album: {
        id: "album-2",
        title: "Album Two",
        thumbnail: "thumb-2",
        url: "https://music.youtube.com/album-2",
        duration: 4200,
        tracksNumber: 1,
    },
    tracks: [
        {id: "track-2", title: "Track Two"} as TrackInfo,
    ],
});

const createDataState = (overrides: Record<string, any> = {}) => ({
    playlists: [basePlaylist, secondPlaylist],
    trackStatus: [] as any[],
    queue: [] as any[],
    activeTab: basePlaylist.url,
    setActiveTab: jest.fn(),
    setPlaylists: jest.fn(),
    setTrackStatus: jest.fn(),
    setTracks: jest.fn(),
    ...overrides,
});

describe("PlaylistTabs", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        storeGetMock.mockImplementation((key: string) => {
            if (key === "application.tabsOrder") {
                return [TabsOrderKey.Default, SortOrder.Asc];
            }

            return {language: "en-GB"};
        });
        useAppContextMock.mockReturnValue({state: {loading: false}});
    });

    test("renders null when there are no playlists", async () => {
        useDataStateMock.mockReturnValue(createDataState({playlists: [], activeTab: undefined}));

        const shell = await render(<PlaylistTabs queue={[]} />);

        expect(shell.queryByRole("tablist")).toBeNull();
    });

    test("sets the first playlist as active when none is selected", async () => {
        const dataState = createDataState({activeTab: undefined});
        useDataStateMock.mockReturnValue(dataState);

        await render(<PlaylistTabs queue={[]} />);

        await waitFor(() => expect(dataState.setActiveTab).toHaveBeenCalledWith(basePlaylist.url));
    });

    test("changes active tab when another tab is clicked", async () => {
        const dataState = createDataState();
        useDataStateMock.mockReturnValue(dataState);

        const shell = await render(<PlaylistTabs queue={[]} />);
        const secondTab = shell.getByText(secondPlaylist.album.title);

        fireEvent.click(secondTab.closest("button")!);

        expect(dataState.setActiveTab).toHaveBeenCalledWith(secondPlaylist.url);
    });

    test("removes playlist and its tracks when close icon is clicked", async () => {
        const dataState = createDataState({
            trackStatus: [
                {trackId: "track-1", percent: 100, completed: true},
            ],
        });
        useDataStateMock.mockReturnValue(dataState);

        const shell = await render(<PlaylistTabs queue={["track-1"]} />);
        const closeIcon = shell.getAllByTestId("CloseIcon")[0];

        fireEvent.click(closeIcon);

        expect(dataState.setActiveTab).toHaveBeenCalledWith(secondPlaylist.url);
        expect(dataState.setPlaylists).toHaveBeenCalledWith(expect.any(Function));
        expect(dataState.setTracks).toHaveBeenCalledWith(expect.any(Function));
        expect(dataState.setTrackStatus).toHaveBeenCalledWith(expect.any(Function));
    });

    test("middle-clicking a tab closes it and advances to next", async () => {
        const dataState = createDataState({
            trackStatus: [
                {trackId: "track-1", percent: 50},
                {trackId: "track-2", percent: 10},
            ],
        });
        useDataStateMock.mockReturnValue(dataState);

        const shell = await render(<PlaylistTabs queue={["track-1"]} />);

        const firstTabButton = shell.getByText(secondPlaylist.album.title).closest("button")!;

        fireEvent.mouseDown(firstTabButton, {button: 1});

        expect(dataState.setActiveTab).toHaveBeenCalledWith(secondPlaylist.url);
        expect(dataState.setPlaylists).toHaveBeenCalledWith(expect.any(Function));
        expect(dataState.setTracks).toHaveBeenCalledWith(expect.any(Function));
        expect(dataState.setTrackStatus).toHaveBeenCalledWith(expect.any(Function));
    });

    test("invokes download, cancel, and IPC actions", async () => {
        const onDownloadTrack = jest.fn();
        const onDownloadPlaylist = jest.fn();
        const onCancelPlaylist = jest.fn();
        const onCancelTrack = jest.fn();
        const dataState = createDataState({
            trackStatus: [
                {trackId: "track-1", path: "C:/music/track-1.mp3", completed: true, percent: 100},
            ],
        });
        useDataStateMock.mockReturnValue(dataState);

        const shell = await render(
            <PlaylistTabs
                queue={[]}
                onDownloadTrack={onDownloadTrack}
                onDownloadPlaylist={onDownloadPlaylist}
                onCancelPlaylist={onCancelPlaylist}
                onCancelTrack={onCancelTrack}
            />
        );

        fireEvent.click(shell.getByTestId("download-track"));
        fireEvent.click(shell.getByTestId("cancel-track"));
        fireEvent.click(shell.getByTestId("download-album"));
        fireEvent.click(shell.getByTestId("cancel-album"));
        fireEvent.click(shell.getByTestId("open-url"));
        fireEvent.click(shell.getByTestId("open-file"));
        fireEvent.click(shell.getByTestId("open-output"));

        expect(onDownloadTrack).toHaveBeenCalledWith("track-1");
        expect(onCancelTrack).toHaveBeenCalledWith("track-1");
        expect(onDownloadPlaylist).toHaveBeenCalledWith(basePlaylist.album.id);
        expect(onCancelPlaylist).toHaveBeenCalledWith(basePlaylist.url);
        expect(ipcRenderer.send).toHaveBeenCalledWith(Messages.OpenUrlInBrowser, {url: "https://example.com"});
        expect(ipcRenderer.send).toHaveBeenCalledWith(Messages.OpenSystemPath, {filepath: "C:/music/track-1.mp3"});
        expect(ipcRenderer.send).toHaveBeenCalledWith(Messages.OpenSystemPath, {dirpath: path.dirname("C:/music/track-1.mp3")});
    });

    test("handles OpenSystemPathCompleted IPC event", async () => {
        const dataState = createDataState();
        useDataStateMock.mockReturnValue(dataState);

        const capturedHandlers: Record<string, (...args: any[]) => any> = {};
        (ipcRenderer.on as jest.Mock).mockImplementation((channel: string, handler: (...args: any[]) => any) => {
            capturedHandlers[channel] = handler;
            return ipcRenderer;
        });

        await render(<PlaylistTabs queue={[]} />);

        expect(capturedHandlers[Messages.OpenSystemPathCompleted]).toBeDefined();

        const result = capturedHandlers[Messages.OpenSystemPathCompleted](
            {} as any,
            JSON.stringify({filepath: "/test/path/file.mp3"})
        );

        expect(result).toEqual({filepath: "/test/path/file.mp3"});
    });

    test("handles OpenUrlInBrowserCompleted IPC event", async () => {
        const dataState = createDataState();
        useDataStateMock.mockReturnValue(dataState);

        const capturedHandlers: Record<string, (...args: any[]) => any> = {};
        (ipcRenderer.on as jest.Mock).mockImplementation((channel: string, handler: (...args: any[]) => any) => {
            capturedHandlers[channel] = handler;
            return ipcRenderer;
        });

        await render(<PlaylistTabs queue={[]} />);

        expect(capturedHandlers[Messages.OpenUrlInBrowserCompleted]).toBeDefined();

        const result = capturedHandlers[Messages.OpenUrlInBrowserCompleted](
            {} as any,
            JSON.stringify({url: "https://opened.url"})
        );

        expect(result).toEqual({url: "https://opened.url"});
    });

    test("unregisters IPC handlers on unmount", async () => {
        const dataState = createDataState();
        useDataStateMock.mockReturnValue(dataState);

        const shell = await render(<PlaylistTabs queue={[]} />);

        shell.unmount();

        expect(ipcRenderer.off).toHaveBeenCalledWith(Messages.OpenSystemPathCompleted, expect.any(Function));
        expect(ipcRenderer.off).toHaveBeenCalledWith(Messages.OpenUrlInBrowserCompleted, expect.any(Function));
    });

    test("renders skeleton loading state for playlist with empty album", async () => {
        // Playlist with empty album object (loading state)
        const loadingPlaylist = {
            url: "loading-playlist",
            album: {} as any,
            tracks: [] as TrackInfo[],
        };
        const dataState = createDataState({
            playlists: [loadingPlaylist],
            activeTab: loadingPlaylist.url,
        });
        useDataStateMock.mockReturnValue(dataState);

        const shell = await render(<PlaylistTabs queue={[]} />);

        // Should render skeleton elements for loading playlist
        const skeletons = shell.container.querySelectorAll(".MuiSkeleton-root");
        expect(skeletons.length).toBeGreaterThan(0);
    });
});
