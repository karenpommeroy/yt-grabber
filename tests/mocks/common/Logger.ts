export const createLogger = jest.fn(() => ({
    debug: jest.fn(),
    success: jest.fn(),
}));

export const LoggerMock = {
    createLogger
};

export default LoggerMock;
