import React from "react";

import {act, render, screen} from "@testing-library/react";

import {AudioType, MediaFormat} from "../../common/Media";
import {PlaylistInfo} from "../../common/Youtube";
import {DataProvider, DataState, useDataState} from "./DataContext";

const mockStoreGet = jest.fn().mockReturnValue({urls: ["https://example.com"]});
(global as any).store = {get: mockStoreGet};

const TestConsumer: React.FC<{onState?: (state: DataState) => void}> = ({onState}) => {
    const state = useDataState();
    React.useEffect(() => {
        if (onState && state) {
            onState(state);
        }
    }, [state, onState]);
    
    return <div data-testid="consumer">{state ? "has-context" : "no-context"}</div>;
};

describe("DataContext", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockStoreGet.mockReturnValue({urls: ["https://example.com"]});
    });

    describe("DataProvider", () => {
        it("should render children", () => {
            render(
                <DataProvider>
                    <div data-testid="child">Child Content</div>
                </DataProvider>
            );
            
            expect(screen.getByTestId("child")).toBeInTheDocument();
            expect(screen.getByText("Child Content")).toBeInTheDocument();
        });

        it("should provide context to children", () => {
            render(
                <DataProvider>
                    <TestConsumer />
                </DataProvider>
            );
            
            expect(screen.getByTestId("consumer")).toHaveTextContent("has-context");
        });

        it("should initialize with default values", () => {
            let capturedState: DataState | undefined;
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            expect(capturedState).toBeDefined();
            expect(capturedState!.playlists).toEqual([]);
            expect(capturedState!.tracks).toEqual([]);
            expect(capturedState!.trackStatus).toEqual([]);
            expect(capturedState!.trackCuts).toEqual({});
            expect(capturedState!.formats).toEqual({global: {type: MediaFormat.Audio, extension: AudioType.Mp3, audioQuality: 10}});
            expect(capturedState!.urls).toEqual(["https://example.com"]);
            expect(capturedState!.autoDownload).toBe(false);
            expect(capturedState!.queue).toEqual([]);
            expect(capturedState!.operation).toBeUndefined();
            expect(capturedState!.activeTab).toBeUndefined();
            expect(capturedState!.errors).toEqual([]);
            expect(capturedState!.warnings).toEqual([]);
        });

        it("should read urls from store", () => {
            mockStoreGet.mockReturnValue({urls: ["url1", "url2"]});
            let capturedState: DataState | undefined;
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            expect(mockStoreGet).toHaveBeenCalledWith("application");
            expect(capturedState!.urls).toEqual(["url1", "url2"]);
        });
    });

    describe("state setters", () => {
        it("should update playlists", () => {
            let capturedState: DataState | undefined;
            const testPlaylist = {id: "pl1", title: "Test Playlist", url: "https://playlist.url", trackIds: [] as any[]} as unknown as PlaylistInfo;
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            act(() => {
                capturedState!.setPlaylists([testPlaylist]);
            });
            
            expect(capturedState!.playlists).toEqual([testPlaylist]);
        });

        it("should update tracks", () => {
            let capturedState: DataState | undefined;
            const testTrack = {id: "t1", title: "Test Track", url: "https://track.url", duration: 180};
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            act(() => {
                capturedState!.setTracks([testTrack as any]);
            });
            
            expect(capturedState!.tracks).toEqual([testTrack]);
        });

        it("should update trackStatus", () => {
            let capturedState: DataState | undefined;
            const testStatus = {id: "t1", status: "downloading"};
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            act(() => {
                capturedState!.setTrackStatus([testStatus as any]);
            });
            
            expect(capturedState!.trackStatus).toEqual([testStatus]);
        });

        it("should update trackCuts", () => {
            let capturedState: DataState | undefined;
            const testCuts = {"track1": [[0, 30], [60, 90]] as [number, number][]};
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            act(() => {
                capturedState!.setTrackCuts(testCuts);
            });
            
            expect(capturedState!.trackCuts).toEqual(testCuts);
        });

        it("should update formats", () => {
            let capturedState: DataState | undefined;
            const testFormats = {global: {type: MediaFormat.Video, extension: "mp4", audioQuality: 5}};
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            act(() => {
                capturedState!.setFormats(testFormats as any);
            });
            
            expect(capturedState!.formats).toEqual(testFormats);
        });

        it("should update urls", () => {
            let capturedState: DataState | undefined;
            const testUrls = ["https://new-url1.com", "https://new-url2.com"];
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            act(() => {
                capturedState!.setUrls(testUrls);
            });
            
            expect(capturedState!.urls).toEqual(testUrls);
        });

        it("should update autoDownload", () => {
            let capturedState: DataState | undefined;
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            expect(capturedState!.autoDownload).toBe(false);
            
            act(() => {
                capturedState!.setAutoDownload(true);
            });
            
            expect(capturedState!.autoDownload).toBe(true);
        });

        it("should update queue", () => {
            let capturedState: DataState | undefined;
            const testQueue = ["track1", "track2", "track3"];
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            act(() => {
                capturedState!.setQueue(testQueue);
            });
            
            expect(capturedState!.queue).toEqual(testQueue);
        });

        it("should update operation", () => {
            let capturedState: DataState | undefined;
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            act(() => {
                capturedState!.setOperation("downloading");
            });
            
            expect(capturedState!.operation).toBe("downloading");
        });

        it("should update activeTab", () => {
            let capturedState: DataState | undefined;
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            act(() => {
                capturedState!.setActiveTab("settings");
            });
            
            expect(capturedState!.activeTab).toBe("settings");
        });

        it("should update errors", () => {
            let capturedState: DataState | undefined;
            const testErrors = [{url: "https://error.com", message: "Failed to load"}];
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            act(() => {
                capturedState!.setErrors(testErrors);
            });
            
            expect(capturedState!.errors).toEqual(testErrors);
        });

        it("should update warnings", () => {
            let capturedState: DataState | undefined;
            const testWarnings = [{url: "https://warning.com", message: "Slow connection"}];
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            act(() => {
                capturedState!.setWarnings(testWarnings);
            });
            
            expect(capturedState!.warnings).toEqual(testWarnings);
        });
    });

    describe("clear function", () => {
        it("should reset all state to defaults", () => {
            let capturedState: DataState | undefined;
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );

            // Set some values first
            act(() => {
                capturedState!.setPlaylists([{
                    url: "https://test.com",
                    album: {
                        id: "",
                        artist: "",
                        title: "",
                        releaseYear: 0,
                        tracksNumber: 0,
                        duration: 0,
                        thumbnail: "",
                        url: ""
                    },
                    tracks: []
                }]);
                capturedState!.setTracks([{id: "t1", title: "Track", url: "https://track.com"} as any]);
                capturedState!.setTrackStatus([{id: "t1", status: "downloading"} as any]);
                capturedState!.setTrackCuts({"t1": [[0, 30]]});
                capturedState!.setAutoDownload(true);
                capturedState!.setQueue(["t1", "t2"]);
                capturedState!.setFormats({global: {type: MediaFormat.Video, extension: "mp4", audioQuality: 5}} as any);
                capturedState!.setOperation("processing");
                capturedState!.setErrors([{url: "https://error.com", message: "Error"}]);
                capturedState!.setWarnings([{url: "https://warning.com", message: "Warning"}]);
            });

            // Verify values were set
            expect(capturedState!.playlists).toHaveLength(1);
            expect(capturedState!.tracks).toHaveLength(1);
            expect(capturedState!.autoDownload).toBe(true);
            expect(capturedState!.operation).toBe("processing");

            // Call clear
            act(() => {
                capturedState!.clear();
            });

            // Verify all values are reset
            expect(capturedState!.playlists).toEqual([]);
            expect(capturedState!.tracks).toEqual([]);
            expect(capturedState!.trackStatus).toEqual([]);
            expect(capturedState!.trackCuts).toEqual({});
            expect(capturedState!.autoDownload).toBe(false);
            expect(capturedState!.queue).toEqual([]);
            expect(capturedState!.formats).toEqual({global: {type: MediaFormat.Audio, extension: AudioType.Mp3, audioQuality: 10}});
            expect(capturedState!.operation).toBeUndefined();
            expect(capturedState!.errors).toEqual([]);
            expect(capturedState!.warnings).toEqual([]);
        });
    });

    describe("useDataState hook", () => {
        it("should return undefined when used outside provider", () => {
            let capturedState: DataState | undefined = {} as DataState;
            
            const TestComponent = (): null => {
                capturedState = useDataState();
                return null;
            };
            
            render(<TestComponent />);
            
            expect(capturedState).toBeUndefined();
        });

        it("should return context when used inside provider", () => {
            let capturedState: DataState | undefined;
            
            render(
                <DataProvider>
                    <TestConsumer onState={(state) => { capturedState = state; }} />
                </DataProvider>
            );
            
            expect(capturedState).toBeDefined();
            expect(typeof capturedState!.setPlaylists).toBe("function");
            expect(typeof capturedState!.clear).toBe("function");
        });
    });
});
