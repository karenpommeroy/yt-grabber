import moment from "moment";
import momentDurationFormat from "moment-duration-format";
import React from "react";
import {I18nextProvider} from "react-i18next";

import {render as baseRender, RenderOptions, waitFor} from "@testing-library/react";

import i18n from "../src/i18next";
import {AppContextProvider} from "../src/react/contexts/AppContext";
import {AppThemeProvider} from "../src/react/contexts/AppThemeContext";
import {DataProvider} from "../src/react/contexts/DataContext";
import {RootAttributeRemover} from "./RootAttributeRemover";

export const Providers: React.FC<{children: React.ReactNode;}> = ({children}) => {
    momentDurationFormat(moment as any);
    moment.updateLocale("en", {week: {dow: 1}});
    
    return (
        <AppContextProvider>
            <DataProvider>
                <I18nextProvider i18n={i18n}>
                    <AppThemeProvider>
                        <div id="test-root">
                            {children}
                        </div>
                        <RootAttributeRemover rootSelector="body > div" attributeName="aria-hidden"/>
                    </AppThemeProvider>
                </I18nextProvider>
            </DataProvider>
        </AppContextProvider>
    );
};

export const render = async (ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
    const result = baseRender(ui, {wrapper: Providers, ...options});

    await waitFor(() => expect(result.container.querySelector("#test-root")).toBeInTheDocument());
    
    return result;
};

export default render;
