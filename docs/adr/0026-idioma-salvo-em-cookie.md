# 0026 — A escolha de idioma fica em um cookie, lida também pelo servidor

- **Status:** Aceito
- **Data:** 2026-10-24

## Contexto

O idioma tinha duas fontes que não conversavam: o servidor decidia só pelo `Accept-Language` e o navegador pela escolha
salva em `localStorage` e depois por `navigator.languages`. Quem tinha escolhido outro idioma via a página renderizada no
idioma do cabeçalho e, logo após a hidratação, ela trocava para o idioma escolhido (piscada, `<html lang>` errado no HTML
inicial e título da aba errado para quem não executa JavaScript). Uma revisão apontou a divergência.

## Decisão

- **A escolha explícita é guardada em um cookie** (`orp.language`, `Path=/`, `SameSite=Lax`, um ano, `Secure` em HTTPS), por
  `LanguageStorage`, que lê o cookie da página (`document.cookie`) no navegador e o cabeçalho `Cookie` do pedido
  (`REQUEST`) no servidor. O cookie guarda só o código do idioma, que é validado contra a lista de suportados; nada pessoal.
- **A ordem é a mesma nos dois lados**: cookie → preferência do navegador (`navigator.languages` no navegador,
  `Accept-Language` no servidor) → inglês (`I18n._candidates`). Dado o mesmo cookie e a mesma preferência, servidor e
  navegador escolhem o mesmo idioma (há teste disso).
- **`Vary: Accept-Language, Cookie`** nas páginas renderizadas, para nenhum cache compartilhar páginas entre idiomas.
- **O tema continua em `localStorage`**: o script do `index.html` precisa dele antes da primeira pintura e o servidor não o usa.
- O `localStorage` antigo de idioma (`orp.language`) deixa de ser lido: não há usuários a preservar e manter duas fontes
  recriaria a divergência.

## Alternativas consideradas

- **Idioma na URL** (`/pt`) — resolve o cache, mas muda rotas e links para uma página única e sem navegação.
- **Só `localStorage` + `Accept-Language`** (como estava) — é o que causava a troca após a hidratação.
- **Cookie `HttpOnly` setado pelo servidor** — o seletor é do cliente; um cookie escrito pelo JavaScript basta e evita um
  endpoint só para isso.

## Consequências

- Positivas: o HTML inicial já vem no idioma escolhido (`<html lang>`, texto e título), sem troca após a hidratação.
- Negativas / dívidas assumidas: o cookie vai em todo pedido ao site (poucos bytes); `Vary: Cookie` diminui o reaproveitamento de
  cache de HTML (já era reduzido por `Accept-Language`); um aviso de cookies não é necessário (é estritamente funcional, sem
  rastreio), mas vale lembrar se o site passar a ter outros cookies.
