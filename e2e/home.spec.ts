
import fs from "fs-extra";
import {ElectronApplication, Page} from "playwright";

import {expect, test} from "@playwright/test";

import {clearInputPanelTextField, createUrlTestInput, getElectronApp, getMainPage} from "./helpers";

let app: ElectronApplication;
let page: Page;
const operationTimeout = 60000;

test.beforeAll(async () => {
    app =  await getElectronApp();
});

test.beforeEach(async () => {
    page = await getMainPage(app);
});

test.afterAll(async () => {
    await app.close();
});

test("renders home view with all required ui elements", async () => {
    await expect(page.getByTestId("app-title")).toHaveText(/YT\s*GRABBER/i);
    await expect(page).toHaveTitle(/(Youtube|YouTube)\s+Grabber/i);
    await expect(page.getByTestId("help-button")).toBeVisible();
    await expect(page.getByTestId("language-picker")).toBeVisible();
    await expect(page.getByTestId("settings-button")).toBeVisible();
    await expect(page.getByTestId("input-panel")).toBeVisible();
    await expect(page.getByTestId("info-bar")).toBeVisible();
});

test("renders language picker correctly", async () => {
    const languagePicker = page.getByTestId("language-picker");
    const languagePickerMenu = languagePicker.getByTestId("language-picker-menu");
    const languagePickerTrigger = languagePicker.getByTestId("language-picker-trigger");
    await expect(languagePicker).toBeVisible();
    
    await languagePickerTrigger.click();
    const languageItemsCount = await languagePickerMenu.locator("[role='menuitem']").count();
    expect(languageItemsCount).toEqual(3);

    await page.mouse.click(0, 0);
    await expect(languagePickerMenu).not.toBeVisible();
    await expect(languagePickerTrigger.getByTestId("language-flag")).toHaveCSS("background-image", new RegExp(`resources\\/locales\\/${"en-GB"}\\/flag\\.svg`));
    
    await languagePickerTrigger.click();
    await languagePickerMenu.locator("[role='menuitem'][value='de-DE']").click();
    await expect(languagePickerMenu).not.toBeVisible();
    await expect(languagePickerTrigger.getByTestId("language-flag")).toHaveCSS("background-image", new RegExp(`resources\\/locales\\/${"de-DE"}\\/flag\\.svg`));

    await languagePickerTrigger.click();
    await languagePickerMenu.locator("[role='menuitem'][value='pl-PL']").click();
    await expect(languagePickerMenu).not.toBeVisible();
    await expect(languagePickerTrigger.getByTestId("language-flag")).toHaveCSS("background-image", new RegExp(`resources\\/locales\\/${"pl-PL"}\\/flag\\.svg`));

    await languagePickerTrigger.click();
    await languagePickerMenu.locator("[role='menuitem'][value='en-GB']").click();
    await expect(languagePickerTrigger.getByTestId("language-flag")).toHaveCSS("background-image", new RegExp(`resources\\/locales\\/${"en-GB"}\\/flag\\.svg`));
});

