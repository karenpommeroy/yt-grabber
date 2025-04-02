import _compact from "lodash/compact";
import _filter from "lodash/filter";
import _isEmpty from "lodash/isEmpty";
import _isFunction from "lodash/isFunction";
import _map from "lodash/map";
import _replace from "lodash/replace";
import _truncate from "lodash/truncate";
import _uniq from "lodash/uniq";
import _without from "lodash/without";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";

import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";
import FolderIcon from "@mui/icons-material/Folder";
import ReplayIcon from "@mui/icons-material/Replay";
import SearchIcon from "@mui/icons-material/Search";
import {
    Autocomplete, AutocompleteRenderInputParams, Button, Chip, Grid, Stack, TextField, Tooltip
} from "@mui/material";

import {getUrlType} from "../../../common/Helpers";
import {ApplicationOptions} from "../../../common/Store";
import {UrlType} from "../../../common/Youtube";
import {useDataState} from "../../../react/contexts/DataContext";
import Styles from "./InputPanel.styl";

export type InputPanelProps = {
    loading?: boolean;
    onChange?: (value: string[]) => void;
    onDownload: (...args: any[]) => void;
    onDownloadFailed: () => void;
    onLoadInfo: (...args: any[]) => void;
    onCancel: () => void;
};

export const InputPanel: React.FC<InputPanelProps> = (props: InputPanelProps) => {
    const {loading, onDownload, onCancel, onDownloadFailed, onChange, onLoadInfo} = props;
    const [options] = useState<ApplicationOptions>(global.store.get("application"));
    const [debouncedOptions] = useDebounceValue(options, 500, {leading: true});
    const {playlists, trackStatus, urls, setUrls} = useDataState();
    const {t} = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const valueCount = urls.length;

    const truncateRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:music\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|browse\/|channel\/|shorts\/|live\/|playlist\?list=)|youtu\.be\/)/;
    const validateRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:music\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|browse\/|channel\/|shorts\/|live\/|playlist\?list=)|youtu\.be\/)([\w-]{11})/;
    const validateRegexNoDiscographyDownload = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:music\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|browse\/|shorts\/|live\/|playlist\?list=)|youtu\.be\/)([\w-]{11})/;

    const isValid = (value: string) => {
        const regexToUse = options.discographyDownload ? validateRegex : validateRegexNoDiscographyDownload;
        return options.debugMode ? true : regexToUse.test(value);
    };

    useEffect(() => {
        global.store.set("application", debouncedOptions);
    }, [debouncedOptions]);

    const handleDelete = (valueToDelete: string) => {
        const newUrls = _without(urls, valueToDelete);
        
        setUrls(newUrls);
        if (_isFunction(onChange)) {
            onChange(newUrls);
        }
    };
    
    const handleOpenFromFile = () => {
        fileInputRef.current?.click();
    };

    const showDownloadFailed = useMemo(() => {
        return !_isEmpty(_filter(trackStatus, "error"));
    }, [trackStatus]);

    const onMultiValueChange = (value: React.ChangeEvent<HTMLInputElement>, newValue: []) => {
        const newUrls = _uniq(_filter(newValue, isValid)); 
        
        setUrls(newUrls);
        
        if (_isFunction(onChange)) {
            onChange(newUrls);
        }
    };

    const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        
        if (!file) return;
    
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target?.result as string;
            const lines = _compact(content.split("\n"));
            const nextUrls = _uniq(_filter(lines, isValid));

            setUrls(nextUrls);
            if (_isFunction(onChange)) {
                onChange(nextUrls);
            }
        };
        reader.readAsText(file);
        event.target.value = "";
    };

    const copyToClipboard = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const renderUrlTag = (option: string) => {
        const colors: Record<UrlType, string> = {
            [UrlType.Artist]: "success",
            [UrlType.Playlist]: "primary",
            [UrlType.Track]: "default",
        };
        
        return (
            <Tooltip key={option} title={option} arrow disableHoverListener={false} enterDelay={500} leaveDelay={100} enterNextDelay={500} placement="bottom">
                <Chip
                    variant="filled"
                    color={colors[getUrlType(option)] as any}
                    label={_truncate(_replace(option, truncateRegex, ""), {length: valueCount === 2 ? 30 : 20})}
                    sx={{marginX: .5}}
                    onDelete={() => !loading && handleDelete(option)}
                    onClick={() => copyToClipboard(option)}
                />
            </Tooltip>
        );
    };

    return (
        <Grid className={Styles.inputPanel} container spacing={2} padding={2} paddingBottom={1}>
            <Grid size="grow">
                <Autocomplete
                    multiple
                    freeSolo
                    fullWidth
                    autoSelect
                    readOnly={loading}
                    limitTags={3}
                    options={[]}
                    value={urls}
                    onChange={onMultiValueChange}
                    defaultValue={[]}
                    renderTags={(value) => _map(value, renderUrlTag)}
                    renderInput={(params: AutocompleteRenderInputParams) => (
                        <TextField
                            {...params}
                            data-help="youtubeUrl"
                            fullWidth
                            variant="outlined"
                            label={t("youtubeUrl")}
                            slotProps={{
                                input: {
                                    ...params.InputProps,
                                    startAdornment: <>
                                        {params.InputProps.startAdornment}
                                        <input ref={fileInputRef} type="file" hidden onChange={onSelectFile} accept=".txt,.json" />
                                    </>
                                }
                            }}
                        />
                    )}
                />
            </Grid>
            <Grid>
                <Stack direction="row" spacing={1} height={54}>
                    <Tooltip title={t("loadFromFile")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="bottom">
                        <Button data-help="loadFromFile" disabled={loading} variant="contained" disableElevation color="secondary" onClick={() => handleOpenFromFile()}>
                            <FolderIcon/>
                        </Button>
                    </Tooltip>
                    <Tooltip title={t("loadInfo")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="bottom">
                        <Button data-help="loadInfo" disabled={loading || _isEmpty(urls)} variant="contained" disableElevation color="secondary" onClick={() => onLoadInfo(urls)}>
                            <SearchIcon />
                        </Button>
                    </Tooltip>
                    {showDownloadFailed &&
                        <Tooltip title={t("downloadFailed")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="bottom">
                            <Button data-help="downloadFailed" disabled={loading || _isEmpty(urls)} variant="contained" disableElevation color="secondary" onClick={onDownloadFailed}>
                                <ReplayIcon />
                            </Button>
                        </Tooltip>
                    }
                    {!loading &&
                        <Tooltip title={t("downloadAll")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="bottom">
                            <Button data-help="downloadAll" disabled={loading || _isEmpty(urls)} variant="contained" disableElevation color="secondary" onClick={() => onDownload(urls)}>
                                <DownloadIcon />
                            </Button>
                        </Tooltip>
                    }
                    {loading && !_isEmpty(playlists) &&
                        <Tooltip title={t("cancelAll")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="bottom">
                            <Button data-help="cancellAll" variant="contained" disableElevation color="secondary" onClick={onCancel}>
                                <ClearIcon />
                            </Button>
                        </Tooltip>
                    }
                </Stack>
            </Grid>
        </Grid>
    );
};

export default InputPanel;
