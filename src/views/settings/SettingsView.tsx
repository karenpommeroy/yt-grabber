import _filter from "lodash/filter";
import _first from "lodash/first";
import _get from "lodash/get";
import _includes from "lodash/includes";
import _isEmpty from "lodash/isEmpty";
import _isNil from "lodash/isNil";
import _join from "lodash/join";
import _map from "lodash/map";
import _omitBy from "lodash/omitBy";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";

import {Box, Button, FormControlLabel, Paper, Switch, TextField} from "@mui/material";
import Grid from "@mui/material/Grid2";

import StoreSchema, {ApplicationOptions} from "../../common/Store";
import FileField from "../../components/fileField/FileField";
import NumberField from "../../components/numberField/NumberField";
import ThemePicker from "../../components/themePicker/ThemePicker";
import {useAppContext} from "../../react/contexts/AppContext";
import Styles from "./SettingsView.styl";

export const SettingsView: React.FC = () => {
    const {actions} = useAppContext();
    const {t} = useTranslation();
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
    const [applicationOptions, setApplicationOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const [debouncedApplicationOptions] = useDebounceValue(applicationOptions, 500, {leading: true});

    // const formats = _map(_values(ModeFormat), (f) => <MenuItem key={f} value={f}>{_capitalize(f)}</MenuItem>)}

    const validateTemplateString = (input: HTMLInputElement) => {
        const allowedKeys = ["artist", "albumTitle", "trackTitle", "trackNo", "releaseYear"];
        const regex = /{{(.*?)}}/g;
        const matches = _map([...input.value.matchAll(regex)], (m) => m[1]);

        const invalidKeys = _filter(matches, (m) => !_includes(allowedKeys, m));
        if (!_isEmpty(invalidKeys)) {
            setValidationErrors((prev) => ({...prev, [input.id]: t("invalidTemplateKeys", { invalidKeys: _join(invalidKeys, ", ")})}));
        } else {
            setValidationErrors((prev) => _omitBy(prev, (_, key) => key === input.id));
        }
    };

    const handleClose = async () => {
        actions.setLocation("/");
    };

    const onOutputDirectoryChange = (value: string[]) => {
        setApplicationOptions((prev) => ({...prev, outputDirectory: _first(value)}));
    };

    const onOutputDirectoryBlur = (value: string[]) => {
        const outputDirectory = _isNil(_first(value)) || _isEmpty(_first(value)) ? _get(StoreSchema.application, "properties.outputDirectory.default") : _first(value);
        setApplicationOptions((prev) => ({...prev, outputDirectory}));
    };

    const onAlbumOutputTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        validateTemplateString(e.target);
        setApplicationOptions((prev) => ({...prev, albumOutputTemplate: e.target.value}));
    };
    
    const onAlbumOutputTemplateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const albumOutputTemplate = _isNil(value) || _isEmpty(value) ? _get(StoreSchema.application, "properties.albumOutputTemplate.default") : value;
        setApplicationOptions((prev) => ({...prev, albumOutputTemplate}));
    };

    const onPlaylistOutputTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        validateTemplateString(e.target);
        setApplicationOptions((prev) => ({...prev, playlistOutputTemplate: e.target.value}));
    };
    
    const onPlaylistOutputTemplateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const playlistOutputTemplate = _isNil(value) || _isEmpty(value) ? _get(StoreSchema.application, "properties.playlistOutputTemplate.default") : value;
        setApplicationOptions((prev) => ({...prev, playlistOutputTemplate}));
    };

    const onVideoOutputTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        validateTemplateString(e.target);
        setApplicationOptions((prev) => ({...prev, videoOutputTemplate: e.target.value}));
    };

    const onVideoOutputTemplateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const videoOutputTemplate = _isNil(value) || _isEmpty(value) ? _get(StoreSchema.application, "properties.videoOutputTemplate.default") : value;
        setApplicationOptions((prev) => ({...prev, videoOutputTemplate}));
    };

    const onTrackOutputTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        validateTemplateString(e.target);
        setApplicationOptions((prev) => ({...prev, trackOutputTemplate: e.target.value}));
    };
    
    const onTrackOutputTemplateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const trackOutputTemplate = _isNil(value) || _isEmpty(value) ? _get(StoreSchema.application, "properties.trackOutputTemplate.default") : value;
        setApplicationOptions((prev) => ({...prev, trackOutputTemplate}));
    };
    
    const onOverwriteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, alwaysOverwrite: e.target.checked}));
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
            <Grid className={Styles.container} container padding={2} spacing={3}>
                <Grid className={Styles.content} container>
                    <Grid className={Styles.group} container size={6} component={Paper} variant="outlined">
                        <Grid size={6} spacing={2}>
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
                        </Grid>
                        <Grid size={6}>
                            <NumberField
                                fullWidth
                                label={t("audioQuality")}
                                id="quality"
                                variant="outlined"
                                onChange={onQualityChange}
                                value={applicationOptions.quality}
                                decimalScale={0}
                                step={1}
                                min={0}
                                max={10}
                            />
                        </Grid>
                        {/* <Grid size={12}>
                            <FormControl fullWidth>
                                <InputLabel id="mode-format-label">{t("modeFormat")}</InputLabel>
                                <Select<string>
                                    labelId="mode-format-label"
                                    value={applicationOptions.format}
                                    label={t("modeFormat")}
                                    onChange={onFormatChange}
                                >
                                    {_map(_values(ModeFormat), (f) => <MenuItem key={f} value={f}><div>{t(f + "ModeFormat")}</div></MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid> */}
                        <Grid size={12}>
                            <ThemePicker />
                        </Grid>
                        <Grid size={12}>
                            <FormControlLabel control={<Switch checked={applicationOptions.alwaysOverwrite} onChange={onOverwriteChange} />} label={t("alwaysOverwrite")} />
                        </Grid>
                    </Grid>
                    <Grid className={Styles.group} container size={6} component={Paper} variant="outlined">
                        <Grid size={12}>
                            <FileField
                                fullWidth
                                label={t("outputDirectory")}
                                id="outputDirectory"
                                variant="outlined"
                                onChange={onOutputDirectoryChange}
                                onBlur={onOutputDirectoryBlur}
                                value={applicationOptions.outputDirectory}
                                mode="directory"
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label={t("albumOutputTemplate")}
                                id="albumOutputTemplate"
                                variant="outlined"
                                onBlur={onAlbumOutputTemplateBlur}
                                onChange={onAlbumOutputTemplateChange}
                                value={applicationOptions.albumOutputTemplate}
                                helperText={validationErrors["albumOutputTemplate"]}
                                error={!!validationErrors["albumOutputTemplate"]}
                                type="string"
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label={t("playlistOutputTemplate")}
                                id="playlistOutputTemplate"
                                variant="outlined"
                                onBlur={onPlaylistOutputTemplateBlur}
                                onChange={onPlaylistOutputTemplateChange}
                                value={applicationOptions.playlistOutputTemplate}
                                helperText={validationErrors["playlistOutputTemplate"]}
                                error={!!validationErrors["playlistOutputTemplate"]}
                                type="string"
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label={t("videoOutputTemplate")}
                                id="videoOutputTemplate"
                                variant="outlined"
                                onBlur={onVideoOutputTemplateBlur}
                                onChange={onVideoOutputTemplateChange}
                                value={applicationOptions.videoOutputTemplate}
                                helperText={validationErrors["videoOutputTemplate"]}
                                error={!!validationErrors["videoOutputTemplate"]}
                                type="string"
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label={t("trackOutputTemplate")}
                                id="trackOutputTemplate"
                                variant="outlined"
                                onBlur={onTrackOutputTemplateBlur}
                                onChange={onTrackOutputTemplateChange}
                                value={applicationOptions.trackOutputTemplate}
                                helperText={validationErrors["trackOutputTemplate"]}
                                error={!!validationErrors["trackOutputTemplate"]}
                                type="string"
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid className={Styles.footer} container>
                    <Grid size="auto">
                        <Button variant="contained" color="primary" onClick={handleClose}>
                            {t("close")}
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SettingsView;
