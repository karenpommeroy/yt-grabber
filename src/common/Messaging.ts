import {Release} from "./Youtube";

export type LogMessage = {
    title: string;
    description?: string;
};

export type OpenSystemPathParams = {
    dirpath?: string;
    filepath?: string;
};

export type OpenSelectPathDialogParams = {
    directory?: boolean;
    multiple?: boolean;
    defaultPath?: string;
};

export type OpenSelectPathDialogCompletedParams = {
    paths?: string;
};

export type OpenUrlInBrowserParams = {
    url?: string;
};

export type GetYoutubeUrlParams = {
    albums?: Release[];
    lang: string;
    url: string;
    artistUrls?: string[];
};

export type GetYoutubeUrlResult = {
    errors?: LogMessage[];
    warnings?: LogMessage[];
    urls?: string[];
};
