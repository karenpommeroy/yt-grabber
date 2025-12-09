import {IAction} from "./Action";

describe("Action", () => {
    test("IAction interface can be used as a type", () => {
        const action: IAction<string> = {
            type: "TEST_ACTION",
        };

        expect(action.type).toBe("TEST_ACTION");
    });
});
