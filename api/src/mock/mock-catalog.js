/**
 * Catálogo do modo mock, com os metadados REAIS dos ISRCs do contrato (título, artistas,
 * álbum, data, duração e ID da faixa), capturados da Spotify Web API em 2026-10-23.
 * O formato imita o objeto `track` da API, para que o resto da API (serviço, regra do BR,
 * mapper) rode exatamente igual.
 *
 * Na captura, as 10 faixas existem, estão disponíveis no BR e vêm sem `preview_url`.
 * Para a tela e os testes cobrirem todos os estados, alguns são SIMULADOS, marcados
 * em `simulated` em cada entrada:
 *   - prévia de áudio (WAV gerado pela API) em parte das faixas
 *   - is_playable: false no mercado BR
 *   - ausente no mercado BR (só aparece na busca sem mercado)
 *   - ISRC não encontrado (QZNJX2078148 fica fora do catálogo)
 *   - data com precisão só de ano ou de mês
 * As capas também são geradas pela API, para o modo mock não depender de rede.
 */
const entry = (isrc, data) => ({ isrc, simulated: [], ...data });

export const MOCK_CATALOG = [
  entry('NO1R42509310', { spotifyId: '7qaLSS4e5luH7meEYGu7NM', title: 'IRON MAIDEN', artists: ['Carefree', 'Redmenn'], album: 'IRON MAIDEN', releaseDate: '2025-11-28', durationMs: 215491, inBrazil: 'absent', preview: true, simulated: ['ausente no BR', 'prévia'] }),
  entry('NO1R42511410', { spotifyId: '0P3DznoqrsGWw3gOTNFj1j', title: 'Run It Back (Iron Maiden)', artists: ['A-Booty', "Prodde G's", 'Redmenn'], album: 'Run It Back (Iron Maiden)', releaseDate: '2025-12-05', durationMs: 135111, inBrazil: 'available' }),
  entry('BRC310600002', { spotifyId: '4lwE7ainG51zmxt1xAC7XQ', title: 'Repente', artists: ['PianOrquestra'], album: 'Dez Mãos e um Piano Preparado', releaseDate: '2013', precision: 'year', durationMs: 170733, inBrazil: 'available', preview: true, simulated: ['precisão de ano', 'prévia'] }),
  entry('BR1SP1200071', { spotifyId: '4s71Bub5KzXBSMyE8nlH4E', title: 'É pra Você', artists: ['Gó Gó Boys'], album: 'É pra Você', releaseDate: '2014-03-25', durationMs: 177626, inBrazil: 'available' }),
  entry('BR1SP1200070', { spotifyId: '0kkVPWVKs4MCMbQOOxM6nh', title: 'Quem Diria', artists: ['Gó Gó Boys'], album: 'Gó Gó Boys', releaseDate: '2014-05-12', durationMs: 202893, inBrazil: 'available', preview: true, simulated: ['prévia'] }),
  entry('BR1SP1500002', { spotifyId: '7u8QESpplZWyZZDsoHeIAX', title: 'Quase Nua', artists: ['Clarisse Grova'], album: 'Premonições', releaseDate: '2015-08-27', durationMs: 253320, inBrazil: 'not-playable', simulated: ['is_playable: false'] }),
  entry('BXKZM1900338', { spotifyId: '4oxx2IYjbvf1a6PGcmzf3O', title: 'Sexta Sua Linda', artists: ['DJ Maskot', 'MC Madan'], album: 'Sexta Sua Linda', releaseDate: '2019-09-27', durationMs: 213397, inBrazil: 'available', preview: true, simulated: ['prévia'] }),
  entry('BXKZM1900345', { spotifyId: '5w4O21KEy5RBVCiecgmSMo', title: 'Louca', artists: ['DJ Malibu', 'MC Pack', 'MC Gui Andrade'], album: 'Louca', releaseDate: '2019-10-05', durationMs: 124315, inBrazil: 'available' }),
  entry('QZNJX2081700', { spotifyId: '2Sg8a9mtv5v6mGEuscIdFx', title: 'Нам не нравится', artists: ['Капитан Коркин'], album: 'Нам не нравится', releaseDate: '2020-12', precision: 'month', durationMs: 229334, inBrazil: 'absent', simulated: ['ausente no BR', 'precisão de mês'] }),
  // QZNJX2078148 ("Доверюсь солнцу", Надя Точилкина) existe no Spotify; fica fora para simular "não encontrado".
];
