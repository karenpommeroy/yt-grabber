import {merge} from "lodash-es";
import React, {createContext, FC, PropsWithChildren, useContext, useState} from "react";

import {createTheme, ThemeProvider} from "@mui/material/styles";

import {getThemeDefinition} from "../../theme/Theme";

export interface IAppThemeProps {
    mode?: "light" | "dark";
}

export interface IAppThemeProviderProps extends IAppThemeProps, PropsWithChildren {}

const defaultState: IAppThemeProps = {
    mode: "dark",
};

export const AppThemeContext = createContext<IAppThemeProps>(defaultState);

export const AppThemeProvider: FC<IAppThemeProviderProps> = (props: IAppThemeProviderProps) => {
    const {children, ...rest} = props;
    const mergedState = merge(defaultState, rest);
    const [mode] = useState(mergedState.mode);

    const theme = React.useMemo(() => {
        return createTheme({
            cssVariables: {
                colorSchemeSelector: "data-theme-mode",
                cssVarPrefix: "theme",
            },
            ...getThemeDefinition("Sky"),
        });
    }, [mode]);

    return <ThemeProvider theme={theme} defaultMode={mode} disableTransitionOnChange>{children}</ThemeProvider>;
};

export const useAppThemeContext = () => useContext(AppThemeContext);

export default AppThemeContext;
