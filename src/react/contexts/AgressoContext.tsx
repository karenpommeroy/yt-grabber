import {Moment} from "moment";
import React, {createContext, FC, ReactNode, useReducer} from "react";

import {AgressoTimeMode, AgressoType} from "../../enums/Agresso";
import {InvoiceTemplates} from "../../enums/Templates";
import {actions} from "../actions/AgressoActions";
import reducer from "../reducers/AgressoReducer";
import {createDefaultState, IAgressoState} from "../states/AgressoState";

interface IAgressoContext {
    state: IAgressoState;
    actions: {
        setActiveMode: (mode: AgressoType) => void;
        setTimeMode: (timeMode: AgressoTimeMode) => void;
        changePeriod: (period: Moment) => void;
        changeInvoice: (invoice: boolean) => void;
        changeInvoiceTemplate: (template: InvoiceTemplates) => void;
        changeDueDays: (days: number) => void;
    };
}

interface IAgressoContextProviderProps {
    children: ReactNode;
}

const AgressoContext = createContext<IAgressoContext | undefined>(undefined);

export const AgressoContextProvider: FC<IAgressoContextProviderProps> = (props: any) => {
    const [reducerState, dispatch] = useReducer(reducer, createDefaultState());
    const reducerActions = actions(dispatch);
    const context: IAgressoContext = {
        state: { ...reducerState },
        actions: { ...reducerActions },
    };

    return <AgressoContext.Provider value={context}>{props.children}</AgressoContext.Provider>;
};

export const useAgressoContext = (): IAgressoContext => {
    const context = React.useContext(AgressoContext);

    if (!context) {
        throw new Error("useAgressoContext must be used within AgressoContextProvider");
    }

    return context;
};

export default AgressoContext;
