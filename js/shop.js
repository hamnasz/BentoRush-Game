/* Sakura's Sweet Shop — the shop: layout, recipes, machines, display, orders,
   shared actions (used by Sakura AND the staff), navigation and saving. */
'use strict';

/* ---------------- recipes, prices, layout ---------------- */
const RECIPES = {
  cupcake:   { name: 'Strawberry Cupcake', short: 'Cupcake',      price: 5,  batch: 4, cap: 8, machine: 'oven' },
  candy:     { name: 'Cotton Candy',       short: 'Cotton Candy', price: 8,  batch: 3, cap: 6, machine: 'spinner' },
  croissant: { name: 'Butter Croissant',   short: 'Croissant',    price: 12, batch: 3, cap: 6, machine: 'roller' },
  cake:      { name: 'Strawberry Cake',    short: 'Cake Slice',   price: 15, batch: 4, cap: 8, machine: 'cake' },
};
const DISPLAY_SECTIONS = ['cupcake', 'candy', 'croissant', 'cake'];
const MACHINE_INFO = {
  oven:    { name: 'Strawberry Oven',          price: 0 },
  spinner: { name: 'Cotton-Candy Spinner',     price: 25,  recipe: 'candy' },
  roller:  { name: 'Pastry Roller',            price: 60,  recipe: 'croissant' },
  cake:    { name: 'Cake-Decorating Station',  price: 120, recipe: 'cake' },
};
const BAKE_TIME = { cupcake: 6, croissant: 7, sponge: 8 };
const SPIN_TIME = 7, ROLL_TIME = 5;
const HIRE_PRICES = [25, 50, 90];            // 1st, 2nd and 3rd helper, whichever role you pick
const ROLE_INFO = {
  assistant: { title: 'Display Assistant', short: 'Assistant', blurb: 'carries finished batches to the display case' },
  baker:     { title: 'Baker',             short: 'Baker',     blurb: 'runs the machines you have unlocked' },
  server:    { title: 'Server',            short: 'Server',    blurb: 'brings desserts from the case to your guests' },
};
const LAYOUT = {
  oven:    { x: 135, base: 302, ix: 135, iy: 340, foot: [66, 214, 204, 304] },
  cake:    { x: 335, base: 302, ix: 428, iy: 334, foot: [258, 214, 412, 304] },
  roller:  { x: 70, base: 498, ix: 156, iy: 472, counter: [18, 372, 122, 616] },
  spinner: { x: 1140, base: 306, ix: 1140, iy: 348, foot: [1078, 214, 1204, 308] },
  display: { x0: 372, y0: 392, x1: 692, y1: 476, backY: 370, frontY: 500 },
  candy:   { x0: 852, y1: 424, buyX: 1000, buyY: 460 },
  homes:   { assistant: { x: 262, y: 478 }, baker: { x: 222, y: 372 }, server: { x: 850, y: 502 } },
  tables:  [
    { x: 700, y: 625, chair: '#ffd0dc' }, { x: 930, y: 625, chair: '#dccffb' },
    { x: 1160, y: 625, chair: '#c4e6b6' }, { x: 955, y: 352, chair: '#ffe9a8', candy: true },
  ],
  start:   { x: 560, y: 560 },
  bounds:  { x0: 24, x1: 1256, y0: 232, y1: 706 },
};
LAYOUT.display.sections = DISPLAY_SECTIONS.map((r, i) => ({ recipe: r, x: 412 + i * 80 }));

