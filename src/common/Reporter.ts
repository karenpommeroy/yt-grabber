import {AgressoResult} from "./Agresso";

export type ProgressInfo = {
    progress: number;
    task: string;
    subtask: string;
    result?: AgressoResult;
};

export interface IReporter {
    start: (status: string) => void;
    finish: (status: string, result?: any) => void;
    update: (status: string, progress?: number) => void;
    update0: (status: string) => void;
}

export class Reporter implements IReporter {
    private progress: number = 0;
    private task: string = "";
    private subtask: string = "";
    private result: any = undefined;

    constructor(private emitter: (data: ProgressInfo) => void) {}

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

    public finish(status: string, result?: any) {
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
