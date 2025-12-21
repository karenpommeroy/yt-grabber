import {filter, isEmpty, last, map, some, uniqueId} from "lodash-es";
import React, {KeyboardEvent, useState} from "react";
import {useTranslation} from "react-i18next";
import {NumberFormatBase} from "react-number-format";

import AddIcon from "@mui/icons-material/Add";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import {
    Avatar, Grid, IconButton, List, ListItem, ListItemAvatar, ListItemText, Stack, TextField,
    useTheme
} from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import {formatTime, timeStringToNumber, unformatTime} from "../../../common/Helpers";
import Styles from "./CutModal.styl";

export type TrackCut = {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
};

export type CutModalProps = {
    id: string;
    duration: number;
    open?: boolean;
    onClose?: (data: TrackCut[]) => void;
    onCancel?: () => void;
};

export const CutModal: React.FC<CutModalProps> = (props: CutModalProps) => {
    const {onClose, onCancel, duration, open, ...other} = props;
    const {t} = useTranslation();
    const theme = useTheme();
    const [entries, setEntries] = useState<TrackCut[]>([
        {
            id: uniqueId(),
            title: "",
            startTime: 0,
            endTime: duration,
        }
    ]);

    const onCutStartTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const id = event.target.dataset.id;
        
        setEntries((prev) => map(prev, (entry) => {
            if (entry.id === id) {
                return {...entry, startTime: timeStringToNumber(event.target.value)};
            }

            return entry;
        }));
    };

    const onCutEndTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const id = event.target.dataset.id;
        
        setEntries((prev) => map(prev, (entry) => {
            if (entry.id === id) {
                return {...entry, endTime: timeStringToNumber(event.target.value)};
            }

            return entry;
        }));
    };

    const onAddClick = () => {
        setEntries((prev) => {
            const lastEntry = last(prev);
            const updated = [...prev, {
                id: uniqueId(),
                title: "",
                startTime: lastEntry ? lastEntry.endTime + 1 : 0,
                endTime: duration,
            }];

            return updated;
        });
    };

    const onTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const id = event.target.dataset.id;
        
        setEntries((prev) => map(prev, (entry) => {
            if (entry.id === id) {
                return {...entry, title: event.target.value};
            }

            return entry;
        }));
    };

    const onDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        const id = event.currentTarget.dataset.id;

        setEntries((prev) => filter(prev, (entry) => entry.id !== id));
    };

    const handleClose = () => {
        if (onClose) {
            onClose(entries);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            handleClose();
        }
        if (e.key === "Escape") {
            handleCancel();
        }
    };

    return (
        <Dialog
            open={open}
            disablePortal
            onClose={handleCancel}
            fullWidth
            maxWidth="md"
            className={Styles.cutModal}
            onKeyUp={handleKeyUp}
            disableEscapeKeyDown
            data-testid="cut-modal"
            {...other}
        >
            <DialogTitle textAlign="center">{t("cutModalTitle")}</DialogTitle>
            <DialogContent dividers className={Styles.content}>
                <Grid container display="flex" justifyItems="flex-end">
                    <Grid size={12}>
                        <List>
                            {map(entries, (entry, index) => <ListItem sx={{paddingX: 0}} divider key={entry.id}>
                                <ListItemAvatar><Avatar variant="circular" sx={{bgcolor: theme.palette.text.secondary}}>{index + 1}</Avatar></ListItemAvatar>
                                <ListItemText disableTypography>
                                    <Stack direction="row" spacing={2} className={Styles.entryContent}>
                                        <NumberFormatBase
                                            slotProps={{
                                                htmlInput: {"data-id": entry.id}
                                            }}
                                            value={entry.startTime}
                                            onChange={onCutStartTimeChange}
                                            format={formatTime}
                                            removeFormatting={unformatTime}
                                            customInput={TextField}
                                            variant="outlined"
                                            label={t("from")}
                                        />
                                        <NumberFormatBase
                                            slotProps={{
                                                htmlInput: {"data-id": entry.id}
                                            }}
                                            value={entry.endTime}
                                            onChange={onCutEndTimeChange}
                                            format={formatTime}
                                            removeFormatting={unformatTime}
                                            customInput={TextField}
                                            variant="outlined"
                                            label={t("to")}
                                        />
                                        <TextField
                                            data-id={entry.id}
                                            value={entry.title}
                                            fullWidth
                                            variant="outlined"
                                            label={t("title")}
                                            onChange={onTitleChange}
                                            slotProps={{
                                                htmlInput: {"data-id": entry.id}
                                            }}
                                        />
                                        <IconButton className={Styles.deleteButton} data-id={entry.id} color="inherit" onClick={onDeleteClick}>
                                            <DeleteForeverIcon />
                                        </IconButton>
                                    </Stack>
                                </ListItemText>
                            </ListItem>)}
                        </List>
                    </Grid>
                    <Grid size={12} display="flex" justifyContent="center" alignItems="stretch">
                        <Button startIcon={<AddIcon />} className={Styles.addButton} variant="contained" disableElevation color="secondary" onClick={onAddClick}>{t("add")}</Button>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{justifyContent: "end"}}>
                <Button data-testid="close-button" disabled={some(entries, (entry) => isEmpty(entry.title))} variant="contained" disableElevation autoFocus color="secondary" onClick={handleClose}>
                    {t("ok")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CutModal;
