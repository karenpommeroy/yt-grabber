import {TextDecoder, TextEncoder} from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

const mockStore = {
    get: jest.fn().mockReturnValue({language: "en"}),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    has: jest.fn().mockReturnValue(true),
    onDidAnyChange: jest.fn().mockReturnValue(jest.fn()),
    onDidChange: jest.fn().mockReturnValue(jest.fn())
};

Object.defineProperty(process, "resourcesPath", {
    value: "/mocked/resources/path",
    writable: false,
});

jest.mock("electron", () => ({
    ipcRenderer: {
        send: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    },
}));

jest.mock("electron-store", () => {
    return jest.fn(() => mockStore);
});

(global as any).store = mockStore;