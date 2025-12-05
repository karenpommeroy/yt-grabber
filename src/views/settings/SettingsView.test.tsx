import {spawn} from "child_process";
import path from "path";
import versionInfo from "win-version-info";

import {act, fireEvent, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {FormatScope, MultiMatchAction, SortOrder, TabsOrderKey} from "../../common/Media";
import {ApplicationOptions} from "../../common/Store";
import {createApplicationOptions} from "../../common/TestHelpers";
import {useAppContext} from "../../react/contexts/AppContext";
import SettingsView from "./SettingsView";

jest.mock("win-version-info", () => require("@tests/mocks/win-version-info"));
jest.mock("../../react/contexts/AppContext", () => require("@tests/mocks/react/contexts/AppContext"));
jest.mock("usehooks-ts", () => require("@tests/mocks/usehooks-ts"));
jest.mock("child_process", () => require("@tests/mocks/child-process"));

const storeGetMock = store.get as jest.Mock;
const storeSetMock = store.set as jest.Mock;
const versionInfoMock = versionInfo as jest.MockedFunction<typeof versionInfo>;
const spawnMock = spawn as jest.MockedFunction<typeof spawn>;
const useAppContextMock = useAppContext as jest.MockedFunction<typeof useAppContext>;

let applicationOptions: ApplicationOptions;

const mockStoreGet = () => {
    storeGetMock.mockImplementation((key: string) => {
        if (key === "application") {
            return {
                ...applicationOptions,
                tabsOrder: [...(applicationOptions.tabsOrder ?? [TabsOrderKey.Default, SortOrder.Asc])] as [TabsOrderKey, SortOrder],
            };
        }

        if (key === "application.ytdlpExecutablePath") {
            return applicationOptions.ytdlpExecutablePath;
        }

        return undefined;
    });
};

beforeEach(() => {
    jest.clearAllMocks();
    applicationOptions = createApplicationOptions();
    mockStoreGet();
    storeSetMock.mockReset();
    versionInfoMock.mockReset();
    versionInfoMock.mockReturnValue({FileVersion: "2023.01"});
    spawnMock.mockReset();
    spawnMock.mockReturnValue({
        on: jest.fn(),
    } as any);
});

describe("SettingsView", () => {
    test("navigates away when close button is clicked", async () => {
        const shell = await render(<SettingsView />);

        const closeButton = shell.getByRole("button", {name: "close"});
        fireEvent.click(closeButton);

        const context = useAppContextMock.mock.results.at(-1)?.value;
        expect(context?.actions.setLocation).toHaveBeenCalledWith("/");
    });

    test("persists download settings when toggled", async () => {
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const singlesCheckbox = shell.getByLabelText("downloadSinglesAndEps") as HTMLInputElement;
        expect(singlesCheckbox.checked).toBe(false);

        fireEvent.click(singlesCheckbox);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({downloadSinglesAndEps: true})
        ));
    });

    test("toggles download albums flag", async () => {
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const albumsCheckbox = shell.getByLabelText("downloadAlbums") as HTMLInputElement;
        expect(albumsCheckbox.checked).toBe(true);

        fireEvent.click(albumsCheckbox);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({downloadAlbums: false})
        ));
    });

    test("shows validation error for invalid template tokens", async () => {
        const shell = await render(<SettingsView />);
        const templateInput = shell.getByLabelText("albumOutputTemplate") as HTMLInputElement;

        fireEvent.change(templateInput, {target: {value: "{{invalid}}"}});

        await waitFor(() => expect(shell.getByText("invalidTemplateKeys")).toBeInTheDocument());
    });

    test("clears template validation error when tokens are valid", async () => {
        const shell = await render(<SettingsView />);
        const templateInput = shell.getByLabelText("albumOutputTemplate") as HTMLInputElement;

        fireEvent.change(templateInput, {target: {value: "{{invalid}}"}});
        await waitFor(() => expect(shell.getByText("invalidTemplateKeys")).toBeInTheDocument());

        fireEvent.change(templateInput, {target: {value: "{{artist}}/{{albumTitle}}"}});

        await waitFor(() => expect(shell.queryByText("invalidTemplateKeys")).not.toBeInTheDocument());
    });

    test("refreshes yt-dlp version after update completes", async () => {
        versionInfoMock.mockImplementationOnce(() => ({FileVersion: "2023.01"}))
            .mockImplementationOnce(() => ({FileVersion: "2024.02"}))
            .mockReturnValue({FileVersion: "2024.02"});

        let closeHandler: (() => void) | undefined;
        const onMock = jest.fn((event: string, handler: () => void) => {
            if (event === "close") {
                closeHandler = handler;
            }
        });

        spawnMock.mockReturnValue({
            on: onMock,
        } as any);

        const shell = await render(<SettingsView />);

        await waitFor(() => expect(shell.getByText("ytdlpVersion: 2023.01")).toBeInTheDocument());

        const updateButton = shell.getByRole("button", {name: "update"});
        fireEvent.click(updateButton);

        expect(spawnMock).toHaveBeenCalledWith(store.get("application.ytdlpExecutablePath"), ["-U"], {shell: true});
        expect(closeHandler).toBeDefined();

        await act(async () => {
            closeHandler?.();
        });

        await waitFor(() => expect(shell.getByText("ytdlpVersion: 2024.02")).toBeInTheDocument());
    });

    test("toggles tabs order sort and persists", async () => {
        applicationOptions = createApplicationOptions({tabsOrder: [TabsOrderKey.Artist, SortOrder.Asc]});
        storeSetMock("application.tabsOrder", [TabsOrderKey.Artist, SortOrder.Asc]);
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const toggleButton = shell.container.querySelector("[data-help=\"tabsOrder\"] button") as HTMLButtonElement;
        fireEvent.click(toggleButton);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({tabsOrder: [TabsOrderKey.Artist, SortOrder.Desc]}),
        ));
    });

    test("updates youtube url and writes to store", async () => {
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const urlInput = shell.getByLabelText("youtubeUrl") as HTMLInputElement;
        fireEvent.change(urlInput, {target: {value: "https://example.com/channel"}});

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({youtubeUrl: "https://example.com/channel"}),
        ));
    });

    test("updates chrome executable path and writes to store", async () => {
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const chromeInput = shell.getByLabelText("chromeExecutablePath") as HTMLInputElement;
        fireEvent.change(chromeInput, {target: {value: "C:/chrome.exe"}});
        fireEvent.blur(chromeInput, {target: {value: "C:/chrome.exe"}});

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({chromeExecutablePath: "C:/chrome.exe"}),
        ), {timeout: 2000});
    });

    test("resets output directory to default when cleared", async () => {
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const outputInput = shell.getByLabelText("outputDirectory") as HTMLInputElement;
        fireEvent.change(outputInput, {target: {value: ""}});
        fireEvent.blur(outputInput, {target: {value: ""}});

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({outputDirectory: path.resolve("./output")}),
        ));
    });

    test("persists overwrite setting toggles", async () => {
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const overwriteSwitch = shell.getByLabelText("alwaysOverwrite") as HTMLInputElement;
        expect(overwriteSwitch.checked).toBe(false);

        fireEvent.click(overwriteSwitch);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({alwaysOverwrite: true}),
        ));
    });

    test("persists merge parts setting", async () => {
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const mergeSwitch = shell.getByLabelText("mergeParts") as HTMLInputElement;
        expect(mergeSwitch.checked).toBe(true);

        fireEvent.click(mergeSwitch);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({mergeParts: false}),
        ));
    });

    test("updates concurrency value", async () => {
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const concurrencyInput = shell.getByLabelText("concurrency") as HTMLInputElement;
        fireEvent.change(concurrencyInput, {target: {value: "8"}});

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({concurrency: 8}),
        ));
    });

    test("updates format scope selection", async () => {
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const tabScopeRadio = shell.getByLabelText("formatScopeTab") as HTMLInputElement;
        fireEvent.click(tabScopeRadio);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({formatScope: FormatScope.Tab}),
        ));
    });

    test("updates multi match action selection", async () => {
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const askRadio = shell.getByLabelText("multiMatchActionAsk") as HTMLInputElement;
        fireEvent.click(askRadio);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({multiMatchAction: MultiMatchAction.Ask}),
        ));
    });

    test("updates custom yt-dlp args and persists", async () => {
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const argsInput = shell.getByLabelText("customYtdlpArgs") as HTMLInputElement;
        fireEvent.change(argsInput, {target: {value: "--proxy socks5://localhost:1080"}});

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({customYtdlpArgs: "--proxy socks5://localhost:1080"}),
        ));
    });

    test("changes tabs order key and persists", async () => {
        applicationOptions = createApplicationOptions({tabsOrder: [TabsOrderKey.Default, SortOrder.Asc]});
        mockStoreGet();
        const shell = await render(<SettingsView />);

        await waitFor(() => expect(storeSetMock).toHaveBeenCalled());
        storeSetMock.mockClear();

        const selectInput = shell.container.querySelector("[data-help=\"tabsOrderField\"] input") as HTMLInputElement;
        fireEvent.change(selectInput, {target: {value: TabsOrderKey.Artist}});

        await waitFor(() => expect(storeSetMock).toHaveBeenCalledWith(
            "application",
            expect.objectContaining({tabsOrder: [TabsOrderKey.Artist, SortOrder.Asc]}),
        ));
    });
});
