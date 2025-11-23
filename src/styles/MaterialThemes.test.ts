import {grey} from "@mui/material/colors";

import {getThemeDefinition} from "./MaterialThemes";

describe("getThemeDefinition", () => {
    test("returns palette specific to the requested mode while preserving base properties", () => {
        const result = getThemeDefinition("purple-rain", "dark");

        expect(result).toMatchObject({
            typography: {fontFamily: "Lato"},
            palette: {
                type: "dark",
                background: {default: "#3b3b3f"},
                primary: {main: "#7f85a7"},
                secondary: {contrastText: "#ffffff"},
                default: {
                    main: grey[800],
                    light: grey[500],
                    dark: grey[900],
                },
                contrastThreshold: 2.26,
            },
        });
    });

    test("returns empty definition when theme is missing", () => {
        expect(getThemeDefinition("non-existent", "light")).toEqual({palette: undefined});
    });
});
