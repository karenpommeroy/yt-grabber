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

export type OpenUrlInBrowserParams = {
    url?: string;
};

export type GetYoutubeParams = {
    values?: string[];
    lang: string;
    url: string;
    options?: Record<string, any>;
};

export type GetYoutubeResult = {
    errors?: LogMessage[];
    warnings?: LogMessage[];
    values?: string[];
    sources: string[];
};
