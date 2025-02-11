import {ColorSystemOptions, CssVarsThemeOptions, Palette, PaletteMode} from "@mui/material/styles";

import {getThemeColorSystem} from "./ColorThemes";
import Shadows from "./Shadows";
import Shape from "./Shape";
import Typography from "./Typography";

export type ColorScheme = {palette: Partial<Palette>};

export const getThemeDefinition = (name: string): CssVarsThemeOptions => {
    return {
        colorSchemes: getThemeColorSchemes(name),
        shadows: Shadows,
        typography: Typography,
        shape: Shape,
    };
}; 

export const getThemeColorSchemes = (name: string): Record<PaletteMode, ColorSystemOptions> => {
    return {
        light: getThemeColorSystem(name, "light"),
        dark: getThemeColorSystem(name, "dark"),
    };
};
