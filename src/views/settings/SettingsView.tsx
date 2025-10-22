import {spawn} from "child_process";
import {filter, first, get, includes, isEmpty, isNil, join, map, omitBy} from "lodash-es";
import path from "path";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";
import versionInfo from "win-version-info";

import NorthIcon from "@mui/icons-material/North";
import SouthIcon from "@mui/icons-material/South";
import {
    Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Grid, InputLabel,
    MenuItem, Paper, Radio, RadioGroup, Select, Stack, Switch, TextField, Typography
} from "@mui/material";
import {SelectChangeEvent} from "@mui/material/Select";

import {getBinPath} from "../../common/FileSystem";
import {FormatScope, MultiMatchAction, SortOrder, TabsOrderKey} from "../../common/Media";
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
    const [updatingYtDlp, setUpdatingYtDlp] = useState(false);
    const [ytDlpVersion, setYtDlpVersion] = useState("");
    const [applicationOptions, setApplicationOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const [debouncedApplicationOptions] = useDebounceValue(applicationOptions, 500, {leading: true});
    const tabsOrderKeyOptions = [
        {value: "default", text: t("default")},
        {value: "artist", text: t("artist")},
        {value: "title", text: t("title")},
        {value: "releaseYear", text: t("year")},
        {value: "duration", text: t("duration")},
    ];

    const validateTemplateString = (input: HTMLInputElement) => {
        const allowedKeys = ["artist", "albumTitle", "trackTitle", "trackNo", "releaseYear"];
        const regex = /{{(.*?)}}/g;
        const matches = map([...input.value.matchAll(regex)], (m) => m[1]);

        const invalidKeys = filter(matches, (m) => !includes(allowedKeys, m));
        if (!isEmpty(invalidKeys)) {
            setValidationErrors((prev) => ({...prev, [input.id]: t("invalidTemplateKeys", { invalidKeys: join(invalidKeys, ", ")})}));
        } else {
            setValidationErrors((prev) => omitBy(prev, (_, key) => key === input.id));
        }
    };

    const handleClose = async () => {
        actions.setLocation("/");
    };

    const onYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, youtubeUrl: e.target.value}));
    };
    
    const onCustomYtdlpArgsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, customYtdlpArgs: e.target.value}));
    };

    const onOutputDirectoryChange = (value: string[]) => {
        setApplicationOptions((prev) => ({...prev, outputDirectory: first(value)}));
    };

    const onOutputDirectoryBlur = (value: string[]) => {
        const outputDirectory = isNil(first(value)) || isEmpty(first(value)) ? path.resolve(get(StoreSchema.application, "properties.outputDirectory.default")) : first(value);
        setApplicationOptions((prev) => ({...prev, outputDirectory}));
    };
    
    const onChromeExecutablePathChange = (value: string[]) => {
        setApplicationOptions((prev) => ({...prev, chromeExecutablePath: first(value)}));
    };

    const onChromeExecutablePathBlur = (value: string[]) => {
        const chromeExecutablePath = isNil(first(value)) ? path.resolve(get(StoreSchema.application, "properties.chromeExecutablePath.default")) : first(value);
        setApplicationOptions((prev) => ({...prev, chromeExecutablePath}));
    };
    
    const onYtdlpExecutablePathChange = (value: string[]) => {
        setApplicationOptions((prev) => ({...prev, ytdlpExecutablePath: first(value)}));
    };

    const onYtdlpExecutablePathBlur = (value: string[]) => {
        const ytdlpExecutablePath = isNil(first(value)) ? path.resolve(get(StoreSchema.application, "properties.ytdlpExecutablePath.default")) : first(value);
        setApplicationOptions((prev) => ({...prev, ytdlpExecutablePath}));
    };

    const onFFmpegExecutablePathChange = (value: string[]) => {
        setApplicationOptions((prev) => ({...prev, ffmpegExecutablePath: first(value)}));
    };

    const onFFmpegExecutablePathBlur = (value: string[]) => {
        const ffmpegExecutablePath = isNil(first(value)) ? path.resolve(get(StoreSchema.application, "properties.ffmpegExecutablePath.default")) : first(value);
        setApplicationOptions((prev) => ({...prev, ffmpegExecutablePath}));
    };

    const onAlbumOutputTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        validateTemplateString(e.target);
        setApplicationOptions((prev) => ({...prev, albumOutputTemplate: e.target.value}));
    };
    
    const onAlbumOutputTemplateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const albumOutputTemplate = isNil(value) || isEmpty(value) ? get(StoreSchema.application, "properties.albumOutputTemplate.default") : value;
        setApplicationOptions((prev) => ({...prev, albumOutputTemplate}));
    };

    const onPlaylistOutputTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        validateTemplateString(e.target);
        setApplicationOptions((prev) => ({...prev, playlistOutputTemplate: e.target.value}));
    };
    
    const onPlaylistOutputTemplateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const playlistOutputTemplate = isNil(value) || isEmpty(value) ? get(StoreSchema.application, "properties.playlistOutputTemplate.default") : value;
        setApplicationOptions((prev) => ({...prev, playlistOutputTemplate}));
    };

    const onVideoOutputTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        validateTemplateString(e.target);
        setApplicationOptions((prev) => ({...prev, videoOutputTemplate: e.target.value}));
    };

    const onVideoOutputTemplateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const videoOutputTemplate = isNil(value) || isEmpty(value) ? get(StoreSchema.application, "properties.videoOutputTemplate.default") : value;
        setApplicationOptions((prev) => ({...prev, videoOutputTemplate}));
    };

    const onTrackOutputTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        validateTemplateString(e.target);
        setApplicationOptions((prev) => ({...prev, trackOutputTemplate: e.target.value}));
    };
    
    const onTrackOutputTemplateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const trackOutputTemplate = isNil(value) || isEmpty(value) ? get(StoreSchema.application, "properties.trackOutputTemplate.default") : value;
        setApplicationOptions((prev) => ({...prev, trackOutputTemplate}));
    };
    
    const onFormatScopeChange = (e: React.ChangeEvent<HTMLInputElement>, value: FormatScope) => {
        setApplicationOptions((prev) => ({...prev, formatScope: value}));
    };
    
    const onMultiMatchActionChange = (e: React.ChangeEvent<HTMLInputElement>, value: MultiMatchAction) => {
        setApplicationOptions((prev) => ({...prev, multiMatchAction: value}));
    };

    const onDownloadSinglesAndEpsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, downloadSinglesAndEps: e.target.checked}));
    };
    
    const onDownloadAlbumsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, downloadAlbums: e.target.checked}));
    };
    
    const onOverwriteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, alwaysOverwrite: e.target.checked}));
    };
    
    const onMergePartsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplicationOptions((prev) => ({...prev, mergeParts: e.target.checked}));
    };

    const onConcurrencyChange = (value: number) => {
        setApplicationOptions((prev) => ({...prev, concurrency: value}));
    };

    const onQualityChange = (value: number) => {
        setApplicationOptions((prev) => ({...prev, quality: value}));
    };

    const onTabsOrderKeyChange = (event: SelectChangeEvent<TabsOrderKey>) => {       
        setApplicationOptions((prev) => ({...prev, tabsOrder: [event.target.value as TabsOrderKey, prev.tabsOrder[1]]}));
    };

    const onTabsOrderOrderChange = (event: React.MouseEvent<HTMLButtonElement>) => {       
        setApplicationOptions((prev) => ({...prev, tabsOrder: [prev.tabsOrder[0], event.currentTarget.value as SortOrder]}));
    };
    
    const refreshYtDlpVersion = () => {
        const info = versionInfo(global.store.get("application.ytdlpExecutablePath") || `${getBinPath()}/yt-dlp.exe`);
        setYtDlpVersion(info.FileVersion);
    };

    const onUpdateYtDlpClick = async () => {       
        const child = spawn(global.store.get("application.ytdlpExecutablePath") || `${getBinPath()}/yt-dlp.exe`, ["-U"], {shell: true});
        
        setUpdatingYtDlp(true);
        child.on("close", () => {
            refreshYtDlpVersion();
            setUpdatingYtDlp(false);
        });
    };

    useEffect(() => {
        global.store.set("application", debouncedApplicationOptions);
    }, [debouncedApplicationOptions]);
    
    useEffect(() => {
        refreshYtDlpVersion();
    }, []);

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
                                max={60}
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
                                loop
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
                        <Grid size={12} data-help="multiMatchAction">
                            <FormControl>
                                <FormLabel id="format-selector-multi-match-group-label">{t("multiMatchAction")}</FormLabel>
                                <RadioGroup row name="format-selector-multi-match-group" value={applicationOptions.multiMatchAction} onChange={onMultiMatchActionChange}>
                                    <FormControlLabel value={MultiMatchAction.UseFirst} control={<Radio />} label={t("multiMatchActionUseFirst")}/>
                                    <FormControlLabel value={MultiMatchAction.Ask} control={<Radio />} label={t("multiMatchActionAsk")}/>
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                        <Grid size={12} spacing={1} container >
                            <Grid size="grow" data-help="tabsOrderField">
                                <FormControl fullWidth>
                                    <InputLabel>{t("tabsOrder")}</InputLabel>
                                    <Select
                                        value={applicationOptions.tabsOrder[0]}
                                        label={t("tabsOrder")}
                                        onChange={onTabsOrderKeyChange}
                                        className={Styles.select}
                                        MenuProps={{
                                            disablePortal: true
                                        }}
                                    >
                                        {map(tabsOrderKeyOptions, (item) => <MenuItem key={item.value} value={item.value} className={Styles.menuItem}>{item.text}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            {applicationOptions.tabsOrder[0] !== TabsOrderKey.Default &&
                                <Grid size={2} className={Styles.column} data-help="tabsOrder">
                                    {applicationOptions.tabsOrder[1] === SortOrder.Asc && <Button variant="outlined" fullWidth value={SortOrder.Desc} onClick={onTabsOrderOrderChange}><NorthIcon /></Button>}
                                    {applicationOptions.tabsOrder[1] === SortOrder.Desc && <Button variant="outlined" fullWidth value={SortOrder.Asc} onClick={onTabsOrderOrderChange}><SouthIcon /></Button>}
                                </Grid>
                            }
                        </Grid>
                        <Grid size={12} data-help="downloadReleaseType">
                            <FormControl>
                                <FormLabel component="legend">{t("download")}</FormLabel>
                                <FormGroup row>
                                    <FormControlLabel data-help="downloadAlbums" control={<Checkbox checked={applicationOptions.downloadAlbums} onChange={onDownloadAlbumsChange} />} label={t("downloadAlbums")} />
                                    <FormControlLabel data-help="downloadSinglesAndEps" control={<Checkbox checked={applicationOptions.downloadSinglesAndEps} onChange={onDownloadSinglesAndEpsChange} />} label={t("downloadSinglesAndEps")} />
                                </FormGroup>
                            </FormControl>
                        </Grid>
                        <Grid size={12} data-help="alwaysOverwrite">
                            <FormControlLabel control={<Switch checked={applicationOptions.alwaysOverwrite} onChange={onOverwriteChange} />} label={t("alwaysOverwrite")} />
                        </Grid>
                        <Grid size={12} data-help="mergeParts">
                            <FormControlLabel control={<Switch checked={applicationOptions.mergeParts} onChange={onMergePartsChange} />} label={t("mergeParts")} />
                        </Grid>
                        <Grid size={12} data-help="ytdlpVersion">
                            <Stack direction="row" spacing={1} className={Styles.ytdlpVersion}>
                                <Typography component="span" variant="body1">{t("ytdlpVersion")}: {ytDlpVersion}</Typography>
                                <Button size="small" variant="contained" loading={updatingYtDlp} onClick={onUpdateYtDlpClick}>{t("update")}</Button>
                            </Stack>
                        </Grid>
                    </Grid>
                    <Grid className={Styles.group} container size={6} spacing={2} component={Paper} variant="outlined">
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
                        <Grid size={12}>
                            <FileField
                                data-help="chromeExecutablePath"
                                fullWidth
                                label={t("chromeExecutablePath")}
                                id="chromeExecutablePath"
                                variant="outlined"
                                onChange={onChromeExecutablePathChange}
                                onBlur={onChromeExecutablePathBlur}
                                value={applicationOptions.chromeExecutablePath}
                                mode="file"
                                fileTypes={[".exe"]}
                            />
                        </Grid>
                        <Grid size={12}>
                            <FileField
                                data-help="ytdlpExecutablePath"
                                fullWidth
                                label={t("ytdlpExecutablePath")}
                                id="ytdlpExecutablePath"
                                variant="outlined"
                                onChange={onYtdlpExecutablePathChange}
                                onBlur={onYtdlpExecutablePathBlur}
                                value={applicationOptions.ytdlpExecutablePath}
                                mode="file"
                                fileTypes={[".exe"]}
                            />
                        </Grid>
                        <Grid size={12}>
                            <FileField
                                data-help="ffmpegExecutablePath"
                                fullWidth
                                label={t("ffmpegExecutablePath")}
                                id="ffmpegExecutablePath"
                                variant="outlined"
                                onChange={onFFmpegExecutablePathChange}
                                onBlur={onFFmpegExecutablePathBlur}
                                value={applicationOptions.ffmpegExecutablePath}
                                mode="file"
                                fileTypes={[".exe"]}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                data-help="customYtdlpArgs"
                                fullWidth
                                label={t("customYtdlpArgs")}
                                id="customYtdlpArgs"
                                variant="outlined"
                                onChange={onCustomYtdlpArgsChange}
                                value={applicationOptions.customYtdlpArgs}
                                helperText={validationErrors["customYtdlpArgs"]}
                                error={!!validationErrors["customYtdlpArgs"]}
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
