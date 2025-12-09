import {i18n as i18next} from "i18next";
import {merge} from "lodash-es";
import {Browser, LaunchOptions, Page, TimeoutError} from "puppeteer-core";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import {GetYoutubeParams, GetYoutubeResult} from "../common/Messaging";
import puppeteerOptions, {UserAgent} from "../common/PuppeteerOptions";
import {IReporter, ProgressInfo, Reporter} from "../common/Reporter";
import {MessageHandlerParams} from "../messaging/MessageChannel";
import {clearInput, navigateToPage, setCookies} from "./Helpers";
import {
    YtMusicSearchInputSelector, YtMusicSearchResultsArtistsLinkSelector, YtMusicSongsChipSelector
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
        const result: GetYoutubeResult = {errors: [], warnings: [], values: [], sources: params.values};
        if (error.message === "aborted") {
            throw error;
        }
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

const run = async (params: GetYoutubeParams, options: LaunchOptions, i18n: i18next, onUpdate: (data: ProgressInfo<GetYoutubeResult>) => void) => {
    const result: GetYoutubeResult = {warnings: [], errors: [], values: [], sources: params.values};
    await i18n.changeLanguage(params.lang);

    reporter = new Reporter(onUpdate);
    reporter.start(i18n.t("starting"));
    browser = await puppeteer.launch(merge(puppeteerOptions, options));
    [page] = await browser.pages();

    await page.setUserAgent(UserAgent);
    await setCookies(page);
    await navigateToPage(params.url, page);

    const process = async (song: string) => {
        const results: string[] = [];
        const trackUrlRegex = /^https?:\/\/.*watch/i;

        try {
            if (trackUrlRegex.test(song)) {
                results.push(song);

                return results;
            }
            
            const searchInput = await page.waitForSelector(`::-p-xpath(${YtMusicSearchInputSelector})`, {timeout: 1000});
            await clearInput(searchInput, page);
            await searchInput.type(song);
            page.keyboard.press("Enter");
            await page.waitForNetworkIdle();

            const songsChip = await page.waitForSelector(`::-p-xpath(${YtMusicSongsChipSelector})`, {timeout: 1000});

            songsChip.click();
            await page.waitForNetworkIdle();

            await page.waitForSelector(`::-p-xpath(${YtMusicSearchResultsArtistsLinkSelector})`, {timeout: 1000});

            const songsElements = await page.$$(`::-p-xpath(${YtMusicSearchResultsArtistsLinkSelector})`);
            const songEl = songsElements[0];
            const songUrl = await songEl.evaluate((el) => el.getAttribute("href"));

            results.push(`${params.url}/${songUrl}`);

            return results;
        } catch (error) {

            return results;
        }
    };

    for (const item of params.values) {
        const data = await process(item);

        result.values.push(...data);
    }

    reporter.finish("done", result);
};

const closeResources = async () => {
    if (page) await page.close();
    if (browser) await browser.close();
};

export default execute;
