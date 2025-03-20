import _isEmpty from "lodash/isEmpty";
import React from "react";
import {HashRouter, Route, Routes} from "react-router-dom";

import {Box, CssBaseline} from "@mui/material";

import Styles from "./App.styl";
import AppBar from "./components/appBar/AppBar";
import {useAppContext} from "./react/contexts/AppContext";
import {useDataState} from "./react/contexts/DataContext";
import DevelopmentView from "./views/development/DevelopmentView";
import {HomeView} from "./views/home/HomeView";
import SettingsView from "./views/settings/SettingsView";

export const App: React.FC = () => {
    const {state} = useAppContext();
    const {queue} = useDataState();

    return (
        <HashRouter>
            <Box className={Styles.app}>
                <CssBaseline enableColorScheme />
                <AppBar disableNavigation={state.loading || !_isEmpty(queue)} />
                <Routes location={state.location}>
                    <Route path="/" element={<HomeView />} />
                    <Route path="/settings" element={<SettingsView />} />
                    <Route path="/development" element={<DevelopmentView />} />
                </Routes>
            </Box>
        </HashRouter>
    );
};

export default App;
