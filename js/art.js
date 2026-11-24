/* Sakura's Sweet Shop — artwork.
   Everything here is drawn in code, and almost everything can be replaced by a PNG:
   drop a file with the listed name into assets/ and the game uses it automatically
   (see assets/README.txt for the full list and sizes). */
'use strict';

/* ---------------- PNG loading ---------------- */
function loadArt(src, cells = 1, extra = {}){
  const im = new Image();
  const art = Object.assign({ img: im, src, cells, ok: false, cw: 0, ch: 0 }, extra);
  im.onload = () => { art.cw = im.naturalWidth / cells; art.ch = im.naturalHeight; art.ok = art.cw > 0 && art.ch > 0; };
  im.onerror = () => { art.ok = false; };
  im.src = src;
  return art;
}
const isOk = a => !!(a && a.ok);

// Optional replacement art. Missing files are fine: the drawn version is used instead.
const ART = {};
function optionalArt(name, cells = 1, extra = {}){ return (ART[name] = loadArt('assets/' + name + '.png', cells, extra)); }
[
  'machines/oven', 'machines/cotton_candy_spinner', 'machines/pastry_roller', 'machines/cake_station',
  'desserts/cupcake', 'desserts/cotton_candy', 'desserts/croissant', 'desserts/cake_slice',
  'desserts/whole_cake', 'desserts/sponge', 'desserts/croissant_dough', 'desserts/batter_bowl',
].forEach(n => optionalArt(n));
// Draws a replacement PNG scaled to fit a box (bottom-centre anchored). Returns false if none.
function drawOverride(c, name, x, yBottom, boxW, boxH){
  const a = ART[name];
  if (!isOk(a)) return false;
  const s = Math.min(boxW / a.cw, boxH / a.ch);
  const w = a.cw * s, h = a.ch * s;
  c.drawImage(a.img, 0, 0, a.cw, a.ch, x - w / 2, yBottom - h, w, h);
  return true;
}

/* ---------------- Sakura (PNG sheets, see people.js for the pose logic) ---------------- */
const PH = 158;
const HOLD_HAND = [(165 - 132) / 440, (214 - 440) / 440];
const SAKURA = {
  idle:  loadArt('assets/sakura/idle.png'),
  hold:  loadArt('assets/sakura/hold.png', 1, { hands: [HOLD_HAND], lift: 0, fist: 0, scale: 1.12 }),
  happy: loadArt('assets/sakura/happy.png'),
  walk1: loadArt('assets/sakura/walk.png'),
  back:  loadArt('assets/sakura/back.png', 1, { hands: [[0.1357, -0.3739]], lift: .22, fist: .03, scale: .85 }),
  walkRight: loadArt('assets/sakura/walk_right.png', 4, {
    hands: [[0.198, -0.4314], [0.1556, -0.3706], [0.1895, -0.4328], [0.1867, -0.4017]], lift: .24, fist: .032, scale: .95,
  }),
  carryWalkRight: loadArt('assets/sakura/carry_walk_right.png', 4, { hands: null, lift: 0, fist: 0, scale: 1 }),
  walkUp:   loadArt('assets/sakura/walk_up.png', 4,   { hands: null, lift: .22, fist: 0, scale: .85 }),
  walkDown: loadArt('assets/sakura/walk_down.png', 4, { hands: null, lift: 0, fist: 0, scale: 1 }),
};

/* ---------------- desserts (vector, ~50 units tall at size 50) ---------------- */
const DESSERT_ART = { cupcake: 'desserts/cupcake', candy: 'desserts/cotton_candy', croissant: 'desserts/croissant', cake: 'desserts/cake_slice',
  wholecake: 'desserts/whole_cake', sponge: 'desserts/sponge', dough: 'desserts/croissant_dough', batter: 'desserts/batter_bowl' };

