import React from "react";

import {TextField, TextFieldProps} from "@mui/material";

export type StyledTextFieldProps = TextFieldProps & {
    labelFontSize?: string;
};

export const StyledTextField: React.FC<StyledTextFieldProps> = (props) => {
    const {labelFontSize = "17px", sx, ...rest} = props;

    return (
        <TextField
            sx={Object.assign({
                "& .MuiInputLabel-shrink": {
                    fontSize: labelFontSize,
                    lineHeight: `calc(${labelFontSize} * 1.03)`
                },
                "& .MuiInputBase-root .MuiOutlinedInput-notchedOutline": {
                    fontSize: labelFontSize,
                }
            }, sx)}
            {...rest}
        />
    );
};

export default StyledTextField;
