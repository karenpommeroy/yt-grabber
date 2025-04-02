import _map from "lodash/map";
import React, {useState} from "react";
import {useTranslation} from "react-i18next";

import {Stack, TextField} from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import Styles from "./DetailsModal.styl";

export type Details = {
    [key: string]: string | number;
}

export type DetailsModalProps = {
    id: string;
    details?: Details;
    open?: boolean;
    onClose?: (data: Details) => void;
};

export const DetailsModal: React.FC<DetailsModalProps> = (props: DetailsModalProps) => {
    const {onClose, details, open, ...other} = props;
    const {t} = useTranslation();
    const [value, setValue] = useState<Details>(details);

    const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const key = event.target.dataset.key;

        setValue((prev) => ({...prev, [key]: event.target.value}));
    };

    const handleClose = () => {
        if (onClose) {
            onClose(value);
        }
    };

    // useEffect(() => {
    //     setValue(details);
    // }, [details]);

    return (
        <Dialog
            open={open}
            disablePortal
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            className={Styles.detailsModal}
            {...other}
        >
            <DialogTitle textAlign="center">{t("detailsModalTitle")}</DialogTitle>
            <DialogContent dividers className={Styles.content}>
                <Stack direction="column" spacing={2}>
                    {_map(value, (v, k) =>
                        <TextField
                            key={k}
                            value={v ?? ""}
                            fullWidth
                            variant="outlined"
                            label={t(k)}
                            onChange={onValueChange}
                            slotProps={{
                                htmlInput: {
                                    "data-key": k,
                                }
                            }}
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{justifyContent: "center"}}>
                <Button variant="contained" disableElevation color="secondary" onClick={handleClose}>
                    {t("ok")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DetailsModal;
