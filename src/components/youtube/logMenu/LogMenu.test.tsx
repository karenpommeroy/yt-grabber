import {fireEvent, screen, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {setupDataState} from "../../../common/TestHelpers";
import LogMenu from "./LogMenu";

jest.mock("../../../react/contexts/DataContext", () => require("@tests/mocks/react/contexts/DataContext"));

describe("LogMenu", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns null when hidden", async () => {
        setupDataState();

        const shell = await render(<LogMenu hidden />);

        expect(shell.container.querySelector("[data-help=\"logMenu\"]")).toBeNull();
    });

    test("disables log buttons when there are no entries", async () => {
        setupDataState();

        const shell = await render(<LogMenu />);
        const logMenu = shell.container.querySelector("[data-help=\"logMenu\"]") as HTMLElement;
        expect(logMenu).toBeTruthy();
        const buttons = Array.from(logMenu.querySelectorAll("button")) as HTMLButtonElement[];

        expect(buttons[0]).toBeDisabled();
        expect(buttons[1]).toBeDisabled();
    });

    test("opens error menu and closes after selecting entry", async () => {
        const errors = [{url: "https://example.com/error", message: "Network failure"}];
        setupDataState({errors});

        const shell = await render(<LogMenu />);
        const logMenu = shell.container.querySelector("[data-help=\"logMenu\"]") as HTMLElement;
        const errorButton = logMenu.querySelectorAll("button")[0] as HTMLButtonElement;

        fireEvent.click(errorButton);

        await waitFor(() => expect(screen.getByText(errors[0].url)).toBeInTheDocument());

        const menuItem = screen.getByText(errors[0].url).closest("li") as HTMLLIElement;
        fireEvent.click(menuItem);

        await waitFor(() => expect(screen.queryByText(errors[0].url)).not.toBeInTheDocument());
    });

    test("opens warning menu independently of error menu", async () => {
        const errors = [{url: "https://example.com/error", message: "Network failure"}];
        const warnings = [{url: "https://example.com/warning", message: "Slow response"}];
        setupDataState({errors, warnings});

        const shell = await render(<LogMenu />);
        const logMenu = shell.container.querySelector("[data-help=\"logMenu\"]") as HTMLElement;
        const buttons = logMenu.querySelectorAll("button");
        const errorButton = buttons[0] as HTMLButtonElement;
        const warningButton = buttons[1] as HTMLButtonElement;

        fireEvent.click(errorButton);
        await waitFor(() => expect(screen.getByText(errors[0].message)).toBeInTheDocument());

        fireEvent.click(warningButton);
        await waitFor(() => expect(screen.getByText(warnings[0].url)).toBeInTheDocument());
        await waitFor(() => expect(screen.queryByText(errors[0].message)).not.toBeInTheDocument());
    });
});
