/* Motor dos Reels da Interas (1080x1920).
 *
 * O reel é uma página HTML com cenas em sequência. Este arquivo calcula os tempos e
 * expõe window.render(t), que desenha o quadro do instante t (em segundos), de forma
 * determinística. pipeline/render-reel.js chama render() quadro a quadro e monta o MP4.
 *
 * Marcação:
 *   <section class="scene" data-dur="7" data-tone="dark|light|accent">   uma cena de 7 s
 *   data-in="1.2" data-fx="up|left|fade|pop"   elemento entra 1,2 s depois do início da cena
 *   <span data-count="40.1" data-dec="1" data-in="2">0</span>   contador que sobe em 1 s
 *   <div data-bar="89" data-in="2"></div>      barra que cresce até 89% em 1 s
 *   <img data-kb src="...">                    zoom lento durante a cena
 *
 * data-tone escolhe o logo e as cores do cabeçalho (ver os .css de cada série).
 * window.REEL_END = duração total. window.reelCheck() devolve problemas de corte e de
 * texto rápido demais para ler.
 */
(() => {
  const ease = (p) => 1 - Math.pow(1 - Math.min(Math.max(p, 0), 1), 3);
  const FADE = 0.35;
  const scenes = [...document.querySelectorAll('.scene')];
  let t0 = 0;
  const plan = scenes.map((el, i) => {
    const dur = parseFloat(el.dataset.dur || '6');
    const s = { el, i, start: t0, end: t0 + dur, dur };
    t0 += dur;
    el.style.zIndex = String(i + 1);
    return s;
  });
  const END = t0;
  window.REEL_END = END;
  const abs = (el) => {
    const s = plan.find((p) => p.el.contains(el));
    return (s ? s.start : 0) + parseFloat(el.dataset.in || '0');
  };
  const items = [...document.querySelectorAll('[data-in][data-fx]')].map((el) => ({ el, at: abs(el), fx: el.dataset.fx }));
  const counts = [...document.querySelectorAll('[data-count]')].map((el) => ({ el, at: abs(el), to: +el.dataset.count, dec: +(el.dataset.dec || 0) }));
  const bars = [...document.querySelectorAll('[data-bar]')].map((el) => ({ el, at: abs(el), to: +el.dataset.bar }));
  const kbs = [...document.querySelectorAll('[data-kb]')].map((el) => ({ el, s: plan.find((p) => p.el.contains(el)) }));
  const prog = document.querySelector('.progress > div');

  window.render = (t) => {
    let tone = 'dark';
    for (const s of plan) {
      const next = plan[s.i + 1];
      const visible = t >= s.start && (!next || t < next.start + FADE + 0.05);
      s.el.style.opacity = visible ? ease((t - s.start) / FADE) : 0;
      s.el.style.visibility = visible ? 'visible' : 'hidden';
      // O cabeçalho troca de cor no meio da transição para a cena seguinte.
      if (s.i === 0 || t >= s.start + FADE * 0.5) tone = s.el.dataset.tone || 'dark';
    }
    document.body.dataset.tone = tone;
    for (const { el, at, fx } of items) {
      const p = ease((t - at) / 0.5);
      el.style.opacity = p;
      el.style.transform =
        fx === 'up' ? `translateY(${(1 - p) * 50}px)` :
        fx === 'left' ? `translateX(${(1 - p) * -70}px)` :
        fx === 'pop' ? `scale(${0.85 + 0.15 * p})` : 'none';
      if (fx === 'pop') el.style.transformOrigin = 'left top';
    }
    for (const { el, at, to, dec } of counts) el.textContent = (to * ease(t - at)).toFixed(dec).replace('.', ',');
    for (const { el, at, to } of bars) el.style.width = to * ease(t - at) + '%';
    for (const { el, s } of kbs) el.style.transform = `scale(${1 + 0.08 * Math.min(Math.max((t - s.start) / s.dur, 0), 1)})`;
    if (prog) prog.style.width = Math.min((t / END) * 100, 100) + '%';
  };

  /* Checagens: área segura (o Instagram cobre o topo e o rodapé) e tempo de leitura. */
  window.reelCheck = () => {
    const out = [];
    const SAFE_TOP = 200, SAFE_BOTTOM = 1920 - 380, SAFE_LEFT = 60, SAFE_RIGHT = 1080 - 60;
    // Palavras por segundo que dá para ler: 5 no editorial; no Domingo Seguro use <body data-max-wps="4">.
    const MAX_WPS = parseFloat(document.body.dataset.maxWps || '5');
    for (const s of plan) {
      window.render(s.end - 0.02);
      for (const el of s.el.children) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (r.bottom > SAFE_BOTTOM + 1 || r.top < SAFE_TOP - 1 || r.right > SAFE_RIGHT + 1 || r.left < SAFE_LEFT - 1) {
          out.push(`CORTE cena ${s.i + 1}: "${(el.textContent || el.tagName).trim().slice(0, 40)}" sai da área segura (topo ${Math.round(r.top)}, base ${Math.round(r.bottom)})`);
        }
      }
      const words = (s.el.innerText || '').trim().split(/\s+/).filter(Boolean).length;
      const wps = words / s.dur;
      if (wps > MAX_WPS) out.push(`RAPIDO cena ${s.i + 1}: ${words} palavras em ${s.dur}s (${wps.toFixed(1)}/s, limite ${MAX_WPS}). Aumente data-dur ou corte texto.`);
      let last = 0;
      for (const el of s.el.querySelectorAll('[data-in]')) last = Math.max(last, parseFloat(el.dataset.in));
      if (last > s.dur - 2) out.push(`TARDE cena ${s.i + 1}: um elemento entra em ${last}s numa cena de ${s.dur}s; sobra pouco tempo para ler.`);
    }
    window.render(0);
    return out;
  };

  window.render(0);
})();
