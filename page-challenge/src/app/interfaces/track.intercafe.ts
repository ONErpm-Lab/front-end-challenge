export interface AllTrack {
    tracks: {
        items: Track[];
    };
}
export interface Track {
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

export interface AllTrackProps {
    tracks: {
        href: string;
        items: Track[];
        limit: number;
        next: string | null;
        offset: number;
        previous: string | null;
        total: number;
    };
}
