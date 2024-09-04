export interface AllTrack {
    tracks: {
        items: TrackItem[];
    };
}
export interface TrackItem {
    name: string;
    artists: Artist[];
    album: Album;
    duration_ms: number;
    is_playable: boolean;
    external_urls: {
        spotify: string;
    };
    preview_url: string | null;
    available_markets: string[];
}
export interface Track {
    name: string;
    artists: { name: string }[];
    album: {
        images: { url: string }[];
        name: string;
        release_date: string;
    };
    duration_ms: number;
    is_playable: boolean;
    external_urls: {
        spotify: string;
    };
    preview_url: string | null;
    available_markets: string[];
}

export interface Album {
    images: images[];
    name: string;
    release_date: string;
}
export interface Artist {
    name: string;
}

export interface images {
    url: string;
}
