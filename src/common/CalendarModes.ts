import {TFunction} from "i18next";

import PublicHolidayIcon from "@mui/icons-material/Event";
import IllnessIcon from "@mui/icons-material/LocalHospital";
import OnsiteIcon from "@mui/icons-material/Luggage";
import OtherIcon from "@mui/icons-material/Poll";
import HolidayIcon from "@mui/icons-material/Today";
import OvertimeIcon from "@mui/icons-material/Update";
import {SvgIconTypeMap} from "@mui/material";
import {OverridableComponent} from "@mui/material/OverridableComponent";

import {AgressoType} from "../enums/Agresso";

export type ModeDefinition = {
    id: AgressoType;
    name: string;
    color: string;
    description: string;
    icon: OverridableComponent<SvgIconTypeMap<object, "svg">>;
};

export const getCalendarModes: (t: TFunction) => ModeDefinition[] = (t: TFunction) => {
    return [
        {
            id: AgressoType.Illness,
            name: t("illness"),
            color: "red",
            description: t("nonWorkingDaysDueToSickness"),
            icon: IllnessIcon,
        },
        {
            id: AgressoType.Holiday,
            name: t("holiday"),
            color: "green",
            description: t("nonWorkingDaysDueToHolidays"),
            icon: HolidayIcon,
        },
        {
            id: AgressoType.PublicHoliday,
            name: t("publicHoliday"),
            color: "teal",
            description: t("nonWorkingDaysDueToPublicHolidays"),
            icon: PublicHolidayIcon,
        },
        {
            id: AgressoType.Onsite,
            name: t("onsite"),
            color: "purple",
            description: t("workingDaysOnsiteInTheOffice"),
            icon: OnsiteIcon,
        },
        {
            id: AgressoType.Other,
            name: t("other"),
            color: "grey",
            description: t("otherWorkingDays"),
            icon: OtherIcon,
        },
        {
            id: AgressoType.Overtime,
            name: t("overtime"),
            color: "cornflowerblue",
            description: t("overtimeHours"),
            icon: OvertimeIcon,
        },
    ];
};
