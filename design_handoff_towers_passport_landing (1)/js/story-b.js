/* Spatial story — Variant B "Image riser".
   Uses the three towers from the presentation's three-stages image. A yellow riser sweeps up the tower;
   below it the next stage is revealed. FORM rises as blue outline → riser returns → BUILT → riser returns → CAPTURED. */
(function(){
  const html = document.documentElement;
  const track = document.getElementById('storyTrack');
  const wrap = document.querySelector('.story-img');
  if (!track || !wrap || !html.classList.contains('motion')) return;
  const layers = [...wrap.querySelectorAll('.si-layer')];
  const bar = wrap.querySelector('.si-bar');
  const tag = wrap.querySelector('.si-tag');
  const steps = [...document.querySelectorAll('.story-step')];
  const ro = document.getElementById('storyReadout');
  const NAMES = ['FORM','BUILT','CAPTURED'];
  const SRC = ['CAD / BIM','INTERVAL SCAN','AS-BUILT TWIN'];
  const ss = (a,b,x) => { const t = Math.max(0, Math.min(1, (x-a)/(b-a))); return t*t*(3-2*t); };
  let target = 0, prog = 0;

  function read(){ const r = track.getBoundingClientRect(); const tot = r.height - innerHeight; target = Math.max(0, Math.min(1, -r.top / tot)); }
  function inView(){ const r = track.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }

  // Reveal edge travels from BOT (below base/reflection) to TOP (above crown)
  const BOT = 74, TOP = 4;
  function frame(){
    requestAnimationFrame(frame);
    if (html.dataset.story !== 'b' || !inView()) return;
    read();
    prog += (target - prog) * .12;
    const p = prog;
    const stage = p < 1/3 ? 0 : p < 2/3 ? 1 : 2;
    const lo = stage/3, local = (p - lo) * 3;           // 0..1 within stage
    // each stage after the first: the riser drops back to the base, then rises again
    const ret = stage > 0 ? ss(0, .12, local) : 1;
    const rise = ss(stage > 0 ? .14 : .03, .84, local);
    const edge = BOT + (TOP - BOT) * rise;               // % from top of panel
    const barEdge = ret < 1 ? TOP + (BOT - TOP) * ret : edge;

    layers.forEach((l, i) => {
      if (i < stage){ l.style.clipPath = 'inset(0 0 0 0)'; l.style.opacity = 1; }
      else if (i === stage){ l.style.clipPath = `inset(${edge}% 0 0 0)`; l.style.opacity = 1; }
      else { l.style.clipPath = 'inset(100% 0 0 0)'; l.style.opacity = 0; }
    });
    // stage 0: faint ghost of the FORM outline so the frame is never empty
    wrap.style.setProperty('--ghost', stage === 0 ? .16 : 0);
    const barOn = (ret < 1) || (rise > .002 && rise < .995);
    bar.style.top = barEdge + '%';
    bar.style.opacity = barOn ? 1 : 0;
    tag.style.top = barEdge + '%';
    tag.style.opacity = barOn ? 1 : 0;
    tag.textContent = ret < 1 ? 'NEXT INTERVAL' : `${stage===0?'DESIGN RISING':stage===1?'SCANNING':'CAPTURING'} · ${String(Math.round(rise*100)).padStart(3,'0')}%`;

    steps.forEach((s, i) => {
      const l = Math.max(0, Math.min(1, (p - i/3) * 3));
      s.classList.toggle('active', stage === i);
      s.querySelector('.bar').style.transform = `scaleX(${l})`;
    });
    if (ro) ro.innerHTML = `MODE <b>${NAMES[stage]}</b><br>SOURCE <b>${SRC[stage]}</b><br>RISER <span class="m">${String(Math.round(rise*100)).padStart(3,'0')}%</span><br>MODEL <b>TP-01 · SAME ASSET</b>`;
  }
  requestAnimationFrame(frame);
})();
