import {MediaFormat} from "./Media";

export type YoutubeInfoResult = {
    url: string,
    value?: TrackInfo[];
    errors?: string[],
    warnings?: string[],
};

export type TrackInfo = {
    album: string;
    artist: string;
    channel: string;
    creators: string[];
    duration: number;
    id: string;
    uploader: string;
    chapters?: Array<{
        title: string;
        start_time: number;
        end_time: number;
    }>;
    original_url: string;
    playlist: string;
    playlist_title: string;
    playlist_id: string;
    playlist_autonumber: number;
    playlist_count: number;
    playlist_uploader: string;
    playlist_uploader_id: string;
    playlist_channel: string;
    playlist_channel_id: string;
    release_year: number;
    title: string;
    thumbnail: string;
    formats: FormatInfo[];
    timestamp: number;
    filesize_approx: number;
    thumbnails: Thumbnail[];
};

export type AlbumInfo = {
    id: string;
    artist?: string;
    title?: string;
    releaseYear?: number;
    tracksNumber: number;
    duration: number;
    thumbnail?: string;
    url?: string;
};

export type PlaylistInfo = {
    url: string;
    album: AlbumInfo;
    tracks: TrackInfo[];
};

export type Thumbnail = {
    width?: number;
    height?: number;
    url: string;
    id: string;
};

export type TrackStatusInfo = {
    trackId: string;
    percent: number;
    totalSize: number;
    completed?: boolean;
    skipped?: boolean;
    status?: string;
    error?: boolean;
    path?: string;
}

export type FormatInfo = {
    ext: string;
    acodec: string;
    vcodec: string;
    audio_ext: string;
    video_ext: string;
    format_id: string;
    format_note: string;
    filesize: number;
    fps: number;
    quality: number;
    has_drm: boolean;
    width: number;
    height: number;
    resolution: string;
    protocol: string;
};

export type Format = {
    type: MediaFormat;
    name: string;
    extension: string;
    protocol: string;
    id: string;
    width: number;
    height: number;
};

export type TrackCut = {
    from: number;
    to: number;
};

export type Release = {
    title: string;
    artist: string;
    releaseYear: number;
};

export enum UrlType {
    Artist = "artist",
    Playlist = "playlist",
    Track = "track",
    Other = "other",
};

export type YoutubeArtist = {
    name: string;
    thumbnail: string;
    url: string;
};
