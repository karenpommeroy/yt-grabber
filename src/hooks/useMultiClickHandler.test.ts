import {renderHook} from "@testing-library/react";

import cancellablePromise from "../common/CancellablePromise";
import delay from "../common/Delay";
import useCancellablePromises from "./useCancellablePromises";
import useMultiClickHandler from "./useMultiClickHandler";

type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};

const createDeferred = <T = void>(): Deferred<T> => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return {promise, resolve, reject};
};

jest.mock("./useCancellablePromises", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("../common/CancellablePromise", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("../common/Delay", () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe("useMultiClickHandler", () => {
    const useCancellablePromisesMock = useCancellablePromises as jest.MockedFunction<typeof useCancellablePromises>;
    const cancellablePromiseMock = cancellablePromise as jest.MockedFunction<typeof cancellablePromise>;
    const delayMock = delay as jest.MockedFunction<typeof delay>;

    let appendPendingPromise: jest.Mock;
    let removePendingPromise: jest.Mock;
    let clearPendingPromises: jest.Mock;

    beforeEach(() => {
        appendPendingPromise = jest.fn();
        removePendingPromise = jest.fn();
        clearPendingPromises = jest.fn();

        useCancellablePromisesMock.mockReturnValue({
            appendPendingPromise,
            removePendingPromise,
            clearPendingPromises,
        });

        delayMock.mockReset();
        cancellablePromiseMock.mockReset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("handleClick clears pending promises, appends new one, and triggers onClick on resolve", async () => {
        const onClick = jest.fn();
        const deferred = createDeferred<void>();
        const waitForClick = {promise: deferred.promise, cancel: jest.fn()};

        delayMock.mockReturnValue(deferred.promise);
        cancellablePromiseMock.mockReturnValue(waitForClick);

        const {result} = renderHook(() => useMultiClickHandler({onClick, timeout: 200}));

        const promise = result.current.handleClick("payload");

        expect(clearPendingPromises).toHaveBeenCalledTimes(1);
        expect(delayMock).toHaveBeenCalledWith(200);
        expect(appendPendingPromise).toHaveBeenCalledWith(waitForClick);
        expect(onClick).not.toHaveBeenCalled();

        deferred.resolve(undefined);
        await promise;

        expect(removePendingPromise).toHaveBeenCalledWith(waitForClick);
        expect(onClick).toHaveBeenCalledWith("payload");
    });

    test("handleClick propagates non-cancelled errors", async () => {
        const onClick = jest.fn();
        const deferred = createDeferred<void>();
        const waitForClick = {promise: deferred.promise, cancel: jest.fn()};
        const error = new Error("failure");

        delayMock.mockReturnValue(deferred.promise);
        cancellablePromiseMock.mockReturnValue(waitForClick);

        const {result} = renderHook(() => useMultiClickHandler({onClick}));

        const promise = result.current.handleClick();

        deferred.reject({isCanceled: false, error});

        await expect(promise).rejects.toBe(error);
        expect(removePendingPromise).toHaveBeenCalledWith(waitForClick);
        expect(onClick).not.toHaveBeenCalled();
    });

    test("handleClick swallows cancelled errors", async () => {
        const onClick = jest.fn();
        const deferred = createDeferred<void>();
        const waitForClick = {promise: deferred.promise, cancel: jest.fn()};

        delayMock.mockReturnValue(deferred.promise);
        cancellablePromiseMock.mockReturnValue(waitForClick);

        const {result} = renderHook(() => useMultiClickHandler({onClick}));

        const promise = result.current.handleClick();

        deferred.reject({isCanceled: true, error: new Error("cancelled")});

        await expect(promise).resolves.toBeUndefined();
        expect(removePendingPromise).toHaveBeenCalledWith(waitForClick);
        expect(onClick).not.toHaveBeenCalled();
    });

    test("handleDoubleClick clears pending promises and triggers callback", () => {
        const onDoubleClick = jest.fn();

        const {result} = renderHook(() => useMultiClickHandler({onDoubleClick}));

        result.current.handleDoubleClick("data");

        expect(clearPendingPromises).toHaveBeenCalledTimes(1);
        expect(onDoubleClick).toHaveBeenCalledWith("data");
        expect(removePendingPromise).not.toHaveBeenCalled();
        expect(appendPendingPromise).not.toHaveBeenCalled();
    });
});
