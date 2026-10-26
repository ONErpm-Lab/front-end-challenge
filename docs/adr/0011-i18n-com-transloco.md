# 0011 — Internacionalização com Transloco, em seis idiomas, também no servidor

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

A página deve estar disponível em **inglês, português, espanhol, russo, francês e turco**. O usuário precisa trocar de
idioma sem recarregar, a escolha deve ser lembrada, e a página é renderizada no servidor (SSR): sem cuidado, o HTML
chegaria em inglês e "piscaria" para o idioma do visitante.

## Decisão

- **Transloco** (`@jsverse/transloco`) com **troca em tempo de execução**. `@angular/localize` exige um build por idioma
  (seis bundles e seis deploys) e não troca sem recarregar.
- **Arquivos por idioma** em `src/app/core/i18n/translations/{en,pt,es,ru,fr,tr}.json`, carregados como **chunks
  preguiçosos** (`import()`), não por HTTP: sem requisição extra, funcionam no servidor sem URL absoluta, só o idioma em
  uso é baixado (~1 KB cada) e o build quebra se um arquivo sumir.
- **Qual idioma usar** (`detectLanguage`), em ordem: escolha salva (`localStorage`) → `navigator.languages` → inglês.
  Variantes regionais casam pelo idioma primário (`pt-PT`→`pt`, `ru-RU`→`ru`). No **servidor**, vale o cabeçalho
  `Accept-Language` da requisição, respeitando pesos `q` (e descartando `q=0`, `*` e valores fora da gramática HTTP: 0 a 1, no máximo três casas
  decimais — `q=2`, `q=1.5` ou `q=0.1234` invalidam a entrada).
- **SSR por requisição** (`RenderMode.Server`, antes `Prerender`): o HTML já sai no idioma do visitante e
  `<html lang>` correto, sem _flash_. O servidor responde `Vary: Accept-Language` para que caches não misturem idiomas.
  Se a escolha salva do visitante diferir do HTML do servidor, o cliente apenas atualiza os textos na hidratação.
- **`<html lang>`** acompanha o idioma, com a região onde importa (`pt` → `pt-BR`); o mesmo _locale_ alimenta `Intl`.
- **Datas** com `Intl.DateTimeFormat` no _locale_ do idioma, em **UTC** (senão `2013-06-13` apareceria como dia 12 nas
  Américas) e mostrando só o que o Spotify informa: `2014`, `maio de 2014` ou `12 de maio de 2014`.
- **Inicialização** (`provideAppInitializer` → `I18n.init()`) carrega o idioma **antes da primeira renderização** e
  **nunca rejeita**: se o chunk do idioma falhar, usa inglês; se tudo falhar, a página ainda renderiza (com as chaves).
  `setLanguage()` mantém o idioma atual e não salva nada se o novo não carregar.
- **Só a última seleção vale**: os chunks terminam em qualquer ordem, então cada pedido recebe um número e só o mais
  recente pode ativar o idioma, atualizar `<html lang>` e gravar a preferência; um pedido antigo que termina depois (ou
  falha depois) é descartado em silêncio. Vale também para a inicialização: o idioma que o visitante escolhe durante o
  carregamento inicial prevalece sobre o detectado.
- **Chaves aninhadas** (`app.*`, `tracks.*`, `status.*`) e **sem plural dependente de idioma**: textos como
  "ISRCs afetados: {{count}}" evitam as quatro formas de plural do russo sem trazer ICU. Nomes de idiomas aparecem
  **no próprio idioma** (Русский, Türkçe), para quem não lê o atual achar o seu.
- **Paridade garantida por teste**: os seis arquivos têm exatamente as mesmas chaves, nenhum valor vazio, os mesmos
  _placeholders_ e nenhum é cópia do inglês.

## Alternativas consideradas

- **`@angular/localize`** — melhor desempenho por idioma, mas um build por idioma e sem troca dinâmica.
- **ngx-translate** — semelhante, porém com menos manutenção e sem _signals_ nativos.
- **JSON via HTTP (`/assets/i18n`)** — uma requisição a mais por idioma e URL absoluta no SSR.
- **Prerender com inglês fixo** — o visitante veria inglês e depois o seu idioma.
- **ICU/MessageFormat** — resolveria plurais, mas é dependência extra para um texto só.

## Consequências

- Positivas: HTML correto desde a primeira resposta; troca instantânea; chaves e _placeholders_ sob teste.
- Negativas: cada requisição é renderizada no servidor (vs. HTML pré-gerado); novas chaves exigem os seis arquivos
  (o teste de paridade avisa); `Vary: Accept-Language` reduz o reaproveitamento de cache em CDN.
- **Atenção na implantação:** desde o Angular 20 o SSR só aceita hosts autorizados. Sem `NG_ALLOWED_HOSTS`
  (ex.: `NG_ALLOWED_HOSTS=meu-dominio.com`) o servidor cai para renderização no cliente e o `lang` volta a `en` —
  foi o que o teste local mostrou com `localhost`. O PR de deploy deve configurar essa variável.

## Atualização (24/10/2026): textos no template, pelo pipe

Os componentes liam cada texto com `translateSignal`, um campo por _string_ (a página de faixas chegou a 27), e o diálogo de
ISRCs lia `I18n.locale()` só para o `computed` depender da língua. Os textos agora entram pelo **pipe `transloco` no
template** (`'chave' | transloco: { parâmetro }`), que já reage à troca de idioma e aceita parâmetros: sem campo por texto e
sem esse truque. Só ficam em TypeScript os textos que o código precisa escrever no DOM (o título do iframe do player). O ADR
não muda de decisão (Transloco, seis idiomas, mesmos arquivos); muda como o componente os consome.

## Atualização (24/10/2026): a escolha salva passa a ser um cookie

A escolha de idioma deixou de ficar em `localStorage` e passou a um cookie que o servidor também lê, para que o HTML
inicial já saia no idioma escolhido e não haja troca após a hidratação ([ADR 0026](0026-idioma-salvo-em-cookie.md)). O resto
deste ADR (Transloco, seis idiomas, arquivos lazy) segue valendo.
