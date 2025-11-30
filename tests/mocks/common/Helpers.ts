export const getProcessArgs = jest.fn(() => ({}));

export const isDev = jest.fn();

export const waitFor = jest.fn().mockResolvedValue(undefined);

export const HelpersMock = {
    getProcessArgs,
    isDev,
    waitFor,
};

export default HelpersMock;
