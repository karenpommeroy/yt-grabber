import {
    assign, capitalize, filter, find, first, get, includes, isEmpty, isNumber, last, map, uniq,
    values
} from "lodash-es";
import React, {ChangeEvent, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";

import {
    Accordion, AccordionDetails, AccordionSummary, FormControl, Grid, InputLabel, MenuItem, Select,
    Stack, TextField, Typography
} from "@mui/material";
import {SelectChangeEvent} from "@mui/material/Select";

import {AudioType, Format, FormatScope, MediaFormat, VideoType} from "../../../common/Media";
import {ApplicationOptions} from "../../../common/Store";
import {FormatInfo} from "../../../common/Youtube";
import {useDataState} from "../../../react/contexts/DataContext";
import NumberField from "../../numberField/NumberField";
import Styles from "./FormatSelector.styl";

export type FormatSelectorProps = {
    disabled?: boolean;
    onSelected?: (format: Format) => void;
}

const resolveFormat = (scope: FormatScope, formats: Record<string, Format>, activeTab: string) => {
    if (scope === FormatScope.Tab) {
        return get(formats, activeTab, formats.global);
    }

    return formats.global;
};

export const FormatSelector: React.FC<FormatSelectorProps> = (props) => {
    const {disabled} = props;
    const {formats, playlists, setFormats, activeTab} = useDataState();
    const [options] = useState<ApplicationOptions>(global.store.get("application"));
    const audioExtensions = Object.values(AudioType);
    const videoExtensions = Object.values(VideoType);
    const [format, setFormat] = useState(resolveFormat(options.formatScope, formats, activeTab)); 
    const [extensions, setExtensions] = useState<Array<AudioType | VideoType>>(format.type === MediaFormat.Audio ? audioExtensions : videoExtensions);
    const [resolutions, setResolutions] = useState<string[]>();
    const [gifTopText, setGifTopText] = useState("");
    const [gifBottomText, setGifBottomText] = useState("");

    const [selectedMediaType, setSelectedMediaType] = useState<MediaFormat>(format.type ?? options.defaultMediaFormat);
    const [selectedAudioExtension, setSelectedAudioExtension] = useState<AudioType>(format.type === MediaFormat.Audio ? format.extension as AudioType :first(audioExtensions));
    const [selectedVideoExtension, setSelectedVideoExtension] = useState<VideoType>(format.type === MediaFormat.Video ? format.extension as VideoType :first(videoExtensions));
    const [selectedFormat, setSelectedFormat] = useState<AudioType | VideoType>(format.extension ?? first(extensions));
    const [selectedResolution, setSelectedResolution] = useState<string>(format.videoQuality);
    const [selectedQuality, setSelectedQuality] = useState(format.audioQuality ?? format.audioQuality);
    const [currentValue, setCurrentValue] = useState<Format>(format);
    const {t} = useTranslation();

    const isFormatValid = (val: Format) => {
        return val && val.type && val.extension && (
            (val.type === MediaFormat.Video && val.videoQuality && includes(videoExtensions, val.extension)) ||
            (val.type === MediaFormat.Audio && isNumber(val.audioQuality) && includes(audioExtensions, val.extension))
        );
    };
    
    const resolveResolutionText = (val: FormatInfo) => {
        const [, height] = map(val.resolution.match(/\d+/g), Number);

        return `${val.resolution} (${height}p)`;
    };

    useEffect(() => {
        if (!isFormatValid(currentValue) || !activeTab) return;

        setFormats((prev) => {
            const newFormat = options.formatScope === FormatScope.Tab ? prev[activeTab] ? {[activeTab]: currentValue} : {[activeTab]: prev.global} : {global: currentValue};
            
            return assign({}, prev, newFormat);
        });
    }, [currentValue]);

    useEffect(() => {
        setCurrentValue({
            type: selectedMediaType,
            extension: selectedFormat,
            videoQuality: selectedResolution,
            audioQuality: selectedQuality,
            gifTopText,
            gifBottomText
        });
    }, [selectedMediaType, selectedFormat, selectedVideoExtension, selectedResolution, selectedQuality, gifTopText, gifBottomText]);

    useEffect(() => {        
        setFormat(resolveFormat(options.formatScope, formats, activeTab));
    }, [options.formatScope, activeTab, formats]);

    useEffect(() => {
        setExtensions(format.type === MediaFormat.Audio ? audioExtensions : videoExtensions);
        setSelectedMediaType(format.type ?? MediaFormat.Audio);
        setSelectedAudioExtension(format.type === MediaFormat.Audio ? format.extension as AudioType :first(audioExtensions));
        setSelectedVideoExtension(format.type === MediaFormat.Video ? format.extension as VideoType :first(videoExtensions));
        setSelectedFormat(format.extension ?? first(extensions));
        setSelectedQuality(format.audioQuality ?? format.audioQuality);
    }, [format, activeTab]);

    useEffect(() => {
        const tracks = get(find(playlists, ["url", activeTab]), "tracks");
        const formats = get(tracks, "0.formats");
        const nextResolutions = uniq(map(filter(formats, (f) => f.vcodec !== "none" && !!f.resolution), resolveResolutionText));

        setResolutions(nextResolutions);
    }, [JSON.stringify(playlists), activeTab]);

    useEffect(() => {
        setSelectedResolution(format.videoQuality && includes(resolutions, format.videoQuality) ? format.videoQuality : last(resolutions));
    }, [resolutions]);

    useEffect(() => {
        const extensionsByMediaType = {
            [MediaFormat.Audio]: audioExtensions,
            [MediaFormat.Video]: videoExtensions,
        };
        const selectedExtensionByMediaType = {
            [MediaFormat.Audio]: selectedAudioExtension,
            [MediaFormat.Video]: selectedVideoExtension,
        };

        setExtensions(extensionsByMediaType[selectedMediaType]);
        setSelectedFormat(selectedExtensionByMediaType[selectedMediaType]);
    }, [selectedMediaType]);

    const handleMediaTypeChange = (event: SelectChangeEvent<MediaFormat>) => {       
        setSelectedMediaType(event.target.value as MediaFormat);
    };

    const handleFormatChange = (event: SelectChangeEvent<AudioType | VideoType>) => {       
        if (selectedMediaType === MediaFormat.Audio) {
            setSelectedAudioExtension(event.target.value as AudioType);
        }

        if (selectedMediaType === MediaFormat.Video) {
            setSelectedVideoExtension(event.target.value as VideoType);
        }

        setSelectedFormat(event.target.value as AudioType | VideoType);
    };

    const handleResolutionChange = (event: SelectChangeEvent<string>) => {       
        setSelectedResolution(event.target.value);
    };
    
    const onQualityChange = (value: number) => {       
        setSelectedQuality(value);
    };

    const onGifTopTextChanged = (event: ChangeEvent<HTMLInputElement>) => {
        setGifTopText(event.target.value);
    };

    const onGifBottomTextChanged = (event: ChangeEvent<HTMLInputElement>) => {
        setGifBottomText(event.target.value);
    };

    return (
        <Grid className={Styles.formatSelector} container spacing={2} padding={2}>
            <Grid size="grow">
                <FormControl fullWidth disabled={disabled} data-help="mediaType">
                    <InputLabel id="media-type-label">{t("mediaType")}</InputLabel>
                    <Select<MediaFormat>
                        data-testid="media-type-select"
                        labelId="media-type-label"
                        value={selectedMediaType}
                        label={t("mediaType")}
                        MenuProps={{
                            disablePortal: true,
                        }}
                        onChange={handleMediaTypeChange}
                    >
                        {map(values(MediaFormat), (f) => <MenuItem key={f} aria-label={f} value={f}>{capitalize(f)}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid size="grow">
                <FormControl fullWidth disabled={disabled} data-help="format">
                    <InputLabel id="format-label">{t("format")}</InputLabel>
                    <Select<string>
                        data-testid="media-format-select"
                        labelId="format-label"
                        value={selectedFormat}
                        label={t("format")}
                        onChange={handleFormatChange}
                        MenuProps={{
                            disablePortal: true
                        }}
                    >
                        {map(extensions, (item) => <MenuItem aria-label={item} key={item} value={item}>{item}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            {selectedMediaType === MediaFormat.Video && !isEmpty(resolutions) && selectedResolution &&
                <Grid size="grow">
                    <FormControl fullWidth disabled={disabled} data-help="resolution">
                        <InputLabel id="resolution-label">{t("resolution")}</InputLabel>
                        <Select<string>
                            data-testid="media-resolution-select"
                            labelId="resolution-label"
                            value={selectedResolution}
                            label={t("resolution")}
                            onChange={handleResolutionChange}
                            MenuProps={{
                                disablePortal: true
                            }}
                        >
                            {map(resolutions, (item) => <MenuItem aria-label={item} key={item} value={item}>{item}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
            }
            {selectedMediaType === MediaFormat.Audio &&
                <Grid size="grow">
                    <NumberField
                        data-testid="media-quality-field"
                        data-help="audioQuality"
                        disabled={disabled}
                        fullWidth
                        label={t("audioQuality")}
                        id="audioQuality"
                        variant="outlined"
                        onChange={onQualityChange}
                        value={selectedQuality}
                        loop
                        decimalScale={0}
                        step={1}
                        min={0}
                        max={10}
                    />
                </Grid>
            }
            {selectedMediaType === MediaFormat.Video && selectedFormat === VideoType.Gif &&
                <Grid size={12}>
                    <Accordion
                        data-testid="gif-text-options-panel"
                        elevation={0}
                        className={Styles.accordion}
                        data-help="gifTextOptions"
                        disableGutters
                        expanded
                    >
                        <AccordionSummary className={Styles.accordionSummary}>
                            <Typography variant="body1">{t("gifTextOptions")}</Typography>
                        </AccordionSummary>
                        <AccordionDetails className={Styles.accordionDetails}>
                            <Stack direction="column" spacing={1} paddingX={0} paddingY={2} paddingBottom={0}>  
                                <FormControl className={Styles.textInputGroup} data-help="gifTopText">
                                    <TextField data-testid="gif-top-text-field" label={t("gifTopText")} variant="outlined" value={gifTopText} onChange={onGifTopTextChanged} />
                                </FormControl>
                                <FormControl className={Styles.textInputGroup} data-help="gifBottomText">
                                    <TextField data-testid="gif-bottom-text-field" label={t("gifBottomText")} variant="outlined" value={gifBottomText} onChange={onGifBottomTextChanged} />
                                </FormControl>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                </Grid>
            }
        </Grid>
    );
};

export default FormatSelector;