function strawberry(c, x, y, s){
  c.save(); c.translate(x, y); c.scale(s / 10, s / 10);
  c.beginPath(); c.moveTo(0, 6.5);
  c.bezierCurveTo(-7.5, 2, -6.5, -5, 0, -3.8); c.bezierCurveTo(6.5, -5, 7.5, 2, 0, 6.5);
  c.fillStyle = '#ff5c7f'; c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = '#ffeaa6';
  for (const [a, b] of [[-2.3, -.6], [2.3, -.6], [0, 1.8], [-1.2, 3.6], [1.2, 3.6], [0, -1.6]]){ ell(c, a, b, .55, .8); c.fill(); }
  c.fillStyle = '#6cc28e';
  c.beginPath(); c.moveTo(-4, -4.2); c.lineTo(-1, -3); c.lineTo(0, -6); c.lineTo(1, -3); c.lineTo(4, -4.2); c.lineTo(0, -2.2); c.closePath(); c.fill();
  c.restore();
}
function drawCupcake(c){
  c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = 2.2; c.strokeStyle = OUT;
  c.beginPath(); c.moveTo(-15, 3); c.lineTo(15, 3); c.lineTo(11, 23); c.lineTo(-11, 23); c.closePath();
  let g = c.createLinearGradient(0, 3, 0, 23); g.addColorStop(0, '#ffb6ca'); g.addColorStop(1, '#f58aa8');
  c.fillStyle = g; c.fill(); c.stroke();
  c.strokeStyle = 'rgba(170,60,95,.4)'; c.lineWidth = 1.3;
  for (const k of [-9, -4.5, 0, 4.5, 9]){ c.beginPath(); c.moveTo(k, 5); c.lineTo(k * .78, 21); c.stroke(); }
  c.lineWidth = 2.2; c.strokeStyle = OUT;
  c.beginPath(); c.moveTo(-17, 4);
  c.bezierCurveTo(-22, -3, -15, -9, -10, -8); c.bezierCurveTo(-12, -16, -3, -19, 0, -16);
  c.bezierCurveTo(2, -24, 10, -22, 8, -15); c.bezierCurveTo(15, -16, 20, -9, 15, -5);
  c.bezierCurveTo(22, -2, 19, 5, 15, 5); c.closePath();
  g = c.createLinearGradient(0, -22, 0, 5); g.addColorStop(0, '#fff4f8'); g.addColorStop(1, '#ffcfdf');
  c.fillStyle = g; c.fill(); c.stroke();
  c.strokeStyle = 'rgba(232,120,160,.6)'; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(-12, -1); c.quadraticCurveTo(0, -7, 12, -1); c.stroke();
  c.beginPath(); c.moveTo(-6, -10); c.quadraticCurveTo(2, -14, 8, -9); c.stroke();
  for (const [sx, sy, col, r] of [[-9, -4, '#9fd8a6', .5], [6, -2, '#b9a2ec', -.4], [-2, -12, '#ffd36b', .9], [11, -9, '#8fd0f0', .2]]){
    c.save(); c.translate(sx, sy); c.rotate(r); c.fillStyle = col; rr(c, -2.2, -.9, 4.4, 1.8, .9); c.fill(); c.restore();
  }
  strawberry(c, 3, -21, 10);
}
const FLOSS = [[-9, -6, 11], [8, -8, 12], [0, -17, 11], [-3, 1, 10], [9, 2, 8], [-13, -14, 7], [12, -17, 6]];
function drawCottonCandy(c, scale = 1){
  c.lineCap = 'round';
  c.lineWidth = 5; c.strokeStyle = OUT; c.beginPath(); c.moveTo(0, 24); c.lineTo(0, 2); c.stroke();
  c.lineWidth = 3; c.strokeStyle = '#fbe7c9'; c.stroke();
  c.save(); c.scale(scale, scale);
  c.lineWidth = 4.4 / scale; c.strokeStyle = OUT;
  for (const [x, y, r] of FLOSS){ circ(c, x, y, r); c.stroke(); }
  const g = c.createRadialGradient(-4, -12, 2, 0, -6, 24);
  g.addColorStop(0, '#ffeef6'); g.addColorStop(.55, '#ffb8d6'); g.addColorStop(1, '#d6bff7');
  c.fillStyle = g;
  for (const [x, y, r] of FLOSS){ circ(c, x, y, r); c.fill(); }
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.6;
  c.beginPath(); c.arc(-5, -9, 6, 3.6, 5.2); c.stroke(); c.beginPath(); c.arc(6, -12, 5, 3.8, 5.4); c.stroke();
  c.restore();
}
function drawCroissant(c, bake = 1){
  const top = bake < 1 ? lerpColor('#fbecd0', '#ffd98a', bake) : '#ffd98a';
  const bot = bake < 1 ? lerpColor('#f0d6a8', '#df9440', bake) : '#df9440';
  c.lineJoin = 'round';
  const segs = [[-21, 8, 6, 5, -.95], [21, 8, 6, 5, .95], [-13, 3, 8.5, 7.5, -.5], [13, 3, 8.5, 7.5, .5], [0, 0, 11, 10, 0]];
  for (const [x, y, rx, ry, rot] of segs){
    c.save(); c.translate(x, y); c.rotate(rot);
    const g = c.createLinearGradient(0, -ry, 0, ry); g.addColorStop(0, top); g.addColorStop(1, bot);
    ell(c, 0, 0, rx, ry); c.fillStyle = g; c.fill(); c.lineWidth = 2.1; c.strokeStyle = OUT; c.stroke();
    c.strokeStyle = 'rgba(150,80,30,.35)'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, ry * .4, rx * .7, -2.6, -.5); c.stroke();
    c.restore();
  }
  c.fillStyle = 'rgba(255,255,255,.45)'; ell(c, -2, -5, 5, 2); c.fill();
}
function lerpColor(a, b, t){
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, t)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `rgb(${r},${g},${bl})`;
}
function drawCakeSlice(c){
  c.lineJoin = 'round'; c.lineWidth = 2.2; c.strokeStyle = OUT;
  // top face (cream) receding to the back point
  c.beginPath(); c.moveTo(-18, -2); c.lineTo(4, -15); c.lineTo(20, -2); c.closePath();
  c.fillStyle = '#fff7f8'; c.fill(); c.stroke();
  // cut face with layers
  rr(c, -18, -2, 38, 22, 3); c.fillStyle = '#f6d08c'; c.fill(); c.stroke();
  c.fillStyle = '#ff9fbb'; c.fillRect(-17, 6, 36, 4);
  c.fillStyle = '#fff5f6'; c.fillRect(-17, 0, 36, 3); c.fillRect(-17, 12, 36, 2);
  rr(c, -18, -2, 38, 22, 3); c.stroke();
  // cream dollop + berry
  c.fillStyle = '#ffffff'; ell(c, 2, -8, 6, 4); c.fill(); c.lineWidth = 1.4; c.stroke();
  strawberry(c, 2, -12, 9);
}
function drawWholeCake(c, cream = 3, berries = 5, spin = 0){
  c.lineJoin = 'round'; c.lineWidth = 2.2; c.strokeStyle = OUT;
  const side = cream >= 2 ? '#fff3f3' : '#f4cf8f', top = cream >= 1 ? '#fff9fa' : '#f8dca6';
  // body
  c.beginPath(); c.moveTo(-24, -8); c.lineTo(-24, 12); c.ellipse(0, 12, 24, 7, 0, Math.PI, 0, true); c.lineTo(24, -8); c.closePath();
  c.fillStyle = side; c.fill(); c.stroke();
  if (cream >= 2){ c.fillStyle = '#ffb6ca'; c.beginPath(); c.moveTo(-24, 2); c.lineTo(-24, 6); c.ellipse(0, 6, 24, 7, 0, Math.PI, 0, true); c.lineTo(24, 2); c.ellipse(0, 2, 24, 7, 0, 0, Math.PI, false); c.fill(); }
  else { c.strokeStyle = 'rgba(170,110,50,.35)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(0, 3, 24, 7, 0, 0, Math.PI); c.stroke(); c.lineWidth = 2.2; c.strokeStyle = OUT; }
  ell(c, 0, -8, 24, 8); c.fillStyle = top; c.fill(); c.stroke();
  if (cream >= 3){
    c.fillStyle = '#ffffff'; c.lineWidth = 1.3;
    for (let i = 0; i < 12; i++){ const a = i / 12 * TAU + spin; const x = Math.cos(a) * 21, y = -8 + Math.sin(a) * 6.5; if (Math.sin(a) < -.2) continue; circ(c, x, y + 1, 3.2); c.fill(); c.stroke(); }
    c.strokeStyle = 'rgba(240,120,160,.75)'; c.lineWidth = 1.6;
    c.beginPath(); for (let i = 0; i <= 20; i++){ const x = -22 + i * 2.2; const y = 1 + Math.sin(i * 1.3) * 2.2 + 4; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  }
  const placed = [];
  for (let i = 0; i < Math.min(berries, 4); i++){ const a = i / 4 * TAU + spin + .4; placed.push([Math.cos(a) * 13, -9 + Math.sin(a) * 4, Math.sin(a)]); }
  placed.sort((p, q) => p[2] - q[2]);
  for (const [x, y] of placed) strawberry(c, x, y - 2, 9);
  if (berries >= 5) strawberry(c, 0, -13, 10);
}
function drawDough(c){
  c.lineJoin = 'round';
  rr(c, -25, 6, 50, 12, 5); c.fillStyle = '#efe2cf'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-21, 8, 42, 2);
  for (const dx of [-14, 0, 14]){ c.save(); c.translate(dx, 2); c.scale(.42, .42); drawCroissant(c, 0); c.restore(); }
}
function drawBatter(c){
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.lineWidth = 2.4; c.strokeStyle = '#b9a7c9';
  c.beginPath(); c.moveTo(8, -6); c.lineTo(18, -24); c.stroke();
  c.lineWidth = 1.3; c.strokeStyle = '#8e7aa3';
  for (const o of [-3, 0, 3]){ c.beginPath(); c.ellipse(6 + o * .3, -2, 3 + Math.abs(o), 7, .45, 0, TAU); c.stroke(); }
  c.lineWidth = 2.2; c.strokeStyle = OUT;
  c.beginPath(); c.moveTo(-22, -2); c.bezierCurveTo(-21, 18, 21, 18, 22, -2); c.closePath();
  const g = c.createLinearGradient(0, -2, 0, 16); g.addColorStop(0, '#dccbf7'); g.addColorStop(1, '#b49ae6');
  c.fillStyle = g; c.fill(); c.stroke();
  ell(c, 0, -2, 22, 6); c.fillStyle = '#ffd0dd'; c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.6)'; ell(c, -6, -3, 7, 2); c.fill();
}
// kind: cupcake | candy | croissant | cake | wholecake | sponge | dough | batter
function drawDessert(c, kind, x, y, size, opts = {}){
  if (drawOverride(c, DESSERT_ART[kind], x, y + size / 2, size * 1.05, size)) return;
  c.save(); c.translate(x, y); const k = size / 50; c.scale(k, k);
  if (kind === 'cupcake') drawCupcake(c);
  else if (kind === 'candy') drawCottonCandy(c);
  else if (kind === 'croissant') drawCroissant(c, opts.bake == null ? 1 : opts.bake);
  else if (kind === 'cake') drawCakeSlice(c);
  else if (kind === 'wholecake') drawWholeCake(c, 3, 5, opts.spin || 0);
  else if (kind === 'sponge') drawWholeCake(c, 0, 0);
  else if (kind === 'dough') drawDough(c);
  else if (kind === 'batter') drawBatter(c);
  c.restore();
}
// A tray or a single item, as carried by Sakura and the staff.
const BATCH_SLOTS = [[-13, -2], [13, -2], [-6, -8], [7, -9]];
function drawTray(c, recipe, count, x, y, size){
  c.save(); c.translate(x, y); const k = size / 50; c.scale(k, k);
  c.lineWidth = 2; c.strokeStyle = OUT;
  ell(c, 0, 12, 27, 8); c.fillStyle = '#fff8ee'; c.fill(); c.stroke();
  c.fillStyle = '#ffd3de'; ell(c, 0, 12, 21, 5); c.fill();
  const order = [2, 3, 0, 1];
  for (let j = 0; j < Math.min(count, 4); j++){
    const [sx, sy] = BATCH_SLOTS[order[j]];
    drawDessert(c, recipe, sx, sy, recipe === 'candy' ? 30 : 24);
  }
  if (count > 4){ c.font = `700 12px ${FONT}`; c.textAlign = 'center'; c.fillStyle = OUT; c.fillText('×' + count, 18, 24); }
  c.restore();
}
function itemSize(item){ return item.kind === 'batch' ? 46 : item.kind === 'cake' ? 44 : item.kind === 'single' ? 34 : item.kind === 'batter' ? 36 : 40; }
function drawHeld(c, item, x, y, size){
  if (!item) return;
  if (item.kind === 'batch') drawTray(c, item.recipe, item.count, x, y, size);
  else if (item.kind === 'single') drawDessert(c, item.recipe, x, y, size);
  else if (item.kind === 'cake') drawDessert(c, 'wholecake', x, y, size);
  else drawDessert(c, item.kind, x, y, size);
}

