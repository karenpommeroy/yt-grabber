import {MediaFormat} from "../enums/MediaFormat";

export type TrackInfo = {
    album: string;
    artist: string;
    channel: string;
    creators: string[];
    duration: number;
    id: string;
    original_url: string;
    playlist: string;
    playlist_autonumber: number;
    playlist_count: number;
    release_year: number;
    title: string;
    thumbnail: string;
    formats: FormatInfo[];
    timestamp: number;
    filesize_approx: number;
    thumbnails: Thumbnail[];
};

export type AlbumInfo = {
    artist: string;
    title: string;
    releaseYear: number;
    tracksNumber: number;
    duration: number;
    thumbnail: string;
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
    status?: string;
    error?: boolean;
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
    from: string;
    to: string;
};
