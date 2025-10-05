import classnames from "classnames";
import React from "react";

import {Box, CircularProgress, CircularProgressProps, Typography} from "@mui/material";

import {splitDataAttributes} from "../../common/Helpers";
import Styles from "./Progress.styl";

export type ProgressProps = CircularProgressProps & {
    labelScale?: number;
    label?: boolean;
    renderLabel?: (value: number) => React.ReactNode;
    position?: "absolute" | "inline";
};

export const Progress: React.FC<ProgressProps> = (props) => {
    const [dataProps, otherProps] = splitDataAttributes(props);
    const {size, labelScale = 1, label = true, renderLabel, position = "inline", className, ...rest} = otherProps;
    return (
        <Box className={classnames(Styles.progress, className, Styles[position])} {...dataProps}>
            <CircularProgress variant="determinate" size={size} {...rest} />
            {label && <Box className={Styles.labelWrapper}>
                <Typography variant="caption" sx={{scale: labelScale}}>{renderLabel ? renderLabel(props.value) : `${Math.round(props.value)}%`}</Typography>
            </Box>}
        </Box>
    );
};

export default Progress;
