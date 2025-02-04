import $_ from "lodash";
import React, {useEffect, useState} from "react";
import {NumberFormatValues, NumericFormat, NumericFormatProps} from "react-number-format";
import {useInterval} from "usehooks-ts";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {
    IconButton, InputAdornment, InputLabelProps, TextField, TextFieldProps
} from "@mui/material";

import Styles from "./NumberField.styl";

export interface INumberFieldProps extends Omit<NumericFormatProps<TextFieldProps<"outlined">>, "onChange"> {
    label?: string;
    readOnly?: boolean;
    allowEmpty?: boolean;
    showIncreaseDecreaseButtons?: boolean;
    inputLabelProps?: Partial<InputLabelProps>;
    initialPressedDelay?: number;
    onChange: (value: number) => void;
}

export const NumberField = (props: INumberFieldProps) => {
    const {
        value = 0,
        label,
        readOnly,
        inputLabelProps,
        allowEmpty,
        decimalScale = 2,
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
            setDelay($_.max([50, delay - 50]));
        },
        decreasePressed || increasePressed ? delay : null,
    );

    const handleValueChange = (values: NumberFormatValues) => {
        setText(values.floatValue);
    };

    const onDecreaseClick = () => {
        setText($_.max([$_.toNumber(value) - $_.toNumber(step), min]));
    };

    const onIncreaseClick = () => {
        setText($_.min([$_.toNumber(value) + $_.toNumber(step), max]));
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
        if ($_.isUndefined(values.floatValue) && !allowEmpty) {
            return false;
        };

        return true;
    };

    useEffect(() => {
        const value = $_.toNumber(text) ?? 0;

        if (onChange) {
            onChange(value);
        }
    }, [text]);

    return (
        <NumericFormat
            value={value}
            onValueChange={handleValueChange}
            customInput={TextField}
            className={Styles.numberField}
            fullWidth
            label={label}
            InputLabelProps={$_.defaultTo(inputLabelProps, {className: "upperfirst"})}
            variant="outlined"
            decimalScale={decimalScale}
            fixedDecimalScale={fixedDecimalScale}
            inputProps={{
                style: {textAlign: "center"},
            }}
            isAllowed={isAllowed}
            InputProps={
                showIncreaseDecreaseButtons ? {
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
                } : {}
            }
            {...rest}
        />
    );
};

export default NumberField;
