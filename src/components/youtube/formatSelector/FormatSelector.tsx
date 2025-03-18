import _capitalize from "lodash/capitalize";
import _filter from "lodash/filter";
import _first from "lodash/first";
import _get from "lodash/get";
import _includes from "lodash/includes";
import _isFunction from "lodash/isFunction";
import _isNumber from "lodash/isNumber";
import _last from "lodash/last";
import _map from "lodash/map";
import _uniq from "lodash/uniq";
import _values from "lodash/values";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";

import {FormControl, InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {AudioType, MediaFormat, VideoType} from "../../../common/Media";
import {FormatInfo} from "../../../common/Youtube";
import {useDataState} from "../../../react/contexts/DataContext";
import NumberField from "../../numberField/NumberField";
import Styles from "./FormatSelector.styl";

export type Format = {
    type?: MediaFormat;
    extension?: AudioType | VideoType;
    videoQuality?: string;
    audioQuality?: number;
}

export type FormatSelectorProps = {
    value?: Format;
    onSelected?: (format: Format) => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = (props) => {
    // const {value, onSelected} = props;
    // const [appOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const {tracks, format,  setFormat} = useDataState();
    
    const audioExtensions = Object.values(AudioType);
    const videoExtensions = Object.values(VideoType);
    const [formats, setFormats] = useState<Array<AudioType | VideoType>>(format.type === MediaFormat.Audio ? audioExtensions : videoExtensions);
    const [resolutions, setResolutions] = useState<string[]>();
    
    const [selectedMediaType, setSelectedMediaType] = useState<MediaFormat>(format.type ?? MediaFormat.Audio);
    const [selectedAudioExtension, setSelectedAudioExtension] = useState<AudioType>(format.type === MediaFormat.Audio ? format.extension as AudioType :_first(audioExtensions));
    const [selectedVideoExtension, setSelectedVideoExtension] = useState<VideoType>(format.type === MediaFormat.Video ? format.extension as VideoType :_first(videoExtensions));
    const [selectedFormat, setSelectedFormat] = useState<AudioType | VideoType>(format.extension ?? _first(formats));
    const [selectedResolution, setSelectedResolution] = useState<string>(format.videoQuality);
    const [selectedQuality, setSelectedQuality] = useState(format.audioQuality ?? format.audioQuality);
    const [currentValue, setCurrentValue] = useState<Format>(format);
    const {t} = useTranslation();

    const isFormatValid = (val: Format) => {
        return val && val.type && val.extension && (
            (val.type === MediaFormat.Video && val.videoQuality && _includes(videoExtensions, val.extension)) ||
            (val.type === MediaFormat.Audio && _isNumber(val.audioQuality) && _includes(audioExtensions, val.extension))
        );
    };
    
    const resolveResolutionText = (val: FormatInfo) => {
        const [, height] = _map(val.resolution.match(/\d+/g), Number);

        return `${val.resolution} (${height}p)`;
    };

    useEffect(() => {
        if (!isFormatValid(currentValue)) return;

        setFormat(currentValue);
    }, [currentValue]);

    useEffect(() => {
        setCurrentValue({
            type: selectedMediaType,
            extension: selectedFormat,
            videoQuality: selectedResolution,
            audioQuality: selectedQuality,
        });
    }, [selectedMediaType, selectedFormat, selectedVideoExtension, selectedResolution, selectedQuality]);

    useEffect(() => {
        const formats = _get(tracks, "0.formats");
        const nextResolutions = _uniq(_map(_filter(formats, (f) => f.vcodec !== "none" && !!f.resolution), resolveResolutionText));
        
        setResolutions(nextResolutions);
        setSelectedResolution(format.videoQuality ?? _last(nextResolutions));
    }, [tracks]);

    useEffect(() => {
        const extensionsByMediaType = {
            [MediaFormat.Audio]: audioExtensions,
            [MediaFormat.Video]: videoExtensions,
        };
        const selectedExtensionByMediaType = {
            [MediaFormat.Audio]: selectedAudioExtension,
            [MediaFormat.Video]: selectedVideoExtension,
        };

        setFormats(extensionsByMediaType[selectedMediaType]);
        setSelectedFormat(selectedExtensionByMediaType[selectedMediaType]);
    }, [selectedMediaType]);

    // useEffect(() => {
    //     const selectedExtensionByMediaType = {
    //         [MediaFormat.Audio]: selectedAudioExtension,
    //         [MediaFormat.Video]: selectedVideoExtension,
    //     };

    //     setSelectedFormat(selectedExtensionByMediaType[selectedMediaType]);
    // }, [formats]);

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

    return (
        <Grid className={Styles.formatSelector} container spacing={2} padding={2}>
            <Grid size={4}>
                <FormControl fullWidth>
                    <InputLabel id="media-type-label">{t("mediaType")}</InputLabel>
                    <Select<MediaFormat>
                        labelId="media-type-label"
                        value={selectedMediaType}
                        label={t("mediaType")}
                        onChange={handleMediaTypeChange}
                    >
                        {_map(_values(MediaFormat), (f) => <MenuItem key={f} value={f}>{_capitalize(f)}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={4}>
                <FormControl fullWidth>
                    <InputLabel id="format-label">{t("format")}</InputLabel>
                    <Select<string>
                        labelId="format-label"
                        value={selectedFormat}
                        label={t("format")}
                        onChange={handleFormatChange}
                    >
                        {_map(formats, (item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            {selectedMediaType === MediaFormat.Video &&
                <Grid size={4}>
                    <FormControl fullWidth>
                        <InputLabel id="resolution-label">{t("resolution")}</InputLabel>
                        <Select<string>
                            labelId="resolution-label"
                            value={selectedResolution}
                            label={t("resolution")}
                            onChange={handleResolutionChange}
                        >
                            {_map(resolutions, (item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
            }
            {selectedMediaType === MediaFormat.Audio &&
                <Grid size={4}>
                    <NumberField
                        fullWidth
                        label={t("audioQuality")}
                        id="audioQuality"
                        variant="outlined"
                        onChange={onQualityChange}
                        value={selectedQuality}
                        decimalScale={0}
                        step={1}
                        min={0}
                        max={10}
                    />
                </Grid>
            }
        </Grid>
    );
};

export default FormatSelector;
