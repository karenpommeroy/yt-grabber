
import fs from "fs-extra";
import moment from "moment";
import path from "path";
import {ElectronApplication, Page} from "playwright";

import {expect, test} from "@playwright/test";

import {
    clearInputPanelTextField, createTestTrackCuts, createUrlTestInput, getElectronApp, getMainPage,
    removeFiles
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

test("modifying track details works correctly", async () => {
    const testInput = createUrlTestInput();
    const inputField = page.getByTestId("input-field");
    
    const inputModeButton = page.getByTestId("input-mode-button");
    await inputModeButton.getByRole("button").click();
    await inputModeButton.getByRole("menuitem", {name: "auto"}).click();

    await clearInputPanelTextField(page);

    await inputField.getByRole("combobox").click();
    await inputField.getByRole("combobox").fill(testInput.url);
    await inputField.getByRole("combobox").press("Control+Enter");

    await expect(page.getByTestId("tab-content-loading-indicator")).toBeVisible();
    await expect(page.getByTestId("tab-content-loading-indicator")).not.toBeVisible({timeout: operationTimeout});

    const mediaInfoPanel = page.getByTestId("media-info-panel");
    const trackList = page.getByTestId("track-list");

    await mediaInfoPanel.hover();
    
    await mediaInfoPanel.getByTestId("edit-button").click();

    const playlistDetailsModal = page.getByTestId("playlist-details-modal");
    await expect(playlistDetailsModal).toBeVisible();
    await expect(playlistDetailsModal.locator("h2")).toHaveText("Edit media details");
    const artistInput = playlistDetailsModal.getByLabel("Artist");
    const playlistTitleInput = playlistDetailsModal.getByLabel("Title");
    const yearInput = playlistDetailsModal.getByLabel("Release Year");
    
    await expect(artistInput).toBeVisible();
    await expect(playlistTitleInput).toBeVisible();
    await expect(yearInput).toBeVisible();

    await artistInput.click();
    await artistInput.clear(); 
    await artistInput.fill("Test Artist");

    await playlistTitleInput.click();
    await playlistTitleInput.clear(); 
    await playlistTitleInput.fill("Test Playlist Title");
    
    await yearInput.click();
    await yearInput.clear(); 
    await yearInput.fill("2024");

    await playlistDetailsModal.getByTestId("close-button").click();
    await expect(playlistDetailsModal).not.toBeVisible();

    const trackItem = trackList.getByRole("listitem");
    await trackItem.hover();
    await expect(trackItem.getByTestId("edit-track-button")).toBeVisible();
    await trackItem.getByTestId("edit-track-button").click();
    const trackDetailsModal = page.getByTestId("track-details-modal");
    await expect(trackDetailsModal).toBeVisible();

    const trackTitleInput = trackDetailsModal.getByLabel("Title");

    await trackTitleInput.click();
    await trackTitleInput.clear(); 
    await trackTitleInput.fill("Test Track Title");

    await trackDetailsModal.getByTestId("close-button").click();
    await expect(trackDetailsModal).not.toBeVisible();

    await mediaInfoPanel.hover();
    await mediaInfoPanel.getByTestId("download-playlist-button").click();

    await expect(page.getByTestId("cancel-download-playlist-button")).toBeVisible();
    await expect(page.getByTestId("cancel-download-playlist-button")).not.toBeVisible({timeout: 120000});

    const filePath = testInput.outputDir + "/" + "Test Artist - Test Track Title.mp3";
    expect(fs.existsSync(filePath)).toBeTruthy();
    fs.removeSync(filePath);
    expect(fs.existsSync(filePath)).toBeFalsy();
});

test("track cutting works correctly", async () => {
    const mm = await import("music-metadata");
    const testInput = createUrlTestInput();
    const testTrackCuts = createTestTrackCuts();
    
    const inputField = page.getByTestId("input-field");
    const inputModeButton = page.getByTestId("input-mode-button");
    await inputModeButton.getByRole("button").click();
    await inputModeButton.getByRole("menuitem", {name: "auto"}).click();

    await clearInputPanelTextField(page);

    await inputField.getByRole("combobox").click();
    await inputField.getByRole("combobox").fill(testInput.url);
    await inputField.getByRole("combobox").press("Control+Enter");

    await expect(page.getByTestId("tab-content-loading-indicator")).toBeVisible();
    await expect(page.getByTestId("tab-content-loading-indicator")).not.toBeVisible({timeout: operationTimeout});

    const trackList = page.getByTestId("track-list");
    const trackItem = trackList.getByRole("listitem");
    await trackItem.hover();
    await expect(trackItem.getByTestId("cut-track-button")).toBeVisible();
    await trackItem.getByTestId("cut-track-button").click();
    const trackCutPopup = page.getByTestId("track-cut-popup");
    await expect(trackCutPopup).toBeVisible();
    
    const addTrackCutButton = trackCutPopup.getByTestId("add-track-cut-button");

    for (const [index] of testTrackCuts.entries()) {
        if (index === 0) {
            continue;
        }
        await addTrackCutButton.click();
    }

    const trackCuts = await trackCutPopup.getByTestId("track-cut").all();
    
    for (const [index, trackCut] of trackCuts.entries()) {
        const fromInput = trackCut.getByLabel("from");
        const toInput = trackCut.getByLabel("to");
        
        await fromInput.click();
        await fromInput.fill(testTrackCuts[index].start);
        
        await toInput.click();
        await toInput.fill(testTrackCuts[index].end);
    };

    await addTrackCutButton.click();
    const lastCut = trackCutPopup.getByTestId("track-cut").last();
    await lastCut.getByTestId("delete-track-cut-button").click();

    await page.mouse.click(0, 0);
    await expect(trackCutPopup).not.toBeVisible();
    
    const outputDuration = testTrackCuts.reduce((acc, cut) => {
        const start = moment(cut.start, "mm:ss");
        const end = moment(cut.end, "mm:ss");
        const diff = end.diff(start, "seconds");
        return acc + diff;
    }, 0);

    await expect(trackItem.getByTestId("track-cuts")).toHaveText(`${moment(outputDuration, "ss").format("mm:ss")} (${testTrackCuts.length})`);

    await trackItem.hover();
    await trackItem.getByTestId("download-track-button").click();

    await expect(page.getByTestId("cancel-download-playlist-button")).toBeVisible();
    await expect(page.getByTestId("cancel-download-playlist-button")).not.toBeVisible({timeout: 120000});

    const outputFilePath = path.resolve(testInput.outputDir, testInput.filename + ".mp3");

    expect(fs.existsSync(outputFilePath)).toBeTruthy();
    const metadata = await mm.parseFile(outputFilePath);
    expect(metadata.format.duration).toBeCloseTo(outputDuration, 0);
    
    fs.removeSync(outputFilePath);
    expect(fs.existsSync(outputFilePath)).toBeFalsy();
});
