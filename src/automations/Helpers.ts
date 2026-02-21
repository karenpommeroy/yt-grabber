import fs from "fs-extra";
import {includes, isEmpty} from "lodash-es";
import {ElementHandle, Page} from "puppeteer-core";

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
    
    if (isEmpty(cachedCookies)) {
        await waitFor(3000);
        const pageCookies = await page.cookies();
    
        fs.writeJSONSync(getProfilePath() + "/cookies.json", pageCookies, {spaces: 2});
    
        await page.setCookie(...pageCookies);
    } else {
        await page.setCookie(...cachedCookies);
    }
};

export const resolveValidYoutubePlaylistUrl = async (url: string, page: Page) => {
    if (includes(url, "browse")) {
        await navigateToPage(url, page);
        
        const canonicalHref = await page.$eval("link[rel=\"canonical\"]", (el) => (el as HTMLLinkElement).href);

        if (!canonicalHref) {
            return url;
        } else {
            const match = canonicalHref.match(/https:\/\/music\.youtube\.com\/playlist\?list=([^"&]+)/);

            return match[1] ? `https://music.youtube.com/playlist?list=${match[1]}` : url;
        }
    } else {
        return url;
    }
};
