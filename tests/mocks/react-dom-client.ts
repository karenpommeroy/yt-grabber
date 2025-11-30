export const createRoot = jest.fn(() => ({
    render: jest.fn(),
    unmount: jest.fn(),
}));

export const ReactDomClient = {
    createRoot
};

export default ReactDomClient;
