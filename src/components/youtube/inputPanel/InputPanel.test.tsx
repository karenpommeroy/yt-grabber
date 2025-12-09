import {act, fireEvent, waitFor} from "@testing-library/react";
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
    });
};

describe("InputPanel", () => {
    test("ctrl and enter triggers load info", async () => {
        setupStore();
        const setUrls = jest.fn();
        setupData({urls: ["https://youtu.be/abc123def45"], setUrls});
        const onLoadInfo = jest.fn();

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={onLoadInfo} />);

        const input = shell.getByLabelText(/artistOrArtists/i);
        fireEvent.keyUp(input, {key: "Enter", ctrlKey: true});

        await waitFor(() => expect(onLoadInfo).toHaveBeenCalledWith(["https://youtu.be/abc123def45"], "", ""));
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

    test("load info enabled when urls valid", async () => {
        setupStore({inputMode: InputMode.Auto});
        setupData({urls: ["https://youtu.be/abc123def45"]});

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onLoadInfo={jest.fn()} onCancel={jest.fn()} onDownload={jest.fn()} />);

        const loadInfoButton = shell.container.querySelector("[data-help=\"loadInfo\"]") as HTMLButtonElement;
        expect(loadInfoButton).not.toBeDisabled();
    });

    test("deletes url chip and calls onChange", async () => {
        setupStore({inputMode: InputMode.Auto});
        const setUrls = jest.fn();
        const onChange = jest.fn();
        setupData({urls: ["https://youtu.be/abc123def45", "https://youtu.be/xyz789abc12"], setUrls});

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onLoadInfo={jest.fn()} onCancel={jest.fn()} onDownload={jest.fn()} onChange={onChange} />);

        const deleteButtons = shell.container.querySelectorAll(".MuiChip-deleteIcon");
        expect(deleteButtons.length).toBeGreaterThan(0);

        fireEvent.click(deleteButtons[0]);

        expect(setUrls).toHaveBeenCalled();
        expect(onChange).toHaveBeenCalledWith(["https://youtu.be/xyz789abc12"]);
    });

    test("multi value change filters invalid and deduplicates", async () => {
        setupStore({inputMode: InputMode.Auto, debugMode: false});
        const setUrls = jest.fn();
        const onChange = jest.fn();
        setupData({urls: [], setUrls});

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} onChange={onChange} />);

        const input = shell.getByRole("combobox") as HTMLInputElement;

        fireEvent.change(input, {target: {value: "https://youtu.be/abc123def45"}});
        fireEvent.keyDown(input, {key: "Enter"});

        fireEvent.change(input, {target: {value: "invalid-url"}});
        fireEvent.keyDown(input, {key: "Enter"});

        fireEvent.change(input, {target: {value: "https://youtu.be/abc123def45"}});
        fireEvent.keyDown(input, {key: "Enter"});

        fireEvent.change(input, {target: {value: "https://youtu.be/def456ghi78"}});
        fireEvent.keyDown(input, {key: "Enter"});

        expect(setUrls.mock.calls).toEqual(expect.arrayContaining([
            ["https://youtu.be/abc123def45"],
            [],
            ["https://youtu.be/abc123def45"],
            ["https://youtu.be/def456ghi78"],
        ].map((args) => [args])));
        expect(onChange.mock.calls).toEqual(expect.arrayContaining([
            ["https://youtu.be/abc123def45"],
            [],
            ["https://youtu.be/abc123def45"],
            ["https://youtu.be/def456ghi78"],
        ].map((args) => [args])));
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

    test("hides download failed button when no errors", async () => {
        setupStore();
        setupData({trackStatus: []});

        const shell = await render(<InputPanel onDownload={jest.fn()} onLoadInfo={jest.fn()} onCancel={jest.fn()} onDownloadFailed={jest.fn()} />);

        const retryButton = shell.container.querySelector("[data-help=\"downloadFailed\"]");
        expect(retryButton).toBeNull();
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

    test("select file parses json and updates urls", async () => {
        setupStore({inputMode: InputMode.Auto, debugMode: false});
        const setUrls = jest.fn();
        const onChange = jest.fn();
        setupData({urls: [], setUrls});

        const fileContent = JSON.stringify([
            "https://youtu.be/abc123def45",
            "invalid-url",
            "https://youtu.be/abc123def45",
        ]);
        const file = new File([fileContent], "urls.json", {type: "application/json"});

        const readAsText = jest.fn(function(this: any) {
            this.onload?.({target: {result: fileContent}} as any);
        });
        const fileReaderSpy = jest.spyOn(global, "FileReader").mockImplementation(() => ({
            onload: null,
            readAsText,
        } as unknown as FileReader));

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} onChange={onChange} />);

        const fileInput = shell.container.querySelector("input[type=\"file\"]") as HTMLInputElement;
        fireEvent.change(fileInput, {target: {files: [file]}});

        expect(readAsText).toHaveBeenCalledWith(file);
        expect(setUrls).toHaveBeenCalledWith(["https://youtu.be/abc123def45"]);
        expect(onChange).toHaveBeenCalledWith(["https://youtu.be/abc123def45"]);
        expect(fileInput.value).toBe("");

        fileReaderSpy.mockRestore();
    });

    test("select file parses text lines and filters invalid", async () => {
        setupStore({inputMode: InputMode.Auto, debugMode: false});
        const setUrls = jest.fn();
        setupData({urls: [], setUrls});

        const fileContent = "https://youtu.be/abc123def45\ninvalid-url\nhttps://youtu.be/def456ghi78\n";
        const file = new File([fileContent], "urls.txt", {type: "text/plain"});

        const readAsText = jest.fn(function(this: any) {
            this.onload?.({target: {result: fileContent}} as any);
        });
        const fileReaderSpy = jest.spyOn(global, "FileReader").mockImplementation(() => ({
            onload: null,
            readAsText,
        } as unknown as FileReader));

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);

        const fileInput = shell.container.querySelector("input[type=\"file\"]") as HTMLInputElement;
        fireEvent.change(fileInput, {target: {files: [file]}});

        expect(readAsText).toHaveBeenCalledWith(file);
        expect(setUrls).toHaveBeenCalledWith(["https://youtu.be/abc123def45", "https://youtu.be/def456ghi78"]);

        fileReaderSpy.mockRestore();
    });

    test("persists application options changes", async () => {
        setupStore();
        setupData();

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);

        const downloadSinglesCheckbox = shell.getByRole("checkbox", {name: /downloadSinglesAndEps/i});
        fireEvent.click(downloadSinglesCheckbox);

        await waitFor(() => expect(storeSet).toHaveBeenCalledWith("application", expect.objectContaining({downloadSinglesAndEps: true})));
    });

    test("persists downloadAlbums option change", async () => {
        setupStore({downloadAlbums: true});
        setupData();

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);

        const downloadAlbumsCheckbox = shell.getByRole("checkbox", {name: /downloadAlbums/i});
        fireEvent.click(downloadAlbumsCheckbox);

        await waitFor(() => expect(storeSet).toHaveBeenCalledWith("application", expect.objectContaining({downloadAlbums: false})));
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

    test("toggles advanced search accordion and persists state", async () => {
        setupStore({inputMode: InputMode.Artists, showAdvancedSearchOptions: true});
        setupData();

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);

        const accordionSummary = shell.container.querySelector(".MuiAccordionSummary-root") as HTMLElement;
        fireEvent.click(accordionSummary);

        await waitFor(() => expect(storeSet).toHaveBeenCalledWith("application", expect.objectContaining({showAdvancedSearchOptions: false})));
    });

    test("responds to external inputMode changes via store.onDidChange", async () => {
        setupStore({inputMode: InputMode.Artists});
        setupData();

        let capturedCallback: ((newInputMode: InputMode) => void) | null = null;
        const unsubscribe = jest.fn();
        (store.onDidChange as jest.Mock).mockImplementation((key: string, callback: (newInputMode: InputMode) => void) => {
            if (key === "application.inputMode") {
                capturedCallback = callback;
            }
            return unsubscribe;
        });

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);

        expect(store.onDidChange).toHaveBeenCalledWith("application.inputMode", expect.any(Function));

        expect(shell.container.querySelector("[data-help=\"showAdvancedSearchOptions\"]")).toBeInTheDocument();

        storeGet.mockImplementation((key: string) => {
            if (key === "application") return {inputMode: InputMode.Auto, showAdvancedSearchOptions: true};
            if (key === "application.inputMode") return InputMode.Auto;
            return undefined;
        });

        act(() => {
            capturedCallback?.(InputMode.Auto);
        });
        await waitFor(() => expect(shell.container.querySelector("[data-help=\"showAdvancedSearchOptions\"]")).toBeNull());
    });

    test("copies url to clipboard when chip is clicked", async () => {
        setupStore({inputMode: InputMode.Auto});
        setupData({urls: ["https://youtu.be/abc123def45"]});

        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {clipboard: {writeText}});

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);

        const chip = shell.container.querySelector(".MuiChip-root") as HTMLElement;
        fireEvent.click(chip);

        await waitFor(() => expect(writeText).toHaveBeenCalledWith("https://youtu.be/abc123def45"));
    });

    test("logs error when clipboard write fails", async () => {
        setupStore({inputMode: InputMode.Auto});
        setupData({urls: ["https://youtu.be/abc123def45"]});

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
        const clipboardError = new Error("Clipboard access denied");
        const writeText = jest.fn().mockRejectedValue(clipboardError);
        Object.assign(navigator, {clipboard: {writeText}});

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);

        const chip = shell.container.querySelector(".MuiChip-root") as HTMLElement;
        fireEvent.click(chip);

        await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to copy:", clipboardError));

        consoleErrorSpy.mockRestore();
    });

    test("displays albumOrAlbums label when inputMode is Albums", async () => {
        setupStore({inputMode: InputMode.Albums});
        setupData();

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);

        expect(shell.getByLabelText(/albumOrAlbums/i)).toBeInTheDocument();
    });

    test("displays songOrSongs label when inputMode is Songs", async () => {
        setupStore({inputMode: InputMode.Songs});
        setupData();

        const shell = await render(<InputPanel onDownloadFailed={jest.fn()} onDownload={jest.fn()} onCancel={jest.fn()} onLoadInfo={jest.fn()} />);

        expect(shell.getByLabelText(/songOrSongs/i)).toBeInTheDocument();
    });
});
