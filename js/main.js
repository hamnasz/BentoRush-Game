/* Sakura's Sweet Shop — UI, interaction, game loop and boot. */
'use strict';

let gameState = 'menu';          // menu | playing | paused   (no timer, no game over)
let T = 0;
let target = null, targetAction = null;
let holdT = 0, holdKey = false;
const HOLD_TIME = .6;
let hintTimer = 0;

/* ---------------- HUD / DOM ---------------- */
const ui = {
  hud: $('hud'), coins: $('coins'), coinPill: $('coinPill'), goal: $('goal'), banner: $('banner'),
  bannerTitle: $('bannerTitle'), bannerSub: $('bannerSub'), hint: $('hint'),
  menu: $('menu'), pause: $('pause'), startBtn: $('startBtn'), newBtn: $('newBtn'), resumeBtn: $('resumeBtn'), resetBtn: $('resetBtn'),
};
function bumpCoins(){ ui.coinPill.classList.remove('bump'); void ui.coinPill.offsetWidth; ui.coinPill.classList.add('bump'); }
let bannerT = 0;
function banner(title, sub){
  ui.bannerTitle.textContent = title; ui.bannerSub.textContent = sub || '';
  ui.banner.classList.remove('show'); void ui.banner.offsetWidth; ui.banner.classList.add('show'); bannerT = 3.6;
}
function setMuted(m){
  Sfx.setMuted(m);
  $('soundOn').style.display = m ? 'none' : ''; $('soundOff').style.display = m ? '' : 'none';
}
let shownCoins = -1, shownGoal = '';
function updateHUD(dt){
  const v = Math.round(coinShown);
  if (v !== shownCoins){ ui.coins.textContent = v; shownCoins = v; }
  const goals = [];
  for (const id of ['spinner', 'roller', 'cake']) if (!shop.owned[id]) goals.push({ name: MACHINE_INFO[id].name, price: MACHINE_INFO[id].price });
  if (shop.hires.length < 3) goals.push({ name: shop.hires.length ? 'another helper' : 'a helper', price: nextHirePrice() });
  goals.sort((a, b) => a.price - b.price);
  let txt = '';
  if (!goals.length) txt = '✿ Your sweet shop is complete! Enjoy the cozy days.';
  else {
    const g = goals.slice(0, 2);
    const can = g.some(x => shop.coins >= x.price);
    txt = (can ? '✿ You can afford: ' : '✿ Saving for: ') + g.map(x => `${x.name} (${x.price})`).join(' or ');
    ui.goal.classList.toggle('ready', can);
  }
  if (txt !== shownGoal){ ui.goal.textContent = txt; shownGoal = txt; }
  if (bannerT > 0){ bannerT -= dt; if (bannerT <= 0) ui.banner.classList.remove('show'); }
  if (hintTimer > 0){ hintTimer -= dt; if (hintTimer <= 0) ui.hint.classList.add('hidden'); }
}

