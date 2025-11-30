import delay from "./Delay";

describe("Delay", () => {
    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test("resolves after the provided time", async () => {
        jest.useFakeTimers();

        const resolved: string[] = [];
        const delayedPromise = delay(500).then(() => resolved.push("done"));

        expect(resolved).toHaveLength(0);

        jest.advanceTimersByTime(500);
        await delayedPromise;

        expect(resolved).toEqual(["done"]);
    });

    test("passes the timeout to setTimeout", () => {
        jest.useFakeTimers();
        const timeoutSpy = jest.spyOn(globalThis, "setTimeout");

        delay(250);

        expect(timeoutSpy).toHaveBeenCalledTimes(1);
        expect(timeoutSpy.mock.calls[0]?.[1]).toBe(250);
    });
});
