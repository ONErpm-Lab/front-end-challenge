import type { Isrc } from './isrc.value-object';

export type ReleaseDatePrecision = 'year' | 'month' | 'day';

/** Contrato devolvido pela API (BFF) para cada ISRC. */
export interface Track {
  readonly isrc: string;
  /** ID da faixa no Spotify; permite o player incorporado quando não há `previewUrl`. */
  readonly spotifyId: string | null;
  readonly title: string;
  readonly artists: readonly string[];
  readonly albumName: string;
  readonly albumImageUrl: string | null;
  readonly thumbnailUrl: string | null;
  readonly releaseDate: string | null;
  readonly releaseDatePrecision: ReleaseDatePrecision;
  readonly durationMs: number;
  readonly previewUrl: string | null;
  readonly spotifyUrl: string | null;
  readonly availableInBrazil: boolean;
}

export type SortDirection = 'asc' | 'desc';

/** De onde a API tirou os dados: Spotify real ou catálogo de demonstração (modo mock). */
export type DataSource = 'spotify' | 'mock';

export interface TracksResult {
  readonly tracks: readonly Track[];
  /** ISRCs que o Spotify não reconhece (404). */
  readonly notFound: readonly Isrc[];
  /** ISRCs cuja consulta falhou (integração instável); os demais foram carregados. */
  readonly failed: readonly Isrc[];
  /** `null` quando nenhuma requisição foi feita (lista de ISRCs vazia). */
  readonly source: DataSource | null;
}
