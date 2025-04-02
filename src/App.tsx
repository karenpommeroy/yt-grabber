import classnames from "classnames";
import _isArray from "lodash/isArray";
import _map from "lodash/map";
import _split from "lodash/split";
import React from "react";
import {HashRouter, Route, Routes} from "react-router-dom";

import {Box, CssBaseline, Paper, Popper, Typography} from "@mui/material";

import Styles from "./App.styl";
import AppBar from "./components/appBar/AppBar";
import useHelp from "./hooks/useHelp";
import {useAppContext} from "./react/contexts/AppContext";
import DevelopmentView from "./views/development/DevelopmentView";
import {HomeView} from "./views/home/HomeView";
import SettingsView from "./views/settings/SettingsView";

export const App: React.FC = () => {
    const {state} = useAppContext();
    const {anchorEl, help} = useHelp();

    const renderText = (value: string | string[]) => {
        const res = _map(_isArray(value) ? value : [value], (v, k) => <p key={k}>{_map(_split(v, "\n"), (m, i) => <React.Fragment key={i}>{m}<br /></React.Fragment>)}</p>);
        return res;
    };

    return (
        <HashRouter>
            <Box className={classnames(Styles.app, {[Styles.help]: state.help})}>
                <CssBaseline enableColorScheme />
                <AppBar disableNavigation={state.loading} />
                <Routes location={state.location}>
                    <Route path="/" element={<HomeView />} />
                    <Route path="/settings" element={<SettingsView />} />
                    <Route path="/development" element={<DevelopmentView />} />
                </Routes>
                <Popper
                    className={Styles.helpPopup}
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}

                    disablePortal
                >
                    <Paper sx={{p: 2}}>
                        <Typography className={Styles.header} color="textSecondary">{help.header}</Typography>
                        <Typography component="div" className={Styles.content}>{renderText(help.content)}</Typography>
                    </Paper>
                </Popper>
            </Box>
        </HashRouter>
    );
};

export default App;
