/* The spatial story — one tower, three stages, driven by scroll.
   FORM: CAD elevation drawing.  BUILT: interval scan compared to the design.
   CAPTURED: full-volume as-built twin.  Same geometry, same camera arc. */
(function(){
  const T = window.TPTower;
  const html = document.documentElement;
  const track = document.getElementById('storyTrack');
  const canvas = document.getElementById('storyCanvas');
  if (!track || !canvas || !html.classList.contains('motion')) return;
  const ctx = canvas.getContext('2d');
  const steps = [...document.querySelectorAll('.story-step')];
  const ro = document.getElementById('storyReadout');
  const d = T.dims;

  let W=0,H=0,DPR=1, small=false, model=null;
  const BUCK = 16;
  const RAMP_BUILT = T.ramp(BUCK, .12, .74);   // Cobalt Blue → Sky Current/Ice
  const RAMP_CAP   = T.ramp(BUCK, .20, 1.0);   // → Ice Veil → Signal Mist
  let px, py, pb, ps;
  let issues = [];
  const ISSUE_LBL = ['L08 · SLAB EDGE','L14 · PENETRATION','L19 · BALUSTRADE','L24 · FACADE','L27 · SERVICES'];

  function build(){
    small = innerWidth < 760;
    model = T.build(small ? 8000 : 17000, 23);
    px = new Float32Array(model.N); py = new Float32Array(model.N); pb = new Uint8Array(model.N); ps = new Float32Array(model.N);
    issues = [];
    const hs = [.27,.47,.63,.79,.89];
    hs.forEach(h => {
      let best=-1, bd=1;
      for (let i=0;i<model.N;i++){ const f = model.FL[i]; if ((f&2) || !(f&1)) continue; if (model.Z[i] < d.D/2 - .001) continue; const dd = Math.abs(model.Y[i]-h) + Math.abs(model.X[i] - (h*.6-.3)*d.W)*.3; if (dd<bd){bd=dd;best=i;} }
      issues.push(best);
    });
  }
  function resize(){
    const r = canvas.getBoundingClientRect();
    DPR = Math.min(2, devicePixelRatio||1); W = r.width; H = r.height;
    canvas.width = Math.round(W*DPR); canvas.height = Math.round(H*DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    if (!model || small !== (innerWidth<760)) build();
    dirty = true;
  }

  const ss = (a,b,x) => { const t = Math.max(0, Math.min(1, (x-a)/(b-a))); return t*t*(3-2*t); };
  let target = 0, prog = 0, dirty = true, visible = false, t0 = performance.now();

  function readProgress(){
    const r = track.getBoundingClientRect();
    const total = r.height - innerHeight;
    target = Math.max(0, Math.min(1, -r.top / total));
  }
  addEventListener('scroll', () => { readProgress(); }, {passive:true});
  function inView(){ const r = track.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }

  // tapping a stage jumps the scroll to it
  steps.forEach((s, i) => s.addEventListener('click', () => {
    const r = track.getBoundingClientRect();
    const total = r.height - innerHeight;
    const y = scrollY + r.top + total * [0.12, 0.52, 0.9][i];
    scrollTo({top:y, behavior:'smooth'});
  }));

  const P = [0,0,0,0], Q = [0,0,0,0];
  function line(cam, a, b, alpha){ cam(a[0],a[1],a[2],P); cam(b[0],b[1],b[2],Q); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.moveTo(P[0],P[1]); ctx.lineTo(Q[0],Q[1]); ctx.stroke(); }
  function partial(cam, a, b, f){ if (f<=0) return; cam(a[0],a[1],a[2],P); cam(b[0],b[1],b[2],Q); ctx.beginPath(); ctx.moveTo(P[0],P[1]); ctx.lineTo(P[0]+(Q[0]-P[0])*f, P[1]+(Q[1]-P[1])*f); ctx.stroke(); }

  function frame(now){
    requestAnimationFrame(frame);
    if (!inView() || html.dataset.story === 'b') return;
    readProgress();
    const t = (now - t0)/1000;
    prog += (target - prog) * .12;
    const p = prog;

    // stage weights
    const draw   = ss(.0, .24, p) * .85 + .15;         // CAD draw-in (starts partly drawn so a still frame isn't empty)
    const scan   = ss(.36, .64, p);                    // sweep height in BUILT
    const toBuilt= ss(.30, .40, p);
    const cap    = ss(.68, .86, p);
    const stage  = p < .34 ? 0 : p < .67 ? 1 : 2;

    ctx.clearRect(0,0,W,H);
    const S = Math.min(H*.86, W*(small?1.35:1.1));
    const cx = W*.5, cy = H*.53;
    const th = -.62 + p*1.0 + Math.sin(t*.25)*.02;
    const cam = T.camera(th, .10, cx, cy, S, 3.2);

    // ground grid
    ctx.strokeStyle = '#6CA7F9'; ctx.lineWidth = 1;
    for (let k=-5;k<=5;k++){
      line(cam, [k*.08,0,-.4],[k*.08,0,.4], .07);
      line(cam, [-.4,0,k*.08],[.4,0,k*.08], .07);
    }

    // ---------- FORM: CAD elevation ----------
    const lineA = (1 - toBuilt) * 1 + toBuilt * (1 - cap) * .22; // design ghost persists through BUILT for comparison
    if (lineA > .01){
      const W2 = d.W/2*1.045, D2 = d.D/2*1.045;
      const C = [[-W2,D2],[W2,D2],[W2,-D2],[-W2,-D2]];
      ctx.lineWidth = 1;
      // slabs
      for (let f=0; f<=d.floors; f++){
        const y = T.floorY(f);
        const fd = Math.max(0, Math.min(1, draw*1.6 - f/d.floors*.6));
        ctx.strokeStyle = f % 5 === 0 ? '#6CA7F9' : '#1A7CFF';
        ctx.globalAlpha = lineA * (f%5===0 ? .9 : .55);
        for (let e=0;e<4;e++){
          const a = C[e], b = C[(e+1)%4];
          cam(a[0],y,a[1],P);
          const back = P[2] > 0;
          ctx.globalAlpha = lineA * (back ? .18 : (f%5===0 ? .9 : .55));
          partial(cam, [a[0],y,a[1]], [b[0],y,b[1]], fd);
        }
      }
      // corner edges
      ctx.strokeStyle = '#A8CBFD';
      C.forEach(c => { cam(c[0], .5, c[1], P); ctx.globalAlpha = lineA * (P[2] > .02 ? .2 : .85); partial(cam, [c[0],d.y0,c[1]],[c[0],d.y1+d.crownH,c[1]], draw); });
      // mullions on the two nearest faces
      ctx.strokeStyle = '#1A7CFF';
      for (let m=1;m<8;m++){
        const x = -W2 + m*(2*W2/8);
        ctx.globalAlpha = lineA*.38; partial(cam, [x,d.y0,D2],[x,d.y1,D2], draw);
        ctx.globalAlpha = lineA*.14; partial(cam, [x,d.y0,-D2],[x,d.y1,-D2], draw);
      }
      for (let m=1;m<5;m++){
        const z = -D2 + m*(2*D2/5);
        ctx.globalAlpha = lineA*.3; partial(cam, [W2,d.y0,z],[W2,d.y1,z], draw); partial(cam, [-W2,d.y0,z],[-W2,d.y1,z], draw);
      }
      // podium box
      ctx.strokeStyle = '#6CA7F9';
      const PW = d.podW/2, PD = d.podD/2;
      const PC = [[-PW,PD],[PW,PD],[PW,-PD],[-PW,-PD]];
      [0, d.podH].forEach(y => PC.forEach((a,i)=>{ const b = PC[(i+1)%4]; ctx.globalAlpha = lineA*.6; partial(cam,[a[0],y,a[1]],[b[0],y,b[1]], draw); }));
      PC.forEach(c => { ctx.globalAlpha = lineA*.5; partial(cam,[c[0],0,c[1]],[c[0],d.podH,c[1]], draw); });
      // construction lines + dimension string (FORM only)
      const formOnly = (1 - toBuilt);
      if (formOnly > .01){
        ctx.setLineDash([3,5]); ctx.strokeStyle = '#5B7B8A';
        [d.y0, d.y1, d.y1 + d.crownH].forEach(y => { ctx.globalAlpha = formOnly*.6*draw; line(cam, [-d.podW*.9, y, D2], [d.podW*.9, y, D2], formOnly*.6*draw); });
        ctx.setLineDash([]);
        // dimension line at right
        const dx = W2 + .09;
        ctx.strokeStyle = '#A8CBFD'; ctx.globalAlpha = formOnly*.85*draw;
        line(cam, [dx, 0, D2], [dx, d.y1 + d.crownH, D2], formOnly*.85*draw);
        ctx.font = `500 ${small?9:10.5}px "IBM Plex Mono", monospace`;
        for (let f=0; f<=d.floors; f+=5){
          const y = T.floorY(f);
          cam(dx, y, D2, P);
          ctx.globalAlpha = formOnly*draw; ctx.fillStyle = '#A8CBFD';
          ctx.fillRect(P[0]-4, P[1]-.5, 8, 1);
          ctx.fillStyle = '#6CA7F9'; ctx.fillText(`L${String(f).padStart(2,'0')}`, P[0]+10, P[1]+3.5);
        }
        // arrowheads
        cam(dx, d.y1 + d.crownH, D2, P); ctx.fillStyle = '#A8CBFD'; ctx.beginPath(); ctx.moveTo(P[0],P[1]); ctx.lineTo(P[0]-3,P[1]+7); ctx.lineTo(P[0]+3,P[1]+7); ctx.fill();
        cam(dx, 0, D2, P); ctx.beginPath(); ctx.moveTo(P[0],P[1]); ctx.lineTo(P[0]-3,P[1]-7); ctx.lineTo(P[0]+3,P[1]-7); ctx.fill();
        // title block tag
        cam(-d.podW*.9, d.y1 + d.crownH, D2, P);
        ctx.globalAlpha = formOnly*draw; ctx.fillStyle = '#A8CBFD';
        ctx.fillText('ELEV · DESIGN MODEL · CAD/BIM', P[0], P[1]-10);
      }
    }
    ctx.globalAlpha = 1;

    // ---------- BUILT + CAPTURED: points ----------
    if (toBuilt > .01){
      const N = model.N, X = model.X, Y = model.Y, Z = model.Z, EY = model.EY, RN = model.RN, FL = model.FL;
      const sweepY = scan * (d.y1 + d.crownH + .01);
      const jitter = (1 - cap) * .006;
      const RAMP = cap > .5 ? RAMP_CAP : RAMP_BUILT;
      for (let i=0;i<N;i++){
        const f = FL[i];
        let a; // visibility
        if (f & 2){ a = cap; }                       // interior volume — captured only
        else if (f & 1){ a = Y[i] <= sweepY ? 1 : 0; a = Math.max(a, cap); } // scanned subset
        else { a = cap; }                            // densify in captured
        if (a < .5){ pb[i] = 255; continue; }
        // scan noise: points sit slightly off design until captured
        const jx = (RN[i]-.5)*jitter, jy = ((RN[(i*7)%N])-.5)*jitter;
        cam(X[i]+jx, Y[i]+jy, Z[i], P);
        px[i] = P[0]; py[i] = P[1];
        let b = (Y[i]*.8 + RN[i]*.2) * (BUCK-1) - Math.max(0,P[2])*7;
        if (cap < .5){ const sd = sweepY - Y[i]; if (sd >= 0 && sd < .04 && scan < 1) b += (1 - sd/.04)*8; }
        else b += 2 + RN[i]*2;
        pb[i] = b < 0 ? 0 : b > BUCK-1 ? BUCK-1 : b|0;
        ps[i] = (small?1.3:1.45) * P[3] * (1 + cap*.25);
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let b=0;b<BUCK;b++){
        ctx.fillStyle = RAMP[b];
        ctx.globalAlpha = (.25 + .6*(b/(BUCK-1))) * toBuilt;
        ctx.beginPath();
        for (let i=0;i<N;i++){ if (pb[i]===b){ const s = ps[i]; ctx.rect(px[i]-s*.5, py[i]-s*.5, s, s); } }
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

      // scan plane
      if (scan > 0 && scan < 1 && cap < .5){
        const W2 = d.W*.68, D2 = d.D*.75;
        ctx.strokeStyle = '#A8CBFD'; ctx.lineWidth = 1.2; ctx.globalAlpha = .9;
        ctx.beginPath();
        [[-W2,D2],[W2,D2],[W2,-D2],[-W2,-D2],[-W2,D2]].forEach((c,j)=>{ cam(c[0],sweepY,c[1],P); j?ctx.lineTo(P[0],P[1]):ctx.moveTo(P[0],P[1]); });
        ctx.stroke();
        ctx.globalAlpha = .12; ctx.fillStyle = '#6CA7F9'; ctx.fill(); ctx.globalAlpha = 1;
      }

      // issue markers + leader lines
      ctx.font = `500 ${small?9.5:10.5}px "IBM Plex Mono", monospace`;
      issues.forEach((i, j) => {
        if (i < 0) return;
        if (Y[i] > sweepY && cap < .5) return;
        cam(X[i], Y[i], Z[i], P);
        const x = P[0], y = P[1];
        const conf = cap > .5 || (sweepY - Y[i]) > .12;
        ctx.fillStyle = '#F2CB07'; ctx.strokeStyle = '#F2CB07'; ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4); ctx.fillRect(-3,-3,6,6); ctx.strokeRect(-7,-7,14,14); ctx.restore();
        if (cap > .9 && small) return;
        const side = j % 2 ? -1 : 1;
        const lx = cx + side * S * (small ? .3 : .36), ly = y;
        ctx.globalAlpha = .75; ctx.beginPath(); ctx.moveTo(x + side*9, y); ctx.lineTo(lx, ly); ctx.stroke();
        ctx.globalAlpha = 1;
        const txt = ISSUE_LBL[j], st = cap > .5 ? 'RECORDED' : conf ? 'CONFIRMED' : 'FLAGGED';
        const tw = Math.max(ctx.measureText(txt).width, ctx.measureText(st).width) + 14;
        const bx = side > 0 ? lx : lx - tw;
        ctx.fillStyle = 'rgba(1,20,58,.86)'; ctx.fillRect(bx, ly-15, tw, 30);
        ctx.strokeStyle = 'rgba(242,203,7,.6)'; ctx.strokeRect(bx+.5, ly-14.5, tw-1, 29);
        ctx.fillStyle = '#F4F7F8'; ctx.fillText(txt, bx+7, ly-2);
        ctx.fillStyle = conf ? '#F2CB07' : '#A8CBFD'; ctx.fillText(st, bx+7, ly+10);
      });
    }

    // ---------- chrome ----------
    steps.forEach((s, i) => {
      const lo = [0,.34,.67][i], hi = [.34,.67,1][i];
      const local = Math.max(0, Math.min(1, (p - lo)/(hi-lo)));
      s.classList.toggle('active', stage === i);
      s.querySelector('.bar').style.transform = `scaleX(${local})`;
    });
    if (ro){
      const mode = ['FORM','BUILT','CAPTURED'][stage];
      const src = ['CAD / BIM','INTERVAL SCAN','AS-BUILT TWIN'][stage];
      const shown = stage === 0 ? 0 : stage === 1 ? Math.round(model.N*.5*scan*.96) : model.N;
      const flagged = stage === 0 ? 0 : issues.filter(i => model.Y[i] <= scan*(d.y1+.05)).length;
      ro.innerHTML = `MODE <b>${mode}</b><br>SOURCE <b>${src}</b><br>POINTS <b>${shown.toLocaleString()}</b><br>ISSUES <span class="m">${stage===2?issues.length+' RECORDED':String(flagged).padStart(2,'0')}</span><br>MODEL <b>TP-01 · SAME ASSET</b>`;
    }
  }

  addEventListener('resize', resize);
  resize(); readProgress(); prog = target;
  requestAnimationFrame(frame);
})();
