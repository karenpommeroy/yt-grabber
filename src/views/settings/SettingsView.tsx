import classnames from "classnames";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";

import {Box, Button, Paper, Stack, TextField} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {ApplicationOptions} from "../../common/Store";
import NumberField from "../../components/numberField/NumberField";
import ThemePicker from "../../components/themePicker/ThemePicker";
import {useAppContext} from "../../react/contexts/AppContext";
import Styles from "./SettingsView.styl";

export const SettingsView: React.FC = () => {
    const {actions} = useAppContext();
    const {t} = useTranslation();
    const [applicationOptions, setApplicationOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const [debouncedApplicationOptions] = useDebounceValue(applicationOptions, 500);

    const handleClose = async () => {
        actions.setLocation("/");
    };

    const onOutputDirectoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, outputDirectory: e.target.value}));
    };

    const onOutputTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, outputTemplate: e.target.value}));
    };

    const onMetadataTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, metadataTemplate: e.target.value}));
    };

    const onConcurrencyChange = (value: number) => {
        setApplicationOptions((prev) => ({...prev, concurrency: value}));
    };

    const onQualityChange = (value: number) => {
        setApplicationOptions((prev) => ({...prev, quality: value}));
    };

    useEffect(() => {
        global.store.set("application", debouncedApplicationOptions);
    }, [debouncedApplicationOptions]);

    return (
        <Box className={Styles.settings}>
            <Stack
                component="form"
                className={Styles.form}
                direction="row"
                spacing={2}
            >
                <Stack spacing={3} className={classnames(Styles.rootColumn, Styles.left)}>
                    <Stack component={Paper} variant="outlined" direction="column" spacing={2} className={Styles.wrapper}>
                        <TextField
                            fullWidth
                            label={t("outputDirectory")}
                            id="outputDirectory"
                            variant="outlined"
                            onChange={onOutputDirectoryChange}
                            value={applicationOptions.outputDirectory}
                            type="string"
                        />
                        <TextField
                            fullWidth
                            label={t("outputTemplate")}
                            id="outputTempalte"
                            variant="outlined"
                            onChange={onOutputTemplateChange}
                            value={applicationOptions.outputTemplate}
                            type="string"
                        />
                        <TextField
                            fullWidth
                            label={t("metadataTemplate")}
                            id="metadataTemplate"
                            variant="outlined"
                            onChange={onMetadataTemplateChange}
                            value={applicationOptions.metadataTemplate}
                            type="string"
                        />
                        <Stack direction="row" spacing={2}>
                            <NumberField
                                fullWidth
                                label={t("concurrency")}
                                id="concurrency"
                                variant="outlined"
                                onChange={onConcurrencyChange}
                                value={applicationOptions.concurrency}
                                decimalScale={0}
                                step={1}
                                min={1}
                                max={12}
                            />
                            <NumberField
                                fullWidth
                                label={t("quality")}
                                id="quality"
                                variant="outlined"
                                onChange={onQualityChange}
                                value={applicationOptions.quality}
                                decimalScale={0}
                                step={1}
                                min={0}
                                max={10}
                            />
                        </Stack>
                        <ThemePicker />
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
