import React, {useState} from "react";

import {Button, TextField, TextFieldProps} from "@mui/material";

const DirectoryPicker = (props: TextFieldProps<"outlined">) => {
    const {className, value, ...rest} = props;
    const [directoryPath, setDirectoryPath] = useState<string>("");

    const handleDirectorySelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const path = files[0].webkitRelativePath.split("/")[0];
            setDirectoryPath(path);
        }
    };

    return (
        <div className={className}>
            <input
                type="file"
                // dir=""
                onChange={handleDirectorySelect}
                style={{display: "none"}}
                id="directory-input"
            />
            <label htmlFor="directory-input">
                <Button variant="contained" component="span">
                    Select Directory
                </Button>
            </label>
            <TextField
                label="Selected Directory"
                variant="outlined"
                fullWidth
                value={directoryPath}
                InputProps={{readOnly: true}}
                sx={{mt: 2}}
                {...rest}
            />
        </div>
    );
};

export default DirectoryPicker;
