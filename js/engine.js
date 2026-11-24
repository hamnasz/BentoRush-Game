/* Sakura's Sweet Shop — engine: helpers, canvas, sprites, sound, effects.
   Plain (non-module) scripts so the game runs by double-clicking index.html. */
'use strict';

const $ = id => document.getElementById(id);
const W = 1280, H = 720, FLOOR = 210;
const TAU = Math.PI * 2;
const FONT = "Fredoka, 'Baloo 2', 'Trebuchet MS', 'Segoe UI', sans-serif";
const HANDWRITE = "'Patrick Hand', 'Gaegu', 'Segoe Print', 'Comic Sans MS', cursive";
const OUT = '#6b4150';                       // warm cocoa outline used everywhere
const PAL = {
  pink: '#ff8fab', rose: '#f2708f', blush: '#ffd3de', berry: '#ef5a7a',
  cream: '#fff8ee', butter: '#ffeec2', butterD: '#f6d98e',
  lilac: '#cdb8f0', lilacD: '#a98fdc', lilacL: '#ebe2fb',
  pista: '#c4e6b6', pistaD: '#93c787', pistaL: '#e6f5df',
  gold: '#e9c26b', goldD: '#c79a3d', goldL: '#f8e3a8',
  cocoa: '#6b4150', choco: '#8a5a4a', wood: '#e8b48c',
};

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[(Math.random() * arr.length) | 0];
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function rr(c, x, y, w, h, r){
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath(); c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function ell(c, x, y, rx, ry, fill){
  c.beginPath(); c.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), 0, 0, TAU);
  if (fill){ c.fillStyle = fill; c.fill(); }
}
function circ(c, x, y, r){ c.beginPath(); c.arc(x, y, Math.max(.01, r), 0, TAU); }
function strokeFill(c, fill){ c.fillStyle = fill; c.fill(); c.stroke(); }
function heartPath(c, x, y, s){
  const k = s / 34;
  c.beginPath();
  for (let i = 0; i <= 40; i++){
    const t = i / 40 * TAU;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    i ? c.lineTo(x + hx * k, y + hy * k + 1.5 * k) : c.moveTo(x + hx * k, y + hy * k + 1.5 * k);
  }
  c.closePath();
}
// scalloped edge: a row of half-circles along a horizontal line
function scallops(c, x0, x1, y, r, fill, stroke){
  const n = Math.max(1, Math.round((x1 - x0) / (r * 2)));
  const step = (x1 - x0) / n;
  c.beginPath();
  c.moveTo(x0, y);
  for (let i = 0; i < n; i++){ const cx = x0 + step * (i + .5); c.arc(cx, y, step / 2, Math.PI, 0, true); }
  c.closePath();
  if (fill){ c.fillStyle = fill; c.fill(); }
  if (stroke){ c.strokeStyle = stroke; c.stroke(); }
}
function bow(c, x, y, s, col){
  c.save(); c.translate(x, y); c.scale(s / 20, s / 20);
  c.lineWidth = 1.6; c.strokeStyle = OUT; c.lineJoin = 'round';
  c.fillStyle = col;
  c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-6, -9, -15, -7, -12, 1); c.bezierCurveTo(-10, 6, -4, 4, 0, 0); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(6, -9, 15, -7, 12, 1); c.bezierCurveTo(10, 6, 4, 4, 0, 0); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-2, 1); c.lineTo(-6, 11); c.lineTo(-2, 9); c.moveTo(2, 1); c.lineTo(6, 11); c.lineTo(2, 9); c.stroke();
  circ(c, 0, 0, 3); c.fill(); c.stroke();
  c.restore();
}
function coinIcon(c, x, y, r){
  c.save();
  const g = c.createRadialGradient(x - r * .3, y - r * .4, r * .1, x, y, r);
  g.addColorStop(0, '#fff3b8'); g.addColorStop(.6, '#f7cd5c'); g.addColorStop(1, '#dda23a');
  circ(c, x, y, r); c.fillStyle = g; c.fill();
  c.lineWidth = Math.max(1, r * .18); c.strokeStyle = '#b77c2a'; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.85)'; heartPath(c, x, y + r * .05, r * .95); c.fill();
  c.restore();
}

