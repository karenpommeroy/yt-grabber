import {ipcRenderer, IpcRendererEvent, shell} from "electron";
import {TFunction} from "i18next";
import $_ from "lodash";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";

import DescriptionIcon from "@mui/icons-material/Description";
import RequestPageIcon from "@mui/icons-material/RequestPage";
import {Alert, AlertTitle, IconButton, LinearProgress, Stack, Typography} from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import {ProgressInfo} from "../../common/Reporter";
import Styles from "./ProcessModal.styl";

export interface IProcessModalProps {
    id: string;
    open?: boolean;
    onClose?: (data?: any) => void;
}

export const ProcessModal: React.FC<IProcessModalProps> = (props: IProcessModalProps) => {
    const {onClose, ...other} = props;
    const {t} = useTranslation();
    const [progress, setProgress] = useState<ProgressInfo>();

    const onProgress = (event: IpcRendererEvent, data: ProgressInfo) => {
        setProgress(data);
    };

    const handleClose = () => {
        setProgress(undefined);
        if (onClose) {
            onClose();
        }
    };

    const handleCancel = () => {
        ipcRenderer.send("execute");
        if (onClose) {
            onClose();
        }
    };

    const handleOpenDocument = (file: string) => {
        if (!file) return;

        shell.openPath(file);
    };

    const resolveTitle = (t: TFunction) => {
        if (progress?.result?.invoice || progress?.result?.expense) {
            return t("yourDocumentsAreReady");
        }
        if (progress?.progress >= 100) {
            return t("finished");
        }

        return t("savingDataToAgresso");
    };

    const resolveText = () => {
        let result = "";

        if (progress?.task) {
            result += progress.task;
        }

        if (progress?.subtask) {
            result += `: ${progress.subtask}`;
        }

        return result;
    };

    useEffect(() => {
        ipcRenderer.on("progress", onProgress);

        return () => {
            ipcRenderer.off("progress", onProgress);
        };
    }, []);

    return (
        <Dialog
            open={!!progress}
            sx={{ "& .MuiDialog-paper": { width: "80%", maxHeight: 435 } }}
            maxWidth="sm"
            className={Styles.processModal}
            {...other}
        >
            <DialogTitle textAlign="center">{resolveTitle(t)}</DialogTitle>
            <DialogContent dividers className={Styles.content}>
                {$_.isEmpty(progress?.result) && (
                    <DialogContentText textAlign="center" paddingBottom={3}>
                        {resolveText()}
                    </DialogContentText>
                )}
                <Stack direction="row" spacing={2} justifyContent="center">
                    {!$_.isEmpty(progress?.result?.invoice) && (
                        <IconButton title="invoice" disableRipple className={Styles.invoiceIcon} color="info" onClick={() => (handleOpenDocument(progress.result.invoice))}>
                            <RequestPageIcon />
                            <Typography variant="caption">{t("invoice")}</Typography>
                        </IconButton>
                    )}
                    {!$_.isEmpty(progress?.result?.expense) && (
                        <IconButton title="expense" disableRipple className={Styles.expenseIcon} color="primary" onClick={() => (handleOpenDocument(progress.result.expense))}>
                            <DescriptionIcon />
                            <Typography variant="caption">{t("expense")}</Typography>
                        </IconButton>
                    )}
                </Stack>
                {$_.isEmpty(progress?.result) && (
                    <LinearProgress
                        className={Styles.progressBar}
                        color="primary"
                        variant="determinate"
                        value={progress?.progress ?? 0}
                    />
                )}
                {!$_.isEmpty(progress?.result?.errors) && (
                    $_.map(progress.result.errors, (error, id) =>
                        <Alert key={id} className={Styles.alert} severity="error" variant="outlined" >
                            <AlertTitle variant="subtitle1" className={Styles.title}>{error.title}</AlertTitle>
                            <Typography variant="subtitle2">{error.description}</Typography>
                        </Alert>
                    )
                )}
                {!$_.isEmpty(progress?.result?.warnings) && (
                    $_.map(progress.result.warnings, (warning, id) =>
                        <Alert key={id} className={Styles.alert} severity="warning" variant="outlined" >
                            <AlertTitle variant="subtitle1" className={Styles.title}>{warning.title}</AlertTitle>
                            <Typography variant="subtitle2">{warning.description}</Typography>
                        </Alert>
                    )
                )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center" }}>
                {progress && progress.progress < 100 && (
                    <Button variant="outlined" color="error" onClick={handleCancel}>
                        {t("cancel")}
                    </Button>
                )}
                {progress && progress.progress === 100 && (
                    <Button variant="contained" disableElevation color="success" onClick={handleClose}>
                        {t("close")}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};
