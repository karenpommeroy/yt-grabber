import {spawn} from "child_process";
import versionInfo from "win-version-info";

import {act, fireEvent, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {SortOrder, TabsOrderKey} from "../../common/Media";
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

    test("shows validation error for invalid template tokens", async () => {
        const shell = await render(<SettingsView />);
        const templateInput = shell.getByLabelText("albumOutputTemplate") as HTMLInputElement;

        fireEvent.change(templateInput, {target: {value: "{{invalid}}"}});

        await waitFor(() => expect(shell.getByText("invalidTemplateKeys")).toBeInTheDocument());
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

        expect(spawnMock).toHaveBeenCalledWith(applicationOptions.ytdlpExecutablePath, ["-U"], {shell: true});
        expect(closeHandler).toBeDefined();

        await act(async () => {
            closeHandler?.();
        });

        await waitFor(() => expect(shell.getByText("ytdlpVersion: 2024.02")).toBeInTheDocument());
    });
});
