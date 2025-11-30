import {fireEvent, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {AudioType, Format, FormatScope, MediaFormat, VideoType} from "../../../common/Media";
import {
    createAlbumInfo, createApplicationOptionsMock, createFormatInfo, createPlaylistInfo,
    createTrackInfo, setupDataState
} from "../../../common/TestHelpers";
import {PlaylistInfo} from "../../../common/Youtube";
import FormatSelector from "./FormatSelector";

jest.mock("../../../react/contexts/DataContext", () => require("@tests/mocks/react/contexts/DataContext"));

const playlistsMock: PlaylistInfo[] = [createPlaylistInfo({
    url: "tab-1",
    album: createAlbumInfo(),
    tracks: [createTrackInfo({formats: [createFormatInfo()]})],
})];

describe("FormatSelector", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        createApplicationOptionsMock();
    });

    test("updates global format when audio quality changes", async () => {
        const state = setupDataState();
        const shell = await render(<FormatSelector />);

        const input = await shell.findByLabelText("audioQuality");
        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        
        state.setFormats.mockClear();
        fireEvent.change(input, {target: {value: "7"}});

        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());

        const updater = state.setFormats.mock.calls.at(-1)?.[0] as (prev: Record<string, Format>) => Record<string, Format>;
        const updated = updater(state.formats);

        expect(updated.global.audioQuality).toBe(7);
    });

    test("applies tab-specific updates when scope is tab", async () => {
        const audioFormat: Format = {type: MediaFormat.Audio, extension: AudioType.Mp3, audioQuality: 5};
        const formats = {
            global: audioFormat,
            "tab-1": {type: MediaFormat.Audio, extension: AudioType.Mp3, audioQuality: 4}
        };
        const state = setupDataState({formats, playlists: playlistsMock});
        
        createApplicationOptionsMock({formatScope: FormatScope.Tab});

        const shell = await render(<FormatSelector />);

        const input = await shell.findByLabelText("audioQuality");
        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        state.setFormats.mockClear();

        fireEvent.change(input, {target: {value: "6"}});

        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());

        const updater = state.setFormats.mock.calls.at(-1)?.[0] as (prev: Record<string, Format>) => Record<string, Format>;
        const updated = updater(formats);

        expect(updated["tab-1"].audioQuality).toBe(6);
        expect(updated.global).toEqual(audioFormat);
    });

    test("renders gif text options when gif format selected", async () => {
        setupDataState({
            formats: {global: {type: MediaFormat.Video, extension: VideoType.Gif, videoQuality: "1920x1080 (1080p)"}},
            playlists: playlistsMock
        });

        const shell = await render(<FormatSelector />);

        expect(await shell.findByText("gifTextOptions")).toBeInTheDocument();
    });
});