/* ---------------- what can Sakura do here? ---------------- */
const plural = r => ({ cupcake: 'cupcakes', candy: 'cotton candy', croissant: 'croissants', cake: 'cake' })[r];
function findTarget(){
  const p = player, list = [];
  const near = (x, y, r = 58) => { const d = Math.hypot(p.x - x, p.y - y); return d < r ? d : null; };
  let d;
  if ((d = near(LAYOUT.oven.ix, LAYOUT.oven.iy)) != null) list.push({ d, kind: 'oven' });
  if ((d = near(LAYOUT.cake.ix, LAYOUT.cake.iy, shop.owned.cake ? 58 : 80)) != null) list.push({ d, kind: shop.owned.cake ? 'cake' : 'buy', id: 'cake' });
  if ((d = near(LAYOUT.roller.ix, LAYOUT.roller.iy)) != null) list.push({ d, kind: shop.owned.roller ? 'roller' : 'buy', id: 'roller' });
  if (shop.owned.spinner){ if ((d = near(LAYOUT.spinner.ix, LAYOUT.spinner.iy)) != null) list.push({ d, kind: 'spinner' }); }
  else if ((d = near(LAYOUT.candy.buyX, LAYOUT.candy.buyY, 90)) != null) list.push({ d, kind: 'buy', id: 'spinner' });
  for (const role of Object.keys(ROLE_INFO)) if (!shop.hires.includes(role)){ const h = LAYOUT.homes[role]; if ((d = near(h.x, h.y, 50)) != null) list.push({ d, kind: 'hire', role }); }
  const D = LAYOUT.display;
  const dx = Math.max(D.x0 - p.x, 0, p.x - D.x1), dy = Math.max(D.y0 - p.y, 0, p.y - D.y1);
  const dd = Math.hypot(dx, dy);
  if (dd < 44){
    let best = 0; D.sections.forEach((s, i) => { if (Math.abs(s.x - p.x) < Math.abs(D.sections[best].x - p.x)) best = i; });
    list.push({ d: dd, kind: 'display', idx: best });
  }
  if (p.holding && (p.holding.kind === 'single' || p.holding.kind === 'batch')){
    for (const tb of TABLES){ if (!tb.order || (tb.state !== 'wait' && tb.state !== 'arrive')) continue; const dt2 = Math.hypot(p.x - tb.x, p.y - (tb.y + 8)); if (dt2 < 128) list.push({ d: dt2 - 40, kind: 'table', table: tb }); }
  }
  list.sort((a, b) => a.d - b.d);
  for (const t of list){ const act = actionFor(t); if (act) return [t, act]; }
  return [null, null];
}
function actionFor(t){
  const p = player, h = p.holding;
  const info = label => ({ label, info: true });
  switch (t.kind){
    case 'oven': {
      const m = M.oven;
      if (m.state === 'idle'){
        const r = Act.ovenStart(p, true);
        if (!r) return h ? info('Oven takes dough or batter') : null;
        return { label: r === 'cupcake' ? 'Bake cupcakes' : r === 'croissant' ? 'Bake croissants' : 'Bake the sponge', run: () => Act.ovenStart(p) };
      }
      if (m.state === 'done') return h ? info('Hands full') : { label: m.recipe === 'sponge' ? 'Take the sponge' : 'Take the ' + plural(m.recipe), run: () => Act.ovenTake(p) };
      return info('Baking… ' + Math.ceil(m.dur - m.t) + 's');
    }
    case 'spinner': {
      const m = M.spinner;
      if (m.state === 'idle') return h ? null : { label: 'Spin cotton candy', run: () => Act.spinnerStart(p) };
      if (m.state === 'done') return h ? info('Hands full') : { label: 'Take the cotton candy', run: () => Act.spinnerTake(p) };
      return info('Spinning… ' + Math.ceil(m.dur - m.t) + 's');
    }
    case 'roller': {
      const m = M.roller;
      if (h && h.kind === 'dough' && m.state === 'idle') return { label: 'Put the dough back', run: () => Act.rollerPutBack(p) };
      if (m.state === 'idle') return h ? null : { label: 'Roll croissant dough', run: () => Act.rollerStart(p) };
      if (m.state === 'done') return h ? info('Hands full') : { label: 'Take the dough', run: () => Act.rollerTake(p) };
      return info('Rolling… ' + Math.ceil(m.dur - m.t) + 's');
    }
    case 'cake': {
      const m = M.cake;
      if (h && (h.kind === 'sponge' || h.kind === 'cake') && m.stage === 'empty') return { label: h.kind === 'sponge' ? 'Place the sponge' : 'Set the cake down', run: () => Act.cakePlace(p) };
      if (h && h.kind === 'batter') return { label: 'Pour the batter back', run: () => Act.cakePourBack(p) };
      if (h) return null;
      if (m.stage === 'empty') return { label: 'Mix sponge batter', run: () => Act.cakeBatter(p) };
      if (m.stage === 'done') return { label: 'Take the cake', run: () => Act.cakeTake(p) };
      const what = Act.cakeDecorate(p, true);
      return { label: what === 'cream' ? `Spread cream (${m.cream + 1}/3)` : `Add a strawberry (${m.berries + 1}/5)`, run: () => Act.cakeDecorate(p) };
    }
    case 'display': {
      const r = DISPLAY_SECTIONS[t.idx];
      if (h){
        const dep = Act.displayDeposit(p, true);
        if (dep) return { label: h.kind === 'single' ? 'Put it back' : 'Fill the display', run: () => Act.displayDeposit(p), section: DISPLAY_SECTIONS.indexOf(dep) };
        if (h.kind === 'batch' || h.kind === 'single' || h.kind === 'cake') return info('That shelf is full');
        return null;
      }
      if (!shop.owned[RECIPES[r].machine]) return null;
      if (shop.display[r] > 0) return { label: 'Take a ' + RECIPES[r].short.toLowerCase(), run: () => Act.displayTake(p, r), section: t.idx };
      return info('No ' + plural(r) + ' yet');
    }
    case 'table': return { label: 'Serve ♡', run: () => Act.serve(p, t.table) };
    case 'buy': {
      const info2 = MACHINE_INFO[t.id];
      return { label: 'Unlock ' + info2.name, price: info2.price, hold: true, can: shop.coins >= info2.price, run: () => buyMachine(t.id) };
    }
    case 'hire': {
      const price = nextHirePrice();
      return { label: `Hire ${STAFF_LOOKS[t.role].name} · ${ROLE_INFO[t.role].title}`, price, hold: true, can: shop.coins >= price, run: () => hireRole(t.role) };
    }
  }
  return null;
}
function pressInteract(){
  if (gameState !== 'playing' || !targetAction) return;
  const a = targetAction;
  if (a.info){ Sfx.nope(); return; }
  if (a.hold){
    if (!a.can){ Sfx.nope(); addText(`Need ${a.price - shop.coins} more coins`, player.x, player.y - PH - 40, '#a07894', 16, 1.2); return; }
    holdKey = true; holdT = 0; return;
  }
  const res = a.run();
  if (res){ player.squish = .28; saveSoon(); } else Sfx.nope();
}

