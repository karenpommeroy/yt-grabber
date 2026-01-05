import {get as _get} from "lodash-es";

import {SortOrder, TabsOrderKey} from "../../src/common/Media";

export const storeMock: Record<string, any> = {application: {language: "en-GB", theme: "sunset-sky", tabsOrder: [TabsOrderKey.Default, SortOrder.Asc]}};

export const get = jest.fn((key?: string) => {
    if (!key) return storeMock;

    return _get(storeMock, key);
});

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
