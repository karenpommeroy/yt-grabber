import {TextDecoder, TextEncoder} from "util";

import electronMock from "@tests/mocks/electron";
import storeMock from "@tests/mocks/electron-store";
import reactI18nMock from "@tests/mocks/react-i18next";

global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

Object.defineProperty(process, "resourcesPath", {
    value: "./src/resources",
    writable: false,
});

jest.mock("react-i18next", () => reactI18nMock);
jest.mock("electron", () => electronMock);
jest.mock("electron-store", () => storeMock);

(global as any).store = storeMock();
