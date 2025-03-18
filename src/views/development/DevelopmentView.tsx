import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";

import {Box, Button, Divider, FormControlLabel, Stack, Switch} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {ApplicationOptions} from "../../common/Store";
import {useAppContext} from "../../react/contexts/AppContext";
import Styles from "./DevelopmentView.styl";

export const DevelopmentView: React.FC = () => {
    const {actions} = useAppContext();
    const {t} = useTranslation();
    const [options, setOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const [debouncedOptions] = useDebounceValue(options, 500, {leading: true});

    const handleClose = async () => {
        actions.setLocation("/");
    };

    const handleDebugModeChange = (e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
        setOptions((prev) => ({ ...prev, debugMode: checked }));
    };

    useEffect(() => {
        global.store.set("application", debouncedOptions);
    }, [debouncedOptions]);

    return (
        <Box className={Styles.development}>
            <Stack
                component="form"
                className={Styles.form}
                direction="row"
                spacing={2}
                divider={<Divider orientation="vertical" />}
            >
                <Stack direction="column" spacing={3} className={Styles.rootColumn}>
                    <FormControlLabel
                        control={<Switch checked={options.debugMode} onChange={handleDebugModeChange} />}
                        label={t("debugMode")}
                    />
                </Stack>
            </Stack>
            <Grid className={Styles.footer}>
                <Stack className={Styles.actions} direction="row" spacing={2}>
                    <Button variant="contained" color="primary" onClick={handleClose}>
                        {t("close")}
                    </Button>
                </Stack>
            </Grid>
        </Box>
    );
};

export default DevelopmentView;
