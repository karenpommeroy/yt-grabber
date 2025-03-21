import $_ from "lodash";

export type TPartial<T> = {
    [P in keyof T]?: TPartial<T[P]>;
};

export const createNextState = <T>(obj: T, ...assignments: Array<TPartial<T> | T>): T => {
    return Object.assign({}, obj, ...assignments);
};

export const createNextNamespacedState = <T>(
    obj: T,
    assignments: TPartial<T> | T,
    namespace: string,
): { [key: string]: T } => {
    return Object.assign({}, { [namespace]: $_.assign({}, obj, assignments) });
};

export const removeFromNextState = <T extends object>(obj: T, path: string | string[]): T => {
    return $_.omit(obj, path) as T;
};

export class StateCreator {
    public static create<TState extends object>(state?: TState): TState {
        const initialState: TState = new Object() as TState;

        return Object.freeze($_.merge<TState, TState>(initialState, state));
    }
}
