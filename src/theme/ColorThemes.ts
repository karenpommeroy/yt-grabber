import {alpha, ColorSystemOptions, PaletteMode} from "@mui/material";

import {Blue, Color, Gray, Green, Orange, Red} from "./Colors";

export type ThemeColorScheme = {
    primary: Color;
    secondary: Color;
}

export type ColorTheme = {
    primary: {
        light: string;
        main: string;
        dark: string;
        contrastText: string;
    },
    secondary: {
        light: string;
        main: string;
        dark: string;
        contrastText: string;
    },
    background: {
        default: string;
        paper: string;
    },
    divider: string;
    text: {
        primary: string;
        secondary: string;
        disabled: string;
    }
}

export const SlateBlue: Color = {
    50: "hsl(231, 35%, 95%)",
    100: "hsl(231, 35%, 85%)",
    200: "hsl(231, 35%, 75%)",
    300: "hsl(232, 25%, 65%)",
    400: "hsl(232, 25%, 55%)",
    500: "hsl(232, 25%, 50%)",
    600: "hsl(232, 25%, 40%)",
    700: "hsl(233, 35%, 30%)",
    800: "hsl(233, 35%, 20%)",
    900: "hsl(233, 35%, 15%)",
};

export const Purple: Color = {
    50: "hsl(337, 75%, 95%)",
    100: "hsl(337, 75%, 85%)",
    200: "hsl(337, 75%, 75%)",
    300: "hsl(338, 85%, 65%)",
    400: "hsl(338, 85%, 55%)",
    500: "hsl(338, 85%, 50%)",
    600: "hsl(338, 85%, 40%)",
    700: "hsl(339, 75%, 30%)",
    800: "hsl(339, 75%, 20%)",
    900: "hsl(339, 75%, 15%)",
};

export const getThemeColorSystem = (name: string, mode: PaletteMode): ColorSystemOptions => {
    const colorScheme = ThemeColorSchemes[name];

    return {
        palette: {
            mode,
            primary: {
                light: colorScheme.primary[200],
                main: colorScheme.primary[400],
                dark: colorScheme.primary[700],
                contrastText: colorScheme.primary[50],
                ...(mode === "dark" && {
                    light: colorScheme.primary[300],
                    main: colorScheme.primary[500],
                    dark: colorScheme.primary[800],
                    contrastText: colorScheme.primary[50],
                }),
            },
            secondary: {
                light: colorScheme.secondary[200],
                main: colorScheme.secondary[400],
                dark: colorScheme.secondary[700],
                contrastText: colorScheme.secondary[50],
                ...(mode === "dark" && {
                    light: colorScheme.secondary[300],
                    main: colorScheme.secondary[600],
                    dark: colorScheme.secondary[900],
                    contrastText: colorScheme.secondary[50],
                }),
            },
            info: {
                light: Blue[100],
                main: Blue[300],
                dark: Blue[600],
                contrastText: Gray[50],
                ...(mode === "dark" && {
                    contrastText: Blue[300],
                    light: Blue[500],
                    main: Blue[700],
                    dark: Blue[900],
                }),
            },
            warning: {
                light: Orange[300],
                main: Orange[400],
                dark: Orange[800],
                ...(mode === "dark" && {
                    light: Orange[400],
                    main: Orange[500],
                    dark: Orange[700],
                }),
            },
            error: {
                light: Red[300],
                main: Red[400],
                dark: Red[800],
                ...(mode === "dark" && {
                    light: Red[400],
                    main: Red[500],
                    dark: Red[700],
                }),
            },
            success: {
                light: Green[300],
                main: Green[400],
                dark: Green[800],
                ...(mode === "dark" && {
                    light: Green[400],
                    main: Green[500],
                    dark: Green[700],
                }),
            },
            grey: Gray,
            divider: mode === "dark" ? alpha(colorScheme.primary[700], 0.6) : alpha(colorScheme.primary[300], 0.4),
            background: {
                default: Gray[200],
                paper: Gray[50],
                ...(mode === "dark" && {
                    default: Gray.A700,
                    paper: colorScheme.primary[900],
                }),
            },
            text: {
                primary: colorScheme.primary[600],
                secondary: colorScheme.primary[300],
                disabled: colorScheme.primary[100],
                ...(mode === "dark" && {
                    primary: colorScheme.primary[100],
                    secondary: colorScheme.primary[400],
                    disabled: colorScheme.primary[700]
                }),
            },
            action: {
                hover: alpha(Gray[200], 0.2),
                selected: alpha(Gray[200], 0.3),
                focus: Gray.A200,
                ...(mode === "dark" && {
                    hover: alpha(Gray[600], 0.2),
                    selected: alpha(Gray[600], 0.3),
                    active: Gray[200],
                    focus: Gray[200],
                }),
            },
        },
        
    };
};

export const ThemeColorSchemes: { [key: string]: ThemeColorScheme } = {
    Sky: {
        primary: SlateBlue,
        secondary: Purple
    }
};
