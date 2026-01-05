import React from "react";

const actual = jest.requireActual("@app/react/contexts/AppContext");

export const useAppContext = jest.fn(() => ({
    state: {
        location: "/",
        theme: "sunset-sky",
        mode: "dark",
        loading: false,
        help: false
    },
    actions: {
        setLocation: jest.fn(),
        setTheme: jest.fn(),
        setMode: jest.fn(),
        setLoading: jest.fn(),
        setHelp: jest.fn(),
    },
}));

export const AppContextProvider = jest.fn(({children}: {children: React.ReactNode}) => (
    <div data-testid="app-context-provider">{children}</div>
));

const AppContextMock = {
    ...actual,
    useAppContext,
    AppContextProvider
};

export default AppContextMock;
