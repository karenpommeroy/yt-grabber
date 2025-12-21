import {fireEvent, waitFor, within} from "@testing-library/react";
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

const applyFormatUpdate = (mockFn: jest.Mock, prev: Record<string, Format>) => {
    const update = mockFn.mock.calls.at(-1)?.[0];
    return typeof update === "function" ? update(prev) : update;
};

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
        const updated = applyFormatUpdate(state.setFormats, state.formats);

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
    const updated = applyFormatUpdate(state.setFormats, formats);

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

    test("handleMediaTypeChange switches to video and resets selected format", async () => {
        const formats = {global: {type: MediaFormat.Audio, extension: AudioType.Mp3, audioQuality: 5}};
        const state = setupDataState({formats, playlists: playlistsMock});

        const shell = await render(<FormatSelector />);

        const mediaSelect = await shell.findByTestId("media-type-select");
        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        state.setFormats.mockClear();

        fireEvent.mouseDown(within(mediaSelect).getByRole("combobox"));
        const videoOption = await shell.findByText("Video");
        fireEvent.click(videoOption);

        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        const updated = applyFormatUpdate(state.setFormats, formats);

        expect(updated.global.type).toBe(MediaFormat.Video);
        expect(updated.global.extension).toBe(Object.values(VideoType)[0]);
    });

    test("handleFormatChange updates audio extension", async () => {
        const formats = {global: {type: MediaFormat.Audio, extension: AudioType.Mp3, audioQuality: 5}};
        const state = setupDataState({formats, playlists: playlistsMock});

        const shell = await render(<FormatSelector />);

        const formatSelect = await shell.findByTestId("media-format-select");
        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        state.setFormats.mockClear();

        fireEvent.mouseDown(within(formatSelect).getByRole("combobox"));
        const flacOption = await shell.findByRole("option", {name: "flac"});
        fireEvent.click(flacOption);

        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        const updated = applyFormatUpdate(state.setFormats, formats);

        expect(updated.global.extension).toBe(AudioType.Flac);
        expect(updated.global.type).toBe(MediaFormat.Audio);
    });

    test("handleFormatChange updates video extension", async () => {
        const formats = {global: {type: MediaFormat.Video, extension: VideoType.Mp4, videoQuality: "1920x1080 (1080p)"}};
        const playlists = [createPlaylistInfo({
            url: "tab-1",
            tracks: [createTrackInfo({formats: [
                createFormatInfo({resolution: "1920x1080"}),
                createFormatInfo({resolution: "1280x720"}),
            ]})],
        })];
        const state = setupDataState({formats, playlists, activeTab: "tab-1"});

        const shell = await render(<FormatSelector />);

        const formatSelect = await shell.findByTestId("media-format-select");
        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        state.setFormats.mockClear();

        fireEvent.mouseDown(within(formatSelect).getByRole("combobox"));
        const mkvOption = await shell.findByRole("option", {name: "mkv"});
        fireEvent.click(mkvOption);

        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        const updated = applyFormatUpdate(state.setFormats, formats);

        expect(updated.global.extension).toBe(VideoType.Mkv);
        expect(updated.global.type).toBe(MediaFormat.Video);
        expect(updated.global.videoQuality).toBe("1920x1080 (1080p)");
    });

    test("handleResolutionChange updates selectedResolution and formats", async () => {
        const formats = {global: {type: MediaFormat.Video, extension: VideoType.Mp4, videoQuality: "1920x1080 (1080p)"}};
        const playlists = [createPlaylistInfo({
            url: "tab-1",
            tracks: [createTrackInfo({formats: [
                createFormatInfo({resolution: "1920x1080"}),
                createFormatInfo({resolution: "1280x720"}),
            ]})],
        })];
        const state = setupDataState({formats, playlists, activeTab: "tab-1"});

        const shell = await render(<FormatSelector />);

        const resolutionSelect = await shell.findByTestId("media-resolution-select");
        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        state.setFormats.mockClear();

        fireEvent.mouseDown(within(resolutionSelect).getByRole("combobox"));
        const option = await shell.findByRole("option", {name: "1280x720 (720p)"});
        fireEvent.click(option);

        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        const updated = applyFormatUpdate(state.setFormats, formats);

        expect(updated.global.videoQuality).toBe("1280x720 (720p)");
    });

    test("onGifTopTextChanged updates gifTopText in formats", async () => {
        const formats = {global: {type: MediaFormat.Video, extension: VideoType.Gif, videoQuality: "1920x1080 (1080p)"}};
        const state = setupDataState({formats, playlists: playlistsMock});

        const shell = await render(<FormatSelector />);

        const topField = await shell.findByTestId("gif-top-text-field");
        const topInput = topField.querySelector("input");
        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        state.setFormats.mockClear();

        fireEvent.change(topInput, {target: {value: "Top text"}});

        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        const updated = applyFormatUpdate(state.setFormats, formats);

        expect((updated.global as any).gifTopText).toBe("Top text");
    });

    test("onGifBottomTextChanged updates gifBottomText in formats", async () => {
        const formats = {global: {type: MediaFormat.Video, extension: VideoType.Gif, videoQuality: "1920x1080 (1080p)"}};
        const state = setupDataState({formats, playlists: playlistsMock});

        const shell = await render(<FormatSelector />);

        const bottomField = await shell.findByTestId("gif-bottom-text-field");
        const bottomInput = bottomField.querySelector("input");
        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        state.setFormats.mockClear();

        fireEvent.change(bottomInput, {target: {value: "Bottom text"}});

        await waitFor(() => expect(state.setFormats).toHaveBeenCalled());
        const updated = applyFormatUpdate(state.setFormats, formats);

        expect((updated.global as any).gifBottomText).toBe("Bottom text");
    });
});
