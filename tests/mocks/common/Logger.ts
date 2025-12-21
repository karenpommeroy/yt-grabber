// const actual = jest.requireActual("@app/common/Logger");

export const createLogger = jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
}));

export const LoggerMock = {
    // ...actual,
    createLogger
};

export default LoggerMock;
