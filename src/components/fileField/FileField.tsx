import classnames from "classnames";
// import fs from "fs-extra";
import _first from "lodash/first";
import _get from "lodash/get";
import _isFunction from "lodash/isFunction";
import _join from "lodash/join";
import _union from "lodash/union";
import React, {useRef} from "react";

import FolderIcon from "@mui/icons-material/Folder";
import {IconButton, InputAdornment, TextField, TextFieldProps} from "@mui/material";

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
    const rootPath = "./";
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        fileInputRef.current?.click();
    };

    const resolveDirectory = (files: FileList) => {
        if (multiple) {
            const paths = [];

            for (const file of files) {
                paths.push(rootPath + file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf("/")));
            }

            return _union(paths);
        } else {
            const firstFilePath = _get(_first(files), "webkitRelativePath");
            
            return [rootPath + _first(firstFilePath.split("/"))];
        }
    };

    const resolveFile = (files: FileList): string[] => {
        if (multiple) {
            const paths = [];

            for (const file of files) {
                paths.push(rootPath + file.webkitRelativePath);
            }

            return paths;
        } else {
            return [rootPath + _get(_first(files), "webkitRelativePath")];
        }
    };

    // async function readDirectory(dirHandle: any, path: any) {
    //     for await (const entry of dirHandle.values()) {
    //         const fullPath = path ? `${path}/${entry.name}` : entry.name;
            
    //         if (entry.kind === "file") {
    //             console.log("File:", fullPath);
    //         } else if (entry.kind === "directory") {
    //             console.log("Directory:", fullPath); // Logs even empty directories
    //             await readDirectory(entry, fullPath); // Recursively read subdirectories
    //         }
    //     }
    // }

    const onSelectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        // const dirHandle = await (window as any).showDirectoryPicker();
        // await readDirectory(dirHandle, "");

        const result = mode === "directory" ? resolveDirectory(event.target.files) : resolveFile(event.target.files);
        // const outPath = fs.realpathSync(result[0]);

        // setFieldValue(result);
        // if (_isFunction(onChange)) {
        //     onChange(fs.existsSync(outPath) ? [outPath] : result);
        // }
        if (_isFunction(onChange)) {
            onChange(result);
        }
        event.target.value = "";

        // const reader = new FileReader();

        // reader.onload = (e) => {
        //     const content = e.target?.result as string;
        //     const lines = content.split("\n");

        // if (_isFunction(onChange)) {
        //     onChange(lines);
        // }
        // setFieldValue(lines);
        // };
        // reader.readAsText(file);
    };

    // useEffect(() => {
    //     if (_isFunction(onChange)) {
    //         onChange(fieldValue);
    //     }
    // }, [fieldValue]);

    return (
        <>
            <TextField
                {...rest}
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
            />
            {/* eslint-disable react/no-unknown-property */ }
            {/* @ts-expect-error fix for webkitdirectory */}
            <input ref={fileInputRef} type="file" webkitdirectory="" directory="" multiple hidden onChange={onSelectFile} accept={mode === "file" ? _join(fileTypes) : undefined} />
        </>
    );
};

export default FileField;
