import {renderHook} from "@testing-library/react";

import useWindowUpdater from "./useWindowUpdater";

import type {DebouncedFunc} from "lodash";

jest.mock("lodash-es", () => {
    const actual = jest.requireActual("lodash-es");

    return {
        ...actual,
        debounce: (fn: (...args: unknown[]) => void): DebouncedFunc<(...args: unknown[]) => void> => {
            const debounced = ((...args: unknown[]) => fn(...args)) as DebouncedFunc<(...args: unknown[]) => void>;

            debounced.cancel = jest.fn();
            debounced.flush = jest.fn(() => fn());

            return debounced;
        },
    };
});

describe("useWindowUpdater", () => {
    let addEventListenerSpy: jest.SpyInstance;
    let removeEventListenerSpy: jest.SpyInstance;

    beforeEach(() => {
        addEventListenerSpy = jest.spyOn(window, "addEventListener");
        removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    });

    afterEach(() => {
        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
        jest.clearAllMocks();
    });

    test("registers resize listener and invokes callback on mount", () => {
        const callback = jest.fn();

        renderHook(() => useWindowUpdater(callback, 150));

        expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test("invokes callback when resize handler fires", () => {
        const callback = jest.fn();

        renderHook(() => useWindowUpdater(callback));

        const resizeHandler = addEventListenerSpy.mock.calls[0][1] as () => void;
        expect(typeof resizeHandler).toBe("function");

        callback.mockClear();
        resizeHandler();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith();
        expect(removeEventListenerSpy).not.toHaveBeenCalled();
    });
});
