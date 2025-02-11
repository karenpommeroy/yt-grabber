import React from "react";
import {HashRouter, Route, Routes} from "react-router-dom";

import {Box, CssBaseline} from "@mui/material";

import Styles from "./App.styl";
import AppBar from "./components/appBar/AppBar";
import {useAppContext} from "./react/contexts/AppContext";
import DevelopmentView from "./views/development/DevelopmentView";
import {HomeView} from "./views/home/HomeView";
import SettingsView from "./views/settings/SettingsView";

export const App: React.FC = () => {
    const { state } = useAppContext();

    return (
        <HashRouter>
            <Box className={Styles.app}>
                <CssBaseline enableColorScheme />
                <AppBar />
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
