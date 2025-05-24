import fs from "fs-extra";
import _isEmpty from "lodash/isEmpty";
import {ElementHandle, Page} from "puppeteer";

import {getProfilePath} from "../common/FileSystem";
import {waitFor} from "../common/Helpers";
import puppeteerOptions from "../common/PuppeteerOptions";

export const navigateToPage = async (url: string, page: Page, timeout = puppeteerOptions.timeout) => {
    await page.goto(url, {
        waitUntil: ["networkidle0", "domcontentloaded", "load"],
        timeout,
    });
};

export const clearInput = async (input: ElementHandle<Element>, page: Page) => {
    await input.click({clickCount: 3});
    await page.keyboard.press("Backspace");
};

export const setCookies = async (page: Page) => {
    const cachedCookies = fs.readJSONSync(getProfilePath() + "/cookies.json", {throws: false});
    
    if (_isEmpty(cachedCookies)) {
        await waitFor(3000);
        const pageCookies = await page.cookies();
    
        fs.writeJSONSync(getProfilePath() + "/cookies.json", pageCookies, {spaces: 2});
    
        await page.setCookie(...pageCookies);
    } else {
        await page.setCookie(...cachedCookies);
    }
};
