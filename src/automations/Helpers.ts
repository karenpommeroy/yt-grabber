import {ElementHandle, Page} from "puppeteer";

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
