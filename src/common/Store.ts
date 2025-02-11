import {Schema} from "electron-store";

export type ApplicationOptions = {
    outputDirectory?: string;
    outputTemplate?: string;
    metadataTemplate?: string;
    concurrency?: number;
    quality?: number;
    debugMode?: boolean;
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
            outputDirectory: {
                type: "string",
                default: "/output",
            },
            outputTemplate: {
                type: "string",
                default: "`./${appOptions.outputDirectory}/${album.artist}/[${album.releaseYear}] ${album.title}/${track.playlist_autonumber} - ${track.title}.mp3`",
            },
            metadataTemplate: {
                type: "string",
                default: "`-metadata title='${track.title}' -metadata artist='${album.artist}' -metadata album='${album.title}' -metadata track='${track.playlist_autonumber}' -metadata release_year='${album.releaseYear}'`",
            },
            concurrency: {
                type: "integer",
                default: 1
            },
            quality: {
                type: "integer",
                default: 5
            },
            debugMode: {
                type: "boolean",
                default: false
            }
        },
        default: {},
    },
};

export default StoreSchema;
