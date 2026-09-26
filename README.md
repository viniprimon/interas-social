# interas-social

Imagens dos posts do Instagram **@interasoficial** e o processo que as gera.
O repositório é público porque o Metricool só aceita imagens com link público; tudo aqui vai ao ar no Instagram de qualquer forma.

## Estrutura

- `posts/AAAA-MM-DD-<tema>/` — as lâminas de cada post, `01-….png` a `0N-….png` (1080×1350), e `legenda.txt`.
- `pipeline/modelo/` — o carrossel de referência (visual da marca), um `.dc.html` por lâmina.
- `pipeline/logos/` — `logo-claro` (fundo grafite), `logo-azul` (fundo creme), `logo-preto` (fundo laranja).
- `pipeline/render.js` — transforma uma pasta de `.dc.html` em PNGs.

## Visual

- Fontes: Fraunces 700 (títulos), IBM Plex Sans (texto), IBM Plex Mono (rótulos).
- Cores: grafite `#16181D`, creme `#F4F1EA`, laranja `#E8894F`, laranja escuro `#B4501A` (rótulo em fundo claro), azul `#6FA3E8`, cinza `#2A2E37` (cartão em fundo escuro).
- Formato 1080×1350; rodapé com logo e `n/N`. Capa escura, alternando claro/escuro, fechamento laranja.
- Uma ideia por lâmina; toda manchete com fonte (podcast e data).

## Gerar as imagens

```bash
npm i playwright @fontsource/fraunces @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono
node pipeline/render.js posts/<pasta>/fonte posts/<pasta>
```

O script sai com código 2 e marca `OVERFLOW` se algum texto passar do quadro.

## Link público de cada imagem

`https://raw.githubusercontent.com/viniprimon/interas-social/main/posts/<pasta>/<arquivo>.png`
