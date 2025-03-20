import _compact from "lodash/compact";
import _filter from "lodash/filter";
import _isEmpty from "lodash/isEmpty";
import _isFunction from "lodash/isFunction";
import _map from "lodash/map";
import _replace from "lodash/replace";
import _truncate from "lodash/truncate";
import _uniq from "lodash/uniq";
import _without from "lodash/without";
import React, {useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";

import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";
import FolderIcon from "@mui/icons-material/Folder";
import InfoIcon from "@mui/icons-material/Info";
import ReplayIcon from "@mui/icons-material/Replay";
import {
    Autocomplete, AutocompleteRenderInputParams, Button, Chip, Stack, TextField, Tooltip
} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {ApplicationOptions} from "../../../common/Store";
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
    const [appOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const {playlists, trackStatus, urls, setUrls} = useDataState();
    const {t} = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const valueCount = urls.length;

    const truncateRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:music\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|playlist\?list=)|youtu\.be\/)/;
    const validateRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:music\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|playlist\?list=)|youtu\.be\/)([\w-]{11})/;

    const isValid = (value: string) => {
        return appOptions.debugMode ? true : validateRegex.test(value);
    };

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

    const renderTag = (option: string) => {       
        return (
            <Tooltip key={option} title={option} arrow disableHoverListener={valueCount === 1} enterDelay={500} leaveDelay={100} enterNextDelay={500} placement="bottom">
                <Chip
                    variant="filled"
                    label={valueCount === 1 ? _replace(option, truncateRegex, "") : _truncate(_replace(option, truncateRegex, ""), {length: valueCount === 2 ? 30 : 20})}
                    onDelete={() => !loading && handleDelete(option)}
                />
            </Tooltip>
        );
    };

    return (
        <Grid className={Styles.inputPanel} container spacing={2} padding={2}>
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
                    renderTags={(value) => _map(value, renderTag)}
                    renderInput={(params: AutocompleteRenderInputParams) => (
                        <TextField
                            {...params}
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
                        <Button disabled={loading} variant="contained" disableElevation color="secondary" onClick={() => handleOpenFromFile()}>
                            <FolderIcon />
                        </Button>
                    </Tooltip>
                    <Tooltip title={t("loadInfo")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="bottom">
                        <Button disabled={loading || _isEmpty(urls)} variant="contained" disableElevation color="secondary" onClick={() => onLoadInfo(urls)}>
                            <InfoIcon/>
                        </Button>
                    </Tooltip>
                    {showDownloadFailed &&
                        <Tooltip title={t("downloadFailed")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="bottom">
                            <Button disabled={loading || _isEmpty(urls)} variant="contained" disableElevation color="secondary" onClick={onDownloadFailed}>
                                <ReplayIcon />
                            </Button>
                        </Tooltip>
                    }
                    {!loading &&
                        <Tooltip title={t("downloadAll")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="bottom">
                            <Button disabled={loading || _isEmpty(urls)} variant="contained" disableElevation color="secondary" onClick={() => onDownload(urls)}>
                                <DownloadIcon />
                            </Button>
                        </Tooltip>
                    }
                    {loading && !_isEmpty(playlists) &&
                        <Tooltip title={t("cancelAll")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="bottom">
                            <Button variant="contained" disableElevation color="secondary" onClick={onCancel}>
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
