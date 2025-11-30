import {render} from "@tests/TestRenderer";

import {useAppContext} from "../../../react/contexts/AppContext";
import {useDataState} from "../../../react/contexts/DataContext";
import InfoBar from "./InfoBar";

jest.mock("../../../react/contexts/AppContext", () => require("@tests/mocks/react/contexts/AppContext"));
jest.mock("../../../react/contexts/DataContext", () => require("@tests/mocks/react/contexts/DataContext"));

describe("InfoBar component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders properly when not hidden", async () => {
        const shell = await render(<InfoBar data-testid="info-bar" />);

        expect(shell.getByTestId("info-bar")).toBeInTheDocument();
    });

    test("does not render when hidden", async () => {
        const shell = await render(<InfoBar data-testid="info-bar" hidden={true} />);

        expect(shell.queryByTestId("info-bar")).not.toBeInTheDocument();
    });

    test("displays correct playlists and tracks counts", async () => {
        const useDataStateMock = useDataState as jest.Mock;
        const mockPlaylists = [{ id: 1, tracks: [{id: 2}] }, { id: 2 }];
        const mockTracks = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const mockTrackStatus = [{ trackId: 1, completed: true }, { trackId: 2, completed: false }];

        const shell = await render(<InfoBar/>);
        
        expect(shell.getByTestId("all-playlists")).toHaveTextContent("0");
        expect(shell.getByTestId("grabbed-playlists")).toHaveTextContent("(0)");
        expect(shell.getByTestId("all-tracks")).toHaveTextContent("0");
        expect(shell.getByTestId("grabbed-tracks")).toHaveTextContent("(0)");

        useDataStateMock.mockReturnValue({
            playlists: mockPlaylists,
            tracks: mockTracks,
            trackStatus: mockTrackStatus
        });
        shell.rerender(<InfoBar />);

        expect(shell.getByTestId("all-playlists")).toHaveTextContent("2");
        expect(shell.getByTestId("grabbed-playlists")).toHaveTextContent("(1)");
        expect(shell.getByTestId("all-tracks")).toHaveTextContent("3");
        expect(shell.getByTestId("grabbed-tracks")).toHaveTextContent("(1)");
    });
    
    test("shows progress bar when loading", async () => {
        const useAppContextMock = useAppContext as jest.Mock;
        const shell = await render(<InfoBar />);

        expect(shell.queryByRole("progressbar")).toBeNull();

        useAppContextMock.mockReturnValue({state: {loading: true}});
        shell.rerender(<InfoBar />);

        expect(shell.getByRole("progressbar")).toBeInTheDocument();

        useAppContextMock.mockReturnValue({state: {loading: false}});
        shell.rerender(<InfoBar />);

        expect(shell.queryByRole("progressbar")).toBeNull();
    });
});
