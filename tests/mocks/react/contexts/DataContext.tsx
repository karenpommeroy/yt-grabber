import React from "react";

const actual = jest.requireActual("@app/react/contexts/DataContext");

const DataContextMock = {
    ...actual,
    useDataState: jest.fn(() => ({})),
    DataProvider: ({children}: {children: React.ReactNode}) => (
        <div data-testid="data-provider">{children}</div>
    ),
};

export const DataProvider = DataContextMock.DataProvider;

export const useDataState = DataContextMock.useDataState;

export default DataContextMock;
