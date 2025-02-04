import contentDisposition from "content-disposition";
import $_ from "lodash";
import {setTimeout} from "node:timers/promises";
import path from "path";
import {Browser, ElementHandle, Frame, Page} from "puppeteer";
import puppeteer from "puppeteer-extra";
import pluginStealth from "puppeteer-extra-plugin-stealth";

import {getDataPath} from "./Paths";

export const setTitle = async (title: string, page: Page) => {
    return page.evaluate((data) => (document.title = data), title);
};

export const createPreview = async (page: Page, id: string) => {
    const previewPath = path.resolve(getDataPath() + `/jobs/${id}/preview.png`);
    return page.screenshot({ path: previewPath });
};

export const isHeadless = async (browser: Browser) => {
    return $_.includes(await browser.version(), "Headless");
};

export const decode = (value: string) => {
    return Buffer.from(value, "base64").toString("ascii");
};

export const encode = (value: string) => {
    return Buffer.from(value).toString("base64");
};

export const getOutputDir = (config: any) => {
    return path.normalize(path.resolve(config.outputDir));
};

export const doubleClick = async (selector: string, page: Page) => {
    await page.click(selector);
    await page.click(selector, { count: 2 });
};

export const dbClickSlow = async (selector: string, page: Page) => {
    const element = await page.$(selector);

    if (!element) return;

    await element.click();
    await setTimeout(200);
    await element.click({ count: 2 });
};

export const tripleClick = async (selector: string | ElementHandle<Element>, page: Page) => {
    const input = typeof selector === "string" ? await page.$(selector) : selector;

    if (!input) return;

    await input.click({ count: 3 });
};

export const clickOutOfView = async (selector: string, page: Page) => {
    const link = await page.$(selector);
    if (link) return clickOnPage(selector, page);
};

export const clickOnPage = async (selector: string, page: Page) => {
    return page.evaluate((value) => document.querySelector<HTMLElement>(value)?.click(), selector);
};

export const clickXPathOutOfView = async (xpath: string, page: Page) => {
    const element = await page.waitForSelector(xpath);
    if (element) {
        await page.evaluate<any>((item) => item.click(), (await page.$$(xpath))[0]);
    }
};

export const clearInput = async (selector: string | ElementHandle<Element>, page: Page) => {
    await tripleClick(selector, page);
    await page.keyboard.press("Delete");
};

export const getElementTextContent = async (xPath: string, page: Page) => {
    const element = await page.$$(xPath);

    return page.evaluate((el: any) => el.textContent, $_.first(element));
};

export const clickInShadowRoot = async (xpath: string, page: Page) => {
    try {
        const element = await page.waitForSelector(xpath, { timeout: 8000 });

        if (element) {
            return page.evaluate((item) => {
                return item.shadowRoot
                    ?.querySelector<HTMLButtonElement>("button[slot='action-slot'].second-button")
                    ?.click();
            }, (await page.$$(xpath))[0]);
        }

        return Promise.resolve();
    } catch (error) {
        return Promise.resolve(error);
    }
};

export const getElementFromShadowRoot = async (xpath: string, page: Page) => {
    try {
        const element = await page.waitForSelector(xpath, { timeout: 8000 });

        if (element) {
            return page.evaluate((item) => {
                return item.shadowRoot
                    ?.querySelector<HTMLButtonElement>("button[slot='action-slot'].second-button")
                    ?.click();
            }, (await page.$$(xpath))[0]);
        }

        return;
    } catch (error) {
        return;
    }
};

export const setRequestInterceptors = async (page: Page, filters: any[]) => {
    if ($_.isEmpty(filters)) return;

    await page.setRequestInterception(true);

    page.on("request", (req) => {
        if ($_.includes(filters, req.resourceType())) {
            return req.abort();
        }

        return req.continue();
    });
};

export const useStealth = async (browser: Browser) => {
    const shouldUseStealth = $_.get(global, "config.useStealth");

    if (!shouldUseStealth) {
        return;
    }

    puppeteer.use(pluginStealth());
};

export const runScript = async (content: string, page: Page) => {
    return page.evaluate((data) => Promise.resolve(eval(data)), content);
};

