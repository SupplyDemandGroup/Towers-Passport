/* Hero — living point cloud.
   Direction A "Displace": a tight opening parts around the pointer; pins pop with labels as the scan passes.
   Direction B "Focus lens": a ×1.9 magnifier that resolves a much denser, sharper model and reveals pin labels on hover. */
(function(){
  const T = window.TPTower;
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || !document.documentElement.classList.contains('motion')) return;
  const ctx = canvas.getContext('2d');
  const readout = document.getElementById('heroReadout');
  const d = T.dims;

  let W=0, H=0, DPR=1, small=false, model=null, detail=null;
  const BUCKETS = 20;
  const COLS = T.ramp(BUCKETS, 0.02, 0.88);
  const DCOLS = T.ramp(8, 0.62, 1.0);          // detail layer: Sky → Ice → Signal Mist
  let sx, sy, ss, sb, order, counts = new Int32Array(BUCKETS+1);
  const mouse = {x:-9999, y:-9999, tx:-9999, ty:-9999, on:0, ton:0};
  const TW = window.TP_TWEAKS || {};
  const state = { mode: TW.hero || 'displace' };
  let density = TW.density || 2.2;

  // Developer-relevant callouts (illustrative). All map to stated Towers Passport capabilities.
  const PINS = [
    { h:.03,  t:'L00 · LOBBY',           s:'Neighbourhood layer · from the front door' },
    { h:.085, t:'L02 · PODIUM',          s:'Amenity walkthrough · open 24/7' },
    { h:.17,  t:'L04 · PRE-FORMWORK',    s:'Structure captured before the pour' },
    { h:.23,  t:'L06 · PRE-PLUMBING',    s:'Services recorded before sealing' },
    { h:.30,  t:'L08 · SLAB EDGE',       s:'Design vs scan · deviation flagged' },
    { h:.36,  t:'L10 · APARTMENT 1002',  s:'Furnished walkthrough · 2 bed' },
    { h:.43,  t:'L12 · SERVICES',        s:'Recorded before linings' },
    { h:.50,  t:'L14 · PRE-GYPROCK',     s:'Framing and conduit on record' },
    { h:.58,  t:'L17 · APARTMENT 1704',  s:'Real view from this level' },
    { h:.65,  t:'L19 · PROGRESS',        s:'Branded buyer update · this month' },
    { h:.73,  t:'L22 · BALUSTRADE',      s:'Defect evidence · time-stamped' },
    { h:.80,  t:'L24 · FACADE',          s:'AI-flagged · confirmed by a builder' },
    { h:.86,  t:'L26 · REFRAME',         s:'Restyle any room with a sentence' },
    { h:.90,  t:'L28 · SUB-PENTHOUSE',   s:'Live availability · level & aspect' },
    { h:.965, t:'L30 · CROWN',           s:'As-built twin · handover pack' }
  ];
  let pinIdx = [], pinBorn = [];

  window.TPHero = {
    setMode(m){ state.mode = m; },
    setDensity(v){ density = v; rebuild(); }
  };

  function pickPins(){
    pinIdx = PINS.map((p, j) => {
      // spread pins round the tower so some always face the viewer
      const face = j % 4; let best = -1, bd = 9;
      for (let i=0;i<model.N;i+=3){
        if (model.FL[i] & 2) continue;
        const x = model.X[i], z = model.Z[i];
        const onFace = face===0 ? z > d.D/2*.99 : face===1 ? x > d.W/2*.99 : face===2 ? z < -d.D/2*.99 : x < -d.W/2*.99;
        if (p.h < .1){ if (model.Y[i] > d.podH*1.01) continue; }
        else if (!onFace) continue;
        const dd = Math.abs(model.Y[i]-p.h) + (face%2 ? Math.abs(z) : Math.abs(x))*.15;
        if (dd < bd){ bd = dd; best = i; }
      }
      return best;
    });
    pinBorn = PINS.map(() => -1);
  }

  function rebuild(){
    small = innerWidth < 760;
    const base = small ? 7000 : 15000;
    model = T.build(Math.round(base * density), 11);
    detail = T.build(small ? 9000 : 26000, 97);   // the "resolved" layer only visible through the lens
    const N = model.N;
    sx = new Float32Array(N); sy = new Float32Array(N); ss = new Float32Array(N); sb = new Uint8Array(N); order = new Int32Array(N);
    pickPins();
  }

  function resize(){
    const r = canvas.getBoundingClientRect();
    DPR = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W*DPR); canvas.height = Math.round(H*DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    const wasSmall = small; small = innerWidth < 760;
    if (!model || wasSmall !== small) rebuild();
  }

  function setPointer(e){
    const r = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    if (!p) return;
    mouse.tx = p.clientX - r.left; mouse.ty = p.clientY - r.top; mouse.ton = 1;
    if (mouse.x < -999){ mouse.x = mouse.tx; mouse.y = mouse.ty; }
  }
  const hero = canvas.closest('.hero');
  hero.addEventListener('pointermove', setPointer, {passive:true});
  hero.addEventListener('pointerdown', setPointer, {passive:true});
  hero.addEventListener('touchmove', setPointer, {passive:true});
  hero.addEventListener('pointerleave', () => { mouse.ton = 0; });
  hero.addEventListener('touchend', () => { setTimeout(()=>{ mouse.ton = 0; }, 1200); });

  function inView(){ const r = canvas.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }

  const P = [0,0,0,0];
  const box = (W2, D2) => [[-W2,D2],[W2,D2],[W2,-D2],[-W2,-D2],[-W2,D2]];
  function ring(cam, y, W2, D2){ ctx.beginPath(); box(W2,D2).forEach((c,j)=>{ cam(c[0],y,c[1],P); j?ctx.lineTo(P[0],P[1]):ctx.moveTo(P[0],P[1]); }); }

  function label(x, y, side, t, s, a, pop){
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `500 ${small?9.5:10.5}px "IBM Plex Mono", monospace`;
    const tw = Math.max(ctx.measureText(t).width, ctx.measureText(s.toUpperCase()).width) + 16;
    const th = 34;
    let lx = x + side * (small ? 26 : 46);
    let bx = side > 0 ? lx : lx - tw;
    bx = Math.max(8, Math.min(W - tw - 8, bx));
    const by = y - th/2 - (1-pop)*6;
    ctx.strokeStyle = 'rgba(242,203,7,.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + side*8, y); ctx.lineTo(side > 0 ? bx : bx + tw, y); ctx.stroke();
    ctx.fillStyle = 'rgba(1,20,58,.9)'; ctx.fillRect(bx, by, tw, th);
    ctx.strokeStyle = 'rgba(242,203,7,.65)'; ctx.strokeRect(bx+.5, by+.5, tw-1, th-1);
    ctx.fillStyle = '#F4F7F8'; ctx.fillText(t, bx+8, by+14);
    ctx.fillStyle = '#F2CB07'; ctx.fillText(s.toUpperCase(), bx+8, by+27);
    ctx.restore();
  }
  function pinMark(x, y, pop){
    const s = 1 + (1-pop)*1.2;
    ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4); ctx.scale(s,s);
    ctx.fillStyle = '#F2CB07'; ctx.fillRect(-3,-3,6,6);
    ctx.strokeStyle = 'rgba(242,203,7,.7)'; ctx.lineWidth = 1/s; ctx.strokeRect(-6.5,-6.5,13,13);
    ctx.restore();
    if (pop < 1){ ctx.strokeStyle = `rgba(242,203,7,${(1-pop)*.8})`; ctx.beginPath(); ctx.arc(x,y,6+pop*18,0,Math.PI*2); ctx.stroke(); }
  }

  let t0 = performance.now(), lastRO = 0, lastSweep = 0;

  function frame(now){
    requestAnimationFrame(frame);
    if (!inView() || document.documentElement.dataset.hero === '3d'){ if (W) ctx.clearRect(0,0,W,H); return; }
    const t = (now - t0) / 1000;
    mouse.x += (mouse.tx - mouse.x) * .16; mouse.y += (mouse.ty - mouse.y) * .16;
    mouse.on += (mouse.ton - mouse.on) * .07;
    const focus = state.mode === 'focus';

    ctx.clearRect(0,0,W,H);
    const cx = small ? W*.5 : W*.70;
    const S  = small ? Math.min(H*.62, W*1.25) : Math.min(H*.86, W*.62);
    const cy = small ? H*.31 : H*.50;
    const yawPtr = focus ? .12 : .35;
    const th = t * .10 + (mouse.on * ((mouse.x - cx) / W) * yawPtr);
    const ph = .16 + (small ? .02 : 0);
    const cam = T.camera(th, ph, cx, cy, S);

    // ambient aura
    const ax = mouse.on > .02 ? mouse.x : cx, ay = mouse.on > .02 ? mouse.y : cy;
    const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, S*.5);
    g.addColorStop(0, `rgba(26,124,255,${.10 + .10*mouse.on})`);
    g.addColorStop(.5, 'rgba(0,74,173,.06)');
    g.addColorStop(1, 'rgba(0,48,112,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // ground rings
    ctx.strokeStyle = 'rgba(108,167,249,.16)'; ctx.lineWidth = 1;
    for (let k=1;k<=4;k++){
      ctx.beginPath();
      for (let a=0;a<=64;a++){ const an = a/64*Math.PI*2, rr = .18*k; cam(Math.cos(an)*rr, 0, Math.sin(an)*rr, P); a ? ctx.lineTo(P[0],P[1]) : ctx.moveTo(P[0],P[1]); }
      ctx.stroke();
    }

    // capture sweep — rises level by level (eased step per floor)
    const cyc = (t * .085) % 1.18;                      // ≈ 11.8s loop incl. pause
    const raw = Math.min(1, cyc);
    const span = d.y1 + d.crownH;
    const fl = raw * (d.floors + 2);
    const fi = Math.floor(fl), ff = fl - fi;
    const stepE = ff < .6 ? 0 : (ff - .6) / .4;          // dwell on each slab, then move
    const sweep = Math.min(span, d.y0 + (d.y1 - d.y0) * ((fi + stepE*stepE*(3-2*stepE)) / d.floors));
    const level = Math.max(0, Math.min(d.floors, fi));
    const levelY = T.floorY(level);
    if (sweep < lastSweep - .2) pinBorn = PINS.map(() => -1);   // new loop: reset pins
    lastSweep = sweep;

    const R = focus ? (small ? 74 : 108) : (small ? 45 : 75);
    const R2 = R*R, M = 1.9, Rin = R / M, Rin2 = Rin*Rin;
    const N = model.N, X = model.X, Y = model.Y, Z = model.Z, RN = model.RN, FL = model.FL;
    const mx = mouse.x, my = mouse.y, mon = mouse.on;
    const lensOn = focus && mon > .04;

    counts.fill(0);
    for (let i=0;i<N;i++){
      cam(X[i], Y[i], Z[i], P);
      let px = P[0], py = P[1], k = P[3];
      let b = (Y[i] * .92 + RN[i]*.12) * (BUCKETS-1);
      let size = (small ? 1.15 : 1.25) * k;
      b -= Math.max(0, P[2]) * 9;
      // sweep band + current level highlight
      const sd = sweep - Y[i];
      if (sd > -.012 && sd < .05) b += (1 - Math.abs(sd)/.05) * 9;
      if ((FL[i] & 4) && Math.abs(Y[i] - levelY) < .006) { b += 10; size += .5; }
      if (sd < 0) b -= 2.5;                               // not yet captured this loop: dimmer
      if (mon > .02){
        const dx = px - mx, dy = py - my, d2 = dx*dx + dy*dy;
        if (!focus){
          if (d2 < R2){
            const dd = Math.sqrt(d2) || 1, f = 1 - dd/R;
            const push = f*f * 30 * mon;
            px += dx/dd * push; py += dy/dd * push;
            b += f * 9 * mon; size += f * .7;
          }
        } else if (d2 < R2){
          if (d2 < Rin2){ px = mx + dx*M; py = my + dy*M; size = .95; b = Math.max(b, BUCKETS-4) + RN[i]*3; }
          else { sb[i] = 255; continue; }                  // covered by lens rim
        } else {
          size += 1.0 * mon; b -= 3.5 * mon;              // outside the lens: unresolved
        }
      }
      sx[i] = px; sy[i] = py; ss[i] = size;
      const bi = b < 0 ? 0 : b > BUCKETS-1 ? BUCKETS-1 : b|0;
      sb[i] = bi; counts[bi+1]++;
    }
    // counting sort by colour bucket
    for (let b=1;b<=BUCKETS;b++) counts[b] += counts[b-1];
    const off = counts.slice(0, BUCKETS);
    for (let i=0;i<N;i++){ const b = sb[i]; if (b !== 255) order[off[b]++] = i; }

    ctx.globalCompositeOperation = 'lighter';
    for (let b=0;b<BUCKETS;b++){
      const a0 = counts[b], a1 = counts[b+1]; if (a1 <= a0) continue;
      ctx.fillStyle = COLS[b];
      ctx.globalAlpha = .26 + .56 * (b/(BUCKETS-1));
      ctx.beginPath();
      for (let j=a0;j<a1;j++){ const i = order[j], s = ss[i]; ctx.rect(sx[i]-s*.5, sy[i]-s*.5, s, s); }
      ctx.fill();
    }

    // lens: resolved detail layer + CAD geometry, magnified
    if (lensOn){
      ctx.save();
      ctx.beginPath(); ctx.arc(mx, my, R-1.5, 0, Math.PI*2); ctx.clip();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(1,20,58,${.55*mon})`; ctx.fillRect(mx-R, my-R, R*2, R*2);
      ctx.globalCompositeOperation = 'lighter';
      const DX = detail.X, DY = detail.Y, DZ = detail.Z, DR = detail.RN, DN = detail.N;
      for (let c=0;c<DCOLS.length;c++){
        ctx.fillStyle = DCOLS[c]; ctx.globalAlpha = (.5 + .5*c/(DCOLS.length-1)) * mon;
        ctx.beginPath();
        for (let i=c;i<DN;i+=DCOLS.length){
          cam(DX[i], DY[i], DZ[i], P);
          const dx = P[0]-mx, dy = P[1]-my;
          if (dx*dx + dy*dy > Rin2) continue;
          if (P[2] > .06) continue;                        // back faces stay out of the lens: clarity
          const qx = mx + dx*M, qy = my + dy*M;
          ctx.rect(qx-.5, qy-.5, 1, 1);
        }
        ctx.fill();
      }
      // these points: also redraw main model points inside lens crisply
      ctx.globalAlpha = .9*mon; ctx.fillStyle = '#A8CBFD';
      // magnified CAD lines
      ctx.globalCompositeOperation = 'source-over';
      ctx.translate(mx, my); ctx.scale(M, M); ctx.translate(-mx, -my);
      ctx.lineWidth = 1/M;
      const W2 = d.W/2*1.045, D2 = d.D/2*1.045;
      for (let f=0; f<=d.floors; f++){
        const y = T.floorY(f);
        ctx.strokeStyle = f === level ? 'rgba(244,247,248,.95)' : f % 5 === 0 ? 'rgba(168,203,253,.75)' : 'rgba(108,167,249,.45)';
        ring(cam, y, W2, D2); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(108,167,249,.35)';
      for (let m=1;m<8;m++){
        const x = -W2 + m*(2*W2/8);
        cam(x,d.y0,D2,P); ctx.beginPath(); ctx.moveTo(P[0],P[1]); cam(x,d.y1,D2,P); ctx.lineTo(P[0],P[1]); ctx.stroke();
      }
      for (let m=1;m<5;m++){
        const z = -D2 + m*(2*D2/5);
        [W2,-W2].forEach(xx => { cam(xx,d.y0,z,P); ctx.beginPath(); ctx.moveTo(P[0],P[1]); cam(xx,d.y1,z,P); ctx.lineTo(P[0],P[1]); ctx.stroke(); });
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // sweep plane — prominent, opaque, labelled
    if (raw < 1){
      const w = d.W*.66, z = d.D*.70;
      ring(cam, sweep, w, z);
      ctx.fillStyle = 'rgba(26,124,255,.20)'; ctx.fill();
      ctx.strokeStyle = 'rgba(168,203,253,.95)'; ctx.lineWidth = 1.4; ctx.stroke();
      ring(cam, sweep, w*1.18, z*1.25);
      ctx.strokeStyle = 'rgba(108,167,249,.35)'; ctx.lineWidth = 1; ctx.stroke();
      // current-slab outline
      ring(cam, levelY, d.W/2*1.05, d.D/2*1.05);
      ctx.strokeStyle = 'rgba(244,247,248,.85)'; ctx.lineWidth = 1.2; ctx.stroke();
      cam(w*1.18, sweep, z*1.25, P);
      ctx.font = `500 ${small?9.5:10.5}px "IBM Plex Mono", monospace`;
      ctx.fillStyle = '#A8CBFD';
      ctx.fillText(`L${String(level).padStart(2,'0')} · CAPTURING`, P[0] + 8, P[1] + 4);
    }

    // pins: pop as the sweep passes; labels in A, lens-revealed in B
    let labelsShown = 0;
    for (let j=0;j<PINS.length;j++){
      const i = pinIdx[j]; if (i < 0) continue;
      if (Y[i] > sweep + .005 && raw < 1) continue;
      if (pinBorn[j] < 0) pinBorn[j] = t;
      const pop = Math.min(1, (t - pinBorn[j]) / .45);
      const popE = 1 - Math.pow(1 - pop, 3);
      cam(X[i], Y[i], Z[i], P);
      if (P[2] > .07) continue;                            // facing away
      let x = P[0], y = P[1];
      let inLens = false;
      if (focus && mon > .04){
        const dx = x - mx, dy = y - my, dd = dx*dx + dy*dy;
        if (dd < Rin2){ x = mx + dx*M; y = my + dy*M; inLens = true; }
        else if (dd < R2) continue;
      }
      pinMark(x, y, popE);
      const side = small ? (x > W/2 ? -1 : 1) : (j % 2 ? -1 : 1);
      if (!focus){
        if (labelsShown >= (small ? 1 : 3)) continue;
        // A: show label while recent (keeps the field readable)
        const age = t - pinBorn[j];
        const a = age < 3.2 ? 1 : Math.max(0, 1 - (age - 3.2)/.6);
        if (a > .01){ label(x, y, side, PINS[j].t, PINS[j].s, a * popE, popE); labelsShown++; }
      } else if (inLens){
        label(x, y, x > mx ? 1 : -1, PINS[j].t, PINS[j].s, mon, 1);
      }
    }

    // lens chrome
    if (lensOn){
      ctx.strokeStyle = `rgba(168,203,253,${.9*mon})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(mx, my, R, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = `rgba(26,124,255,${.45*mon})`; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(mx, my, R+4, 0, Math.PI*2); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = `rgba(168,203,253,${.7*mon})`;
      for (let a=0;a<36;a++){
        const an = a/36*Math.PI*2, l = a % 9 === 0 ? 10 : 4;
        ctx.beginPath(); ctx.moveTo(mx+Math.cos(an)*(R+8), my+Math.sin(an)*(R+8)); ctx.lineTo(mx+Math.cos(an)*(R+8+l), my+Math.sin(an)*(R+8+l)); ctx.stroke();
      }
      ctx.setLineDash([2,4]); ctx.strokeStyle = `rgba(168,203,253,${.35*mon})`;
      ctx.beginPath(); ctx.moveTo(mx-R*.3, my); ctx.lineTo(mx+R*.3, my); ctx.moveTo(mx, my-R*.3); ctx.lineTo(mx, my+R*.3); ctx.stroke(); ctx.setLineDash([]);
      const lvl = Math.round(Math.max(0, Math.min(1, (cy + S*.5 - my) / (S*.95))) * d.floors);
      ctx.font = '500 10.5px "IBM Plex Mono", monospace'; ctx.fillStyle = `rgba(168,203,253,${mon})`;
      ctx.fillText(`×1.9 · L${String(lvl).padStart(2,'0')} · RESOLVED`, mx - R*.62, my + R + 30);
    }

    if (readout && now - lastRO > 400){
      lastRO = now;
      readout.innerHTML = `MODEL <b>TP-01</b><br>POINTS <b>${(N + (focus ? detail.N : 0)).toLocaleString()}</b><br>CAPTURE <b>L${String(level).padStart(2,'0')} / ${d.floors}</b><br>MODE <b>${focus?'FOCUS LENS':'DISPLACE'}</b>`;
    }
  }

  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
