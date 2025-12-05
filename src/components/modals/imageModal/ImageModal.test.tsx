import {fireEvent} from "@testing-library/react";
import {renderModal} from "@tests/TestRenderer";

import ImageModal, {ImageModalProps} from "./ImageModal";

describe("ImageModal", () => {
    const baseProps: ImageModalProps = {
        id: "image-modal",
        open: true,
        title: "Album Cover",
        imageUrl: "https://example.com/cover.jpg",
    };

    test("renders provided title and image", async () => {
        const shell = await renderModal<ImageModalProps>(ImageModal, baseProps);

        expect(shell.getByText(baseProps.title)).toBeInTheDocument();
        const image = shell.getByRole("img", {name: baseProps.title}) as HTMLImageElement;
        expect(image.src).toBe(baseProps.imageUrl);
    });

    test("does not render image box when imageUrl is missing", async () => {
        const shell = await renderModal<ImageModalProps>(ImageModal, {...baseProps, imageUrl: undefined});

        expect(shell.queryByRole("img", {name: baseProps.title})).toBeNull();
    });

    test("invokes onClose when close button is clicked", async () => {
        const handleClose = jest.fn();
        const shell = await renderModal<ImageModalProps>(ImageModal, {...baseProps, onClose: handleClose});

        const closeButton = shell.getByText("close").closest("button") as HTMLButtonElement;
        fireEvent.click(closeButton);

        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
