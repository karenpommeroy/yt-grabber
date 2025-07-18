import _find from "lodash/find";
import _first from "lodash/first";
import _get from "lodash/get";
import _last from "lodash/last";
import _sumBy from "lodash/sumBy";

import {AlbumInfo, TrackInfo} from "./Youtube";

export const getAlbumInfo = (items: TrackInfo[], url?: string): AlbumInfo => {
    const item = _first(items);

    return {
        id: item.playlist_id ?? item.id,
        artist: isPlaylistTrack(item) ? _get(item, "uploader", _get(item, "channel", _get(item, "playlist_uploader"))) : _get(item, "creators.0", _get(item, "artist", item.channel)),
        title: isAlbumTrack(item) ? _get(item, "album", _get(item, "playlist_title", _get(item, "playlist"))) : item.title,
        releaseYear: _get(item, "release_year") ?? (new Date(item.timestamp * 1000)).getFullYear(),
        tracksNumber: _get(item, "playlist_count", 1),
        duration: _sumBy(items, "duration"),
        thumbnail: _get(item, "thumbnail", _get(_find(item.thumbnails, ["id", "2"]) ?? _last(item.thumbnails), "url")),
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
