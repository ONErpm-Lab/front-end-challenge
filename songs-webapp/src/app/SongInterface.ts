export interface SongInterface {
    id: string,
    name: string,
    artists: Array<ArtistInterface>,
    image: string,
    releaseDate: string,
    durationMinutesSeconds: string,
    spotifyLink: string,
    avaiableBr: boolean,
    snippet: string
}

interface ArtistInterface{
    id: string,
    name: string
}