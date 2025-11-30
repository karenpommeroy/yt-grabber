import {Blue, Gray, Green, Orange, Red} from "./Colors";
import {getThemeColorSystem, Purple, SlateBlue, ThemeColorSchemes} from "./ColorThemes";

const expectPalette = (palette: any, mode: "light" | "dark") => {
    expect(palette.mode).toBe(mode);
    expect(palette.grey).toBe(Gray);
};

describe("ColorThemes", () => {
    test("Sky scheme is registered", () => {
        expect(ThemeColorSchemes.Sky.primary).toBe(SlateBlue);
        expect(ThemeColorSchemes.Sky.secondary).toBe(Purple);
    });

    test("getThemeColorSystem builds light palette", () => {
        const {palette} = getThemeColorSystem("Sky", "light");
        expectPalette(palette, "light");

        expect(palette.primary).toEqual({
            light: SlateBlue[200],
            main: SlateBlue[400],
            dark: SlateBlue[700],
            contrastText: SlateBlue[50],
        });
        expect(palette.secondary).toEqual({
            light: Purple[200],
            main: Purple[400],
            dark: Purple[700],
            contrastText: Purple[50],
        });
        expect(palette.info).toEqual({
            light: Blue[100],
            main: Blue[300],
            dark: Blue[600],
            contrastText: Gray[50],
        });
        expect(palette.background).toEqual({
            default: Gray[200],
            paper: Gray[50],
        });
    });

    test("getThemeColorSystem applies dark overrides", () => {
        const {palette} = getThemeColorSystem("Sky", "dark");
        expectPalette(palette, "dark");

        expect(palette.primary).toEqual({
            light: SlateBlue[300],
            main: SlateBlue[500],
            dark: SlateBlue[800],
            contrastText: SlateBlue[50],
        });
        expect(palette.secondary).toEqual({
            light: Purple[300],
            main: Purple[600],
            dark: Purple[900],
            contrastText: Purple[50],
        });
        expect(palette.info).toEqual({
            light: Blue[500],
            main: Blue[700],
            dark: Blue[900],
            contrastText: Blue[300],
        });
        expect(palette.background).toEqual({
            default: Gray.A700,
            paper: SlateBlue[900],
        });
        expect(palette.text).toEqual({
            primary: SlateBlue[100],
            secondary: SlateBlue[400],
            disabled: SlateBlue[700],
        });
        expect(palette.action).toMatchObject({
            active: Gray[200],
            hover: expect.any(String),
            selected: expect.any(String),
            focus: Gray[200],
        });
        expect((palette.success as any).dark).toBe(Green[700]);
        expect((palette.warning as any).main).toBe(Orange[500]);
        expect((palette.error as any).main).toBe(Red[500]);
    });
});
