import {ipcRenderer} from "electron";

import {fireEvent} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {Messages} from "../../messaging/Messages";
import FileField from "./FileField";

type IpcRendererMock = {
    send: jest.Mock;
    on: jest.Mock;
    off: jest.Mock;
};

const ipcRendererMock = ipcRenderer as unknown as IpcRendererMock;

describe("FileField", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("registers and unregisters dialog completion listener", async () => {
        const {unmount} = await render(<FileField id="test-id" />);

        expect(ipcRendererMock.on).toHaveBeenCalledWith(
            `${Messages.OpenSelectPathDialogCompleted}_test-id`,
            expect.any(Function),
        );

        const listener = ipcRendererMock.on.mock.calls[0][1];

        unmount();

        expect(ipcRendererMock.off).toHaveBeenCalledWith(
            `${Messages.OpenSelectPathDialogCompleted}_test-id`,
            listener,
        );
    });

    test("propagates value and blur events", async () => {
        const handleChange = jest.fn();
        const handleBlur = jest.fn();

        const shell = await render(
            <FileField onChange={handleChange} onBlur={handleBlur} />,
        );

        const input = shell.getByRole("textbox");

        fireEvent.change(input, {target: {value: "C:\\Temp"}});
        expect(handleChange).toHaveBeenCalledWith(["C:\\Temp"]);

        fireEvent.blur(input, {target: {value: "C:\\Temp"}});
        expect(handleBlur).toHaveBeenCalledWith(["C:\\Temp"]);
    });

    test("opens select dialog with expected payload", async () => {
        const shell = await render(
            <FileField
                id="picker-id"
                mode="directory"
                multiple={true}
                value="D://Downloads"
            />,
        );

        const button = shell.getByRole("button");
        fireEvent.click(button);

        expect(ipcRendererMock.send).toHaveBeenCalledWith(
            Messages.OpenSelectPathDialog,
            {directory: true, multiple: true, defaultPath: "D://Downloads", id: "picker-id"},
        );
    });

    test("handles dialog completion response", async () => {
        const handleChange = jest.fn();

        await render(<FileField id="select-id" onChange={handleChange} />);

        const listener = ipcRendererMock.on.mock.calls[0][1];

        listener({} as any, JSON.stringify({paths: "E://Music"}));

        expect(handleChange).toHaveBeenCalledWith(["E://Music"]);
    });

    test("configures file input attributes", async () => {
        const shell = await render(
            <FileField fileTypes={[".mp3", ".wav"]} />,
        );

        const fileInput = shell.container.querySelector("input[type=\"file\"]");
        expect(fileInput).not.toBeNull();
        expect(fileInput!.getAttribute("accept")).toBe(".mp3,.wav");
    });
});
