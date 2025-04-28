import classnames from "classnames";
import _find from "lodash/find";
import _map from "lodash/map";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";

import AlbumIcon from "@mui/icons-material/Album";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import YouTubeIcon from "@mui/icons-material/YouTube";
import {Button, ButtonProps, Grow, MenuItem, MenuList, Paper, Popper, Tooltip} from "@mui/material";
import ClickAwayListener from "@mui/material/ClickAwayListener";

import {InputMode} from "../../../common/Media";
import {ApplicationOptions} from "../../../common/Store";
import Styles from "./InputModePicker.styl";

export type InputModePickerProps = ButtonProps;

export type InputModeOption = {
    id: InputMode;
    name: string;
    icon: React.ElementType;
    color: string;
}

export const InputModePicker: React.FC<InputModePickerProps> = (props) => {
    const {disabled, className} = props;
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLButtonElement>(null);
    const {t} = useTranslation();
    const [applicationOptions, setApplicationOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const [debouncedApplicationOptions] = useDebounceValue(applicationOptions, 500, {leading: true});
    const options = [
        {id: InputMode.Auto, name: t("autodetect"), icon: YouTubeIcon, color: "secondary"},
        {id: InputMode.Artists, name: t("artists"), icon: TheaterComedyIcon, color: "success"},
        {id: InputMode.Albums, name: t("albums"), icon: AlbumIcon, color: "warning"},
        {id: InputMode.Songs, name: t("songs"), icon: AudiotrackIcon, color: "primary"},
    ];
    const [selected, setSelected] = React.useState<InputModeOption>(_find(options, ["id", applicationOptions.inputMode]));

    useEffect(() => {
        global.store.set("application", debouncedApplicationOptions);
    }, [debouncedApplicationOptions]);

    const handleMenuItemClick = (value: InputModeOption) => {
        setSelected(value);
        setApplicationOptions((prev) => ({...prev, inputMode: value.id}));
        setOpen(false);
    };

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event: Event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
            return;
        }

        setOpen(false);
    };

    return (
        <div className={classnames(Styles.inputModePicker, className)} data-help="selectInputMode">
            <Tooltip title={t("selectInputMode")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="bottom">
                <Button disabled={disabled} className={Styles.button} variant="contained" color={selected.color as any} disableElevation onClick={handleToggle} ref={anchorRef}>
                    <selected.icon className={Styles.icon} />
                    <ArrowDropDownIcon />
                </Button>
            </Tooltip>
            <Popper
                className={Styles.popper}
                open={open}
                anchorEl={anchorRef.current}
                transition
                disablePortal
            >
                {({TransitionProps}) => (
                    <Grow {...TransitionProps}>
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList autoFocusItem>
                                    {_map(options, (option, index) => (
                                        <MenuItem
                                            key={index}
                                            className={Styles.menuItem}
                                            selected={option.id === selected.id}
                                            onClick={() => handleMenuItemClick(option)}
                                        >
                                            <option.icon />
                                            {option.name}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </div>
    );
};

export default InputModePicker;
