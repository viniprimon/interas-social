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
- Uma ideia por lâmina; toda manchete com o podcast em que apareceu e a data, mais a fonte oficial do fato.

## Posts diários (grade da semana)

Por causa do limite do Metricool (plano gratuito, 20 publicações por mês), são 4 publicações por semana, cada uma com UMA peça só: domingo REEL (Domingo Seguro), segunda CARROSSEL (NVIDIA EM FOCO), quarta REEL (Manchetes de IA + Humanoides), sexta CARROSSEL (Segurança para empresas + IA na prática). Terça, quinta e sábado sem publicação. Toda publicação tem uma parte PARA ENTENDER (lâmina ou cena) que explica para leigo o conceito central, sem repetir conceito já explicado. A grade completa, as fontes oficiais de cada série, as ideias de reserva e o histórico ficam em `pipeline/pauta-diaria.md`.

- **Pesquisa no dia da postagem.** A apuração é feita no mesmo dia em que o post vai ao ar, para não publicar notícia defasada. Vale também para as manchetes de quarta: os podcasts servem para descobrir os assuntos, e cada manchete é confirmada na fonte oficial na manhã da quarta.
- **Só fonte oficial.** O fato só entra se foi confirmado no site, blog, sala de imprensa ou documentação da empresa ou do órgão responsável. Imprensa serve para descobrir a notícia.
- **Sem tema parecido.** Antes de fechar a pauta e de novo antes de agendar, confira o que já saiu e o que está na fila: "Publicados" em `pipeline/pauta-diaria.md` e `pipeline/domingo-pauta.md`, os posts dos últimos 30 dias em `posts/` e os agendados dos próximos 7 dias no Metricool. Mesma notícia, mesmo produto ou mesmo conceito com o mesmo ângulo, em qualquer série, não entra; notícia repetida só volta com fato oficial novo, como atualização.
- Visual: o editorial de semana (`pipeline/modelo/`), com o nome da série no eyebrow da capa (`<SÉRIE> · <MÊS> <ANO>`). Pasta: `posts/AAAA-MM-DD-<slug-da-série>/`.
- Público fora da área de TI: todo termo técnico é explicado na própria lâmina, e o fechamento traz 3 pontos práticos para quem empreende.

## Série Domingo Seguro (visual próprio)

Segurança digital para a família, todo domingo. O visual é propositalmente diferente do editorial de semana:

- Modelo: `pipeline/modelo-domingo/` (capa amarela, lâminas creme, fechamento azul-marinho).
- Pauta e temas já usados: `pipeline/domingo-pauta.md`.
- Fontes: Bricolage Grotesque 800 (títulos), Atkinson Hyperlegible (texto, fácil de ler para público mais velho).
- Cores: creme `#FFF7E6`, azul-marinho `#13265C`, amarelo `#FFC43D`, vermelho `#B8321C` (alerta), verde `#1D6B45` (proteção), cinza-azulado `#3D4A6B`.
- Cartões com borda de 4px azul-marinho e sombra sólida `10px 10px 0`; selo "DOMINGO SEGURO" em todas as lâminas.
- Logos: `logo-azul` no creme e no amarelo, `logo-claro` no azul-marinho.
- Texto do corpo com no mínimo 36px; linguagem simples, sem jargão técnico.

## Gerar as imagens

```bash
npm i playwright @fontsource/fraunces @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono
node pipeline/render.js posts/<pasta>/fonte posts/<pasta>
```

O script sai com código 2 e marca `OVERFLOW` se algum texto passar do quadro.

## Reels (domingo e quarta)

No domingo e na quarta a publicação é só o Reel vertical (1080×1920), sem carrossel: o vídeo e a legenda precisam se bastar.

- Modelos: `pipeline/modelo-reel/editorial/reel.html` (semana) e `pipeline/modelo-reel/domingo/reel.html` (Domingo Seguro).
- Motor e estilos: `pipeline/reel/reel.js`, `pipeline/reel/editorial.css`, `pipeline/reel/domingo.css`. Não copie esses arquivos: o reel aponta para eles.
- Onde fica: `posts/<pasta>/reel/reel.html`. Copie o modelo da série para lá **sem mudar os caminhos** (`../../../pipeline/...` funciona igual nos dois lugares) e troque só as cenas.

Como escrever as cenas:

- Cada `<section class="scene" data-dur="9" data-tone="...">` é uma cena; `data-dur` é a duração em segundos. Tons: editorial `dark | light | accent` (grafite, creme, laranja); domingo `accent | light | dark` (amarelo, creme, azul-marinho).
- `data-in="1.2" data-fx="up|left|fade|pop"` faz o elemento entrar 1,2 s depois do início **da cena**.
- 6 a 8 cenas, 50 a 70 s no total. Abertura com o gancho, uma ideia por cena, fechamento com pergunta ou pedido para marcar alguém.
- Público leigo: cada cena precisa de uma frase que **explique** o assunto (o que é, por que importa), não só o título. Sempre que um termo técnico aparecer, explique na mesma cena.
- Use imagem real quando houver uma de licença livre (com crédito na cena); senão, desenhe um esquema simples em SVG. Nunca apresente ilustração como resultado real.
- Só entra no Reel o que foi checado para o carrossel.
- O Instagram cobre o topo (até ~220 px) e o rodapé (abaixo de 1520 px). O cabeçalho fixo (logo, selo e barra de progresso) fica entre 250 e 350 px, e o conteúdo das cenas entre 370 e 1520 px; o `render-reel.js` acusa `CORTE` fora disso.

Gerar o vídeo:

```bash
npm i playwright @fontsource/fraunces @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono @fontsource/bricolage-grotesque @fontsource/atkinson-hyperlegible
node pipeline/render-reel.js posts/<pasta>/reel/reel.html posts/<pasta>/reel/reel-<tema>.mp4 3
```

O último número é o segundo usado como capa (`reel-<tema>-capa.jpg`). Antes de renderizar, o script confere e **para com código 2** se encontrar:

- `CORTE`: algo saiu da área segura. Encurte o texto ou diminua a fonte.
- `RAPIDO`: texto demais para o tempo da cena (limite de 5 palavras por segundo; no Domingo Seguro, 4, definido em `<body data-max-wps="4">`). Aumente `data-dur` ou corte texto.
- `TARDE`: um elemento entra nos 2 s finais da cena.
- `IMAGEM`: uma imagem não carregou.

Depois de renderizar, extraia um quadro de cada cena com o ffmpeg e olhe todos antes de agendar.

## Links públicos

Use sempre o link **com o hash do commit** (`git rev-parse HEAD` depois do push). O link por `main` fica em cache e pode devolver 404 ou a versão antiga por alguns minutos.

`https://raw.githubusercontent.com/viniprimon/interas-social/<hash>/posts/<pasta>/<arquivo>`

## Agendar no Metricool (blogId 7103869, Instagram)

Um agendamento por dia de publicação:

- Segunda e sexta, carrossel: `instagramData.type = "POST"`, `media` = as lâminas na ordem.
- Domingo e quarta, Reel: `instagramData.type = "REEL"`, `showReelOnFeed = true`, `media` = o `.mp4`, `videoThumbnailUrl` = a capa `.jpg`, legenda em `legenda-reel.txt`.

Antes de agendar, confira o limite do mês: post com status ERROR e "account limit" quer dizer que acabou; nesse caso a peça fica pronta para publicação manual.