/* ---------------- small UI bits drawn on the canvas ---------------- */
function priceTag(c, x, y, label, price, can, T){
  c.save();
  c.font = `600 14px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle';
  const tw = c.measureText(label).width;
  c.font = `700 15px ${FONT}`;
  const pw = c.measureText(String(price)).width;
  const w = tw + pw + 50, h = 30, x0 = x - w / 2;
  const bob = Math.sin(T * 2.4 + x) * 2;
  c.translate(0, bob);
  c.fillStyle = 'rgba(160,80,110,.18)'; rr(c, x0, y + 3, w, h, 15); c.fill();
  rr(c, x0, y, w, h, 15); c.fillStyle = can ? '#fffaf2' : 'rgba(255,250,242,.9)'; c.fill();
  c.lineWidth = 2; c.strokeStyle = can ? '#ff8fab' : '#e7cdd6'; c.stroke();
  c.font = `600 14px ${FONT}`; c.fillStyle = OUT; c.fillText(label, x0 + 12, y + h / 2 + .5);
  coinIcon(c, x0 + tw + 26, y + h / 2, 8.5);
  c.font = `700 15px ${FONT}`; c.fillStyle = can ? '#e0567c' : '#a78794'; c.fillText(String(price), x0 + tw + 38, y + h / 2 + .5);
  c.restore();
}
function progressRing(c, x, y, r, q, col = '#ff8fab'){
  c.save();
  circ(c, x, y, r + 3); c.fillStyle = 'rgba(255,250,244,.95)'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#ffd0dc'; c.stroke();
  c.lineWidth = 4; c.lineCap = 'round'; c.strokeStyle = '#f6e3ea';
  c.beginPath(); c.arc(x, y, r - 2, 0, TAU); c.stroke();
  c.strokeStyle = col; c.beginPath(); c.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(q, 0, 1)); c.stroke();
  c.restore();
}
function readyBadge(c, x, y, T, text = 'Ready!'){
  const b = Math.abs(Math.sin(T * 4)) * 3;
  c.save(); c.translate(x, y - b);
  c.font = `700 13px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(text).width + 22;
  rr(c, -w / 2, -12, w, 24, 12); c.fillStyle = '#9fd8a6'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke();
  c.fillStyle = '#fff'; c.fillText(text, 0, 1);
  c.beginPath(); c.moveTo(-5, 11); c.lineTo(0, 17); c.lineTo(5, 11); c.fillStyle = '#9fd8a6'; c.fill();
  c.restore();
}
function handCard(c, x, y, w, h, text, sub, col = '#fffaf0', ink = OUT, tilt = 0){
  c.save(); c.translate(x, y); c.rotate(tilt);
  c.fillStyle = 'rgba(120,60,70,.16)'; rr(c, -w / 2 + 1.5, -h / 2 + 2.5, w, h, 4); c.fill();
  rr(c, -w / 2, -h / 2, w, h, 4); c.fillStyle = col; c.fill(); c.lineWidth = 1.4; c.strokeStyle = 'rgba(122,74,85,.55)'; c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = ink;
  c.font = `400 ${sub ? 13 : 14}px ${HANDWRITE}`; c.fillText(text, 0, sub ? -4 : 1);
  if (sub){ c.font = `700 11px ${FONT}`; c.fillStyle = '#e0567c'; c.fillText(sub, 0, 9); }
  c.restore();
}

/* ---------------- machines ---------------- */
function ghostStyle(c){ c.globalAlpha = .5; c.setLineDash([6, 5]); }
function drawOven(c, m, T){
  const x = m.x, b = m.base;
  ell(c, x + 4, b + 2, 76, 12, 'rgba(120,60,70,.16)');
  if (drawOverride(c, 'machines/oven', x, b, 150, 160)){ ovenStatus(c, m, T, true); return; }
  c.save(); c.translate(x, b); c.lineJoin = 'round'; c.lineWidth = 2.4; c.strokeStyle = OUT;
  // cream cabinet with scalloped trim
  let g = c.createLinearGradient(0, -80, 0, 0); g.addColorStop(0, '#fff4d9'); g.addColorStop(1, '#f6dfb3');
  rr(c, -66, -80, 132, 80, 8); c.fillStyle = g; c.fill(); c.stroke();
  c.lineWidth = 1.6; rr(c, -56, -60, 52, 50, 7); c.stroke(); rr(c, 4, -60, 52, 50, 7); c.stroke();
  strawberry(c, -30, -36, 10); strawberry(c, 30, -36, 10);
  c.lineWidth = 2.2;
  rr(c, -72, -90, 144, 13, 5); c.fillStyle = '#fffaf2'; c.fill(); c.stroke();
  c.lineWidth = 1.5; scallops(c, -70, 70, -77, 6, '#ffb3c6', OUT);
  // rose-pink countertop oven
  c.lineWidth = 2.4;
  ell(c, -44, -90, 6, 4, PAL.gold); ell(c, 44, -90, 6, 4, PAL.gold);
  g = c.createLinearGradient(0, -166, 0, -92); g.addColorStop(0, '#ffc2d0'); g.addColorStop(1, '#f2879f');
  rr(c, -56, -166, 112, 76, 20); c.fillStyle = g; c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, -48, -161, 96, 8, 4); c.fill();
  // little window with the batch inside
  rr(c, -46, -150, 64, 48, 11); c.fillStyle = '#5b3341'; c.fill();
  c.save(); rr(c, -46, -150, 64, 48, 11); c.clip();
  if (m.state === 'baking' || m.state === 'done'){
    const q = m.state === 'done' ? 1 : m.t / m.dur;
    const gl = c.createRadialGradient(-14, -118, 4, -14, -126, 46);
    gl.addColorStop(0, `rgba(255,190,120,${.85 - (m.state === 'done' ? .35 : 0)})`); gl.addColorStop(1, 'rgba(120,40,50,0)');
    c.fillStyle = gl; c.fillRect(-46, -150, 64, 48);
    c.fillStyle = '#3c2229'; c.fillRect(-42, -112, 56, 4);
    ovenContents(c, m.recipe, q, T);
  }
  c.restore();
  c.lineWidth = 2.4; rr(c, -46, -150, 64, 48, 11); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(-40, -104); c.lineTo(-22, -148); c.lineTo(-12, -148); c.lineTo(-30, -104); c.closePath(); c.fill();
  rr(c, -40, -160, 52, 6, 3); c.fillStyle = PAL.gold; c.fill(); c.lineWidth = 1.6; c.stroke();
  // flower-shaped knob + light
  c.save(); c.translate(36, -136); c.rotate(m.state === 'baking' ? T * 2.2 : 0);
  for (let i = 0; i < 5; i++){ const a = i / 5 * TAU; circ(c, Math.cos(a) * 6.5, Math.sin(a) * 6.5, 5.2); c.fillStyle = '#fff0f5'; c.fill(); c.lineWidth = 1.5; c.stroke(); }
  circ(c, 0, 0, 4.2); c.fillStyle = '#ffd36b'; c.fill(); c.stroke();
  c.restore();
  const lightCol = m.state === 'done' ? '#7fdc9a' : m.state === 'baking' ? (Math.sin(T * 6) > 0 ? '#ffb15c' : '#ff9440') : '#e8c9d2';
  circ(c, 36, -110, 4.5); c.fillStyle = lightCol; c.fill(); c.lineWidth = 1.5; c.stroke();
  strawberry(c, 0, -172, 12);
  c.restore();
  ovenStatus(c, m, T, false);
}
function ovenContents(c, recipe, q, T){
  if (recipe === 'cupcake'){
    for (let i = 0; i < 4; i++){
      const x = -36 + i * 14;
      c.save(); c.translate(x, -112);
      if (q < 1){
        const h = 4 + q * 7;
        c.fillStyle = '#f58aa8'; c.fillRect(-5, -5, 10, 5);
        c.fillStyle = lerpColor('#ffe9c4', '#e7b268', q); ell(c, 0, -5, 6, h * .5); c.fill();
      } else { c.scale(.26, .26); drawCupcake(c); }
      c.restore();
    }
  } else if (recipe === 'croissant'){
    for (let i = 0; i < 3; i++){ c.save(); c.translate(-32 + i * 18, -118); c.scale(.33, .33); drawCroissant(c, q); c.restore(); }
  } else if (recipe === 'sponge'){
    c.save(); c.translate(-14, -116);
    c.fillStyle = '#9a8f9a'; rr(c, -18, -2, 36, 8, 2); c.fill();
    const h = 4 + q * 10;
    c.fillStyle = lerpColor('#ffe9c4', '#f0bd72', q); c.beginPath(); c.ellipse(0, -1, 17, h * .6, 0, Math.PI, 0); c.fill();
    c.restore();
  }
}
function ovenStatus(c, m, T, overridden){
  const x = m.x + 64, y = m.base - 178;
  if (m.state === 'baking'){
    progressRing(c, x, y, 13, m.t / m.dur);
    if (overridden) drawDessert(c, m.recipe === 'sponge' ? 'sponge' : m.recipe, x, y, 16);
  } else if (m.state === 'done') readyBadge(c, m.x + 66, m.base - 186, T);
}

