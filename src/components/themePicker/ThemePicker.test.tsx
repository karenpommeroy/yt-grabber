

import {useColorScheme} from "@mui/material/styles";
import {fireEvent, within} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import ThemePicker from "./ThemePicker";

jest.mock("@mui/material/styles", () => ({
    ...jest.requireActual("@mui/material/styles"),
    useColorScheme: jest.fn(),
}));

describe("ThemePicker", () => {
    const setMode = jest.fn();

    beforeEach(() => {
        (useColorScheme as jest.Mock).mockReturnValue({mode: "system", setMode});
        setMode.mockClear();
    });

    test("renders select with themed options", async () => {
        const shell = await render(<ThemePicker data-testid="theme-picker" />);

        const trigger = shell.getByRole("combobox");
        expect(trigger).toBeInTheDocument();

        fireEvent.mouseDown(trigger);

        const listbox = await shell.findByRole("listbox");
        const options = within(listbox).getAllByRole("option");
        const optionTexts = options.map((option) => option.textContent);


        expect(optionTexts).toEqual(expect.arrayContaining(["Dark", "Light", "System"]));
    });

    test("updates mode when selection changes", async () => {
        const shell = await render(<ThemePicker data-testid="theme-picker" />);

        const trigger = shell.getByRole("combobox");

        fireEvent.mouseDown(trigger);

        const listbox = await shell.findByRole("listbox");
        const option = within(listbox).getByRole("option", {name: "Dark"});

        fireEvent.click(option);

        expect(setMode).toHaveBeenCalledTimes(1);
        expect(setMode).toHaveBeenCalledWith("dark");
    });
});
