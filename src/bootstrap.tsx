import moment from "moment";
import React from "react";
import {I18nextProvider} from "react-i18next";

import App from "./App";
import i18n from "./i18next";
import {AgressoContextProvider} from "./react/contexts/AgressoContext";
import {AppContextProvider} from "./react/contexts/AppContext";

export const Bootstrap: React.FC = () => {
    moment.updateLocale("en", { week: { dow: 1 } });

    return (
        <AppContextProvider>
            <AgressoContextProvider>
                <I18nextProvider i18n={i18n}>
                    <App />
                </I18nextProvider>
            </AgressoContextProvider>
        </AppContextProvider>
    );
};

export default App;
