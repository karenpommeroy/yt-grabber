export const exec = jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
}));

export const execPromise = jest.fn().mockResolvedValue("");

export const Progress = class {};

export class YtDlpWrapMock {
    exec = exec;
    execPromise = execPromise;
}

export default YtDlpWrapMock;
