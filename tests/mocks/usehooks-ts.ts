export const useDebounceValue = jest.fn(<T>(value: T) => [value]);

export const useInterval = jest.fn();

export const UseHooksTsMock = () => ({
    useDebounceValue,
    useInterval,
});

export default UseHooksTsMock;
