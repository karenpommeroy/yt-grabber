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

    test("updates start time when from input changes", async () => {
        const handleClose = jest.fn();
        const shell = await renderModal(CutModal, {...baseProps, onClose: handleClose});

        const fromInput = shell.getByLabelText("from") as HTMLInputElement;
        fireEvent.change(fromInput, {target: {value: "01:30"}});

        const okButton = shell.getByText("ok").closest("button") as HTMLButtonElement;
        const titleInput = shell.getByLabelText("title") as HTMLInputElement;
        fireEvent.change(titleInput, {target: {value: "Test"}});
        fireEvent.click(okButton);

        expect(handleClose).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({startTime: 90})])
        );
    });

    test("updates end time when to input changes", async () => {
        const handleClose = jest.fn();
        const shell = await renderModal(CutModal, {...baseProps, onClose: handleClose});

        const toInput = shell.getByLabelText("to") as HTMLInputElement;
        fireEvent.change(toInput, {target: {value: "02:00"}});

        const titleInput = shell.getByLabelText("title") as HTMLInputElement;
        fireEvent.change(titleInput, {target: {value: "Test"}});

        const okButton = shell.getByText("ok").closest("button") as HTMLButtonElement;
        fireEvent.click(okButton);

        expect(handleClose).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({endTime: 120})])
        );
    });

    test("updates start time only for matching entry when multiple entries exist", async () => {
        const handleClose = jest.fn();
        const shell = await renderModal(CutModal, {...baseProps, onClose: handleClose});

        const addButton = shell.getByText("add").closest("button") as HTMLButtonElement;
        fireEvent.click(addButton);

        const fromInputs = shell.getAllByLabelText("from") as HTMLInputElement[];
        fireEvent.change(fromInputs[1], {target: {value: "03:00"}});

        const titleInputs = shell.getAllByLabelText("title") as HTMLInputElement[];
        fireEvent.change(titleInputs[0], {target: {value: "Part 1"}});
        fireEvent.change(titleInputs[1], {target: {value: "Part 2"}});

        const okButton = shell.getByText("ok").closest("button") as HTMLButtonElement;
        fireEvent.click(okButton);

        expect(handleClose).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({title: "Part 1", startTime: 0}),
                expect.objectContaining({title: "Part 2", startTime: 180}),
            ])
        );
    });

    test("updates end time only for matching entry when multiple entries exist", async () => {
        const handleClose = jest.fn();
        const shell = await renderModal(CutModal, {...baseProps, onClose: handleClose});

        const addButton = shell.getByText("add").closest("button") as HTMLButtonElement;
        fireEvent.click(addButton);

        const toInputs = shell.getAllByLabelText("to") as HTMLInputElement[];
        fireEvent.change(toInputs[0], {target: {value: "02:30"}});

        const titleInputs = shell.getAllByLabelText("title") as HTMLInputElement[];
        fireEvent.change(titleInputs[0], {target: {value: "Part 1"}});
        fireEvent.change(titleInputs[1], {target: {value: "Part 2"}});

        const okButton = shell.getByText("ok").closest("button") as HTMLButtonElement;
        fireEvent.click(okButton);

        expect(handleClose).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({title: "Part 1", endTime: 150}),
                expect.objectContaining({title: "Part 2", endTime: 300}),
            ])
        );
    });
});
