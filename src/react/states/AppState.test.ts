import {ColorMode} from "../../common/Theme";
import {createDefaultState} from "./AppState";

describe("AppState", () => {
    test("createDefaultState returns frozen initial values", () => {
        const state = createDefaultState();

        expect(state).toEqual({
            location: "/",
            theme: "purple-rain",
            mode: ColorMode.Light,
            loading: false,
            help: false,
        });
        expect(Object.isFrozen(state)).toBe(true);
    });
});
