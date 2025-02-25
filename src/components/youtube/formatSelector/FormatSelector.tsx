import _capitalize from "lodash/capitalize";
import _filter from "lodash/filter";
import _find from "lodash/find";
import _first from "lodash/first";
import _get from "lodash/get";
import _includes from "lodash/includes";
import _isEmpty from "lodash/isEmpty";
import _isFunction from "lodash/isFunction";
import _isNumber from "lodash/isNumber";
import _last from "lodash/last";
import _map from "lodash/map";
import _uniq from "lodash/uniq";
import _uniqBy from "lodash/uniqBy";
import _values from "lodash/values";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";

import {FormControl, InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {ApplicationOptions} from "../../../common/Store";
import {FormatInfo} from "../../../common/Youtube";
import {MediaFormat} from "../../../enums/MediaFormat";
import {useDataState} from "../../../react/contexts/DataContext";
import NumberField from "../../numberField/NumberField";
import Styles from "./FormatSelector.styl";

export type Format = {
    type?: MediaFormat;
    extension?: string;
    video?: FormatInfo;
    videoQuality?: string;
    audioQuality?: number;
}

export type FormatSelectorProps = {
    onSelected?: (format: Format) => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = (props) => {
    const {onSelected} = props;
    const [appOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const {tracks} = useDataState();
    const [allFormats, setAllFormats] = useState<FormatInfo[]>();
    const [currentFormats, setCurrentFormats] = useState<FormatInfo[]>();
    
    const [audioExtensions, setAudioExtensions] = useState<string[]>();
    const [videoExtensions, setVideoExtensions] = useState<string[]>();
    const [resolutions, setResolutions] = useState<FormatInfo[]>();
    
    const [selectedMediaType, setSelectedMediaType] = useState<MediaFormat>(MediaFormat.Audio);
    const [selectedAudioExtension, setSelectedAudioExtension] = useState<string>();
    const [selectedVideoExtension, setSelectedVideoExtension] = useState<string>();
    const [selectedResolution, setSelectedResolution] = useState<FormatInfo>();
    const [selectedQuality, setSelectedQuality] = useState(appOptions.quality);
    const [value, setValue] = useState<Format>();
    const {t} = useTranslation();

    const isFormatValid = (val: Format) => {
        return val && val.type && val.extension && ((val.type === MediaFormat.Video && val.video) || (val.type === MediaFormat.Audio && _isNumber(val.audioQuality)));  
    }

    useEffect(() => {
        if (!_isFunction(onSelected) || !isFormatValid(value)) return;

         onSelected(value);
    }, [value]);

    useEffect(() => {
        setValue({
            type: selectedMediaType,
            extension: selectedMediaType === MediaFormat.Audio ? selectedAudioExtension : selectedVideoExtension,
            video: selectedResolution,
            audioQuality: selectedQuality,
        });
    }, [selectedMediaType, selectedAudioExtension, selectedVideoExtension, selectedResolution, selectedQuality]);

    useEffect(() => {
        setAllFormats(_get(tracks, "0.formats"));
    }, [tracks]);

    useEffect(() => {
        let nextFormats: FormatInfo[];
        
        if (selectedMediaType === MediaFormat.Video) {
            nextFormats = _filter(allFormats, (f) => f.vcodec !== "none" && !!f.resolution);
        } else if (selectedMediaType === MediaFormat.Audio) {
            nextFormats = _map(_filter(allFormats, (f) => f.acodec !== "none"));
        }
        
        setCurrentFormats(nextFormats);
    }, [selectedMediaType, allFormats]);

    useEffect(() => {
        if (selectedMediaType === MediaFormat.Video) {
            // setVideoExtensions(_uniq(_map(currentFormats, "ext")));
            setVideoExtensions(["mp4", "mkv"]);
        } else {
            setAudioExtensions(["mp3", "wav", "flac"]);
        }
    }, [selectedMediaType, currentFormats]);

    useEffect(() => {
        if (selectedVideoExtension || _isEmpty(videoExtensions)) return;

        setSelectedVideoExtension(_first(videoExtensions));
    }, [videoExtensions]);

    useEffect(() => {
        if (selectedAudioExtension || _isEmpty(audioExtensions)) return;
        
        setSelectedAudioExtension(_first(audioExtensions));
    }, [audioExtensions]);


    useEffect(() => {
        if (selectedMediaType === MediaFormat.Audio) return;

        setResolutions(_uniqBy(_filter(currentFormats, ["ext", selectedVideoExtension]), (f) => f.resolution));
    }, [selectedVideoExtension, currentFormats]);

    useEffect(() => {
        if (_isEmpty(resolutions)) return;

        if (selectedResolution) {
            const found = _find(resolutions, ["resolution", selectedResolution.resolution]);
            setSelectedResolution(found ?? _last(resolutions));
        } else {
            setSelectedResolution(_last(resolutions));
        }
    }, [resolutions]);

    const handleMediaTypeChange = (event: SelectChangeEvent<MediaFormat>) => {       
        setSelectedMediaType(event.target.value as MediaFormat);
    };

    const handleAudioExtensionChange = (event: SelectChangeEvent<string>) => {       
        setSelectedAudioExtension(event.target.value);
    };

    const handleVideoExtensionChange = (event: SelectChangeEvent<string>) => {       
        setSelectedVideoExtension(event.target.value);
    };

    const handleResolutionChange = (event: SelectChangeEvent<string>) => {       
        const nextResolution = _find(resolutions, ["format_id", event.target.value]);
        
        setSelectedResolution(nextResolution);
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
            {selectedMediaType === MediaFormat.Video && <Grid size={4}>
                <FormControl fullWidth>
                    <InputLabel id="extension-label">{t("extension")}</InputLabel>
                    <Select<string>
                        labelId="extension-label"
                        value={selectedVideoExtension ?? ""}
                        label={t("extension")}
                        onChange={handleVideoExtensionChange}
                    >
                        {_map(videoExtensions, (e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>}
            {selectedMediaType === MediaFormat.Audio && <Grid size={4}>
                <FormControl fullWidth>
                    <InputLabel id="extension-label">{t("extension")}</InputLabel>
                    <Select<string>
                        labelId="extension-label"
                        value={selectedAudioExtension ?? ""}
                        label={t("extension")}
                        onChange={handleAudioExtensionChange}
                    >
                        {_map(audioExtensions, (e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>}
            {selectedMediaType === MediaFormat.Video &&
                <Grid size={4}>
                    <FormControl fullWidth>
                        <InputLabel id="format-label">{t("format")}</InputLabel>
                        <Select<string>
                            labelId="format-label"
                            value={selectedResolution?.format_id ?? ""}
                            label={t("format")}
                            onChange={handleResolutionChange}
                        >
                            {_map(resolutions, (f) => <MenuItem key={f.format_id} value={f.format_id}>{f.resolution}</MenuItem>)}
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
