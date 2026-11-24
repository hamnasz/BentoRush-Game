/* Sakura's Sweet Shop — people: seated guests, Sakura, and the helpers. */
'use strict';

/* =========================================================
   Guests (waist-up portraits: 4 cells = wait / worried / happy / sad)
   ========================================================= */
const GUESTS = [
  { id: 'boy',     wrist: 0.8939 },
  { id: 'courier', wrist: 0.8799 },
  { id: 'grandma', wrist: 0.8785 },
].map(g => Object.assign(g, { body: loadArt(`assets/customers/${g.id}.png`, 4), hands: loadArt(`assets/customers/${g.id}_hands.png`, 4) }));
const MOOD_CELL = { wait: 0, worried: 1, happy: 2, sad: 3 };
const GUEST_H = 136, TABLE_BACK = -33;
const HAIR = ['#8fd3c1', '#b9a3ea', '#f4ad84', '#8b6656', '#9cc3f2', '#f3d27c', '#6a5677', '#f59ab5'];
const SKIN = ['#ffe6d8', '#f8d5bf', '#ecbc99', '#c99372'];
const SHIRT = ['#ffd27f', '#a8e0c8', '#c8b8ff', '#ffb4c6', '#9fd0f5', '#ffc59e'];
const RIBBON = ['#ff7fa6', '#ff6b7f', '#a98bff', '#5fbfa0'];
const ACC = ['cat', 'bunny', 'bear', 'bow', 'sprout', 'none', 'cat', 'bow', 'bunny'];
const CO = 'rgba(107,65,80,.78)';

