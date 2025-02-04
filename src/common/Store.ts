import {Schema} from "electron-store";

export type Options = {
    url?: string;
    agressoLogin?: string;
    agressoPass?: string;
    userLogin?: string;
    userPass?: string;
    client?: string;
    hourCost?: number;
    skipData?: boolean;
    showInvoice?: boolean;
    color?: string;
};

export interface IStore {
    options: {
        headless: boolean;
    };
    agresso: Options;
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
    agresso: {
        type: "object",
        properties: {
            url: {
                type: "string",
                default: "https://agresso.trimetis.eu/vpn/index.html",
                pattern: "^(https?|ftp):\\/\\/([^\\s/$.?#].[^\\s]*)$",
            },
            client: {
                type: "string",
                default: "T5",
            },
            agressoLogin: {
                type: "string",
                default: "Trimetis",
            },
            agressoPass: {
                type: "string",
                default: "PW4TriAde!",
            },
            userLogin: {
                type: "string",
                default: "",
            },
            userPass: {
                type: "string",
                default: "",
            },
            hourCost: {
                type: "number",
                default: 0,
            },
            skipData: {
                type: "boolean",
                default: false,
            },
            showInvoice: {
                type: "boolean",
                default: false,
            },
            color: {
                type: "string",
                default: "#0693e3",
            },
        },
        default: {},
    },
};

export default StoreSchema;
