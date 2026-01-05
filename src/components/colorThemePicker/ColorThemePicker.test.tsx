

import {useColorScheme} from "@mui/material/styles";
import {fireEvent, within} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {ColorMode} from "../../common/Theme";
import {IAppContext, useAppContext} from "../../react/contexts/AppContext";
import {IAppState} from "../../react/states/AppState";
import {Themes} from "../../theme/Theme";
import ColorThemePicker from "./ColorThemePicker";

jest.mock("@mui/material/styles", () => require("@tests/mocks/mui-material-styles"));
jest.mock("../../react/contexts/AppContext", () => require("@tests/mocks/react/contexts/AppContext"));
jest.mock("react-i18next", () => require("@tests/mocks/react-i18next"));

const useAppContextMock = useAppContext as jest.MockedFunction<typeof useAppContext>;
describe("ColorThemePicker", () => {
    const useColorSchemeMock = useColorScheme as jest.Mock;
    const actions = {
        setLocation: jest.fn(),
        setTheme: jest.fn(),
    } as unknown as IAppContext["actions"];
    const state: IAppState = {theme: Themes.SunsetSky, mode: ColorMode.Dark};

    
    beforeEach(() => {
        useColorSchemeMock.mockReturnValue({mode: "system"});
        useAppContextMock.mockImplementation(() => ({state, actions}));
    });

    test("renders select with theme color options", async () => {
        const shell = await render(<ColorThemePicker data-testid="color-theme-picker" />);

        const trigger = shell.getByRole("combobox");
        expect(trigger).toBeInTheDocument();

        fireEvent.mouseDown(trigger);

        const listbox = await shell.findByRole("listbox");
        const options = within(listbox).getAllByRole("option");
        const optionTexts = options.map((option) => option.textContent);


        expect(optionTexts).toEqual(expect.arrayContaining(["pastel midnight", "sunset sky", "ocean waves", "pink floyd"]));
    });

    test("updates color theme when selection changes", async () => {
        const shell = await render(<ColorThemePicker data-testid="color-theme-picker" />);

        const trigger = shell.getByRole("combobox");

        fireEvent.mouseDown(trigger);

        const listbox = await shell.findByRole("listbox");
        const option = within(listbox).getByRole("option", {name: "ocean waves"});

        fireEvent.click(option);

        expect(actions.setTheme).toHaveBeenCalledTimes(1);
        expect(actions.setTheme).toHaveBeenCalledWith("ocean-waves");
    });
});
