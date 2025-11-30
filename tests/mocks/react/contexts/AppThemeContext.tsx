import React from "react";

const actual = jest.requireActual("@app/react/contexts/AppThemeContext");

const AppThemeContextMock = {
    ...actual,
    AppThemeProvider: ({children}: {children: React.ReactNode}) => (
        <div data-testid="app-theme-provider">{children}</div>
    ),
};

export const {useAppThemeContext, useTheme} = actual;

export const AppThemeProvider = AppThemeContextMock.AppThemeProvider;

export default AppThemeContextMock;