/* ---------------- world state ---------------- */
const shop = {
  coins: 0, earned: 0, served: 0,
  owned: { oven: true, spinner: false, roller: false, cake: false },
  hires: [],
  display: { cupcake: 0, candy: 0, croissant: 0, cake: 0 },
  tutorial: 0,
  forced: [],                  // recipes that the next new guests should order (after an unlock)
};
const M = {
  oven:    { id: 'oven', x: LAYOUT.oven.x, base: LAYOUT.oven.base, state: 'idle', recipe: null, t: 0, dur: 1, opBy: null, outBy: null },
  spinner: { id: 'spinner', x: LAYOUT.spinner.x, base: LAYOUT.spinner.base, state: 'idle', t: 0, dur: SPIN_TIME, opBy: null, outBy: null },
  roller:  { id: 'roller', x: LAYOUT.roller.x, base: LAYOUT.roller.base, state: 'idle', t: 0, dur: ROLL_TIME, opBy: null, outBy: null },
  cake:    { id: 'cake', x: LAYOUT.cake.x, base: LAYOUT.cake.base, stage: 'empty', cream: 0, berries: 0, flash: 0, opBy: null, outBy: null },
};
const TABLES = LAYOUT.tables.map((t, i) => Object.assign({ i, state: t.candy ? 'closed' : 'empty', cool: 1.2 + i * 2.2, cu: null, order: null, anim: 0, wrong: 0, claimedBy: null, lastGuest: null, lastOrder: null, blink: 0, nextBlink: 2 }, t));
const staff = [];
let curtainLift = 0, curtainAnim = false;   // candy corner reveal

function availableRecipes(){ return Object.keys(RECIPES).filter(r => shop.owned[RECIPES[r].machine]); }
function canAfford(p){ return shop.coins >= p; }
function nextHirePrice(){ return HIRE_PRICES[Math.min(shop.hires.length, HIRE_PRICES.length - 1)]; }

/* ---------------- machines tick ---------------- */
function updateMachines(dt){
  for (const id of ['oven', 'spinner', 'roller']){
    const m = M[id];
    const busy = m.state === 'baking' || m.state === 'spinning' || m.state === 'rolling';
    if (!busy) continue;
    m.t += dt;
    if (m.t >= m.dur){
      m.t = m.dur; m.state = 'done';
      Sfx.ding(); sparkles(m.x, m.base - (id === 'roller' ? 60 : 120), 10);
    }
  }
  if (M.oven.state === 'done' && Math.random() < dt * 1.5) puffs(M.oven.x - 14, M.oven.base - 170, 1, '255,255,255', false, 10, .8);
  M.cake.flash = Math.max(0, M.cake.flash - dt);
}

/* ---------------- shared actions ----------------
   Each takes an agent (Sakura or a helper) with a `holding` slot. With dry=true it only
   checks whether the action is possible right now. Everyone goes through these, so the
   stock, machines and orders stay consistent no matter who acts first. */
