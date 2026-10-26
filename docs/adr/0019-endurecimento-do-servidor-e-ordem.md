# 0019 — Cabeçalhos de segurança, compressão e ordem A–Z/Z–A

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

Uma comparação com outra entrega do mesmo desafio mostrou ganhos baratos que faltavam aqui: o servidor ainda anunciava
`X-Powered-By: Express`, não mandava cabeçalhos de segurança, não comprimia nada (o HTML renderizado tem ~95 KB e o JavaScript
principal passa de 300 KB sem compressão), e a página não oferecia inverter a ordem.

## Decisão

### Servidor (`src/server.ts`)

- **`X-Powered-By` desligado** (`app.disable`): não há motivo para dizer qual _framework_ responde.
- **Cabeçalhos de segurança** (`securityHeaders`, em `src/bff/http`, testado): `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` negando câmera,
  microfone, geolocalização, pagamento e USB (a página não usa), `Cross-Origin-Opener-Policy: same-origin` e uma
  `Content-Security-Policy` **parcial**: `base-uri 'self'`, `object-src 'none'`, `form-action 'self'` e
  `frame-ancestors 'self'`. **HSTS** (180 dias, sem `includeSubDomains`, para não obrigar HTTPS em subdomínios que sirvam outras
  coisas) só quando a requisição veio por HTTPS (direta ou por `X-Forwarded-Proto` de um _proxy_), para não travar um
  ambiente local em HTTP.
- **Por que a CSP não restringe `script-src`/`default-src`:** a página precisa de _scripts_ em linha (estado da hidratação,
  repetição de eventos e o _script_ que aplica o tema antes da pintura) e do _script_ e do _iframe_ do Spotify. Restringir
  exigiria _nonces_ gerados por requisição e passados à renderização; é um passo à parte (e a CSP parcial já fecha o que
  não custa nada). Fica registrado como próximo passo possível.
- **Compressão** com o pacote `compression` (gzip/Brotli, conforme o navegador aceita; `Vary: Accept-Encoding`), antes dos
  arquivos estáticos e da renderização. Atrás de uma CDN ela já costuma comprimir, mas a imagem do contêiner não deve depender
  disso. É uma dependência nova, pedida e sem vulnerabilidades conhecidas (`npm audit` limpo).

### Interface

- **Inverter a ordem**: botão "Título A–Z" / "Título Z–A" na barra de ferramentas. Só os títulos das **faixas** mudam de
  direção (mesma colação: sem acentos, maiúsculas nem pontuação); os ISRCs sem faixa continuam depois delas, na mesma ordem. O
  estado fica no `TracksStore` (a escolha sobrevive a "tentar novamente") e **não é guardado**: o enunciado pede que nada seja
  persistido. O botão se chama pelo que mostra (a ordem atual), tem dica "Inverter a ordem" e uma nota para leitores de tela
  ("Ordenado por título, de Z a A") quando muda. O padrão continua A–Z, como o enunciado pede.
- **Resumo**: "Faixas no Spotify: 8" (conta só as faixas que o Spotify tem; os ISRCs sem faixa já têm o próprio botão com a
  contagem). Uma primeira versão dizia "8 de 10 ISRCs encontrados · 8 disponíveis no Brasil": "encontrados" não dizia onde, e a
  disponibilidade no Brasil já aparece em cada cartão, então foi retirada.

## Alternativas consideradas

- **`helmet`**: traz a mesma coisa com uma dependência a mais e uma CSP padrão que quebraria a página; preferimos os poucos
  cabeçalhos explícitos, com teste.
- **Comprimir no `zlib` à mão**: reinventa `Vary`, limites de tamanho e tipos; o pacote é pequeno e consolidado.
- **Guardar a ordem em `localStorage`**: contraria "sem armazenamento".

## Consequências

- Positivas: menos informação vazada, proteção contra _clickjacking_ e _MIME sniffing_, páginas e _scripts_ bem menores na
  rede, e dois recursos de uso diário (inverter a ordem, ver a disponibilidade). Tudo coberto por testes unitários e e2e
  contra o servidor real (cabeçalhos presentes, `X-Powered-By` ausente, HSTS só em HTTPS, `Content-Encoding: gzip`).
- Negativas: a CSP ainda não limita _scripts_ (ver acima); a compressão gasta CPU do servidor, o que uma CDN faria por nós.

## Atualização (24/10/2026): a CSP agora restringe `script-src`

Os _scripts_ em linha que impediam a restrição passaram a levar um _nonce_ por resposta e a CSP da página ganhou `script-src` (e
o cache virou LRU e passou a ser compartilhado pela CDN): ver o [ADR 0028](0028-csp-com-nonce-e-cache-compartilhado.md). O que
este ADR diz sobre a CSP parcial vale para os arquivos e a API, que mantêm a política de base.
