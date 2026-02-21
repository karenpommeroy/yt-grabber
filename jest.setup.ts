import {TextDecoder, TextEncoder} from "util";

import electronMock from "@tests/mocks/electron";
import storeMock from "@tests/mocks/electron-store";
import reactI18nMock from "@tests/mocks/react-i18next";

const originalConsoleInfo = console.info;
console.info = jest.fn((...args: any[]) => {
    const message = args[0]?.toString() ?? "";
    if (!message.includes("i18next is maintained") && !message.includes("locize")) {
        originalConsoleInfo(...args);
    }
});

const originalConsoleWarn = console.warn;
console.warn = jest.fn((...args: any[]) => {
    const message = args[0]?.toString() ?? "";
    if (!message.includes("MUI: The `anchorEl` prop provided to the component is invalid")) {
        originalConsoleWarn(...args);
    }
});

global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

Object.defineProperty(process, "resourcesPath", {
    value: "./src/resources",
    writable: false,
});

Object.defineProperty(navigator, "clipboard", {
    value: {
        writeText: jest.fn().mockResolvedValue(undefined),
        readText: jest.fn().mockResolvedValue("mocked text"),
    },
    writable: true,
});

jest.mock("react-i18next", () => reactI18nMock);
jest.mock("electron", () => electronMock);
jest.mock("electron-store", () => storeMock);

(global as any).store = storeMock();
