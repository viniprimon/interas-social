// Renderiza um reel HTML (pipeline/reel/reel.js) em MP4 1080x1920 e gera a capa.
// Uso: node pipeline/render-reel.js <reel.html> <saida.mp4> [capa-em-s] [--forcar]
// - A duração vem da própria página (soma dos data-dur das cenas).
// - Antes de renderizar roda window.reelCheck(): se houver CORTE/RAPIDO/TARDE, mostra e sai
//   com código 2 (use --forcar para renderizar mesmo assim).
// - Fontes: pacotes @fontsource instalados na pasta de onde o comando é rodado:
//   npm i playwright @fontsource/fraunces @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono \
//         @fontsource/bricolage-grotesque @fontsource/atkinson-hyperlegible
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const force = args.includes('--forcar');
const [htmlPath, outMp4, coverArg] = args.filter((a) => a !== '--forcar');
const fps = 30;
const fontDir = path.join(process.cwd(), 'node_modules/@fontsource');
const face = (fam, file, w) =>
  `@font-face{font-family:'${fam}';font-weight:${w};src:url(file://${fontDir}/${file}) format('woff2')}`;
const fonts = [
  face('Fraunces', 'fraunces/files/fraunces-latin-700-normal.woff2', 700),
  face('IBM Plex Sans', 'ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2', 400),
  face('IBM Plex Sans', 'ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2', 500),
  face('IBM Plex Sans', 'ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2', 600),
  face('IBM Plex Sans', 'ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2', 700),
  face('IBM Plex Mono', 'ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2', 500),
  face('Bricolage Grotesque', 'bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2', 800),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700),
].join('\n');

(async () => {
  const abs = path.resolve(htmlPath);
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(`file://${abs}`);
  await page.addStyleTag({ content: fonts });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  const dur = await page.evaluate(() => window.REEL_END);
  if (!dur) { console.error('ERRO: a página não carregou pipeline/reel/reel.js (window.REEL_END vazio).'); process.exit(1); }
  const broken = await page.evaluate(() => [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.getAttribute('src')));
  const problems = [...broken.map((s) => `IMAGEM não carregou: ${s}`), ...(await page.evaluate(() => window.reelCheck()))];
  for (const p of problems) console.log(p);
  if (problems.length && !force) { await browser.close(); console.log(`Reel NÃO renderizado: ${problems.length} problema(s).`); process.exit(2); }

  const frames = fs.mkdtempSync(path.join(path.dirname(path.resolve(outMp4)), '.frames-'));
  const total = Math.round(dur * fps);
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.render(t), i / fps);
    await page.screenshot({ path: path.join(frames, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  await page.evaluate((t) => window.render(t), +(coverArg || 3));
  const coverPath = outMp4.replace(/\.mp4$/, '-capa.jpg');
  await page.screenshot({ path: coverPath, type: 'jpeg', quality: 92 });
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, '%05d.jpg'),
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-shortest',
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '22', '-preset', 'slow',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outMp4]);
  fs.rmSync(frames, { recursive: true, force: true });
  const mb = (fs.statSync(outMp4).size / 1e6).toFixed(1);
  console.log(`ok ${path.basename(outMp4)}: ${dur.toFixed(1)} s, ${total} quadros, ${mb} MB; capa ${path.basename(coverPath)}`);
})();
