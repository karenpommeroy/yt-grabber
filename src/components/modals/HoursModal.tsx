import $_ from "lodash";
import {Moment} from "moment";
import React, {ChangeEvent, useCallback, useRef, useState} from "react";
import {useTranslation} from "react-i18next";

import {FormControl, FormControlLabel, Stack, Switch} from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

export type HoursModalValue = {
    day: Moment;
    hours: number;
    overtime?: boolean;
};

export interface IHoursModalProps {
    id: string;
    value?: HoursModalValue;
    open?: boolean;
    showOvertime?: boolean;
    onClose: (data?: HoursModalValue) => void;
}

export const HoursModal: React.FC<IHoursModalProps> = (props: IHoursModalProps) => {
    const {value, onClose, showOvertime, open = false, ...other} = props;
    const {t} = useTranslation();
    const [data, setData] = useState<HoursModalValue>(value);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleEntering = () => {
        if (inputRef.current != null) {
            inputRef.current.focus();
        }
    };

    const handleHoursChange = (ev: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setData((prev) => {
            return { ...prev, hours: $_.toNumber(ev.target.value) };
        });
    };

    const handleOvertimeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        // setData((prev) => {
        //     return { ...prev, overtime: e.target.checked };
        // });
        setData({ ...data, overtime: e.target.checked });
    }, [data, setData]);

    const handleCancel = () => {
        
        onClose();
    };

    const handleOk = () => {
        onClose(data);
    };

    React.useEffect(() => {
        if (open) {
            setData(value);
        }
    }, [value, open]);

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            maxWidth="xs"
            TransitionProps={{ onEntering: handleEntering }}
            {...other}
        >
            <DialogTitle>{t("hours")}</DialogTitle>
            <DialogContent>
                <DialogContentText>{t("specifyNumberOfWorkHours")}</DialogContentText>
                <Stack direction="column" >
                    <TextField
                        ref={inputRef}
                        autoFocus
                        margin="dense"
                        id="hours"
                        name="hours"
                        label={t("hours")}
                        type="number"
                        value={data?.hours ?? 0}
                        fullWidth
                        variant="outlined"
                        onChange={handleHoursChange}
                    />
                    {showOvertime && <FormControl fullWidth={true}>
                        <FormControlLabel
                            control={<Switch onChange={handleOvertimeChange} checked={data?.overtime} />}
                            label={t("countAsOvertime")}
                        />
                    </FormControl>}
                </Stack>
                {/* <NumberField
                    // ref={inputRef}
                    autoFocus
                    margin="dense"
                    id="overtime"
                    name="overtime"
                    label="Hours"
                    type="number"
                    value={data?.hours ?? 0}
                    fullWidth
                    variant="outlined"
                    onChange={handleChange}
                    precision={0}
                    min={0}
                    max={24}
                    step={1}
                /> */}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel}>{t("cancel")}</Button>
                <Button onClick={handleOk}>{t("ok")}</Button>
            </DialogActions>
        </Dialog>
    );
};
