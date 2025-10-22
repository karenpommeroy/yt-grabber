import {Schema} from "electron-store";
import _values from "lodash/values";

import {FormatScope, InputMode, MultiMatchAction, SortOrder, TabsOrderKey} from "./Media";

export type ApplicationOptions = {
    youtubeUrl?: string;
    outputDirectory?: string;
    ytdlpExecutablePath?: string;
    ffmpegExecutablePath?: string;
    gifsicleExecutablePath?: string;
    chromeExecutablePath?: string;
    albumOutputTemplate?: string;
    playlistOutputTemplate?: string;
    videoOutputTemplate?: string;
    trackOutputTemplate?: string;
    customYtdlpArgs?: string;
    concurrency?: number;
    quality?: number;
    playlistCountThreshold?: number;
    playlistCheckMaxItemsCount?: number;
    debugMode?: boolean;
    formatScope?: FormatScope;
    multiMatchAction?: MultiMatchAction;
    urls?: string[];
    language?: string;
    alwaysOverwrite?: boolean;
    mergeParts?: boolean;
    downloadSinglesAndEps?: boolean;
    downloadAlbums?: boolean;
    showAdvancedSearchOptions?: boolean;
    inputMode?: InputMode;
    tabsOrder?: [TabsOrderKey, SortOrder];
};

export interface IStore {
    options: {
        headless: boolean;
    };
    application: ApplicationOptions;
}

export const StoreSchema: Schema<IStore> = {
    options: {
        type: "object",
        properties: {
            headless: {
                type: "boolean",
                default: false,
            },
        },
        default: {},
    },
    application: {
        type: "object",
        properties: {
            urls: {
                type: "array",
                items: {
                    type: "string"
                },
                default: [],
            },
            youtubeUrl: {
                type: "string",
                default: "https://music.youtube.com",
            },
            outputDirectory: {
                type: "string",
                default: "./output",
            },
            ytdlpExecutablePath: {
                type: "string",
                default: "",
            },
            ffmpegExecutablePath: {
                type: "string",
                default: ""
            },
            gifsicleExecutablePath: {
                type: "string",
                default: ""
            },
            chromeExecutablePath: {
                type: "string",
                default: ""
            },
            albumOutputTemplate: {
                type: "string",
                default: "{{artist}}/[{{releaseYear}}] {{albumTitle}}/{{trackNo}} - {{trackTitle}}",
            },
            playlistOutputTemplate: {
                type: "string",
                default: "{{albumTitle}}/{{trackTitle}}",
            },
            videoOutputTemplate: {
                type: "string",
                default: "{{artist}} - {{trackTitle}}",
            },
            trackOutputTemplate: {
                type: "string",
                default: "{{artist}} - {{trackTitle}}",
            },
            customYtdlpArgs: {
                type: "string",
                default: "",
            },
            concurrency: {
                type: "integer",
                default: 5
            },
            quality: {
                type: "integer",
                default: 10
            },
            playlistCountThreshold: {
                type: "integer",
                default: 25
            },
            playlistCheckMaxItemsCount: {
                type: "integer",
                default: 3
            },
            debugMode: {
                type: "boolean",
                default: false
            },
            formatScope: {
                type: "string",
                default: FormatScope.Global,
                enum: _values(FormatScope),
            },
            multiMatchAction: {
                type: "string",
                default: MultiMatchAction.UseFirst,
                enum: _values(MultiMatchAction),
            },
            language: {
                type: "string"
            },
            alwaysOverwrite: {
                type: "boolean",
                default: false
            },
            mergeParts: {
                type: "boolean",
                default: true
            },
            downloadAlbums: {
                type: "boolean",
                default: true
            },
            downloadSinglesAndEps: {
                type: "boolean",
                default: false
            },
            showAdvancedSearchOptions: {
                type: "boolean",
                default: false
            },
            inputMode: {
                type: "string",
                default: InputMode.Auto,
                enum: _values(InputMode)
            },
            tabsOrder: {
                type: "array",
                default: [TabsOrderKey.Default, SortOrder.Asc],
            },
        },
        default: {},
    },
};

export default StoreSchema;
