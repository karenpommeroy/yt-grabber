import React from "react";

import {Box, BoxProps} from "@mui/material";

import IconSvg from "../../resources/icons/logo-shape.svg";

const Logo: React.FC<BoxProps> = (props) => {
    return (
        <Box {...props}>
            <img width="100%" height="100%" src={IconSvg} />
        </Box>
    );
};

export default Logo;
