import moment, {Moment} from "moment";

import {InvoiceItem} from "../../common/InvoiceGenerator";
import {CalendarEntry} from "../../components/calendar/Calendar";
import {AgressoTimeMode, AgressoType} from "../../enums/Agresso";
import {InvoiceTemplates} from "../../enums/Templates";
import {StateCreator} from "./State";

export interface IAgressoState {
    activeMode?: AgressoType;
    timeMode?: AgressoTimeMode;
    entries?: CalendarEntry[];
    period?: Moment;
    invoice?: boolean;
    template?: InvoiceTemplates;
    items?: InvoiceItem[];
    dueDays?: number;
}

export const createDefaultState = () => {
    return StateCreator.create<IAgressoState>({
        activeMode: AgressoType.Illness,
        timeMode: AgressoTimeMode.Guess,
        entries: [],
        period: moment(),
        template: InvoiceTemplates.Simple,
        invoice: false,
        items: [],
        dueDays: 14,        
    });
};