const Act = {
  ovenStart(a, dry){
    const m = M.oven; if (m.state !== 'idle') return false;
    let r = 'cupcake';
    if (a.holding){ if (a.holding.kind === 'dough') r = 'croissant'; else if (a.holding.kind === 'batter') r = 'sponge'; else return false; }
    if (dry) return r;
    a.holding = null; m.state = 'baking'; m.recipe = r; m.t = 0; m.dur = BAKE_TIME[r]; m.opBy = null;
    Sfx.pop(); sparkles(m.x - 14, m.base - 126, 6);
    return true;
  },
  ovenTake(a, dry){
    const m = M.oven; if (m.state !== 'done' || a.holding) return false;
    if (dry) return m.recipe;
    a.holding = m.recipe === 'sponge' ? { kind: 'sponge' } : { kind: 'batch', recipe: m.recipe, count: RECIPES[m.recipe].batch };
    m.state = 'idle'; m.recipe = null; m.outBy = null; Sfx.pop();
    return true;
  },
  spinnerStart(a, dry){
    const m = M.spinner; if (!shop.owned.spinner || m.state !== 'idle' || a.holding) return false;
    if (dry) return true;
    m.state = 'spinning'; m.t = 0; m.dur = SPIN_TIME; m.opBy = null; Sfx.whirr();
    return true;
  },
  spinnerTake(a, dry){
    const m = M.spinner; if (m.state !== 'done' || a.holding) return false;
    if (dry) return true;
    a.holding = { kind: 'batch', recipe: 'candy', count: RECIPES.candy.batch }; m.state = 'idle'; m.outBy = null; Sfx.pop();
    return true;
  },
  rollerStart(a, dry){
    const m = M.roller; if (!shop.owned.roller || m.state !== 'idle' || a.holding) return false;
    if (dry) return true;
    m.state = 'rolling'; m.t = 0; m.dur = ROLL_TIME; m.opBy = null; Sfx.whirr();
    return true;
  },
  rollerTake(a, dry){
    const m = M.roller; if (m.state !== 'done' || a.holding) return false;
    if (dry) return true;
    a.holding = { kind: 'dough' }; m.state = 'idle'; m.outBy = null; Sfx.pop();
    return true;
  },
  rollerPutBack(a, dry){
    const m = M.roller; if (m.state !== 'idle' || !a.holding || a.holding.kind !== 'dough') return false;
    if (dry) return true;
    a.holding = null; m.state = 'done'; m.t = m.dur; Sfx.place();
    return true;
  },
  cakeBatter(a, dry){
    const m = M.cake; if (!shop.owned.cake || a.holding || m.stage !== 'empty') return false;
    if (dry) return true;
    a.holding = { kind: 'batter' }; Sfx.swish();
    return true;
  },
  cakePourBack(a, dry){
    if (!shop.owned.cake || !a.holding || a.holding.kind !== 'batter') return false;
    if (dry) return true;
    a.holding = null; Sfx.swish();
    return true;
  },
  cakePlace(a, dry){
    const m = M.cake; if (!a.holding || m.stage !== 'empty') return false;
    if (a.holding.kind === 'sponge'){ if (dry) return true; a.holding = null; m.stage = 'sponge'; m.cream = 0; m.berries = 0; }
    else if (a.holding.kind === 'cake'){ if (dry) return true; a.holding = null; m.stage = 'done'; m.cream = 3; m.berries = 5; }
    else return false;
    Sfx.place(); m.flash = .4;
    return true;
  },
  cakeDecorate(a, dry){
    const m = M.cake; if (a.holding || (m.stage !== 'sponge' && m.stage !== 'decorating')) return false;
    if (dry) return m.cream < 3 ? 'cream' : 'berry';
    if (m.cream < 3){ m.cream++; Sfx.swish(); puffs(m.x + 6, m.base - 118, 4, '255,255,255', false, 16, .8); }
    else { m.berries++; Sfx.berry(); sparkles(m.x + 6, m.base - 124, 4, GLOW_PINK); }
    m.flash = .5;
    m.stage = m.berries >= 5 ? 'done' : 'decorating';
    if (m.stage === 'done'){ Sfx.chime(); hearts(m.x + 6, m.base - 130, 8); }
    return true;
  },
  cakeTake(a, dry){
    const m = M.cake; if (m.stage !== 'done' || a.holding) return false;
    if (dry) return true;
    a.holding = { kind: 'cake' }; m.stage = 'empty'; m.cream = 0; m.berries = 0; m.outBy = null; Sfx.pop();
    return true;
  },
  displayDeposit(a, dry){
    const h = a.holding; if (!h) return false;
    let r, n;
    if (h.kind === 'batch'){ r = h.recipe; n = h.count; }
    else if (h.kind === 'single'){ r = h.recipe; n = 1; }
    else if (h.kind === 'cake'){ r = 'cake'; n = 4; }
    else return false;
    const space = RECIPES[r].cap - shop.display[r];
    if (space <= 0 || (h.kind === 'cake' && space < 4)) return false;
    if (dry) return r;
    const put = Math.min(space, n);
    shop.display[r] += put;
    if (h.kind === 'batch'){ h.count -= put; if (h.count <= 0) a.holding = null; } else a.holding = null;
    Sfx.place();
    const sx = LAYOUT.display.sections[DISPLAY_SECTIONS.indexOf(r)].x;
    sparkles(sx, LAYOUT.display.y0 + 10, 5);
    return put;
  },
  displayTake(a, r, dry){
    if (a.holding || !r || shop.display[r] <= 0) return false;
    if (dry) return true;
    shop.display[r]--; a.holding = { kind: 'single', recipe: r }; Sfx.pop();
    return true;
  },
  // Serving: a matching dessert pays exactly once; anything else is a gentle "not this one".
  serve(a, tb, dry){
    if (!tb.order || (tb.state !== 'wait' && tb.state !== 'arrive')) return false;
    const h = a.holding; if (!h || (h.kind !== 'single' && h.kind !== 'batch')) return false;
    if (dry) return h.recipe === tb.order ? 'match' : 'wrong';
    if (h.recipe !== tb.order){
      tb.wrong = .9; Sfx.wrong();
      addText('Hmm, not this one~', tb.x, tb.y + 66, '#a07894', 18, 1.2);
      return 'wrong';
    }
    if (h.kind === 'batch'){ h.count--; if (h.count <= 0) a.holding = null; } else a.holding = null;
    const price = RECIPES[tb.order].price;
    shop.earned += price; shop.served++;
    tb.state = 'happy'; tb.anim = 0; tb.claimedBy = null; tb.servedItem = tb.order;
    payCoins(tb, price);
    if (a.onServed) a.onServed(tb);
    saveSoon();
    return 'paid';
  },
};

