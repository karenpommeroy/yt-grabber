import {findLatestBuild, parseElectronApp} from "electron-playwright-helpers";
import path from "path";
import {_electron as electron, ElectronApplication, Page} from "playwright";

import {expect, test} from "@playwright/test";

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
    const latestBuild = findLatestBuild("release");
    const appInfo = parseElectronApp(latestBuild);

    process.env.CI = "e2e";
    electronApp = await electron.launch({
        args: [appInfo.main],
        executablePath: path.resolve(__dirname, "..", "release", "win-unpacked", "yt-grabber.exe"),
    });
    electronApp.on("window", async (page) => {
        const filename = page.url()?.split("/").pop();
        
        console.log(`"Window opened: ${filename}`);
        page.on("pageerror", (error) => {
            console.error(error);
        });
        page.on("console", (msg) => {
            console.log(msg.text());
        });
    });
});

test.afterAll(async () => {
    await electronApp.close();
});

test("renders main page", async () => {
    page = await electronApp.firstWindow();
    await page.waitForSelector("#root");
    await page.waitForSelector("h6");

    const text = await page.$eval("h6", (el) => el.textContent);
    expect(text).toBe("YT GRABBER");

    const title = await page.title();
    expect(title).toBe("Youtube Grabber");
});
