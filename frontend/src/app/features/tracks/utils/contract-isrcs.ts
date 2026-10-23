import { Isrc } from '../models/isrc.value-object';

/**
 * ISRCs informados pelo produtor no fechamento do contrato.
 * Validados ao carregar o módulo: um código inválido falha cedo, não numa requisição.
 */
export const CONTRACT_ISRCS: readonly Isrc[] = [
  'NO1R42509310',
  'NO1R42511410',
  'BRC310600002',
  'BR1SP1200071',
  'BR1SP1200070',
  'BR1SP1500002',
  'BXKZM1900338',
  'BXKZM1900345',
  'QZNJX2081700',
  'QZNJX2078148',
].map(Isrc.create);
