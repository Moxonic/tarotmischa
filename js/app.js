(function () {
  'use strict';

  const MEANING = window.TAROT.BY_KEY;
  const DECKS = window.TAROT_DECKS;
  const BACKS = window.TAROT_BACKS;

  const $ = (id) => document.getElementById(id);
  const appEl = $('app');
  const deckEl = $('deck');
  const haloEl = $('halo');
  const sparksEl = $('sparks');
  const emptyEl = $('empty');
  const layers = Array.from(deckEl.querySelectorAll('.layer'));
  const countEl = $('count');
  const shuffleBtn = $('shuffle');
  const hintsEl = $('hints');
  const sheet = $('sheet');
  const scrim = $('scrim');
  const picker = $('picker');

  const STORE = 'night-tarot:v2';
  const REVERSE_CHANCE = 0.3;
  const LAYER1 = { x: 0, y: 5, rot: -1.1, ry: 0, s: 0.982 };
  const MISSING_NOTE = {
    lost: 'This card has not survived. Four cards of the original deck are lost; its meaning is still read here.',
    unscanned: 'The original survives in Bergamo, but no public-domain scan of it was available.',
    copy: 'This card is missing from the surviving copy that was scanned; its meaning is still read here.',
    missing: 'No image of this card was available.',
  };
  const STAND_IN_INTRO = {
    lost: "This card of the original deck is lost.",
    unscanned: 'The original survives in Bergamo, but no public-domain scan of it was available.',
    copy: 'This card is missing from the surviving copy that was scanned.',
    missing: 'No image of the original card was available.',
  };
  const MISSING_LABEL = { lost: 'Lost card', unscanned: 'Not pictured', copy: 'Missing from this copy', missing: 'Not pictured' };

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motionQuery.matches;

  let deck = null;          // the chosen deck from TAROT_DECKS
  const state = { order: [], index: 0, revealed: false, history: [] };
  const HISTORY_MAX = 500;
  let saved = load();
  let top = null;           // { el, inner, entry, pose }
  let busy = false;
  let sheetOpen = false;
  let sheetOpenedAt = 0;
  let pickerOpen = false;
  let historyOpen = false;
  let haloLevel = 0;

  /* ---------- helpers ---------- */

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const ease = {
    linear: (t) => t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outBack: (t) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };

  function tween(duration, easing, step) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      const frame = (now) => {
        const t = clamp((now - t0) / duration, 0, 1);
        step(easing(t), t);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
  }

  function haptic(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* unsupported */ }
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE));
      if (s && typeof s === 'object') return { last: s.last || null, progress: s.progress || {} };
    } catch (e) { /* storage unavailable or corrupt */ }
    return { last: null, progress: {} };
  }

  function save() {
    if (deck) {
      saved.last = deck.id;
      saved.progress[deck.id] = { order: state.order, index: state.index, revealed: state.revealed, history: state.history };
    }
    try { localStorage.setItem(STORE, JSON.stringify(saved)); } catch (e) { /* storage unavailable */ }
  }

  function validProgress(d, p) {
    return p && Array.isArray(p.order) && p.order.length === d.cards.length &&
      p.order.every((e) => e && Number.isInteger(e.i) && d.cards[e.i]) && Number.isInteger(p.index);
  }

  function newOrder() {
    const ids = deck.cards.map((_, i) => i);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids.map((i) => ({ i, rev: Math.random() < REVERSE_CHANCE }));
  }

  const total = () => state.order.length;
  const remaining = () => state.order.length - state.index;
  const restPose = () => ({ x: 0, y: 0, rot: 0, ry: state.revealed && !reduced ? 180 : 0, s: 1 });
  const cardOf = (entry) => deck.cards[entry.i];
  const meaningOf = (card) => MEANING[card.k];

  function setHalo(v) {
    haloLevel = v;
    haloEl.style.opacity = v.toFixed(3);
  }

  function announce(text) {
    const el = $('announce');
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = text; });
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- images ---------- */

  const imageCache = new Map();
  function preload(src) {
    if (!src) return Promise.resolve();
    if (!imageCache.has(src)) {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      imageCache.set(src, img.decode ? img.decode().catch(() => {}) : new Promise((r) => { img.onload = img.onerror = r; }));
    }
    return imageCache.get(src);
  }
  function preloadAhead() {
    for (let k = state.index; k < Math.min(state.order.length, state.index + 3); k++) preload(cardOf(state.order[k]).img);
  }

  /* ---------- cards ---------- */

  function faceHTML(card) {
    if (card.img) return `<img class="art" src="${card.img}" alt="" draggable="false" decoding="async">`;
    const m = meaningOf(card);
    return `<div class="art missing"><span class="missing-label">${MISSING_LABEL[card.miss] || MISSING_LABEL.missing}</span>` +
      `<span class="missing-name">${esc(card.n || m.name)}</span>` +
      `<span class="missing-note">${card.miss === 'lost' ? 'Lost to time.' : 'Not in this copy.'} Its meaning remains.</span></div>`;
  }

  function makeCard(entry, pose) {
    const card = cardOf(entry);
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML =
      `<div class="card-inner"><div class="face back"></div>` +
      `<div class="face front${entry.rev ? ' is-rev' : ''}${card.img ? ' has-img' : ''}">${faceHTML(card)}<div class="sheen"></div></div></div>`;
    const c = { el, inner: el.firstChild, entry, pose: { ...pose } };
    apply(c);
    return c;
  }

  function apply(c) {
    const p = c.pose;
    c.el.style.transform = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0) rotate(${p.rot.toFixed(3)}deg) scale(${p.s.toFixed(4)})`;
    c.inner.style.transform = `rotateY(${p.ry.toFixed(2)}deg)`;
    // iOS Safari doesn't reliably hide the far side of a 3D-turned face (backface-visibility),
    // and paints the front over the back. Show only the face that is turned toward the viewer.
    const turn = ((p.ry % 360) + 360) % 360;
    c.el.classList.toggle('show-front', turn > 90 && turn < 270);
  }

  function showTop() {
    if (top) { top.el.remove(); top = null; }
    const entry = state.order[state.index];
    if (entry) {
      top = makeCard(entry, restPose());
      if (state.revealed) top.el.classList.add('is-revealed');
      deckEl.insertBefore(top.el, sparksEl);
    }
    preloadAhead();
    setHalo(state.revealed ? 0.3 : 0);
    renderDeck();
  }

  function renderDeck() {
    const left = remaining();
    countEl.textContent = left;
    $('count-total').textContent = `/ ${total()}`;
    const below = Math.max(0, left - 1);
    layers.forEach((l, i) => { l.style.opacity = i < Math.min(3, below) ? '1' : '0'; });
    emptyEl.hidden = left > 0;
    let label;
    if (left === 0) label = 'The deck is empty. Reshuffle to begin again.';
    else if (state.revealed) {
      const card = cardOf(top.entry);
      label = `${meaningOf(card).name}${top.entry.rev ? ', reversed' : ''}. Press Enter to read its meaning, or Left Arrow for the next card. ${left} of ${total()} remain.`;
    } else label = `Face-down card, ${left} of ${total()} remain. Right Arrow reveals it, Left Arrow passes it.`;
    deckEl.setAttribute('aria-label', label);
    renderHints();
  }

  function renderHints() {
    const left = remaining();
    const l = $('hint-left'), r = $('hint-right'), m = $('hint-mid');
    const [hl, hr] = hintsEl.querySelectorAll('.hint-left, .hint-right');
    if (left === 0) {
      l.textContent = 'pass'; r.textContent = 'reveal'; m.textContent = 'reshuffle to continue';
      hl.classList.add('is-off'); hr.classList.add('is-off');
    } else if (state.revealed) {
      l.textContent = 'next'; r.textContent = 'reveal'; m.textContent = 'tap the card to read it';
      hl.classList.remove('is-off'); hr.classList.add('is-off');
    } else {
      l.textContent = 'pass'; r.textContent = 'reveal'; m.textContent = left === total() ? 'swipe to begin' : '';
      hl.classList.remove('is-off'); hr.classList.remove('is-off');
    }
  }

  /* ---------- reveal ---------- */

  function sparkle() {
    const n = 22;
    const w = deckEl.offsetWidth, h = deckEl.offsetHeight;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      // start on the card's perimeter, drift outward
      const edge = Math.random() * 2 * (w + h);
      let x, y, nx, ny;
      if (edge < w) { x = edge; y = 0; nx = 0; ny = -1; }
      else if (edge < w + h) { x = w; y = edge - w; nx = 1; ny = 0; }
      else if (edge < 2 * w + h) { x = edge - w - h; y = h; nx = 0; ny = 1; }
      else { x = 0; y = edge - 2 * w - h; nx = -1; ny = 0; }
      const dist = 26 + Math.random() * 52;
      s.style.cssText =
        `left:${x}px;top:${y}px;--s:${(8 + Math.random() * 12).toFixed(1)}px;` +
        `--dx:${(nx * dist + (Math.random() - 0.5) * 30).toFixed(1)}px;--dy:${(ny * dist + (Math.random() - 0.5) * 30 - 10).toFixed(1)}px;` +
        `--r:${Math.round(Math.random() * 180)}deg;--d:${Math.round(800 + Math.random() * 600)}ms;--delay:${Math.round(Math.random() * 160)}ms`;
      frag.appendChild(s);
    }
    sparksEl.appendChild(frag);
    setTimeout(() => {
      Array.from(sparksEl.children).slice(0, n).forEach((s) => s.remove());
    }, 1800);
  }

  async function reveal() {
    if (busy || !top || state.revealed) return;
    busy = true;
    const c = top;
    const card = cardOf(c.entry);
    // never turn a card over onto a blank face: give the scan a moment to arrive
    await Promise.race([preload(card.img), wait(1500)]);
    state.revealed = true;
    state.history.push({ i: c.entry.i, rev: c.entry.rev });
    if (state.history.length > HISTORY_MAX) state.history.splice(0, state.history.length - HISTORY_MAX);
    renderHistoryCount();
    save();

    if (reduced) {
      c.el.classList.add('is-revealed');
      haptic(12);
      const from = { ...c.pose };
      await tween(300, ease.outCubic, (e) => {
        c.pose.x = lerp(from.x, 0, e); c.pose.y = lerp(from.y, 0, e);
        c.pose.rot = lerp(from.rot, 0, e); c.pose.s = lerp(from.s, 1, e);
        apply(c);
        setHalo(0.3 * e);
      });
    } else {
      const from = { ...c.pose };
      let turned = false;
      await tween(1000, ease.linear, (_, t) => {
        const e = ease.inOutCubic(t);
        const settle = ease.outCubic(clamp(t * 1.6, 0, 1));
        const arc = Math.sin(Math.PI * t);
        c.pose.x = lerp(from.x, 0, settle);
        c.pose.y = lerp(from.y, 0, settle) - arc * 18;
        c.pose.rot = lerp(from.rot, 0, settle) - arc * 3;
        c.pose.s = lerp(from.s, 1, settle) + arc * 0.08;
        c.pose.ry = lerp(from.ry, 180, e);
        apply(c);
        setHalo(t < 0.55 ? arc * 0.95 : Math.max(0.3, arc * 0.95));
        if (!turned && c.pose.ry >= 90) {
          turned = true;
          haptic(14);
          sparkle();
          c.el.querySelector('.sheen').classList.add('play');
        }
      });
      c.el.classList.add('is-revealed');
    }
    announce(`${meaningOf(card).name}${c.entry.rev ? ', reversed' : ''}`);
    renderDeck();
    busy = false;
  }

  /* ---------- pass to the next card ---------- */

  async function pass(velocity = 0) {
    if (busy || !top) return;
    busy = true;
    const old = top;
    const wasHalo = haloLevel;
    state.index++;
    state.revealed = false;
    save();

    const entry = state.order[state.index];
    top = entry ? makeCard(entry, reduced ? restPose() : LAYER1) : null;
    if (top) deckEl.insertBefore(top.el, old.el);
    preloadAhead();
    renderDeck();

    if (reduced) {
      if (top) top.el.style.opacity = '0';
      await tween(260, ease.outCubic, (e) => {
        old.el.style.opacity = String(1 - e);
        if (top) top.el.style.opacity = String(e);
        setHalo(wasHalo * (1 - e));
      });
      if (top) top.el.style.opacity = '';
    } else {
      const from = { ...old.pose };
      const w = deckEl.offsetWidth;
      const toX = -(window.innerWidth / 2 + w * 1.2);
      const dur = clamp(420 - Math.abs(velocity) * 90, 240, 420);
      const flight = tween(dur, from.x < -10 ? ease.outCubic : ease.inOutCubic, (e) => {
        old.pose.x = lerp(from.x, toX, e);
        old.pose.y = lerp(from.y, from.y + 36, e);
        old.pose.rot = lerp(from.rot, -24, e);
        apply(old);
        setHalo(wasHalo * (1 - e));
      });
      const next = top;
      const rise = next ? tween(460, ease.outCubic, (e) => {
        const to = restPose();
        for (const k of ['x', 'y', 'rot', 's']) next.pose[k] = lerp(LAYER1[k], to[k], e);
        apply(next);
      }) : null;
      await Promise.all([flight, rise]);
    }
    old.el.remove();
    busy = false;
  }

  async function snapBack() {
    if (!top) return;
    busy = true;
    const c = top;
    const from = { ...c.pose };
    const to = restPose();
    const wasHalo = haloLevel;
    await tween(520, ease.outBack, (e) => {
      for (const k of ['x', 'y', 'rot', 'ry', 's']) c.pose[k] = lerp(from[k], to[k], e);
      apply(c);
      if (state.revealed) setHalo(lerp(wasHalo, 0.3, clamp(e, 0, 1)));
    });
    busy = false;
  }

  async function nudge() {
    if (busy || !top) return;
    busy = true;
    hintsEl.classList.remove('pulse');
    void hintsEl.offsetWidth;
    hintsEl.classList.add('pulse');
    if (!reduced) {
      await tween(620, ease.linear, (_, t) => {
        const k = Math.sin(Math.PI * t) * Math.exp(-t * 1.5);
        top.pose.ry = k * 22;
        top.pose.s = 1 + k * 0.02;
        apply(top);
      });
      top.pose.ry = 0; top.pose.s = 1; apply(top);
    }
    busy = false;
  }

  /* ---------- reshuffle ---------- */

  async function reshuffle() {
    if (busy || !deck) return;
    busy = true;
    closeSheet();
    shuffleBtn.classList.remove('is-spinning');
    void shuffleBtn.offsetWidth;
    shuffleBtn.classList.add('is-spinning');

    const finish = () => {
      state.order = newOrder();
      state.index = 0;
      state.revealed = false;
      save();
      showTop();
      announce(`The ${deck.name} deck is shuffled. ${total()} cards remain.`);
    };

    if (reduced || typeof deckEl.animate !== 'function') {
      await tween(220, ease.linear, (e) => { deckEl.style.opacity = String(1 - e); });
      finish();
      await tween(320, ease.linear, (e) => { deckEl.style.opacity = String(e); });
      deckEl.style.opacity = '';
      busy = false;
      return;
    }

    const wasHalo = haloLevel;
    const N = 10;
    const ov = document.createElement('div');
    ov.className = 'shuffle';
    const ghosts = Array.from({ length: N }, (_, i) => {
      const g = document.createElement('div');
      g.className = 'ghost';
      g.style.zIndex = String(i);
      g.style.transform = `translate3d(0, ${-i * 0.7}px, 0)`;
      ov.appendChild(g);
      return g;
    });
    const cur = ghosts.map((g) => g.style.transform);
    deckEl.appendChild(ov);
    deckEl.classList.add('is-shuffling');
    tween(200, ease.linear, (e) => setHalo(wasHalo * (1 - e)));

    const move = (i, to, opts) => {
      const a = ghosts[i].animate([{ transform: cur[i] }, { transform: to }],
        { fill: 'forwards', easing: 'cubic-bezier(.4,0,.2,1)', ...opts });
      cur[i] = to;
      // never let a stalled animation leave the deck locked
      return Promise.race([a.finished, wait((opts.duration || 0) + (opts.delay || 0) + 150)]);
    };

    await wait(120);
    let stackOrder = ghosts.map((_, i) => i);
    for (let round = 0; round < 2; round++) {
      // split the deck into two halves
      const half = N / 2;
      await Promise.all(stackOrder.map((gi, pos) => {
        const side = pos < half ? -1 : 1;
        const h = pos < half ? pos : pos - half;
        return move(gi, `translate3d(${side * 56}%, ${-h * 0.8 - 6}px, 0) rotate(${side * (7 - round * 2)}deg)`,
          { duration: round ? 260 : 340 });
      }));
      // riffle them back together, alternating sides from the bottom up
      const left = stackOrder.slice(0, half), right = stackOrder.slice(half);
      const merged = [];
      for (let k = 0; k < half; k++) {
        if (Math.random() < 0.5) merged.push(left[k], right[k]); else merged.push(right[k], left[k]);
      }
      const gap = round ? 42 : 55;
      await Promise.all(merged.map((gi, k) => {
        setTimeout(() => { ghosts[gi].style.zIndex = String(10 + round * N + k); }, k * gap);
        return move(gi, `translate3d(0, ${-k * 0.7}px, 0) rotate(${((Math.random() - 0.5) * 3).toFixed(2)}deg)`,
          { duration: 200, delay: k * gap, easing: 'cubic-bezier(.3,.6,.3,1)' });
      }));
      stackOrder = merged;
    }
    // square the deck up
    await Promise.all(stackOrder.map((gi, k) => move(gi, `translate3d(0, ${-k * 0.4}px, 0) rotate(0deg)`, { duration: 220 })));

    finish();
    deckEl.classList.remove('is-shuffling');
    ov.remove();
    busy = false;
  }

  /* ---------- choosing a deck ---------- */

  const backCache = new Map();
  function backURL(d) {
    if (!backCache.has(d.id)) {
      backCache.set(d.id, `url("data:image/svg+xml,${encodeURIComponent(BACKS.back(d.id, d.ratio))}")`);
    }
    return backCache.get(d.id);
  }

  function renderPicker() {
    const list = $('picker-list');
    list.innerHTML = '';
    DECKS.forEach((d, i) => {
      const p = saved.progress[d.id];
      const inProgress = validProgress(d, p) && p.index > 0 && p.index < d.cards.length;
      const li = document.createElement('li');
      li.innerHTML =
        `<button class="deck-option${saved.last === d.id ? ' is-current' : ''}" type="button" data-id="${d.id}" style="animation-delay:${i * 50}ms">` +
        `<span class="deck-thumb" style="--ratio:${d.ratio};--back:${esc(backURL(d))}"><span class="thumb-back"></span><img src="${d.sample}" alt="" loading="lazy" decoding="async"></span>` +
        `<span class="deck-text"><span class="deck-era">${esc(d.era)}</span><span class="deck-title">${esc(d.name)}</span>` +
        `<span class="deck-blurb">${esc(d.blurb)}</span>` +
        `<span class="deck-meta"><span>${d.cards.length} cards</span>` +
        (inProgress ? `<span class="is-progress">${d.cards.length - p.index} left in your deck</span>` : '') +
        `</span></span></button>`;
      list.appendChild(li);
    });
  }

  $('picker-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.deck-option');
    if (btn) chooseDeck(btn.dataset.id);
  });

  function openPicker() {
    if (busy) return;
    closeSheet();
    closeHistory();
    renderPicker();
    pickerOpen = true;
    picker.classList.remove('is-hidden');
    picker.setAttribute('aria-hidden', 'false');
    appEl.setAttribute('aria-hidden', 'true');
    picker.scrollTop = 0;
    const current = picker.querySelector('.is-current') || picker.querySelector('.deck-option');
    if (current) current.focus({ preventScroll: true });
  }

  function chooseDeck(id) {
    const d = DECKS.find((x) => x.id === id);
    if (!d) return;
    const fresh = !deck || deck.id !== d.id;
    deck = d;
    deckEl.style.setProperty('--ratio', d.ratio);
    document.documentElement.style.setProperty('--card-back', backURL(d));
    $('deck-name').textContent = d.short || d.name;

    const p = saved.progress[d.id];
    const resume = validProgress(d, p) && p.index < d.cards.length;
    if (fresh) {
      if (resume) {
        state.order = p.order;
        state.index = clamp(p.index, 0, d.cards.length);
        state.revealed = !!p.revealed;
      } else {
        state.order = newOrder();
        state.index = 0;
        state.revealed = false;
      }
      state.history = (p && Array.isArray(p.history) ? p.history : [])
        .filter((e) => e && Number.isInteger(e.i) && d.cards[e.i]);
      renderHistoryCount();
      save();
      showTop();
    }

    pickerOpen = false;
    picker.classList.add('is-hidden');
    picker.setAttribute('aria-hidden', 'true');
    appEl.setAttribute('aria-hidden', 'false');
    deckEl.classList.remove('is-entering');
    void deckEl.offsetWidth;
    deckEl.classList.add('is-entering');
    deckEl.focus({ preventScroll: true });
    announce(`${d.name}. ${remaining()} of ${total()} cards in the deck.`);
    // a brand new deck arrives with a shuffle
    if (fresh && !resume) setTimeout(reshuffle, reduced ? 0 : 500);
  }

  $('deck-name').addEventListener('click', openPicker);

  /* ---------- meaning sheet ---------- */

  // the face-up card on the deck
  function openTopSheet() {
    if (!top || !state.revealed || historyOpen) return;
    openSheet(cardOf(top.entry), top.entry.rev);
  }

  function openSheet(card, rev) {
    if (sheetOpen || pickerOpen) return;
    const m = meaningOf(card);
    const isMajor = card.k.startsWith('M') || card.k.startsWith('X:');
    const place = isMajor
      ? (card.l ? `${deck.id === 'minchiate' ? 'Trump' : 'Major Arcana'} · ${card.l}` : 'Major Arcana')
      : m.group;
    $('sheet-eyebrow').textContent = `${deck.name} · ${place}`;
    $('sheet-title').textContent = m.name;
    $('sheet-local').textContent = card.n && card.n !== m.name ? `On the card: ${card.n}` : '';
    $('sheet-orient').innerHTML = rev
      ? 'Drawn <b>reversed</b>; its energy is blocked, inward or delayed.'
      : 'Drawn <b>upright</b>.';
    const chips = $('sheet-chips');
    chips.innerHTML = '';
    (rev ? m.rkw : m.kw).forEach((k) => {
      const li = document.createElement('li');
      li.textContent = k;
      chips.appendChild(li);
    });
    $('m1-title').textContent = rev ? 'Reversed meaning' : 'Upright meaning';
    $('m1-text').textContent = rev ? m.rev : m.up;
    $('m2-title').textContent = rev ? 'When upright' : 'When reversed';
    $('m2-text').textContent = rev ? m.up : m.rev;
    $('sheet-note').textContent = !card.miss ? ''
      : card.stand ? `${STAND_IN_INTRO[card.miss] || STAND_IN_INTRO.missing} Shown instead: ${card.stand}.`
      : MISSING_NOTE[card.miss] || MISSING_NOTE.missing;
    $('sheet-body').scrollTop = 0;

    sheetOpen = true;
    sheetOpenedAt = performance.now();
    sheet.style.transform = '';
    sheet.classList.add('is-open');
    scrim.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    setTimeout(() => { if (sheetOpen) $('sheet-close').focus({ preventScroll: true }); }, 350);
  }

  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    sheet.style.transform = '';
    sheet.classList.remove('is-open', 'is-dragging');
    scrim.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    (historyOpen ? $('history-close') : deckEl).focus({ preventScroll: true });
  }

  // A touch tap opens the sheet on finger-up; the browser's follow-up click then lands on the
  // freshly shown scrim. Ignore clicks that arrive right after opening.
  scrim.addEventListener('click', () => {
    if (performance.now() - sheetOpenedAt > 450) closeSheet();
  });
  $('sheet-close').addEventListener('click', closeSheet);

  /* ---------- history of revealed cards, oldest first; opens at the newest ---------- */

  const historyEl = $('history');
  const trackEl = $('history-track');

  function renderHistoryCount() {
    const n = state.history.length;
    $('history-count').textContent = n > 99 ? '99+' : String(n);
    $('history-count').hidden = n === 0;
    $('history-btn').setAttribute('aria-label', `Revealed cards (${n})`);
  }

  function renderHistory() {
    trackEl.innerHTML = '';
    const n = state.history.length;
    $('history-sub').textContent = n
      ? `${n} card${n === 1 ? '' : 's'} revealed from ${deck.name}`
      : '';
    $('history-empty').hidden = n > 0;
    $('history-reset').hidden = n === 0;
    historyEl.style.setProperty('--ratio', deck.ratio);
    const frag = document.createDocumentFragment();
    state.history.forEach((h, k) => {
      const card = deck.cards[h.i];
      const m = meaningOf(card);
      const li = document.createElement('li');
      li.className = 'history-item';
      li.innerHTML =
        `<button type="button" class="history-card" data-k="${k}" aria-label="${k + 1}. ${esc(m.name)}${h.rev ? ', reversed' : ''}">` +
        `<span class="history-face${h.rev ? ' is-rev' : ''}">${card.img
          ? `<img src="${card.img}" alt="" loading="lazy" decoding="async" draggable="false">`
          : `<span class="history-missing">${esc(card.n || m.name)}</span>`}</span>` +
        `<span class="history-cap"><span class="history-num">${k + 1}</span>${esc(m.name)}${h.rev ? '<em>reversed</em>' : ''}</span></button>`;
      frag.appendChild(li);
    });
    trackEl.appendChild(frag);
    updateHistoryNav();
  }

  /* One line of cards, each lying with its long side along the screen's short side, as large as the
     screen allows. Upright phone: the cards lie sideways across the full width in one column.
     Sideways phone or wide screen: they stand upright at full height in one row. */
  const CAPTION_H = 44;     // caption (two lines) plus the space above it

  function layoutHistory() {
    const cs = getComputedStyle(trackEl);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const W = trackEl.clientWidth - padX;
    const H = trackEl.clientHeight - padY;
    const r = deck.ratio;
    const sideways = H > W;
    historyEl.classList.toggle('is-sideways', sideways);
    // long side of the card spans the short side of the screen
    let long = sideways ? W : H - CAPTION_H;
    if (sideways) long = Math.min(long, (H - CAPTION_H) / r);   // short side must still fit
    else long = Math.min(long, W / r);
    const short = long * r;
    trackEl.style.setProperty('--box-w', `${sideways ? long : short}px`);
    trackEl.style.setProperty('--box-h', `${sideways ? short : long}px`);
    trackEl.style.setProperty('--img-w', `${short}px`);
    trackEl.style.setProperty('--img-h', `${long}px`);
  }

  const isVertical = () => historyEl.classList.contains('is-sideways');
  function scrollHistory(dir) {
    const page = isVertical() ? trackEl.clientHeight : trackEl.clientWidth;
    trackEl.scrollBy({ [isVertical() ? 'top' : 'left']: dir * page * 0.9, behavior: reduced ? 'auto' : 'smooth' });
  }
  function updateHistoryNav() {
    const v = isVertical();
    const pos = v ? trackEl.scrollTop : trackEl.scrollLeft;
    const max = v ? trackEl.scrollHeight - trackEl.clientHeight : trackEl.scrollWidth - trackEl.clientWidth;
    $('history-prev').disabled = pos <= 2;
    $('history-next').disabled = pos >= max - 2;
  }
  function scrollHistoryToEnd() {
    // start at the most recent card; scroll back for earlier ones
    trackEl.scrollLeft = trackEl.scrollWidth;
    trackEl.scrollTop = trackEl.scrollHeight;
    updateHistoryNav();
  }

  function openHistory() {
    if (!deck || busy || pickerOpen) return;
    closeSheet();
    renderHistory();
    historyOpen = true;
    historyEl.classList.add('is-open');
    historyEl.setAttribute('aria-hidden', 'false');
    layoutHistory();
    requestAnimationFrame(scrollHistoryToEnd);
    $('history-close').focus({ preventScroll: true });
  }

  window.addEventListener('resize', () => {
    if (!historyOpen) return;
    layoutHistory();
    scrollHistoryToEnd();
  });

  function closeHistory() {
    if (!historyOpen) return;
    closeSheet();
    disarmReset();
    historyOpen = false;
    historyEl.classList.remove('is-open');
    historyEl.setAttribute('aria-hidden', 'true');
    deckEl.focus({ preventScroll: true });
  }

  // Start new: forget the revealed cards and reshuffle the whole deck. Asks for a second tap first.
  const resetBtn = $('history-reset');
  let resetArmed = 0;
  function disarmReset() {
    clearTimeout(resetArmed);
    resetArmed = 0;
    resetBtn.classList.remove('is-armed');
    resetBtn.textContent = 'Start new';
  }
  resetBtn.addEventListener('click', () => {
    if (!resetArmed) {
      resetBtn.classList.add('is-armed');
      resetBtn.textContent = 'Tap again to clear and reshuffle';
      resetArmed = setTimeout(disarmReset, 3500);
      return;
    }
    disarmReset();
    state.history = [];
    renderHistoryCount();
    closeHistory();
    reshuffle();
  });

  $('history-btn').addEventListener('click', openHistory);
  $('history-close').addEventListener('click', closeHistory);
  $('history-prev').addEventListener('click', () => scrollHistory(-1));
  $('history-next').addEventListener('click', () => scrollHistory(1));
  trackEl.addEventListener('scroll', updateHistoryNav, { passive: true });
  trackEl.addEventListener('click', (e) => {
    const b = e.target.closest('.history-card');
    if (!b) return;
    const h = state.history[+b.dataset.k];
    if (h) openSheet(deck.cards[h.i], h.rev);
  });

  // drag the sheet's handle down to dismiss
  (function () {
    const grab = $('sheet-grab');
    let y0 = null, dy = 0, t0 = 0;
    grab.addEventListener('pointerdown', (e) => {
      if (!sheetOpen) return;
      y0 = e.clientY; dy = 0; t0 = performance.now();
      grab.setPointerCapture(e.pointerId);
      sheet.classList.add('is-dragging');
    });
    grab.addEventListener('pointermove', (e) => {
      if (y0 === null) return;
      dy = Math.max(0, e.clientY - y0);
      sheet.style.transform = `translate3d(0, ${dy}px, 0)`;
    });
    const end = () => {
      if (y0 === null) return;
      y0 = null;
      sheet.classList.remove('is-dragging');
      const fast = dy / Math.max(1, performance.now() - t0) > 0.5;
      if (dy > 90 || (fast && dy > 24)) closeSheet();
      else sheet.style.transform = '';
    };
    grab.addEventListener('pointerup', end);
    grab.addEventListener('pointercancel', end);
  })();

  /* ---------- gestures on the deck ---------- */

  let drag = null;
  let dragFrame = 0;

  function dragPose() {
    if (!drag || !top) return;
    const { dx, dy, w } = drag;
    const p = top.pose;
    const faceUp = state.revealed;
    if (dx <= 0) {
      p.x = dx;
      p.y = dy * 0.15;
      p.rot = reduced ? 0 : (dx / w) * 14;
      p.ry = faceUp && !reduced ? 180 : 0;
      p.s = 1;
      if (faceUp) setHalo(0.3 * clamp(1 + dx / w, 0, 1));
    } else if (!faceUp) {
      // drawing right lifts the card's left edge: a preview of the flip
      const k = Math.min(1, dx / (w * 0.9));
      p.x = dx * 0.3;
      p.y = dy * 0.1;
      p.rot = reduced ? 0 : (dx / w) * 4;
      p.ry = reduced ? 0 : 52 * k * (1 - k * 0.35);
      p.s = 1 + k * 0.03;
    } else {
      // a revealed card resists being pushed right
      const r = w * 0.4 * (1 - 1 / (dx / (w * 0.4) + 1));
      p.x = r;
      p.y = dy * 0.08;
      p.rot = reduced ? 0 : (r / w) * 6;
      p.ry = reduced ? 0 : 180;
    }
    apply(top);
  }

  deckEl.addEventListener('pointerdown', (e) => {
    if (busy || !top || sheetOpen || pickerOpen || historyOpen || e.button > 0) return;
    deckEl.setPointerCapture(e.pointerId);
    const now = performance.now();
    drag = {
      id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: now,
      dx: 0, dy: 0, w: deckEl.offsetWidth, moved: false, samples: [[now, e.clientX]],
    };
  });

  deckEl.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x0;
    drag.dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(drag.dx, drag.dy) > 7) drag.moved = true;
    const now = performance.now();
    drag.samples.push([now, e.clientX]);
    while (drag.samples.length > 2 && now - drag.samples[0][0] > 100) drag.samples.shift();
    if (drag.moved && !dragFrame) {
      dragFrame = requestAnimationFrame(() => { dragFrame = 0; dragPose(); });
    }
  });

  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (dragFrame) { cancelAnimationFrame(dragFrame); dragFrame = 0; }
    if (cancelled) { snapBack(); return; }

    const now = performance.now();
    const [ts, xs] = d.samples[0];
    const vx = (e.clientX - xs) / Math.max(1, now - ts);   // px per ms
    d.dx = e.clientX - d.x0;

    if (!d.moved && now - d.t0 < 500) {
      if (state.revealed) { tapped = true; openTopSheet(); } else nudge();
      return;
    }
    const threshold = d.w * 0.32;
    if (d.dx < -threshold || (vx < -0.45 && d.dx < -24)) pass(vx);
    else if (!state.revealed && (d.dx > threshold * 0.7 || (vx > 0.45 && d.dx > 20))) reveal();
    else snapBack();
  }
  // After a tap opens the sheet, cancel the touch's synthetic click so it can't hit the new sheet or scrim.
  let tapped = false;
  deckEl.addEventListener('touchend', (e) => {
    if (tapped) { tapped = false; e.preventDefault(); }
  }, { passive: false });
  deckEl.addEventListener('pointerup', (e) => endDrag(e, false));
  deckEl.addEventListener('pointercancel', (e) => endDrag(e, true));
  deckEl.addEventListener('contextmenu', (e) => e.preventDefault());

  // No page scrolling, rubber-banding or pull-to-refresh, except inside the sheet's text and the deck list.
  document.addEventListener('touchmove', (e) => {
    const scrollable = (sheetOpen && e.target.closest('.sheet-body')) || (pickerOpen && e.target.closest('.picker')) ||
      (historyOpen && !sheetOpen && e.target.closest('.history-track'));
    if (!scrollable) e.preventDefault();
  }, { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());

  /* ---------- keyboard ---------- */

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (pickerOpen) {
      if (e.key === 'Escape' && deck) { e.preventDefault(); chooseDeck(deck.id); }
      return;
    }
    if (sheetOpen) {
      if (e.key === 'Escape') { e.preventDefault(); closeSheet(); }
      return;
    }
    if (historyOpen) {
      if (e.key === 'Escape' || e.key === 'h' || e.key === 'H') { e.preventDefault(); closeHistory(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); scrollHistory(-1); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); scrollHistory(1); }
      return;
    }
    const onButton = e.target.closest && e.target.closest('button');
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); pass(); break;
      case 'ArrowRight': e.preventDefault(); reveal(); break;
      case 'ArrowUp': e.preventDefault(); openTopSheet(); break;
      case 'Enter':
      case ' ':
        if (onButton) return;
        e.preventDefault();
        if (state.revealed) openTopSheet(); else reveal();
        break;
      case 's': case 'S': reshuffle(); break;
      case 'd': case 'D': openPicker(); break;
      case 'h': case 'H': openHistory(); break;
      default:
    }
  });

  /* ---------- controls ---------- */

  shuffleBtn.addEventListener('click', reshuffle);
  $('empty-shuffle').addEventListener('click', reshuffle);

  motionQuery.addEventListener('change', (e) => {
    reduced = e.matches;
    deckEl.classList.toggle('rm', reduced);
    if (top && !busy) {
      top.pose = restPose();
      apply(top);
    }
  });

  /* ---------- start: the last deck used, or Rider Waite Smith the first time ---------- */

  const DEFAULT_DECK = 'rws';
  deckEl.classList.toggle('rm', reduced);
  chooseDeck(DECKS.some((d) => d.id === saved.last) ? saved.last : DEFAULT_DECK);
})();
