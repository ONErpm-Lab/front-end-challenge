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
