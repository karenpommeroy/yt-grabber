import {Schema} from "electron-store";

export type ApplicationOptions = {
    outputDirectory?: string;
    albumOutputTemplate?: string;
    playlistOutputTemplate?: string;
    videoOutputTemplate?: string;
    trackOutputTemplate?: string;
    concurrency?: number;
    quality?: number;
    debugMode?: boolean;
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
