import _isFunction from "lodash/isFunction";
import React from "react";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Button from "@mui/material/Button";
import ButtonGroup, {ButtonGroupProps} from "@mui/material/ButtonGroup";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";

export type SplitButtonProps = ButtonGroupProps & {
    labels: string[];
    loading?: boolean;
    handlers?: Array<() => void>;
    onClick?: (index: number) => void;
}

export const SplitButton = (props: SplitButtonProps) => {
    const {labels, loading, handlers, onClick, ...rest} = props;
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const handleClick = () => {
        executeHandler(selectedIndex);
    };

    const executeHandler = (index: number) => {
        if (handlers && _isFunction(handlers[index])) {
            handlers[index]();
        } else if (_isFunction(onClick)) {
            onClick(index);
        }
    };

    const handleMenuItemClick = (
        event: React.MouseEvent<HTMLLIElement, MouseEvent>,
        index: number,
    ) => {
        setSelectedIndex(index);
        setOpen(false);
        executeHandler(index);
    };

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event: Event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
            return;
        }

        setOpen(false);
    };

    return (
        <React.Fragment>
            <ButtonGroup
                variant="contained"
                ref={anchorRef}
                {...rest}
            >
                <Button loading={loading} onClick={handleClick}>{labels[selectedIndex]}</Button>
                <Button disabled={loading} size="small" onClick={handleToggle} sx={{width: "auto"}}>
                    <ArrowDropDownIcon />
                </Button>
            </ButtonGroup>
            <Popper
                sx={{zIndex: 1, width: anchorRef.current?.clientWidth ?? "auto"}}
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
            >
                {({TransitionProps, placement}) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === "bottom" ? "center top" : "center bottom",
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList autoFocusItem>
                                    {labels.map((label, index) => (
                                        <MenuItem
                                            key={label}
                                            selected={index === selectedIndex}
                                            onClick={(event) => handleMenuItemClick(event, index)}
                                        >
                                            {label}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </React.Fragment>
    );
};

export default SplitButton;