test("renders input panel correctly", async () => {
    const testInput = createUrlTestInput();
    const inputField = page.getByTestId("input-field");

    await clearInputPanelTextField(page);

    await expect(page.getByTestId("load-info-button")).toBeDisabled();
    await expect(page.getByTestId("download-all-button")).toBeDisabled();
    await expect(page.getByTestId("cancel-all-button")).not.toBeVisible();
    await expect(page.getByTestId("load-from-file-button")).toBeEnabled();

    const inputModeButton = page.getByTestId("input-mode-button");
    await inputModeButton.getByRole("button").click();

    await expect(inputModeButton.getByRole("menuitem", {name: "autodetect"})).toBeVisible();
    await expect(inputModeButton.getByRole("menuitem", {name: "artists"})).toBeVisible();
    await expect(inputModeButton.getByRole("menuitem", {name: "albums"})).toBeVisible();
    await expect(inputModeButton.getByRole("menuitem", {name: "songs"})).toBeVisible();
    
    await inputModeButton.getByRole("menuitem", {name: "artists"}).click();
    await expect(page.getByTestId("advanced-search-options-panel")).toBeVisible();

    await page.getByTestId("advanced-search-options-panel").getByRole("button").click();
    await expect(page.getByTestId("release-date-from-field")).toBeInViewport();
    await expect(page.getByTestId("release-date-until-field")).toBeInViewport();
    await expect(page.getByTestId("download-albums-checkbox")).toBeInViewport();
    await expect(page.getByTestId("download-singles-checkbox")).toBeInViewport();

    await page.getByTestId("advanced-search-options-panel").getByRole("button").click();
    await expect(page.getByTestId("release-date-from-field")).not.toBeInViewport();
    await expect(page.getByTestId("release-date-until-field")).not.toBeInViewport();
    await expect(page.getByTestId("download-albums-checkbox")).not.toBeInViewport();
    await expect(page.getByTestId("download-singles-checkbox")).not.toBeInViewport();

    await inputModeButton.getByRole("button").click();
    await inputModeButton.getByRole("menuitem", {name: "autodetect"}).click();    
    
    await inputField.getByRole("combobox").click();
    await inputField.getByRole("combobox").fill(testInput.url);
    await inputField.getByRole("combobox").press("Enter");

    await expect(page.getByTestId("load-info-button")).not.toBeDisabled();
    await expect(page.getByTestId("download-all-button")).not.toBeDisabled();
    await expect(page.getByTestId("cancel-all-button")).not.toBeVisible();
});

test("renders format selector correctly", async () => {
    const testInput = createUrlTestInput();
    const inputField = page.getByTestId("input-field");
    await clearInputPanelTextField(page);

    await inputField.getByRole("combobox").click();
    await inputField.getByRole("combobox").fill(testInput.url);
    await inputField.getByRole("combobox").press("Enter");
    
    await page.getByTestId("load-info-button").click();

    await expect(page.getByTestId("tab-content-loading-indicator")).toBeVisible();
    await expect(page.getByTestId("tab-content-loading-indicator")).not.toBeVisible({timeout: operationTimeout});

    const mediaTypeSelect = page.getByTestId("media-type-select");
    await mediaTypeSelect.click();
    
    const audioOption = mediaTypeSelect.getByLabel("audio");
    const videoOption = mediaTypeSelect.getByLabel("video");

    await expect(audioOption).toBeVisible();
    await expect(videoOption).toBeVisible();
    
    await audioOption.click();
    await expect(audioOption).toBeHidden();
    await expect(videoOption).toBeHidden();

    const audioQualityField = page.getByTestId("media-quality-field");
    await expect(audioQualityField).toBeVisible();

    const audioQualityInput = audioQualityField.getByLabel("Audio Quality");
    const numberFieldButtons = await audioQualityField.getByRole("button").all();
    
    await numberFieldButtons[0].click();
    await expect(audioQualityInput).toHaveValue("9");
    await numberFieldButtons[0].click();
    await expect(audioQualityInput).toHaveValue("8");
    await numberFieldButtons[1].click();
    await expect(audioQualityInput).toHaveValue("9");
    await numberFieldButtons[1].click();
    await expect(audioQualityInput).toHaveValue("10");

    const mediaFormatSelect = page.getByTestId("media-format-select");
    await mediaFormatSelect.click();
    
    await expect(mediaFormatSelect.getByLabel("mp3")).toBeVisible();
    await expect(mediaFormatSelect.getByLabel("wav")).toBeVisible();
    await expect(mediaFormatSelect.getByLabel("flac")).toBeVisible();
    await expect(mediaFormatSelect.getByLabel("m4a")).toBeVisible();
    
    await mediaFormatSelect.click();

    await mediaTypeSelect.click();
    await videoOption.click();
    await mediaFormatSelect.click();

    await expect(mediaFormatSelect.getByLabel("mp4")).toBeVisible();
    await expect(mediaFormatSelect.getByLabel("mkv")).toBeVisible();
    await expect(mediaFormatSelect.getByLabel("mov")).toBeVisible();
    await expect(mediaFormatSelect.getByLabel("avi")).toBeVisible();
    await expect(mediaFormatSelect.getByLabel("mpeg")).toBeVisible();
    await expect(mediaFormatSelect.getByLabel("gif")).toBeVisible();

    await mediaFormatSelect.click();

    const mediaResolutionSelect = page.getByTestId("media-resolution-select");
    await expect(mediaResolutionSelect).toBeVisible();
    await mediaResolutionSelect.click();
    
    await expect(mediaResolutionSelect.getByLabel("3840x2160 (2160p)")).toBeVisible();
    await expect(mediaResolutionSelect.getByLabel("2560x1440 (1440p)")).toBeVisible();
    await expect(mediaResolutionSelect.getByLabel("1920x1080 (1080p)")).toBeVisible();
    await expect(mediaResolutionSelect.getByLabel("1280x720 (720p)")).toBeVisible();
    await expect(mediaResolutionSelect.getByLabel("854x480 (480p)")).toBeVisible();
    await expect(mediaResolutionSelect.getByLabel("640x360 (360p)")).toBeVisible();
    await expect(mediaResolutionSelect.getByLabel("426x240 (240p)")).toBeVisible();
    await expect(mediaResolutionSelect.getByLabel("256x144 (144p)")).toBeVisible();
    
    await mediaResolutionSelect.click();
    
    await mediaFormatSelect.click();
    await mediaFormatSelect.getByLabel("gif").click();
    
    await expect(page.getByRole("button", {name: "Text options for GIFs"})).toBeVisible();
    await expect(page.getByRole("textbox", {name: "Top text"})).toBeVisible();
    await expect(page.getByRole("textbox", {name: "Bottom text"})).toBeVisible();
});

