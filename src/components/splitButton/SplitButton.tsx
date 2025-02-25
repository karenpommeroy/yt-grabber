import _find from "lodash/find";
import _first from "lodash/first";
import _get from "lodash/get";
import _isFunction from "lodash/isFunction";
import _map from "lodash/map";
import React, {useEffect} from "react";

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
    loading?: boolean;
    actions?: SplitButtonAction[];
    selectedAction?: string;
    onSelectedActionChange?: (action: string) => void;
}

export type SplitButtonAction = {
    id: string;
    label: string;
    handler: (...args: any[]) => void;
}

export const SplitButton = (props: SplitButtonProps) => {
    const {loading, selectedAction, actions, onSelectedActionChange, ...rest} = props;
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    
    const handleMenuItemClick = (action: SplitButtonAction) => {
        if (_isFunction(onSelectedActionChange)) {
            onSelectedActionChange(action.id);
        }
        setOpen(false);
        action.handler();
    };

    const handleSelectedActionClick = () => {
        const action = _find(actions, ["id", selectedAction]);

        action.handler();
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

    useEffect(() => {
        if (selectedAction) return;
        if (!actions) return;

        onSelectedActionChange(_get(_first(actions), "id"));
    }, [actions]);

    const getSelectedActionLabel = () => {
        const action = _find(actions, ["id", selectedAction]);

        return action?.label;
    };

    return (
        <>
            <ButtonGroup
                variant="contained"
                ref={anchorRef}
                {...rest}
            >
                <Button loading={loading} onClick={handleSelectedActionClick}>{getSelectedActionLabel()}</Button>
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
                                    {_map(actions, (action) => (
                                        <MenuItem
                                            key={action.id}
                                            selected={action.id === selectedAction}
                                            onClick={() => handleMenuItemClick(action)}
                                        >
                                            {action.label}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </>
    );
};

export default SplitButton;
