import {renderHook} from "@testing-library/react";

import useWindowUpdater from "./useWindowUpdater";

describe("useWindowUpdater", () => {
    let addEventListenerSpy: jest.SpyInstance;
    let removeEventListenerSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.useFakeTimers();
        addEventListenerSpy = jest.spyOn(window, "addEventListener");
        removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    });

    afterEach(() => {
        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    test("registers resize listener and invokes callback on mount", () => {
        const callback = jest.fn();

        renderHook(() => useWindowUpdater(callback, 150));
        jest.advanceTimersByTime(150);
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
        jest.advanceTimersByTime(150);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith();
        expect(removeEventListenerSpy).not.toHaveBeenCalled();
    });

    test("cleans up resize listener on unmount", () => {
        const callback = jest.fn();
        const {unmount} = renderHook(() => useWindowUpdater(callback));

        expect(removeEventListenerSpy).not.toHaveBeenCalled();

        unmount();
        jest.runOnlyPendingTimers();

        expect(removeEventListenerSpy).toHaveBeenCalled();
    });
});
