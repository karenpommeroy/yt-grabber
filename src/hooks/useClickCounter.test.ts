import {act, renderHook} from "@testing-library/react";

import {useClickCounter} from "./useClickCounter";

describe("useClickCounter hook", () => {
    jest.useFakeTimers();

    test("increments click counter and resets after timeout", () => {
        const callback = jest.fn();
        const {result} = renderHook(() => useClickCounter(callback, 3, 500));

        expect(result.current.clickCounter).toBe(0);

        act(() => {
            result.current.onClick();
            result.current.onClick();
        });

        expect(result.current.clickCounter).toBe(2);

        act(() => {
            jest.advanceTimersByTime(500);
        });

        expect(result.current.clickCounter).toBe(0);
    });

    test("calls callback after required clicks", () => {
        const callback = jest.fn();
        const {result} = renderHook(() => useClickCounter(callback, 3, 500));

        act(() => {
            result.current.onClick();
            result.current.onClick();
            result.current.onClick();
        });

        expect(callback).toHaveBeenCalledTimes(1);

        expect(result.current.clickCounter).toBe(0);
    });

    test("does not call callback if clicks are less than required", () => {
        const callback = jest.fn();
        const {result} = renderHook(() => useClickCounter(callback, 3, 500));

        act(() => {
            result.current.onClick();
            result.current.onClick();
        });

        expect(callback).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(500);
        });

        expect(result.current.clickCounter).toBe(0);
    });
});
