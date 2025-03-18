import classnames from "classnames";
import React from "react";

import {Box, CircularProgress, CircularProgressProps, Typography} from "@mui/material";

import Styles from "./Progress.styl";

export type ProgressProps = CircularProgressProps & {
    labelScale?: number;
    renderLabel?: (value: number) => React.ReactNode;
};

export const Progress: React.FC<ProgressProps> = (props) => {
    const {size, labelScale = 1, renderLabel, className, ...rest} = props;

    return (
        <Box className={classnames(Styles.progress, className)}>
            <CircularProgress variant="determinate" size={size} {...rest} />
            <Box className={Styles.labelWrapper}>
                <Typography variant="caption" sx={{scale: labelScale}}>{renderLabel ? renderLabel(props.value) : `${Math.round(props.value)}%`}</Typography>
            </Box>
        </Box>
    );
};

export default Progress;
