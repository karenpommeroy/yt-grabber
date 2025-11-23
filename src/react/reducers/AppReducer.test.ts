import {ColorMode} from "../../common/Theme";
import {AppActions} from "../actions/AppActions";
import reducer from "./AppReducer";

describe("AppReducer", () => {
    const initialState = {
        location: "/",
        theme: "light",
        mode: ColorMode.Light,
        loading: false,
        help: false,
    } as const;

    test("handles SetLocation", () => {
        const next = reducer({...initialState}, {type: AppActions.SetLocation, location: "/home"});
        expect(next).toEqual({...initialState, location: "/home"});
    });

    test("handles SetTheme", () => {
        const next = reducer({...initialState}, {type: AppActions.SetTheme, theme: "dark"});
        expect(next).toEqual({...initialState, theme: "dark"});
    });

    test("handles SetMode", () => {
        const next = reducer({...initialState}, {type: AppActions.SetMode, mode: ColorMode.Dark});
        expect(next).toEqual({...initialState, mode: "dark"});
    });

    test("handles SetLoading", () => {
        const next = reducer({...initialState}, {type: AppActions.SetLoading, loading: true});
        expect(next).toEqual({...initialState, loading: true});
    });

    test("handles SetHelp", () => {
        const next = reducer({...initialState}, {type: AppActions.SetHelp, help: true});
        expect(next).toEqual({...initialState, help: true});
    });

    test("throws on unsupported action", () => {
        expect(() => reducer({...initialState}, {type: "UNKNOWN" as any})).toThrow();
    });
});
