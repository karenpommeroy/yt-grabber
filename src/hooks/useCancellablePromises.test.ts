import {act, renderHook} from "@testing-library/react";

import {ICancelablePromise} from "../common/CancellablePromise";
import useCancellablePromises from "./useCancellablePromises";

describe("useCancellablePromises", () => {
    const createCancelable = (): ICancelablePromise => ({
        promise: Promise.resolve(),
        cancel: jest.fn(),
    });

    test("appendPendingPromise tracks promises", () => {
        const {result} = renderHook(() => useCancellablePromises());
        const promiseA = createCancelable();
        const promiseB = createCancelable();

        act(() => {
            result.current.appendPendingPromise(promiseA);
            result.current.appendPendingPromise(promiseB);
        });

        act(() => {
            result.current.clearPendingPromises();
        });

        expect(promiseA.cancel).toHaveBeenCalledTimes(1);
        expect(promiseB.cancel).toHaveBeenCalledTimes(1);
    });

    test("removePendingPromise stops tracking the removed promise", () => {
        const {result} = renderHook(() => useCancellablePromises());
        const promiseA = createCancelable();
        const promiseB = createCancelable();

        act(() => {
            result.current.appendPendingPromise(promiseA);
            result.current.appendPendingPromise(promiseB);
            result.current.removePendingPromise(promiseA);
        });

        act(() => {
            result.current.clearPendingPromises();
        });

        expect(promiseA.cancel).not.toHaveBeenCalled();
        expect(promiseB.cancel).toHaveBeenCalledTimes(1);
    });

    test("clearPendingPromises handles empty list safely", () => {
        const {result} = renderHook(() => useCancellablePromises());

        expect(() => {
            act(() => {
                result.current.clearPendingPromises();
            });
        }).not.toThrow();
    });
});
