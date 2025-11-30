import {fireEvent, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {createTrackInfo, setupDataState} from "../../../common/TestHelpers";
import {TrackStatusInfo} from "../../../common/Youtube";
import TrackList from "./TrackList";

jest.mock("../../../react/contexts/DataContext", () => require("@tests/mocks/react/contexts/DataContext"));

const baseTrack = createTrackInfo({
    id: "track-1",
    title: "Test Song",
    duration: 180,
    original_url: "https://example.com/track-1",
    playlist_autonumber: 1,
    thumbnail: "thumb.jpg",
    thumbnails: [{url: "thumb-alt.jpg", width: 100, height: 100, id: "thumb"}],
});

describe("TrackList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("clears track status and triggers download handler", async () => {
        const setTrackStatus = jest.fn();
        setupDataState({
            setTrackStatus,
            tracks: [baseTrack],
            trackStatus: [{
                trackId: baseTrack.id,
                percent: 50,
                totalSize: 100,
                status: "downloading",
            } as TrackStatusInfo],
        });
        const onDownloadTrack = jest.fn();

        const shell = await render(<TrackList queue={[]} onDownloadTrack={onDownloadTrack} />);
        const downloadButton = shell.container.querySelector("[data-help=\"downloadTrack\"]") as HTMLButtonElement;

        fireEvent.click(downloadButton);

        expect(setTrackStatus).toHaveBeenCalledTimes(1);
        const updater = setTrackStatus.mock.calls[0][0] as (prev: TrackStatusInfo[]) => TrackStatusInfo[];
        const nextStatus = updater([
            {trackId: baseTrack.id, percent: 0, totalSize: 0} as TrackStatusInfo,
            {trackId: "track-2", percent: 0, totalSize: 0} as TrackStatusInfo,
        ]);
        expect(nextStatus).toEqual([{trackId: "track-2", percent: 0, totalSize: 0}]);
        expect(onDownloadTrack).toHaveBeenCalledWith(baseTrack.id);
    });

    test("shows cancel button for queued tracks", async () => {
        setupDataState({tracks: [baseTrack],});
        const onCancel = jest.fn();

        const shell = await render(<TrackList queue={[baseTrack.id]} onCancelTrack={onCancel} />);
        const cancelButton = shell.container.querySelector("[data-help=\"cancelDownloadTrack\"]") as HTMLButtonElement;

        expect(cancelButton).toBeInTheDocument();
        fireEvent.click(cancelButton);

        expect(onCancel).toHaveBeenCalledWith(baseTrack.id);
    });

    test("invokes open url handler", async () => {
        setupDataState({tracks: [baseTrack]});
        const onOpenUrl = jest.fn();

        const shell = await render(<TrackList queue={[]} onOpenUrl={onOpenUrl} />);
        const openButton = shell.container.querySelector("[data-help=\"openInBrowser\"]") as HTMLButtonElement;

        fireEvent.click(openButton);

        expect(onOpenUrl).toHaveBeenCalledWith(baseTrack.original_url);
    });

    test("initializes default track cuts when opening cut popover", async () => {
        const setTrackCuts = jest.fn();
        setupDataState({trackCuts: {}, setTrackCuts, tracks: [baseTrack],});

        const shell = await render(<TrackList queue={[]} />);
        const cutButton = shell.container.querySelector("[data-help=\"cut\"]") as HTMLButtonElement;

        fireEvent.click(cutButton);

        await waitFor(() => expect(setTrackCuts).toHaveBeenCalled());
        const updater = setTrackCuts.mock.calls[0][0] as (prev: Record<string, [number, number][]>) => Record<string, [number, number][]>;
        const nextCuts = updater({});
        expect(nextCuts[baseTrack.id]).toEqual([[0, baseTrack.duration]]);
    });
});