/* ---------------- coins & purchases ---------------- */
let coinShown = 0;             // the HUD counts up as the coins fly in
function payCoins(tb, price){
  shop.coins += price;
  Sfx.chime(); hearts(tb.x, tb.y - 92, 10);
  addText('+' + price, tb.x + 4, tb.y - 150, '#e0567c', 32, 1.2);
  const n = Math.min(8, 2 + Math.round(price / 3));
  for (let i = 0; i < n; i++){
    addP({ kind: 'coin', spr: COIN_SPR, x: tb.x + rand(-20, 20), y: tb.y - 100 + rand(-10, 10), vx: rand(-120, 120), vy: rand(-220, -120), g: 0, drag: .9, life: 4, size: 22, vr: rand(-4, 4), delay: i * .06,
      tx: 70, ty: 40, onArrive: () => { coinShown = Math.min(shop.coins, coinShown + price / n); Sfx.coin(); bumpCoins(); } });
  }
}
function buyMachine(id){
  const price = MACHINE_INFO[id].price;
  if (shop.owned[id] || !canAfford(price)) return false;
  shop.coins -= price; coinShown = Math.min(coinShown, shop.coins);
  shop.owned[id] = true;
  onUnlock(id);
  saveSoon();
  return true;
}
function hireRole(role){
  if (shop.hires.includes(role)) return false;
  const price = nextHirePrice();
  if (!canAfford(price)) return false;
  shop.coins -= price; coinShown = Math.min(coinShown, shop.coins);
  shop.hires.push(role);
  const h = LAYOUT.homes[role];
  const s = spawnStaff(role, h.x, h.y);
  s.intro = 1.2;
  Sfx.hire(); confetti(h.x, h.y - 80, 40, .8);
  banner(`${STAFF_LOOKS[role].name} the ${ROLE_INFO[role].title} joined!`, ROLE_INFO[role].blurb);
  saveSoon();
  return true;
}
function onUnlock(id){
  renderBackground(); buildNav();
  Sfx.buy();
  if (id === 'spinner'){
    curtainAnim = true; curtainLift = 0;
    confetti(1066, 260, 90, 1.1);
    M.spinner.state = 'spinning'; M.spinner.t = 0; M.spinner.dur = SPIN_TIME;     // it starts turning right away
    const t4 = TABLES[3]; t4.state = 'empty'; t4.cool = 1.6;
    shop.forced.push('candy');
    banner('The Candy Corner is open!', 'Cotton candy is on the menu');
  } else if (id === 'roller'){
    confetti(LAYOUT.roller.x + 40, LAYOUT.roller.base - 60, 60);
    M.roller.state = 'rolling'; M.roller.t = 0; M.roller.dur = ROLL_TIME;           // the first dough rolls itself
    shop.forced.push('croissant');
    banner('The pastry counter is ready!', 'Roll dough, then bake croissants in the oven');
  } else if (id === 'cake'){
    confetti(LAYOUT.cake.x, LAYOUT.cake.base - 80, 60);
    M.cake.stage = 'sponge'; M.cake.cream = 0; M.cake.berries = 0; M.cake.flash = .6;   // a first sponge to decorate
    shop.forced.push('cake');
    banner('The cake studio is open!', 'Decorate the sponge on the turntable');
  }
}

