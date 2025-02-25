import {Schema} from "electron-store";

export type ApplicationOptions = {
    outputDirectory?: string;
    albumOutputTemplate?: string;
    playlistOutputTemplate?: string;
    videoOutputTemplate?: string;
    trackOutputTemplate?: string;
    concurrency?: number;
    quality?: number;
    format?: "best" | "bestaudio" | "custom";
    debugMode?: boolean;
    url?: string;
    overwrite?: boolean;
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
            outputDirectory: {
                type: "string",
                default: "/output",
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
                default: 5
            },
            format: {
                type: "string",
                default: "best",
            },
            debugMode: {
                type: "boolean",
                default: false
            },
            overwrite: {
                type: "boolean",
                default: false
            }
        },
        default: {},
    },
};

export default StoreSchema;
