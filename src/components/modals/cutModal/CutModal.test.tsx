import {fireEvent} from "@testing-library/react";
import {renderModal} from "@tests/TestRenderer";

import CutModal, {CutModalProps} from "./CutModal";

describe("CutModal", () => {
    const baseProps: CutModalProps = {
        id: "cut-modal",
        open: true,
        duration: 300,
    };

    test("renders initial entry with default times", async () => {
        const shell = await renderModal(CutModal, baseProps);

        const fromInput = shell.getByLabelText("from") as HTMLInputElement;
        const toInput = shell.getByLabelText("to") as HTMLInputElement;

        expect(fromInput.value).toBe("00:00");
        expect(toInput.value).toBe("05:00");
    });

    test("adds a new entry and updates title", async () => {
        const shell = await renderModal(CutModal, baseProps);

        const addButton = shell.getByText("add").closest("button") as HTMLButtonElement;
        fireEvent.click(addButton);

        const titleInputs = shell.getAllByLabelText("title") as HTMLInputElement[];
        expect(titleInputs).toHaveLength(2);

        fireEvent.change(titleInputs[1], {target: {value: "Outro"}});
        expect(titleInputs[1].value).toBe("Outro");
    });

    test("deletes an entry when delete icon is clicked", async () => {
        const shell = await renderModal(CutModal, baseProps);
        const addButton = shell.getByText("add").closest("button") as HTMLButtonElement;
        fireEvent.click(addButton);

        const deleteButtons = shell.container.querySelectorAll("button[data-id]");
        expect(deleteButtons).toHaveLength(2);

        fireEvent.click(deleteButtons[1]);

        expect(shell.getAllByLabelText("title")).toHaveLength(1);
    });

    test("calls onClose with current entries", async () => {
        const handleClose = jest.fn();
        const shell = await renderModal(CutModal, {...baseProps, onClose: handleClose});

        const titleInput = shell.getByLabelText("title") as HTMLInputElement;
        fireEvent.change(titleInput, {target: {value: "Intro"}});

        const okButton = shell.getByText("ok").closest("button") as HTMLButtonElement;
        fireEvent.click(okButton);

        expect(handleClose).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({title: "Intro"})]));
    });

    test("calls onCancel when dialog is closed", async () => {
        const handleCancel = jest.fn();
        const shell = await renderModal(CutModal, {...baseProps, onCancel: handleCancel});

        shell.unmount();

        expect(handleCancel).not.toHaveBeenCalled();
    });

    test("invokes onClose when Enter key is pressed", async () => {
        const handleClose = jest.fn();
        const shell = await renderModal<CutModalProps>(CutModal, {...baseProps, open: true, onClose: handleClose});

        fireEvent.keyUp(shell.getByRole("dialog"), {key: "Enter"});
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test("invokes onClose when Escape key is pressed", async () => {
        const handleCancel = jest.fn();
        const shell = await renderModal<CutModalProps>(CutModal, {...baseProps, open: true, onCancel: handleCancel});

        fireEvent.keyUp(shell.getByRole("dialog"), {key: "Escape"});
        expect(handleCancel).toHaveBeenCalledTimes(1);
    });
});
