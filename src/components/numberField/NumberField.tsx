import {defaultTo, isUndefined, max as _max, min as _min, toNumber} from "lodash-es";
import React, {useEffect, useState} from "react";
import {NumberFormatValues, NumericFormat, NumericFormatProps} from "react-number-format";
import {useInterval} from "usehooks-ts";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {IconButton, InputAdornment, TextField, TextFieldProps} from "@mui/material";
import {InputLabelProps} from "@mui/material/InputLabel";

import Styles from "./NumberField.styl";

export interface INumberFieldProps extends Omit<NumericFormatProps<TextFieldProps<"outlined">>, "onChange"> {
    label?: string;
    readOnly?: boolean;
    allowEmpty?: boolean;
    loop?: boolean;
    min?: number;
    max?: number;
    step?: number;
    showIncreaseDecreaseButtons?: boolean;
    inputLabelProps?: Partial<InputLabelProps>;
    initialPressedDelay?: number;
    onChange: (value: number) => void;
}

export const NumberField = (props: INumberFieldProps) => {
    const {
        value = 0,
        label,
        width,
        readOnly,
        inputLabelProps,
        allowEmpty,
        decimalScale = 2,
        loop,
        fullWidth,
        fixedDecimalScale = true,
        onChange,
        initialPressedDelay = 300,
        showIncreaseDecreaseButtons = true,
        min,
        max,
        step = 0.5,
        ...rest
    } = props;
    const [decreasePressed, setDecreasePressed] = useState(false);
    const [increasePressed, setIncreasePressed] = useState(false);
    const [delay, setDelay] = useState(initialPressedDelay);
    const [text, setText] = useState(value);

    useInterval(
        () => {
            if (decreasePressed) onDecreaseClick();
            if (increasePressed) onIncreaseClick();
            setDelay(_max([50, delay - 50]));
        },
        decreasePressed || increasePressed ? delay : null,
    );

    const handleValueChange = (values: NumberFormatValues) => {
        setText(values.floatValue);
    };

    const onDecreaseClick = () => {
        const predicted = toNumber(value) - toNumber(step);

        setText(loop && predicted < min ? max : _max([predicted, min]));
    };

    const onIncreaseClick = () => {
        const predicted = toNumber(value) + toNumber(step);
        
        setText(loop && predicted > max ? min : _min([predicted, max]));
    };

    const onDecreaseMouseDown = () => {
        setDecreasePressed(true);
    };

    const onIncreaseMouseDown = () => {
        setIncreasePressed(true);
    };

    const onDecreaseMouseUp = () => {
        setDecreasePressed(false);
        setDelay(initialPressedDelay);
    };

    const onIncreaseMouseUp = () => {
        setIncreasePressed(false);
        setDelay(initialPressedDelay);
    };

    const isAllowed = (values: NumberFormatValues) => {        
        if (isUndefined(values.floatValue) && !allowEmpty) {
            return false;
        };

        return true;
    };

    useEffect(() => {
        const value = toNumber(text) ?? 0;

        if (onChange) {
            onChange(value);
        }
    }, [text]);

    return (
        <NumericFormat
            value={value}
            onValueChange={handleValueChange}
            slotProps={{
                input: showIncreaseDecreaseButtons ? {
                    startAdornment: (
                        <InputAdornment position="start">
                            <IconButton
                                color="primary"
                                edge="start"
                                onClick={onDecreaseClick}
                                onMouseDown={onDecreaseMouseDown}
                                onMouseUp={onDecreaseMouseUp}
                            >
                                <RemoveIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                color="primary"
                                edge="end"
                                onClick={onIncreaseClick}
                                onMouseDown={onIncreaseMouseDown}
                                onMouseUp={onIncreaseMouseUp}
                            >
                                <AddIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                    readOnly,
                } : {},
                htmlInput: {
                    label,
                    style: {textAlign: "center", width},
                },
                inputLabel: defaultTo(inputLabelProps, {className: "upperfirst"})
            }}
            customInput={TextField}
            variant="outlined"
            fullWidth={fullWidth}
            className={Styles.numberField}
            decimalScale={decimalScale}
            fixedDecimalScale={fixedDecimalScale}
            isAllowed={isAllowed}
            label={label}
            {...rest}
        />
    );
};

export default NumberField;
