import React from "react";
import {useTranslation} from "react-i18next";

import {Box, Button, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";

import Styles from "./ImageModal.styl";

export type ImageModalProps = {
    id: string;
    title?: string;
    imageUrl?: string;
    open?: boolean;
    onClose?: () => void;
};

export const ImageModal = (props: ImageModalProps) => {
    const { title, imageUrl, open, onClose, ...rest} = props;
    const { t } = useTranslation();

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    return (
        <Dialog
            maxWidth="md"
            fullWidth
            open={open}
            disableEscapeKeyDown={false}
            onClose={handleClose}
            className={Styles.imageModal}
            {...rest}
        >
            <DialogTitle textAlign="center">{title}</DialogTitle>
            <DialogContent className={Styles.content}>
                {imageUrl && (
                    <Box
                        component="img"
                        sx={{
                            width: "100%",
                            height: "100%",
                            padding: ".8em",
                            display: "flex",
                            justifyContent: "center",
                            bgcolor: "transparent"
                        }}
                        src={imageUrl}
                        title={title}
                        alt={title}
                        // bgColor="transparent"
                        // fit="contain"
                        // duration={100}
                        // errorIcon={<BrokenImageIcon className={Styles.imagePlaceholder} color="primary" />}
                        // showLoading={<CircularProgress />}
                        className={Styles.image}
                    />
                )}
            </DialogContent>
            <DialogActions className={Styles.modalActions}>
                <Button color="secondary" variant="contained" autoFocus={true} onClick={handleClose}>
                    {t("close")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ImageModal;
