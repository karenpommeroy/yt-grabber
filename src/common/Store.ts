import {Schema} from "electron-store";
import _values from "lodash/values";

import {FormatScope, InputMode} from "./Media";

export type ApplicationOptions = {
    youtubeUrl?: string;
    outputDirectory?: string;
    albumOutputTemplate?: string;
    playlistOutputTemplate?: string;
    videoOutputTemplate?: string;
    trackOutputTemplate?: string;
    concurrency?: number;
    quality?: number;
    debugMode?: boolean;
    formatScope?: FormatScope;
    urls?: string[];
    language?: string;
    alwaysOverwrite?: boolean;
    mergeParts?: boolean;
    inputMode?: InputMode;
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
            concurrency: {
                type: "integer",
                default: 3
            },
            quality: {
                type: "integer",
                default: 0
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
            inputMode: {
                type: "string",
                default: InputMode.Auto,
                enum: _values(InputMode)
            },
        },
        default: {},
    },
};

export default StoreSchema;