/* ---------------- tutorial (first bakery only) ---------------- */
function tutorialStep(){
  const s = shop;
  if (s.tutorial >= 5) return null;
  const firstCupcakeTable = TABLES.find(t => t.order === 'cupcake' && (t.state === 'wait' || t.state === 'arrive'));
  if (s.served > 0){ s.tutorial = 5; banner('Your first coins! ♡', 'Save 25 for the candy spinner — or for your first helper'); saveSoon(); return null; }
  const p = player.holding;
  if (p && p.kind === 'single' && p.recipe === 'cupcake' && firstCupcakeTable) return { x: firstCupcakeTable.x, y: firstCupcakeTable.y - 140, text: 'serve your guest' };
  if (p && p.kind === 'batch') return { x: sectionX('cupcake'), y: LAYOUT.display.y0 - 40, text: 'fill the display' };
  if (!p && shop.display.cupcake > 0) return { x: sectionX('cupcake'), y: LAYOUT.display.y0 - 40, text: 'take one cupcake' };
  if (M.oven.state === 'done' && !p) return { x: M.oven.x, y: M.oven.base - 182, text: 'take the cupcakes' };
  if (M.oven.state === 'baking') return { x: M.oven.x, y: M.oven.base - 182, text: 'baking… no hurry' };
  if (M.oven.state === 'idle' && !p) return { x: M.oven.x, y: M.oven.base - 182, text: 'bake cupcakes here' };
  return null;
}
function drawTutorial(c, tt){
  if (!tt) return;
  const b = Math.abs(Math.sin(T * 3.2)) * 8;
  c.save(); c.translate(tt.x, tt.y - b);
  c.font = `400 19px ${HANDWRITE}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(tt.text).width + 24;
  rr(c, -w / 2, -42, w, 26, 13); c.fillStyle = '#fffaf2'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#ff8fab'; c.stroke();
  c.fillStyle = '#e0567c'; c.fillText(tt.text, 0, -28);
  c.beginPath(); c.moveTo(-12, -10); c.lineTo(12, -10); c.lineTo(0, 6); c.closePath(); c.fillStyle = '#ff8fab'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke();
  c.restore();
}

/* ---------------- prompt above Sakura ---------------- */
function drawPrompt(c){
  if (!targetAction || gameState !== 'playing') return;
  const a = targetAction;
  const x = player.x, y = player.y - PH - 26 + Math.sin(T * 4) * 2;
  c.save();
  c.font = `600 15px ${FONT}`; c.textBaseline = 'middle';
  const label = a.label;
  const lw = c.measureText(label).width;
  const kw = a.info ? 0 : (a.hold ? 64 : 48);
  let pw = 0; if (a.price != null){ c.font = `700 15px ${FONT}`; pw = c.measureText(String(a.price)).width + 24; c.font = `600 15px ${FONT}`; }
  const w = kw + lw + pw + (a.info ? 24 : 26), h = 30, x0 = x - w / 2, y0 = y - h / 2;
  c.fillStyle = 'rgba(170,80,110,.18)'; rr(c, x0, y0 + 3, w, h, 15); c.fill();
  rr(c, x0, y0, w, h, 15); c.fillStyle = a.info ? 'rgba(250,244,248,.96)' : 'rgba(255,251,247,.97)'; c.fill();
  c.lineWidth = 2; c.strokeStyle = a.info ? '#e6d3dc' : (a.hold && !a.can ? '#e6d3dc' : '#ffc2d4'); c.stroke();
  c.beginPath(); c.moveTo(x - 6, y0 + h - 1); c.lineTo(x, y0 + h + 6); c.lineTo(x + 6, y0 + h - 1); c.closePath(); c.fillStyle = 'rgba(255,251,247,.97)'; c.fill();
  let cx = x0 + 5;
  if (!a.info){
    rr(c, cx, y0 + 4, kw, h - 8, 8); c.fillStyle = a.hold && !a.can ? '#d9c3cc' : '#ff8fb1'; c.fill();
    if (a.hold && holdKey && holdT > 0){ c.save(); rr(c, cx, y0 + 4, kw, h - 8, 8); c.clip(); c.fillStyle = '#e0567c'; c.fillRect(cx, y0 + 4, kw * clamp(holdT / HOLD_TIME, 0, 1), h - 8); c.restore(); }
    c.font = `600 12px ${FONT}`; c.textAlign = 'center'; c.fillStyle = '#fff';
    c.fillText(a.hold ? 'hold E' : 'E', cx + kw / 2, y + .5);
    cx += kw + 8;
  } else cx += 7;
  c.font = `600 15px ${FONT}`; c.textAlign = 'left'; c.fillStyle = a.info ? '#9c7d8a' : '#6b4150';
  c.fillText(label, cx, y + .5); cx += lw + 8;
  if (a.price != null){ coinIcon(c, cx + 7, y, 8); c.font = `700 15px ${FONT}`; c.fillStyle = a.can ? '#e0567c' : '#a78794'; c.fillText(String(a.price), cx + 18, y + .5); }
  c.restore();
}

/* ---------------- locked spots, hire signs ---------------- */
function drawHireSpot(c, role){
  const h = LAYOUT.homes[role], look = STAFF_LOOKS[role];
  ell(c, h.x, h.y + 2, 30, 9, 'rgba(255,255,255,.55)');
  c.save(); c.setLineDash([5, 4]); c.lineWidth = 2; c.strokeStyle = '#ffb3c6'; ell(c, h.x, h.y + 2, 30, 9); c.stroke(); c.restore();
  c.save(); c.translate(h.x, h.y); c.lineWidth = 2; c.strokeStyle = OUT; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-14, 0); c.lineTo(-6, -50); c.moveTo(14, 0); c.lineTo(6, -50); c.stroke();
  rr(c, -38, -78, 76, 36, 6); c.fillStyle = '#fffaf0'; c.fill(); c.stroke();
  c.font = `400 14px ${HANDWRITE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = OUT;
  c.fillText('help wanted', 0, -68);
  c.font = `600 12px ${FONT}`; c.fillStyle = '#e0567c'; c.fillText(ROLE_INFO[role].short, 0, -53);
  c.fillStyle = look.top; circ(c, 30, -78, 7); c.fill(); c.stroke();
  c.restore();
}
function drawLockedTags(c){
  if (!shop.owned.cake) priceTag(c, LAYOUT.cake.x, 192, 'Cake Studio', MACHINE_INFO.cake.price, shop.coins >= MACHINE_INFO.cake.price, T);
  if (!shop.owned.roller) priceTag(c, LAYOUT.roller.x + 30, 392, 'Pastry Roller', MACHINE_INFO.roller.price, shop.coins >= MACHINE_INFO.roller.price, T);
  if (!shop.owned.spinner) priceTag(c, 1066, 300, 'Cotton-Candy Spinner', MACHINE_INFO.spinner.price, shop.coins >= MACHINE_INFO.spinner.price, T);
  for (const role of Object.keys(ROLE_INFO)) if (!shop.hires.includes(role)){
    const h = LAYOUT.homes[role]; const p = nextHirePrice();
    priceTag(c, h.x, h.y - 120, 'Hire ' + STAFF_LOOKS[role].name, p, shop.coins >= p, T);
  }
}

/* ---------------- main loop ---------------- */
function update(dt){
  T += dt;
  updatePetals(dt, T);
  if (gameState === 'playing'){
    updatePlayer(dt, true);
    updateMachines(dt);
    updateStaff(dt);
    updateTables(dt, true);
    [target, targetAction] = findTarget();
    if (holdKey){
      if (!targetAction || !targetAction.hold || !(keys.has('KeyE') || keys.has('Space'))){ holdKey = false; holdT = 0; }
      else { holdT += dt; if (holdT >= HOLD_TIME){ holdKey = false; holdT = 0; if (targetAction.can) targetAction.run(); } }
    }
    if (curtainAnim){ curtainLift += dt / 1.6; if (curtainLift >= 1){ curtainLift = 1; curtainAnim = false; } }
    saveTimer += dt;
    if (saveTimer > 3 || (saveDirty && saveTimer > .5)){ writeSave(); saveTimer = 0; }
  } else {
    target = targetAction = null;
  }
  updateParticles(dt);
  if (!particles.some(p => p.kind === 'coin')) coinShown = shop.coins;
  updateHUD(dt);
}

function draw(){
  const c = ctx;
  c.setTransform(px, 0, 0, px, 0, 0);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.drawImage(bg, 0, 0, W, H);
  // sunset light through the window
  c.save(); c.globalCompositeOperation = 'lighter';
  const sh = .85 + .15 * Math.sin(T * .7);
  let g = c.createLinearGradient(0, 146, 0, 560); g.addColorStop(0, `rgba(255,196,150,${.15 * sh})`); g.addColorStop(1, 'rgba(255,180,160,0)');
  c.fillStyle = g;
  c.beginPath(); c.moveTo(486, 146); c.lineTo(634, 146); c.lineTo(700, 560); c.lineTo(480, 560); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(646, 146); c.lineTo(796, 146); c.lineTo(890, 560); c.lineTo(694, 560); c.closePath(); c.fill();
  c.restore();
  drawPetals(c, true, T);
  drawParticles(c, true);

  // depth-sorted scene
  const ents = [];
  ents.push({ y: M.oven.base, f: () => drawOven(c, M.oven, T) });
  ents.push({ y: M.cake.base, f: () => shop.owned.cake ? drawCakeStation(c, M.cake, T) : drawLockedGhost(c, 'cake', M.cake.x, M.cake.base) });
  ents.push({ y: M.roller.base - 40, f: () => shop.owned.roller ? drawRoller(c, M.roller, T) : drawLockedGhost(c, 'roller', M.roller.x, M.roller.base) });
  if (shop.owned.spinner) ents.push({ y: M.spinner.base, f: () => drawSpinner(c, M.spinner, T) });
  if (curtainLift < 1) ents.push({ y: LAYOUT.candy.y1 + 1, f: () => drawCandyCurtain(c, curtainLift, T) });
  const D = LAYOUT.display;
  const hiIdx = targetAction && targetAction.section != null ? targetAction.section : -1;
  const owned = DISPLAY_SECTIONS.map(r => shop.owned[RECIPES[r].machine]);
  ents.push({ y: D.y1, f: () => drawDisplayCase(c, D, owned, shop.display, T, hiIdx) });
  for (const tb of TABLES) ents.push({ y: tb.y, f: () => drawTable(c, tb, target) });
  for (const role of Object.keys(ROLE_INFO)) if (!shop.hires.includes(role)) ents.push({ y: LAYOUT.homes[role].y, f: () => drawHireSpot(c, role) });
  ents.push({ y: player.y, f: () => drawPlayer(c) });
  for (const a of staff) ents.push({ y: a.y, f: () => drawStaff(c, a) });
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) e.f();

  // glowing lights
  c.save(); c.globalCompositeOperation = 'lighter';
  c.globalAlpha = .28 + .05 * Math.sin(T * .9); c.drawImage(GLOW_WARM, 470, -90, 340, 300);
  for (const b of BULBS){ c.globalAlpha = .3 + .22 * Math.sin(T * 2.2 + b.ph); c.drawImage(b.col === '#ffc2d6' ? GLOW_PINK : b.col === '#e0d3ff' ? GLOW_LAV : GLOW_WARM, b.x - 22, b.y - 14, 44, 44); }
  if (M.oven.state === 'baking'){ c.globalAlpha = .35 + .1 * Math.sin(T * 5); c.drawImage(GLOW_WARM, M.oven.x - 80, M.oven.base - 190, 120, 120); }
  if (M.spinner.state === 'spinning'){ c.globalAlpha = .3; c.drawImage(GLOW_PINK, M.spinner.x - 70, M.spinner.base - 170, 140, 140); }
  c.restore();
  for (const b of BULBS){ c.fillStyle = '#8a5a5a'; c.fillRect(b.x - 2, b.y - 1, 4, 4); ell(c, b.x, b.y + 7, 3.8, 5, b.col); }
  c.drawImage(vig, 0, 0, W, H);

  // UI layer on the canvas
  const hr = player.holding && (player.holding.kind === 'single' || player.holding.kind === 'batch') ? player.holding.recipe : null;
  for (const tb of TABLES) drawBubble(c, tb, hr);
  if (gameState !== 'menu') drawLockedTags(c);
  drawParticles(c, false);
  drawTexts(c);
  drawPetals(c, false, T);
  if (gameState === 'playing'){ drawTutorial(c, tutorialStep()); drawPrompt(c); }
}