function makeCustomer(tb){
  const cu = { hair: pick(HAIR), skin: pick(SKIN), shirt: pick(SHIRT), ribbon: pick(RIBBON), ribbon2: pick(RIBBON), acc: pick(ACC), long: Math.random() < .4, guest: null };
  const ready = GUESTS.filter(g => g.body.ok && g.hands.ok);
  if (ready.length){
    const seated = new Set(TABLES.filter(t => t !== tb && t.cu && t.cu.guest).map(t => t.cu.guest.id));
    let pool = ready.filter(g => !seated.has(g.id)); if (!pool.length) pool = ready;
    if (pool.length > 1 && tb.lastGuest){ const fresh = pool.filter(g => g.id !== tb.lastGuest); if (fresh.length) pool = fresh; }
    cu.guest = pick(pool); tb.lastGuest = cu.guest.id;
  }
  return cu;
}
function pickOrder(tb){
  const av = availableRecipes();
  while (shop.forced.length){ const f = shop.forced.shift(); if (av.includes(f)) return f; }
  let o; let guard = 0;
  do { o = pick(av); } while (av.length > 1 && o === tb.lastOrder && Math.random() < .6 && guard++ < 6);
  return o;
}
function spawnCustomer(tb){
  tb.cu = makeCustomer(tb);
  tb.order = pickOrder(tb); tb.lastOrder = tb.order;
  tb.state = 'arrive'; tb.anim = 0; tb.wrong = 0; tb.claimedBy = null; tb.since = performance.now();
  Sfx.arrive(); sparkles(tb.x, tb.y - 80, 6);
}
function updateTables(dt, open){
  for (const tb of TABLES){
    tb.wrong = Math.max(0, tb.wrong - dt);
    tb.nextBlink -= dt; if (tb.nextBlink <= 0){ tb.blink = .13; tb.nextBlink = rand(2, 4.5); }
    tb.blink -= dt;
    if (tb.state === 'empty'){ if (open){ tb.cool -= dt; if (tb.cool <= 0) spawnCustomer(tb); } }
    else if (tb.state === 'arrive'){ tb.anim += dt; if (tb.anim >= .5){ tb.state = 'wait'; tb.anim = 0; } }
    else if (tb.state === 'happy'){
      tb.anim += dt;
      if (tb.anim >= 1.8){ tb.state = 'empty'; tb.cu = null; tb.order = null; tb.claimedBy = null; tb.cool = rand(2.5, 6); saveSoon(); }
    }
    // no patience timer: a waiting guest simply keeps waiting, happily
  }
}
function customerMood(tb){
  if (tb.state === 'happy') return 'happy';
  if (tb.wrong > 0) return 'worried';
  return 'wait';
}
function guestXform(tb){
  let a = 1, s = 1, sy = 1 + Math.sin(T * 2.2 + tb.x * .01) * .006;
  if (tb.state === 'arrive'){ const q = clamp(tb.anim / .45, 0, 1); a = clamp(q * 2.2, 0, 1); s = .72 + .28 * easeOutBack(q); }
  else if (tb.state === 'happy'){ const q = clamp(tb.anim / 1.8, 0, 1); sy += Math.abs(Math.sin(q * Math.PI * 4)) * .035 * (1 - q); if (q > .66) a = 1 - (q - .66) / .34; }
  return { a: clamp(a, 0, 1), s, sy, dy: 0 };
}
function chibiXform(tb){
  let a = 1, s = 1, dy = Math.sin(T * 2.2 + tb.x * .01) * 1.2;
  if (tb.state === 'arrive'){ const q = clamp(tb.anim / .45, 0, 1); a = clamp(q * 2.2, 0, 1); s = .55 + .45 * easeOutBack(q); }
  else if (tb.state === 'happy'){ const q = clamp(tb.anim / 1.8, 0, 1); dy -= Math.abs(Math.sin(q * Math.PI * 3)) * 8 * (1 - q); if (q > .66){ a = 1 - (q - .66) / .34; dy -= (q - .66) * 40; } }
  return { a: clamp(a, 0, 1), s, sy: 1, dy };
}
function drawCustomer(c, tb, xf, layer){
  const cu = tb.cu, g = cu.guest;
  if (g){
    const art = layer === 'body' ? g.body : g.hands;
    if (!isOk(art)) return;
    const cell = MOOD_CELL[customerMood(tb)];
    const dh = GUEST_H, dw = dh * art.cw / art.ch;
    c.save(); c.globalAlpha = xf.a;
    c.translate(tb.x, tb.y + TABLE_BACK + xf.dy); c.scale(xf.s, xf.s * xf.sy);
    c.drawImage(art.img, cell * art.cw, 0, art.cw, art.ch, -dw / 2, -g.wrist * dh, dw, dh);
    c.restore();
    return;
  }
  c.save(); c.globalAlpha = xf.a;
  c.translate(tb.x, tb.y - 24 + xf.dy); c.scale(xf.s, xf.s);
  if (layer === 'body') drawChibiGuest(c, cu, customerMood(tb), tb.blink > 0);
  else { c.lineWidth = 2; c.strokeStyle = CO; for (const s of [-1, 1]){ circ(c, s * 21, -6, 6.5); strokeFill(c, cu.skin); } }
  c.restore();
}
function drawChibiGuest(c, cu, mood, blink){
  c.lineWidth = 2.2; c.strokeStyle = CO; c.lineJoin = 'round'; c.lineCap = 'round';
  if (cu.acc === 'bunny'){ for (const s of [-1, 1]){ c.save(); c.translate(s * 10, -103); c.rotate(s * .22); ell(c, 0, 0, 7.5, 19); strokeFill(c, '#fffafc'); ell(c, 0, 2, 3.5, 13, '#ffc2d4'); c.restore(); } }
  else if (cu.acc === 'cat'){ for (const s of [-1, 1]){ c.beginPath(); c.moveTo(s * 27, -78); c.lineTo(s * 22, -104); c.lineTo(s * 7, -90); c.closePath(); strokeFill(c, cu.hair); } }
  else if (cu.acc === 'bear'){ for (const s of [-1, 1]){ circ(c, s * 21, -89, 9.5); strokeFill(c, cu.hair); circ(c, s * 21, -89, 4.5); c.fillStyle = '#ffc2d4'; c.fill(); } }
  if (cu.long){ rr(c, -31, -82, 62, 64, 22); strokeFill(c, cu.hair); }
  rr(c, -23, -44, 46, 56, 18); strokeFill(c, cu.shirt);
  c.fillStyle = '#fffaf7'; c.beginPath(); c.moveTo(-12, -43); c.lineTo(0, -32); c.lineTo(12, -43); c.closePath(); c.fill();
  ell(c, 0, -68, 31, 30); strokeFill(c, cu.hair);
  ell(c, 0, -63, 24.5, 23.5); strokeFill(c, cu.skin);
  rr(c, -30, -75, 10, 33, 5); strokeFill(c, cu.hair); rr(c, 20, -75, 10, 33, 5); strokeFill(c, cu.hair);
  c.beginPath(); c.moveTo(-29, -62); c.bezierCurveTo(-31, -102, 31, -102, 29, -62);
  c.quadraticCurveTo(24, -70, 17, -60); c.quadraticCurveTo(11, -71, 3, -61); c.quadraticCurveTo(-5, -72, -12, -60); c.quadraticCurveTo(-20, -70, -29, -62);
  c.closePath(); strokeFill(c, cu.hair);
  if (cu.acc === 'bow') bow(c, 19, -86, 18, cu.ribbon2);
  const E = '#4a2b3a';
  c.fillStyle = mood === 'happy' ? 'rgba(255,110,145,.6)' : 'rgba(255,135,160,.45)';
  ell(c, -15, -49, 5.5, 3.2); c.fill(); ell(c, 15, -49, 5.5, 3.2); c.fill();
  c.strokeStyle = E; c.fillStyle = E; c.lineWidth = 2.2;
  if (mood === 'happy'){
    for (const s of [-1, 1]){ c.beginPath(); c.moveTo(s * 9 - 4.5, -54); c.quadraticCurveTo(s * 9, -61, s * 9 + 4.5, -54); c.stroke(); }
    c.beginPath(); c.moveTo(-5, -48); c.quadraticCurveTo(0, -39, 5, -48); c.closePath(); c.fillStyle = '#d9576f'; c.fill(); c.lineWidth = 1.6; c.stroke();
  } else {
    if (blink){ for (const s of [-1, 1]){ c.beginPath(); c.moveTo(s * 9 - 3.6, -55.5); c.lineTo(s * 9 + 3.6, -55.5); c.stroke(); } }
    else for (const s of [-1, 1]){ ell(c, s * 9, -56, 3.7, 4.9, E); c.fillStyle = '#fff'; circ(c, s * 9 - 1.3, -57.8, 1.5); c.fill(); }
    c.lineWidth = 1.8; c.strokeStyle = E;
    if (mood === 'worried'){ c.beginPath(); c.moveTo(-4.5, -46); c.quadraticCurveTo(-2.2, -49, 0, -46); c.quadraticCurveTo(2.2, -43, 4.5, -46); c.stroke(); }
    else { c.beginPath(); c.moveTo(-4.5, -47); c.quadraticCurveTo(-2.2, -44, 0, -47); c.quadraticCurveTo(2.2, -44, 4.5, -47); c.stroke(); }
  }
}
function drawChair(c, x, y, col){
  c.lineWidth = 2; c.strokeStyle = 'rgba(150,95,85,.55)';
  rr(c, x - 37, y - 62, 74, 60, 24); c.fillStyle = col; c.fill(); c.stroke();
  rr(c, x - 27, y - 53, 54, 42, 17); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill();
  c.fillStyle = 'rgba(255,255,255,.75)'; heartPath(c, x, y - 33, 16); c.fill();
}
function drawTable(c, tb, target){
  const { x, y } = tb;
  if (tb.state === 'closed') return;
  ell(c, x, y + 40, 76, 16, 'rgba(120,60,70,.16)');
  drawChair(c, x, y - 38, tb.chair);
  let xf = null;
  const illustrated = !!(tb.cu && tb.cu.guest);
  if (tb.cu){ xf = illustrated ? guestXform(tb) : chibiXform(tb); drawCustomer(c, tb, xf, 'body'); }
  c.fillStyle = '#d49b76'; rr(c, x - 7, y + 4, 14, 34, 5); c.fill();
  ell(c, x, y + 38, 24, 7, '#c88c68');
  // tabletop with a scalloped strawberry-pink cloth
  ell(c, x, y + 7, 68, 35, '#e5b591');
  c.fillStyle = tb.candy ? '#d9c9f6' : '#ffc3d3';
  for (let i = 0; i < 26; i++){ const a = i / 26 * Math.PI; circ(c, x + Math.cos(a) * 66, y + 4 + Math.sin(a) * 33, 6.5); c.fill(); }
  const g = c.createRadialGradient(x - 18, y - 10, 4, x, y, 72);
  g.addColorStop(0, '#fffbf5'); g.addColorStop(1, '#f7dfca');
  ell(c, x, y, 68, 34); c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(190,120,100,.4)'; c.lineWidth = 1.6; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 0; i < 16; i++){ const a = i / 16 * TAU; circ(c, x - 4 + Math.cos(a) * 30, y + 2 + Math.sin(a) * 15, 4.2); c.fill(); }
  ell(c, x - 4, y + 2, 30, 15, 'rgba(255,255,255,.9)');
  c.strokeStyle = 'rgba(255,190,210,.8)'; c.lineWidth = 1.2; ell(c, x - 4, y + 2, 22, 10.5); c.stroke();
  c.strokeStyle = '#6fae84'; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(x + 44, y - 4); c.lineTo(x + 40, y - 20); c.moveTo(x + 44, y - 4); c.lineTo(x + 49, y - 17); c.stroke();
  rr(c, x + 37, y - 8, 14, 13, 5); c.fillStyle = '#c4e3f2'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke();
  for (const [fx, fy] of [[x + 40, y - 21], [x + 49, y - 18]]){
    c.fillStyle = '#ffb3cb'; for (let i = 0; i < 5; i++){ const a = i / 5 * TAU; circ(c, fx + Math.cos(a) * 3, fy + Math.sin(a) * 3, 2.3); c.fill(); }
    circ(c, fx, fy, 1.5); c.fillStyle = '#ffd77e'; c.fill();
  }
  if (illustrated) drawCustomer(c, tb, xf, 'hands');
  if (tb.state === 'happy' && tb.servedItem){ c.save(); c.globalAlpha = xf ? xf.a : 1; drawDessert(c, tb.servedItem, x - 4, y + 3, 32); c.restore(); }
  if (tb.cu && xf && !illustrated) drawCustomer(c, tb, xf, 'hands');
  if (target && target.table === tb){
    const pulse = .5 + .5 * Math.sin(T * 7);
    c.save(); c.globalAlpha = .45 + .35 * pulse; c.lineWidth = 3.5; c.strokeStyle = '#ff8fb1';
    ell(c, x, y + 3, 78 + pulse * 4, 42 + pulse * 2); c.stroke(); c.restore();
  }
}
const BUBBLE_BLOBS = [[-24, -6, 27], [0, -16, 30], [24, -6, 27], [0, 10, 30], [-20, 14, 22], [20, 14, 22]];
function drawBubble(c, tb, holdingRecipe){
  if (!tb.cu || !tb.order) return;
  let sc;
  if (tb.state === 'arrive') sc = easeOutBack(clamp((tb.anim - .1) / .4, 0, 1));
  else if (tb.state === 'wait') sc = 1 + Math.sin(T * 2.4 + tb.x) * .02;
  else sc = 1 - clamp(tb.anim / .18, 0, 1);
  if (sc <= .01) return;
  let bx = tb.x + 58, by = tb.y - 180;
  if (tb.wrong > 0) bx += Math.sin(T * 55) * 5 * (tb.wrong / .9);
  const match = tb.state === 'wait' && holdingRecipe === tb.order;
  c.save(); c.translate(bx, by); c.scale(sc, sc);
  if (match){ c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .45 + .2 * Math.sin(T * 6); c.drawImage(GLOW_PINK, -95, -95, 190, 190); c.restore(); }
  c.fillStyle = 'rgba(170,80,120,.16)';
  for (const [x, y, r] of BUBBLE_BLOBS){ circ(c, x, y + 5, r); c.fill(); }
  c.lineWidth = 5; c.strokeStyle = match ? '#ff86ab' : '#ffc6d6';
  for (const [x, y, r] of BUBBLE_BLOBS){ circ(c, x, y, r); c.stroke(); }
  circ(c, -18, 52, 6.5); c.stroke(); circ(c, -27, 64, 4.3); c.stroke();
  c.fillStyle = '#fffdfb';
  for (const [x, y, r] of BUBBLE_BLOBS){ circ(c, x, y, r); c.fill(); }
  circ(c, -18, 52, 6.5); c.fill(); circ(c, -27, 64, 4.3); c.fill();
  drawDessert(c, tb.order, 0, -10, 40);
  // price chip instead of a patience bar
  c.font = `700 13px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle';
  const label = String(RECIPES[tb.order].price), tw = c.measureText(label).width;
  const w = tw + 26;
  rr(c, -w / 2, 18, w, 18, 9); c.fillStyle = '#fff3d6'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#efcf87'; c.stroke();
  coinIcon(c, -w / 2 + 10, 27, 6);
  c.fillStyle = '#b27a24'; c.fillText(label, -w / 2 + 19, 27.5);
  if (tb.claimedBy && tb.claimedBy !== player){ c.font = `700 11px ${FONT}`; c.textAlign = 'center'; c.fillStyle = '#b28bd8'; c.fillText('♡ on the way', 0, 46); }
  c.restore();
}

/* =========================================================
   Sakura (the player)
   ========================================================= */
const MAXS = 300;
const STEP = 26;
const player = {
  isPlayer: true, x: LAYOUT.start.x, y: LAYOUT.start.y, vx: 0, vy: 0, facing: 1, holding: null,
  happy: 0, squish: 0, pop: 0, dir: 'side', input: false, speed: 0, walkDist: 0, wasMoving: false, lastFrame: -1, lastArt: null,
  onServed(){ this.happy = .9; },
};
function updatePlayer(dt, allowInput){
  const p = player;
  let ix = 0, iy = 0;
  if (allowInput){
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) iy -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) iy += 1;
  }
  p.input = ix !== 0 || iy !== 0;
  if (p.input) p.dir = Math.abs(ix) >= Math.abs(iy) ? 'side' : (iy < 0 ? 'up' : 'down');
  const len = Math.hypot(ix, iy) || 1; ix /= len; iy /= len;
  const k = 1 - Math.exp(-dt * 12);
  p.vx += (ix * MAXS - p.vx) * k; p.vy += (iy * MAXS - p.vy) * k;
  if (ix !== 0) p.facing = ix > 0 ? 1 : -1;
  const ox = p.x, oy = p.y;
  p.x += p.vx * dt; p.y += p.vy * dt;
  collide(p);
  const mx = p.x - ox, my = p.y - oy, moved = Math.hypot(mx, my);
  if (dt > 0){ p.vx = mx / dt; p.vy = my / dt; p.speed = moved / dt; }
  if (p.speed > 20){
    if (!p.wasMoving) p.walkDist = STEP + .01;
    p.walkDist += moved; p.wasMoving = true;
    const f = Math.floor(p.walkDist / STEP) % 4;
    if (f !== p.lastFrame && f % 2 === 0) puffs(p.x + p.facing * 10, p.y, 3, '246,226,212', true, 6, .7);
    p.lastFrame = f;
  } else p.wasMoving = false;
  p.happy = Math.max(0, p.happy - dt); p.squish = Math.max(0, p.squish - dt); p.pop = Math.max(0, p.pop - dt * 7);
}
function sakuraPose(p){
  const S = SAKURA;
  const moving = p.speed > 20;
  const pushing = !moving && p.input && gameState === 'playing';
  const carrying = !!p.holding;
  let frame = Math.floor(p.walkDist / STEP) % 4;
  if (pushing) frame -= frame % 2;
  const firstOk = (...arts) => arts.find(isOk) || arts[arts.length - 1];
  const handOf = (art, f) => (art.hands ? art.hands[Math.min(f, art.hands.length - 1)] : HOLD_HAND);
  const pose = (art, o = {}) => Object.assign({ art, key: art.src, frame: 0, anim: false, bounce: false, hand: null }, o);
  if (p.happy > 0 && !moving) return pose(firstOk(S.happy, S.idle));
  if (moving || pushing){
    let sheet, still;
    if (p.dir === 'side'){ sheet = carrying && isOk(S.carryWalkRight) ? S.carryWalkRight : S.walkRight; still = carrying ? firstOk(S.hold, S.idle) : firstOk(S.walk1, S.idle); }
    else if (p.dir === 'up'){ sheet = S.walkUp; still = firstOk(S.back, carrying ? S.hold : S.idle, S.idle); }
    else { sheet = S.walkDown; still = carrying ? firstOk(S.hold, S.idle) : S.idle; }
    if (isOk(sheet)) return pose(sheet, { frame, anim: true, hand: carrying ? handOf(sheet, frame) : null });
    return pose(still, { bounce: moving, hand: carrying ? handOf(still, 0) : null });
  }
  return carrying ? pose(firstOk(S.hold, S.idle), { hand: HOLD_HAND }) : pose(S.idle);
}
function drawSheetCell(c, art, frame, h){
  if (!isOk(art)) return false;
  const dw = h * art.cw / art.ch;
  c.drawImage(art.img, frame * art.cw, 0, art.cw, art.ch, -dw / 2, -h, dw, h);
  return true;
}
function drawPlayer(c){
  const p = player, pose = sakuraPose(p);
  if (pose.key !== p.lastArt){ p.lastArt = pose.key; p.pop = 1; }
  const mk = Math.min(1, p.speed / MAXS), ph = p.walkDist / STEP * Math.PI / 2;
  let bob = 0, sx = 1, sy = 1, rot = 0;
  if (pose.anim) bob = pose.frame % 2 ? -1.5 * mk : 0;
  else if (pose.bounce){ const s = Math.abs(Math.sin(ph)); bob = -s * 5 * mk; sx = 1 - (s - .5) * .03 * mk; sy = 1 + (s - .5) * .04 * mk; rot = Math.sin(ph) * .015 * mk; }
  const br = Math.sin(T * 2.4) * (1 - Math.min(1, p.speed / 60)); sy += br * .014; sx -= br * .008;
  if (pose.art === SAKURA.happy && p.happy > 0){ const q = 1 - p.happy / .9, hop = Math.sin(Math.min(1, q * 1.7) * Math.PI); bob -= hop * 16; sy += hop * .06; sx -= hop * .04; }
  if (p.squish > 0){ const q = Math.sin(p.squish / .28 * Math.PI); sy -= q * .1; sx += q * .08; }
  sy -= p.pop * .035; sx += p.pop * .035;
  ell(c, p.x, p.y + 1, 34 * (1 + bob / 70), 9 * (1 + bob / 70), 'rgba(110,55,70,.2)');
  c.save(); c.translate(p.x, p.y + bob); c.rotate(rot); c.scale(sx * p.facing, sy);
  if (!drawSheetCell(c, pose.art, pose.frame, PH)) drawFallbackChibi(c, pose.art === SAKURA.happy ? 'happy' : 'idle');
  if (p.holding && pose.hand){
    const a = pose.art, size = itemSize(p.holding) * (a.scale || 1);
    const hx = pose.hand[0] * PH, hy = pose.hand[1] * PH;
    const wobble = pose.anim ? 0 : Math.sin(T * 5) * .8;
    c.save(); if (p.facing < 0) { c.translate(hx, 0); c.scale(-1, 1); c.translate(-hx, 0); }   // keep labels/trays readable
    drawHeld(c, p.holding, hx, hy - size * (a.lift || 0) + wobble, size);
    c.restore();
    if (a.fist && isOk(a)){ c.save(); c.beginPath(); c.arc(hx, hy, a.fist * PH, 0, TAU); c.clip(); drawSheetCell(c, a, pose.frame, PH); c.restore(); }
  }
  c.restore();
}
function drawFallbackChibi(c, key){
  const u = PH / 160;
  c.save(); c.scale(u, u); c.lineWidth = 2.4; c.strokeStyle = OUT; c.lineJoin = 'round';
  rr(c, -15, -46, 11, 40, 5); strokeFill(c, '#fffaf5'); rr(c, 4, -46, 11, 40, 5); strokeFill(c, '#fffaf5');
  ell(c, -10, -5, 10, 6); strokeFill(c, '#7a463f'); ell(c, 10, -5, 10, 6); strokeFill(c, '#7a463f');
  c.beginPath(); c.moveTo(-20, -74); c.lineTo(20, -74); c.lineTo(31, -42); c.lineTo(-31, -42); c.closePath(); strokeFill(c, '#3f4672');
  rr(c, -21, -106, 42, 36, 12); strokeFill(c, '#fff6f6');
  ell(c, 0, -136, 44, 42); strokeFill(c, '#ff9fbd'); ell(c, 0, -130, 34, 32); strokeFill(c, '#ffe6da');
  for (const s of [-1, 1]){ ell(c, s * 13, -120, 5.5, 7.5, '#b8325f'); c.fillStyle = '#fff'; circ(c, s * 13 - 2, -123, 2); c.fill(); }
  c.restore();
}

/* =========================================================
   Helpers (staff). Same actions, stock and orders as Sakura.
   ========================================================= */
const STAFF_SPEED = 150;
function spawnStaff(role, x, y){
  const a = { role, look: STAFF_LOOKS[role], x, y, holding: null, task: null, path: null, pathTo: null, facing: 1, walkDist: 0, moving: false,
    workT: 0, waitT: 0, think: .4, intro: 0, working: false, note: null, noteT: 0 };
  staff.push(a); return a;
}
const MPOINT = { oven: () => ({ x: LAYOUT.oven.ix, y: LAYOUT.oven.iy }), cake: () => ({ x: LAYOUT.cake.ix, y: LAYOUT.cake.iy }),
  roller: () => ({ x: LAYOUT.roller.ix, y: LAYOUT.roller.iy }), spinner: () => ({ x: LAYOUT.spinner.ix, y: LAYOUT.spinner.iy }) };
const sectionX = r => LAYOUT.display.sections[DISPLAY_SECTIONS.indexOf(r)].x;
const backOf = r => ({ x: sectionX(r), y: LAYOUT.display.backY });
const frontOf = r => ({ x: sectionX(r), y: LAYOUT.display.frontY });
function tableSpot(tb, a){
  const pts = [{ x: tb.x - 98, y: tb.y + 10 }, { x: tb.x + 98, y: tb.y + 10 }, { x: tb.x, y: tb.y + 60 }]
    .filter(p => { const [c, r] = cellOf(p.x, p.y); return !isBlocked(c, r); });
  pts.sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y));
  return pts[0] || { x: tb.x, y: tb.y + 60 };
}
const waitingTables = () => TABLES.filter(t => t.order && (t.state === 'wait' || t.state === 'arrive'));
function openOrders(r){ return waitingTables().filter(t => t.order === r).length; }
function pipeline(r){
  let n = shop.display[r];
  const add = (it) => {
    if (!it) return;
    if ((it.kind === 'batch' || it.kind === 'single') && it.recipe === r) n += it.kind === 'batch' ? it.count : 1;
    if (r === 'croissant' && it.kind === 'dough') n += 3;
    if (r === 'cake' && (it.kind === 'batter' || it.kind === 'sponge' || it.kind === 'cake')) n += 4;
  };
  add(player.holding); staff.forEach(s => add(s.holding));
  const o = M.oven;
  if (o.state !== 'idle'){ if (o.recipe === r) n += RECIPES[r].batch; if (r === 'cake' && o.recipe === 'sponge') n += 4; }
  if (o.opBy && o.opFor === r) n += RECIPES[r].batch;
  if (r === 'candy' && (M.spinner.state !== 'idle' || M.spinner.opBy)) n += 3;
  if (r === 'croissant' && (M.roller.state !== 'idle' || M.roller.opBy)) n += 3;
  if (r === 'cake' && (M.cake.stage !== 'empty' || M.cake.opBy)) n += 4;
  return n;
}
function claim(a, obj, key, extra){ obj[key] = a; a.task.claims.push([obj, key]); if (extra) Object.assign(obj, extra); }
function releaseClaims(a){
  if (!a.task) return;
  for (const [obj, key] of a.task.claims) if (obj[key] === a) obj[key] = null;
}
function newTask(a, name){ a.task = { name, steps: [], i: 0, claims: [] }; return a.task; }
const step = (to, act, o = {}) => Object.assign({ to, act, work: 0, cond: null, valid: null, maxWait: 30 }, o);

function planBaker(a){
  const t = newTask(a, 'bake');
  const h = a.holding;
  if (h && (h.kind === 'dough' || h.kind === 'batter')){
    t.steps.push(step(MPOINT.oven(), () => Act.ovenStart(a), { work: .5, cond: () => M.oven.state === 'idle', maxWait: 60 }));
    return t;
  }
  if (h && h.kind === 'sponge'){ t.steps.push(step(MPOINT.cake(), () => Act.cakePlace(a), { work: .4, cond: () => M.cake.stage === 'empty' })); addDecorate(a, t, 8); return t; }
  if (h){ a.task = null; return null; }                                   // finished desserts are for the others
  const cake = M.cake;
  if (shop.owned.cake && (cake.stage === 'sponge' || cake.stage === 'decorating') && !cake.opBy){
    claim(a, cake, 'opBy'); addDecorate(a, t, (3 - cake.cream) + (5 - cake.berries)); return t;
  }
  if (M.oven.state === 'done' && M.oven.recipe === 'sponge' && !M.oven.outBy && cake.stage === 'empty'){
    claim(a, M.oven, 'outBy');
    t.steps.push(step(MPOINT.oven(), () => Act.ovenTake(a), { work: .3, valid: () => M.oven.state === 'done' }));
    t.steps.push(step(MPOINT.cake(), () => Act.cakePlace(a), { work: .4, cond: () => M.cake.stage === 'empty' }));
    addDecorate(a, t, 8); return t;
  }
  if (M.roller.state === 'done' && !M.roller.outBy && M.oven.state === 'idle' && !M.oven.opBy){
    claim(a, M.roller, 'outBy'); claim(a, M.oven, 'opBy', { opFor: 'croissant' });
    t.steps.push(step(MPOINT.roller(), () => Act.rollerTake(a), { work: .3, valid: () => M.roller.state === 'done' }));
    t.steps.push(step(MPOINT.oven(), () => Act.ovenStart(a), { work: .5, cond: () => M.oven.state === 'idle', maxWait: 60 }));
    return t;
  }
  // what is most needed right now?
  const need = availableRecipes().map(r => ({ r, n: openOrders(r) + (r === 'cupcake' ? 2 : 1) - pipeline(r), room: RECIPES[r].cap - pipeline(r) }))
    .filter(x => x.n > 0 && x.room > 0).sort((p, q) => q.n - p.n);
  for (const { r } of need){
    if (r === 'cupcake' && M.oven.state === 'idle' && !M.oven.opBy){
      claim(a, M.oven, 'opBy', { opFor: 'cupcake' });
      t.steps.push(step(MPOINT.oven(), () => Act.ovenStart(a), { work: .6, valid: () => M.oven.state === 'idle' })); return t;
    }
    if (r === 'candy' && M.spinner.state === 'idle' && !M.spinner.opBy){
      claim(a, M.spinner, 'opBy');
      t.steps.push(step(MPOINT.spinner(), () => Act.spinnerStart(a), { work: .6, valid: () => M.spinner.state === 'idle' })); return t;
    }
    if (r === 'croissant' && M.roller.state === 'idle' && !M.roller.opBy){
      claim(a, M.roller, 'opBy');
      t.steps.push(step(MPOINT.roller(), () => Act.rollerStart(a), { work: .6, valid: () => M.roller.state === 'idle' })); return t;
    }
    if (r === 'cake' && cake.stage === 'empty' && !cake.opBy && M.oven.state === 'idle' && !M.oven.opBy){
      claim(a, cake, 'opBy'); claim(a, M.oven, 'opBy', { opFor: 'cake' });
      t.steps.push(step(MPOINT.cake(), () => Act.cakeBatter(a), { work: .7, valid: () => M.cake.stage === 'empty' }));
      t.steps.push(step(MPOINT.oven(), () => Act.ovenStart(a), { work: .5, cond: () => M.oven.state === 'idle', maxWait: 60 }));
      return t;
    }
  }
  a.task = null; return null;
}
function addDecorate(a, t, n){
  for (let i = 0; i < n; i++) t.steps.push(step(MPOINT.cake(), () => Act.cakeDecorate(a), { work: .45, valid: () => M.cake.stage === 'sponge' || M.cake.stage === 'decorating' }));
}
function planAssistant(a){
  const t = newTask(a, 'carry');
  const h = a.holding;
  if (h){
    if (h.kind === 'batch' || h.kind === 'cake' || h.kind === 'single'){
      const r = h.kind === 'cake' ? 'cake' : h.recipe;
      t.steps.push(step(backOf(r), () => Act.displayDeposit(a) !== false, { work: .35, cond: () => Act.displayDeposit(a, true) !== false, maxWait: 1e9 }));
      return t;
    }
    if (h.kind === 'sponge'){ t.steps.push(step(MPOINT.cake(), () => Act.cakePlace(a), { work: .4, cond: () => M.cake.stage === 'empty', maxWait: 1e9 })); return t; }
    if (h.kind === 'dough' || h.kind === 'batter'){ t.steps.push(step(MPOINT.oven(), () => Act.ovenStart(a), { work: .4, cond: () => M.oven.state === 'idle', maxWait: 1e9 })); return t; }
  }
  const space = r => RECIPES[r].cap - shop.display[r];
  const jobs = [];
  if (M.oven.state === 'done' && M.oven.recipe !== 'sponge' && !M.oven.outBy && space(M.oven.recipe) > 0) jobs.push(['oven', M.oven.recipe, () => Act.ovenTake(a), () => M.oven.state === 'done' && M.oven.recipe !== 'sponge']);
  if (M.spinner.state === 'done' && !M.spinner.outBy && space('candy') > 0) jobs.push(['spinner', 'candy', () => Act.spinnerTake(a), () => M.spinner.state === 'done']);
  if (M.cake.stage === 'done' && !M.cake.outBy && space('cake') >= 4) jobs.push(['cake', 'cake', () => Act.cakeTake(a), () => M.cake.stage === 'done']);
  if (!jobs.length){ a.task = null; return null; }
  jobs.sort((p, q) => { const P = MPOINT[p[0]](), Q = MPOINT[q[0]](); return Math.hypot(P.x - a.x, P.y - a.y) - Math.hypot(Q.x - a.x, Q.y - a.y); });
  const [mid, r, take, still] = jobs[0];
  claim(a, M[mid], 'outBy');
  t.steps.push(step(MPOINT[mid](), take, { work: .3, valid: still }));
  t.steps.push(step(backOf(r), () => Act.displayDeposit(a) !== false, { work: .35, cond: () => Act.displayDeposit(a, true) !== false, maxWait: 1e9 }));
  return t;
}
function planServer(a){
  const t = newTask(a, 'serve');
  const h = a.holding;
  if (h){
    const r = h.recipe || (h.kind === 'cake' ? 'cake' : null);
    if (h.kind === 'single'){
      const tables = waitingTables().filter(tb => tb.order === r && (!tb.claimedBy || tb.claimedBy === a))
        .sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y));
      if (tables.length){
        const tb = tables[0]; claim(a, tb, 'claimedBy');
        t.steps.push(step(tableSpot(tb, a), () => Act.serve(a, tb) === 'paid', { work: .3, valid: () => tb.order === r && (tb.state === 'wait' || tb.state === 'arrive') && a.holding && a.holding.recipe === r }));
        return t;
      }
    }
    if (r){ t.steps.push(step(frontOf(r), () => Act.displayDeposit(a) !== false, { work: .35, cond: () => Act.displayDeposit(a, true) !== false, maxWait: 1e9 })); return t; }
    a.task = null; return null;
  }
  const options = waitingTables().filter(tb => !tb.claimedBy && shop.display[tb.order] > 0)
    .sort((p, q) => (p.since || 0) - (q.since || 0));
  if (!options.length){ a.task = null; return null; }
  const tb = options[0], r = tb.order;
  claim(a, tb, 'claimedBy');
  t.steps.push(step(frontOf(r), () => Act.displayTake(a, r), { work: .3, valid: () => shop.display[r] > 0 && tb.order === r && tb.state !== 'happy' }));
  t.steps.push(step(null, () => true, { dynamicTo: () => tableSpot(tb, a), work: .3,
    valid: () => tb.order === r && (tb.state === 'wait' || tb.state === 'arrive'), act: () => Act.serve(a, tb) === 'paid' }));
  return t;
}
function abortTask(a){
  releaseClaims(a);
  a.task = null; a.path = null; a.working = false; a.workT = 0; a.waitT = 0; a.think = .25;
}
function moveToward(a, to, dt){
  if (!a.path || !a.pathTo || Math.hypot(a.pathTo.x - to.x, a.pathTo.y - to.y) > 2){
    a.path = findPath(a.x, a.y, to.x, to.y); a.pathTo = { x: to.x, y: to.y };
    if (!a.path) return 'fail';
  }
  let budget = STAFF_SPEED * dt;
  const ox = a.x;
  while (budget > 0 && a.path.length){
    const p = a.path[0], dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy);
    if (d <= budget){ a.x = p.x; a.y = p.y; budget -= d; a.path.shift(); a.walkDist += d; }
    else { a.x += dx / d * budget; a.y += dy / d * budget; a.walkDist += budget; budget = 0; }
  }
  if (Math.abs(a.x - ox) > .05) a.facing = a.x > ox ? 1 : -1;
  a.moving = true;
  return a.path.length ? 'moving' : 'arrived';
}
function updateStaffMember(a, dt){
  a.intro = Math.max(0, a.intro - dt); a.moving = false;
  if (a.noteT > 0) a.noteT -= dt;
  if (!a.task){
    a.think -= dt;
    if (a.think > 0) return;
    a.think = .4;
    const planner = a.role === 'baker' ? planBaker : a.role === 'assistant' ? planAssistant : planServer;
    planner(a);
    if (!a.task){
      const home = LAYOUT.homes[a.role];
      if (Math.hypot(home.x - a.x, home.y - a.y) > 6) moveToward(a, home, dt);
      else if (Math.random() < dt * .25){ a.note = pick(['♪', '♡', '✿']); a.noteT = 1.4; }
      return;
    }
    a.path = null;
  }
  const st = a.task.steps[a.task.i];
  if (st.valid && !st.valid()){ abortTask(a); return; }
  if (st.dynamicTo && !st.cachedTo) st.cachedTo = st.dynamicTo();
  const to = st.cachedTo || st.to;
  if (to && Math.hypot(to.x - a.x, to.y - a.y) > 3){
    const res = moveToward(a, to, dt);
    if (res === 'fail'){ abortTask(a); }
    return;
  }
  if (st.cond && !st.cond()){ a.waitT += dt; a.working = false; if (a.waitT > st.maxWait) abortTask(a); return; }
  if (a.workT < st.work){ a.workT += dt; a.working = true; return; }
  a.working = false; a.workT = 0; a.waitT = 0;
  if (!st.act()){ abortTask(a); return; }
  a.task.i++; a.path = null;
  if (a.task.i >= a.task.steps.length){ releaseClaims(a); a.task = null; a.think = .15; saveSoon(); }
}
function updateStaff(dt){ for (const a of staff) updateStaffMember(a, dt); }
function drawStaff(c, a){
  const look = a.look, arts = STAFF_ART[a.role];
  const ph = a.walkDist / 22 * Math.PI / 2;
  const intro = a.intro > 0 ? easeOutBack(1 - a.intro / 1.2) : 1;
  const bob = a.moving ? -Math.abs(Math.sin(ph)) * 2.5 : (a.working ? -Math.abs(Math.sin(T * 10)) * 2 : 0);
  ell(c, a.x, a.y + 1, 28, 8, 'rgba(110,55,70,.2)');
  c.save(); c.translate(a.x, a.y + bob); c.scale(a.facing * intro, intro);
  const SH = 146;
  let drawn = false;
  if (a.moving && isOk(arts.walk)) drawn = drawSheetCell(c, arts.walk, Math.floor(a.walkDist / 22) % 4, SH);
  else if (!a.moving && isOk(arts.idle)) drawn = drawSheetCell(c, arts.idle, 0, SH);
  if (!drawn) drawStaffChibi(c, look, ph, a.moving, !!a.holding, T);
  if (a.holding){ c.save(); if (a.facing < 0) c.scale(-1, 1); drawHeld(c, a.holding, 0, -76, itemSize(a.holding) * .9); c.restore(); }
  c.restore();
  if (a.working && a.task){ const st = a.task.steps[a.task.i]; if (st && st.work) progressRing(c, a.x + 26, a.y - 160, 8, a.workT / st.work, '#b9a2ec'); }
  if (a.noteT > 0 && !a.task){ c.save(); c.globalAlpha = clamp(a.noteT, 0, 1); c.font = `700 16px ${FONT}`; c.textAlign = 'center'; c.fillStyle = '#e0789a'; c.fillText(a.note, a.x + 22, a.y - 158 - (1.4 - a.noteT) * 14); c.restore(); }
}
