import classnames from "classnames";
import _map from "lodash/map";
import React from "react";
import {useTranslation} from "react-i18next";

import SystemModeIcon from "@mui/icons-material/ComputerRounded";
import DarkModeIcon from "@mui/icons-material/DarkModeRounded";
import LightModeIcon from "@mui/icons-material/LightModeRounded";
import {
    FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, SelectProps
} from "@mui/material";
import {useColorScheme} from "@mui/material/styles";

import Styles from "./ThemePicker.styl";

export type IThemePickerProps = SelectProps;

export type ThemeMode = "dark" | "light" | "system";

export const ThemePicker = (props: IThemePickerProps) => {
    const {className, ...rest} = props;
    const {t} = useTranslation();
    const {mode, setMode} = useColorScheme();
    const themeModes: ThemeMode[] = ["light", "dark", "system"];

    const resolveIcon = (mode: ThemeMode) => {
        if (mode === "dark") {
            return <DarkModeIcon className={Styles.icon} />;
        } else if (mode === "light") {
            return <LightModeIcon className={Styles.icon} />;
        }

        return <SystemModeIcon className={Styles.icon} />;
    };

    const onChangeMode = (event: SelectChangeEvent<ThemeMode>) => {       
        setMode(event.target.value as ThemeMode);
    };
   
    return (
        <FormControl fullWidth className={classnames(Styles.themePicker, className)}>
            <InputLabel id="theme-mode-picker-label">{t("themeMode")}</InputLabel>
            <Select
                SelectDisplayProps={{
                    className: Styles.select
                }}
                labelId="theme-mode-picker-label"
                value={mode}
                label={t("themeMode")}
                onChange={onChangeMode}
                MenuProps={{
                    disablePortal: true
                }}
                {...rest}
            >
                {_map(themeModes, (item) => <MenuItem key={item} value={item} className={Styles.menuItem}>
                    {resolveIcon(item)}
                    <div>{item}</div>
                </MenuItem>)}
            </Select>
        </FormControl>
    );
};

export default ThemePicker;
