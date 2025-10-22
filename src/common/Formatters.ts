import {find, first, get, last, sumBy} from "lodash-es";

import {AlbumInfo, TrackInfo} from "./Youtube";

export const getAlbumInfo = (items: TrackInfo[], url?: string): AlbumInfo => {
    const item = first(items);

    return {
        id: item.playlist_id ?? item.id,
        artist: isPlaylistTrack(item) ? get(item, "uploader", get(item, "channel", get(item, "playlist_uploader"))) : get(item, "creators.0", get(item, "artist", item.channel)),
        title: isAlbumTrack(item) ? get(item, "album", get(item, "playlist_title", get(item, "playlist"))) : item.title,
        releaseYear: get(item, "release_year") ?? (new Date(item.timestamp * 1000)).getFullYear(),
        tracksNumber: get(item, "playlist_count", 1),
        duration: sumBy(items, "duration"),
        thumbnail: get(item, "thumbnail", get(find(item.thumbnails, ["id", "2"]) ?? last(item.thumbnails), "url")),
        url,
    };
};

export const isPlaylistTrack = (track: TrackInfo) => {
    const appOptions = global.store.get("application");

    return track.playlist_count > appOptions.playlistCountThreshold;
};

export const isAlbumTrack = (track: TrackInfo) => {
    return !!track.playlist;
};
