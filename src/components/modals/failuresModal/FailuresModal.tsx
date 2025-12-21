import {filter, size} from "lodash-es";
import {useEffect, useState} from "react";
import {Trans, useTranslation} from "react-i18next";

import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from "@mui/material";

import {useDataState} from "../../../react/contexts/DataContext";
import Styles from "./FailuresModal.styl";

export type FailuresModalProps = {
    id: string;
    title?: string;
    open?: boolean;
    onCancel?: () => void;
    onConfirm?: () => void;
};

export const FailuresModal = (props: FailuresModalProps) => {
    const {open, onCancel, onConfirm, ...rest} = props;
    const {trackStatus} = useDataState();
    const [failuresCount, setFailuresCount] = useState(0);
    const { t } = useTranslation();

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
    };

    useEffect(() => {
        setFailuresCount(size(filter(trackStatus, "error")));
    }, [trackStatus]);

    return (
        <Dialog
            maxWidth="xs"
            fullWidth
            open={open}
            disableEscapeKeyDown={false}
            onClose={onCancel}
            className={Styles.failuresModal}
            data-testid="failures-modal"
            {...rest}
        >
            <DialogTitle textAlign="center">{t("failuresEncountered")}</DialogTitle>
            <DialogContent className={Styles.content}>
                <Typography>
                    <Trans
                        i18nKey="failuresEncounteredDoYouWishToRetry"
                        values={{count: failuresCount}}
                        components={{b: <b />, br: <br />}}
                    />
                </Typography>
            </DialogContent>
            <DialogActions className={Styles.modalActions}>
                <Button color="primary" variant="outlined" autoFocus={false} onClick={handleCancel}>
                    {t("cancel")}
                </Button>
                <Button color="secondary" variant="contained" disableFocusRipple autoFocus={true} onClick={handleConfirm}>
                    {t("retry")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FailuresModal;
