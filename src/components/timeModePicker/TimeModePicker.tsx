import React, {ChangeEvent} from "react";
import {useTranslation} from "react-i18next";

import {
    FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, RadioGroupProps
} from "@mui/material";

import {AgressoTimeMode} from "../../enums/Agresso";
import {useAgressoContext} from "../../react/contexts/AgressoContext";
import Styles from "./TimeModePicker.styl";

export interface ITimeModePickerProps extends Omit<RadioGroupProps, "value" | "onChange"> {
    value?: AgressoTimeMode;
    onChange?: (value: AgressoTimeMode) => void;
}

export const TimeModePicker = (props: ITimeModePickerProps) => {
    const {onChange, value, ...rest} = props;
    const {t} = useTranslation();
    const { state, actions } = useAgressoContext();

    const handleChange = (e: ChangeEvent<HTMLInputElement>, next: AgressoTimeMode) => {
        actions.setTimeMode(next);

        if (onChange) {
            onChange(value);
        }
    };

    return (
        <FormControl className={Styles.timeModePicker}>
            <FormLabel id="group-label">{t("timeMode")}</FormLabel>
            <RadioGroup
                {...rest}
                name="time-mode-group"
                value={state.timeMode}
                onChange={handleChange}
                className={Styles.group}
            >
                <FormControlLabel
                    value={AgressoTimeMode.Guess}
                    control={<Radio />}
                    label={t("guess")}
                />
                <FormControlLabel
                    value={AgressoTimeMode.AllDay}
                    control={<Radio />}
                    label={t("wholeWorkDay")}
                />
                <FormControlLabel
                    value={AgressoTimeMode.Custom}
                    control={<Radio />}
                    label={t("specify")}
                />
            </RadioGroup>
        </FormControl>
    );
};

export default TimeModePicker;
