import React from "react";

import {act, fireEvent, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import NumberField from "./NumberField";

const useIntervalMock = require("usehooks-ts").useInterval as jest.Mock;

jest.mock("usehooks-ts", () => require("@tests/mocks/usehooks-ts"));
type NumberFieldProps = React.ComponentProps<typeof NumberField>;

type ControlledNumberFieldProps = Omit<NumberFieldProps, "value" | "onChange" | "variant"> & {
    value?: number;
    onChange?: (value: number) => void;
    variant?: NumberFieldProps["variant"];
};

const ControlledNumberField: React.FC<ControlledNumberFieldProps> = ({value = 0, onChange, variant = "outlined", ...rest}) => {
    const [currentValue, setCurrentValue] = React.useState(value);

    React.useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleChange = (next: number) => {
        setCurrentValue(next);
        if (onChange) {
            onChange(next);
        }
    };

    return (
        <NumberField
            {...rest}
            value={currentValue}
            variant={variant}
            onChange={handleChange}
        />
    );
};

describe("NumberField", () => {
    beforeEach(() => {
        useIntervalMock.mockReset();
    });

    test("increments and decrements within boundaries", async () => {
        const onChange = jest.fn();
        const shell = await render(
            <ControlledNumberField
                value={1}
                step={1}
                min={0}
                max={3}
                onChange={onChange}
            />,
        );

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(1));

        const [decreaseButton, increaseButton] = shell.getAllByRole("button");

        act(() => {
            increaseButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
        });

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(2));

        act(() => {
            decreaseButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
        });

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(1));
    });

    test("loops between min and max when enabled", async () => {
        const onChange = jest.fn();
        const shell = await render(
            <ControlledNumberField
                value={2}
                min={0}
                max={2}
                step={1}
                loop={true}
                onChange={onChange}
            />,
        );

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(2));

        const [decreaseButton, increaseButton] = shell.getAllByRole("button");

        act(() => {
            increaseButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
        });

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(0));

        act(() => {
            decreaseButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
        });

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(2));
    });

    test("can hide increment and decrement buttons", async () => {
        const onChange = jest.fn();
        const shell = await render(
            <ControlledNumberField
                showIncreaseDecreaseButtons={false}
                onChange={onChange}
            />,
        );

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(0));

        expect(shell.container.querySelectorAll("button")).toHaveLength(0);
    });

    test("clamps to min and max when looping disabled", async () => {
        const onChange = jest.fn();
        const shell = await render(
            <ControlledNumberField
                value={1}
                min={0}
                max={2}
                step={5}
                loop={false}
                onChange={onChange}
            />,
        );

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(1));

        const [decreaseButton, increaseButton] = shell.getAllByRole("button");

        act(() => {
            increaseButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
        });

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(2));

        act(() => {
            decreaseButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
        });

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(0));
    });

    test("rejects empty input when allowEmpty is false", async () => {
        const onChange = jest.fn();
        const shell = await render(
            <ControlledNumberField
                value={2}
                allowEmpty={false}
                onChange={onChange}
            />,
        );

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(2));

        const input = shell.getByRole("textbox") as HTMLInputElement;

        act(() => {
            fireEvent.change(input, {target: {value: ""}});
        });

        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
        expect(input.value).toBe("2.00");
    });

    test("applies readOnly state to input when provided", async () => {
        const onChange = jest.fn();
        const shell = await render(<ControlledNumberField readOnly value={1} onChange={onChange} />);

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(1));

        const input = shell.getByRole("textbox") as HTMLInputElement;
        expect(input.readOnly).toBe(true);
    });

    test("holds increase triggers interval callback", async () => {
        let intervalCb: (() => void) | undefined;
        useIntervalMock.mockImplementation((cb: () => void) => {
            intervalCb = cb;
        });
        const onChange = jest.fn();
        const shell = await render(<ControlledNumberField value={1} onChange={onChange} />);

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(1));

        const increaseButton = shell.getAllByRole("button")[1];

        act(() => {
            increaseButton.dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
        });

        act(() => intervalCb && intervalCb());

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(1.5));
    });

    test("holding decrease starts interval and releasing stops it", async () => {
        let lastDelay: number | null | undefined;
        useIntervalMock.mockImplementation((_cb: () => void, delay: number | null | undefined) => {
            lastDelay = delay;
        });

        const onChange = jest.fn();
        const shell = await render(<ControlledNumberField value={1} initialPressedDelay={200} onChange={onChange} />);

        await waitFor(() => expect(lastDelay).toBeNull());

        const [decreaseButton] = shell.getAllByRole("button");

        act(() => {
            decreaseButton.dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
        });

        await waitFor(() => expect(lastDelay).toBe(200));

        act(() => {
            decreaseButton.dispatchEvent(new MouseEvent("mouseup", {bubbles: true}));
        });

        await waitFor(() => expect(lastDelay).toBeNull());
    });

    test("increase mouseup resets delay and stops interval", async () => {
        let lastDelay: number | null | undefined;
        let intervalCb: (() => void) | undefined;
        useIntervalMock.mockImplementation((cb: () => void, delay: number | null | undefined) => {
            intervalCb = cb;
            lastDelay = delay;
        });

        const shell = await render(<ControlledNumberField value={1} initialPressedDelay={300} onChange={jest.fn()} />);

        await waitFor(() => expect(lastDelay).toBeNull());

        const [, increaseButton] = shell.getAllByRole("button");

        act(() => {
            increaseButton.dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
        });

        await waitFor(() => expect(lastDelay).toBe(300));

        act(() => intervalCb && intervalCb());

        await waitFor(() => expect(lastDelay).toBe(250));

        act(() => {
            increaseButton.dispatchEvent(new MouseEvent("mouseup", {bubbles: true}));
        });

        await waitFor(() => expect(lastDelay).toBeNull());

        act(() => {
            increaseButton.dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
        });

        await waitFor(() => expect(lastDelay).toBe(300));
    });
});