/* ---------------- obstacles + collision (Sakura) ---------------- */
const AGENT_R = 14;
let OBSTACLES = [];
function buildObstacles(){
  const o = [];
  const rect = (a) => o.push({ t: 'r', x0: a[0], y0: a[1], x1: a[2], y1: a[3] });
  rect(LAYOUT.oven.foot);
  if (shop.owned.cake) rect(LAYOUT.cake.foot);
  rect(LAYOUT.roller.counter);
  if (shop.owned.spinner) rect(LAYOUT.spinner.foot);
  else rect([LAYOUT.candy.x0, 200, 1290, LAYOUT.candy.y1]);
  const d = LAYOUT.display; rect([d.x0, d.y0, d.x1, d.y1]);
  for (const tb of TABLES){
    if (tb.state === 'closed') continue;
    o.push({ t: 'e', cx: tb.x, cy: tb.y + 6, rx: 70, ry: 32 });
    o.push({ t: 'e', cx: tb.x, cy: tb.y - 36, rx: 44, ry: 26 });
  }
  OBSTACLES = o;
}
function collide(p, r = AGENT_R){
  const B = LAYOUT.bounds;
  for (let pass = 0; pass < 2; pass++){
    p.x = clamp(p.x, B.x0, B.x1); p.y = clamp(p.y, B.y0, B.y1);
    for (const s of OBSTACLES){
      if (s.t === 'r'){
        const x0 = s.x0 - r, x1 = s.x1 + r, y0 = s.y0 - r, y1 = s.y1 + r;
        if (p.x > x0 && p.x < x1 && p.y > y0 && p.y < y1){
          const dl = p.x - x0, dr = x1 - p.x, dt = p.y - y0, db = y1 - p.y;
          const m = Math.min(dl, dr, dt, db);
          if (m === dl) p.x = x0; else if (m === dr) p.x = x1; else if (m === dt) p.y = y0; else p.y = y1;
        }
      } else {
        const rx = s.rx + r, ry = s.ry + r;
        const dx = (p.x - s.cx) / rx, dy = (p.y - s.cy) / ry, d = Math.hypot(dx, dy);
        if (d < 1){ if (d < 1e-4){ p.y = s.cy + ry; continue; } p.x = s.cx + dx / d * rx; p.y = s.cy + dy / d * ry; }
      }
    }
  }
}

