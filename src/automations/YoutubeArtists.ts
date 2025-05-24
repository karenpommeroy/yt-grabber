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

import {GetYoutubeParams, GetYoutubeResult} from "../common/Messaging";
import puppeteerOptions, {UserAgent} from "../common/PuppeteerOptions";
import {IReporter, ProgressInfo, Reporter} from "../common/Reporter";
import {MessageHandlerParams} from "../messaging/MessageChannel";
import {clearInput, navigateToPage, setCookies} from "./Helpers";
import {
    AlbumFilterSelector, AlbumLinkSelector, AlbumsDirectLinkSelector, AlbumsHrefSelector,
    SingleFilterSelector, SingleLinkSelector, SinglesDirectLinkSelector, SinglesHrefSelector,
    YtMusicArtistBestResultLinkSelector, YtMusicArtistsChipSelector, YtMusicSearchInputSelector,
    YtMusicSearchResultsSelector
} from "./Selectors";

let page: Page;
let browser: Browser;
let reporter: IReporter<GetYoutubeResult>;

puppeteer.use(StealthPlugin());

export const execute = async (parameters: MessageHandlerParams) => {
    const {params, options, i18n, onUpdate, signal} = parameters;
    const abortPromise = new Promise((_, reject) => {
        signal.addEventListener("abort", () => reject(new Error("aborted")));
    });

    try {
        await Promise.race([
            run(params, options, i18n, onUpdate),
            abortPromise,
        ]);
    } catch (error: any) {
        const result: GetYoutubeResult = {errors: [], sources: params.values};
        
        if (error.message === "aborted") {
            throw error;
        } else if (error instanceof TimeoutError) {
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

const run = async (params: GetYoutubeParams, options: LaunchOptions, i18n: i18next, onUpdate: (data: ProgressInfo<GetYoutubeResult>) => void) => {
    const result: GetYoutubeResult = {warnings: [], errors: [], values: [], sources: params.values};
    await i18n.changeLanguage(params.lang);
    
    reporter = new Reporter(onUpdate);
    reporter.start(i18n.t("starting"));
    browser = await puppeteer.launch(_merge(puppeteerOptions, options));
    [page] = await browser.pages();
    
    await page.setUserAgent(UserAgent);
    await setCookies(page);
    await navigateToPage(params.url, page);
    
    const process = async (artist: string) => {
        const results: string[] = [];
        const searchInput = await page.waitForSelector(`::-p-xpath(${YtMusicSearchInputSelector})`, {timeout: 1000});
        await clearInput(searchInput, page);
        await searchInput.type(artist);
        page.keyboard.press("Enter");
        await page.waitForNetworkIdle();
        
        const artistChannelUrl = await getArtistUrl(params);
        
        await navigateToPage(artistChannelUrl, page);
        await page.waitForNetworkIdle();

        const albums = await getAlbums(params);
        results.push(...albums);
        
        if (params.options?.downloadSinglesAndEps) {
            await navigateToPage(artistChannelUrl, page);
            await page.waitForNetworkIdle();

            const singles = await getSingles(params);
            results.push(...singles);
        }

        return results
    };

    for (const a of params.values) {
        result.values.push(...await process(a));
    }

    reporter.finish("done", result);
};

const getArtistUrl = async (params: GetYoutubeParams): Promise<string> => {
    try {
        const artistsChip = await page.waitForSelector(`::-p-xpath(${YtMusicArtistsChipSelector})`, {visible: true, timeout: 1000});

        artistsChip.click();
        await page.waitForNetworkIdle();
        await page.waitForSelector(`::-p-xpath(${YtMusicSearchResultsSelector})`, {timeout: 1000});
        
        const artistsElements = await page.$$(`::-p-xpath(${YtMusicSearchResultsSelector})`);
        const artistEl = artistsElements[0];
        const artistChannelUrl = await artistEl.evaluate((el) => el.getAttribute("href"));
        
        return `${params.url}/${artistChannelUrl}`;
    } catch (error) {
        const artistThumbnail = await page.waitForSelector(`::-p-xpath(${YtMusicArtistBestResultLinkSelector})`, {visible: true, timeout: 1000});
        const artistChannelUrl = await artistThumbnail.evaluate((el) => el.getAttribute("href"));
        
        return `${params.url}/${artistChannelUrl}`;
    }
}

const getAlbums = async (params: GetYoutubeParams): Promise<string[]> => {
    const results: string[] = [];

    try {
        const element = await page.waitForSelector(`::-p-xpath(${AlbumsHrefSelector})`, {timeout: 1000});
        const albumsUrl = await element.evaluate((el) => el.getAttribute("href"));

        await navigateToPage(`${params.url}/${albumsUrl}`, page);
        
        try {
            const albumFilterButton = await page.waitForSelector(`::-p-xpath(${AlbumFilterSelector})`, {timeout: 1000});
        
            albumFilterButton.click();
            await page.waitForNetworkIdle();
            
        } catch (e) {
            console.log("Albums already filtered");
        } finally {
            const items = await page.$$eval(`xpath/${AlbumLinkSelector}`, (elements) => elements.map((el) => el.getAttribute("href")));

            for (const item of items) {
                results.push(`${params.url}/${item}`);
            }

            return results;
        }
    } catch (error) {
        const albums = await page.$$eval(`xpath/${AlbumsDirectLinkSelector}`, (elements) => elements.map((el) => el.getAttribute("href")));

        for (const item of albums) {
            results.push(`${params.url}/${item}`);
        }

        return results;
    }
};

const getSingles = async (params: GetYoutubeParams): Promise<string[]> => {
    const results: string[] = [];

    try {
        const element = await page.waitForSelector(`::-p-xpath(${SinglesHrefSelector})`, {timeout: 1000});
        const singlesUrl = await element.evaluate((el) => el.getAttribute("href"));

        await navigateToPage(`${params.url}/${singlesUrl}`, page);
        
        try {
            const singleFilterButton = await page.waitForSelector(`::-p-xpath(${SingleFilterSelector})`, {timeout: 1000});
        
            singleFilterButton.click();
            await page.waitForNetworkIdle();
            
        } catch (e) {
            console.log("Singles already filtered");
        } finally {
            const items = await page.$$eval(`xpath/${SingleLinkSelector}`, (elements) => elements.map((el) => el.getAttribute("href")));

            for (const item of items) {
                results.push(`${params.url}/${item}`);
            }

            return results;
        }
    } catch (error) {
        const singles = await page.$$eval(`xpath/${SinglesDirectLinkSelector}`, (elements) => elements.map((el) => el.getAttribute("href")));

        for (const item of singles) {
            results.push(`${params.url}/${item}`);
        }

        return results;
    }
};

const closeResources = async () => {
    if (page) await page.close();
    if (browser) await browser.close();
};

export default execute;
