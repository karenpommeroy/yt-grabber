import cancellablePromise from "./CancellablePromise";

describe("cancellablePromise", () => {
    test("resolves when underlying promise resolves", async () => {
        const base = Promise.resolve("success");
        const wrapped = cancellablePromise(base);

        await expect(wrapped.promise).resolves.toBe("success");
    });

    test("rejects when underlying promise rejects", async () => {
        const error = new Error("failure");
        const base = Promise.reject(error);
        const wrapped = cancellablePromise(base);

        await expect(wrapped.promise).rejects.toEqual({isCanceled: false, error});
    });

    test("rejects with cancellation when cancelled before resolution", async () => {
        let resolveFn: (value: string) => void;
        const base = new Promise<string>((resolve) => {
            resolveFn = resolve;
        });
        const wrapped = cancellablePromise(base);

        wrapped.cancel();
        resolveFn!("late success");

        await expect(wrapped.promise).rejects.toEqual({isCanceled: true, value: "late success"});
    });
});
