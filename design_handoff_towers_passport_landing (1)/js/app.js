/* Page chrome: progress rail, nav state, sticky CTA, investment selector, layer reveal, tweaks. */
(function(){
  const html = document.documentElement;
  const rail = document.querySelector('.rail i');
  const nav = document.querySelector('.nav');
  const sticky = document.querySelector('.sticky-cta');
  const hero = document.querySelector('.hero');
  const demo = document.getElementById('demo');

  function onScroll(){
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    if (rail) rail.style.transform = `scaleX(${p})`;
    nav.classList.toggle('scrolled', scrollY > 24);
    const hb = hero.getBoundingClientRect().bottom;
    const dr = demo.getBoundingClientRect();
    const inDemo = dr.top < innerHeight * .85 && dr.bottom > 0;
    sticky.classList.toggle('on', hb < 80 && !inDemo);
  }
  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', onScroll);
  onScroll();

  /* ---- Investment: tower class selector ---- */
  const DATA = {
    boutique:{ dep:'$30k',  ret:'$6k',  mo:34, fee:'$0.34m', tot:'$0.59m', shr:'0.82%', v:[30, 204, 340] },
    mid:     { dep:'$75k',  ret:'$13k', mo:49, fee:'$1.43m', tot:'$2.15m', shr:'0.72%', v:[75, 637, 1430] },
    high:    { dep:'$125k', ret:'$18k', mo:64, fee:'$3.85m', tot:'$5.11m', shr:'0.63%', v:[125, 1152, 3850] }
  };
  const segBtns = [...document.querySelectorAll('.seg button')];
  const cards = [...document.querySelectorAll('.ccard')];
  const $ = id => document.getElementById(id);
  function select(k){
    const D = DATA[k]; if (!D) return;
    segBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
    cards.forEach(c => c.classList.toggle('sel', c.dataset.k === k));
    $('amtDep').firstChild.nodeValue = D.dep;
    $('amtRet').firstChild.nodeValue = D.ret + ' / month';
    $('amtRetN').textContent = `× ${D.mo} months`;
    $('amtFeeN').textContent = `≈ ${D.fee} · ${D.tot} total · ${D.shr} of sales`;
    const s = D.v[0]+D.v[1]+D.v[2];
    $('mixA').style.flexBasis = (D.v[0]/s*100)+'%';
    $('mixB').style.flexBasis = (D.v[1]/s*100)+'%';
    $('mixC').style.flexBasis = (D.v[2]/s*100)+'%';
    $('mixLA').textContent = `Deposit ${Math.round(D.v[0]/s*100)}%`;
    $('mixLB').textContent = `Retainer ${Math.round(D.v[1]/s*100)}%`;
    $('mixLC').textContent = `Success fee ${Math.round(D.v[2]/s*100)}%`;
    $('invClass').textContent = {boutique:'Boutique', mid:'Mid-rise', high:'High-rise'}[k];
  }
  segBtns.forEach(b => b.addEventListener('click', () => select(b.dataset.k)));
  cards.forEach(c => c.addEventListener('click', () => select(c.dataset.k)));
  select('mid');

  /* ---- Payment layers animate in sequence (decorative bars only; content never hidden) ---- */
  const layers = document.querySelector('.layers');
  if (layers){
    const chk = () => { const r = layers.getBoundingClientRect(); if (r.top < innerHeight * .75 && r.bottom > 0){ layers.classList.add('in'); removeEventListener('scroll', chk); } };
    addEventListener('scroll', chk, {passive:true}); chk();
  }

  /* ---- Liability: interval slices (pre-formwork → pre-fit-off) ---- */
  (function(){
    const root = document.getElementById('liability'); if (!root) return;
    const slices = [...root.querySelectorAll('.slice')], pins = [...root.querySelectorAll('.pin')], leads = [...root.querySelectorAll('.lead')];
    const frame = root.querySelector('.lia-frame');
    const tabs = [...root.querySelectorAll('.lia-tabs button')], ro = document.getElementById('liaReadout');
    const motion = html.classList.contains('motion');
    const NAMES = ['PRE-FORMWORK','PRE-PLUMBING','PRE-GYPROCK','PRE-FIT-OFF'];
    const DUR = 3200;
    let cur = 0, start = performance.now(), auto = motion, raf = 0;
    function show(i){
      cur = i; start = performance.now();
      slices.forEach((s,k) => s.classList.toggle('on', k === i));
      pins.forEach((p,k) => { p.classList.toggle('on', k === i); p.classList.toggle('done', k < i); });
      leads.forEach((p,k) => { p.classList.toggle('on', k === i); p.classList.toggle('done', k < i); });
      tabs.forEach((t,k) => { t.classList.toggle('on', k === i); t.classList.toggle('done', k < i); t.setAttribute('aria-pressed', k === i); t.style.setProperty('--p', auto ? 0 : 1); });
      if (ro) ro.innerHTML = `SCAN <b>0${i+1} / 04 · ${NAMES[i]}</b><br>RECORD <b>LIDAR · SPLAT · PHOTO</b><br>STATE <span>TIME-STAMPED</span>`;
    }
    root.classList.add('live'); show(0);
    let hovering = false;
    const pick = k => { auto = false; if (k !== cur) show(k); };
    tabs.forEach((t,k) => {
      t.addEventListener('click', () => pick(k));
      t.addEventListener('pointerenter', () => { hovering = true; pick(k); });
      t.addEventListener('focus', () => pick(k));
    });
    // move across the image: the pane under the pointer lights, and its tile below follows
    const BOUNDS = [[49, 61.1], [61.1, 70.3], [70.3, 80], [80, 97.5]];
    const stageEl = root.querySelector('.lia-stage');
    const onMove = e => {
      const r = frame.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * 100;
      const k = BOUNDS.findIndex(b => x >= b[0] && x < b[1]);
      if (k >= 0){ hovering = true; pick(k); }
    };
    // listen on the whole stage (full image height) and on the band so the overlaid headline never blocks it
    stageEl.addEventListener('pointermove', onMove);
    root.addEventListener('pointermove', e => { const r = frame.getBoundingClientRect(); if (e.clientY >= r.top && e.clientY <= r.bottom) onMove(e); });
    const leave = () => { hovering = false; };
    stageEl.addEventListener('pointerleave', leave);
    root.querySelector('.lia-tabs').addEventListener('pointerleave', leave);
    if (!motion) return;
    function inView(){ const r = root.getBoundingClientRect(); return r.top < innerHeight*.75 && r.bottom > innerHeight*.2; }
    function tick(now){
      raf = requestAnimationFrame(tick);
      if (!auto) return;
      if (!inView()){ start = now; return; }
      const p = Math.min(1, (now - start) / DUR);
      tabs[cur].style.setProperty('--p', p);
      if (p >= 1) show((cur + 1) % 4);
    }
    raf = requestAnimationFrame(tick);
    // resume auto-cycle if the user scrolls away and back
    let wasIn = false;
    addEventListener('scroll', () => { const n = inView(); if (n && !wasIn && !auto && !hovering){ auto = true; show(0); } wasIn = n; }, {passive:true});
  })();

  /* ---- Why now: yellow riser walks each timeline as you scroll ---- */
  (function(){
    if (!html.classList.contains('motion')) return;
    const lists = [...document.querySelectorAll('[data-tl]')];
    const media = document.querySelector('.now-media');
    function upd(){
      lists.forEach(ol => {
        const r = ol.getBoundingClientRect();
        const start = innerHeight * .82, end = innerHeight * .38;
        // progress across the list's own height (vertical) or its block (horizontal)
        const p = Math.max(0, Math.min(1, (start - r.top) / (start - end + r.height * (innerWidth < 1000 ? 1 : .2))));
        ol.style.setProperty('--p', p);
        const items = [...ol.children], n = items.length;
        const step = Math.min(n - 1, Math.floor(p * n - .001));
        items.forEach((li, k) => { li.classList.toggle('on', p > 0 && k <= step); li.classList.toggle('cur', k === step); });
      });
      if (media){ const r = media.getBoundingClientRect(); if (r.top < innerHeight * .85) media.classList.add('in'); }
    }
    addEventListener('scroll', upd, {passive:true}); addEventListener('resize', upd); upd();
  })();

  /* ---- GHL booking embed: load when near, pass UTM through, auto-height via form_embed.js ---- */
  (function(){
    const frame = document.getElementById('bookFrame'); if (!frame) return;
    const ifr = frame.querySelector('iframe');
    const qs = location.search.replace(/^\?/, '');
    const withQs = u => qs ? u + (u.includes('?') ? '&' : '?') + qs : u;
    document.querySelectorAll('#bookDirect, [data-direct]').forEach(el => el.href = withQs(el.href));
    let loaded = false;
    const load = () => {
      if (loaded) return; loaded = true;
      ifr.src = withQs(ifr.dataset.src);
      // GHL's form_embed.js hides the iframe until the widget reports its height.
      const shown = () => ifr.style.visibility !== 'hidden' && ifr.style.left !== '-9999px';
      const t0 = Date.now();
      const poll = setInterval(() => {
        if (shown()){ frame.classList.add('ready'); clearInterval(poll); }
        else if (Date.now() - t0 > 10000){ frame.classList.add('stuck'); clearInterval(poll); }
      }, 400);
      ifr.addEventListener('load', () => { if (!document.querySelector('script[src*="form_embed.js"]') || shown()) frame.classList.add('ready'); });
      if (!document.querySelector('script[src*="form_embed.js"]')){
        const s = document.createElement('script'); s.src = 'https://link.msgsndr.com/js/form_embed.js'; s.type = 'text/javascript'; document.body.appendChild(s);
      }
    };
    const near = () => { const r = frame.getBoundingClientRect(); if (r.top < innerHeight * 2.2) { load(); removeEventListener('scroll', near); } };
    addEventListener('scroll', near, {passive:true}); near();
    document.querySelectorAll('a[href="#demo"]').forEach(el => el.addEventListener('click', load));
  })();

  /* ---- Demo form (not wired — design only) ---- */
  const form = document.querySelector('.form');
  form && form.addEventListener('submit', e => { e.preventDefault(); form.classList.add('sent'); });

  /* ---- Hero hint copy for touch ---- */
  const hint = document.querySelector('.hero-hint');
  if (hint && matchMedia('(pointer:coarse)').matches) hint.textContent = 'Touch the model to explore';

  /* ---- Tweaks ---- */
  const T = window.TP_TWEAKS;
  const panel = document.querySelector('.tweaks');
  function paint(){
    panel.querySelectorAll('[data-hero]').forEach(b => b.setAttribute('aria-pressed', b.dataset.hero === T.hero));
    panel.querySelector('#twDensity').value = T.density;
    panel.querySelector('#twDensityV').textContent = Math.round(T.density*100) + '%';
    panel.querySelectorAll('[data-story]').forEach(b => b.setAttribute('aria-pressed', b.dataset.story === (T.story || 'a')));
    html.dataset.story = T.story || 'a';
    html.dataset.hero = T.hero || 'focus';
    if (T.hero === '3d' && window.TPHero3D) window.TPHero3D.ensure();
    if (hint) hint.textContent = T.hero === '3d'
      ? (matchMedia('(pointer:coarse)').matches ? 'Swipe sideways to turn the tower' : 'Drag to orbit · tilt · hover a pin')
      : (matchMedia('(pointer:coarse)').matches ? 'Touch the model to explore' : 'Move across the model to explore');
  }
  function set(edits){
    Object.assign(T, edits); paint();
    if (edits.hero && edits.hero !== '3d' && window.TPHero) window.TPHero.setMode(edits.hero);
    if (edits.density && window.TPHero) window.TPHero.setDensity(edits.density);
    if (edits.density && window.TPHero3D) window.TPHero3D.setDensity(edits.density);
    try{ parent.postMessage({type:'__edit_mode_set_keys', edits}, '*'); }catch(e){}
  }
  panel.querySelectorAll('[data-hero]').forEach(b => b.addEventListener('click', () => set({hero:b.dataset.hero})));
  panel.querySelector('#twDensity').addEventListener('input', e => set({density:+e.target.value}));
  panel.querySelectorAll('[data-story]').forEach(b => b.addEventListener('click', () => set({story:b.dataset.story})));
  panel.querySelector('.th button').addEventListener('click', () => { panel.classList.remove('on'); try{ parent.postMessage({type:'__edit_mode_dismissed'}, '*'); }catch(e){} });
  addEventListener('message', e => {
    const t = e.data && e.data.type;
    if (t === '__activate_edit_mode') panel.classList.add('on');
    if (t === '__deactivate_edit_mode') panel.classList.remove('on');
  });
  try{ parent.postMessage({type:'__edit_mode_available'}, '*'); }catch(e){}
  paint();
})();