function drawSpinner(c, m, T){
  const x = m.x, b = m.base;
  ell(c, x + 4, b + 2, 70, 12, 'rgba(120,60,70,.16)');
  const spinning = m.state === 'spinning';
  if (!drawOverride(c, 'machines/cotton_candy_spinner', x, b, 150, 170)){
    c.save(); c.translate(x, b); c.lineJoin = 'round'; c.lineWidth = 2.4; c.strokeStyle = OUT;
    // candy-striped cart
    rr(c, -58, -66, 116, 60, 10); c.save(); c.clip();
    c.fillStyle = '#fff6fa'; c.fillRect(-60, -70, 120, 70);
    c.fillStyle = '#ff9fbb'; for (let i = -6; i < 8; i++){ c.beginPath(); c.moveTo(i * 18, -70); c.lineTo(i * 18 + 9, -70); c.lineTo(i * 18 - 21, 0); c.lineTo(i * 18 - 30, 0); c.closePath(); c.fill(); }
    c.restore();
    rr(c, -58, -66, 116, 60, 10); c.stroke();
    rr(c, -62, -74, 124, 12, 6); c.fillStyle = '#fff2c9'; c.fill(); c.stroke();
    for (const wx of [-40, 40]){ circ(c, wx, -4, 9); c.fillStyle = '#b9a2ec'; c.fill(); c.stroke(); circ(c, wx, -4, 3); c.fillStyle = '#fff'; c.fill(); }
    handCard(c, 0, -38, 74, 24, 'cotton candy', null, '#fffaf0', OUT, -.03);
    // bowl
    c.beginPath(); c.ellipse(0, -76, 46, 12, 0, 0, Math.PI); c.fillStyle = '#e9e3ee'; c.fill(); c.stroke();
    // floss inside
    const q = spinning ? m.t / m.dur : 0;
    c.save(); c.beginPath(); c.ellipse(0, -112, 44, 50, 0, Math.PI, 0); c.lineTo(44, -76); c.ellipse(0, -76, 44, 12, 0, 0, Math.PI); c.closePath(); c.clip();
    if (spinning){
      c.strokeStyle = 'rgba(255,170,205,.75)'; c.lineWidth = 1.2;
      for (let i = 0; i < 6; i++){ const a = T * 7 + i; c.beginPath(); c.ellipse(0, -84, 30 + i * 2, 6 + i, 0, a, a + 2.2); c.stroke(); }
    }
    c.restore();
    // stick with sugar winding round it
    c.lineCap = 'round'; c.lineWidth = 4; c.strokeStyle = OUT; c.beginPath(); c.moveTo(0, -80); c.lineTo(0, -122); c.stroke();
    c.lineWidth = 2.4; c.strokeStyle = '#fbe7c9'; c.stroke();
    if (spinning){
      const r = 5 + q * 19;
      c.save(); c.translate(0, -112 + q * 4);
      c.fillStyle = 'rgba(255,184,214,.95)'; c.strokeStyle = 'rgba(122,74,85,.55)'; c.lineWidth = 1.4;
      ell(c, 0, 0, r, r * .9); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.3;
      for (let i = 0; i < 3; i++){ const a = T * 9 + i * 2.1; c.beginPath(); c.ellipse(0, 0, r * .8, r * .35, .3, a, a + 2); c.stroke(); }
      c.restore();
    }
    // glass dome
    c.beginPath(); c.ellipse(0, -76, 46, 54, 0, Math.PI, 0);
    c.fillStyle = 'rgba(230,245,255,.18)'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(107,65,80,.7)'; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3;
    c.save(); c.translate(0, -76); c.rotate(spinning ? Math.sin(T * 3) * .05 : 0);
    c.beginPath(); c.ellipse(0, 0, 38, 44, 0, 3.5, 4.3); c.stroke(); c.restore();
    circ(c, 0, -132, 6); c.fillStyle = '#ff8fab'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
    // finished candy waiting in the holder
    if (m.state === 'done'){
      rr(c, 52, -64, 26, 26, 6); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2; c.stroke();
      c.fillStyle = '#ff9fbb'; c.fillRect(54, -56, 22, 5);
      for (let i = 0; i < 3; i++){ c.save(); c.translate(56 + i * 9, -78 - (i % 2) * 6); c.scale(.42, .42); drawCottonCandy(c); c.restore(); }
    }
    c.restore();
  }
  if (spinning) progressRing(c, x + 70, b - 150, 13, m.t / m.dur, '#c9a6f5');
  else if (m.state === 'done') readyBadge(c, x, b - 158, T);
}

function drawRoller(c, m, T){
  const x = m.x, b = m.base;
  const rolling = m.state === 'rolling';
  if (!drawOverride(c, 'machines/pastry_roller', x, b, 100, 100)){
    c.save(); c.translate(x, b); c.lineJoin = 'round'; c.lineWidth = 2.2; c.strokeStyle = OUT;
    ell(c, 0, 2, 46, 8, 'rgba(120,60,70,.14)');
    let g = c.createLinearGradient(0, -74, 0, 0); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#f3e3c3');
    rr(c, -44, -70, 88, 66, 14); c.fillStyle = g; c.fill(); c.stroke();
    c.strokeStyle = PAL.goldD; c.lineWidth = 1.6; rr(c, -38, -64, 76, 54, 10); c.stroke();
    c.strokeStyle = OUT; c.lineWidth = 2.2;
    g = c.createLinearGradient(0, -82, 0, -70); g.addColorStop(0, '#f8e3a8'); g.addColorStop(1, '#d9a94e');
    rr(c, -48, -82, 96, 14, 7); c.fillStyle = g; c.fill(); c.stroke();
    rr(c, -32, -58, 64, 34, 8); c.fillStyle = '#ead7b6'; c.fill(); c.stroke();
    // dough sheet travelling through the rollers
    if (rolling){ const q = m.t / m.dur; c.fillStyle = '#fbf0da'; rr(c, -22, -58, 44, 8 + q * 30, 3); c.fill(); c.lineWidth = 1.2; c.stroke(); c.lineWidth = 2.2; }
    for (const ry of [-52, -38]){
      g = c.createLinearGradient(0, ry - 5, 0, ry + 5); g.addColorStop(0, '#fff1c4'); g.addColorStop(.5, '#e6bd62'); g.addColorStop(1, '#b8862f');
      rr(c, -30, ry - 5, 60, 10, 5); c.fillStyle = g; c.fill(); c.stroke();
      c.save(); rr(c, -30, ry - 5, 60, 10, 5); c.clip();
      c.strokeStyle = 'rgba(150,100,30,.45)'; c.lineWidth = 1.2;
      const off = rolling ? (T * 40) % 8 : 0;
      for (let k = -34; k < 34; k += 8){ c.beginPath(); c.moveTo(k + off, ry - 5); c.lineTo(k + off - 3, ry + 5); c.stroke(); }
      c.restore();
    }
    // crank
    c.save(); c.translate(46, -46); c.rotate(rolling ? T * 4 : 0);
    circ(c, 0, 0, 10); c.fillStyle = '#f2d48a'; c.fill(); c.stroke();
    c.lineWidth = 2; for (let i = 0; i < 4; i++){ const a = i / 4 * TAU; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); c.stroke(); }
    c.restore();
    bow(c, -30, -76, 14, '#ffd3de');
    c.restore();
  }
  // finished dough waits on the tray in front
  if (m.state === 'done') drawDessert(c, 'dough', x, b + 26, 40);
  if (rolling) progressRing(c, x + 50, b - 88, 12, m.t / m.dur, PAL.goldD);
  else if (m.state === 'done') readyBadge(c, x, b - 98, T);
}

function drawCakeStation(c, m, T){
  const x = m.x, b = m.base;
  ell(c, x + 4, b + 2, 78, 12, 'rgba(120,60,70,.16)');
  if (!drawOverride(c, 'machines/cake_station', x, b, 160, 150)){
    c.save(); c.translate(x, b); c.lineJoin = 'round'; c.lineWidth = 2.4; c.strokeStyle = OUT;
    let g = c.createLinearGradient(0, -82, 0, 0); g.addColorStop(0, '#e6dafb'); g.addColorStop(1, '#c4aef0');
    rr(c, -72, -80, 144, 80, 10); c.fillStyle = g; c.fill(); c.stroke();
    c.lineWidth = 1.5; scallops(c, -70, 70, -80, 6, '#fbf7ff', OUT);
    bow(c, 0, -48, 22, '#ffb3c6');
    c.lineWidth = 2.4;
    rr(c, -76, -90, 152, 12, 5); c.fillStyle = '#fbf7ff'; c.fill(); c.stroke();
    // batter bowl (sponge batter comes from here)
    c.save(); c.translate(-50, -102); c.scale(.62, .62); drawBatter(c); c.restore();
    // turntable
    const spin = m.stage === 'empty' ? T * .3 : T * (m.flash > 0 ? 3.2 : .8);
    rr(c, 0, -100, 12, 10, 3); c.fillStyle = '#e6dafb'; c.fill(); c.stroke();
    ell(c, 6, -101, 34, 9); c.fillStyle = '#ffffff'; c.fill(); c.stroke();
    c.fillStyle = '#c9b2f2';
    for (let i = 0; i < 8; i++){ const a = i / 8 * TAU + spin; if (Math.sin(a) < 0) continue; circ(c, 6 + Math.cos(a) * 30, -101 + Math.sin(a) * 7.5, 1.6); c.fill(); }
    if (m.stage !== 'empty'){
      c.save(); c.translate(6, -116); c.scale(.92, .92);
      drawWholeCake(c, m.cream, m.berries, spin);
      c.restore();
    }
    // piping bag + strawberries
    c.save(); c.translate(56, -104); c.rotate(.5);
    c.beginPath(); c.moveTo(-7, -14); c.lineTo(7, -14); c.lineTo(1, 10); c.lineTo(-1, 10); c.closePath(); c.fillStyle = '#fff4f6'; c.fill(); c.lineWidth = 1.8; c.stroke();
    c.fillStyle = '#ffb3c6'; c.fillRect(-6, -14, 12, 5); c.restore();
    c.beginPath(); c.ellipse(60, -92, 13, 5, 0, 0, Math.PI); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.8; c.stroke();
    strawberry(c, 55, -95, 8); strawberry(c, 64, -95, 8);
    handCard(c, -34, -26, 58, 20, 'cake studio', null, '#fffaf0', OUT, -.05);
    c.restore();
  }
  if (m.stage === 'done') readyBadge(c, x + 6, b - 170, T, 'Cake ready!');
}