/* ---------------- navigation grid + A* for the staff ---------------- */
const NAV = { cell: 16, cols: Math.ceil(W / 16), rows: Math.ceil(H / 16), blocked: null };
function cellBlockedAt(x, y){
  const B = LAYOUT.bounds;
  if (x < B.x0 || x > B.x1 || y < B.y0 || y > B.y1) return true;
  for (const s of OBSTACLES){
    if (s.t === 'r'){ if (x > s.x0 - AGENT_R && x < s.x1 + AGENT_R && y > s.y0 - AGENT_R && y < s.y1 + AGENT_R) return true; }
    else { const dx = (x - s.cx) / (s.rx + AGENT_R), dy = (y - s.cy) / (s.ry + AGENT_R); if (dx * dx + dy * dy < 1) return true; }
  }
  return false;
}
function buildNav(){
  buildObstacles();
  NAV.blocked = new Uint8Array(NAV.cols * NAV.rows);
  for (let r = 0; r < NAV.rows; r++) for (let c = 0; c < NAV.cols; c++)
    NAV.blocked[r * NAV.cols + c] = cellBlockedAt(c * NAV.cell + NAV.cell / 2, r * NAV.cell + NAV.cell / 2) ? 1 : 0;
  for (const s of staff) s.path = null;
}
const cellOf = (x, y) => [clamp(Math.floor(x / NAV.cell), 0, NAV.cols - 1), clamp(Math.floor(y / NAV.cell), 0, NAV.rows - 1)];
const isBlocked = (c, r) => c < 0 || r < 0 || c >= NAV.cols || r >= NAV.rows || NAV.blocked[r * NAV.cols + c] === 1;
function nearestFree(c, r){
  if (!isBlocked(c, r)) return [c, r];
  for (let rad = 1; rad < 20; rad++){
    let best = null, bd = 1e9;
    for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++){
      if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad || isBlocked(c + dc, r + dr)) continue;
      const d = dc * dc + dr * dr; if (d < bd){ bd = d; best = [c + dc, r + dr]; }
    }
    if (best) return best;
  }
  return [c, r];
}
function lineFree(x0, y0, x1, y1){
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 6);
  for (let i = 1; i < n; i++){ const t = i / n; const [c, r] = cellOf(lerp(x0, x1, t), lerp(y0, y1, t)); if (isBlocked(c, r)) return false; }
  return true;
}
function findPath(sx, sy, tx, ty){
  const [sc0, sr0] = cellOf(sx, sy), [tc0, tr0] = cellOf(tx, ty);
  const [sc, sr] = nearestFree(sc0, sr0), [tc, tr] = nearestFree(tc0, tr0);
  const cols = NAV.cols, N = cols * NAV.rows;
  const g = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const start = sr * cols + sc, goal = tr * cols + tc;
  const h = (i) => { const c = i % cols, r = (i / cols) | 0, dx = Math.abs(c - tc), dy = Math.abs(r - tr); return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy); };
  const heap = [];   // binary heap of [f, i]
  const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0){ const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length){ heap[0] = last; let k = 0; for (;;){ const l = 2 * k + 1, r2 = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r2 < heap.length && heap[r2][0] < heap[m][0]) m = r2; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  g[start] = 0; push(h(start), start);
  let found = false;
  while (heap.length){
    const [, i] = pop();
    if (closed[i]) continue; closed[i] = 1;
    if (i === goal){ found = true; break; }
    const c = i % cols, r = (i / cols) | 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++){
      if (!dr && !dc) continue;
      const nc = c + dc, nr = r + dr;
      if (isBlocked(nc, nr)) continue;
      if (dr && dc && (isBlocked(c + dc, r) || isBlocked(c, r + dr))) continue;
      const j = nr * cols + nc, cost = g[i] + (dr && dc ? Math.SQRT2 : 1);
      if (cost < g[j]){ g[j] = cost; came[j] = i; push(cost + h(j), j); }
    }
  }
  if (!found) return null;
  const cells = [];
  for (let i = goal; i !== -1 && i !== start; i = came[i]) cells.push(i);
  cells.reverse();
  const pts = cells.map(i => ({ x: (i % cols) * NAV.cell + NAV.cell / 2, y: ((i / cols) | 0) * NAV.cell + NAV.cell / 2 }));
  // end exactly on the requested point if it is walkable
  if (!isBlocked(tc0, tr0)){ if (pts.length) pts[pts.length - 1] = { x: tx, y: ty }; else pts.push({ x: tx, y: ty }); }
  // string-pulling
  const out = []; let from = { x: sx, y: sy }, k = 0;
  while (k < pts.length){
    let far = k;
    for (let j = pts.length - 1; j > k; j--) if (lineFree(from.x, from.y, pts[j].x, pts[j].y)){ far = j; break; }
    out.push(pts[far]); from = pts[far]; k = far + 1;
  }
  return out;
}

