import {act, fireEvent, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {InputMode} from "../../../common/Media";
import InputModePicker from "./InputModePicker";

jest.mock("usehooks-ts", () => require("@tests/mocks/usehooks-ts"));

const storeGetMock = store.get as jest.Mock;
const storeSetMock = store.set as jest.Mock;
const storeOnDidChangeMock = store.onDidChange as jest.Mock;

const createOptions = () => ({
    inputMode: InputMode.Auto,
});

let unsubscribeMock: jest.Mock;
let onDidChangeHandler: ((value: InputMode) => void) | undefined;

describe("InputModePicker", () => {
    beforeEach(() => {
        unsubscribeMock = jest.fn();
        onDidChangeHandler = undefined;
        storeGetMock.mockReset();
        storeSetMock.mockReset();
        storeOnDidChangeMock.mockReset();
        storeGetMock.mockImplementation((key: string) => {
            if (key === "application") {
                return createOptions();
            }

            return undefined;
        });
        storeOnDidChangeMock.mockImplementation((key: string, handler: (value: InputMode) => void) => {
            if (key === "application.inputMode") {
                onDidChangeHandler = handler;
            }

            return unsubscribeMock;
        });
    });

    test("updates store when selecting a different input mode", async () => {
        const shell = await render(<InputModePicker />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        fireEvent.click(shell.getByRole("button"));

        const menuItems = await waitFor(() => shell.getAllByRole("menuitem"));
        const artistsItem = menuItems.find((item) => item.textContent?.includes("artists")) as HTMLElement;

        fireEvent.click(artistsItem);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({inputMode: InputMode.Artists})
        ));
    });

    test("closes the menu when clicking away", async () => {
        const shell = await render(<InputModePicker />);

        fireEvent.click(shell.getByRole("button"));
        await waitFor(() => shell.getByText("artists"));

        await act(async () => {
            fireEvent.mouseDown(document.body);
            fireEvent.mouseUp(document.body);
            fireEvent.click(document.body);
        });

        await waitFor(() => expect(shell.queryByText("artists")).not.toBeInTheDocument());
    });

    test("reacts to external store input mode changes", async () => {
        const shell = await render(<InputModePicker />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        await act(async () => {
            onDidChangeHandler?.(InputMode.Songs);
        });

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({inputMode: InputMode.Songs})
        ));

        const button = shell.getByRole("button");
        expect(button).not.toBeDisabled();
    });
});
