jest.mock("./FileSystem", () => require("@tests/mocks/common/FileSystem"));

describe("PuppeteerOptions", () => {
    test("exposes expected launch options", () => {
        jest.isolateModules(() => {
            const fileSystem = require("./FileSystem") as {getProfilePath: jest.Mock};
            fileSystem.getProfilePath.mockReset();
            fileSystem.getProfilePath.mockReturnValue("/mock/profile");

            const {PuppeteerOptions} = require("./PuppeteerOptions");

            expect(fileSystem.getProfilePath).toHaveBeenCalledTimes(1);
            expect(PuppeteerOptions.headless).toBe(false);
            expect(PuppeteerOptions.userDataDir).toBe("/mock/profile/user-data-dir");
            expect(PuppeteerOptions.timeout).toBe(15000);
            expect(PuppeteerOptions.devtools).toBe(false);
            expect(PuppeteerOptions.defaultViewport).toEqual({width: 1280, height: 800});
            expect(PuppeteerOptions.args).toEqual(
                expect.arrayContaining([
                    "--disable-infobars",
                    "--window-size=1280,800",
                    "--no-sandbox",
                    "--disable-extensions",
                ]),
            );
            expect(PuppeteerOptions.ignoreDefaultArgs).toEqual(["--enable-automation"]);
        });
    });

    test("exports mobile chrome user agent", () => {
        jest.isolateModules(() => {
            const {UserAgent} = require("./PuppeteerOptions");

            expect(UserAgent).toContain("Mozilla/5.0 (Linux; Android 10; K)");
            expect(UserAgent).toContain("Chrome/130.0.0.0");
        });
    });
});
