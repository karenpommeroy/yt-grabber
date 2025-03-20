import React from "react";

import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import {Stack} from "@mui/material";
import ApplicationBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import ComponentDisplayMode from "../../common/ComponentDisplayMode";
import {useClickCounter} from "../../hooks/useClickCounter";
import {useAppContext} from "../../react/contexts/AppContext";
import LanguagePicker from "../languagePicker/LanguagePicker";
import Logo from "../logo/Logo";
import Styles from "./AppBar.styl";

export type AppBarProps = {
    disableNavigation?: boolean;
};

const AppBar = (props: AppBarProps) => {
    const {disableNavigation} = props;
    const {state, actions} = useAppContext();
    const {onClick} = useClickCounter(() => handleOpenDevelopment(), 3, 500);

    const handleOpenDevelopment = () => {
        if (disableNavigation) return;

        actions.setLocation("/development");
    };

    const handleOpenSettings = () => {
        if (disableNavigation) return;

        actions.setLocation("/settings");
    };

    const handleClose = () => {
        if (disableNavigation) return;

        actions.setLocation("/");
    };

    const createSettingsButton = () => {
        if (state.location !== "/") {
            return (
                <IconButton onClick={handleClose} color="inherit" className={Styles.icon}>
                    <CloseIcon />
                </IconButton>
            );
        } else {
            return (
                <IconButton disabled={disableNavigation} onClick={handleOpenSettings} color="inherit" className={Styles.icon}>
                    <SettingsIcon />
                </IconButton>
            );
        }
    };

    return (
        <ApplicationBar elevation={0} position="static" className={Styles.appBar}>
            <Container maxWidth="xl" className={Styles.wrapper}>
                <Toolbar disableGutters variant="dense">
                    <Logo onClick={onClick} className={Styles.logo} />
                    <Typography className={Styles.title} variant="h6" noWrap>
                        YT GRABBER
                    </Typography>
                    <Box sx={{flexGrow: 1}}></Box>
                    <Stack direction="row" gap={1}>
                        <LanguagePicker showArrow={false} mode={ComponentDisplayMode.Minimal} />
                        <Tooltip title={state.location === "/settings" ? "Close settings" : "Open settings"}>
                            {createSettingsButton()}
                        </Tooltip>
                    </Stack>
                </Toolbar>
            </Container>
        </ApplicationBar>
    );
};

export default AppBar;
