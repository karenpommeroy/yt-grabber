import {createTheme, PaletteMode, ThemeOptions} from "@mui/material";
import {CssVarsThemeOptions, Palette} from "@mui/material/styles";

import forestGreenJson from "./definitions/ForestGreen.json";
import midnightTealJson from "./definitions/MidnightTeal.json";
import oceanWavesJson from "./definitions/OceanWaves.json";
import pastelMidnightJson from "./definitions/PastelMidnight.json";
import pinkFloydJson from "./definitions/PinkFloyd.json";
import steelGreyJson from "./definitions/SteelGrey.json";
import sunsetSkyJson from "./definitions/SunsetSky.json";
import terracottaWarmthJson from "./definitions/TerracottaWarmth.json";

export type ColorScheme = {palette: Partial<Palette>};

export const getThemeDefinition = (name: Themes): CssVarsThemeOptions => {
    return createTheme({
        cssVariables: {
            colorSchemeSelector: "data-theme-mode",
            cssVarPrefix: "theme",
            rootSelector: ":root",
        },
        ...themeDefinitions[name]
    });
}; 

export enum Themes {
    PastelMidnight = "pastel-midnight",
    SunsetSky = "sunset-sky",
    OceanWaves = "ocean-waves",
    PinkFloyd = "pink-floyd",
    ForestGreen = "forest-green",
    MidnightTeal = "midnight-teal",
    SteelGrey = "steel-grey",
    TerracottaWarmth = "terracotta-warmth",
}

export const themeDefinitions: Record<Themes, ThemeOptions> = {
    [Themes.PastelMidnight]: pastelMidnightJson as ThemeOptions,
    [Themes.SunsetSky]: sunsetSkyJson as ThemeOptions,
    [Themes.OceanWaves]: oceanWavesJson as ThemeOptions,
    [Themes.PinkFloyd]: pinkFloydJson as ThemeOptions,
    [Themes.ForestGreen]: forestGreenJson as ThemeOptions,
    [Themes.MidnightTeal]: midnightTealJson as ThemeOptions,
    [Themes.SteelGrey]: steelGreyJson as ThemeOptions,
    [Themes.TerracottaWarmth]: terracottaWarmthJson as ThemeOptions,
};

export const getThemeSample = (name: Themes, mode: string) => {
    if (!mode) return;

    const themeDef: any = themeDefinitions[name];

    themeDef.defaultColorScheme = mode as PaletteMode;
    const theme = createTheme(themeDef);

    return [
        theme.palette.background.default,
        theme.palette.background.paper,
        theme.palette.primary.light,
        theme.palette.primary.main,
        theme.palette.primary.dark,
        theme.palette.secondary.light,
        theme.palette.secondary.main,
        theme.palette.secondary.dark,
    ];
};
