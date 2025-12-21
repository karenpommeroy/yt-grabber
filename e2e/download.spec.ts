import fs from "fs-extra";
import path from "path";
import {ElectronApplication, Page} from "playwright";

import {expect, test} from "@playwright/test";

import {
    clearInputPanelTextField, createArtistTestInput, createUrlTestInput, getElectronApp,
    getMainPage, removeFiles
} from "./helpers";

let app: ElectronApplication;
let page: Page;
const operationTimeout = 60000;

test.beforeAll(async () => {
    app =  await getElectronApp();
});

test.beforeEach(async () => {
    page = await getMainPage(app);

    removeFiles("./output", ["Marcin Karpiński", "Test"]);
});

test.afterAll(async () => {
    await app.close();
});

test("downloads media immediately", async () => {
    const testInput = createUrlTestInput();
    const inputField = page.getByTestId("input-field");
    
    const inputModeButton = page.getByTestId("input-mode-button");
    await inputModeButton.getByRole("button").click();
    await inputModeButton.getByRole("menuitem", {name: "Auto"}).click();
    
    await clearInputPanelTextField(page);

    await inputField.getByRole("combobox").click();
    await inputField.getByRole("combobox").fill(testInput.url);
    await inputField.getByRole("combobox").press("Enter");

    await page.getByTestId("download-all-button").click();
    
    await expect(page.getByTestId("cancel-all-button")).toBeVisible();
    await expect(page.getByTestId("download-all-button")).not.toBeVisible();
    
    await expect(page.getByTestId("tab-content-loading-indicator")).toBeVisible();
    await expect(page.getByTestId("tab-content-loading-indicator")).not.toBeVisible({timeout: operationTimeout});
    
    const mediaInfoPanel = page.getByTestId("media-info-panel");
    const trackList = page.getByTestId("track-list");
    await expect(page.getByTestId("cancel-download-playlist-button")).toBeVisible();

    await expect(page.getByRole("tab")).toBeVisible();
    await expect(page.getByRole("img", {name: "Test1"})).toBeVisible();
    await expect(mediaInfoPanel.getByText("Title")).toBeVisible();
    await expect(mediaInfoPanel.getByText("Artist:")).toBeVisible();
    await expect(mediaInfoPanel.getByText("Release Year:")).toBeVisible();
    await expect(mediaInfoPanel.getByText("Duration:")).toBeVisible();
    await expect(trackList.getByTestId("track-icon")).toBeVisible();
    await expect(trackList.getByRole("listitem").getByTestId("track-text")).toBeVisible();
    
    await expect(mediaInfoPanel.getByTestId("progress-bar")).toBeVisible();
    await expect(page.getByTestId("tab-progress")).toBeVisible();
    await expect(trackList.getByTestId("track-progress")).toBeVisible();

    await expect(page.getByTestId("cancel-download-playlist-button")).not.toBeVisible({timeout: operationTimeout});
    await expect(mediaInfoPanel.getByTestId("progress-bar")).not.toBeVisible();
    await expect(page.getByTestId("tab-progress")).not.toBeVisible();
    await expect(trackList.getByTestId("track-progress")).not.toBeVisible();
    await expect(trackList.getByTestId("track-completed-icon")).toBeVisible();
    await expect(trackList.getByTestId("track-status")).toHaveText("Done");

    const outputFilePath = path.resolve(testInput.outputDir, testInput.filename + ".mp3");

    expect(fs.existsSync(outputFilePath)).toBeTruthy();
    fs.removeSync(outputFilePath);
    expect(fs.existsSync(outputFilePath)).toBeFalsy();
});

test("downloads artist", async () => {
    const testInput = createArtistTestInput();
    const inputField = page.getByTestId("input-field");
    
    const inputModeButton = page.getByTestId("input-mode-button");
    await inputModeButton.getByRole("button").click();
    await inputModeButton.getByRole("menuitem", {name: "artists"}).click();
    
    await clearInputPanelTextField(page);

    await inputField.getByRole("combobox").click();
    await inputField.getByRole("combobox").fill(testInput.url);
    await inputField.getByRole("combobox").press("Enter");

    await page.getByTestId("load-info-button").click();
    await expect(page.getByTestId("tab-content-loading-indicator")).toBeVisible();
    await expect(page.getByTestId("tab-content-loading-indicator")).not.toBeVisible({timeout: operationTimeout});
    
    const mediaInfoPanel = page.getByTestId("media-info-panel");
    const trackList = page.getByTestId("track-list");

    await expect(page.getByRole("tab")).toBeVisible();
    await expect(mediaInfoPanel.getByRole("img")).toBeVisible();
    await expect(mediaInfoPanel.getByText("Title:")).toBeVisible();
    await expect(mediaInfoPanel.getByText("Artist:")).toBeVisible();
    await expect(mediaInfoPanel.getByText("Release Year:")).toBeVisible();
    await expect(mediaInfoPanel.getByText("Duration:")).toBeVisible();
    
    const trackCount = await trackList.getByRole("listitem").count();
    expect(trackCount).toEqual(10);
    
    await mediaInfoPanel.hover();
    await mediaInfoPanel.getByTestId("download-playlist-button").click();
    await expect(page.getByTestId("cancel-download-playlist-button")).toBeVisible();
    await expect(page.getByTestId("cancel-download-playlist-button")).not.toBeVisible({timeout: 120000});

    expect(fs.existsSync(testInput.outputDir)).toBeTruthy();
    fs.removeSync(testInput.outputDir);
    expect(fs.existsSync(testInput.outputDir)).toBeFalsy();
});

