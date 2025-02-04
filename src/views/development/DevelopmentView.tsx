import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";

import {Box, Button, Divider, FormControlLabel, Stack, Switch} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {Options} from "../../common/Store";
import {useAppContext} from "../../react/contexts/AppContext";
import Styles from "./DevelopmentView.styl";

export const DevelopmentView: React.FC = () => {
    const {actions} = useAppContext();
    const {t} = useTranslation();
    const [agressoOptions, setAgressoOptions] = useState<Options>(global.store.get("agresso"));
    const [debouncedAgressoOptions] = useDebounceValue(agressoOptions, 500);

    const handleClose = async () => {
        actions.setLocation("/");
    };

    const handleSkipDataChange = (e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
        setAgressoOptions((prev) => ({ ...prev, skipData: checked }));
    };

    const handleShowInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
        setAgressoOptions((prev) => ({ ...prev, showInvoice: checked }));
    };

    useEffect(() => {
        global.store.set("agresso", debouncedAgressoOptions);
    }, [debouncedAgressoOptions]);

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
                        control={<Switch checked={agressoOptions.skipData} onChange={handleSkipDataChange} />}
                        label={t("skipHoursReport")}
                    />
                    <Divider />
                    <FormControlLabel
                        control={<Switch checked={agressoOptions.showInvoice} onChange={handleShowInvoiceChange} />}
                        label={t("showInvoiceSettings")}
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
