import classnames from "classnames";
import {ipcRenderer} from "electron";
import {LaunchOptions} from "puppeteer";
import React from "react";
import {useTranslation} from "react-i18next";

import {Box, Button, Divider, Stack} from "@mui/material";
import Grid from "@mui/material/Grid2";

// import useAppTheme from "../../react/hooks/useAppTheme";
import Styles from "./HomeView.styl";

export const HomeView: React.FC = () => {
    const {t} = useTranslation();
    // const {state} = useAgressoContext();
    // const [totalHours, setTotalHours] = useState(0);
    // const {theme} = useAppTheme();
    // const palette = theme.palette;
    // const agressoConfig: AgressoOptions = global.store.get("agresso");

    const execute = async () => {
        // const {entries, period, invoice, template, items, dueDays} = state;
        // const groups = $_.groupBy(entries, "type");
        const options: LaunchOptions = {}; // global.store.get("options");
        // const agressoConfig: AgressoOptions = global.store.get("agresso");
        // const companyOptions: AgressoCompany = global.store.get("company");
        // const params: AgressoParams = {
        //     invoice,
        //     template,
        //     period: {month: period.month() + 1, year: period.year()},
        //     illness: $_.map(groups[AgressoType.Illness], toWorkdayInfo),
        //     holiday: $_.map(groups[AgressoType.Holiday], toWorkdayInfo),
        //     publicHoliday: $_.map(groups[AgressoType.PublicHoliday], toWorkdayInfo),
        //     onsite: $_.map(groups[AgressoType.Onsite], toWorkdayInfo),
        //     other: $_.map(groups[AgressoType.Other], toWorkdayInfo),
        //     overtime: $_.map(groups[AgressoType.Overtime], toWorkdayInfo),
        //     work: calculateWorkDays(period, entries),
        //     additionalItems: items,
        //     expectedHours: totalHours,
        //     dueDays,
        //     lang: i18n.language,
        // };

        ipcRenderer.send("execute", options);
    };

    return (
        <Box className={Styles.home}>
            <Stack className={Styles.content} direction="row" spacing={2} divider={<Divider orientation="vertical" />}>
                <Stack direction="column" spacing={3} className={classnames(Styles.rootColumn, Styles.left)}></Stack>
                <Stack
                    direction="column"
                    spacing={1}
                    paddingTop={1}
                    className={classnames(Styles.rootColumn, Styles.right)}
                ></Stack>
            </Stack>

            <Grid className={Styles.footer}>
                <Stack className={Styles.actions} direction="row" spacing={2}>
                    <Button variant="contained" color="secondary" disableElevation onClick={execute}>
                        {t("execute")}
                    </Button>
                </Stack>
            </Grid>
        </Box>
    );
};

export default HomeView;
