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
