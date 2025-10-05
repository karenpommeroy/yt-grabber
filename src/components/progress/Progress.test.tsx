import {screen} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import Progress from "./Progress";

describe("Progress component", () => {
    test("renders properly with default props", async () => {
        await render(<Progress value={50} data-testid="progress" />);

        const progressElement = screen.getByTestId("progress");
        expect(progressElement).toBeInTheDocument();
        expect(progressElement).toHaveTextContent("50%");
    });

    test("renders with a custom label", async () => {
        const customLabel = (value: number) => `Custom: ${value}`;
        await render(<Progress value={75} renderLabel={customLabel} data-testid="progress" />);

        const progressElement = screen.getByTestId("progress");
        expect(progressElement).toBeInTheDocument();
        expect(progressElement).toHaveTextContent("Custom: 75");
    });

    test("renders without a label when label is false", async () => {
        await render(<Progress value={30} label={false} data-testid="progress" />);

        const progressElement = screen.getByTestId("progress");
        expect(progressElement).toBeInTheDocument();
        expect(progressElement).not.toHaveTextContent("30%");
    });
});