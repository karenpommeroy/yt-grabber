import fs from "fs-extra";

import {getProfilePath} from "../common/FileSystem";
import {waitFor} from "../common/Helpers";
import {createInput, createPage} from "../common/TestHelpers";
import {clearInput, navigateToPage, setCookies} from "./Helpers";

jest.mock("fs-extra", () => require("@tests/mocks/fs-extra"));
jest.mock("../common/FileSystem", () => require("@tests/mocks/common/FileSystem"));
jest.mock("../common/Helpers", () => require("@tests/mocks/common/Helpers"));

describe("automation helpers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getProfilePath as jest.Mock).mockReturnValue("/profile");
    });

    test("navigateToPage forwards url and timeout options", async () => {
        const page = createPage();

        await navigateToPage("https://example.com", page);

        expect(page.goto).toHaveBeenCalledWith("https://example.com", {
            waitUntil: ["networkidle0", "domcontentloaded", "load"],
            timeout: 15000,
        });
    });

    test("clearInput selects content and presses backspace", async () => {
        const page = createPage();
        const input = createInput();

        await clearInput(input, page);

        expect((input as any).click).toHaveBeenCalledWith({clickCount: 3});
        expect(page.keyboard.press).toHaveBeenCalledWith("Backspace");
    });

    test("setCookies caches fresh cookies when cache empty", async () => {
        (fs.readJSONSync as jest.Mock).mockReturnValue(undefined);
        const pageCookies = [{name: "session", value: "abc"}];
        const page = createPage();
        page.cookies.mockResolvedValue(pageCookies);

        await setCookies(page);

        expect(waitFor).toHaveBeenCalledWith(3000);
        expect(page.cookies).toHaveBeenCalled();
        expect(fs.writeJSONSync).toHaveBeenCalledWith("/profile/cookies.json", pageCookies, {spaces: 2});
        expect(page.setCookie).toHaveBeenCalledWith(...pageCookies);
    });

    test("setCookies reuses cached cookies when available", async () => {
        const cachedCookies = [{name: "session", value: "cached"}];
        (fs.readJSONSync as jest.Mock).mockReturnValue(cachedCookies);
        const page = createPage();

        await setCookies(page);

        expect(waitFor).not.toHaveBeenCalled();
        expect(page.cookies).not.toHaveBeenCalled();
        expect(page.setCookie).toHaveBeenCalledWith(...cachedCookies);
        expect(fs.writeJSONSync).not.toHaveBeenCalled();
    });
});
