import {map} from "lodash-es";

export const afterEach = <T extends object>(promises: Promise<T>[], callback: (value: T) => void) => {
    return map(promises, async (promise) => {
        try {
            const result = await promise;
            callback(result);
            return result;
        } catch (err) {
            callback(err);
            return err;
        }
    });
};
