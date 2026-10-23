export const BRAZIL = 'BR';

/**
 * Regra de negócio (função pura): uma faixa encontrada com `market=BR` está disponível
 * no Brasil, a menos que o Spotify diga explicitamente `is_playable: false`.
 * Uma faixa que só aparece sem mercado não está disponível no Brasil.
 */
export function isAvailableInBrazil(trackFoundInBrazil) {
  return Boolean(trackFoundInBrazil) && trackFoundInBrazil.is_playable !== false;
}
