import {LaunchOptions} from "puppeteer";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";

import {
    Box, Button, Divider, FormControlLabel, Grid, Stack, Switch, TextField
} from "@mui/material";

import {ApplicationOptions} from "../../common/Store";
import NumberField from "../../components/numberField/NumberField";
import {useAppContext} from "../../react/contexts/AppContext";
import Styles from "./DevelopmentView.styl";

export const DevelopmentView: React.FC = () => {
    const {actions} = useAppContext();
    const {t} = useTranslation();
    const [options, setOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const [puppeteerOptions, setPuppeteerOptions] = useState<LaunchOptions>(global.store.get("options"));
    const [debouncedOptions] = useDebounceValue(options, 500, {leading: true});
    const [debouncedPuppeteerOptions] = useDebounceValue(puppeteerOptions, 500, {leading: true});

    const handleClose = async () => {
        actions.setLocation("/");
    };

    const handleDebugModeChange = (e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
        setOptions((prev) => ({...prev, debugMode: checked}));
    };

    const handleChromeExecutablePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPuppeteerOptions((prev) => ({...prev, executablePath: e.target.value}));
    };

    const handleShowBrowserChange = (e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
        setPuppeteerOptions((prev) => ({...prev, headless: !checked}));
    };
    
    const handlePlaylistCountThresholdChange = (value: number) => {
        setOptions((prev) => ({...prev, playlistCountThreshold: value}));
    };
    
    const handlePlaylistCheckMaxItemsCountChange = (value: number) => {
        setOptions((prev) => ({...prev, playlistCheckMaxItemsCount: value}));
    };

    useEffect(() => {
        global.store.set("application", debouncedOptions);
    }, [debouncedOptions]);

    useEffect(() => {
        global.store.set("options", debouncedPuppeteerOptions);
    }, [debouncedPuppeteerOptions]);

    return (
        <Box className={Styles.development}>
            <Stack
                component="form"
                className={Styles.form}
                direction="row"
                spacing={2}
                divider={<Divider orientation="vertical" />}
            >
                <Stack direction="column" spacing={3} className={Styles.rootColumn}>
                    <FormControlLabel
                        className={Styles.fullwidth}
                        control={<Switch checked={options.debugMode} onChange={handleDebugModeChange} />}
                        label={t("debugMode")}
                    />
                    <FormControlLabel
                        className={Styles.fullwidth}
                        control={<Switch checked={!puppeteerOptions.headless} onChange={handleShowBrowserChange} />}
                        label={t("showBrowser")}
                    />
                    <Stack direction="row" spacing={2}>
                        <NumberField
                            label={t("playlistCountThreshold")}
                            id="playlistCountThreshold"
                            variant="outlined"
                            onChange={handlePlaylistCountThresholdChange}
                            value={options.playlistCountThreshold}
                            decimalScale={0}
                            step={1}
                            min={1}
                            max={50}
                            loop
                        />
                        <NumberField
                            label={t("playlistCheckMaxItemsCount")}
                            id="playlistCheckMaxItemsCount"
                            variant="outlined"
                            onChange={handlePlaylistCheckMaxItemsCountChange}
                            value={options.playlistCheckMaxItemsCount}
                            decimalScale={0}
                            step={1}
                            min={1}
                            max={10}
                            width={250}
                            loop
                        />
                    </Stack>
                    <TextField
                        fullWidth
                        label={t("chromeExecutablePath")}
                        variant="outlined"
                        onChange={handleChromeExecutablePathChange}
                        value={puppeteerOptions.executablePath}
                    />
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

export default DevelopmentView;
