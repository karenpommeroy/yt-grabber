import {ChangeEvent} from "react";

import {fireEvent, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {useAppContext} from "../../react/contexts/AppContext";
import DevelopmentView from "./DevelopmentView";

jest.mock("usehooks-ts", () => require("@tests/mocks/usehooks-ts"));
jest.mock("../../react/contexts/AppContext", () => require("@tests/mocks/react/contexts/AppContext"));

jest.mock("../../components/numberField/NumberField", () => ({
    __esModule: true,
    default: ({label, value, onChange, id}: any) => (
        <label htmlFor={id}>
            {label}
            <input
                id={id}
                data-testid={id}
                value={value ?? ""}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
            />
        </label>
    ),
}));

describe("DevelopmentView", () => {
    let store: {get: jest.Mock; set: jest.Mock};
    const mockedUseAppContext = useAppContext as unknown as jest.Mock;
    let setLocation: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        store = global.store as unknown as {get: jest.Mock; set: jest.Mock};
        setLocation = jest.fn();
        mockedUseAppContext.mockReturnValue({
            actions: {setLocation},
            state: {},
        });
    });

    test("renders switches and numeric fields with initial store values", async () => {
        const applicationOptions = {
            debugMode: false,
            playlistCountThreshold: 12,
            playlistCheckMaxItemsCount: 4,
        };
        const puppeteerOptions = {headless: true};

        store.get.mockImplementation((key: string) => {
            if (key === "application") {
                return {...applicationOptions};
            }

            if (key === "options") {
                return {...puppeteerOptions};
            }

            return {};
        });

        const shell = await render(<DevelopmentView />);

        const debugSwitch = shell.getByRole("switch", {name: "debugMode"});
        expect(debugSwitch).not.toBeChecked();

        const showBrowserSwitch = shell.getByRole("switch", {name: "showBrowser"});
        expect(showBrowserSwitch).not.toBeChecked();

        const playlistThresholdInput = shell.getByTestId("playlistCountThreshold") as HTMLInputElement;
        expect(playlistThresholdInput.value).toBe("12");

        const playlistItemsInput = shell.getByTestId("playlistCheckMaxItemsCount") as HTMLInputElement;
        expect(playlistItemsInput.value).toBe("4");
    });

    test("persists changes and navigates back on close", async () => {
        const applicationOptions = {
            debugMode: false,
            playlistCountThreshold: 12,
            playlistCheckMaxItemsCount: 4,
        };
        const puppeteerOptions = {headless: true};

        store.get.mockImplementation((key: string) => {
            if (key === "application") {
                return {...applicationOptions};
            }

            if (key === "options") {
                return {...puppeteerOptions};
            }

            return {};
        });

        const shell = await render(<DevelopmentView />);

        await waitFor(() => {
            expect(store.set).toHaveBeenCalledWith("application", applicationOptions);
            expect(store.set).toHaveBeenCalledWith("options", puppeteerOptions);
        });

        store.set.mockClear();

        const debugSwitch = shell.getByRole("switch", {name: "debugMode"});
        fireEvent.click(debugSwitch);

        await waitFor(() => {
            expect(store.set).toHaveBeenCalledWith(
                "application",
                expect.objectContaining({debugMode: true}),
            );
        });

        store.set.mockClear();

        const showBrowserSwitch = shell.getByRole("switch", {name: "showBrowser"});
        fireEvent.click(showBrowserSwitch);

        await waitFor(() => {
            expect(store.set).toHaveBeenCalledWith(
                "options",
                expect.objectContaining({headless: false}),
            );
        });

        store.set.mockClear();

        const playlistThresholdInput = shell.getByTestId("playlistCountThreshold") as HTMLInputElement;
        fireEvent.change(playlistThresholdInput, {target: {value: "20"}});

        await waitFor(() => {
            expect(store.set).toHaveBeenCalledWith(
                "application",
                expect.objectContaining({playlistCountThreshold: 20}),
            );
        });

        store.set.mockClear();

        const playlistItemsInput = shell.getByTestId("playlistCheckMaxItemsCount") as HTMLInputElement;
        fireEvent.change(playlistItemsInput, {target: {value: "6"}});

        await waitFor(() => {
            expect(store.set).toHaveBeenCalledWith(
                "application",
                expect.objectContaining({playlistCheckMaxItemsCount: 6}),
            );
        });

        const closeButton = shell.getByRole("button", {name: "close"});
        fireEvent.click(closeButton);

        expect(setLocation).toHaveBeenCalledWith("/");
    });
});
