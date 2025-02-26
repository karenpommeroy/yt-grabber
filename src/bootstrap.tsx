import moment from "moment";
import momentDurationFormat from "moment-duration-format";
import React from "react";
import {I18nextProvider} from "react-i18next";

import App from "./App";
import i18n from "./i18next";
import {AppContextProvider} from "./react/contexts/AppContext";
import {AppThemeProvider} from "./react/contexts/AppThemeContext";
import {DataProvider} from "./react/contexts/DataContext";

export const Bootstrap: React.FC = () => {
    momentDurationFormat(moment as any);
    moment.updateLocale("en", {week: {dow: 1}});
    i18n.changeLanguage(global.store.get("application").language);

    return (
        <AppContextProvider>
            <DataProvider>
                <I18nextProvider i18n={i18n}>
                    <AppThemeProvider>
                        <App />
                    </AppThemeProvider>
                </I18nextProvider>
            </DataProvider>
        </AppContextProvider>
    );
};

export default App;