function drawLockedGhost(c, kind, x, b){
  c.save(); ghostStyle(c);
  c.lineWidth = 2; c.strokeStyle = '#b88aa0'; c.fillStyle = 'rgba(255,255,255,.35)';
  if (kind === 'cake'){ rr(c, x - 72, b - 80, 144, 80, 10); c.fill(); c.stroke(); ell(c, x + 6, b - 101, 34, 9); c.stroke(); c.beginPath(); c.ellipse(x + 6, b - 118, 22, 16, 0, Math.PI, 0); c.stroke(); }
  if (kind === 'roller'){ rr(c, x - 44, b - 70, 88, 66, 14); c.fill(); c.stroke(); rr(c, x - 30, b - 57, 60, 10, 5); c.stroke(); rr(c, x - 30, b - 43, 60, 10, 5); c.stroke(); }
  c.restore();
}

/* ---------------- display case ---------------- */
function drawDisplayCase(c, d, owned, stock, T, highlightIdx){
  const { x0, y0, x1, y1 } = d;
  ell(c, (x0 + x1) / 2, y1 + 4, (x1 - x0) / 2 + 10, 12, 'rgba(120,60,70,.16)');
  c.save(); c.lineJoin = 'round';
  // cabinet
  let g = c.createLinearGradient(0, y0 + 36, 0, y1);
  g.addColorStop(0, '#ffaac0'); g.addColorStop(1, '#f2809e');
  rr(c, x0, y0 + 36, x1 - x0, y1 - y0 - 36, 10); c.fillStyle = g; c.fill(); c.lineWidth = 2.4; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 1.5; scallops(c, x0 + 4, x1 - 4, y0 + 36, 7, '#fff8ee', OUT);
  // glass box
  const gx = x0 + 4, gy = y0 - 26, gw = x1 - x0 - 8, gh = 64;
  rr(c, gx, gy, gw, gh, 12); c.fillStyle = '#fff3f0'; c.fill();
  c.fillStyle = 'rgba(255,200,215,.35)'; c.fillRect(gx + 4, gy + 30, gw - 8, 4);
  c.fillStyle = '#f6dcc3'; rr(c, gx + 4, gy + gh - 16, gw - 8, 12, 3); c.fill();
  // desserts on the shelves
  DISPLAY_SECTIONS.forEach((r, i) => {
    const sx = d.sections[i].x;
    if (!owned[i]){
      c.fillStyle = 'rgba(205,184,240,.25)'; rr(c, sx - 36, gy + 6, 72, gh - 12, 8); c.fill();
      c.fillStyle = 'rgba(169,143,220,.55)'; heartPath(c, sx, gy + 26, 14); c.fill();
      c.font = `400 13px ${HANDWRITE}`; c.textAlign = 'center'; c.fillStyle = 'rgba(122,74,85,.55)'; c.fillText('soon', sx, gy + 46);
      return;
    }
    drawShelfItems(c, r, stock[r], sx, gy, T);
  });
  // glass front + reflections + gold dividers
  c.save(); rr(c, gx, gy, gw, gh, 12); c.clip();
  c.fillStyle = 'rgba(225,244,255,.16)'; c.fillRect(gx, gy, gw, gh);
  c.fillStyle = 'rgba(255,255,255,.35)';
  for (const off of [30, 170, 260]){ c.beginPath(); c.moveTo(gx + off, gy + gh); c.lineTo(gx + off + 28, gy); c.lineTo(gx + off + 40, gy); c.lineTo(gx + off + 12, gy + gh); c.closePath(); c.fill(); }
  c.restore();
  c.strokeStyle = PAL.goldD; c.lineWidth = 1.5;
  for (let i = 1; i < 4; i++){ const xx = (d.sections[i - 1].x + d.sections[i].x) / 2; c.beginPath(); c.moveTo(xx, gy + 6); c.lineTo(xx, gy + gh - 4); c.stroke(); }
  rr(c, gx, gy, gw, gh, 12); c.lineWidth = 2.4; c.strokeStyle = OUT; c.stroke();
  rr(c, gx - 4, gy - 8, gw + 8, 12, 6); c.fillStyle = '#fff8ee'; c.fill(); c.stroke();
  bow(c, (x0 + x1) / 2, gy - 4, 22, '#ff8fab');
  // handwritten flavour cards
  DISPLAY_SECTIONS.forEach((r, i) => {
    const sx = d.sections[i].x;
    if (owned[i]) handCard(c, sx, y1 - 14, 68, 24, RECIPES[r].short, '◎ ' + RECIPES[r].price, '#fffaf0', OUT, (i % 2 ? .03 : -.03));
    else handCard(c, sx, y1 - 14, 62, 20, '♡ soon', null, '#f3ecff', '#9a83c8', (i % 2 ? .03 : -.03));
    if (highlightIdx === i){
      c.save(); c.globalAlpha = .5 + .3 * Math.sin(T * 7); c.lineWidth = 3; c.strokeStyle = '#ff8fab';
      rr(c, sx - 38, gy - 2, 76, gh + 4, 10); c.stroke(); c.restore();
    }
  });
  c.restore();
}
function drawShelfItems(c, r, n, sx, gy, T){
  const back = gy + 22, front = gy + 42;
  if (r === 'cupcake'){
    const xs = [-27, -9, 9, 27];
    for (let i = 0; i < n; i++){ const row = i < 4 ? 1 : 0; drawDessert(c, 'cupcake', sx + xs[i % 4], row ? front : back, row ? 19 : 17); }
  } else if (r === 'candy'){
    c.fillStyle = '#fff'; rr(c, sx - 30, front + 4, 60, 6, 3); c.fill();
    const xs = [-20, 0, 20];
    for (let i = 0; i < n; i++){ const row = i < 3 ? 1 : 0; drawDessert(c, 'candy', sx + xs[i % 3] + (row ? 0 : 10), row ? front - 4 : back - 6, row ? 22 : 19); }
  } else if (r === 'croissant'){
    c.fillStyle = '#ffffff'; ell(c, sx, front + 8, 32, 5); c.fill();
    const xs = [-20, 0, 20];
    for (let i = 0; i < n; i++){ const row = i < 3 ? 1 : 0; drawDessert(c, 'croissant', sx + xs[i % 3] + (row ? 0 : 10), row ? front : back + 2, row ? 20 : 17); }
  } else if (r === 'cake'){
    const whole = Math.floor(n / 4), rest = n % 4;
    for (let i = 0; i < whole; i++){
      const cx = sx + (whole === 1 ? 0 : i ? 14 : -14), cy = i ? back + 6 : front - 2;
      c.fillStyle = '#fff'; ell(c, cx, cy + 9, 16, 4); c.fill();
      drawDessert(c, 'wholecake', cx, cy, 24);
    }
    const xs = [-24, -8, 8, 24];
    for (let j = 0; j < rest; j++) drawDessert(c, 'cake', sx + xs[j], whole ? back + 2 : front, 15);
  }
}

