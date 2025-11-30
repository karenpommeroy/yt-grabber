import React from "react";

import {act, waitFor} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import NumberField from "./NumberField";

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
});
