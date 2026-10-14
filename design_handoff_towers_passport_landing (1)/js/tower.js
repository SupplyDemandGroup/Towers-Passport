/* Towers Passport — shared tower geometry.
   One tower, used by the hero cloud and the FORM→BUILT→CAPTURED story,
   so it is literally the same asset in every view. */
(function(){
  const T = {};
  // Normalised tower: y 0 (ground) → 1 (crown). Units ≈ tower height.
  T.dims = {
    podW:.50, podD:.38, podH:.06,
    W:.30, D:.20, y0:.06, y1:.955, crownH:.045,
    floors:30
  };
  const d = T.dims;
  T.floorY = i => d.y0 + (d.y1 - d.y0) * (i / d.floors);

  // Palette ramp (all from the nine swatches; intermediate steps are straight mixes)
  const hex = h => [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const STOPS = ['#003070','#004AAD','#1A7CFF','#6CA7F9','#A8CBFD','#F4F7F8'].map(hex);
  function rampAt(t){ // t 0..1 across stops
    t = Math.max(0, Math.min(1, t)) * (STOPS.length - 1);
    const i = Math.min(STOPS.length - 2, Math.floor(t)), f = t - i;
    const a = STOPS[i], b = STOPS[i+1];
    return [0,1,2].map(k => Math.round(a[k] + (b[k]-a[k]) * f));
  }
  T.ramp = (n, from=0, to=1) => Array.from({length:n}, (_,i) => {
    const c = rampAt(from + (to-from) * (i/(n-1))); return `rgb(${c[0]},${c[1]},${c[2]})`;
  });
  T.YELLOW = '#F2CB07';

  // Seeded RNG so the tower is identical on every load
  function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* Build N points.
     Each point: surface pos (x,y,z), "design" pos (snapped to nearest slab line),
     height h (0..1), flags: built subset, interior (captured-only), rand. */
  T.build = function(N, seed=7){
    const R = rng(seed);
    const X = new Float32Array(N), Y = new Float32Array(N), Z = new Float32Array(N);
    const EY = new Float32Array(N), RN = new Float32Array(N);
    const FL = new Uint8Array(N); // bit0 built-subset, bit1 interior, bit2 slab
    const W2 = d.W/2, D2 = d.D/2, PW2 = d.podW/2, PD2 = d.podD/2;
    const perim = 2*(d.W + d.D);
    for (let i=0;i<N;i++){
      const r = R(); let x,y,z, ey, f = 0;
      if (r < .16){ // interior floor plates — the "full volume" of the twin
        const fi = 1 + Math.floor(R()*d.floors);
        y = T.floorY(fi) + (R()-.5)*.002; ey = y;
        x = (R()-.5)*d.W*.96; z = (R()-.5)*d.D*.96; f |= 2;
        // services: some points cluster on two vertical risers
        if (R() < .3){ x = (R()<.5?-1:1)*d.W*.18 + (R()-.5)*.01; z = (R()-.5)*.02; y = d.y0 + R()*(d.y1-d.y0); ey = y; }
      } else if (r < .22){ // podium
        const t = R()*2*(d.podW+d.podD);
        y = R()*d.podH; ey = y < d.podH/2 ? 0 : d.podH;
        if (t < d.podW){ x = -PW2 + t; z = PD2; }
        else if (t < d.podW+d.podD){ x = PW2; z = -PD2 + (t-d.podW); }
        else if (t < 2*d.podW+d.podD){ x = PW2 - (t-d.podW-d.podD); z = -PD2; }
        else { x = -PW2; z = PD2 - (t-2*d.podW-d.podD); }
        if (R() < .35){ y = d.podH; x = (R()-.5)*d.podW; z = (R()-.5)*d.podD; ey = y; } // podium roof / landscape
      } else if (r < .25){ // crown frame
        y = d.y1 + R()*d.crownH; ey = d.y1 + d.crownH;
        const t = R()*perim; ({x,z} = onPerim(t, W2*1.02, D2*1.02));
      } else { // tower facade
        const t = R()*perim; ({x,z} = onPerim(t, W2, D2));
        const fi = Math.round(R()*d.floors);
        const fy = T.floorY(fi);
        if (R() < .46){ // slab edge / balcony band — pushed slightly outward
          y = fy + (R()-.5)*.0035; f |= 4;
          const k = 1.045; x *= k; z *= k;
        } else {
          y = d.y0 + R()*(d.y1-d.y0);
          // mullion bias: snap some points to vertical mullion lines
          if (R() < .25){ const m = 8; x = Math.round(x/(d.W/m))*(d.W/m); }
        }
        // nearest slab line for the design drawing
        const fl = Math.round((y - d.y0)/((d.y1-d.y0)/d.floors));
        ey = T.floorY(Math.max(0, Math.min(d.floors, fl)));
      }
      X[i]=x; Y[i]=y; Z[i]=z; EY[i]=ey; RN[i]=R();
      if (R() < .5) f |= 1;
      FL[i]=f;
    }
    return {N, X, Y, Z, EY, RN, FL};
  };
  function onPerim(t, w2, d2){
    const W = w2*2, D = d2*2;
    if (t < W) return {x:-w2 + t, z:d2};
    if (t < W+D) return {x:w2, z:d2 - (t-W)};
    if (t < 2*W+D) return {x:w2 - (t-W-D), z:-d2};
    return {x:-w2, z:-d2 + (t-2*W-D)};
  }

  // Camera: rotate about Y by th, tilt about X by ph, perspective.
  T.camera = function(th, ph, cx, cy, S, persp=2.6){
    const c = Math.cos(th), s = Math.sin(th), cp = Math.cos(ph), sp = Math.sin(ph);
    return function(x, y, z, out){
      const yc = y - .5;
      const x1 = x*c + z*s, z1 = -x*s + z*c;
      const y2 = yc*cp - z1*sp, z2 = yc*sp + z1*cp;
      const k = persp / (persp + z2);
      out[0] = cx + x1*S*k; out[1] = cy - y2*S*k; out[2] = z2; out[3] = k;
      return out;
    };
  };

  window.TPTower = T;
})();
