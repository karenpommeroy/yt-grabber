import {ipcRenderer} from "electron";

import {fireEvent} from "@testing-library/react";
import {renderModal} from "@tests/TestRenderer";

import {YoutubeArtist} from "../../../common/Youtube";
import {Messages} from "../../../messaging/Messages";
import SelectArtistModal, {SelectArtistModalProps} from "./SelectArtistModal";

describe("SelectArtistModal", () => {
    const artists: YoutubeArtist[] = [
        {name: "Artist One", thumbnail: "thumb1.jpg", url: "https://youtube.com/artist1"},
        {name: "Artist Two", thumbnail: "thumb2.jpg", url: "https://youtube.com/artist2"},
    ];

    const baseProps: SelectArtistModalProps = {
        id: "select-artist-modal",
        open: true,
        artists,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders artist names in the list", async () => {
        const shell = await renderModal<SelectArtistModalProps>(SelectArtistModal, baseProps);

        expect(shell.getByText("selectArtist")).toBeInTheDocument();
        artists.forEach((artist) => {
            expect(shell.getByText(artist.name)).toBeInTheDocument();
        });
    });

    test("invokes onClose with selected artist when list item is clicked", async () => {
        const handleClose = jest.fn();
        const shell = await renderModal<SelectArtistModalProps>(SelectArtistModal, {...baseProps, onClose: handleClose});

        const listItems = shell.getAllByRole("listitem");
        fireEvent.click(listItems[1]);

        expect(handleClose).toHaveBeenCalledWith(artists[1]);
    });

    test("opens artist url in browser when action button is clicked", async () => {
        const handleClose = jest.fn();
        const shell = await renderModal<SelectArtistModalProps>(SelectArtistModal, {...baseProps, onClose: handleClose});

        const actionButton = shell.getAllByRole("button").find((btn) => btn.getAttribute("data-id") === "0") as HTMLButtonElement;
        expect(actionButton).toBeTruthy();
        fireEvent.click(actionButton);

        expect(ipcRenderer.send).toHaveBeenCalledWith(Messages.OpenUrlInBrowser, {url: artists[0].url});
        expect(handleClose).not.toHaveBeenCalled();
    });

    test("invokes onClose with no argument when cancel button is clicked", async () => {
        const handleClose = jest.fn();
        const shell = await renderModal<SelectArtistModalProps>(SelectArtistModal, {...baseProps, onClose: handleClose});

        const cancelButton = shell.getByTestId("cancel-button");
        fireEvent.click(cancelButton);

        expect(handleClose).toHaveBeenCalledWith();
    });
});
