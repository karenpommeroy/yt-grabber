import {Schema} from "electron-store";

import {Format} from "../components/youtube/formatSelector/FormatSelector";

export type ApplicationOptions = {
    outputDirectory?: string;
    albumOutputTemplate?: string;
    playlistOutputTemplate?: string;
    videoOutputTemplate?: string;
    trackOutputTemplate?: string;
    concurrency?: number;
    quality?: number;
    format?: Format;
    debugMode?: boolean;
    url?: string;
    urls?: string[];
    language?: string;
    alwaysOverwrite?: boolean;
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
            url: {
                type: "string",
                default: "",
            },
            urls: {
                type: "array",
                items: {
                    type: "string"
                },
                default: [],
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
                default: 1
            },
            quality: {
                type: "integer",
                default: 0
            },
            format: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        enum: ["video", "audio"],
                        default: "audio",
                    },
                    extension: {
                        type: "string",
                        enum: ["mp3", "m4a", "flac", "wav", "opus", "mp4", "mkv"],
                        default: "mp3",
                    },
                    audioQuality: {
                        type: "integer",
                        default: 0,
                    }
                },
            },
            debugMode: {
                type: "boolean",
                default: false
            },
            language: {
                type: "string"
            },
            alwaysOverwrite: {
                type: "boolean",
                default: false
            }
        },
        default: {},
    },
};

export default StoreSchema;
