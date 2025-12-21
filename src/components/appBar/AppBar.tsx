import classnames from "classnames";
import {useTranslation} from "react-i18next";

import CloseIcon from "@mui/icons-material/Close";
import HelpIcon from "@mui/icons-material/Help";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
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
    const {disableNavigation, ...rest} = props;
    const {state, actions} = useAppContext();
    const {onClick} = useClickCounter(() => handleOpenDevelopment(), 3, 500);
    const {t} = useTranslation();

    const handleOpenDevelopment = () => {
        if (disableNavigation) return;

        actions.setLocation("/development");
    };

    const handleOpenSettings = () => {
        if (disableNavigation) return;

        actions.setLocation("/settings");
    };

    const onHelpClick = () => {
        actions.setHelp(!state.help);
    };

    const handleClose = () => {
        if (disableNavigation) return;

        actions.setLocation("/");
    };

    const createSettingsButton = () => {
        if (state.location !== "/") {
            return (
                <div>
                    <IconButton data-testid="settings-close-icon" onClick={handleClose} color="inherit" className={Styles.icon}>
                        <CloseIcon />
                    </IconButton>
                </div>
            );
        } else {
            return (
                <div>
                    <IconButton data-testid="settings-button" name="settings" data-help="settings" disabled={disableNavigation} onClick={handleOpenSettings} color="inherit" className={Styles.icon}>
                        <SettingsIcon />
                    </IconButton>
                </div>
            );
        }
    };

    return (
        <ApplicationBar elevation={0} position="static" className={Styles.appBar} {...rest}>
            <Container maxWidth="xl" className={Styles.wrapper}>
                <Toolbar disableGutters variant="dense">
                    <Logo data-testid="logo" onClick={onClick} className={Styles.logo} />
                    <Typography data-testid="app-title" className={Styles.title} variant="h6" noWrap>
                        YT GRABBER
                    </Typography>
                    <Box sx={{flexGrow: 1}}></Box>
                    <Stack direction="row" gap={1}>
                        <LanguagePicker data-testid="language-picker" data-help="languagePicker" className={Styles.languagePicker} showArrow={false} mode={ComponentDisplayMode.Minimal} sx={{ marginRight: 1}} />
                        <IconButton data-testid="help-button" color="inherit" data-help="help-toggle" className={classnames(Styles.icon, Styles.help, {[Styles.active]: state.help})} onClick={onHelpClick}>{state.help ? <HelpIcon/> : <HelpOutlineIcon/>}</IconButton>
                        <Tooltip title={state.location === "/settings" ? t("closeSettings") : t("openSettings")}>
                            {createSettingsButton()}
                        </Tooltip>
                    </Stack>
                </Toolbar>
            </Container>
        </ApplicationBar>
    );
};

export default AppBar;
