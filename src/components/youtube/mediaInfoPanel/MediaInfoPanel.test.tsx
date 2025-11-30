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
});