export const waitUntilSelectorTextContains = async (selector: string, text: string, page: Page) =>
    page.waitForFunction(
        (selectorString: any, textString: any) => {
            const item = document.querySelector(selectorString);

            return item && item.textContent && item.textContent.indexOf(textString) !== -1;
        },
        { polling: "mutation" },
        selector,
        text,
    );

export const waitUntilSelectorTextEquals = async (selector: string, text: string, page: Page) =>
    page.waitForFunction(
        (selectorString: any, textString: any) => {
            const item = document.querySelector(selectorString);

            return item && item.textContent === textString;
        },
        { polling: "mutation" },
        selector,
        text,
    );

export const waitForBufferResponse = async (
    url: string,
    reqMethod: string,
    status: number,
    size: { min: number },
    expectedHeaders: any,
    page: Page,
) =>
    new Promise((resolve: any, reject: any) => {
        page.on("response", async (response: any) => {
            if (!$_.includes(response.url(), url) || response.request().method() !== reqMethod) return response;

            const buffer = await response.buffer();
            const statusOk = response.status() === status;
            const sizeOk = buffer.length >= size.min;

            if (!statusOk || !sizeOk) return reject();

            $_.forEach(expectedHeaders, (value: string, key: string) => {
                if (!$_.includes($_.lowerCase(response.headers()[key]), $_.lowerCase(value))) return reject();
            });

            return resolve(buffer);
        });
    });

export const waitForFileContentResponse = async (
    url: string,
    reqMethod: string,
    status: number,
    expectedHeaders: any,
    page: Page,
): Promise<any> =>
    new Promise((resolve: any, reject: any) => {
        page.on("response", async (response: any) => {
            if (!$_.includes(response.url(), url) || response.request().method() !== reqMethod) {
                return response;
            }
            const statusOk = response.status() === status;

            if (!statusOk) return reject();

            $_.forEach(expectedHeaders, (value: string, key: string) => {
                if (!$_.includes($_.lowerCase(response.headers()[key]), $_.lowerCase(value))) {
                    return reject();
                }
            });
            // const parsed = contentDisposition.parse(response.headers()["content-disposition"]);
            return resolve(response.buffer());
            // return resolve($_.get(parsed, "parameters.filename"));
        });
    });

export const waitForFileResponse = async (
    url: string,
    reqMethod: string,
    status: number,
    expectedHeaders: any,
    page: Page,
): Promise<any> =>
    new Promise((resolve: any, reject: any) => {
        page.on("response", async (response: any) => {
            if (!$_.includes(response.url(), url) || response.request().method() !== reqMethod) {
                return response;
            }
            const statusOk = response.status() === status;

            if (!statusOk) return reject();

            $_.forEach(expectedHeaders, (value: string, key: string) => {
                if (!$_.includes($_.lowerCase(response.headers()[key]), $_.lowerCase(value))) {
                    return reject();
                }
            });
            const parsed = contentDisposition.parse(response.headers()["content-disposition"]);

            return resolve($_.get(parsed, "parameters.filename"));
        });
    });

export const count = async (selector: string, frame: Frame) => {
    return (await frame.$$(selector)).length;
};

export const exists = async (selector: string, frame: Frame) => {
    return !!(await frame.$(selector));
};

export const clickLink = async (selector: string, page: Page) =>
    Promise.all([page.waitForNavigation(), page.click(selector)]);

export const getXPathElement = async (xpath: string, page: Page) => $_.first(await page.$$(xpath));

export const queryShadowDom = async (page: Page, selector: string) => {
    return page.evaluateHandle((input) => {
        const shadowSeparator = "::shadow";
        const parts = input.split(shadowSeparator).map((item: string) => item.trim());
        const endsWithShadow = input.endsWith(shadowSeparator);

        const element = parts.reduce((total: any, current: any, index: number, arr: string[]) => {
            const selected = total.querySelector(current);
            if (index < arr.length - 1 || endsWithShadow) {
                return selected.shadowRoot;
            }

            return selected;
        }, document);

        return element;
    }, selector);
};

export const retry = async (handler: any, params: any[], attempts = 5) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await handler(...params);

            resolve(result);
        } catch (error) {
            if (attempts === 0) {
                reject(error);
            } else {
                const result = await retry(handler, params, attempts - 1);
                resolve(result);
            }
        }
    });
};
