import classnames from "classnames";
import {replace} from "lodash-es";
import map from "lodash-es/map";
import {useTranslation} from "react-i18next";

import {
    FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, SelectProps, Stack, Typography
} from "@mui/material";

import {useAppContext} from "../../react/contexts/AppContext";
import {getThemeSample, themeDefinitions, Themes} from "../../theme/Theme";
import Styles from "./ColorThemePicker.styl";

export type IColorThemePickerProps = SelectProps;

export const ColorThemePicker = (props: IColorThemePickerProps) => {
    const {className, ...rest} = props;
    const {t} = useTranslation();
    const {state, actions} = useAppContext();
    const colorThemes = map(themeDefinitions, (value, key: Themes) => ({
        name: key,
        sample: getThemeSample(key, state.mode),
    }));

    const onChangeColorTheme = (event: SelectChangeEvent<Themes>) => {
        global.store.set("application.colorTheme", event.target.value);
        actions.setTheme(event.target.value);
    };

    return (
        <FormControl fullWidth className={classnames(Styles.colorThemePicker, className)}>
            <InputLabel id="color-theme-picker-label">{t("colorTheme")}</InputLabel>
            {state.mode && <Select
                value={global.store.get("application.colorTheme")}
                labelId="color-theme-picker-label"
                label={t("colorTheme")}
                size="small"
                onChange={onChangeColorTheme}
                className={Styles.select}
                slotProps={{
                    input: {
                        className: Styles.selectInput,
                    },
                }}
                MenuProps={{
                    disablePortal: true,
                }}
                {...rest}
            >
                {map(colorThemes, (item) => (
                    <MenuItem key={item.name} value={item.name} className={Styles.menuItem}>
                        <Stack direction="row" spacing={2} className={Styles.menuItemWrapper}>
                            <Stack direction="row" className={Styles.themeSample}>
                                {map(item.sample, (color, idx) => (
                                    <div key={idx} className={Styles.color} style={{backgroundColor: color}} />
                                ))}
                            </Stack>
                            <Typography variant="body1" className={Styles.themeName}>
                                {replace(item.name, "-", " ")}
                            </Typography>
                        </Stack>
                    </MenuItem>
                ))}
            </Select>}
        </FormControl>
    );
};

export default ColorThemePicker;
