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

export const App: React.FC = (props: Record<string, any>) => {
    const {state} = useAppContext();
    const {anchorEl, help} = useHelp();

    const renderLineBreaks = (value: string) => {
        return _map(_split(value, "\n"), (v, k) => <React.Fragment key={k}>{v}<br /></React.Fragment>);
    };

    const renderText = (value: string | string[]) => {
        const valueArray = _isArray(value) ? value : [value];
        
        return _map(valueArray, (v, k) => <p key={k}>{renderLineBreaks(v)}</p>);
    };

    return (
        <HashRouter>
            <Box {...props} className={classnames(Styles.app, {[Styles.help]: state.help})}>
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
