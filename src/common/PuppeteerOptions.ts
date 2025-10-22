import {LaunchOptions} from "puppeteer-core";

import {getProfilePath} from "./FileSystem";

const width = 1280;
const height = 800;

export const UserAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.3";

export const PuppeteerOptions: LaunchOptions = {
    headless: false,
    userDataDir: getProfilePath() + "/user-data-dir",
    defaultViewport: {
        width,
        height,
    },
    timeout: 15000,
    devtools: false,
    args: [
        "--disable-infobars",
        `--window-size=${width},${height}`,
        "--disable-extensions",
        "--mute-audio",
        "--disable-background-timer-throttling",
        "--no-sandbox",
        "--incognito",
        "--disable-setuid-sandbox",
        "--disable-autofill-keyboard-accessory-view",
        "--disable-password-generation",
        "--disable-save-password-bubble",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-dev-shm-usage",
        "--disable-prompt-on-repost",
        "--disable-notifications",
        "--disable-accelerated-2d-canvas",
        "--hide-crash-restore-bubble",
        "--no-zygote",
        "--webview-disable-safebrowsing-support",
        "--autoplay-policy=no-user-gesture-required",
        "--use-fake-ui-for-media-stream",
        "--disable-crash-reporter",
        "--disable-site-isolation-trials",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
};

export default PuppeteerOptions;
