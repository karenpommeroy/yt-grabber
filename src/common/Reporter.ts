export type ProgressInfo<T extends object> = {
    progress: number;
    task: string;
    subtask: string;
    result?: T;
};

export interface IReporter<T extends object> {
    start: (status: string) => void;
    finish: (status: string, result?: T) => void;
    update: (status: string, progress?: number) => void;
    update0: (status: string) => void;
}

export class Reporter<T extends object> implements IReporter<T> {
    private progress: number = 0;
    private task: string = "";
    private subtask: string = "";
    private result: T = undefined;

    constructor(private emitter: (data: ProgressInfo<T>) => void) {}

    public start(status: string) {
        this.progress = 0;
        this.task = status;
        this.subtask = "";

        this.report();
    }

    public update(status: string, progress: number = 0) {
        this.progress += progress;
        this.task = status;
        this.subtask = "";

        this.report();
    }

    public update0(status: string) {
        this.subtask = status;

        this.report();
    }

    public finish(status: string, result?: T) {
        this.progress = 100;
        this.task = status;
        this.subtask = "";
        this.result = result;

        this.report();
    }

    private report() {
        if (!this.emitter) return;

        this.emitter({ progress: this.progress, task: this.task, subtask: this.subtask, result: this.result });
    }
}
