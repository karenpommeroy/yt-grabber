export const get = jest.fn().mockReturnValue({language: "en-GB"});

export const set = jest.fn();

export const remove = jest.fn();

export const clear = jest.fn();

export const has = jest.fn().mockReturnValue(true);

export const onDidAnyChange = jest.fn().mockReturnValue(jest.fn());

export const onDidChange = jest.fn().mockReturnValue(jest.fn());

export const ElectronStoreMock = jest.fn(() => ({
    get, 
    set,
    delete: remove,
    clear: jest.fn(),
    has,
    onDidAnyChange,
    onDidChange
}));

export default ElectronStoreMock;
