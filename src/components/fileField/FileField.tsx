import classnames from "classnames";
import {ipcRenderer, IpcRendererEvent} from "electron";
import isFunction from "lodash-es/isFunction";
import join from "lodash-es/join";
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
    const {id, mode = "file", fileTypes, value, multiple, className, onChange, onBlur, ...rest} = props;

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        ipcRenderer.on(`${Messages.OpenSelectPathDialogCompleted}_${id}`, onOpenSelectPathDialogCompleted);

        return () => {
            ipcRenderer.off(`${Messages.OpenSelectPathDialogCompleted}_${id}`, onOpenSelectPathDialogCompleted);
        };
    }, []);

    const onOpenSelectPathDialogCompleted = (event: IpcRendererEvent, data: string) => {
        const parsed = JSON.parse(data);
        
        if (parsed.paths && isFunction(onChange)) {
            onChange([parsed.paths]);
        }
    };

    const onOpenSelectPathDialog = () => {
        ipcRenderer.send(Messages.OpenSelectPathDialog, {directory: mode === "directory", multiple, defaultPath: value, id});
    };

    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (isFunction(onChange)) {
            onChange([event.target.value]);
        }
    };
    
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        if (isFunction(onBlur)) {
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
            <input ref={fileInputRef} type="file" webkitdirectory="" directory="" multiple hidden onChange={onSelectFile} accept={mode === "file" ? join(fileTypes) : undefined} />
        </>
    );
};

export default FileField;
