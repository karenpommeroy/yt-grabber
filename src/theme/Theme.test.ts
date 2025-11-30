import {ColorSystemOptions} from "@mui/material";

import {getThemeColorSystem} from "./ColorThemes";
import {getThemeColorSchemes, getThemeDefinition} from "./Theme";

jest.mock("./ColorThemes", () => ({
    getThemeColorSystem: jest.fn((name: string, mode: string) => ({
        palette: {mode, id: `${name}-${mode}`},
    })),
}));

jest.mock("./Shadows", () => ["shadow-1", "shadow-2"]);
jest.mock("./Shape", () => ({borderRadius: 8}));
jest.mock("./Typography", () => ({fontFamily: "Roboto"}));

describe("Theme", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("getThemeColorSchemes returns light and dark color systems", () => {
        const schemes = getThemeColorSchemes("Sky");

        expect(getThemeColorSystem).toHaveBeenCalledWith("Sky", "light");
        expect(getThemeColorSystem).toHaveBeenCalledWith("Sky", "dark");
        expect(schemes.light.palette).toEqual({mode: "light", id: "Sky-light"});
        expect(schemes.dark.palette).toEqual({mode: "dark", id: "Sky-dark"});
    });

    test("getThemeDefinition composes theme primitives", () => {
        const definition = getThemeDefinition("Sky");

        expect((definition.colorSchemes.light as ColorSystemOptions & any).palette.id).toBe("Sky-light");
        expect((definition.colorSchemes.dark as ColorSystemOptions & any).palette.id).toBe("Sky-dark");
        expect(definition.shadows).toEqual(["shadow-1", "shadow-2"]);
        expect(definition.typography).toEqual({fontFamily: "Roboto"});
        expect(definition.shape).toEqual({borderRadius: 8});
    });
});
