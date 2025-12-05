import "moment-duration-format";

import {ipcRenderer} from "electron";

import {fireEvent} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {
    createAlbumInfo, createPlaylistInfo, createTrackInfo, setupDataState
} from "../../../common/TestHelpers";
import {Messages} from "../../../messaging/Messages";
import MediaInfoPanel from "./MediaInfoPanel";

jest.mock("../../../react/contexts/DataContext", () => require("@tests/mocks/react/contexts/DataContext"));
jest.mock("../../modals/detailsModal/DetailsModal", () => {
    return (props: any) => {
        (global as any).__detailsModalProps = props;
        return (
            <button
                data-help="mock-details-modal"
                data-testid="mock-details-modal"
                onClick={() => props.onClose({artist: "New Artist", title: "New Title", releaseYear: 2024})}
            >
                details
            </button>
        );
    };
});

jest.mock("../../modals/imageModal/ImageModal", () => {
    return (props: any) => {
        (global as any).__imageModalProps = props;
        return (
            <button
                data-help="mock-image-modal"
                data-testid="mock-image-modal"
                onClick={() => props.onClose()}
            >
                image
            </button>
        );
    };
});

jest.mock("../../modals/cutModal/CutModal", () => {
    return (props: any) => {
        (global as any).__cutModalProps = props;
        return (
            <button
                data-help="mock-cut-modal"
                data-testid="mock-cut-modal"
                onClick={() => props.onClose([{id: "cut-1", title: "Cut Track", startTime: 0, endTime: 10}])}
            >
                cut
            </button>
        );
    };
});

const baseAlbum = createAlbumInfo();
const basePlaylist = createPlaylistInfo({
    url: "album-1",
    album: baseAlbum,
    tracks: [createTrackInfo({id: "track-1", title: "Track", duration: 300})],
});

describe("MediaInfoPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders album info and opens url in browser", async () => {
        setupDataState();

        const shell = await render(<MediaInfoPanel item={baseAlbum} playlist={basePlaylist} />);
        expect(shell.getByText(baseAlbum.title)).toBeInTheDocument();
        expect(shell.getByText(baseAlbum.artist)).toBeInTheDocument();

        const openButton = shell.container.querySelector("[data-help=\"openInBrowser\"]") as HTMLButtonElement;
        fireEvent.click(openButton);

        expect(ipcRenderer.send).toHaveBeenCalledWith(Messages.OpenUrlInBrowser, {url: baseAlbum.url});
    });

    test("triggers download handler when download button clicked", async () => {
        setupDataState();
        const onDownload = jest.fn();

        const shell = await render(
            <MediaInfoPanel
                item={baseAlbum}
                playlist={basePlaylist}
                onDownload={onDownload}
            />
        );

        const downloadButton = shell.container.querySelector("[data-help=\"downloadPlaylist\"]") as HTMLButtonElement;
        expect(downloadButton).not.toBeDisabled();

        fireEvent.click(downloadButton);

        expect(onDownload).toHaveBeenCalledWith(baseAlbum.id);
    });

    test("shows cancel controls while loading", async () => {
        setupDataState();
        const onCancel = jest.fn();

        const shell = await render(
            <MediaInfoPanel
                item={baseAlbum}
                playlist={basePlaylist}
                loading
                progress={65}
                onCancel={onCancel}
            />
        );

        const cancelButton = shell.getByRole("button", {name: "cancel"});
        fireEvent.click(cancelButton);

        expect(onCancel).toHaveBeenCalled();
        expect(shell.getAllByRole("progressbar")).not.toHaveLength(0);
    });

    test("shows open output action when a track is completed", async () => {
        setupDataState({
            trackStatus: [
                {
                    trackId: "track-1",
                    percent: 100,
                    totalSize: 100,
                    completed: true,
                },
            ],
        });
        const onOpenOutput = jest.fn();

        const shell = await render(
            <MediaInfoPanel
                item={baseAlbum}
                playlist={basePlaylist}
                onOpenOutput={onOpenOutput}
            />
        );

        const openOutputButton = shell.container.querySelector("[data-help=\"openOutputDirectory\"]") as HTMLButtonElement;
        fireEvent.click(openOutputButton);

        expect(onOpenOutput).toHaveBeenCalled();
    });

    test("hides open output action when nothing completed", async () => {
        setupDataState({trackStatus: []});

        const shell = await render(
            <MediaInfoPanel
                item={baseAlbum}
                playlist={basePlaylist}
            />
        );

        expect(shell.container.querySelector("[data-help=\"openOutputDirectory\"]")).toBeNull();
    });

    test("disables download button when queue busy", async () => {
        setupDataState({queue: ["load-single"]});
        const onDownload = jest.fn();

        const shell = await render(
            <MediaInfoPanel
                item={baseAlbum}
                playlist={basePlaylist}
                onDownload={onDownload}
            />
        );

        const downloadButton = shell.container.querySelector("[data-help=\"downloadPlaylist\"]") as HTMLButtonElement;
        expect(downloadButton).toBeDisabled();
    });

    test("opens and saves details modal", async () => {
        const state = setupDataState();
        const shell = await render(
            <MediaInfoPanel
                item={baseAlbum}
                playlist={basePlaylist}
            />
        );

        const editButton = shell.container.querySelector("[data-help=\"editInfo\"]") as HTMLButtonElement;
        fireEvent.click(editButton);

        const modalProps = (global as any).__detailsModalProps;
        expect(modalProps.open).toBe(true);

        fireEvent.click(shell.getByTestId("mock-details-modal"));

        expect((global as any).__detailsModalProps.open).toBe(false);
        expect(state.setPlaylists).not.toHaveBeenCalled();
    });

    test("opens and closes image modal", async () => {
        setupDataState();
        const shell = await render(
            <MediaInfoPanel
                item={baseAlbum}
                playlist={basePlaylist}
            />
        );

        const imageButton = shell.getByRole("img", {name: baseAlbum.title});
        fireEvent.click(imageButton);

        expect((global as any).__imageModalProps.open).toBe(true);
        fireEvent.click(shell.getByTestId("mock-image-modal"));
        expect((global as any).__imageModalProps.open).toBe(false);
    });

    test("cuts track and updates playlists and track cuts", async () => {
        const state = setupDataState({playlists: [basePlaylist], trackCuts: {}} as any);

        const shell = await render(
            <MediaInfoPanel
                item={baseAlbum}
                playlist={basePlaylist}
            />
        );

        const cutButton = shell.container.querySelector("[data-help=\"cutTrack\"]") as HTMLButtonElement;
        fireEvent.click(cutButton);

        const modalProps = (global as any).__cutModalProps;
        expect(modalProps.open).toBe(true);

        fireEvent.click(shell.getByTestId("mock-cut-modal"));

        expect(state.setPlaylists).toHaveBeenCalled();
        const updater = state.setPlaylists.mock.calls[0][0];
        const updatedPlaylists = updater([basePlaylist]);
        expect(updatedPlaylists[0].tracks[0].id).toBe("cut-1");
        expect(updatedPlaylists[0].album.tracksNumber).toBe(1);

        expect(state.setTrackCuts).toHaveBeenCalled();
        const cutsUpdater = state.setTrackCuts.mock.calls[0][0];
        const cuts = cutsUpdater({});
        expect(cuts["cut-1"]).toEqual([[0, 10]]);
    });
});
