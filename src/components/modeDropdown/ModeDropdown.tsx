import classnames from "classnames";
import $_ from "lodash";
import React from "react";
import {useTranslation} from "react-i18next";

import {
    Avatar, FormControl, InputLabel, ListItemAvatar, ListItemText, MenuItem, Select,
    SelectChangeEvent, SelectProps
} from "@mui/material";

import {getCalendarModes} from "../../common/CalendarModes";
import {AgressoType} from "../../enums/Agresso";
import {useAgressoContext} from "../../react/contexts/AgressoContext";
import Styles from "./ModeDropdown.styl";

export interface IModeDropdownProps extends Omit<SelectProps<AgressoType>, "value" | "onChange"> {
    value?: AgressoType;
    onChange?: (value: AgressoType) => void;
}

export const ModeDropdown = (props: IModeDropdownProps) => {
    const {onChange, ...rest} = props;
    const {t} = useTranslation();
    const { state, actions } = useAgressoContext();
    const calendarModes = getCalendarModes(t);
    const handleChange = (e: SelectChangeEvent<AgressoType>) => {
        const next = e.target.value as AgressoType;
        actions.setActiveMode(next);

        if (onChange) {
            onChange(next);
        }
    };

    return (
        <FormControl fullWidth={true} className={Styles.modeDropdown}>
            <InputLabel id="select-label">{t("type")}</InputLabel>
            <Select<AgressoType>
                {...rest}
                labelId="select-label"
                variant="outlined"
                value={state.activeMode}
                onChange={handleChange}
                label={t("type")}
                MenuProps={{
                    disablePortal: true,
                }}
                className={Styles.select}
                SelectDisplayProps={{
                    className: Styles.menuItem,
                }}
            >
                {$_.map(calendarModes, (mode) => (
                    <MenuItem key={mode.id} value={mode.id} className={Styles.menuItem}>
                        <ListItemAvatar>
                            <Avatar variant="rounded" sx={{ bgcolor: mode.color, color: "white" }}>
                                {<mode.icon />}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primaryTypographyProps={{
                                className: classnames(Styles.name, "uppercase"),
                                fontSize: ".9rem",
                            }}
                            secondaryTypographyProps={{ className: Styles.description }}
                            primary={mode.name}
                            secondary={mode.description}
                        />
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default ModeDropdown;
