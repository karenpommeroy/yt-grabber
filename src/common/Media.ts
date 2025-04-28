export enum MediaFormat {
    Audio = "audio",
    Video = "video",
};

export enum AudioType {
    Mp3 = "mp3",
    Wav = "wav",
    Flac = "flac",
    M4a = "m4a"
};

export enum VideoType {
    Mp4 = "mp4",
    Mkv = "mkv"
};

export type Format = {
    type?: MediaFormat;
    extension?: AudioType | VideoType;
    videoQuality?: string;
    audioQuality?: number;
}

export enum FormatScope {
    Global = "global",
    Tab =  "tab"
}

export enum InputMode {
    Auto = "auto",
    Artists = "artists",
    Albums = "albums",
    Songs = "songs",
};
