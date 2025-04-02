import _assign from "lodash/assign";
import _capitalize from "lodash/capitalize";
import _filter from "lodash/filter";
import _find from "lodash/find";
import _first from "lodash/first";
import _get from "lodash/get";
import _includes from "lodash/includes";
import _isNumber from "lodash/isNumber";
import _last from "lodash/last";
import _map from "lodash/map";
import _uniq from "lodash/uniq";
import _values from "lodash/values";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";

import {FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";

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
        return _get(formats, activeTab, formats.global);
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
    
    const [selectedMediaType, setSelectedMediaType] = useState<MediaFormat>(format.type ?? MediaFormat.Audio);
    const [selectedAudioExtension, setSelectedAudioExtension] = useState<AudioType>(format.type === MediaFormat.Audio ? format.extension as AudioType :_first(audioExtensions));
    const [selectedVideoExtension, setSelectedVideoExtension] = useState<VideoType>(format.type === MediaFormat.Video ? format.extension as VideoType :_first(videoExtensions));
    const [selectedFormat, setSelectedFormat] = useState<AudioType | VideoType>(format.extension ?? _first(extensions));
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
        if (!isFormatValid(currentValue) || !activeTab) return;

        setFormats((prev) => {
            const newFormat = options.formatScope === FormatScope.Tab ? prev[activeTab] ? {[activeTab]: currentValue} : {[activeTab]: prev.global} : {global: currentValue};
            
            return _assign({}, prev, newFormat);
        });
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
        setFormat(resolveFormat(options.formatScope, formats, activeTab));
    }, [options.formatScope, activeTab, formats]);

    useEffect(() => {
        setExtensions(format.type === MediaFormat.Audio ? audioExtensions : videoExtensions);
        setSelectedMediaType(format.type ?? MediaFormat.Audio);
        setSelectedAudioExtension(format.type === MediaFormat.Audio ? format.extension as AudioType :_first(audioExtensions));
        setSelectedVideoExtension(format.type === MediaFormat.Video ? format.extension as VideoType :_first(videoExtensions));
        setSelectedFormat(format.extension ?? _first(extensions));
        setSelectedQuality(format.audioQuality ?? format.audioQuality);
    }, [format, activeTab]);

    useEffect(() => {
        const tracks = _get(_find(playlists, ["url", activeTab]), "tracks");
        const formats = _get(tracks, "0.formats");
        const nextResolutions = _uniq(_map(_filter(formats, (f) => f.vcodec !== "none" && !!f.resolution), resolveResolutionText));

        setResolutions(nextResolutions);
    }, [playlists, activeTab]);

    useEffect(() => {
        setSelectedResolution(format.videoQuality && _includes(resolutions, format.videoQuality) ? format.videoQuality : _last(resolutions));
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

    return (
        <Grid className={Styles.formatSelector} container spacing={2} padding={2}>
            <Grid size={4}>
                <FormControl fullWidth disabled={disabled} data-help="mediaType">
                    <InputLabel id="media-type-label">{t("mediaType")}</InputLabel>
                    <Select<MediaFormat>
                        labelId="media-type-label"
                        value={selectedMediaType}
                        label={t("mediaType")}
                        MenuProps={{
                            disablePortal: true,
                        }}
                        onChange={handleMediaTypeChange}
                    >
                        {_map(_values(MediaFormat), (f) => <MenuItem key={f} value={f}>{_capitalize(f)}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={4}>
                <FormControl fullWidth disabled={disabled} data-help="format">
                    <InputLabel id="format-label">{t("format")}</InputLabel>
                    <Select<string>
                        labelId="format-label"
                        value={selectedFormat}
                        label={t("format")}
                        onChange={handleFormatChange}
                    >
                        {_map(extensions, (item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            {selectedMediaType === MediaFormat.Video &&
                <Grid size={4}>
                    <FormControl fullWidth disabled={disabled} data-help="resolution">
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
                        data-help="audioQuality"
                        disabled={disabled}
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