for (const format of ["mp3", "wav", "flac", "m4a"]) {
    test(`downloads audio as ${format}`, async () => {
        const testInput = createUrlTestInput();
        const inputField = page.getByTestId("input-field");
        
        const inputModeButton = page.getByTestId("input-mode-button");
        await inputModeButton.getByRole("button").click();
        await inputModeButton.getByRole("menuitem", {name: "auto"}).click();
            
        await clearInputPanelTextField(page);

        await inputField.getByRole("combobox").click();
        await inputField.getByRole("combobox").fill(testInput.url);
        await inputField.getByRole("combobox").press("Enter");

        await page.getByTestId("load-info-button").click();
        
        await expect(page.getByTestId("cancel-all-button")).toBeVisible();
        await expect(page.getByTestId("download-all-button")).not.toBeVisible();
        
        await expect(page.getByTestId("tab-content-loading-indicator")).toBeVisible();
        await expect(page.getByTestId("tab-content-loading-indicator")).not.toBeVisible({timeout: operationTimeout});
        
        const mediaTypeSelect = page.getByTestId("media-type-select");
        const mediaInfoPanel = page.getByTestId("media-info-panel");
        const mediaFormatSelect = page.getByTestId("media-format-select");
        const trackList = page.getByTestId("track-list");

        await mediaTypeSelect.click();
    
        const audioOption = mediaTypeSelect.getByLabel("audio");
        await audioOption.click();

        await mediaFormatSelect.click();

        await mediaFormatSelect.getByLabel(format).click();
        await mediaInfoPanel.hover();
        await mediaInfoPanel.getByTestId("download-playlist-button").click();

        await expect(mediaInfoPanel.getByTestId("cancel-download-playlist-button")).toBeVisible();
        await expect(mediaInfoPanel.getByTestId("progress-bar")).toBeVisible();
        await expect(page.getByTestId("tab-progress")).toBeVisible();
        await expect(trackList.getByTestId("track-progress")).toBeVisible();

        await expect(mediaInfoPanel.getByTestId("cancel-download-playlist-button")).not.toBeVisible({timeout: operationTimeout});
        await expect(trackList.getByTestId("track-progress")).not.toBeVisible();
        await expect(page.getByTestId("tab-progress")).not.toBeVisible();
        await expect(mediaInfoPanel.getByTestId("progress-bar")).not.toBeVisible();
        await expect(trackList.getByTestId("track-completed-icon")).toBeVisible();
        await expect(trackList.getByTestId("track-status")).toHaveText("Done");

        const outputFilePath = path.resolve(testInput.outputDir, testInput.filename + "." + format);

        expect(fs.existsSync(outputFilePath)).toBeTruthy();
        fs.removeSync(outputFilePath);
        expect(fs.existsSync(outputFilePath)).toBeFalsy();
    });
}

for (const format of ["mp4", "mkv", "mov", "avi", "mpeg", "gif"]) {
    test(`downloads video as ${format}`, async () => {
        const testInput = createUrlTestInput();
        const inputField = page.getByTestId("input-field");

        const inputModeButton = page.getByTestId("input-mode-button");
        await inputModeButton.getByRole("button").click();
        await inputModeButton.getByRole("menuitem", {name: "auto"}).click();

        await clearInputPanelTextField(page);

        await inputField.getByRole("combobox").click();
        await inputField.getByRole("combobox").fill(testInput.url);
        await inputField.getByRole("combobox").press("Enter");

        await page.getByTestId("load-info-button").click();
        
        await expect(page.getByTestId("cancel-all-button")).toBeVisible();
        await expect(page.getByTestId("download-all-button")).not.toBeVisible();
        
        await expect(page.getByTestId("tab-content-loading-indicator")).toBeVisible();
        await expect(page.getByTestId("tab-content-loading-indicator")).not.toBeVisible({timeout: operationTimeout});
        
        const mediaTypeSelect = page.getByTestId("media-type-select");
        const mediaInfoPanel = page.getByTestId("media-info-panel");
        const mediaFormatSelect = page.getByTestId("media-format-select");
        const mediaResolutionSelect = page.getByTestId("media-resolution-select");
        const trackList = page.getByTestId("track-list");

        await mediaTypeSelect.click();
    
        const videoOption = mediaTypeSelect.getByLabel("video");
        await videoOption.click();
        await mediaFormatSelect.click();
        await mediaFormatSelect.getByLabel(format).click();
        await mediaResolutionSelect.click();
        await mediaResolutionSelect.getByLabel("640x360 (360p)").click();

        await mediaInfoPanel.hover();
        await mediaInfoPanel.getByTestId("download-playlist-button").click();

        await expect(mediaInfoPanel.getByTestId("cancel-download-playlist-button")).toBeVisible();
        await expect(mediaInfoPanel.getByTestId("progress-bar")).toBeVisible();
        await expect(page.getByTestId("tab-progress")).toBeVisible();
        await expect(trackList.getByTestId("track-progress")).toBeVisible();

        await expect(mediaInfoPanel.getByTestId("cancel-download-playlist-button")).not.toBeVisible({timeout: 120000});
        await expect(trackList.getByTestId("track-progress")).not.toBeVisible();
        await expect(page.getByTestId("tab-progress")).not.toBeVisible();
        await expect(mediaInfoPanel.getByTestId("progress-bar")).not.toBeVisible();
        await expect(trackList.getByTestId("track-completed-icon")).toBeVisible();
        await expect(trackList.getByTestId("track-status")).toHaveText("Done");

        const outputFilePath = path.resolve(testInput.outputDir, testInput.filename + "." + format);

        expect(fs.existsSync(outputFilePath)).toBeTruthy();
        fs.removeSync(outputFilePath);
        expect(fs.existsSync(outputFilePath)).toBeFalsy();
    });
}
