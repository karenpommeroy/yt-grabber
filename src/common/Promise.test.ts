import {afterEach} from "./Promise";

describe("afterEach", () => {
    test("should call the callback for each resolved promise", async () => {
        const callback = jest.fn();
        const promises = [
            Promise.resolve(1),
            Promise.resolve(2),
            Promise.resolve(3),
        ];

        const results = await Promise.all(afterEach(promises, callback));

        expect(callback).toHaveBeenCalledTimes(3);
        expect(callback).toHaveBeenCalledWith(1);
        expect(callback).toHaveBeenCalledWith(2);
        expect(callback).toHaveBeenCalledWith(3);
        expect(results).toEqual([1, 2, 3]);
    });

    test("should call the callback for each rejected promise", async () => {
        const callback = jest.fn();
        const error1 = new Error("Error 1");
        const error2 = new Error("Error 2");
        const promises = [
            Promise.reject(error1),
            Promise.reject(error2),
        ];

        const results = await Promise.all(afterEach(promises, callback));

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith(error1);
        expect(callback).toHaveBeenCalledWith(error2);
        expect(results).toEqual([error1, error2]);
    });

    test("should call the callback for both resolved and rejected promises", async () => {
        const callback = jest.fn();
        const error = new Error("Error");
        const promises = [
            Promise.resolve(1),
            Promise.reject(error),
        ];

        const results = await Promise.all(afterEach(promises, callback));

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith(1);
        expect(callback).toHaveBeenCalledWith(error);
        expect(results).toEqual([1, error]);
    });
});
