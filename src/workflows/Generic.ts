import fs from "fs-extra";
import {i18n as i18next} from "i18next";
import $_ from "lodash";
import moment from "moment";
import path from "path";
import puppeteer, {Browser, LaunchOptions, Page} from "puppeteer";

import puppeteerOptions from "../common/PuppeteerOptions";
import {IReporter, ProgressInfo, Reporter} from "../common/Reporter";

let page: Page;
let browser: Browser;
let reporter: IReporter;

const navigateToPage = async (url: string) => {
    reporter.update("Loading Agresso", 5);
    await page.goto(url, {
        waitUntil: ["networkidle0", "domcontentloaded", "load"],
        timeout: puppeteerOptions.timeout,
    });
};

export const execute = async (options: LaunchOptions, i18n: i18next, onProgress: (data: ProgressInfo) => void) => {
    try {
        const result: any = {warnings: [], errors: []};
        await i18n.changeLanguage("en");
        reporter = new Reporter(onProgress);
        reporter.start(i18n.t("starting"));

        browser = await puppeteer.launch($_.merge(puppeteerOptions, options));
        [page] = await browser.pages();
        const url = "https://test.pl"; // config.url;
        let totalHours = 0;
        let invoiceItemNo = 1;

        const processData = async () => {
            reporter.update(i18n.t("loadingAgresso"), 5);
            await navigateToPage(url);

            reporter.update(i18n.t("authenticating"), 5);
        };

        reporter.finish("Done", result);
    } catch (error: any) {
        let result: any = {errors: []};

        reporter.finish("Done", result);
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
    browser.close();
    browser.disconnect();
};

export default execute;
