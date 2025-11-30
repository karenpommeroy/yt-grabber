import {isEmpty, map} from "lodash-es";
import React, {HTMLAttributes} from "react";
import {useTranslation} from "react-i18next";

import CancelIcon from "@mui/icons-material/Cancel";
import ErrorIcon from "@mui/icons-material/Error";
import {
    Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip
} from "@mui/material";

import {useDataState} from "../../../react/contexts/DataContext";
import Styles from "./LogMenu.styl";

export type LogMenuProps = HTMLAttributes<HTMLDivElement>;

export const LogMenu: React.FC<LogMenuProps> = (props) => {
    const {hidden} = props;
    const {errors, warnings} = useDataState();
    const [errorAnchorEl, setErrorAnchorEl] = React.useState<null | HTMLElement>(null);
    const [warningAnchorEl, setWarningAnchorEl] = React.useState<null | HTMLElement>(null);
    const errorMenuOpen = Boolean(errorAnchorEl);
    const warningMenuOpen = Boolean(warningAnchorEl);
    const {t} = useTranslation();
    
    const handleErrorClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setWarningAnchorEl(null);
        setErrorAnchorEl(event.currentTarget);
    };

    const handleWarningClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setErrorAnchorEl(null);
        setWarningAnchorEl(event.currentTarget);
    };

    const handleErrorClose = () => {
        setErrorAnchorEl(null);
    };

    const handleWarningClose = () => {
        setWarningAnchorEl(null);
    };

    if (hidden) return null;

    return (
        <div className={Styles.logMenu} data-help="logMenu">
            <Tooltip title={t("errors")} arrow enterDelay={500} leaveDelay={100} enterNextDelay={500}>
                <div>
                    <IconButton className={Styles.logButton} color="error" disabled={isEmpty(errors)} onClick={handleErrorClick}>
                        <CancelIcon />
                    </IconButton>
                </div>
            </Tooltip>
            <Tooltip title={t("warnings")} arrow enterDelay={500} leaveDelay={100} enterNextDelay={500}>
                <div>
                    <IconButton className={Styles.logButton} color="warning" disabled={isEmpty(warnings)} onClick={handleWarningClick}>
                        <ErrorIcon />
                    </IconButton>
                </div>
            </Tooltip>
            <Menu
                anchorEl={errorAnchorEl}
                open={errorMenuOpen}
                onClose={handleErrorClose}
                anchorReference="anchorEl"
                anchorOrigin={{vertical: "top", horizontal: "center"}}
                transformOrigin={{vertical: "bottom", horizontal: "center"}}                
                slotProps={{
                    list: {
                        className: Styles.logMenuList,
                    }
                }}
            >
                {map(errors, (error, index) =>([
                    <MenuItem key={index} dense onClick={handleErrorClose} className={Styles.logEntry}>
                        <ListItemIcon className={Styles.logEntryIcon}>
                            <CancelIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={error.url}
                            secondary={error.message}
                            slotProps={{
                                primary: {
                                    paddingBottom: .5
                                },
                                secondary: {
                                    whiteSpace: "normal",
                                }
                            }}
                        />
                    </MenuItem>,
                    index < errors.length - 1 && <Divider key={index + "_divider"} color="white" variant="middle" />
                ]))}
            </Menu>
            <Menu
                anchorEl={warningAnchorEl}
                open={warningMenuOpen}
                onClose={handleWarningClose}
                anchorReference="anchorEl"
                anchorOrigin={{vertical: "top", horizontal: "center"}}
                transformOrigin={{vertical: "bottom", horizontal: "center"}}                
                slotProps={{
                    list: {
                        className: Styles.logMenuList,
                    }
                }}
            >
                {map(warnings, (warning, index) =>([
                    <MenuItem key={index} dense onClick={handleWarningClose} className={Styles.logEntry}>
                        <ListItemIcon className={Styles.logEntryIcon}>
                            <ErrorIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={warning.url}
                            secondary={warning.message}
                            slotProps={{
                                primary: {
                                    paddingBottom: .5
                                },
                                secondary: {
                                    whiteSpace: "normal",
                                }
                            }}
                        />
                    </MenuItem>,
                    index < warnings.length - 1 && <Divider key={index + "_divider"} color="white" variant="middle" />
                ]))}
            </Menu>
        </div>
    );
};

export default LogMenu;
