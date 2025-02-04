import React from "react";
import {HashRouter, Route, Routes} from "react-router-dom";

import {Box} from "@mui/material";
import {ThemeProvider} from "@mui/material/styles";

import Styles from "./App.styl";
import AppBar from "./components/appBar/AppBar";
import {ProcessModal} from "./components/modals/ProcessModal";
import {useAppContext} from "./react/contexts/AppContext";
import useAppTheme from "./react/hooks/useAppTheme";
import DevelopmentView from "./views/development/DevelopmentView";
import {HomeView} from "./views/home/HomeView";
import SettingsView from "./views/settings/SettingsView";

export const App: React.FC = () => {
    const { state } = useAppContext();
    const { theme } = useAppTheme();

    return (
        <ThemeProvider theme={theme}>
            <HashRouter>
                <Box className={Styles.app}>
                    <AppBar />
                    <Routes location={state.location}>
                        <Route path="/" element={<HomeView />} />
                        <Route path="/settings" element={<SettingsView />} />
                        <Route path="/development" element={<DevelopmentView />} />
                    </Routes>
                </Box>
                <ProcessModal id="process-modal" />
            </HashRouter>
        </ThemeProvider>
    );
};

export default App;
