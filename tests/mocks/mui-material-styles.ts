const actual = jest.requireActual("@mui/material/styles");

const MuiMaterialStylesMock = {
    ...actual,
    useColorScheme: jest.fn(),
};

export const {createTheme, styled, alpha, ThemeProvider, Shadows, ColorSystemOptions, CssVarsThemeOptions, Palette, PaletteMode} = actual;

export const useColorScheme = MuiMaterialStylesMock.useColorScheme;

export default MuiMaterialStylesMock;