/* ---------------- saving (localStorage, works from a double-clicked file) ---------------- */
const SAVE_KEY = 'sakurasSweetShop.save.v1';
let saveTimer = 0, saveDirty = false;
function saveSoon(){ saveDirty = true; }
function serializeItem(h){ return h ? JSON.parse(JSON.stringify(h)) : null; }
function serialize(){
  return {
    v: 1, savedAt: Date.now(),
    coins: shop.coins, earned: shop.earned, served: shop.served, tutorial: shop.tutorial, forced: shop.forced.slice(),
    owned: Object.assign({}, shop.owned), hires: shop.hires.slice(), display: Object.assign({}, shop.display),
    machines: {
      oven: { state: M.oven.state, recipe: M.oven.recipe, t: M.oven.t, dur: M.oven.dur },
      spinner: { state: M.spinner.state, t: M.spinner.t, dur: M.spinner.dur },
      roller: { state: M.roller.state, t: M.roller.t, dur: M.roller.dur },
      cake: { stage: M.cake.stage, cream: M.cake.cream, berries: M.cake.berries },
    },
    tables: TABLES.map(t => {
      const seated = t.cu && (t.state === 'wait' || t.state === 'arrive');
      return { state: t.state === 'closed' ? 'closed' : seated ? 'wait' : 'empty', order: seated ? t.order : null,
        guest: seated && t.cu.guest ? t.cu.guest.id : null, look: seated ? Object.assign({}, t.cu, { guest: null }) : null };
    }),
    player: { x: player.x, y: player.y, facing: player.facing, holding: serializeItem(player.holding) },
    staff: staff.map(s => ({ role: s.role, x: s.x, y: s.y, holding: serializeItem(s.holding) })),
    muted: Sfx.muted,
  };
}
function writeSave(){
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(serialize())); saveDirty = false; return true; } catch (e){ return false; }
}
function readSave(){
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return s && s.v === 1 ? s : null; } catch (e){ return null; }
}
function clearSave(){ try { localStorage.removeItem(SAVE_KEY); } catch (e){} }
function applySave(s){
  shop.coins = s.coins || 0; shop.earned = s.earned || 0; shop.served = s.served || 0; shop.tutorial = s.tutorial || 0;
  shop.forced = Array.isArray(s.forced) ? s.forced : [];
  Object.assign(shop.owned, s.owned || {}); shop.owned.oven = true;
  shop.hires = (s.hires || []).filter(r => ROLE_INFO[r]);
  for (const r of DISPLAY_SECTIONS) shop.display[r] = clamp((s.display || {})[r] || 0, 0, RECIPES[r].cap);
  // machines keep baking while the shop is closed (capped at an hour); finished batches wait
  const away = clamp((Date.now() - (s.savedAt || Date.now())) / 1000, 0, 3600);
  const mm = s.machines || {};
  for (const id of ['oven', 'spinner', 'roller']){
    const src = mm[id]; if (!src) continue;
    Object.assign(M[id], { state: src.state || 'idle', t: src.t || 0, dur: src.dur || 1 });
    if (id === 'oven') M.oven.recipe = src.recipe || null;
    if (['baking', 'spinning', 'rolling'].includes(M[id].state)){ M[id].t += away; if (M[id].t >= M[id].dur){ M[id].t = M[id].dur; M[id].state = 'done'; } }
  }
  if (mm.cake) Object.assign(M.cake, { stage: mm.cake.stage || 'empty', cream: mm.cake.cream || 0, berries: mm.cake.berries || 0 });
  (s.tables || []).forEach((st, i) => {
    const tb = TABLES[i]; if (!tb) return;
    tb.claimedBy = null; tb.anim = 0; tb.wrong = 0;
    if (st.state === 'closed' && !shop.owned.spinner){ tb.state = 'closed'; return; }
    if (st.state === 'wait' && st.order && RECIPES[st.order]){
      tb.cu = Object.assign({}, st.look || {}, { guest: GUESTS.find(g => g.id === st.guest) || null });
      tb.order = st.order; tb.state = 'wait';
    } else { tb.state = 'empty'; tb.cu = null; tb.order = null; tb.cool = rand(1, 3); }
  });
  if (!shop.owned.spinner) TABLES[3].state = 'closed';
  else if (TABLES[3].state === 'closed') TABLES[3].state = 'empty';
  curtainLift = shop.owned.spinner ? 1 : 0; curtainAnim = false;
  if (s.player){ Object.assign(player, { x: s.player.x, y: s.player.y, facing: s.player.facing || 1, holding: s.player.holding || null }); }
  staff.length = 0;
  for (const st of (s.staff || [])){ if (shop.hires.includes(st.role) && !staff.some(x => x.role === st.role)){ const a = spawnStaff(st.role, st.x, st.y); a.holding = st.holding || null; } }
  for (const role of shop.hires) if (!staff.some(x => x.role === role)){ const h = LAYOUT.homes[role]; spawnStaff(role, h.x, h.y); }
  if (typeof s.muted === 'boolean') setMuted(s.muted);
}