test("loads media info", async () => {
    const testInput = createUrlTestInput();
    const inputField = page.getByTestId("input-field");

    const inputModeButton = page.getByTestId("input-mode-button");
    await inputModeButton.getByRole("button").click();
    await inputModeButton.getByRole("menuitem", {name: "Auto"}).click();

    await clearInputPanelTextField(page);

    await inputField.getByRole("combobox").click();
    await inputField.getByRole("combobox").fill(testInput.url);
    await inputField.getByRole("combobox").press("Enter");

    await expect(page.getByTestId("load-from-file-button")).toBeEnabled();
    await expect(page.getByTestId("load-info-button")).toBeEnabled();
    await expect(page.getByTestId("download-all-button")).toBeEnabled();
    await expect(page.getByTestId("cancel-all-button")).not.toBeVisible();
    
    await inputField.getByRole("combobox").press("Control+Enter");
    
    await expect(page.getByTestId("cancel-all-button")).toBeVisible();
    await expect(page.getByTestId("load-from-file-button")).toBeDisabled();
    await expect(page.getByTestId("load-info-button")).toBeDisabled();
    await expect(page.getByTestId("download-all-button")).not.toBeVisible();
    
    await expect(page.getByTestId("tab-content-loading-indicator")).toBeVisible();
    const tabCount = await page.getByRole("tab").count();
    expect(tabCount).toEqual(1);
    
    await expect(page.getByTestId("tab-content-loading-indicator")).not.toBeVisible({timeout: operationTimeout});

    await expect(page.getByRole("tab")).toBeVisible();
    await expect(page.getByRole("img", {name: "Test1"})).toBeVisible();
    await expect(page.getByText("Title:")).toBeVisible();
    await expect(page.getByText("Artist:")).toBeVisible();
    await expect(page.getByText("Release Year:")).toBeVisible();
    await expect(page.getByText("Duration:")).toBeVisible();
    await expect(page.getByTestId("track-icon")).toBeVisible();
    await expect(page.getByRole("listitem").getByTestId("track-text")).toBeVisible();
    
    const mediaInfoPanel = page.getByTestId("media-info-panel");
    await mediaInfoPanel.hover();

    await expect(mediaInfoPanel.getByTestId("edit-button")).toBeVisible();
    await expect(mediaInfoPanel.getByTestId("cut-button")).toBeVisible();
    await expect(mediaInfoPanel.getByTestId("download-playlist-button")).toBeVisible();
    await expect(mediaInfoPanel.getByTestId("open-in-browser-button")).toBeVisible();
    await expect(mediaInfoPanel.getByTestId("open-output-dir-button")).not.toBeVisible();
    await expect(mediaInfoPanel.getByTestId("cancel-download-playlist-button")).not.toBeVisible();

    const trackItem = page.getByTestId("track-list").getByRole("listitem");
    await trackItem.hover();

    await expect(trackItem.getByTestId("edit-track-button")).toBeVisible();
    await expect(trackItem.getByTestId("cut-track-button")).toBeVisible();
    await expect(trackItem.getByTestId("open-track-in-browser-button")).toBeVisible();
    await expect(trackItem.getByTestId("download-track-button")).toBeVisible();
    await expect(trackItem.getByTestId("find-file-button")).not.toBeVisible();
    await expect(trackItem.getByTestId("cancel-download-track-button")).not.toBeVisible();

    const closeTabButton = page.getByRole("tablist").getByTestId("CloseIcon");
    await closeTabButton.click();
    expect(await page.getByRole("tab").count()).toEqual(0);
});

