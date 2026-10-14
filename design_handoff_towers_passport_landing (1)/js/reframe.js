/* Reframe — before/after slider. Pointer position across the room drives the split;
   drag/keyboard via native range input. Auto-sweeps once on entry, types the prompt.
   Activates only when both full-frame images load; otherwise the static slide image stays. */
(function(){
  const html = document.documentElement;
  const stage = document.getElementById('rfStage');
  if (!stage) return;
  const frame = stage.querySelector('.rf-frame');
  const before = stage.querySelector('.rf-before');
  const line = stage.querySelector('.rf-line');
  const range = document.getElementById('rfRange');
  const typeEl = document.getElementById('rfType');
  const PROMPTS = [
    'Furnish as coastal luxury — warm oak, linen, dusk light',
    'Unfurnished, with the premium finishes schedule',
    'Restyle for a young family — soft, durable, bright'
  ];
  const motion = html.classList.contains('motion');

  const imgs = [stage.querySelector('.rf-after img'), stage.querySelector('.rf-before img')];
  let ready = 0;
  const go = () => { if (++ready === 2) init(); };
  imgs.forEach(im => { if (im.complete && im.naturalWidth) go(); else { im.addEventListener('load', go); } });

  function init(){
    stage.classList.add('live');
    let pos = 50, target = 50, user = false, raf = 0;
    const set = v => {
      pos = v;
      before.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
      line.style.left = v + '%';
      range.value = Math.round(v);
      stage.style.setProperty('--rf', v);
      stage.classList.toggle('to-after', v < 35);
      stage.classList.toggle('to-before', v > 65);
    };
    const tick = () => {
      pos += (target - pos) * (motion ? .18 : 1);
      set(pos);
      if (Math.abs(target - pos) > .05) raf = requestAnimationFrame(tick); else { set(target); raf = 0; }
    };
    const to = v => { target = Math.max(0, Math.min(100, v)); if (!raf) raf = requestAnimationFrame(tick); };
    set(50);

    frame.addEventListener('pointermove', e => {
      const r = frame.getBoundingClientRect();
      user = true; to((e.clientX - r.left) / r.width * 100);
    });
    frame.addEventListener('pointerdown', e => {
      const r = frame.getBoundingClientRect();
      user = true; to((e.clientX - r.left) / r.width * 100);
    });
    range.addEventListener('input', () => { user = true; to(+range.value); });

    // one-time intro sweep on entry: 50 → 88 → 12 → 50
    if (motion){
      let played = false;
      const check = () => {
        if (played) return;
        const r = stage.getBoundingClientRect();
        if (r.top < innerHeight * .6 && r.bottom > innerHeight * .3){
          played = true;
          const seq = [[88, 0], [12, 1100], [50, 2300]];
          seq.forEach(([v, d]) => setTimeout(() => { if (!user) to(v); }, d));
          typeLoop();
        }
      };
      addEventListener('scroll', check, {passive:true}); check();
    }
  }

  // typed prompt (decorative)
  function typeLoop(){
    let p = 0;
    const run = () => {
      const s = PROMPTS[p % PROMPTS.length]; let i = 0;
      typeEl.textContent = '';
      const step = () => {
        typeEl.textContent = s.slice(0, ++i);
        if (i < s.length) setTimeout(step, 34);
        else setTimeout(() => { p++; run(); }, 4200);
      };
      step();
    };
    run();
  }
})();