/* ---------------- staff placeholders (full body, drawn) ---------------- */
// Replaceable with assets/staff/<role>_walk_right.png (4 cells) and <role>_idle.png.
const STAFF_LOOKS = {
  assistant: { name: 'Momo', hair: '#7a4b3a', hair2: '#9b6450', skin: '#ffe4d4', top: '#c4e6b6', skirt: '#93c787', apron: '#fffaf0', acc: 'bow', accCol: '#ff8fab', legs: '#fffaf5', shoe: '#8a5a4a' },
  baker:     { name: 'Kuri', hair: '#a86b3f', hair2: '#c38652', skin: '#f6d2b8', top: '#e6dafb', skirt: '#a98fdc', apron: '#ffffff', acc: 'hat', accCol: '#ffffff', legs: '#6b5a7a', shoe: '#5d3f3a', boy: true },
  server:    { name: 'Lulu', hair: '#b79ce6', hair2: '#d3c0f5', skin: '#ffe6d8', top: '#ffb3c6', skirt: '#f2708f', apron: '#fff8ee', acc: 'buns', accCol: '#ffd36b', legs: '#fffaf5', shoe: '#8a5a4a' },
};
const STAFF_ART = {};
for (const role of Object.keys(STAFF_LOOKS)){
  STAFF_ART[role] = {
    walk: optionalArt(`staff/${role}_walk_right`, 4, { hands: null }),
    idle: optionalArt(`staff/${role}_idle`),
  };
}
function drawStaffChibi(c, look, phase, moving, carrying, T){
  const O = OUT;
  c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = O; c.lineWidth = 2.2;
  const sw = moving ? Math.sin(phase) : 0;
  // legs
  for (const s of [-1, 1]){
    c.save(); c.translate(s * 7, -40); c.rotate(s * sw * .42);
    rr(c, -4.5, 0, 9, 36, 4.5); strokeFill(c, look.legs);
    ell(c, s * 2, 37, 7.5, 4.5); strokeFill(c, look.shoe);
    c.restore();
  }
  // skirt / shorts + apron
  c.beginPath();
  if (look.boy){ c.moveTo(-17, -66); c.lineTo(17, -66); c.lineTo(19, -38); c.lineTo(-19, -38); }
  else { c.moveTo(-15, -68); c.lineTo(15, -68); c.lineTo(24, -36); c.lineTo(-24, -36); }
  c.closePath(); strokeFill(c, look.skirt);
  rr(c, -17, -84, 34, 22, 10); strokeFill(c, look.top);
  c.beginPath(); c.moveTo(-11, -74); c.lineTo(11, -74); c.lineTo(15, -42); c.quadraticCurveTo(0, -36, -15, -42); c.closePath(); strokeFill(c, look.apron);
  c.lineWidth = 1.4; scallops(c, -14, 14, -42, 3.5, look.apron, O); c.lineWidth = 2.2;
  c.fillStyle = look.accCol === '#ffffff' ? '#ff8fab' : look.accCol; heartPath(c, 0, -56, 9); c.fill();
  // arms
  for (const s of [-1, 1]){
    c.save(); c.translate(s * 15, -80);
    if (carrying){ c.rotate(-s * .9); rr(c, -4.5, 0, 9, 20, 4.5); strokeFill(c, look.top); circ(c, 0, 21, 4.6); strokeFill(c, look.skin); }
    else { c.rotate(s * (.12 - sw * .35 * s)); rr(c, -4.5, 0, 9, 24, 4.5); strokeFill(c, look.top); circ(c, 0, 25, 4.6); strokeFill(c, look.skin); }
    c.restore();
  }
  // head
  const hy = -112;
  if (look.acc === 'buns'){ circ(c, -22, hy - 22, 10); strokeFill(c, look.hair); circ(c, 22, hy - 22, 10); strokeFill(c, look.hair); }
  ell(c, 0, hy - 2, 30, 29); strokeFill(c, look.hair);
  ell(c, 0, hy + 4, 24, 22); strokeFill(c, look.skin);
  c.beginPath(); c.moveTo(-28, hy + 4); c.bezierCurveTo(-30, hy - 36, 30, hy - 36, 28, hy + 4);
  c.quadraticCurveTo(22, hy - 4, 15, hy + 3); c.quadraticCurveTo(8, hy - 7, 1, hy + 2); c.quadraticCurveTo(-7, hy - 7, -13, hy + 3); c.quadraticCurveTo(-21, hy - 4, -28, hy + 4);
  c.closePath(); strokeFill(c, look.hair);
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2.4; c.beginPath(); c.arc(-4, hy - 14, 13, -2.7, -1.95); c.stroke();
  c.strokeStyle = O; c.lineWidth = 2.2;
  // accessory
  if (look.acc === 'hat'){
    rr(c, -18, hy - 40, 36, 14, 4); strokeFill(c, '#fff');
    for (const [hx, hr] of [[-12, 11], [0, 14], [12, 11]]){ circ(c, hx, hy - 46, hr); c.fillStyle = '#fff'; c.fill(); c.stroke(); }
    rr(c, -18, hy - 40, 36, 12, 4); c.fillStyle = '#fff'; c.fill();
    c.fillStyle = '#ff8fab'; c.fillRect(-18, hy - 32, 36, 4);
  } else if (look.acc === 'bow') bow(c, 18, hy - 24, 18, look.accCol);
  else if (look.acc === 'buns'){ c.fillStyle = look.accCol; circ(c, -14, hy - 26, 3); c.fill(); circ(c, 14, hy - 26, 3); c.fill(); }
  // face
  const blink = (Math.sin(T * 1.3 + look.name.length) > .985);
  c.fillStyle = '#4a2b3a'; c.strokeStyle = '#4a2b3a';
  for (const s of [-1, 1]){
    if (blink){ c.beginPath(); c.moveTo(s * 9 - 3.5, hy + 8); c.lineTo(s * 9 + 3.5, hy + 8); c.stroke(); }
    else { ell(c, s * 9, hy + 8, 3.5, 4.6); c.fill(); c.fillStyle = '#fff'; circ(c, s * 9 - 1.2, hy + 6.4, 1.4); c.fill(); c.fillStyle = '#4a2b3a'; }
  }
  c.fillStyle = 'rgba(255,130,160,.45)'; ell(c, -15, hy + 15, 5, 3); c.fill(); ell(c, 15, hy + 15, 5, 3); c.fill();
  c.lineWidth = 1.8; c.strokeStyle = '#4a2b3a'; c.beginPath(); c.arc(0, hy + 14, 3.2, .3, Math.PI - .3); c.stroke();
}

