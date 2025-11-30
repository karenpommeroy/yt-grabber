import {Reporter} from "./Reporter";

describe("Reporter", () => {
    let emitter: jest.Mock;

    beforeEach(() => {
        emitter = jest.fn();
    });

    const lastPayload = () => emitter.mock.calls[emitter.mock.calls.length - 1]?.[0];

    test("start resets progress and task", () => {
        const reporter = new Reporter(emitter);

        reporter.start("Booting");

        expect(emitter).toHaveBeenCalledTimes(1);
        expect(lastPayload()).toEqual({progress: 0, task: "Booting", subtask: "", result: undefined});
    });

    test("update increments progress and clears subtask", () => {
        const reporter = new Reporter(emitter);

        reporter.start("Booting");
        reporter.update("Downloading", 25);
        reporter.update("Downloading", 5);

        expect(emitter).toHaveBeenCalledTimes(3);
        expect(lastPayload()).toEqual({progress: 30, task: "Downloading", subtask: "", result: undefined});
    });

    test("update0 reports subtasks without changing progress", () => {
        const reporter = new Reporter(emitter);

        reporter.start("Booting");
        reporter.update("Downloading", 10);
        reporter.update0("Chunk 1");

        expect(emitter).toHaveBeenCalledTimes(3);
        expect(lastPayload()).toEqual({progress: 10, task: "Downloading", subtask: "Chunk 1", result: undefined});
    });

    test("finish completes progress and stores result", () => {
        const reporter = new Reporter(emitter);
        const result = {path: "output.mp3"};

        reporter.start("Booting");
        reporter.finish("Done", result);

        expect(emitter).toHaveBeenCalledTimes(2);
        expect(lastPayload()).toEqual({progress: 100, task: "Done", subtask: "", result});
    });

    test("no-ops when emitter is missing", () => {
        const reporter = new Reporter(undefined as unknown as (data: never) => void);

        expect(() => {
            reporter.start("Boot");
            reporter.update("Progress", 10);
            reporter.update0("Subtask");
            reporter.finish("Done");
        }).not.toThrow();
    });
});