let last = performance.now();
function frame(now){
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  update(dt); draw();
  requestAnimationFrame(frame);
}

/* ---------------- menus ---------------- */
function startShop(fromSave){
  Sfx.init();
  if (fromSave){ const s = readSave(); if (s) applySave(s); }
  renderBackground(); buildNav();
  coinShown = shop.coins;
  gameState = 'playing';
  ui.menu.classList.add('hidden'); ui.hud.classList.remove('hidden');
  ui.hint.classList.remove('hidden'); hintTimer = 25;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  if (!fromSave) banner("Welcome to Sakura's Sweet Shop!", 'Take your time — nobody is in a hurry here ♡');
  else banner('Welcome back! ♡', 'Everything is just as you left it');
  writeSave();
}
function pauseGame(){ if (gameState !== 'playing') return; gameState = 'paused'; keys.clear(); holdKey = false; ui.pause.classList.remove('hidden'); ui.hint.classList.remove('hidden'); writeSave(); }
function resumeGame(){ if (gameState !== 'paused') return; gameState = 'playing'; ui.pause.classList.add('hidden'); hintTimer = 6; resetConfirm(); }
let confirmReset = false;
function resetConfirm(){ confirmReset = false; ui.resetBtn.textContent = 'Start a new bakery'; }
function startOver(){
  if (!confirmReset){ confirmReset = true; ui.resetBtn.textContent = 'Click again to erase this bakery'; return; }
  window.__noSaveOnUnload = true;
  clearSave(); location.reload();
}

