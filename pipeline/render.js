// Renderiza as lâminas (.dc.html) de uma pasta em PNGs 1080x1350, na ordem dos nomes.
// Uso: node pipeline/render.js <pasta-com-dc.html> <pasta-de-saida>
// Logos: src="logo-claro" | "logo-azul" | "logo-preto" (arquivos em pipeline/logos).
// Fontes: pacotes @fontsource (npm i playwright @fontsource/fraunces @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [srcDir, outDir] = process.argv.slice(2).map((p) => path.resolve(p));
const logoDir = path.join(__dirname, 'logos');
const fontDir = path.join(process.cwd(), 'node_modules/@fontsource');
const face = (fam, file, w) =>
  `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;src:url(file://${fontDir}/${file}) format('woff2')}`;
const fonts = [
  face('Fraunces', 'fraunces/files/fraunces-latin-500-normal.woff2', 500),
  face('Fraunces', 'fraunces/files/fraunces-latin-700-normal.woff2', 700),
  face('IBM Plex Sans', 'ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2', 400),
  face('IBM Plex Sans', 'ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2', 500),
  face('IBM Plex Sans', 'ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2', 600),
  face('IBM Plex Sans', 'ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2', 700),
  face('IBM Plex Mono', 'ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2', 500),
  // Série de domingo (segurança para a família)
  face('Bricolage Grotesque', 'bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2', 700),
  face('Bricolage Grotesque', 'bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2', 800),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700),
].join('\n');

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.dc.html')).sort();
  let problems = 0;
  for (const f of files) {
    const src = fs.readFileSync(path.join(srcDir, f), 'utf8');
    let body = src.split('<x-dc>')[1].split('</x-dc>')[0];
    body = body.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
    body = body.replace(/src="(logo-[a-z]+)"/g, (_, n) => `src="file://${logoDir}/${n}.png"`);
    const tmp = path.join(outDir, `_${f}.html`);
    fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}\nbody{margin:0}</style></head><body>${body}</body></html>`);
    await page.goto(`file://${tmp}`);
    await page.evaluate(() => document.fonts.ready);
    // Texto que passa do quadro de 1350px = problema de layout.
    const overflow = await page.evaluate(() =>
      [...document.body.querySelectorAll('*')].some((el) => el.getBoundingClientRect().bottom > 1351));
    const out = path.join(outDir, f.replace('.dc.html', '.png'));
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
    fs.unlinkSync(tmp);
    if (overflow) problems++;
    console.log(path.basename(out), overflow ? 'OVERFLOW' : 'ok');
  }
  await browser.close();
  process.exit(problems ? 2 : 0);
})();
