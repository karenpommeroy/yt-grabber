export const ipcRenderer = {
    send: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
};

export const ipcMain = {
    on: jest.fn(),
    once: jest.fn(),
};

export const dialog = {
    showOpenDialog: jest.fn(),
};

export const shell = {
    openExternal: jest.fn(),
    openPath: jest.fn(),
    showItemInFolder: jest.fn(),
};

export const ElectronMock = {
    ipcRenderer,
    ipcMain,
    dialog,
    shell,
};

export default ElectronMock;
