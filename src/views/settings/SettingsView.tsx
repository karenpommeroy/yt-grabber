import _filter from "lodash/filter";
import _first from "lodash/first";
import _get from "lodash/get";
import _includes from "lodash/includes";
import _isEmpty from "lodash/isEmpty";
import _isNil from "lodash/isNil";
import _join from "lodash/join";
import _map from "lodash/map";
import _omitBy from "lodash/omitBy";
import path from "path";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";

import {
    Box, Button, FormControl, FormControlLabel, FormLabel, Grid, Paper, Radio, RadioGroup, Switch,
    TextField
} from "@mui/material";

import {FormatScope} from "../../common/Media";
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

    const onYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, youtubeUrl: e.target.value}));
    };

    const onOutputDirectoryChange = (value: string[]) => {
        setApplicationOptions((prev) => ({...prev, outputDirectory: _first(value)}));
    };

    const onOutputDirectoryBlur = (value: string[]) => {
        const outputDirectory = _isNil(_first(value)) || _isEmpty(_first(value)) ? path.resolve(_get(StoreSchema.application, "properties.outputDirectory.default")) : _first(value);
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
    
    const onFormatScopeChange = (e: React.ChangeEvent<HTMLInputElement>, value: FormatScope) => {
        setApplicationOptions((prev) => ({...prev, formatScope: value}));
    };

    const onOverwriteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, alwaysOverwrite: e.target.checked}));
    };

    const onDiscographyDownloadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, discographyDownload: e.target.checked}));
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
                        <Grid size={6} spacing={2} data-help="concurrency">
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
                        <Grid size={6} data-help="globalAudioQuality">
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
                        <Grid size={12} data-help="themePicker">
                            <ThemePicker />
                        </Grid>
                        <Grid size={12} data-help="formatScope">
                            <FormControl>
                                <FormLabel id="format-selector-scope-group-label">{t("formatScope")}</FormLabel>
                                <RadioGroup row name="format-selector-scope-group" value={applicationOptions.formatScope} onChange={onFormatScopeChange}>
                                    <FormControlLabel value={FormatScope.Global} control={<Radio />} label={t("formatScopeGlobal")}/>
                                    <FormControlLabel value={FormatScope.Tab} control={<Radio />} label={t("formatScopeTab")}/>
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                        <Grid size={12} data-help="alwaysOverwrite">
                            <FormControlLabel control={<Switch checked={applicationOptions.alwaysOverwrite} onChange={onOverwriteChange} />} label={t("alwaysOverwrite")} />
                        </Grid>
                        <Grid size={12} data-help="discographyDownload">
                            <FormControlLabel control={<Switch checked={applicationOptions.discographyDownload} onChange={onDiscographyDownloadChange} />} label={t("discographyDownload")} />
                        </Grid>
                    </Grid>
                    <Grid className={Styles.group} container size={6} component={Paper} variant="outlined">
                        <Grid size={12}>
                            <FileField
                                data-help="outputDirectory"
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
                                data-help="albumOutputTemplate"
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
                                data-help="playlistOutputTemplate"
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
                                data-help="videoOutputTemplate"
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
                                data-help="trackOutputTemplate"
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
                        <Grid size={12}>
                            <TextField
                                data-help="youtubeDomainUrl"
                                fullWidth
                                label={t("youtubeUrl")}
                                id="youtubeUrl"
                                variant="outlined"
                                onChange={onYoutubeUrlChange}
                                value={applicationOptions.youtubeUrl}
                                helperText={validationErrors["youtubeUrl"]}
                                error={!!validationErrors["youtubeUrl"]}
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
