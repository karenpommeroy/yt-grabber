import classnames from "classnames";
import {ipcRenderer, IpcRendererEvent} from "electron";
import _isFunction from "lodash/isFunction";
import _join from "lodash/join";
import React, {useEffect, useRef} from "react";

import FolderIcon from "@mui/icons-material/Folder";
import {IconButton, InputAdornment, TextField, TextFieldProps} from "@mui/material";

import {Messages} from "../../messaging/Messages";
import Styles from "./FileField.styl";

export type FileFieldProps = Omit<TextFieldProps, "onChange" | "onBlur"> & {
    mode?: "file" | "directory";
    value?: string;
    multiple?: boolean;
    fileTypes?: string[];
    onChange?: (value: string[]) => void;
    onBlur?: (value: string[]) => void;
};

export const FileField: React.FC<FileFieldProps> = (props) => {
    const {mode = "file", fileTypes, value, multiple, className, onChange, onBlur, ...rest} = props;

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        ipcRenderer.on(Messages.OpenSelectPathDialogCompleted, onOpenSelectPathDialogCompleted);

        return () => {
            ipcRenderer.off(Messages.OpenSelectPathDialogCompleted, onOpenSelectPathDialogCompleted);
        };
    }, []);

    const onOpenSelectPathDialogCompleted = (event: IpcRendererEvent, data: string) => {
        const parsed = JSON.parse(data);
        
        if (parsed.paths && _isFunction(onChange)) {
            onChange([parsed.paths]);
        }
    };

    const onOpenSelectPathDialog = () => {
        ipcRenderer.send(Messages.OpenSelectPathDialog, {directory: mode === "directory", multiple, defaultPath: value});
    };

    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (_isFunction(onChange)) {
            onChange([event.target.value]);
        }
    };
    
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        if (_isFunction(onBlur)) {
            onBlur([event.target.value]);
        }
    };

    const handleButtonClick = () => {
        onOpenSelectPathDialog();
    };


    const onSelectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        event.target.value = "";
    };

    return (
        <>
            <TextField
                className={classnames(Styles.fileField, className)}
                value={value}
                onChange={handleValueChange}
                onBlur={handleBlur}
                slotProps={{
                    input: {
                        endAdornment: <InputAdornment position="end">
                            <IconButton
                                onClick={handleButtonClick}
                                edge="end"
                                >
                                <FolderIcon />
                            </IconButton>
                        </InputAdornment>,
                    },
                }}
                {...rest}
            />
            {/* eslint-disable react/no-unknown-property */ }
            {/* @ts-expect-error fix for webkitdirectory */}
            <input ref={fileInputRef} type="file" webkitdirectory="" directory="" multiple hidden onChange={onSelectFile} accept={mode === "file" ? _join(fileTypes) : undefined} />
        </>
    );
};

export default FileField;