test("open in browser button works correctly", async () => {
    const testInput = createUrlTestInput();
    const inputField = page.getByTestId("input-field");
    
    await app.evaluate(({shell}) => {
        (global as any).__originalOpenExternal = shell.openExternal;
        (global as any).__openedUrls = [];
        shell.openExternal = async (url: string) => {
            (global as any).__openedUrls.push(url);
            return Promise.resolve();
        };
    });

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
    const openInBrowserButton = mediaInfoPanel.getByTestId("open-in-browser-button");

    await mediaInfoPanel.hover();
    await expect(openInBrowserButton).toBeVisible();
    await openInBrowserButton.click();

    const urls = await app.evaluate(() => {
        return (global as any).__openedUrls || [];
    });

    expect(urls).toContain(testInput.url);

    await app.evaluate(({shell}) => {
        if ((global as any).__originalOpenExternal) {
            shell.openExternal = (global as any).__originalOpenExternal;
            delete (global as any).__originalOpenExternal;
            delete (global as any).__openedUrls;
        }
    });
});

test("load from file button works correctly", async () => {
    const testInput = createUrlTestInput();
    const loadFromFileButton = page.getByTestId("load-from-file-button");
    
    await clearInputPanelTextField(page);

    await expect(loadFromFileButton).toBeEnabled();
    await expect(loadFromFileButton.locator("svg")).toBeVisible();
    
    await loadFromFileButton.hover();
    await expect(page.getByRole("tooltip", {name: "Load from file"})).toBeVisible();
    
    const fileChooserPromise = page.waitForEvent("filechooser");
    await loadFromFileButton.click();
    const fileChooser = await fileChooserPromise;
    
    expect(fileChooser.isMultiple()).toBe(false);
    
    const fileInput = page.getByTestId("input-field").locator("input[type='file']");
    await expect(fileInput).toHaveAttribute("accept", ".txt,.json");
    await fileChooser.setFiles([]);
    
    const inputField = page.getByTestId("input-field");
    await inputField.getByRole("combobox").click();
    await inputField.getByRole("combobox").fill(testInput.url);
    await inputField.getByRole("combobox").press("Enter");
    
    await page.getByTestId("load-info-button").click();
    
    await expect(page.getByTestId("tab-content-loading-indicator")).toBeVisible();
    await expect(loadFromFileButton).toBeDisabled();
    
    await expect(page.getByTestId("tab-content-loading-indicator")).not.toBeVisible({timeout: operationTimeout});
    await expect(loadFromFileButton).toBeEnabled();
});

test("renders media image modal correctly", async () => {
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
    await mediaInfoPanel.getByRole("img").click();

    const modal = page.getByTestId("image-modal");
    await expect(modal).toBeVisible();
    await expect(modal.locator("h2")).toHaveText("Test1");
    await expect(modal.getByRole("img", {name: "Test1"})).toBeVisible();
    await modal.getByTestId("close-button").click();
    
    await expect(modal).not.toBeVisible();

    await mediaInfoPanel.getByRole("img", {name: "Test1"}).click();
    await expect(modal).toBeVisible();
    await page.mouse.click(0, 0);

    await expect(modal).not.toBeVisible();

    await mediaInfoPanel.getByRole("img", {name: "Test1"}).click();
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
});
