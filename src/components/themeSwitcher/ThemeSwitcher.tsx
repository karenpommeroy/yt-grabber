import classnames from "classnames";
import React from "react";
import {useTranslation} from "react-i18next";

import DarkModeIcon from "@mui/icons-material/DarkModeRounded";
import LightModeIcon from "@mui/icons-material/LightModeRounded";
import {ButtonProps, IconButton} from "@mui/material";
import {useColorScheme} from "@mui/material/styles";

import Styles from "./ThemeSwitcher.styl";

export type IThemeSwitcherProps = ButtonProps

export const ThemeSwitcher = (props: IThemeSwitcherProps) => {
    const {className, ...rest} = props;
    const {t} = useTranslation();
    const {mode, systemMode, setMode} = useColorScheme();
    const resolvedMode = (systemMode || mode) as "light" | "dark";

    const icon = {
        dark: <LightModeIcon />,
        light: <DarkModeIcon />,
    }[resolvedMode];

    const tooltip = {
        light: t("dark"),
        dark: t("light"),
    }[resolvedMode];

    const onChangeMode = () => {
        const nextMode = mode === "dark" ? "light" : "dark";  
       
        setMode(nextMode);
    };
   
    return (
        <div className={classnames(Styles.themeSwitcher, className)}>
            <IconButton size="small" color="inherit" className={Styles.button} title={tooltip} onClick={onChangeMode} {...rest}>{icon}</IconButton>
        </div>
    );
};

export default ThemeSwitcher;
