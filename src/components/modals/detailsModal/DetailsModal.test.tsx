import {fireEvent, waitFor} from "@testing-library/react";
import {renderModal} from "@tests/TestRenderer";

import DetailsModal, {DetailsModalProps} from "./DetailsModal";

describe("DetailsModal", () => {
    const baseProps: DetailsModalProps = {
        id: "details-modal",
        open: true,
        details: {
            artist: "Artist",
            albumTitle: "Album Title",
            releaseYear: 2020,
        }
    };

    test("renders inputs for each detail key", async () => {
        const shell = await renderModal<DetailsModalProps>(DetailsModal, baseProps);

        expect(shell.getByText("detailsModalTitle")).toBeInTheDocument();

        Object.entries(baseProps.details).forEach(([key, value]) => {
            const input = shell.getByLabelText(key) as HTMLInputElement;
            expect(input.value).toBe(String(value));
        });
    });

    test("invokes onClose with updated values when confirm button is clicked", async () => {
        const handleClose = jest.fn();
        const shell = await renderModal<DetailsModalProps>(DetailsModal, {...baseProps, onClose: handleClose});

        const artistInput = shell.getByLabelText("artist") as HTMLInputElement;
        fireEvent.change(artistInput, {target: {value: "New Artist"}});

        const confirmButton = shell.getByText("ok").closest("button") as HTMLButtonElement;
        fireEvent.click(confirmButton);

        await waitFor(() => expect(handleClose).toHaveBeenCalledTimes(1));
        expect(handleClose).toHaveBeenCalledWith(expect.objectContaining({
            ...baseProps.details,
            artist: "New Artist",
        }));
    });

    test("submits details when Enter key is pressed", async () => {
        const handleClose = jest.fn();
        const shell = await renderModal<DetailsModalProps>(DetailsModal, {...baseProps, onClose: handleClose});

        const dialog = shell.container.querySelector("[role=\"dialog\"]") as HTMLElement;
        expect(dialog).not.toBeNull();
        fireEvent.keyUp(dialog, {key: "Enter"});

        await waitFor(() => expect(handleClose).toHaveBeenCalledWith(expect.objectContaining(baseProps.details)));
    });
});
