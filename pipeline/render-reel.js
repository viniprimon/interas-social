// Renderiza um reel HTML (window.render(t)) em MP4 1080x1920.
// Uso: node pipeline/render-reel.js <reel.html> <saida.mp4> <duracao-s> [fps] [capa-em-s]
// Fontes: mesmos pacotes @fontsource do render.js, na pasta de onde se roda o comando.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [htmlPath, outMp4, durS, fpsArg, coverArg] = process.argv.slice(2);
const fps = +(fpsArg || 30), dur = +durS, cover = +(coverArg || 1.8);
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
  const frames = fs.mkdtempSync(path.join(path.dirname(abs), '.frames-'));
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(`file://${abs}`);
  await page.addStyleTag({ content: fonts });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const total = Math.round(dur * fps);
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.render(t), i / fps);
    await page.screenshot({ path: path.join(frames, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  await page.evaluate((t) => window.render(t), cover);
  const coverPath = outMp4.replace(/\.mp4$/, '-capa.jpg');
  await page.screenshot({ path: coverPath, type: 'jpeg', quality: 92 });
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, '%05d.jpg'),
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-shortest',
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outMp4]);
  fs.rmSync(frames, { recursive: true, force: true });
  console.log(`ok ${outMp4} (${total} quadros) e capa ${coverPath}`);
})();