/* ---------------- input ---------------- */
const BLOCK = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
addEventListener('keydown', e => {
  const code = e.code;
  if (BLOCK.has(code)) e.preventDefault();
  keys.add(code);
  if (e.repeat) return;
  if (code === 'KeyM'){ setMuted(!Sfx.muted); saveSoon(); return; }
  if (gameState === 'menu'){ if (code === 'Enter' || code === 'Space') startShop(!!readSave()); }
  else if (gameState === 'playing'){
    if (code === 'Space' || code === 'KeyE') pressInteract();
    else if (code === 'KeyP' || code === 'Escape') pauseGame();
  } else if (gameState === 'paused'){ if (code === 'KeyP' || code === 'Escape' || code === 'Enter') resumeGame(); }
});
addEventListener('keyup', e => { keys.delete(e.code); if (e.code === 'KeyE' || e.code === 'Space'){ holdKey = false; holdT = 0; } });
addEventListener('blur', () => { keys.clear(); holdKey = false; });
function saveOnLeave(){ if (gameState !== 'menu' && !window.__noSaveOnUnload) writeSave(); }
document.addEventListener('visibilitychange', () => { if (document.hidden){ saveOnLeave(); pauseGame(); } });
addEventListener('pagehide', saveOnLeave);
addEventListener('beforeunload', saveOnLeave);
ui.startBtn.addEventListener('click', e => { e.currentTarget.blur(); startShop(!!readSave()); });
ui.newBtn.addEventListener('click', e => {
  e.currentTarget.blur();
  if (!confirmReset){ confirmReset = true; ui.newBtn.textContent = 'Click again to start over'; return; }
  clearSave(); window.__noSaveOnUnload = true; location.reload();
});
ui.resumeBtn.addEventListener('click', e => { e.currentTarget.blur(); resumeGame(); });
ui.resetBtn.addEventListener('click', e => { e.currentTarget.blur(); startOver(); });
$('muteBtn').addEventListener('click', e => { e.currentTarget.blur(); setMuted(!Sfx.muted); saveSoon(); });
$('pauseBtn').addEventListener('click', e => { e.currentTarget.blur(); gameState === 'paused' ? resumeGame() : pauseGame(); });

/* ---------------- boot ---------------- */
resizeHooks.push(renderBackground, renderVignette);
addEventListener('resize', resize);
(function boot(){
  const s = readSave();
  if (s){
    ui.startBtn.textContent = 'Continue ♡';
    ui.newBtn.classList.remove('hidden');
    $('menuSub').textContent = `Welcome back! ${s.coins} coins saved · ${s.served} desserts served`;
    if (typeof s.muted === 'boolean') setMuted(s.muted);
  }
  buildNav();
  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => renderBackground());
  requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
})();
