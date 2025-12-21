import {findLatestBuild, parseElectronApp} from "electron-playwright-helpers";
import fs from "fs-extra";
import path from "path";
import {_electron as electron, ElectronApplication, Page} from "playwright";

export const getElectronApp = async (): Promise<ElectronApplication> => {
    const useDev = process.env.E2E_DEV === "true";
    let app: ElectronApplication;
    process.env.CI = "e2e";

    if (useDev) {
        app = await electron.launch({
            args: [path.resolve(__dirname, "..", "dist", "index.js")],
            executablePath: path.resolve(__dirname, "..", "node_modules", ".bin", "electron.cmd"),
            env: {
                ...process.env,
                NODE_ENV: "development",
            },
        });
    } else {
        const latestBuild = findLatestBuild("release");
        const appInfo = parseElectronApp(latestBuild);

        app = await electron.launch({
            args: [],
            executablePath: appInfo.executable ?? path.resolve(__dirname, "..", "release", "win-unpacked", "yt-grabber.exe"),
        });
    }
    
    app.on("window", async (page) => {
        const filename = page.url()?.split("/").pop();

        console.log(`Window opened: ${filename}`);
        
        page.on("pageerror", (error) => {
            console.error(error);
        });
        page.on("console", (msg) => {
            console.log(msg.text());
        });
    });

    return app;
};

export const getMainPage = async (app: ElectronApplication): Promise<Page> => {
    const page = await app.firstWindow();
    const hasRoot = await page.locator("#root").count().catch(() => 0);
    
    if (hasRoot > 0) {
        await page.waitForLoadState("domcontentloaded");
        await page.waitForSelector("#root");
        return page;
    }
    
    const mainPage = await new Promise<Page>((resolve) => {
        const checkWindows = async () => {
            const windows = app.windows();
            for (const win of windows) {
                const count = await win.locator("#root").count().catch(() => 0);
                if (count > 0) {
                    resolve(win);
                    return;
                }
            }

            setTimeout(checkWindows, 100);
        };
        checkWindows();
    });
    
    await mainPage.waitForLoadState("domcontentloaded");
    await mainPage.waitForSelector("#root");
    
    return mainPage;
};

export const removeFiles = (dir: string, prefixes: string[]) => {
    if (!fs.existsSync(dir)) {
        return;
    }
    
    fs.readdirSync(dir)
        .filter(f => prefixes.some((p) => f.startsWith(p)))
        .forEach(f => fs.removeSync(path.join(dir, f)));
};

export const clearInputPanelTextField = async (page: Page) => {
    const field = page.getByTestId("input-field");
    
    const inputValuesCount = await field.locator("[role='button']").filter({visible: true}).count();
    
    if (inputValuesCount === 0) {
        return;
    }

    await field.hover();

    const clearButton = field.getByRole("button", {name: "clear"});
    await clearButton.waitFor({state: "visible"});
    await clearButton.click();
};

export const createUrlTestInput = () => {
    return {
        url: "https://www.youtube.com/watch?v=7HExuxcTr_g",
        outputDir: "./output",
        filename: "Marcin Karpiński - Test1"
    };
};

export const createArtistTestInput = () => {
    return {
        url: "Nerville",
        outputDir: "./output/Nerville",
    };
};

export const createTestTrackCuts = () => {
    return [
        {start: "00:05", end: "00:10"},
        {start: "00:15", end: "00:20"},
        {start: "00:25", end: "00:30"},
    ];
};
