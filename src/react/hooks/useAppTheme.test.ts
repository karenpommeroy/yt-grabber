import {createTheme} from "@mui/material/styles";
import {renderHook} from "@testing-library/react";

import {getThemeDefinition} from "../../styles/MaterialThemes";
import {useAppContext} from "../contexts/AppContext";
import useAppTheme from "./useAppTheme";

jest.mock("../contexts/AppContext", () => ({
    useAppContext: jest.fn(),
}));

jest.mock("../../styles/MaterialThemes", () => ({
    getThemeDefinition: jest.fn(),
}));

jest.mock("@mui/material/styles", () => ({
    createTheme: jest.fn(),
}));

describe("useAppTheme", () => {
    const useAppContextMock = useAppContext as jest.MockedFunction<typeof useAppContext>;
    const getThemeDefinitionMock = getThemeDefinition as jest.MockedFunction<typeof getThemeDefinition>;
    const createThemeMock = createTheme as jest.MockedFunction<typeof createTheme>;

    beforeEach(() => {
        useAppContextMock.mockReset();
        getThemeDefinitionMock.mockReset();
        createThemeMock.mockReset();
    });

    test("returns theme created from context state", () => {
        const themeDefinition = {palette: {mode: "dark"}};
        const themeObject = {name: "mui-theme"};

        useAppContextMock.mockReturnValue({state: {theme: "blue", mode: "dark"}} as any);
        getThemeDefinitionMock.mockReturnValue(themeDefinition as any);
        createThemeMock.mockReturnValue(themeObject as any);

        const {result} = renderHook(() => useAppTheme());

        expect(getThemeDefinitionMock).toHaveBeenCalledWith("blue", "dark");
        expect(createThemeMock).toHaveBeenCalledWith(themeDefinition, {});
        expect(result.current.theme).toBe(themeObject);
    });
});
