import classnames from "classnames";
import $_ from "lodash";
import moment from "moment";
import path from "path";
import React, {HTMLAttributes, useState} from "react";
import {useTranslation} from "react-i18next";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
    Box, BoxProps, Button, CircularProgress, ClickAwayListener, Menu, MenuItem, Theme, useMediaQuery
} from "@mui/material";

import {ComponentDisplayMode} from "../../common/ComponentDisplayMode";
import Styles from "./LanguagePicker.styl";

const isMac = process.platform === "darwin";
const isDev = process.env.NODE_ENV === "development";
const prependPath = isMac && !isDev ? path.join(process.resourcesPath, "..") : ".";

export type LanguagePickerProps = Omit<HTMLAttributes<HTMLDivElement> & BoxProps, "onClick"> & {
    className?: string;
    mode?: ComponentDisplayMode;
    showArrow?: boolean;
}

export type LanguagePickerTriggerProps = Omit<HTMLAttributes<HTMLButtonElement>, "onClick"> & LanguagePickerProps & {
    loading?: boolean;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export type LanguagePickerItemProps = LanguagePickerProps & {
    lang?: string;
    onClick?: (lang: string) => void;
}

export const LanguagePicker = (props: LanguagePickerProps) => {
    const { mode, showArrow = true, className, ...rest } = props;
    const { i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const langs = $_.get(i18n, "options.supportedLngs");
    const availableLocales: string[] = !langs ? [] : $_.without(langs, "cimode").sort();
    const displayMode = $_.defaultTo(
        mode,
        useMediaQuery((theme: Theme) => theme.breakpoints.down("md"))
            ? ComponentDisplayMode.Minimal
            : ComponentDisplayMode.Full,
    );

    const onClose = () => setAnchorEl(null);

    const onClickAway = (event: any) => {
        if (anchorEl && anchorEl.contains(event.target)) return;

        onClose();
    };

    const onTriggerClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);

    const onItemClick = async (lang: string) => {
        if (!$_.isEqual(lang, i18n.language)) {
            setLoading(true);
            i18n.changeLanguage(lang, () => setLoading(false));
            moment.locale(lang);
            global.store.set("application.language", lang);
        }

        onClose();
    };

    return (
        <Box className={classnames(Styles.languagePicker,className)} {...rest}>
            <LanguagePickerTrigger showArrow={showArrow} mode={displayMode} loading={loading} onClick={onTriggerClick} />
            <ClickAwayListener onClickAway={onClickAway}>
                <Menu
                    anchorEl={anchorEl}
                    disablePortal={true}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                    PopoverClasses={{ root: Styles.languagePickerBackdrop, paper: Styles.languagePickerMenu }}
                    transformOrigin={{ vertical: -40, horizontal: "center" }}
                    open={Boolean(anchorEl)}
                    onClose={onClose}
                >
                    {$_.map(availableLocales, (item) => (
                        <LanguagePickerItem
                            key={item}
                            lang={item}
                            onClick={onItemClick}
                            mode={displayMode}
                        />
                    ))}
                </Menu>
            </ClickAwayListener>
        </Box>
    );
};

export const LanguagePickerTrigger = (props: LanguagePickerTriggerProps) => {
    const { loading, onClick, mode, showArrow } = props;
    const { i18n, t } = useTranslation();
    
    return (
        <Button
            fullWidth={true}
            onClick={onClick}
            className={Styles.languagePickerTrigger}
            variant="text"
            disableElevation={true}
            color="inherit"
        >
            <span
                className={Styles.icon}
                style={{
                    backgroundImage: `url("${prependPath}/resources/locales/${i18n.language}/flag.svg")`,
                }}
            />
            {mode > ComponentDisplayMode.Compact && (
                <React.Fragment>
                    <span className={classnames("uppercase", Styles.name)}>{t("langName", { lng: i18n.language })}</span>
                    {loading && <CircularProgress />}
                </React.Fragment>
            )}
            {showArrow && <ArrowDropDownIcon fontSize="medium" color="inherit" />}
        </Button>
    );
};

export const LanguagePickerItem = (props: LanguagePickerItemProps) => {
    const { lang, onClick } = props;
    const { t } = useTranslation();

    return (
        <MenuItem key={lang} data-id={lang} onClick={() => onClick(lang)} className={Styles.languagePickerItem}>
            <span
                className={Styles.icon}
                style={{
                    backgroundImage: `url("${prependPath}/resources/locales/${lang}/flag.svg")`,
                }}
            />
            <span className={classnames("capitalize", Styles.name)}>{t("langName", { lng: lang })}</span>
        </MenuItem>
    );
};

export default LanguagePicker;
