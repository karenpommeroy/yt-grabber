import _constant from "lodash/constant";
import _isEmpty from "lodash/isEmpty";
import _keys from "lodash/keys";
import _map from "lodash/map";
import _pickBy from "lodash/pickBy";
import _size from "lodash/size";
import _times from "lodash/times";
import _zipObject from "lodash/zipObject";
import React, {useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";

import {Stack, TextField} from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import Styles from "./MissingDetailsModal.styl";

export type MissingDetailsModalProps = {
    id: string;
    missingDetails?: string[];
    open?: boolean;
    onClose?: (data: Record<string, string | number>) => void;
};

export const MissingDetailsModal: React.FC<MissingDetailsModalProps> = (props: MissingDetailsModalProps) => {
    const {onClose, missingDetails, open, ...other} = props;
    const {t} = useTranslation();
    const [value, setValue] = useState<Record<string, string | number>>();
    const [isOpen, setIsOpen] = useState(open);

    const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const key = event.target.dataset.key;

        setValue((prev) => ({...prev, [key]: event.target.value}));
    };

    const handleClose = () => {
        if (onClose) {
            onClose(value);
        }
        setIsOpen(false);
    };

    const shouldDisableOk = useMemo(() => {
        return !_isEmpty(_keys(_pickBy(value, _isEmpty)));
    }, [value]);

    useEffect(() => {
        setValue(_zipObject(missingDetails, _times(_size(missingDetails), _constant(undefined))));
    }, [missingDetails]);

    useEffect(() => {
        setIsOpen(open);
    }, [open]);

    return (
        <Dialog
            open={isOpen}
            disablePortal
            disableEscapeKeyDown
            fullWidth
            maxWidth="md"
            className={Styles.missingDetailsModal}
            {...other}
        >
            <DialogTitle textAlign="center">{t("missingDetailsModalTitle")}</DialogTitle>
            <DialogContent dividers className={Styles.content}>
                <DialogContentText textAlign="center" paddingBottom={3}>
                    {t("missingDetailsModalText")}
                </DialogContentText>
                <Stack direction="column" spacing={2}>
                    {_map(missingDetails, (item) =>
                        <TextField
                            key={item}
                            value={value[item]}
                            fullWidth
                            variant="outlined"
                            label={t(item)}
                            onChange={onValueChange}
                            slotProps={{
                                htmlInput: {
                                    "data-key": item,
                                }
                            }}
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{justifyContent: "center"}}>
                <Button variant="contained" disableElevation color="secondary" onClick={handleClose} disabled={shouldDisableOk}>
                    {t("ok")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MissingDetailsModal;
