import {
    createNextNamespacedState, createNextState, removeFromNextState, StateCreator
} from "./State";

describe("State utilities", () => {
    test("createNextState merges provided assignments into a copy", () => {
        const initial = {count: 1, details: {flag: false}};

        const updated = createNextState(initial, {count: 2}, {details: {flag: true}});

        expect(updated).toEqual({count: 2, details: {flag: true}});
        expect(updated).not.toBe(initial);
        expect(initial).toEqual({count: 1, details: {flag: false}});
    });

    test("createNextNamespacedState creates scoped object", () => {
        const base = {count: 1};
        const namespaced = createNextNamespacedState(base, {count: 2}, "namespace");

        expect(namespaced).toEqual({namespace: {count: 2}});
        expect(namespaced.namespace).not.toBe(base);
    });

    test("removeFromNextState omits specified keys", () => {
        const state = {a: 1, b: 2, c: 3};

        const withoutB = removeFromNextState(state, "b");
        const withoutBC = removeFromNextState(state, ["b", "c"]);

        expect(withoutB).toEqual({a: 1, c: 3});
        expect(withoutBC).toEqual({a: 1});
        expect(state).toEqual({a: 1, b: 2, c: 3});
    });

    describe("StateCreator", () => {
        test("create returns frozen clone of state", () => {
            const source = {nested: {value: 1}};

            const result = StateCreator.create(source);

            expect(result).toEqual({nested: {value: 1}});
            expect(result).not.toBe(source);
            expect(Object.isFrozen(result)).toBe(true);
        });

        test("create handles undefined state", () => {
            const result = StateCreator.create<{flag?: boolean}>();

            expect(result).toEqual({});
            expect(Object.isFrozen(result)).toBe(true);
        });
    });
});
