import {ChangeEvent} from "react";

import {act, fireEvent, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {useAppContext} from "../../react/contexts/AppContext";
import DevelopmentView from "./DevelopmentView";

jest.mock("usehooks-ts", () => require("@tests/mocks/usehooks-ts"));
jest.mock("../../react/contexts/AppContext", () => require("@tests/mocks/react/contexts/AppContext"));

let capturedOnChangeHandlers: {[key: string]: (value: number) => void} = {};

jest.mock("../../components/numberField/NumberField", () => ({
    __esModule: true,
    default: ({label, value, onChange, id}: any) => {
        capturedOnChangeHandlers[id] = onChange;
        return (
            <label htmlFor={id}>
                {label}
                <input
                    id={id}
                    data-testid={id}
                    value={value ?? ""}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
                />
            </label>
        );
    },
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

    test("handles playlistCountThreshold change with previous state", async () => {
        const applicationOptions = {
            debugMode: true,
            playlistCountThreshold: 5,
            playlistCheckMaxItemsCount: 3,
        };
        const puppeteerOptions = {headless: false};

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

        const playlistThresholdInput = shell.getByTestId("playlistCountThreshold") as HTMLInputElement;
        fireEvent.change(playlistThresholdInput, {target: {value: "15"}});

        await waitFor(() => {
            expect(store.set).toHaveBeenCalledWith(
                "application",
                expect.objectContaining({
                    debugMode: true,
                    playlistCountThreshold: 15,
                    playlistCheckMaxItemsCount: 3,
                }),
            );
        });
    });

    test("handles playlistCheckMaxItemsCount change with previous state", async () => {
        const applicationOptions = {
            debugMode: true,
            playlistCountThreshold: 10,
            playlistCheckMaxItemsCount: 2,
        };
        const puppeteerOptions = {headless: false};

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

        const playlistItemsInput = shell.getByTestId("playlistCheckMaxItemsCount") as HTMLInputElement;
        fireEvent.change(playlistItemsInput, {target: {value: "8"}});

        await waitFor(() => {
            expect(store.set).toHaveBeenCalledWith(
                "application",
                expect.objectContaining({
                    debugMode: true,
                    playlistCountThreshold: 10,
                    playlistCheckMaxItemsCount: 8,
                }),
            );
        });
    });

    test("renders with debugMode enabled and headless false", async () => {
        const applicationOptions = {
            debugMode: true,
            playlistCountThreshold: 25,
            playlistCheckMaxItemsCount: 7,
        };
        const puppeteerOptions = {headless: false};

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
        expect(debugSwitch).toBeChecked();

        const showBrowserSwitch = shell.getByRole("switch", {name: "showBrowser"});
        expect(showBrowserSwitch).toBeChecked();
    });

    test("directly invokes playlistCountThreshold onChange handler", async () => {
        const applicationOptions = {
            debugMode: false,
            playlistCountThreshold: 10,
            playlistCheckMaxItemsCount: 5,
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

        capturedOnChangeHandlers = {};
        await render(<DevelopmentView />);

        expect(capturedOnChangeHandlers.playlistCountThreshold).toBeDefined();

        act(() => {
            capturedOnChangeHandlers.playlistCountThreshold(30);
        });

        await waitFor(() => {
            expect(store.set).toHaveBeenCalledWith(
                "application",
                expect.objectContaining({playlistCountThreshold: 30}),
            );
        });
    });

    test("directly invokes playlistCheckMaxItemsCount onChange handler", async () => {
        const applicationOptions = {
            debugMode: false,
            playlistCountThreshold: 10,
            playlistCheckMaxItemsCount: 5,
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

        capturedOnChangeHandlers = {};
        await render(<DevelopmentView />);

        expect(capturedOnChangeHandlers.playlistCheckMaxItemsCount).toBeDefined();

        act(() => {
            capturedOnChangeHandlers.playlistCheckMaxItemsCount(9);
        });

        await waitFor(() => {
            expect(store.set).toHaveBeenCalledWith(
                "application",
                expect.objectContaining({playlistCheckMaxItemsCount: 9}),
            );
        });
    });

    test("verifies state callback merges with previous state correctly", async () => {
        const applicationOptions = {
            debugMode: true,
            playlistCountThreshold: 15,
            playlistCheckMaxItemsCount: 8,
            urls: ["https://test.url"],
        };
        const puppeteerOptions = {headless: false};

        store.get.mockImplementation((key: string) => {
            if (key === "application") {
                return {...applicationOptions};
            }

            if (key === "options") {
                return {...puppeteerOptions};
            }

            return {};
        });

        capturedOnChangeHandlers = {};
        await render(<DevelopmentView />);

        act(() => {
            capturedOnChangeHandlers.playlistCountThreshold(99);
        });

        await waitFor(() => {
            expect(store.set).toHaveBeenCalledWith(
                "application",
                expect.objectContaining({
                    debugMode: true,
                    playlistCountThreshold: 99,
                    playlistCheckMaxItemsCount: 8,
                }),
            );
        });

        store.set.mockClear();

        act(() => {
            capturedOnChangeHandlers.playlistCheckMaxItemsCount(1);
        });

        await waitFor(() => {
            expect(store.set).toHaveBeenCalledWith(
                "application",
                expect.objectContaining({
                    debugMode: true,
                    playlistCountThreshold: 99,
                    playlistCheckMaxItemsCount: 1,
                }),
            );
        });
    });
});
