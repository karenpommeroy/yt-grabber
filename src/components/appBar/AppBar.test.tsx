import {fireEvent} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {useClickCounter} from "../../hooks/useClickCounter";
import {useAppContext} from "../../react/contexts/AppContext";
import AppBar from "./AppBar";

jest.mock("../../react/contexts/AppContext", () => require("@tests/mocks/react/contexts/AppContext"));
jest.mock("../../hooks/useClickCounter", () => require("@tests/mocks/hooks/useClickCounter")); 


const useAppContextMock = useAppContext as jest.MockedFunction<typeof useAppContext>;
const useClickCounterMock = useClickCounter as jest.MockedFunction<typeof useClickCounter>;

const createContextValue = (overrides?: Partial<ReturnType<typeof useAppContext>>) => {
    const state = {
        location: "/",
        theme: "purple-rain",
        mode: "light",
        loading: false,
        help: false,
        ...overrides?.state,
    } as ReturnType<typeof useAppContext>["state"];

    const actions = {
        setLocation: jest.fn(),
        setTheme: jest.fn(),
        setMode: jest.fn(),
        setLoading: jest.fn(),
        setHelp: jest.fn(),
        ...overrides?.actions,
    } as ReturnType<typeof useAppContext>["actions"];

    useAppContextMock.mockReturnValue({state, actions});

    return {state, actions};
};

beforeEach(() => {
    jest.clearAllMocks();
    useClickCounterMock.mockReturnValue({onClick: jest.fn(), clickCounter: 0});
});

describe("AppBar", () => {
    test("navigates to settings when settings icon is clicked", async () => {
        const {actions} = createContextValue();
        const shell = await render(<AppBar />);

        const settingsButton = shell.container.querySelector("button[name=\"settings\"]") as HTMLButtonElement;
        expect(settingsButton).toBeTruthy();

        fireEvent.click(settingsButton);

        expect(actions.setLocation).toHaveBeenCalledWith("/settings");
    });

    test("renders close icon when not on home and navigates back", async () => {
        const {actions} = createContextValue({state: {location: "/settings"}} as any);
        const shell = await render(<AppBar />);

        const closeIcon = shell.getByTestId("CloseIcon");
        const closeButton = closeIcon.closest("button") as HTMLButtonElement;
        expect(closeButton).toBeTruthy();

        fireEvent.click(closeButton);

        expect(actions.setLocation).toHaveBeenCalledWith("/");
    });

    test("toggles help state when help button is clicked", async () => {
        const {actions} = createContextValue({state: {help: false}} as any);
        const shell = await render(<AppBar />);

        const helpButton = shell.container.querySelector("[data-help=\"help-toggle\"]") as HTMLButtonElement;
        expect(helpButton).toBeTruthy();

        fireEvent.click(helpButton);

        expect(actions.setHelp).toHaveBeenCalledWith(true);
    });

    test("does not navigate when navigation is disabled", async () => {
        const {actions} = createContextValue();
        const shell = await render(<AppBar disableNavigation />);

        const settingsButton = shell.container.querySelector("button[name=\"settings\"]") as HTMLButtonElement;
        expect(settingsButton).toBeTruthy();

        fireEvent.click(settingsButton);

        expect(actions.setLocation).not.toHaveBeenCalled();
    });

    test("passes click handler from useClickCounter to logo", async () => {
        const logoClick = jest.fn();
        useClickCounterMock.mockReturnValue({onClick: logoClick, clickCounter: 0});
        createContextValue();

        const shell = await render(<AppBar />);
        const logoButton = shell.container.querySelector(".logo");

        fireEvent.click(logoButton);

        expect(logoClick).toHaveBeenCalled();
    });

    test("handleOpenDevelopment navigates to development when navigation enabled", async () => {
        const {actions} = createContextValue();

        useClickCounterMock.mockImplementation((callback) => {
            return {
                onClick: () => callback(),
                clickCounter: 0
            };
        });

        const shell = await render(<AppBar />);
        const logoButton = shell.container.querySelector(".logo");
        fireEvent.click(logoButton);

        expect(actions.setLocation).toHaveBeenCalledWith("/development");
    });

    test("handleOpenDevelopment does nothing when navigation disabled", async () => {
        const {actions} = createContextValue();

        useClickCounterMock.mockImplementation((callback) => {
            return {
                onClick: () => callback(),
                clickCounter: 0
            };
        });

        await render(<AppBar disableNavigation />);

        expect(actions.setLocation).not.toHaveBeenCalled();
    });
});
