import {Moment} from "moment";
import {Dispatch} from "react";

import {InvoiceItem} from "../../common/InvoiceGenerator";
import {CalendarEntry} from "../../components/calendar/Calendar";
import {AgressoTimeMode, AgressoType} from "../../enums/Agresso";
import {InvoiceTemplates} from "../../enums/Templates";
import {IAction} from "./Action";

export enum AgressoActions {
    SetActiveMode = "SET_ACTIVE_MODE",
    SetTimeMode = "SET_TIME_MODE",
    ChangeEntries = "CHANGE_ENTRIES",
    ChangePeriod = "CHANGE_PERIOD",
    ChangeInvoice = "CHANGE_INVOICE",
    ChangeInvoiceTemplate = "CHANGE_INVOICE_TEMPLATE",
    ChangeExtraItems = "CHANGE_EXTRA_ITEMS",
    ChangeDueDays= "CHANGE_DUE_DAYS",
}

export interface IAgressoAction extends IAction<AgressoActions> {
    activeMode?: AgressoType;
    timeMode?: AgressoTimeMode;
    entries?: CalendarEntry[];
    period?: Moment;
    invoice?: boolean;
    template?: InvoiceTemplates;
    items?: InvoiceItem[];
    dueDays?: number;
}

export const actions = (dispatch: Dispatch<IAgressoAction>) => ({
    setActiveMode: (mode: AgressoType) => dispatch({ type: AgressoActions.SetActiveMode, activeMode: mode }),
    setTimeMode: (timeMode: AgressoTimeMode) => dispatch({ type: AgressoActions.SetTimeMode, timeMode }),
    changeEntries: (entries: CalendarEntry[]) => dispatch({ type: AgressoActions.ChangeEntries, entries }),
    changePeriod: (period: Moment) => dispatch({ type: AgressoActions.ChangePeriod, period }),
    changeInvoice: (invoice: boolean) => dispatch({ type: AgressoActions.ChangeInvoice, invoice }),
    changeInvoiceTemplate: (template: InvoiceTemplates) =>
        dispatch({type: AgressoActions.ChangeInvoiceTemplate, template}),
    changeExtraItems: (items: InvoiceItem[]) =>
        dispatch({type: AgressoActions.ChangeExtraItems, items}),
    changeDueDays: (days: number) => dispatch({ type: AgressoActions.ChangeDueDays, dueDays: days }),
});
