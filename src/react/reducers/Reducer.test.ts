import {reduce} from "./Reducer";

describe("reduce", () => {
    test("merges state changes into a copy of the original state", () => {
        const initial = {count: 1, nested: {flag: false}};
        const change = {count: 2};

        const result = reduce(initial, change);

        expect(result).toEqual({count: 2, nested: {flag: false}});
        expect(result).not.toBe(initial);
        expect(initial).toEqual({count: 1, nested: {flag: false}});
    });

    test("uses empty state from StateCreator when state is undefined", () => {
        const change = {ready: true};

        const result = reduce(undefined, change);

        expect(result).toEqual({ready: true});
    });
});
