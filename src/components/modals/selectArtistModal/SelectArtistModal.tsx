import {ipcRenderer} from "electron";
import {map, toInteger} from "lodash-es";
import React from "react";
import {useTranslation} from "react-i18next";

import YouTubeIcon from "@mui/icons-material/YouTube";
import {
    Avatar, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, List, ListItem,
    ListItemText, Typography
} from "@mui/material";

import {YoutubeArtist} from "../../../common/Youtube";
import {Messages} from "../../../messaging/Messages";
import Styles from "./SelectArtistModal.styl";

export type SelectArtistModalProps = {
    id: string;
    artists?: YoutubeArtist[];
    open?: boolean;
    onClose?: (artist?: YoutubeArtist) => void;
};

export const SelectArtistModal = (props: SelectArtistModalProps) => {
    const {artists, open, onClose, ...rest} = props;
    const {t} = useTranslation();

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const onArtistClick = (event: React.MouseEvent<HTMLLIElement>) => {
        const index = toInteger(event.currentTarget.dataset.id);
        
        if (onClose) {
            onClose(artists[index]);
        }
    };

    function onOpenArtistInBrowser(event: React.MouseEvent<HTMLButtonElement>) {
        const index = toInteger(event.currentTarget.dataset.id);
        const artist = artists[index];

        ipcRenderer.send(Messages.OpenUrlInBrowser, {url: artist.url});
        event.stopPropagation();
    };

    return (
        <Dialog
            maxWidth="sm"
            fullWidth
            open={open}
            disableEscapeKeyDown={false}
            onClose={handleClose}
            className={Styles.selectArtistModal}
            {...rest}
        >
            <DialogTitle textAlign="center">{t("selectArtist")}</DialogTitle>
            <DialogContent className={Styles.content}>
                <Typography textAlign="center" variant="body1">{t("multipleMatchingArtistsFound")}:</Typography>
                <List className={Styles.artistList}>
                    {map(artists, (item, index) => 
                        <ListItem
                            key={index}
                            data-id={index}
                            onClick={onArtistClick}
                            // disableGutters
                            divider
                            className={Styles.artist}
                            secondaryAction={
                                <Button className={Styles.artistAction} size="small" color="secondary" disableElevation variant="contained" data-id={index} onClick={onOpenArtistInBrowser}>
                                    <YouTubeIcon />
                                </Button>
                            }
                        >
                            <Grid container flexGrow={1}>
                                <Grid size={1} className={Styles.imageColumn}>
                                    <Avatar className={Styles.image} src={item.thumbnail} />
                                </Grid>
                                <Grid size={4}>
                                    <ListItemText primary={item.name}/>
                                </Grid>
                            </Grid>
                        </ListItem>
                    )}
                </List>
            </DialogContent>
            <DialogActions className={Styles.modalActions}>
                <Button color="secondary" variant="contained" autoFocus={false} onClick={handleClose}>
                    {t("cancel")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SelectArtistModal;