/* ---------------- room: walls, floors and areas (pre-rendered) ---------------- */
function drawWallpaper(c, x0, x1){
  let g = c.createLinearGradient(0, 0, 0, FLOOR); g.addColorStop(0, '#fff3dc'); g.addColorStop(1, '#ffe9cc');
  c.fillStyle = g; c.fillRect(x0, 0, x1 - x0, FLOOR);
  const R = mulberry32(11);
  for (let y = 22, row = 0; y < 146; y += 30, row++){
    for (let x = x0 + (row % 2 ? 22 : 6); x < x1; x += 34){
      if ((x * 7 + row * 3) % 5 === 0){ c.save(); c.globalAlpha = .55; strawberry(c, x, y, 8); c.restore(); }
      else { c.fillStyle = R() < .5 ? 'rgba(255,170,190,.35)' : 'rgba(190,160,235,.3)'; circ(c, x, y, 2); c.fill(); }
    }
  }
}
function drawWainscot(c, x0, x1, col = '#ffc4d2'){
  c.fillStyle = col; c.fillRect(x0, 150, x1 - x0, 52);
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
  for (let x = x0 + 10; x < x1 - 20; x += 92){ rr(c, x, 162, 78, 30, 7); c.stroke(); }
  c.fillStyle = '#fff4ea'; c.fillRect(x0, 143, x1 - x0, 9);
  c.lineWidth = 1.2; scallops(c, x0, x1, 152, 5, '#fff4ea', 'rgba(150,90,100,.35)');
  c.fillStyle = '#e0a0a0'; c.fillRect(x0, 200, x1 - x0, 10);
  c.fillStyle = '#f2bcb4'; c.fillRect(x0, 200, x1 - x0, 3);
}
const WIN = { x: 470, y: 24, w: 340, h: 120 };
function windowPath(c){
  const { x, y, w, h } = WIN, r = 54;
  c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h); c.closePath();
}
function drawWindow(c){
  const { x, y, w, h } = WIN;
  c.save(); windowPath(c); c.clip();
  let g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#b9a6ee'); g.addColorStop(.42, '#f5a9cb'); g.addColorStop(.78, '#ffc49d'); g.addColorStop(1, '#ffe3a8');
  c.fillStyle = g; c.fillRect(x, y, w, h);
  const sx = 612, sy = y + h - 16;
  g = c.createRadialGradient(sx, sy, 0, sx, sy, 110);
  g.addColorStop(0, 'rgba(255,246,214,.95)'); g.addColorStop(.25, 'rgba(255,226,180,.6)'); g.addColorStop(1, 'rgba(255,210,170,0)');
  c.fillStyle = g; c.fillRect(x, y, w, h);
  circ(c, sx, sy, 24); c.fillStyle = '#fff4d4'; c.fill();
  c.fillStyle = 'rgba(255,232,240,.75)';
  for (const [cx, cy, s] of [[520, 62, 1], [700, 50, .8], [760, 88, .6]]){ ell(c, cx, cy, 30 * s, 8 * s); c.fill(); ell(c, cx + 14 * s, cy - 6 * s, 16 * s, 9 * s); c.fill(); }
  c.fillStyle = 'rgba(222,150,200,.8)';
  c.beginPath(); c.moveTo(x, y + h); c.bezierCurveTo(x + 60, y + 88, x + 140, y + 96, x + 190, y + 108); c.bezierCurveTo(x + 250, y + 92, x + 300, y + 96, x + w, y + 104); c.lineTo(x + w, y + h); c.closePath(); c.fill();
  c.fillStyle = '#c792c6';
  c.beginPath(); c.moveTo(x, y + h); c.bezierCurveTo(x + 80, y + 104, x + 160, y + 116, x + 240, y + 112); c.bezierCurveTo(x + 290, y + 108, x + 320, y + 112, x + w, y + 114); c.lineTo(x + w, y + h); c.closePath(); c.fill();
  c.strokeStyle = '#8b5b6c'; c.lineCap = 'round';
  c.lineWidth = 9; c.beginPath(); c.moveTo(822, y + h); c.bezierCurveTo(790, 116, 786, 90, 760, 72); c.stroke();
  c.lineWidth = 5; c.beginPath(); c.moveTo(778, 88); c.bezierCurveTo(740, 82, 712, 64, 690, 40); c.stroke();
  c.lineWidth = 3.5; c.beginPath(); c.moveTo(760, 72); c.bezierCurveTo(746, 52, 752, 36, 740, 20); c.stroke();
  const R = mulberry32(3);
  for (const [cx, cy, r] of [[760, 64, 30], [700, 42, 26], [742, 26, 22], [668, 62, 20], [800, 82, 22], [790, 40, 18]]){
    for (let i = 0; i < 26; i++){ const a = R() * TAU, d = Math.sqrt(R()) * r; circ(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8, 3 + R() * 4.5); c.fillStyle = ['#ffc6d9', '#ffaecb', '#ffe2ec', '#ff9ec0'][(R() * 4) | 0]; c.fill(); }
  }
  c.restore();
  c.lineJoin = 'round';
  windowPath(c); c.lineWidth = 11; c.strokeStyle = '#fffaf4'; c.stroke(); c.lineWidth = 2; c.strokeStyle = 'rgba(214,150,140,.6)'; c.stroke();
  c.fillStyle = '#fffaf4'; c.fillRect(x + w / 2 - 3.5, y + 2, 7, h); c.fillRect(x, y + 66, w, 6);
  rr(c, x - 16, y + h - 4, w + 32, 13, 5); c.fillStyle = '#fff4ec'; c.fill();
  // little cake stand + jar on the sill
  c.fillStyle = '#fff'; c.strokeStyle = OUT; c.lineWidth = 1.5;
  rr(c, 498, y + h - 10, 4, 8, 1); c.fill(); c.stroke(); ell(c, 500, y + h - 11, 14, 3); c.fill(); c.stroke();
  c.save(); c.translate(500, y + h - 22); c.scale(.42, .42); drawCupcake(c); c.restore();
  for (const dir of [1, -1]){
    const x0 = dir === 1 ? 436 : 844;
    c.save(); c.translate(x0, 0); c.scale(dir, 1);
    const gg = c.createLinearGradient(0, 0, 56, 0); gg.addColorStop(0, '#ffb1c6'); gg.addColorStop(1, '#ffc9d7');
    c.beginPath(); c.moveTo(0, 14); c.lineTo(56, 14); c.bezierCurveTo(40, 50, 26, 84, 30, 104); c.bezierCurveTo(36, 120, 50, 136, 46, 156); c.lineTo(0, 156); c.closePath();
    c.fillStyle = gg; c.fill();
    c.fillStyle = '#ff8fb1'; rr(c, -2, 98, 38, 8, 4); c.fill();
    c.restore();
  }
  rr(c, 424, 12, 432, 6, 3); c.fillStyle = '#d99a7a'; c.fill();
}
function drawShopSign(c){
  const x = 322, y = 82;
  c.save();
  c.strokeStyle = 'rgba(150,100,90,.7)'; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(x - 80, y - 24); c.lineTo(x - 60, y - 44); c.moveTo(x + 80, y - 24); c.lineTo(x + 60, y - 44); c.stroke();
  rr(c, x - 112, y - 24, 224, 44, 12); c.fillStyle = '#ff9db6'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 1.3; scallops(c, x - 108, x + 108, y + 20, 6, '#fff8ee', OUT);
  rr(c, x - 105, y - 18, 210, 32, 8); c.strokeStyle = 'rgba(255,255,255,.7)'; c.setLineDash([5, 4]); c.lineWidth = 1.4; c.stroke(); c.setLineDash([]);
  c.font = `400 24px ${HANDWRITE}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 4.5; c.strokeStyle = '#e0567c'; c.strokeText("Sakura's Sweet Shop", x, y - 2);
  c.fillStyle = '#fffaf2'; c.fillText("Sakura's Sweet Shop", x, y - 2);
  strawberry(c, x - 99, y - 2, 11); strawberry(c, x + 99, y - 2, 11);
  c.restore();
}
function drawCheckerFloor(c, x0, y0, x1, y1, a, b, size, motif){
  c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
  for (let y = y0, r = 0; y < y1; y += size, r++){
    for (let x = x0, k = 0; x < x1; x += size, k++){
      c.fillStyle = (r + k) % 2 ? a : b; c.fillRect(x, y, size, size);
      if (motif && (r + k) % 2 === 0 && (r * 3 + k) % 4 === 0){ c.save(); c.globalAlpha = .55; motif(c, x + size / 2, y + size / 2); c.restore(); }
    }
  }
  c.strokeStyle = 'rgba(150,90,90,.12)'; c.lineWidth = 1;
  for (let x = x0; x <= x1; x += size){ c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); }
  for (let y = y0; y <= y1; y += size){ c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); }
  c.restore();
}
function drawWoodFloor(c){
  const R = mulberry32(7);
  let g = c.createLinearGradient(0, FLOOR, 0, H); g.addColorStop(0, '#f7dcc2'); g.addColorStop(1, '#f0c8a6');
  c.fillStyle = g; c.fillRect(0, FLOOR, W, H - FLOOR);
  for (let r = 0, y = FLOOR; y < H; r++, y += 34){
    c.fillStyle = r % 2 ? 'rgba(255,255,255,.07)' : 'rgba(170,100,70,.035)'; c.fillRect(0, y, W, 34);
    c.fillStyle = 'rgba(170,100,75,.18)'; c.fillRect(0, y, W, 1.5);
    const step = 210 + (r % 3) * 26;
    for (let x = -((r * 137) % step); x < W; x += step){ c.fillStyle = 'rgba(170,100,75,.16)'; c.fillRect(x, y, 1.5, 34); }
    c.strokeStyle = 'rgba(180,110,80,.06)'; c.lineWidth = 1;
    for (let i = 0; i < 5; i++){ const gx = R() * W, gy = y + 8 + R() * 18, gl = 40 + R() * 80; c.beginPath(); c.moveTo(gx, gy); c.bezierCurveTo(gx + gl * .3, gy - 3, gx + gl * .6, gy + 3, gx + gl, gy); c.stroke(); }
  }
}
function drawScallopRug(c, cx, cy, rx, ry, col, edge, inner){
  ell(c, cx + 4, cy + 8, rx + 8, ry + 6, 'rgba(160,80,80,.08)');
  c.fillStyle = edge;
  for (let i = 0; i < 70; i++){ const a = i / 70 * TAU; circ(c, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 10); c.fill(); }
  ell(c, cx, cy, rx, ry, col);
  c.save(); c.setLineDash([8, 7]); c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,.75)'; ell(c, cx, cy, rx - 18, ry - 12); c.stroke(); c.restore();
  if (inner) ell(c, cx, cy, rx * .55, ry * .5, inner);
}

function renderBackground(){
  const c = bgx;
  c.setTransform(px, 0, 0, px, 0, 0);
  c.clearRect(0, 0, W, H);
  const S = shop;
  const candyOpen = S.owned.spinner, pastryOpen = S.owned.roller, cakeOpen = S.owned.cake;
  // ---- walls
  drawWallpaper(c, 0, LAYOUT.candy.x0);
  drawWainscot(c, 0, LAYOUT.candy.x0);
  if (candyOpen){
    // candy corner: candy stripes, awning, bunting, glass jars
    const x0 = LAYOUT.candy.x0;
    c.fillStyle = '#fff6fa'; c.fillRect(x0, 0, W - x0, FLOOR);
    for (let x = x0; x < W; x += 28){ c.fillStyle = (Math.round((x - x0) / 28) % 2) ? 'rgba(255,170,200,.55)' : 'rgba(200,180,240,.45)'; c.fillRect(x, 0, 14, 150); }
    drawWainscot(c, x0, W, '#d9c9f6');
    c.lineJoin = 'round';
    for (let i = 0; i < 8; i++){
      const ax = x0 + i * ((W - x0) / 8);
      c.beginPath(); c.moveTo(ax, 0); c.lineTo(ax + (W - x0) / 8, 0); c.lineTo(ax + (W - x0) / 16, 40); c.closePath();
      c.fillStyle = i % 2 ? '#ff9fbb' : '#fff4f8'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
    }
    c.strokeStyle = 'rgba(122,74,85,.6)'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(x0 + 10, 62); c.quadraticCurveTo((x0 + W) / 2, 90, W - 10, 62); c.stroke();
    for (let i = 0; i < 11; i++){
      const t = (i + .5) / 11, fx = lerp(x0 + 10, W - 10, t), fy = 62 + Math.sin(t * Math.PI) * 14;
      c.beginPath(); c.moveTo(fx - 9, fy); c.lineTo(fx + 9, fy); c.lineTo(fx, fy + 16); c.closePath();
      c.fillStyle = CONFETTI_COLORS[i % 5]; c.fill(); c.lineWidth = 1.2; c.stroke();
    }
    // jars shelf
    rr(c, 1170, 128, 100, 8, 3); c.fillStyle = '#fff2c9'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = OUT; c.stroke();
    const jarCols = [['#ff8fab', '#ffd36b'], ['#b9a2ec', '#9fd8a6'], ['#8fd0f0', '#ff9fbb']];
    jarCols.forEach(([a, b2], i) => {
      const jx = 1190 + i * 31, jy = 128;
      c.save();
      rr(c, jx - 12, jy - 34, 24, 34, 7); c.fillStyle = 'rgba(235,248,255,.6)'; c.fill();
      c.save(); rr(c, jx - 12, jy - 34, 24, 34, 7); c.clip();
      for (let k = 0; k < 12; k++){ circ(c, jx - 8 + (k % 4) * 5.3, jy - 4 - Math.floor(k / 4) * 6, 3); c.fillStyle = k % 2 ? a : b2; c.fill(); }
      c.restore();
      rr(c, jx - 12, jy - 34, 24, 34, 7); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();
      rr(c, jx - 9, jy - 40, 18, 7, 3); c.fillStyle = a; c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(jx - 9, jy - 30, 3, 20);
      c.restore();
    });
    // lollipop sign
    c.lineWidth = 2; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(902, 140); c.lineTo(902, 96); c.stroke();
    circ(c, 902, 84, 18); c.fillStyle = '#fff'; c.fill(); c.stroke();
    for (let i = 0; i < 3; i++){ c.strokeStyle = ['#ff8fab', '#b9a2ec', '#9fd8a6'][i]; c.lineWidth = 3.5; c.beginPath(); c.arc(902, 84, 5 + i * 4.5, i, i + 4.2); c.stroke(); }
    handCard(c, 960, 118, 90, 26, 'candy corner', null, '#fffaf0', OUT, -.04);
  } else {
    // closed: plain wall and a drawn pink drape with a little sign
    drawWallpaper(c, LAYOUT.candy.x0, W);
    drawWainscot(c, LAYOUT.candy.x0, W);
  }
  drawWindow(c);
  drawShopSign(c);
  // ---- floors
  drawWoodFloor(c);
  // warm cake kitchen: buttercream + strawberry tiles
  drawCheckerFloor(c, 0, FLOOR, 452, 384, '#ffe1e8', '#fff4dc', 32, (cc, x, y) => strawberry(cc, x, y, 9));
  c.fillStyle = 'rgba(140,70,70,.1)'; c.fillRect(0, 384, 452, 3);
  // pastry counter area: cream and gold
  if (pastryOpen){
    drawCheckerFloor(c, 0, 388, 176, 640, '#fff8ea', '#fbefd2', 28, null);
    c.strokeStyle = PAL.gold; c.lineWidth = 3; c.strokeRect(2, 390, 172, 248);
  }
  // candy corner floor
  if (candyOpen) drawCheckerFloor(c, LAYOUT.candy.x0, FLOOR, W, LAYOUT.candy.y1, '#ebe2fb', '#e6f5df', 30, (cc, x, y) => { circ(cc, x, y, 3); cc.fillStyle = '#ff9fbb'; cc.fill(); });
  c.fillStyle = 'rgba(140,70,70,.18)';
  let g = c.createLinearGradient(0, FLOOR, 0, FLOOR + 40); g.addColorStop(0, 'rgba(140,70,70,.22)'); g.addColorStop(1, 'rgba(140,70,70,0)');
  c.fillStyle = g; c.fillRect(0, FLOOR, W, 40);
  // dining rug
  drawScallopRug(c, 930, 640, 330, 72, '#ffd5e0', '#ffc3d3', '#ffc8d7');
  // ---- pastry counter (part of the room)
  const pc = LAYOUT.roller.counter;
  rr(c, pc[0] + 8, pc[1] + 10, pc[2] - pc[0], pc[3] - pc[1], 14); c.fillStyle = 'rgba(130,60,60,.14)'; c.fill();
  rr(c, pc[0], pc[3] - 26, pc[2] - pc[0], 34, 10);
  c.fillStyle = pastryOpen ? '#f2dca8' : '#d79a72'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = OUT; c.stroke();
  rr(c, pc[0], pc[1], pc[2] - pc[0], pc[3] - pc[1] - 18, 14);
  if (pastryOpen){ g = c.createLinearGradient(pc[0], 0, pc[2], 0); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#f6ead2'); }
  else { g = c.createLinearGradient(pc[0], 0, pc[2], 0); g.addColorStop(0, '#f2c79c'); g.addColorStop(1, '#efc193'); }
  c.fillStyle = g; c.fill(); c.stroke();
  if (pastryOpen){
    c.strokeStyle = 'rgba(200,170,120,.35)'; c.lineWidth = 1.2;
    for (let i = 0; i < 6; i++){ c.beginPath(); c.moveTo(pc[0] + 10 + i * 15, pc[1] + 8); c.bezierCurveTo(pc[0] + 30 + i * 12, pc[1] + 80, pc[0] + i * 14, pc[1] + 160, pc[0] + 20 + i * 13, pc[3] - 30); c.stroke(); }
    rr(c, pc[0] + 3, pc[1] + 3, pc[2] - pc[0] - 6, pc[3] - pc[1] - 24, 11); c.strokeStyle = PAL.gold; c.lineWidth = 3; c.stroke();
    handCard(c, (pc[0] + pc[2]) / 2, pc[3] - 46, 84, 22, 'pastry counter', null, '#fffaf0', '#a9772c', .02);
  }
  // string-light wire
  c.strokeStyle = 'rgba(120,75,80,.75)'; c.lineWidth = 1.6;
  for (let i = 0; i < LIGHT_HOOKS.length - 1; i++){
    const x0 = LIGHT_HOOKS[i], x1 = LIGHT_HOOKS[i + 1];
    c.beginPath(); c.moveTo(x0, LIGHT_Y); c.quadraticCurveTo((x0 + x1) / 2, LIGHT_Y + 2 * LIGHT_SAG, x1, LIGHT_Y); c.stroke();
  }
}
// The closed candy corner (drawn live so it can lift away when you buy the spinner).
function drawCandyCurtain(c, lift, T){
  const x0 = LAYOUT.candy.x0, y1 = LAYOUT.candy.y1;
  if (lift >= 1) return;
  const up = easeOut(clamp(lift, 0, 1)) * (y1 + 40);
  c.save();
  c.beginPath(); c.rect(x0, 0, W - x0, y1 + 30); c.clip();
  c.translate(0, -up);
  // drape across the whole corner
  const g = c.createLinearGradient(x0, 0, W, 0);
  g.addColorStop(0, '#ffc1d1'); g.addColorStop(.5, '#ffd6e1'); g.addColorStop(1, '#ffc1d1');
  c.beginPath(); c.moveTo(x0, 0); c.lineTo(W, 0); c.lineTo(W, y1 - 18);
  for (let x = W; x >= x0; x -= 34) c.quadraticCurveTo(x - 17, y1 + 8, x - 34, y1 - 18);
  c.closePath(); c.fillStyle = g; c.fill(); c.lineWidth = 2.2; c.strokeStyle = OUT; c.stroke();
  c.strokeStyle = 'rgba(230,120,150,.35)'; c.lineWidth = 2;
  for (let x = x0 + 24; x < W; x += 34){ c.beginPath(); c.moveTo(x, 4); c.quadraticCurveTo(x + 6 * Math.sin(T + x), y1 / 2, x, y1 - 16); c.stroke(); }
  bow(c, (x0 + W) / 2, 120, 46, '#ff8fab');
  handCard(c, (x0 + W) / 2, 220, 150, 40, 'candy corner', 'opening soon ♡', '#fffaf0', OUT, -.02);
  c.restore();
  if (lift <= 0){
    // velvet rope + gold posts in front
    const y = y1 + 2;
    c.save(); c.lineWidth = 2; c.strokeStyle = OUT;
    for (const px_ of [x0 + 20, (x0 + W) / 2, W - 20]){ rr(c, px_ - 4, y - 36, 8, 38, 3); c.fillStyle = PAL.gold; c.fill(); c.stroke(); circ(c, px_, y - 38, 6); c.fill(); c.stroke(); }
    c.strokeStyle = '#f2708f'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(x0 + 20, y - 30); c.quadraticCurveTo((x0 * 3 + W) / 4 + 10, y - 6, (x0 + W) / 2, y - 30); c.quadraticCurveTo((x0 + W * 3) / 4, y - 6, W - 20, y - 30); c.stroke();
    c.restore();
  }
}

function renderVignette(){
  const c = vigx;
  c.setTransform(px, 0, 0, px, 0, 0); c.clearRect(0, 0, W, H);
  const g = c.createRadialGradient(W / 2, H * .52, 280, W / 2, H * .52, 840);
  g.addColorStop(0, 'rgba(110,45,80,0)'); g.addColorStop(1, 'rgba(110,45,80,.26)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

const LIGHT_HOOKS = [236, 585, 930, 1278];
const LIGHT_Y = 3, LIGHT_SAG = 22;
const BULB_COLORS = ['#fff1c9', '#ffc2d6', '#ffd8a8', '#e0d3ff'];
const BULBS = [];
for (let i = 0; i < LIGHT_HOOKS.length - 1; i++){
  const x0 = LIGHT_HOOKS[i], x1 = LIGHT_HOOKS[i + 1], n = 8;
  for (let k = 1; k < n; k++){ const u = k / n; BULBS.push({ x: lerp(x0, x1, u), y: LIGHT_Y + 4 * LIGHT_SAG * u * (1 - u), col: BULB_COLORS[BULBS.length % 4], ph: Math.random() * TAU }); }
}
