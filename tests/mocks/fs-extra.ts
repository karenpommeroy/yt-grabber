export const existsSync = jest.fn();

export const mkdirsSync = jest.fn();

export const readdirSync = jest.fn();

export const removeSync = jest.fn();

export const readJSONSync = jest.fn();

export const writeJSONSync = jest.fn();

export const FsExtraMock = {
    existsSync,
    mkdirsSync,
    readdirSync,
    removeSync,
    readJSONSync,
    writeJSONSync,
};

export default FsExtraMock;
