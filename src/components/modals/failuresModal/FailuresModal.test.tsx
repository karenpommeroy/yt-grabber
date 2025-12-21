import {fireEvent, screen} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import {useDataState} from "../../../react/contexts/DataContext";
import FailuresModal from "./FailuresModal";

jest.mock("../../../react/contexts/DataContext", () => require("@tests/mocks/react/contexts/DataContext"));

const useDataStateMock = useDataState as jest.Mock;

describe("FailuresModal", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useDataStateMock.mockReturnValue({
            trackStatus: [],
        } as any);
    });

    test("handleCancel invokes onCancel callback", async () => {
        const onCancel = jest.fn();
        await render(<FailuresModal id="failures" open onCancel={onCancel} />);

        fireEvent.click(screen.getByText("cancel"));

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    test("handleConfirm invokes onConfirm callback", async () => {
        const onConfirm = jest.fn();
        await render(<FailuresModal id="failures" open onConfirm={onConfirm} />);

        fireEvent.click(screen.getByText("retry"));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });
});
