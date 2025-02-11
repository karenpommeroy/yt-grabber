import React from "react";

import {Box, CircularProgress, CircularProgressProps, Typography} from "@mui/material";

import Styles from "./Progress.styl";

export const Progress: React.FC<CircularProgressProps> = (props) => {
    return (
        <Box className={Styles.progress}>
            <CircularProgress variant="determinate" {...props} />
            <Box className={Styles.labelWrapper}>
                <Typography variant="caption">{`${Math.round(props.value)}%`}</Typography>
            </Box>
        </Box>
    );
};

export default Progress;
