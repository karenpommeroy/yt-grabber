import {ColorMode} from "../../common/Theme";
import {actions, AppActions} from "./AppActions";

describe("AppActions", () => {
    test("dispatches correct payloads", () => {
        const dispatch = jest.fn();
        const appActions = actions(dispatch);

        appActions.setLocation("/home");
        appActions.setTheme("dark");
        appActions.setMode(ColorMode.Dark);
        appActions.setLoading(true);
        appActions.setHelp(true);

        expect(dispatch).toHaveBeenCalledTimes(5);
        expect(dispatch).toHaveBeenNthCalledWith(1, {type: AppActions.SetLocation, location: "/home"});
        expect(dispatch).toHaveBeenNthCalledWith(2, {type: AppActions.SetTheme, theme: "dark"});
        expect(dispatch).toHaveBeenNthCalledWith(3, {type: AppActions.SetMode, mode: "dark"});
        expect(dispatch).toHaveBeenNthCalledWith(4, {type: AppActions.SetLoading, loading: true});
        expect(dispatch).toHaveBeenNthCalledWith(5, {type: AppActions.SetHelp, help: true});
    });
});
