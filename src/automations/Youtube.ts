import fs from "fs-extra";
import {i18n as i18next} from "i18next";
import _forEach from "lodash/forEach";
import _includes from "lodash/includes";
import _isEmpty from "lodash/isEmpty";
import _map from "lodash/map";
import _merge from "lodash/merge";
import _replace from "lodash/replace";
import {Browser, LaunchOptions, Page, TimeoutError} from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import {getProfilePath} from "../common/FileSystem";
import {waitFor} from "../common/Helpers";
import {GetYoutubeUrlParams, GetYoutubeUrlResult} from "../common/Messaging";
import puppeteerOptions from "../common/PuppeteerOptions";
import {IReporter, ProgressInfo, Reporter} from "../common/Reporter";
import {navigateToPage} from "./Helpers";
import {
    AlbumFilterSelector, AlbumLinkSelector, AlbumsDirectLinkSelector, AlbumsHrefSelector
} from "./Selectors";

let page: Page;
let browser: Browser;
let reporter: IReporter<GetYoutubeUrlResult>;

puppeteer.use(StealthPlugin());



export const execute = async (
    params: GetYoutubeUrlParams,
    options: LaunchOptions,
    i18n: i18next,
    onProgress: (data: ProgressInfo<GetYoutubeUrlResult>) => void,
) => {
    try {
        const result: GetYoutubeUrlResult = {warnings: [], errors: [], urls: []};
        const userAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.3";
        
        await i18n.changeLanguage(params.lang);
        
        reporter = new Reporter(onProgress);
        reporter.start(i18n.t("starting"));
        browser = await puppeteer.launch(_merge(puppeteerOptions, options));
        [page] = await browser.pages();
        
        await page.setUserAgent(userAgent);
        
        const cachedCookies = fs.readJSONSync(getProfilePath() + "/cookies.json", {throws: false});

        if (_isEmpty(cachedCookies)) {
            await waitFor(3000);
            const pageCookies = await page.cookies();
            
            fs.writeJSONSync(getProfilePath() + "/cookies.json", pageCookies, {spaces: 2});

            await page.setCookie(...pageCookies);
        } else {
            await page.setCookie(...cachedCookies);
        }

        await navigateToPage(params.url, page);
        
        const process = async (urlToProcess: string) => {
            const results: string[] = [];
            
            try {                
                await navigateToPage(urlToProcess, page);

                const element = await page.waitForSelector(`::-p-xpath(${AlbumsHrefSelector})`, {timeout: 1000});
                const albumsUrl = await element.evaluate((el) => el.getAttribute("href"));

                await navigateToPage(`${params.url}/${albumsUrl}`, page);
                const albumFilterButton = await page.waitForSelector(`::-p-xpath(${AlbumFilterSelector})`, {timeout: 1000});

                albumFilterButton.click();
                await page.waitForNetworkIdle();
                
                const items = await page.$$eval(`xpath/${AlbumLinkSelector}`, (elements) => elements.map((el) => el.getAttribute("href")));

                for (const item of items) {
                    results.push(`${params.url}/${item}`);
                }

                return results;
            } catch (error) {
                const items = await page.$$eval(`xpath/${AlbumsDirectLinkSelector}`, (elements) => elements.map((el) => el.getAttribute("href")));

                for (const item of items) {
                    results.push(`${params.url}/${item}`);
                }

                return results;
            }
        };

        for (const u of params.artistUrls) {
            const data = await process(u);
           
            result.urls.push(...data);
        }

        reporter.finish("done", result);
    } catch (error: any) {
        const result: GetYoutubeUrlResult = {errors: []};
        
        if (error instanceof TimeoutError) {
            result.errors.push({title: i18n.t("exceptionTimeout"), description: i18n.t("exceptionTimeoutText")});
        } else {
            if (error.message === "Navigating frame was detached") {
                result.warnings.push({title: i18n.t("exceptionGetYoutubeUrls"), description: i18n.t("exceptionGetYoutubeUrlsText", {error: error.name})});
            } else {
                result.errors.push({title: i18n.t("exceptionGetYoutubeUrls"), description: i18n.t("exceptionGetYoutubeUrlsText", {error: error.name})});
            }
        }
        
        reporter.finish("done", result);
        console.error("Execution failed at stage: ", error.stack);
    } finally {
        await closeResources();
    }
};

const closeResources = async () => {
    if (page) await page.close();
    if (browser) await browser.close();
};

export const cancel = async () => {
    if (browser) await browser.close();
    if (browser) await browser.disconnect();
};

export default execute;
