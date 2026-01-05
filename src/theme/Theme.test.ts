import {ColorSystemOptions} from "@mui/material";

import sunsetSkyJson from "./definitions/SunsetSky.json";
import {getThemeDefinition, Themes} from "./Theme";

jest.mock("./ColorThemes", () => ({
    getThemeColorSystem: jest.fn((name: string, mode: string) => ({
        palette: {mode, id: `${name}-${mode}`},
    })),
}));


describe("Theme", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("getThemeDefinition composes theme primitives", () => {
        const definition = getThemeDefinition(Themes.SunsetSky);

        expect((definition.colorSchemes.light as ColorSystemOptions).palette).toMatchObject(sunsetSkyJson.colorSchemes.light.palette);
        expect((definition.colorSchemes.dark as ColorSystemOptions).palette).toMatchObject(sunsetSkyJson.colorSchemes.dark.palette);
        expect(definition.typography).toMatchObject(sunsetSkyJson.typography);
        expect(definition.shape).toMatchObject(sunsetSkyJson.shape);
    });
});
