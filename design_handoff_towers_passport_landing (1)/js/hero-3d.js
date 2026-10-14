/* Hero — Option C: interactive 3D tower (three.js r149, loaded on demand).
   Hybrid: a finished tower (glass, white slab edges, lit apartments) that dissolves into the
   branded Gaussian-splat-style cloud via a rising yellow riser, and back.
   Controls: drag ↔ orbit, drag ↕ tilt (mouse/pen; clamped above ground), auto-spin when idle.
   Touch: horizontal drag rotates, vertical swipe scrolls the page (touch-action: pan-y).
   Pins are fixed to the model, rotate with it, and show labels on hover/tap. */
(function(){
  const html = document.documentElement;
  const canvas = document.getElementById('hero3d');
  if (!canvas || !html.classList.contains('motion')) return;
  const T = window.TPTower, d = T.dims, SC = 10;
  const hero = canvas.closest('.hero');
  const layer = document.getElementById('h3dLayer');
  const ui = document.getElementById('h3dUI');
  const readout = document.getElementById('heroReadout');

  const PINS = [
    { t:'L00 · LOBBY',          s:'Neighbourhood layer · from the front door', p:[1.2, d.podH*SC*.3, d.podD/2*SC + .02], n:[0,0,1] },
    { t:'L02 · PODIUM',         s:'Amenity walkthrough · open 24/7',  p:[-1.4, d.podH*SC*.55, d.podD/2*SC + .02], n:[0,0,1] },
    { t:'L04 · PRE-FORMWORK',   s:'Structure captured before the pour', f:4,  face:'left',  u:.4 },
    { t:'L06 · PRE-PLUMBING',   s:'Services recorded before sealing',  f:6,  face:'back',  u:-.5 },
    { t:'L08 · SLAB EDGE',      s:'Design vs scan · deviation flagged', f:8,  face:'front', u:.62 },
    { t:'L10 · APARTMENT 1002', s:'Furnished walkthrough · 2 bed',     f:10, face:'right', u:-.4 },
    { t:'L12 · SERVICES',       s:'Recorded before linings',          f:12, face:'right', u:.35 },
    { t:'L14 · PRE-GYPROCK',    s:'Framing and conduit on record',    f:14, face:'front', u:-.15 },
    { t:'L17 · APARTMENT 1704', s:'Real view from this level',        f:17, face:'front', u:-.55 },
    { t:'L19 · PROGRESS',       s:'Branded buyer update · this month', f:19, face:'left',  u:-.45 },
    { t:'L22 · BALUSTRADE',     s:'Defect evidence · time-stamped',   f:22, face:'back',  u:.2 },
    { t:'L24 · FACADE',         s:'AI-flagged · confirmed by a builder', f:24, face:'front', u:.3 },
    { t:'L26 · REFRAME',        s:'Restyle any room with a sentence', f:26, face:'right', u:.1 },
    { t:'L28 · SUB-PENTHOUSE',  s:'Live availability · level & aspect', f:28, face:'left', u:-.3 },
    { t:'L30 · CROWN',          s:'As-built twin · handover pack',    f:30, face:'back', u:-.6 }
  ];
  const W2 = d.W/2*SC, D2 = d.D/2*SC, TOP = (d.y1 + d.crownH)*SC;
  PINS.forEach(pin => {
    if (pin.p) return;
    const y = T.floorY(pin.f)*SC + .16;
    const o = 1.06;
    if (pin.face === 'front'){ pin.p = [pin.u*W2, y, D2*o]; pin.n = [0,0,1]; }
    if (pin.face === 'back'){  pin.p = [pin.u*W2, y, -D2*o]; pin.n = [0,0,-1]; }
    if (pin.face === 'right'){ pin.p = [W2*o, y, pin.u*D2]; pin.n = [1,0,0]; }
    if (pin.face === 'left'){  pin.p = [-W2*o, y, pin.u*D2]; pin.n = [-1,0,0]; }
  });

  let started = false, ok = false, THREE, renderer, scene, camera, points, ptsMat, solid, clip, riser, ground;
  let W = 0, H = 0, small = false, density = (window.TP_TWEAKS && window.TP_TWEAKS.density) || 3;
  const active = () => html.dataset.hero === '3d';

  window.TPHero3D = {
    ensure(){ if (started) return; started = true; load(init); },
    setDensity(v){ density = v; if (ok) buildPoints(); }
  };

  function load(cb){
    if (window.THREE) return cb();
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/three@0.149.0/build/three.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = cb;
    s.onerror = () => { html.dataset.hero = 'focus'; window.TPHero && TPHero.setMode('focus'); };
    document.head.appendChild(s);
  }

  /* ---------- photoreal finished tower (AI facade textures, PBR + env reflections) ---------- */
  const TL = new Map();
  function tex(url, srgb = true, rep){
    if (TL.has(url)) return TL.get(url);
    const t = new THREE.TextureLoader().load(url);
    if (srgb) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
    if (rep){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    TL.set(url, t); return t;
  }
  function makeEnv(){
    const W = 2048, H = 1024, hz = H*.52;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const sky = g.createLinearGradient(0,0,0,hz);
    sky.addColorStop(0, '#061636'); sky.addColorStop(.45, '#13428a'); sky.addColorStop(.78, '#5d86c4'); sky.addColorStop(.93, '#c9b6c4'); sky.addColorStop(1, '#f2c39a');
    g.fillStyle = sky; g.fillRect(0,0,W,hz);
    // sun glow (azimuth ≈ key light)
    const sx = W*.30, sun = g.createRadialGradient(sx, hz, 0, sx, hz, H*.55);
    sun.addColorStop(0, 'rgba(255,214,160,.95)'); sun.addColorStop(.18, 'rgba(255,170,120,.45)'); sun.addColorStop(1, 'rgba(255,150,120,0)');
    g.fillStyle = sun; g.fillRect(0,0,W,hz);
    // soft cloud streaks, warm undersides
    let r = 7; const R = () => (r = (r*16807) % 2147483647) / 2147483647;
    for (let i=0;i<46;i++){
      const x = R()*W, y = hz*(.35 + R()*.55), w = 120 + R()*420, h = 6 + R()*18;
      const cg = g.createLinearGradient(0, y-h, 0, y+h);
      cg.addColorStop(0, 'rgba(180,200,235,.10)'); cg.addColorStop(1, 'rgba(255,190,150,.22)');
      g.fillStyle = cg; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, Math.PI*2); g.fill();
    }
    // ocean / ground below the horizon
    const sea = g.createLinearGradient(0,hz,0,H);
    sea.addColorStop(0, '#2b3f63'); sea.addColorStop(.12, '#0e2347'); sea.addColorStop(1, '#030a1a');
    g.fillStyle = sea; g.fillRect(0,hz,W,H-hz);
    const glint = g.createRadialGradient(sx, hz+4, 0, sx, hz+4, 260);
    glint.addColorStop(0, 'rgba(255,200,150,.55)'); glint.addColorStop(1, 'rgba(255,200,150,0)');
    g.fillStyle = glint; g.fillRect(sx-300, hz, 600, 200);
    // city lights band on the horizon (Surfers Paradise skyline glow)
    for (let i=0;i<900;i++){
      const x = R()*W, y = hz - R()*R()*26, a = .25 + R()*.75;
      g.fillStyle = R() < .8 ? `rgba(255,${200+R()*40|0},${140+R()*50|0},${a})` : `rgba(180,210,255,${a})`;
      g.fillRect(x, y, 1 + R()*2, 1 + R()*3);
    }
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding;
    const pm = new THREE.PMREMGenerator(renderer);
    const env = pm.fromEquirectangular(t).texture; t.dispose(); pm.dispose();
    return env;
  }
  function contactShadow(){
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), rg = g.createRadialGradient(128,128,10,128,128,128);
    rg.addColorStop(0, 'rgba(0,6,20,.85)'); rg.addColorStop(.55, 'rgba(0,6,20,.35)'); rg.addColorStop(1, 'rgba(0,6,20,0)');
    g.fillStyle = rg; g.fillRect(0,0,256,256);
    return new THREE.CanvasTexture(c);
  }
  function roundedRect(w, dd, r){
    const s = new THREE.Shape(), x = -w/2, z = -dd/2;
    s.moveTo(x + r, z); s.lineTo(x + w - r, z); s.quadraticCurveTo(x + w, z, x + w, z + r);
    s.lineTo(x + w, z + dd - r); s.quadraticCurveTo(x + w, z + dd, x + w - r, z + dd);
    s.lineTo(x + r, z + dd); s.quadraticCurveTo(x, z + dd, x, z + dd - r);
    s.lineTo(x, z + r); s.quadraticCurveTo(x, z, x + r, z);
    return s;
  }
  function buildSolid(){
    solid = new THREE.Group();
    clip = new THREE.Plane(new THREE.Vector3(0,-1,0), 1e4);
    const C = { clippingPlanes:[clip], clipShadows:true };
    scene.environment = makeEnv();

    const th = (d.y1 - d.y0)*SC, y0 = d.y0*SC, fh = th / d.floors;
    const white = new THREE.MeshPhysicalMaterial(Object.assign({ color:0xe2e5e4, roughness:.62, metalness:0, clearcoat:.2, clearcoatRoughness:.55, envMapIntensity:.55 }, C));
    const whiteEdge = new THREE.MeshPhysicalMaterial(Object.assign({ color:0xf7f7f4, roughness:.38, metalness:0, clearcoat:.4, clearcoatRoughness:.3, envMapIntensity:.8 }, C));
    const fM = tex('assets/tex/front.jpg'), fE = tex('assets/tex/front-emit.jpg');
    const sM = tex('assets/tex/side.jpg'),  sE = tex('assets/tex/side-emit.jpg');
    const glassF = new THREE.MeshPhysicalMaterial(Object.assign({ map:fM, emissiveMap:fE, emissive:0xffcf94, emissiveIntensity:2.8, roughness:.08, metalness:.35, clearcoat:1, clearcoatRoughness:.03, envMapIntensity:1.9 }, C));
    const glassS = new THREE.MeshPhysicalMaterial(Object.assign({ map:sM, emissiveMap:sE, emissive:0xffcf94, emissiveIntensity:2.8, roughness:.08, metalness:.35, clearcoat:1, clearcoatRoughness:.03, envMapIntensity:1.9 }, C));
    const roof = new THREE.MeshStandardMaterial(Object.assign({ color:0xb9c0c4, roughness:.85 }, C));

    // core: textured box faces (front/back = 8-bay elevation, sides = 5-bay elevation)
    const core = new THREE.Mesh(new THREE.BoxGeometry(W2*2, th, D2*2), [glassS, glassS, roof, roof, glassF, glassF]);
    core.position.y = y0 + th/2; core.castShadow = true; core.receiveShadow = true; solid.add(core);

    // white rounded slab bands — the signature horizontal balcony edges
    const bandShape = roundedRect(W2*2*1.04, D2*2*1.08, .22);
    const bandGeo = new THREE.ExtrudeGeometry(bandShape, { depth:.034, bevelEnabled:true, bevelThickness:.006, bevelSize:.006, bevelSegments:1, curveSegments:10 });
    bandGeo.rotateX(Math.PI/2);
    const bands = new THREE.InstancedMesh(bandGeo, [white, whiteEdge], d.floors + 1);
    bands.castShadow = true; bands.receiveShadow = true;
    const glass = new THREE.MeshPhysicalMaterial(Object.assign({ color:0x9fc2ee, transparent:true, opacity:.16, roughness:.02, metalness:.2, envMapIntensity:2.2, depthWrite:false }, C));
    const balGeo = new THREE.ExtrudeGeometry(roundedRect(W2*2*1.035, D2*2*1.075, .215), { depth:.17, bevelEnabled:false, curveSegments:10 });
    balGeo.rotateX(-Math.PI/2);
    const bal = new THREE.InstancedMesh(balGeo, glass, d.floors);
    const m = new THREE.Matrix4();
    for (let f=0; f<=d.floors; f++){
      m.makeTranslation(0, T.floorY(f)*SC + .034, 0); bands.setMatrixAt(f, m);
      if (f < d.floors && f > 0){ m.makeTranslation(0, T.floorY(f)*SC + .034, 0); bal.setMatrixAt(f, m); }
    }
    bands.instanceMatrix.needsUpdate = true; bal.instanceMatrix.needsUpdate = true;
    solid.add(bands, bal);

    // white vertical blade walls on the short sides (as in the side elevation)
    const blade = new THREE.BoxGeometry(.08, th + .2, D2*.7);
    [-1, 1].forEach(sx => { const b = new THREE.Mesh(blade, white); b.castShadow = b.receiveShadow = true; b.position.set(sx*(W2 + .04), y0 + th/2 + .1, -D2*.32); solid.add(b); });

    // curved white crown sail — profile drawn in the long elevation (XY), extruded thin in Z
    const sw = W2*2*.96, rise = 1.35;
    const sail = new THREE.Shape();
    sail.moveTo(-sw/2, 0); sail.lineTo(sw/2, 0); sail.lineTo(sw/2, rise*.35);
    sail.quadraticCurveTo(sw*.1, rise*1.25, -sw/2, rise); sail.lineTo(-sw/2, 0);
    const hole = new THREE.Path();
    hole.moveTo(-sw/2 + .16, .16); hole.lineTo(sw/2 - .16, .16); hole.lineTo(sw/2 - .16, rise*.35 - .06);
    hole.quadraticCurveTo(sw*.1, rise*1.25 - .3, -sw/2 + .16, rise - .2); hole.lineTo(-sw/2 + .16, .16);
    sail.holes.push(hole);
    const sailGeo = new THREE.ExtrudeGeometry(sail, { depth:.1, bevelEnabled:true, bevelThickness:.012, bevelSize:.012, bevelSegments:1, curveSegments:20 });
    [D2*1.02, -D2*1.02 - .1].forEach(z => { const s = new THREE.Mesh(sailGeo, white); s.castShadow = true; s.position.set(0, y0 + th, z); solid.add(s); });
    const sailGlass = new THREE.Mesh(new THREE.ShapeGeometry(sail, 20), new THREE.MeshPhysicalMaterial(Object.assign({ color:0x6ca7f9, transparent:true, opacity:.14, roughness:.05, envMapIntensity:1.4, side:THREE.DoubleSide, depthWrite:false }, C)));
    sailGlass.position.set(0, y0 + th, D2*1.02 + .05); solid.add(sailGlass);
    // crown plant room + roof terrace glass
    const plant = new THREE.Mesh(new THREE.BoxGeometry(W2*1.3, .5, D2*1.6), glassF); plant.position.set(W2*.25, y0 + th + .25, 0); plant.castShadow = true; solid.add(plant);

    // podium: white plinth + lit lobby glazing + roof garden texture
    const PW = d.podW*SC, PD = d.podD*SC, PH = d.podH*SC;
    const podTop = new THREE.MeshStandardMaterial(Object.assign({ map:tex('assets/tex/podium.jpg'), roughness:.9 }, C));
    const podSide = new THREE.MeshPhysicalMaterial(Object.assign({ color:0xdfe2e0, roughness:.6, clearcoat:.15, envMapIntensity:.5 }, C));
    const pod = new THREE.Mesh(new THREE.BoxGeometry(PW, PH*.5, PD), [podSide, podSide, podTop, podSide, podSide, podSide]); pod.position.y = PH*.75; pod.castShadow = true; pod.receiveShadow = true; solid.add(pod);
    const lobby = new THREE.Mesh(new THREE.BoxGeometry(PW*.97, PH*.5, PD*.97), new THREE.MeshPhysicalMaterial(Object.assign({ color:0x14161a, emissive:0xffc27a, emissiveIntensity:.85, roughness:.15, clearcoat:1, envMapIntensity:1 }, C)));
    lobby.position.y = PH*.25; solid.add(lobby);

    const cs = new THREE.Mesh(new THREE.PlaneGeometry(PW*1.7, PD*1.9), new THREE.MeshBasicMaterial({ map:contactShadow(), transparent:true, depthWrite:false }));
    cs.rotation.x = -Math.PI/2; cs.position.y = .012; solid.add(cs);
    // (palms removed — the podium roof-garden texture carries the landscaping)
    // warm garden uplights
    const uplight = new THREE.PointLight(0xffc27a, .9, 7, 2); uplight.position.set(0, PH + .4, PD*.45); solid.add(uplight);
    scene.add(solid);
  }

  /* ---------- branded splat cloud (shared geometry with the 2D hero) ---------- */
  const VS = `
    uniform float uSweep, uDir, uSize, uPR, uTop, uBase;
    attribute float aRand;
    varying float vA; varying vec3 vCol;
    vec3 ramp(float t){
      vec3 c0=vec3(0.,.188,.439), c1=vec3(0.,.29,.678), c2=vec3(.102,.486,1.), c3=vec3(.424,.655,.976), c4=vec3(.659,.796,.992), c5=vec3(.957,.969,.973);
      t = clamp(t,0.,1.)*5.;
      if (t<1.) return mix(c0,c1,t); if (t<2.) return mix(c1,c2,t-1.); if (t<3.) return mix(c2,c3,t-2.); if (t<4.) return mix(c3,c4,t-3.); return mix(c4,c5,t-4.);
    }
    void main(){
      vec3 p = position;
      float dist = p.y - uSweep;
      float vis = uDir > 0. ? step(dist, 0.) : step(0., dist);
      float edge = 1. - smoothstep(0., .5, abs(dist));
      p.xz *= 1. + edge*.14*aRand;
      p.y += edge*(aRand-.5)*.4;
      vCol = ramp(p.y/uTop*.86 + aRand*.12) + edge*vec3(.55,.45,.0);
      vA = mix(uBase, 1., vis)*(.5 + .5*aRand) + edge*.7;
      vec4 mv = modelViewMatrix*vec4(p,1.);
      gl_PointSize = uSize*(.7 + aRand*.8)*uPR*(300./-mv.z)*(1. + edge*1.6);
      gl_Position = projectionMatrix*mv;
    }`;
  const FS = `
    varying float vA; varying vec3 vCol;
    void main(){ vec2 c = gl_PointCoord - .5; float r = dot(c,c); if (r > .25) discard; gl_FragColor = vec4(vCol, exp(-r*14.)*vA); }`;

  function buildPoints(){
    if (points){ scene.remove(points); points.geometry.dispose(); }
    const model = T.build(Math.round((small ? 7000 : 15000) * density), 11);
    const pos = new Float32Array(model.N*3), rnd = new Float32Array(model.N);
    for (let i=0;i<model.N;i++){ pos[i*3] = model.X[i]*SC; pos[i*3+1] = model.Y[i]*SC; pos[i*3+2] = model.Z[i]*SC; rnd[i] = model.RN[i]; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
    if (!ptsMat) ptsMat = new THREE.ShaderMaterial({
      vertexShader:VS, fragmentShader:FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ uSweep:{value:-1e4}, uDir:{value:1}, uSize:{value:.15}, uPR:{value:1}, uTop:{value:TOP}, uBase:{value:.16} }
    });
    points = new THREE.Points(g, ptsMat); points.frustumCulled = false;
    points.userData.n = model.N;
    scene.add(points);
  }

  function buildRiser(){
    riser = new THREE.Group();
    const y = new THREE.Color(0xF2CB07);
    const w = W2*2*1.5, dd = D2*2*1.7;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, dd), new THREE.MeshBasicMaterial({ color:y, transparent:true, opacity:.14, side:THREE.DoubleSide, depthWrite:false }));
    plane.rotation.x = -Math.PI/2; riser.add(plane);
    const pts = [[-w/2,0,-dd/2],[w/2,0,-dd/2],[w/2,0,dd/2],[-w/2,0,dd/2]].map(p => new THREE.Vector3(...p));
    riser.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color:y })));
    riser.visible = false; scene.add(riser);
  }

  function buildGround(){
    ground = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color:0x6ca7f9, transparent:true, opacity:.2 });
    for (let k=1;k<=5;k++){
      const pts = []; for (let a=0;a<=72;a++){ const an = a/72*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(an)*k*2.2, 0, Math.sin(an)*k*2.2)); }
      ground.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }
    const disc = new THREE.Mesh(new THREE.CircleGeometry(11, 64), new THREE.MeshBasicMaterial({ color:0x02204d, transparent:true, opacity:.55, depthWrite:false }));
    disc.rotation.x = -Math.PI/2; disc.position.y = -.01; ground.add(disc);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(11, 64), new THREE.ShadowMaterial({ color:0x000814, opacity:.72 }));
    sh.rotation.x = -Math.PI/2; sh.position.y = .002; sh.receiveShadow = true; ground.add(sh);
    scene.add(ground);
  }

  /* ---------- DOM: pins, label, riser tag ---------- */
  const pinEls = PINS.map(() => { const e = document.createElement('i'); e.className = 'h3d-pin'; layer.appendChild(e); return e; });
  const label = document.createElement('div'); label.className = 'h3d-label'; layer.appendChild(label);
  const tag = document.createElement('div'); tag.className = 'h3d-tag'; layer.appendChild(tag);
  const scr = PINS.map(() => ({x:0, y:0, on:false}));
  let hoverPin = -1, tapPin = -1, cyclePin = -1, lastHover = -9e9, lastCycle = 0;

  function init(){
    THREE = window.THREE;
    renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' });
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .94;
    renderer.physicallyCorrectLights = false;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, 1, .5, 200);
    scene.fog = new THREE.Fog(0x0b2552, 34, 80);
    scene.add(new THREE.HemisphereLight(0x6f97d6, 0x081428, .42));
    const key = new THREE.DirectionalLight(0xffe2bf, 1.65); key.position.set(-14, 11, 12);
    key.target.position.set(0, 4, 0); scene.add(key, key.target);
    key.castShadow = true;
    const sm = innerWidth < 760 ? 1024 : 2048; key.shadow.mapSize.set(sm, sm);
    Object.assign(key.shadow.camera, { left:-9, right:9, top:10, bottom:-8, near:1, far:60 });
    key.shadow.bias = -.0004; key.shadow.normalBias = .025; key.shadow.radius = 3;
    const fill = new THREE.DirectionalLight(0xa8cbfd, .35); fill.position.set(12, 6, 8); scene.add(fill);
    const rim = new THREE.DirectionalLight(0x1a7cff, 1.0); rim.position.set(8, 9, -14); scene.add(rim);
    buildGround(); buildSolid(); buildRiser();
    resize(); buildPoints();
    ok = true;
    addEventListener('resize', resize);
    requestAnimationFrame(frame);
  }

  function resize(){
    if (!renderer) return;
    const r = canvas.getBoundingClientRect();
    W = r.width || innerWidth; H = r.height || innerHeight;
    const wasSmall = small; small = innerWidth < 760;
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // place the tower: right of the copy on desktop, upper-centre on mobile
    camera.setViewOffset(W, H, small ? 0 : -W*.2, small ? -H*.05 : 0, W, H);
    camera.updateProjectionMatrix();
    if (ptsMat) ptsMat.uniforms.uPR.value = renderer.getPixelRatio();
    if (ok && wasSmall !== small) buildPoints();
  }

  /* ---------- controls ---------- */
  let yaw = -.55, pitch = .2, vYaw = 0, dragging = false, lx = 0, ly = 0, moved = 0, lastInput = -9e9, ptrType = 'mouse';
  const ptr = { x:-1, y:-1, in:false };
  hero.addEventListener('pointerdown', e => {
    if (!active() || e.target.closest('a,button,input,select,textarea,.h3d-ui')) return;
    dragging = true; lx = e.clientX; ly = e.clientY; moved = 0; ptrType = e.pointerType; lastInput = performance.now();
    hero.classList.add('grabbing');
  });
  addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.in = ptr.y >= 0 && ptr.y <= r.height;
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    vYaw = -dx * .0065; yaw += vYaw;
    if (e.pointerType !== 'touch') pitch = Math.max(.03, Math.min(1.05, pitch + dy * .004));
    lastInput = performance.now();
  }, {passive:true});
  const end = e => {
    if (!dragging) return;
    dragging = false; hero.classList.remove('grabbing');
    if (moved < 6 && e && e.type === 'pointerup') tapAt(ptr.x, ptr.y);
  };
  addEventListener('pointerup', end); addEventListener('pointercancel', () => { dragging = false; hero.classList.remove('grabbing'); });
  function nearest(x, y, R){ let b = -1, bd = R*R; scr.forEach((s, i) => { if (!s.on) return; const dd = (s.x-x)**2 + (s.y-y)**2; if (dd < bd){ bd = dd; b = i; } }); return b; }
  function tapAt(x, y){ tapPin = nearest(x, y, 36); lastHover = performance.now(); }

  /* ---------- solid ⇄ splat ---------- */
  let view = 'solid', tr = null, userToggled = false, holdUntil = performance.now() + 4500;
  const segBtns = [...ui.querySelectorAll('[data-v]')];
  segBtns.forEach(b => b.addEventListener('click', () => { userToggled = true; go(b.dataset.v); }));
  function go(v){
    if (tr || v === view) return;
    tr = { to:v, t0:performance.now(), dur:3400 };
    segBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v));
    solid.visible = true; riser.visible = true;
  }
  function steady(){
    riser.visible = false;
    if (view === 'solid'){ clip.normal.set(0,-1,0); clip.constant = 1e4; solid.visible = true; ptsMat.uniforms.uDir.value = 1; ptsMat.uniforms.uSweep.value = -1e4; }
    else { solid.visible = false; ptsMat.uniforms.uDir.value = 1; ptsMat.uniforms.uSweep.value = 1e4; }
    tag.style.opacity = 0;
  }

  const V = () => new THREE.Vector3();
  let last = performance.now(), lastRO = 0, firstPaint = true;
  function inView(){ const r = canvas.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }

  function frame(now){
    requestAnimationFrame(frame);
    if (!active() || !inView()) return;
    if (firstPaint){ resize(); steady(); firstPaint = false; }
    const dt = Math.min(.05, (now - last)/1000); last = now;

    // orbit
    if (!dragging){
      vYaw *= .93; yaw += vYaw;
      const idle = (now - lastInput) / 1000;
      if (idle > 2.2) yaw += dt * .16 * Math.min(1, (idle - 2.2) / 1.5);
    }
    const R = small ? 29 : 24, ty = small ? 4.9 : 4.6;
    camera.position.set(R*Math.cos(pitch)*Math.sin(yaw), ty + R*Math.sin(pitch), R*Math.cos(pitch)*Math.cos(yaw));
    camera.lookAt(0, ty, 0);

    // transition
    if (tr){
      const k = Math.min(1, (now - tr.t0) / tr.dur), e = k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3)/2;
      const h = -.4 + (TOP + .8) * e;
      riser.position.y = h;
      ptsMat.uniforms.uSweep.value = h;
      if (tr.to === 'splat'){ clip.normal.set(0,1,0); clip.constant = -h; ptsMat.uniforms.uDir.value = 1; }
      else { clip.normal.set(0,-1,0); clip.constant = h; ptsMat.uniforms.uDir.value = -1; }
      const lvl = Math.max(0, Math.min(d.floors, Math.round((h/SC - d.y0)/(d.y1 - d.y0)*d.floors)));
      const v = V().set(W2*1.5*.5, h, D2*1.7*.5).project(camera);
      tag.style.transform = `translate(${(v.x+1)/2*W + 10}px, ${(1-v.y)/2*H - 10}px)`;
      tag.textContent = `L${String(lvl).padStart(2,'0')} · ${tr.to === 'splat' ? 'CAPTURING' : 'RESOLVING'}`;
      tag.style.opacity = 1;
      if (k >= 1){ view = tr.to; tr = null; steady(); holdUntil = now + (view === 'splat' ? 5200 : 6500); }
    } else if (!userToggled && now > holdUntil){
      go(view === 'solid' ? 'splat' : 'solid');
    }

    renderer.render(scene, camera);

    // pins
    const cam = camera.position;
    PINS.forEach((pin, i) => {
      const p = V().set(...pin.p);
      const facing = (cam.x - p.x)*pin.n[0] + (cam.y - p.y)*pin.n[1] + (cam.z - p.z)*pin.n[2] > 0;
      const v = p.clone().project(camera);
      const x = (v.x+1)/2*W, y = (1-v.y)/2*H;
      scr[i] = { x, y, on: facing };
      const el = pinEls[i];
      el.style.transform = `translate(${x}px, ${y}px) rotate(45deg)`;
      el.style.opacity = facing ? 1 : 0;
    });
    // which label: hover > tap > idle cycle
    if (ptr.in && ptrType !== 'touch'){ const h = nearest(ptr.x, ptr.y, 26); if (h >= 0){ hoverPin = h; lastHover = now; } else hoverPin = -1; }
    let show = hoverPin >= 0 ? hoverPin : (tapPin >= 0 && scr[tapPin].on ? tapPin : -1);
    if (show < 0 && now - lastHover > 3500){
      if (now - lastCycle > 3200 || cyclePin < 0 || !scr[cyclePin].on){
        const on = scr.map((s, i) => s.on ? i : -1).filter(i => i >= 0);
        if (on.length){ const j = (on.indexOf(cyclePin) + 1) % on.length; cyclePin = on[j]; }
        lastCycle = now;
      }
      show = cyclePin;
    }
    pinEls.forEach((el, i) => el.classList.toggle('on', i === show));
    if (show >= 0 && scr[show].on){
      const s = scr[show], side = (s.x > W*.82 || (small && s.x > W*.55)) ? -1 : 1;
      label.innerHTML = `<b>${PINS[show].t}</b><span>${PINS[show].s}</span>`;
      label.style.transform = `translate(${side > 0 ? s.x + 18 : s.x - 18}px, ${s.y}px) translate(${side > 0 ? '0' : '-100%'}, -50%)`;
      label.classList.toggle('left', side < 0);
      label.style.opacity = 1;
    } else label.style.opacity = 0;

    if (readout && now - lastRO > 400){
      lastRO = now;
      readout.innerHTML = `MODEL <b>TP-01</b><br>POINTS <b>${points.userData.n.toLocaleString()}</b><br>VIEW <b>${tr ? 'RESOLVING' : view === 'solid' ? 'AS-BUILT' : 'SPLAT'}</b><br>MODE <b>3D TOWER</b>`;
    }
  }
})();
