import {fireEvent, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {InputMode} from "../../../common/Media";
import {useDataState} from "../../../react/contexts/DataContext";
import InputPanel from "./InputPanel";

jest.mock("../../../react/contexts/DataContext", () => require("@tests/mocks/react/contexts/DataContext"));

afterEach(() => {
    jest.clearAllMocks();
});

const storeGet = store.get as jest.Mock;
const storeSet = store.set as jest.Mock;
const dataStateMock = useDataState as jest.Mock;

const setupStore = (overrides: Record<string, any> = {}) => {
    const app = {
        inputMode: InputMode.Artists,
        showAdvancedSearchOptions: true,
        downloadAlbums: true,
        downloadSinglesAndEps: false,
        debugMode: false,
        ...overrides,
    };
    storeGet.mockImplementation((key: string) => {
        if (key === "application") return app;
        if (key === "application.inputMode") return app.inputMode;
        return undefined;
    });
};

const setupData = (overrides: Partial<ReturnType<typeof useDataState>> = {}) => {
    dataStateMock.mockReturnValue({
        trackStatus: [],
        urls: ["https://youtu.be/abc123def45"],
        setUrls: jest.fn(),
        ...overrides,
    } as any);
};

describe("InputPanel", () => {
    test("ctrl+enter triggers load info", async () => {
        setupStore();
        const setUrls = jest.fn();
        setupData({urls: ["https://youtu.be/abc123def45"], setUrls});
        const onLoadInfo = jest.fn();

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={onLoadInfo} />);

        const input = shell.getByLabelText(/artistOrArtists/i);
        fireEvent.keyUp(input, {key: "Enter", ctrlKey: true});

        await waitFor(() => expect(onLoadInfo).toHaveBeenCalledWith(["https://youtu.be/abc123def45"], undefined, undefined));
    });

    test("loads info with years on click", async () => {
        setupStore();
        setupData();
        const onLoadInfo = jest.fn();

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={onLoadInfo} />);

        fireEvent.change(shell.getByLabelText(/fromYear/i), {target: {value: "1990"}});
        fireEvent.change(shell.getByLabelText(/untilYear/i), {target: {value: "2020"}});

        const loadInfoButton = shell.container.querySelector("[data-help=\"loadInfo\"]") as HTMLButtonElement;
        fireEvent.click(loadInfoButton);

        await waitFor(() => expect(onLoadInfo).toHaveBeenCalledWith(["https://youtu.be/abc123def45"], "1990", "2020"));
    });

    test("triggers download all", async () => {
        setupStore();
        setupData();
        const onDownload = jest.fn();

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onLoadInfo={jest.fn()} onCancel={jest.fn()} onDownload={onDownload} />);

        const downloadButton = shell.container.querySelector("[data-help=\"downloadAll\"]") as HTMLButtonElement;
        fireEvent.click(downloadButton);

        expect(onDownload).toHaveBeenCalledWith(["https://youtu.be/abc123def45"]);
    });

    test("disables actions when invalid urls present", async () => {
        setupStore({inputMode: InputMode.Auto});
        setupData({urls: ["invalid-url"]});

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onLoadInfo={jest.fn()} onCancel={jest.fn()} onDownload={jest.fn()} />);

        const downloadButton = shell.container.querySelector("[data-help=\"downloadAll\"]") as HTMLButtonElement;
        const loadInfoButton = shell.container.querySelector("[data-help=\"loadInfo\"]") as HTMLButtonElement;

        expect(downloadButton).toBeDisabled();
        expect(loadInfoButton).toBeDisabled();
    });

    test("shows download failed button when errors present", async () => {
        setupStore();
        setupData({trackStatus: [{error: true} as any]});
        const onDownloadFailed = jest.fn();

        const shell = await render(<InputPanel onDownload={jest.fn()} onLoadInfo={jest.fn()} onCancel={jest.fn()} onDownloadFailed={onDownloadFailed} />);

        const retryButton = shell.container.querySelector("[data-help=\"downloadFailed\"]") as HTMLButtonElement;
        expect(retryButton).toBeInTheDocument();
        fireEvent.click(retryButton);

        expect(onDownloadFailed).toHaveBeenCalled();
    });

    test("shows cancel when loading", async () => {
        setupStore();
        setupData();
        const onCancel = jest.fn();

        const shell = await render(<InputPanel loading onDownload={jest.fn()} onDownloadFailed={jest.fn()} onLoadInfo={jest.fn()} onCancel={onCancel} />);

        const cancelButton = shell.container.querySelector("[data-help=\"cancellAll\"]") as HTMLButtonElement;
        expect(cancelButton).toBeInTheDocument();
        fireEvent.click(cancelButton);

        expect(onCancel).toHaveBeenCalled();
    });

    test("load from file disabled when loading", async () => {
        setupStore();
        setupData();

        const shell = await render(<InputPanel loading onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);

        const loadFromFileButton = shell.container.querySelector("[data-help=\"loadFromFile\"]") as HTMLButtonElement;
        expect(loadFromFileButton).toBeDisabled();
    });

    test("load from file triggers file input click", async () => {
        setupStore();
        setupData();
        const onLoadInfo = jest.fn();
        const fileClick = jest.spyOn(HTMLInputElement.prototype, "click");

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={onLoadInfo} />);

        const loadFromFileButton = shell.container.querySelector("[data-help=\"loadFromFile\"]") as HTMLButtonElement;
        fireEvent.click(loadFromFileButton);

        expect(fileClick).toHaveBeenCalled();
    });

    test("persists application options changes", async () => {
        setupStore();
        setupData();

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);

        const downloadSinglesCheckbox = shell.getByRole("checkbox", {name: /downloadSinglesAndEps/i});
        fireEvent.click(downloadSinglesCheckbox);

        await waitFor(() => expect(storeSet).toHaveBeenCalledWith("application", expect.objectContaining({downloadSinglesAndEps: true})));
    });

    test("advanced search accordion renders only for artist mode", async () => {
        setupStore({inputMode: InputMode.Artists});
        setupData();

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);
        expect(shell.getByTestId("data-provider").textContent).not.toBeUndefined();
        expect(shell.container.querySelector("[data-help=\"showAdvancedSearchOptions\"]")).toBeInTheDocument();

        setupStore({inputMode: InputMode.Auto});
        setupData();
        const shellAuto = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);
        expect(shellAuto.container.querySelector("[data-help=\"showAdvancedSearchOptions\"]")).toBeNull();
    });
});