/* ---------------- canvas + sizing ---------------- */
const stage = $('stage');
const canvas = $('game');
const ctx = canvas.getContext('2d');
const bg = document.createElement('canvas'), bgx = bg.getContext('2d');
const vig = document.createElement('canvas'), vigx = vig.getContext('2d');
let px = 1;                                   // device pixels per logical unit
const resizeHooks = [];
function resize(){
  const s = Math.max(0.3, Math.min((innerWidth - 16) / W, (innerHeight - 16) / H));
  stage.style.width = Math.floor(W * s) + 'px';
  stage.style.height = Math.floor(H * s) + 'px';
  stage.style.fontSize = (16 * s) + 'px';
  px = s * Math.min(window.devicePixelRatio || 1, 2);
  for (const cv of [canvas, bg, vig]){ cv.width = Math.round(W * px); cv.height = Math.round(H * px); }
  for (const f of resizeHooks) f();
}
function makeCanvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

/* ---------------- generated sprites ---------------- */
function makeGlow(r, g, b){
  const cv = makeCanvas(128, 128), x = cv.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(.3, `rgba(${r},${g},${b},.45)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return cv;
}
const GLOW_WARM = makeGlow(255, 210, 150), GLOW_PINK = makeGlow(255, 150, 190);
const GLOW_WHITE = makeGlow(255, 244, 225), GLOW_LAV = makeGlow(205, 180, 255), GLOW_MINT = makeGlow(170, 235, 190);

function petalPath(x, s){
  x.beginPath(); x.moveTo(0, s);
  x.bezierCurveTo(-s * .95, s * .35, -s * .85, -s * .75, -s * .28, -s);
  x.lineTo(0, -s * .72); x.lineTo(s * .28, -s);
  x.bezierCurveTo(s * .85, -s * .75, s * .95, s * .35, 0, s); x.closePath();
}
function makePetal(c1, c2){
  const cv = makeCanvas(40, 40), x = cv.getContext('2d'); x.translate(20, 20);
  const s = 17, g = x.createLinearGradient(0, -s, 0, s);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  x.fillStyle = g; petalPath(x, s); x.fill();
  x.strokeStyle = 'rgba(235,120,160,.35)'; x.lineWidth = 1; x.stroke();
  return cv;
}
const PETALS_SPR = [makePetal('#ffe6ee', '#ffa9c6'), makePetal('#ffd2e0', '#ff8fb6'), makePetal('#fff2f6', '#ffbfd4')];
function makeHeart(col, light){
  const cv = makeCanvas(48, 48), x = cv.getContext('2d');
  heartPath(x, 24, 24, 40);
  const g = x.createRadialGradient(17, 15, 2, 24, 24, 24); g.addColorStop(0, light); g.addColorStop(1, col);
  x.fillStyle = g; x.fill(); x.lineWidth = 3; x.strokeStyle = '#fff'; x.stroke();
  return cv;
}
const HEARTS = [makeHeart('#ff6f9c', '#ffc2d6'), makeHeart('#ff9fbd', '#ffe1ea'), makeHeart('#c7a6f2', '#efe6ff')];
function makeSpark(){
  const cv = makeCanvas(32, 32), x = cv.getContext('2d'); x.translate(16, 16); x.fillStyle = '#fffbea';
  x.beginPath(); for (let i = 0; i < 8; i++){ const r = i % 2 ? 3 : 15, a = i / 8 * TAU - Math.PI / 2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  x.closePath(); x.fill(); return cv;
}
const SPARK = makeSpark();
const COIN_SPR = (() => { const cv = makeCanvas(40, 40), x = cv.getContext('2d'); coinIcon(x, 20, 20, 16); return cv; })();
const CONFETTI_COLORS = ['#ff8fab', '#ffd36b', '#b9a2ec', '#9fd8a6', '#8fd0f0', '#fff3d6'];

/* ---------------- sound: tiny Web Audio synth, no files ---------------- */
const Sfx = (() => {
  let ac = null, master = null, echo = null, muted = false;
  const VOL = .5;
  function init(){
    if (!ac){
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ac = new AC();
      master = ac.createGain(); master.gain.value = muted ? 0 : VOL;
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
      master.connect(comp); comp.connect(ac.destination);
      echo = ac.createGain(); echo.gain.value = .3;
      const d = ac.createDelay(1); d.delayTime.value = .17;
      const fb = ac.createGain(); fb.gain.value = .33;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000;
      echo.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(master);
    }
    if (ac.state === 'suspended') ac.resume();
  }
  function tone(f, at, dur, o = {}){
    if (!ac || muted) return;
    const { type = 'sine', vol = .2, slide = 0, attack = .006, wet = 0 } = o;
    const t0 = ac.currentTime + at;
    const osc = ac.createOscillator(); osc.type = type; osc.frequency.setValueAtTime(f, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur * .85);
    const g = ac.createGain();
    g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    if (wet){ const w = ac.createGain(); w.gain.value = wet; g.connect(w); w.connect(echo); }
    osc.start(t0); osc.stop(t0 + dur + .05);
  }
  return {
    init,
    get muted(){ return muted; },
    setMuted(m){ muted = m; if (master) master.gain.setTargetAtTime(muted ? 0 : VOL, ac.currentTime, .02); },
    pop(){ tone(480, 0, .13, { vol: .3, slide: 1250 }); tone(1500, .04, .08, { type: 'triangle', vol: .07, slide: 2300 }); },
    place(){ tone(1568, 0, .12, { vol: .1 }); tone(2093, .05, .16, { vol: .08, wet: .4 }); },
    coin(){ tone(1975, 0, .09, { type: 'triangle', vol: .12 }); tone(2637, .07, .32, { type: 'triangle', vol: .12, wet: .5 }); },
    chime(){ [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(f, i * .07, .55, { type: 'triangle', vol: .12, wet: .7 })); },
    wrong(){ tone(523, 0, .14, { type: 'triangle', vol: .12 }); tone(440, .13, .22, { type: 'triangle', vol: .12 }); },
    arrive(){ tone(1568, 0, .45, { vol: .06, wet: .6 }); tone(2349, .07, .4, { vol: .04, wet: .6 }); },
    ding(){ tone(1760, 0, .7, { vol: .1, wet: .6 }); tone(2637, .01, .5, { vol: .05, wet: .6 }); },
    whirr(){ tone(220, 0, .5, { type: 'triangle', vol: .05, slide: 440 }); },
    swish(){ tone(900, 0, .16, { vol: .08, slide: 520 }); },
    berry(){ tone(700, 0, .08, { vol: .14, slide: 1100 }); },
    nope(){ tone(330, 0, .12, { type: 'triangle', vol: .08 }); },
    buy(){ [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * .08, .45, { type: 'triangle', vol: .13, wet: .6 })); },
    hire(){ [659.25, 880, 1046.5].forEach((f, i) => tone(f, i * .1, .4, { type: 'triangle', vol: .12, wet: .5 })); },
  };
})();

/* ---------------- particles, floating text, petals ---------------- */
const particles = [];
const texts = [];
function addP(o){
  const p = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 1, life: 1, size: 10, rot: 0, vr: 0, kind: 'spr', spr: null, under: false, grow: 0, col: '255,255,255', add: false, delay: 0 }, o);
  p.max = p.life; particles.push(p);
}
function hearts(x, y, n = 12){
  for (let i = 0; i < n; i++){
    const a = -Math.PI / 2 + rand(-1.3, 1.3), sp = rand(100, 230);
    addP({ x: x + rand(-8, 8), y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 280, drag: .975, life: rand(.8, 1.3), size: rand(12, 22), rot: rand(-.4, .4), vr: rand(-2, 2), spr: pick(HEARTS) });
  }
  addP({ x, y, life: .5, size: 110, grow: 150, spr: GLOW_PINK, add: true });
}
function sparkles(x, y, n = 10, glow = GLOW_WARM){
  for (let i = 0; i < n; i++){
    const a = rand(0, TAU), sp = rand(50, 140);
    addP({ x: x + rand(-6, 6), y: y + rand(-6, 6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, drag: .93, life: rand(.45, .75), size: rand(9, 16), vr: rand(-5, 5), spr: SPARK, add: true });
  }
  addP({ x, y, life: .35, size: 80, grow: 120, spr: glow, add: true });
}
function puffs(x, y, n, col, under, spread = 18, big = 1){
  for (let i = 0; i < n; i++){
    const a = rand(0, TAU), sp = rand(15, 45) * big;
    addP({ kind: 'puff', x: x + Math.cos(a) * spread * Math.random(), y: y + Math.sin(a) * spread * .5 * Math.random(), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .5 - 12 * big, drag: .95, life: rand(.4, .7) * big, size: rand(4, 8) * big, grow: 14 * big, col, under });
  }
}
function confetti(x, y, n = 60, spread = 1){
  for (let i = 0; i < n; i++){
    const a = -Math.PI / 2 + rand(-1.2, 1.2) * spread, sp = rand(180, 420);
    addP({ kind: 'confetti', x: x + rand(-20, 20), y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 420, drag: .97, life: rand(1.2, 2.1), size: rand(5, 9), rot: rand(0, TAU), vr: rand(-9, 9), col: pick(CONFETTI_COLORS) });
  }
}
function updateParticles(dt){
  for (let i = particles.length - 1; i >= 0; i--){
    const p = particles[i];
    if (p.delay > 0){ p.delay -= dt; continue; }
    p.life -= dt;
    if (p.life <= 0){ particles.splice(i, 1); continue; }
    const d = Math.pow(p.drag, dt * 60);
    p.vx *= d; p.vy *= d; p.vy += p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.size += p.grow * dt;
    if (p.kind === 'coin' && p.onArrive){
      // coins glide toward the HUD purse
      const k = 1 - Math.exp(-dt * 5.5);
      p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k;
      if (Math.hypot(p.tx - p.x, p.ty - p.y) < 14){ p.onArrive(); p.onArrive = null; p.life = 0; particles.splice(i, 1); }
    }
  }
  for (let i = texts.length - 1; i >= 0; i--){
    const t = texts[i];
    if (t.delay > 0){ t.delay -= dt; continue; }
    t.age += dt; if (t.age >= t.life) texts.splice(i, 1);
  }
}
function drawParticles(c, under){
  for (const p of particles){
    if (p.under !== under || p.delay > 0) continue;
    const age = p.max - p.life;
    const a = clamp(p.life / p.max * 1.6, 0, 1);
    const pop = age < .12 ? easeOutBack(age / .12) : 1;
    if (p.kind === 'puff'){ c.globalAlpha = a * .7; circ(c, p.x, p.y, p.size * pop); c.fillStyle = `rgb(${p.col})`; c.fill(); continue; }
    if (p.kind === 'confetti'){
      c.save(); c.globalAlpha = a; c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.abs(Math.cos(p.rot * 1.7)) * .8 + .2);
      c.fillStyle = p.col; c.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * .66); c.restore(); continue;
    }
    c.save();
    if (p.add) c.globalCompositeOperation = 'lighter';
    c.globalAlpha = p.kind === 'coin' ? 1 : a;
    c.translate(p.x, p.y); c.rotate(p.rot);
    const s = p.size * pop;
    c.drawImage(p.spr, -s / 2, -s / 2, s, s);
    c.restore();
  }
  c.globalAlpha = 1;
}
function addText(text, x, y, col, size, life = 1.1, delay = 0, font = FONT){
  texts.push({ text, x, y, col, size, life, delay, age: 0, font });
}
function drawTexts(c){
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  for (const t of texts){
    if (t.delay > 0) continue;
    const q = t.age / t.life;
    const pop = t.age < .2 ? 1 + .4 * (1 - easeOutBack(t.age / .2)) : 1;
    const a = q > .7 ? 1 - (q - .7) / .3 : 1;
    c.save();
    c.globalAlpha = clamp(a, 0, 1);
    c.translate(t.x, t.y - easeOut(Math.min(1, q * 1.4)) * 40);
    c.scale(pop, pop);
    c.font = `700 ${t.size}px ${t.font}`;
    c.lineWidth = t.size * .24; c.strokeStyle = '#fff'; c.strokeText(t.text, 0, 0);
    c.fillStyle = t.col; c.fillText(t.text, 0, 0);
    c.restore();
  }
}

const petals = [];
function resetPetal(p, initial){
  const far = p.far;
  p.s = far ? rand(4.5, 8) : rand(9, 13);
  p.a = far ? rand(.45, .75) : rand(.55, .8);
  p.vx = rand(16, 40); p.vy = far ? rand(16, 34) : rand(26, 48);
  p.rot = rand(0, TAU); p.vr = rand(-1.6, 1.6);
  p.amp = rand(10, 26); p.fq = rand(.7, 1.6); p.ph = rand(0, TAU); p.ff = rand(1.2, 2.8);
  p.spr = pick(PETALS_SPR);
  if (initial){ p.x = rand(-20, W); p.y = rand(-20, H); }
  else if (Math.random() < .55){ p.x = rand(-40, W * .8); p.y = -20; }
  else { p.x = -20; p.y = rand(0, H * .7); }
}
for (let i = 0; i < 40; i++){ const p = { far: i < 32 }; resetPetal(p, true); petals.push(p); }
function updatePetals(dt, T){
  const wind = 12 * Math.sin(T * .3) + 7 * Math.sin(T * .71);
  for (const p of petals){
    p.x += (p.vx + wind) * dt + Math.cos(T * p.fq + p.ph) * p.amp * dt;
    p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.y > H + 24 || p.x > W + 24) resetPetal(p, false);
  }
}
function drawPetals(c, far, T){
  for (const p of petals){
    if (p.far !== far) continue;
    c.save(); c.globalAlpha = p.a;
    c.translate(p.x, p.y); c.rotate(p.rot);
    c.scale(.3 + .7 * Math.abs(Math.cos(T * p.ff + p.ph)), 1);
    c.drawImage(p.spr, -p.s, -p.s, p.s * 2, p.s * 2);
    c.restore();
  }
}

/* ---------------- input ---------------- */
const keys = new Set();
