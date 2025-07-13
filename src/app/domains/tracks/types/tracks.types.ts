export enum ISRCMissingTracks {
    US7VG1846811 = 'US7VG1846811',
    US7QQ1846811 = 'US7QQ1846811',
    BRC310600002 = 'BRC310600002',
    BR1SP1200071 = 'BR1SP1200071',
    BR1SP1200070 = 'BR1SP1200070',
    BR1SP1500002 = 'BR1SP1500002',
    BXKZM1900338 = 'BXKZM1900338',
    BXKZM1900345 = 'BXKZM1900345',
    QZNJX2081700 = 'QZNJX2081700',
    QZNJX2078148 = 'QZNJX2078148',
}

export interface IMissingTrackCardProps {
    name: string | null;
    albumImage: string | null;
    hasTrack: boolean;
    artist: string | null;
    albumReleaseDate: string | null;
    isrc: string | null;
    duration: string | null;
    isAvailableInBrazil: boolean;
    spotifyUrl: string | null;
    previewUrl: string | null;
}
