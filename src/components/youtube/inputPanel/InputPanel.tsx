import _filter from "lodash/filter";
import _isEmpty from "lodash/isEmpty";
import _isFunction from "lodash/isFunction";
import _map from "lodash/map";
import React, {useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";

import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";
import FolderIcon from "@mui/icons-material/Folder";
import InfoIcon from "@mui/icons-material/Info";
import ReplayIcon from "@mui/icons-material/Replay";
import {
    Autocomplete, AutocompleteRenderInputParams, Button, Chip, IconButton, Stack, TextField
} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {ApplicationOptions} from "../../../common/Store";
import {useDataState} from "../../../react/contexts/DataContext";
import Styles from "./InputPanel.styl";

export type InputPanelProps = {
    value?: string;
    values?: string[];
    mode?: "single" | "multi";
    loading?: boolean;
    onChange?: (value: string | string[]) => void;
    onDownload: (...args: any[]) => void;
    onDownloadFailed: () => void;
    onLoadInfo: (...args: any[]) => void;
    onClear: () => void;
};

export const InputPanel: React.FC<InputPanelProps> = (props: InputPanelProps) => {
    const {value, values, mode = "single", loading, onChange, onDownload, onDownloadFailed, onLoadInfo, onClear} = props;
    const [appOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const {album, trackStatus} = useDataState();
    const [validationError, setValidationError] = useState<string>();
    const {t} = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateUrl = (value: string) => {
        const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:music\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|playlist\?list=)|youtu\.be\/)([\w-]{11})/;

        const valid = appOptions.debugMode ? true : youtubeRegex.test(value);
       
        if (!valid) {
            setValidationError(t("invalidYoutubeUrl"));
        } else {
            setValidationError(null);
        }

        return valid;
    };

    const handleDelete = (valueToDelete: any) => {
        if (_isFunction(onChange)) {
            onChange(_filter(values, (v) => v !== valueToDelete));
        }
    };

    const showDownloadFailed = useMemo(() => {
        return !_isEmpty(_filter(trackStatus, "error"));
    }, [trackStatus]);

    const onSingleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        validateUrl(event.target.value);

        if (_isFunction(onChange)) {
            onChange(event.target.value);
        }
    };

    const onMultiValueChange = (event: React.ChangeEvent<HTMLInputElement>, newValue: string[]) => {
        if (_isFunction(onChange)) {
            onChange(newValue);
        }
    };

    const onKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            onDownload(value);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        
        if (!file) return;
    
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target?.result as string;
            const lines = content.split("\n");
            
            if (_isFunction(onChange)) {
                onChange(lines);
            }
            // setValues(lines);
        };
        reader.readAsText(file);
        event.target.value = "";
    };

    return (
        <Grid className={Styles.inputPanel} container spacing={2} padding={2}>
            <Grid size="grow">
                {mode === "single" && <TextField
                    onKeyUp={onKeyUp}
                    fullWidth
                    label={t("youtubeUrl")}
                    variant="outlined"
                    value={value}
                    onChange={onSingleValueChange}
                    helperText={validationError}
                    error={!!validationError}
                />}
                {mode === "multi" &&
                    <Autocomplete
                        multiple
                        freeSolo
                        fullWidth
                        limitTags={2}
                        options={[]}
                        value={values}
                        // onChange={(event, newValue) => setValues(newValue)}
                        onChange={onMultiValueChange}
                        defaultValue={[]}
                        renderTags={(value, getTagProps) => _map(value, (option, index) => (
                            <Chip
                                key={index}
                                label={option}
                                {...getTagProps({ index })}
                                onDelete={() => handleDelete(option)}
                            />
                        ))}
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
                                            <IconButton color="primary" onClick={handleButtonClick}>
                                                <FolderIcon />
                                            </IconButton>
                                            {params.InputProps.startAdornment}
                                            <input ref={fileInputRef} type="file" hidden onChange={onSelectFile} accept=".txt" />
                                        </>
                                    }
                                }}
                            />
                        )}
                    />
                }
            </Grid>
            <Grid>
                <Stack direction="row" spacing={1}>
                    {album &&
                        <Button disabled={loading || _isEmpty(value) || !!validationError} title={t("clear")} variant="contained" disableElevation color="secondary" onClick={onClear}>
                            <ClearIcon />
                        </Button>
                    }
                    <Button disabled={loading || _isEmpty(value) || !!validationError} title={t("loadInfo")} variant="contained" disableElevation color="secondary" onClick={() => onLoadInfo(value)}>
                        <InfoIcon/>
                    </Button>
                    {showDownloadFailed &&
                        <Button disabled={loading || _isEmpty(value) || !!validationError} title={t("downloadFailed")} variant="contained" disableElevation color="secondary" onClick={onDownloadFailed}>
                            <ReplayIcon />
                        </Button>
                    }
                    <Button disabled={loading || _isEmpty(value) || !!validationError} title={t("download")} variant="contained" disableElevation color="secondary" onClick={() => onDownload(value)}>
                        <DownloadIcon/>
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    );
};

export default InputPanel;
