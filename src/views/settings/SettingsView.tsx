import classnames from "classnames";
import {LaunchOptions} from "puppeteer";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";

import {Box, Button, FormControlLabel, Paper, Stack, Switch, TextField} from "@mui/material";
import Grid from "@mui/material/Grid2";

import NumberField from "../../components/numberField/NumberField";
import {useAppContext} from "../../react/contexts/AppContext";
import Styles from "./SettingsView.styl";

export const SettingsView: React.FC = () => {
    const {actions} = useAppContext();
    const {t} = useTranslation();
    const [puppeteerOptions, setPuppeteerOptions] = useState<LaunchOptions>(global.store.get("options"));
    const [debouncedPuppeteerOptions] = useDebounceValue(puppeteerOptions, 500);

    const handleClose = async () => {
        actions.setLocation("/");
    };

    const handleShowBrowserChange = (e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
        setPuppeteerOptions((prev) => ({...prev, headless: !checked}));
    };

    const handleChromeExecutablePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPuppeteerOptions((prev) => ({...prev, executablePath: e.target.value}));
    };

    useEffect(() => {
        global.store.set("options", debouncedPuppeteerOptions);
    }, [debouncedPuppeteerOptions]);

    return (
        <Box className={Styles.settings}>
            <Stack
                component="form"
                className={Styles.form}
                direction="row"
                spacing={2}
            >
                <Stack spacing={3} className={classnames(Styles.rootColumn, Styles.left)}>
                </Stack>
                <Stack spacing={2} className={classnames(Styles.rootColumn, Styles.right)}>
                    <Stack component={Paper} variant="outlined" direction="column" spacing={3} className={Styles.wrapper}>
                        <FormControlLabel
                            control={<Switch size="small" checked={!puppeteerOptions.headless} onChange={handleShowBrowserChange} />}
                            label={t("showBrowser")}
                        />
                        <TextField
                            fullWidth
                            size="small"
                            label={t("chromeExecutablePath")}
                            id="chrome-executable-path"
                            variant="outlined"
                            onChange={handleChromeExecutablePathChange}
                            value={puppeteerOptions.executablePath}
                        />
                    </Stack>
                </Stack>
            </Stack>
            <Grid className={Styles.footer}>
                <Stack className={Styles.actions} direction="row" spacing={2}>
                    <Button variant="contained" color="primary" onClick={handleClose}>
                        {t("close")}
                    </Button>
                </Stack>
            </Grid>
        </Box>
    );
};

export default SettingsView;
