/* Original SVG art for every card, drawn in one engraved, celestial style.
   Faces are 300 x 520 user units; the emblem window spans x 44..256, y 74..418. */
(function (g) {
  'use strict';

  const INK = '#1e2546';
  const GOLD = '#a77a28';
  const GOLD_L = '#dcb65c';
  const PAPER = '#f7f0de';
  const TINT = { major: '#ecdcb6', wands: '#f0d6b4', cups: '#d5e1e4', swords: '#e0e1ea', pentacles: '#dfe3c6' };
  const FONT = "'Cormorant Garamond', 'EB Garamond', Georgia, serif";

  const r2 = (n) => Math.round(n * 100) / 100;
  const rad = (deg) => (deg * Math.PI) / 180;
  const ink = (w = 2, extra = '') => `fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}`;

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function starPts(cx, cy, R, r, n, rot = -90) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = rad(rot + (i * 180) / n);
      const d = i % 2 ? r : R;
      pts.push(`${r2(cx + Math.cos(a) * d)},${r2(cy + Math.sin(a) * d)}`);
    }
    return pts.join(' ');
  }
  const star = (cx, cy, R, r, n, fill = GOLD_L, sw = 1.2, rot = -90) =>
    `<polygon points="${starPts(cx, cy, R, r, n, rot)}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;

  function rays(cx, cy, r1, r2_, n, opts = {}) {
    const { alt = 0.7, w = 1.4, color = INK, offset = 0 } = opts;
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = rad(offset + (i * 360) / n);
      const R = i % 2 ? r1 + (r2_ - r1) * alt : r2_;
      d += `M${r2(cx + Math.cos(a) * r1)} ${r2(cy + Math.sin(a) * r1)}L${r2(cx + Math.cos(a) * R)} ${r2(cy + Math.sin(a) * R)}`;
    }
    return `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  }

  function wavyRays(cx, cy, r1, r2_, n, offset = 0) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = rad(offset + (i * 360) / n);
      const ca = Math.cos(a), sa = Math.sin(a);
      const steps = 12;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const along = r1 + (r2_ - r1) * t;
        const side = Math.sin(t * Math.PI * 3) * 3.2 * (1 - t * 0.4);
        const x = cx + ca * along - sa * side;
        const y = cy + sa * along + ca * side;
        d += `${s ? 'L' : 'M'}${r2(x)} ${r2(y)}`;
      }
    }
    return `<path d="${d}" ${ink(1.3)}/>`;
  }

  // A crescent with its horns at top and bottom, bulging left; rotate to orient it.
  function crescent(cx, cy, r, k, rot = 0, fill = GOLD_L, sw = 1.4) {
    const rr = (r * r + k * k) / (2 * k);
    const d = `M${cx} ${cy - r}A${r} ${r} 0 0 0 ${cx} ${cy + r}A${r2(rr)} ${r2(rr)} 0 0 1 ${cx} ${cy - r}Z`;
    return `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" transform="rotate(${rot} ${cx} ${cy})"/>`;
  }

  function pentagram(cx, cy, r, inverted = false, stroke = INK, w = 1.6) {
    const base = inverted ? 90 : -90;
    const v = [0, 2, 4, 1, 3].map((i) => {
      const a = rad(base + i * 72);
      return `${r2(cx + Math.cos(a) * r)},${r2(cy + Math.sin(a) * r)}`;
    });
    return `<polygon points="${v.join(' ')}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>`;
  }

  const heart = (cx, cy, s, fill = GOLD_L) =>
    `<path d="M${cx} ${cy + s * 0.9}C${cx - s * 1.6} ${cy - s * 0.2} ${cx - s * 0.6} ${cy - s * 1.3} ${cx} ${cy - s * 0.45}C${cx + s * 0.6} ${cy - s * 1.3} ${cx + s * 1.6} ${cy - s * 0.2} ${cx} ${cy + s * 0.9}Z" fill="${fill}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;

  const drop = (x, y, s = 1) =>
    `<path d="M${x} ${y - 6 * s}Q${x + 5 * s} ${y + 1 * s} ${x} ${y + 5 * s}Q${x - 5 * s} ${y + 1 * s} ${x} ${y - 6 * s}Z" fill="${GOLD_L}" stroke="${INK}" stroke-width="1"/>`;

  function figure(cx, by, armsUp = false, fill = PAPER) {
    const arms = armsUp
      ? `<path d="M${cx - 11} ${by - 58}L${cx - 26} ${by - 92}M${cx + 11} ${by - 58}L${cx + 26} ${by - 92}" ${ink(3)}/>`
      : '';
    return `${arms}<path d="M${cx - 13} ${by - 62}Q${cx} ${by - 69} ${cx + 13} ${by - 62}L${cx + 21} ${by}L${cx - 21} ${by}Z" fill="${fill}" ${ink(1.8).replace('fill="none" ', '')}/>` +
      `<circle cx="${cx}" cy="${by - 79}" r="11" fill="${PAPER}" ${ink(1.8).replace('fill="none" ', '')}/>`;
  }

  function flower(cx, cy, r, petals = 5, fill = PAPER, center = GOLD_L) {
    let s = '';
    for (let i = 0; i < petals; i++) {
      const a = rad(-90 + (i * 360) / petals);
      s += `<circle cx="${r2(cx + Math.cos(a) * r)}" cy="${r2(cy + Math.sin(a) * r)}" r="${r2(r * 0.95)}" fill="${fill}" stroke="${INK}" stroke-width="1.2"/>`;
    }
    return s + `<circle cx="${cx}" cy="${cy}" r="${r2(r * 0.6)}" fill="${center}" stroke="${INK}" stroke-width="1.2"/>`;
  }

  function wheat(x, by, h) {
    let s = `<path d="M${x} ${by}Q${x + 4} ${by - h * 0.5} ${x} ${by - h}" ${ink(1.6)}/>`;
    for (let i = 0; i < 5; i++) {
      const y = by - h + 6 + i * 9;
      s += `<ellipse cx="${x - 5}" cy="${y}" rx="5" ry="2.6" transform="rotate(-35 ${x - 5} ${y})" fill="${GOLD_L}" stroke="${INK}" stroke-width="1"/>`;
      s += `<ellipse cx="${x + 5}" cy="${y + 4}" rx="5" ry="2.6" transform="rotate(35 ${x + 5} ${y + 4})" fill="${GOLD_L}" stroke="${INK}" stroke-width="1"/>`;
    }
    return s;
  }

  function wing(cx, cy, dir, scale = 1, fill = GOLD_L, op = 0.55) {
    const d = 'M0 0C-20 -22 -56 -30 -84 -12C-62 -10 -48 -4 -40 4C-58 4 -70 12 -76 24C-52 14 -30 14 -14 14C-24 22 -30 30 -32 40C-18 28 -8 18 0 10Z';
    return `<g transform="translate(${cx} ${cy}) scale(${dir * scale} ${scale})"><path d="${d}" fill="${fill}" fill-opacity="${op}" ${ink(1.4 / scale).replace('fill="none" ', '')}/>` +
      `<path d="M-14 -4C-30 -12 -50 -14 -66 -10M-12 8C-26 6 -42 8 -58 16" ${ink(1 / scale)} opacity=".6"/></g>`;
  }

  function tower(x, y, w, h, fill = INK, op = 0.85) {
    const m = w / 5;
    let d = `M${x} ${y + h}L${x} ${y}`;
    for (let i = 0; i < 5; i++) d += `L${x + i * m} ${y - (i % 2 ? 0 : 7)}L${x + (i + 1) * m} ${y - (i % 2 ? 0 : 7)}`;
    d += `L${x + w} ${y}L${x + w} ${y + h}Z`;
    return `<path d="${d}" fill="${fill}" fill-opacity="${op}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<rect x="${x + w / 2 - 3}" y="${y + 12}" width="6" height="10" rx="3" fill="${GOLD_L}"/>`;
  }

  function waves(y, x0 = 46, x1 = 254, amp = 4, step = 18, w = 1.3, op = 0.7) {
    let d = `M${x0} ${y}`;
    for (let x = x0, i = 0; x < x1; x += step, i++) {
      d += `Q${x + step / 2} ${y + (i % 2 ? amp : -amp)} ${Math.min(x + step, x1)} ${y}`;
    }
    return `<path d="${d}" ${ink(w)} opacity="${op}"/>`;
  }

  /* ---------- suit symbols, drawn around the origin ---------- */

  const SYMBOL = {
    wands: () =>
      `<rect x="-4.5" y="-52" width="9" height="104" rx="4.5" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.8"/>` +
      `<path d="M-2 -40L2 -36M-1 -8L2 -5M-2 22L1 25" ${ink(1)} opacity=".6"/>` +
      `<ellipse cx="-10" cy="-30" rx="7" ry="3.2" transform="rotate(-35 -10 -30)" fill="${INK}" fill-opacity=".8"/>` +
      `<ellipse cx="10" cy="-12" rx="7" ry="3.2" transform="rotate(35 10 -12)" fill="${INK}" fill-opacity=".8"/>` +
      `<ellipse cx="-10" cy="10" rx="7" ry="3.2" transform="rotate(-35 -10 10)" fill="${INK}" fill-opacity=".8"/>` +
      `<ellipse cx="10" cy="30" rx="6" ry="3" transform="rotate(35 10 30)" fill="${INK}" fill-opacity=".8"/>`,
    cups: () =>
      `<path d="M-23 -40L23 -40Q24 -2 0 6Q-24 -2 -23 -40Z" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<ellipse cx="0" cy="-40" rx="23" ry="5.5" fill="${PAPER}" stroke="${INK}" stroke-width="1.6"/>` +
      `<path d="M-14 -26Q0 -20 14 -26" ${ink(1)} opacity=".55"/>` +
      `<rect x="-3.2" y="5" width="6.4" height="26" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.5"/>` +
      `<circle cx="0" cy="17" r="5.2" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.5"/>` +
      `<path d="M-19 41L19 41L11 30L-11 30Z" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
    swords: () =>
      `<path d="M0 -56L5.5 -46L5.5 24L-5.5 24L-5.5 -46Z" fill="${PAPER}" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/>` +
      `<path d="M0 -44L0 20" ${ink(1)} opacity=".5"/>` +
      `<rect x="-21" y="24" width="42" height="6.5" rx="3.2" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.6"/>` +
      `<rect x="-3.6" y="30.5" width="7.2" height="19" fill="${INK}"/>` +
      `<circle cx="0" cy="53.5" r="5" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.5"/>`,
    pentacles: () =>
      `<circle r="28" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.8"/>` +
      `<circle r="23" fill="none" stroke="${INK}" stroke-width="1.1"/>` +
      pentagram(0, 0, 21.5, false, INK, 1.6),
  };
  const place = (suit, x, y, s = 1, rot = 0) =>
    `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(rot)}) scale(${s})">${SYMBOL[suit]()}</g>`;

  /* ---------- Major Arcana emblems ---------- */

  const MAJOR = [
    // 0 The Fool
    () => rays(212, 130, 24, 36, 16) + `<circle cx="212" cy="130" r="18" fill="${GOLD_L}" ${ink(1.6).replace('fill="none" ', '')}/>` +
      `<path d="M44 300L78 268L102 288L140 248L176 290L204 270L256 302" ${ink(1.4)} opacity=".45"/>` +
      `<path d="M44 418L44 352Q118 340 176 352L194 384L182 418Z" fill="${INK}" fill-opacity=".14" ${ink(1.6).replace('fill="none" ', '')}/>` +
      `<path d="M208 392L208 414M222 380L222 410M236 396L236 416" ${ink(1)} opacity=".4"/>` +
      `<path d="M92 334L178 216" ${ink(4)}/>` +
      `<circle cx="183" cy="209" r="15" fill="${GOLD_L}" ${ink(1.6).replace('fill="none" ', '')}/>` +
      `<path d="M176 202L190 216M190 202L176 216" ${ink(1.2)}/>` +
      flower(112, 320, 6),
    // I The Magician
    () => `<path d="M150 132C168 108 200 108 200 132C200 156 168 156 150 132C132 108 100 108 100 132C100 156 132 156 150 132Z" fill="none" stroke="${GOLD}" stroke-width="4"/>` +
      `<path d="M150 132C168 108 200 108 200 132C200 156 168 156 150 132C132 108 100 108 100 132C100 156 132 156 150 132Z" ${ink(1)}/>` +
      rays(150, 180, 10, 22, 12, { w: 1.1 }) +
      `<path d="M150 180L150 296" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M150 182L150 294" stroke="${PAPER}" stroke-width="4" stroke-linecap="round"/>` +
      `<rect x="66" y="330" width="168" height="13" rx="2" fill="${INK}" fill-opacity=".85"/>` +
      `<rect x="76" y="343" width="148" height="56" fill="${INK}" fill-opacity=".1" stroke="${INK}" stroke-width="1.2"/>` +
      place('cups', 88, 314, 0.3) + place('wands', 116, 314, 0.3, -20) +
      place('swords', 184, 312, 0.3, 20) + place('pentacles', 212, 318, 0.42) +
      [70, 98, 126, 174, 202, 230].map((x) => flower(x, 408, 4)).join(''),
    // II The High Priestess
    () => `<rect x="58" y="150" width="34" height="240" fill="${INK}"/>` +
      `<rect x="208" y="150" width="34" height="240" fill="${PAPER}" ${ink(2).replace('fill="none" ', '')}/>` +
      `<rect x="52" y="140" width="46" height="12" rx="2" fill="${GOLD_L}" ${ink(1.4).replace('fill="none" ', '')}/>` +
      `<rect x="202" y="140" width="46" height="12" rx="2" fill="${GOLD_L}" ${ink(1.4).replace('fill="none" ', '')}/>` +
      `<rect x="52" y="388" width="46" height="12" rx="2" fill="${GOLD_L}" ${ink(1.4).replace('fill="none" ', '')}/>` +
      `<rect x="202" y="388" width="46" height="12" rx="2" fill="${GOLD_L}" ${ink(1.4).replace('fill="none" ', '')}/>` +
      `<text x="75" y="212" text-anchor="middle" font-family="${FONT}" font-size="24" font-weight="600" fill="${PAPER}">B</text>` +
      `<text x="225" y="212" text-anchor="middle" font-family="${FONT}" font-size="24" font-weight="600" fill="${INK}">J</text>` +
      `<path d="M92 172Q150 204 208 172" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-dasharray="3 4"/>` +
      [[112, 190], [131, 198], [150, 201], [169, 198], [188, 190], [121, 214], [140, 220], [160, 220], [179, 214]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="${GOLD_L}" stroke="${INK}" stroke-width="1"/>`).join('') +
      crescent(122, 116, 13, 6, 0) + `<circle cx="150" cy="116" r="14" fill="${GOLD_L}" ${ink(1.4).replace('fill="none" ', '')}/>` +
      crescent(178, 116, 13, 6, 180) +
      `<path d="M150 252L150 284M134 268L166 268" ${ink(3)}/>` +
      `<rect x="126" y="300" width="48" height="30" rx="4" fill="${PAPER}" ${ink(1.4).replace('fill="none" ', '')}/>` +
      `<text x="150" y="320" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="600" letter-spacing="1.5" fill="${INK}">TORA</text>` +
      crescent(150, 366, 22, 9, -90),
    // III The Empress
    () => Array.from({ length: 9 }, (_, i) => {
      const a = rad(200 + i * 17.5);
      return star(150 + Math.cos(a) * 92, 222 + Math.sin(a) * 92, 7.5, 3.2, 5, GOLD_L, 1);
    }).join('') +
      `<circle cx="150" cy="222" r="42" fill="${PAPER}" stroke="${GOLD}" stroke-width="6"/><circle cx="150" cy="222" r="42" ${ink(1.2)}/>` +
      `<circle cx="150" cy="222" r="36" ${ink(1)}/>` +
      heart(150, 224, 13) +
      `<path d="M150 264L150 348M124 306L176 306" stroke="${GOLD}" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M150 264L150 348M124 306L176 306" ${ink(1.2)}/>` +
      wheat(74, 412, 92) + wheat(92, 412, 74) + wheat(208, 412, 74) + wheat(226, 412, 92),
    // IV The Emperor
    () => `<path d="M44 418L44 396L80 360L104 382L130 356L150 374L172 352L198 380L222 358L256 394L256 418Z" fill="${INK}" fill-opacity=".1" ${ink(1.2).replace('fill="none" ', '')}/>` +
      `<path d="M86 396L86 200L104 174L196 174L214 200L214 396Z" fill="${INK}" fill-opacity=".1" ${ink(1.8).replace('fill="none" ', '')}/>` +
      `<path d="M100 186m-12 0a12 12 0 1 1 12 12a7 7 0 1 1 -7 -7" fill="none" stroke="${GOLD}" stroke-width="3.2" stroke-linecap="round"/>` +
      `<path d="M200 186m12 0a12 12 0 1 0 -12 12a7 7 0 1 0 7 -7" fill="none" stroke="${GOLD}" stroke-width="3.2" stroke-linecap="round"/>` +
      `<circle cx="150" cy="132" r="15" fill="${GOLD_L}" ${ink(1.6).replace('fill="none" ', '')}/><path d="M150 117L150 104M144 109L156 109M136 132L164 132" ${ink(1.6)}/>` +
      `<ellipse cx="150" cy="232" rx="14" ry="19" fill="none" stroke="${GOLD}" stroke-width="5.5"/>` +
      `<path d="M126 258L174 258M150 252L150 350" stroke="${GOLD}" stroke-width="6" stroke-linecap="round"/>` +
      `<ellipse cx="150" cy="232" rx="14" ry="19" ${ink(1)}/>` +
      `<rect x="96" y="352" width="108" height="14" rx="2" fill="${INK}" fill-opacity=".8"/>`,
    // V The Hierophant
    () => `<rect x="62" y="140" width="22" height="262" fill="${INK}" fill-opacity=".14" ${ink(1.2).replace('fill="none" ', '')}/>` +
      `<rect x="216" y="140" width="22" height="262" fill="${INK}" fill-opacity=".14" ${ink(1.2).replace('fill="none" ', '')}/>` +
      `<path d="M150 108L150 318M132 136L168 136M122 160L178 160M112 184L188 184" stroke="${GOLD}" stroke-width="6.5" stroke-linecap="round"/>` +
      `<path d="M150 108L150 318M132 136L168 136M122 160L178 160M112 184L188 184" ${ink(1.1)}/>` +
      rays(150, 108, 10, 20, 10, { w: 1 }) +
      [-38, 38].map((a, i) => `<g transform="translate(150 362) rotate(${a})">` +
        `<circle cx="0" cy="-36" r="10" fill="${i ? GOLD_L : PAPER}" ${ink(1.6).replace('fill="none" ', '')}/>` +
        `<circle cx="0" cy="-36" r="4" fill="${PAPER}" ${ink(1).replace('fill="none" ', '')}/>` +
        `<path d="M0 -26L0 36M0 26L11 26L11 31M0 34L8 34" stroke="${i ? GOLD : INK}" stroke-width="4" stroke-linecap="round" fill="none"/></g>`).join(''),
    // VI The Lovers
    () => rays(150, 116, 26, 40, 20) + `<circle cx="150" cy="116" r="20" fill="${GOLD_L}" ${ink(1.6).replace('fill="none" ', '')}/>` +
      wing(150, 186, 1, 1.15) + wing(150, 186, -1, 1.15) +
      `<path d="M150 246L174 300L126 300Z" fill="${INK}" fill-opacity=".1" ${ink(1.2).replace('fill="none" ', '')}/>` +
      heart(150, 282, 13) +
      figure(100, 398) + figure(200, 398) +
      `<path d="M66 398L66 336M66 344L54 330M66 352L80 338M66 362L56 350" ${ink(1.6)}/>` +
      `<path d="M234 398L234 336" ${ink(1.6)}/>` + flower(234, 330, 5, 5, GOLD_L, PAPER),
    // VII The Chariot
    () => star(150, 120, 14, 6, 8) +
      `<rect x="76" y="146" width="148" height="16" rx="3" fill="${INK}"/>` +
      [92, 112, 132, 150, 168, 188, 208].map((x) => `<circle cx="${x}" cy="154" r="2.2" fill="${GOLD_L}"/>`).join('') +
      `<path d="M86 162L86 240M214 162L214 240" ${ink(2.4)}/>` +
      `<rect x="84" y="238" width="132" height="72" rx="3" fill="${PAPER}" ${ink(1.8).replace('fill="none" ', '')}/>` +
      wing(150, 270, 1, 0.5) + wing(150, 270, -1, 0.5) +
      `<circle cx="150" cy="270" r="9" fill="${GOLD_L}" ${ink(1.4).replace('fill="none" ', '')}/>` +
      [100, 200].map((x) => `<circle cx="${x}" cy="322" r="19" fill="${PAPER}" ${ink(1.8).replace('fill="none" ', '')}/>` +
        rays(x, 322, 4, 17, 8, { alt: 1, w: 1.2 }) + `<circle cx="${x}" cy="322" r="4" fill="${GOLD_L}" stroke="${INK}"/>`).join('') +
      `<path d="M78 392L78 378Q82 360 100 360Q114 360 114 372L132 376L134 392Z" fill="${INK}" ${ink(1.4).replace('fill="none" ', '')}/>` +
      `<path d="M222 392L222 378Q218 360 200 360Q186 360 186 372L168 376L166 392Z" fill="${PAPER}" ${ink(1.4).replace('fill="none" ', '')}/>`,
    // VIII Strength
    () => `<path d="M150 130C166 108 196 108 196 130C196 152 166 152 150 130C134 108 104 108 104 130C104 152 134 152 150 130Z" fill="none" stroke="${GOLD}" stroke-width="4"/>` +
      Array.from({ length: 18 }, (_, i) => {
        const a = i * 20;
        const x = 150 + Math.cos(rad(a)) * 50, y = 262 + Math.sin(rad(a)) * 50;
        return `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="17" ry="8" transform="rotate(${a} ${r2(x)} ${r2(y)})" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.1"/>`;
      }).join('') +
      `<circle cx="123" cy="232" r="9" fill="${PAPER}" ${ink(1.4).replace('fill="none" ', '')}/><circle cx="177" cy="232" r="9" fill="${PAPER}" ${ink(1.4).replace('fill="none" ', '')}/>` +
      `<circle cx="150" cy="264" r="37" fill="${PAPER}" ${ink(1.8).replace('fill="none" ', '')}/>` +
      `<path d="M133 256Q139 250 145 256M155 256Q161 250 167 256" ${ink(1.8)}/>` +
      `<path d="M143 274L157 274L150 283Z" fill="${INK}"/>` +
      `<path d="M150 283Q150 292 139 294M150 283Q150 292 161 294" ${ink(1.5)}/>` +
      Array.from({ length: 9 }, (_, i) => flower(86 + i * 16, 346 + Math.sin((i / 8) * Math.PI) * 14, 4)).join('') +
      `<path d="M60 402Q150 380 240 402" ${ink(1.2)} opacity=".5"/>`,
    // IX The Hermit
    () => `<path d="M44 418L44 384L80 352L104 372L148 330L184 366L212 346L256 382L256 418Z" fill="${INK}" fill-opacity=".1" ${ink(1.4).replace('fill="none" ', '')}/>` +
      `<path d="M136 345L148 330L160 342" ${ink(1.4)}/>` +
      `<circle cx="120" cy="230" r="54" fill="${GOLD_L}" fill-opacity=".3"/>` +
      rays(120, 230, 40, 54, 16, { w: 1, color: GOLD }) +
      `<path d="M194 140L194 412" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M194 176L120 176L120 190" ${ink(2)}/>` +
      `<path d="M112 200L120 188L128 200" ${ink(1.6)}/>` +
      `<path d="M108 200L132 200L138 213L138 248L132 260L108 260L102 248L102 213Z" fill="${PAPER}" ${ink(1.8).replace('fill="none" ', '')}/>` +
      `<polygon points="${starPts(120, 230, 13, 13, 3, -90).split(' ').filter((_, i) => i % 2 === 0).join(' ')}" fill="${GOLD_L}" stroke="${INK}" stroke-width="1"/>` +
      `<polygon points="${starPts(120, 230, 13, 13, 3, 90).split(' ').filter((_, i) => i % 2 === 0).join(' ')}" fill="${GOLD_L}" stroke="${INK}" stroke-width="1"/>`,
    // X Wheel of Fortune
    () => `<circle cx="150" cy="250" r="84" fill="none" stroke="${GOLD_L}" stroke-width="10"/>` +
      `<circle cx="150" cy="250" r="90" ${ink(1.6)}/><circle cx="150" cy="250" r="78" ${ink(1.2)}/>` +
      `<circle cx="150" cy="250" r="56" fill="${PAPER}" ${ink(1.6).replace('fill="none" ', '')}/>` +
      rays(150, 250, 20, 56, 8, { alt: 1, w: 1.6 }) +
      `<circle cx="150" cy="250" r="20" fill="${GOLD_L}" ${ink(1.6).replace('fill="none" ', '')}/>` +
      star(150, 250, 10, 4, 4, PAPER, 1) +
      [['T', -90], ['A', 0], ['R', 90], ['O', 180]].map(([l, a]) => {
        const x = 150 + Math.cos(rad(a)) * 67, y = 250 + Math.sin(rad(a)) * 67;
        return `<text x="${r2(x)}" y="${r2(y + 6)}" text-anchor="middle" font-family="${FONT}" font-size="17" font-weight="600" fill="${INK}">${l}</text>`;
      }).join('') +
      [45, 135, 225, 315].map((a) => `<circle cx="${r2(150 + Math.cos(rad(a)) * 67)}" cy="${r2(250 + Math.sin(rad(a)) * 67)}" r="3.4" fill="${INK}"/>` +
        `<circle cx="${r2(150 + Math.cos(rad(a)) * 38)}" cy="${r2(250 + Math.sin(rad(a)) * 38)}" r="3" fill="${GOLD_L}" stroke="${INK}"/>`).join('') +
      [[70, 122], [230, 122], [70, 392], [230, 392]].map(([x, y]) => star(x, y, 9, 3.6, 4)).join(''),
    // XI Justice
    () => `<path d="M58 418L58 404L242 404L242 418M74 404L74 392L226 392L226 404" fill="${INK}" fill-opacity=".1" ${ink(1.4).replace('fill="none" ', '')}/>` +
      `<path d="M80 194L220 194" ${ink(3)}/>` +
      [80, 220].map((x) => `<path d="M${x} 194L${x - 18} 262M${x} 194L${x + 18} 262" ${ink(1.2)}/>` +
        `<path d="M${x - 24} 262Q${x} 284 ${x + 24} 262Z" fill="${GOLD_L}" ${ink(1.6).replace('fill="none" ', '')}/>` +
        `<circle cx="${x}" cy="194" r="3.5" fill="${INK}"/>`).join('') +
      place('swords', 150, 250, 1.75) +
      `<circle cx="150" cy="194" r="6" fill="${GOLD_L}" ${ink(1.4).replace('fill="none" ', '')}/>`,
    // XII The Hanged Man
    () => `<rect x="66" y="110" width="168" height="13" rx="3" fill="${INK}" fill-opacity=".85"/>` +
      `<path d="M78 123L78 410M222 123L222 410" stroke="${INK}" stroke-opacity=".85" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M80 136L72 128M80 220L90 210M220 170L230 160M220 280L210 270" ${ink(1.6)} opacity=".7"/>` +
      `<path d="M150 123L150 150" ${ink(1.6)}/>` +
      `<path d="M150 150L150 236" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="M150 232L122 206L147 186" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M136 232L164 232L170 300L130 300Z" fill="${GOLD_L}" ${ink(1.6).replace('fill="none" ', '')}/>` +
      `<path d="M134 296L118 270L150 254L182 270L166 296" ${ink(2)}/>` +
      `<circle cx="150" cy="322" r="28" fill="${GOLD_L}" fill-opacity=".55"/>` +
      rays(150, 322, 30, 44, 16, { color: GOLD, w: 1.4 }) +
      `<circle cx="150" cy="320" r="15" fill="${PAPER}" ${ink(1.8).replace('fill="none" ', '')}/>`,
    // XIII Death
    () => `<path d="M104 112L104 340" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>` +
      `<circle cx="104" cy="108" r="4" fill="${GOLD_L}" stroke="${INK}"/>` +
      `<path d="M106 122L216 128L204 178L216 228L106 222Z" fill="${INK}"/>` +
      flower(158, 175, 10, 5, PAPER, GOLD_L) +
      `<path d="M44 360L256 360" ${ink(1.6)}/>` +
      rays(150, 360, 34, 50, 14, { color: GOLD, w: 1.4, offset: 180 }).replace('<path', '<path clip-path="none"') +
      `<path d="M120 360A30 30 0 0 1 180 360Z" fill="${GOLD_L}" ${ink(1.6).replace('fill="none" ', '')}/>` +
      `<rect x="44" y="360" width="212" height="58" fill="${TINT.major}"/>` +
      tower(78, 312, 22, 48) + tower(200, 312, 22, 48) +
      waves(378) + waves(394, 46, 254, 3.5) + waves(410, 46, 254, 3),
    // XIV Temperance
    () => wing(150, 216, 1, 1.55, GOLD_L, 0.4) + wing(150, 216, -1, 1.55, GOLD_L, 0.4) +
      `<rect x="132" y="118" width="36" height="36" fill="${PAPER}" ${ink(1.6).replace('fill="none" ', '')}/>` +
      `<polygon points="150,124 164,148 136,148" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.3"/>` +
      `<path d="M124 196C150 214 172 236 186 268" fill="none" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M124 196C150 214 172 236 186 268" ${ink(1)} stroke-dasharray="2 5"/>` +
      place('cups', 108, 210, 0.62, 28) + place('cups', 192, 300, 0.62, -6) +
      `<path d="M44 418L44 384Q80 374 116 384L116 418Z" fill="${INK}" fill-opacity=".12"/>` +
      waves(392, 46, 140, 3, 16) + waves(406, 46, 140, 3, 16) +
      `<path d="M150 418Q190 380 214 374Q236 370 256 360" ${ink(1.4)} stroke-dasharray="3 4"/>` +
      `<circle cx="226" cy="352" r="10" fill="${GOLD_L}" ${ink(1.2).replace('fill="none" ', '')}/>` +
      rays(226, 352, 13, 20, 12, { w: 1, color: GOLD }),
    // XV The Devil
    () => `<path d="M150 214L64 150L74 178L50 184L70 206L54 218L82 230L150 244Z" fill="${INK}" fill-opacity=".85" ${ink(1.2).replace('fill="none" ', '')}/>` +
      `<path d="M150 214L236 150L226 178L250 184L230 206L246 218L218 230L150 244Z" fill="${INK}" fill-opacity=".85" ${ink(1.2).replace('fill="none" ', '')}/>` +
      `<path d="M126 162Q102 136 112 104M174 162Q198 136 188 104" stroke="${INK}" stroke-width="6" stroke-linecap="round" fill="none"/>` +
      `<circle cx="150" cy="170" r="30" fill="${PAPER}" ${ink(1.6).replace('fill="none" ', '')}/>` +
      pentagram(150, 170, 26, true, GOLD, 2.4) +
      `<rect x="116" y="270" width="68" height="48" rx="2" fill="${INK}" fill-opacity=".9"/>` +
      `<path d="M116 270L184 270" stroke="${GOLD_L}" stroke-width="2"/>` +
      [[1, 116, 300, 92, 312, 88, 342], [-1, 184, 300, 208, 312, 212, 342]].map(([, x0, y0, cx, cy, x1, y1]) => {
        let s = '';
        for (let i = 0; i <= 7; i++) {
          const t = i / 7;
          const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
          const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
          s += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="${i % 2 ? 2.4 : 4.4}" ry="${i % 2 ? 4.4 : 2.4}" fill="none" stroke="${GOLD}" stroke-width="1.8"/>`;
        }
        return s;
      }).join('') +
      figure(88, 414, false, PAPER) + figure(212, 414, false, PAPER) +
      `<path d="M80 330L76 322M96 330L100 322M204 330L200 322M220 330L224 322" ${ink(1.6)}/>`,
    // XVI The Tower
    () => `<path d="M64 418L104 336L196 336L236 418Z" fill="${INK}" fill-opacity=".18" ${ink(1.6).replace('fill="none" ', '')}/>` +
      `<path d="M120 336L120 186L180 186L180 336Z" fill="${PAPER}" ${ink(1.8).replace('fill="none" ', '')}/>` +
      `<path d="M116 186L116 174L126 174L126 180L136 180L136 174L146 174L146 180L156 180L156 174L166 174L166 180L174 180L174 174L184 174L184 186Z" fill="${PAPER}" ${ink(1.6).replace('fill="none" ', '')}/>` +
      [[140, 210], [150, 262], [134, 296], [164, 300]].map(([x, y]) => `<rect x="${x - 5}" y="${y}" width="10" height="16" rx="5" fill="${INK}"/>`).join('') +
      `<path d="M132 212Q128 196 138 188Q136 200 146 204Q150 214 140 220Z" fill="${GOLD_L}" stroke="${INK}"/>` +
      `<path d="M170 262Q166 244 178 236Q176 250 186 254Q188 266 176 270Z" fill="${GOLD_L}" stroke="${INK}"/>` +
      `<g transform="translate(196 146) rotate(30)"><path d="M-18 8L-18 -6L-9 2L0 -10L9 2L18 -6L18 8Z" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/></g>` +
      `<polygon points="236,86 198,140 214,144 168,206 188,150 172,146 206,90" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>` +
      [[88, 172], [104, 230], [78, 286], [218, 220], [232, 286], [206, 316], [96, 330]].map(([x, y]) => drop(x, y, 1.1)).join(''),
    // XVII The Star
    () => star(150, 150, 46, 15, 8) + star(150, 150, 30, 10, 8, PAPER, 1, -67.5) + star(150, 150, 14, 5, 8) +
      [[80, 120], [220, 120], [72, 188], [228, 188], [98, 240], [202, 240], [150, 236]].map(([x, y]) => star(x, y, 10, 3.6, 8, GOLD_L, 1)).join('') +
      `<path d="M44 418L44 372L256 372L256 418Z" fill="#c8d6dc" fill-opacity=".6"/>` +
      waves(380) + waves(396, 46, 254, 3.5) + waves(410, 46, 254, 3) +
      `<path d="M190 372Q206 340 256 338L256 372Z" fill="${INK}" fill-opacity=".15" ${ink(1.2).replace('fill="none" ', '')}/>` +
      `<g transform="translate(118 306) rotate(-48)"><path d="M-12 -14Q-16 6 -8 16L8 16Q16 6 12 -14Z" fill="${GOLD_L}" ${ink(1.6).replace('fill="none" ', '')}/><path d="M-6 -14L-7 -22L7 -22L6 -14" fill="${GOLD_L}" ${ink(1.4).replace('fill="none" ', '')}/></g>` +
      `<g transform="translate(196 304) rotate(48)"><path d="M-12 -14Q-16 6 -8 16L8 16Q16 6 12 -14Z" fill="${GOLD_L}" ${ink(1.6).replace('fill="none" ', '')}/><path d="M-6 -14L-7 -22L7 -22L6 -14" fill="${GOLD_L}" ${ink(1.4).replace('fill="none" ', '')}/></g>` +
      `<path d="M101 294Q86 320 92 372" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M213 292Q226 312 222 340" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`,
    // XVIII The Moon
    () => wavyRays(150, 148, 42, 62, 16) +
      `<circle cx="150" cy="148" r="38" fill="${GOLD_L}" ${ink(1.8).replace('fill="none" ', '')}/>` +
      crescent(150, 148, 38, 15, 180, INK, 0).replace(`fill="${INK}"`, `fill="${INK}" fill-opacity=".22"`) +
      `<path d="M140 138Q146 134 152 138M140 160Q148 166 156 160" ${ink(1.6)}/>` +
      [[118, 206], [136, 214], [156, 212], [176, 204]].map(([x, y]) => drop(x, y)).join('') +
      tower(58, 262, 28, 86) + tower(214, 262, 28, 86) +
      `<path d="M44 360Q96 330 150 346Q204 330 256 360" ${ink(1.4)} opacity=".6"/>` +
      `<path d="M150 384C126 366 172 350 150 330C132 314 166 300 150 282" ${ink(1.6)} stroke-dasharray="4 4"/>` +
      `<ellipse cx="150" cy="404" rx="78" ry="16" fill="#c8d6dc" fill-opacity=".7" ${ink(1.2).replace('fill="none" ', '')}/>` +
      `<path d="M140 400Q150 390 160 400M144 406L136 412M156 406L164 412" ${ink(1.6)}/>`,
    // XIX The Sun
    () => rays(150, 186, 56, 92, 24, { alt: 0, w: 1.8, offset: 7.5 }) + wavyRays(150, 186, 56, 88, 12, 0) +
      `<circle cx="150" cy="186" r="50" fill="${GOLD_L}" ${ink(2).replace('fill="none" ', '')}/>` +
      `<path d="M128 178Q134 172 140 178M160 178Q166 172 172 178" ${ink(2)}/>` +
      `<path d="M134 202Q150 214 166 202" ${ink(2)}/>` +
      `<circle cx="128" cy="196" r="4" fill="#d48b5a" fill-opacity=".45"/><circle cx="172" cy="196" r="4" fill="#d48b5a" fill-opacity=".45"/>` +
      [72, 114, 186, 228].map((x, i) => `<path d="M${x} 386L${x} ${352 - (i % 2) * 8}" ${ink(1.6)}/>` +
        `<ellipse cx="${x + 6}" cy="${368}" rx="6" ry="2.6" transform="rotate(-30 ${x + 6} 368)" fill="${INK}" fill-opacity=".7"/>` +
        flower(x, 344 - (i % 2) * 8, 7, 10, GOLD_L, INK)).join('') +
      `<rect x="44" y="386" width="212" height="32" fill="${PAPER}" ${ink(1.4).replace('fill="none" ', '')}/>` +
      `<path d="M44 402L256 402M76 386L76 402M120 386L120 402M164 386L164 402M208 386L208 402M98 402L98 418M142 402L142 418M186 402L186 418M230 402L230 418" ${ink(1)} opacity=".6"/>`,
    // XX Judgement
    () => `<path d="M70 168Q66 140 92 138Q102 116 128 124Q144 104 170 118Q194 108 206 128Q234 128 232 156Q230 170 214 170L84 170Q72 170 70 168Z" fill="${PAPER}" ${ink(1.6).replace('fill="none" ', '')}/>` +
      `<path d="M110 156L196 214" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M190 204L214 196L204 234Z" fill="${GOLD_L}" ${ink(1.5).replace('fill="none" ', '')}/>` +
      rays(210, 216, 26, 40, 12, { w: 1.1, color: GOLD }) +
      `<path d="M140 176L172 196L160 222L128 202Z" fill="${PAPER}" ${ink(1.4).replace('fill="none" ', '')}/>` +
      `<path d="M150 186L150 212M137 199L163 199" stroke="#b5483e" stroke-width="3" stroke-linecap="round" transform="rotate(33 150 199)"/>` +
      `<path d="M44 380L256 380" ${ink(1.2)} opacity=".6"/>` +
      waves(398, 46, 254, 3.5) + waves(412, 46, 254, 3) +
      [96, 150, 204].map((x) => `<rect x="${x - 24}" y="372" width="48" height="16" fill="${INK}" fill-opacity=".55"/>` + figure(x, 374, true)).join(''),
    // XXI The World
    () => Array.from({ length: 40 }, (_, i) => {
      const t = (i / 40) * Math.PI * 2;
      const x = 150 + Math.cos(t) * 72, y = 252 + Math.sin(t) * 118;
      const tang = (Math.atan2(118 * Math.cos(t), -72 * Math.sin(t)) * 180) / Math.PI;
      return `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="10" ry="4.2" transform="rotate(${r2(tang + (i % 2 ? 32 : -32))} ${r2(x)} ${r2(y)})" fill="${INK}" fill-opacity=".72"/>`;
    }).join('') +
      [134, 370].map((y) => `<path d="M150 ${y}C138 ${y - 12} 128 ${y - 2} 136 ${y + 4}C142 ${y + 8} 148 ${y + 2} 150 ${y}C152 ${y + 2} 158 ${y + 8} 164 ${y + 4}C172 ${y - 2} 162 ${y - 12} 150 ${y}Z" fill="#c4554a" ${ink(1.2).replace('fill="none" ', '')}/>`).join('') +
      `<circle cx="150" cy="252" r="34" fill="${GOLD_L}" fill-opacity=".35"/>` +
      star(150, 252, 30, 10, 8) + `<circle cx="150" cy="252" r="7" fill="${PAPER}" stroke="${INK}"/>` +
      [[70, 120], [230, 120], [70, 392], [230, 392]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${PAPER}" ${ink(1.4).replace('fill="none" ', '')}/>` + star(x, y, 8, 3.2, 4)).join(''),
  ];

  /* ---------- Minor Arcana ---------- */

  const GRID = {
    1: [[150, 250]],
    2: [[150, 168], [150, 334]],
    3: [[150, 146], [150, 250], [150, 354]],
    4: [[102, 170], [198, 170], [102, 330], [198, 330]],
    5: [[102, 160], [198, 160], [150, 250], [102, 340], [198, 340]],
    6: [[102, 150], [198, 150], [102, 250], [198, 250], [102, 350], [198, 350]],
    7: [[102, 146], [198, 146], [150, 196], [102, 250], [198, 250], [102, 354], [198, 354]],
    8: [[102, 146], [198, 146], [150, 196], [102, 250], [198, 250], [150, 304], [102, 354], [198, 354]],
    9: [[102, 134], [198, 134], [102, 213], [198, 213], [150, 252], [102, 292], [198, 292], [102, 371], [198, 371]],
    10: [[102, 134], [198, 134], [150, 172], [102, 213], [198, 213], [102, 292], [198, 292], [150, 332], [102, 371], [198, 371]],
  };

  function pips(suit, n) {
    if (suit === 'cups' || suit === 'pentacles') {
      const base = suit === 'cups' ? 0.88 : 1.25;
      const s = base * (n <= 3 ? 0.92 : n <= 6 ? 0.8 : 0.64);
      return GRID[n].map(([x, y]) => place(suit, x, y, s)).join('');
    }
    if (suit === 'wands') {
      const sp = Math.min(44, 172 / (n - 1));
      return Array.from({ length: n }, (_, i) => {
        const x = 150 - ((n - 1) * sp) / 2 + i * sp;
        const fan = ((i - (n - 1) / 2) / ((n - 1) / 2)) * (n <= 3 ? 12 : 8);
        return place('wands', x, 256 + Math.abs(fan) * 1.2, 1.55, fan);
      }).join('');
    }
    // swords
    if (n === 2) {
      return `<path d="M88 320Q150 290 212 320" ${ink(1.2)} opacity=".4"/>` +
        place('swords', 150, 240, 1.6, -36) + place('swords', 150, 240, 1.6, 36);
    }
    if (n === 3) {
      return wavyRays(150, 260, 52, 64, 10).replace(`stroke-width="1.3"`, `stroke-width="1" opacity=".5"`) +
        heart(150, 268, 40) +
        place('swords', 150, 250, 1.55, -32) + place('swords', 150, 250, 1.55, 0) + place('swords', 150, 250, 1.55, 32);
    }
    const step = Math.min(24, 124 / (n - 1));
    return Array.from({ length: n }, (_, i) => {
      const a = -((n - 1) * step) / 2 + i * step;
      return `<g transform="translate(150 404) rotate(${r2(a)}) translate(0 -152) scale(1.45 1.82)">${SYMBOL.swords()}</g>`;
    }).join('');
  }

  function ace(suit) {
    const s = { wands: 2.3, cups: 2.05, swords: 2.25, pentacles: 2.5 }[suit];
    return `<circle cx="150" cy="250" r="64" fill="${GOLD_L}" fill-opacity=".22"/>` +
      rays(150, 250, 74, 112, 32, { w: 1.2, color: GOLD, alt: 0.6 }) +
      place(suit, 150, 250, s) +
      [[90, 132], [210, 132], [90, 372], [210, 372]].map(([x, y]) => star(x, y, 7, 2.8, 4)).join('');
  }

  const INSIGNIA = [
    // Page: a small guiding star
    () => rays(150, 136, 14, 24, 12, { w: 1.1, color: GOLD }) + star(150, 136, 12, 5, 5),
    // Knight: plumed helm
    () => `<path d="M162 112Q186 98 194 116Q178 108 166 122" fill="${GOLD_L}" ${ink(1.3).replace('fill="none" ', '')}/>` +
      `<path d="M126 158L126 140Q126 112 150 112Q174 112 174 140L174 158Z" fill="${PAPER}" ${ink(1.8).replace('fill="none" ', '')}/>` +
      `<path d="M130 136L170 136M134 144L166 144M150 112L150 158" ${ink(1.3)}/>`,
    // Queen: rounded crown
    () => `<path d="M118 158L118 130L134 146L150 120L166 146L182 130L182 158Z" fill="${GOLD_L}" ${ink(1.8).replace('fill="none" ', '')}/>` +
      [[118, 127], [150, 116], [182, 127]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>`).join('') +
      `<path d="M118 150L182 150" ${ink(1.2)}/>` + `<circle cx="150" cy="140" r="3.6" fill="${INK}"/>`,
    // King: pointed crown with cross
    () => `<path d="M114 160L114 126L128 142L139 120L150 138L161 120L172 142L186 126L186 160Z" fill="${GOLD_L}" ${ink(1.8).replace('fill="none" ', '')}/>` +
      `<path d="M150 138L150 108M142 116L158 116" ${ink(2.2)}/>` +
      `<rect x="114" y="148" width="72" height="12" fill="${INK}" fill-opacity=".85"/>` +
      [126, 150, 174].map((x) => `<circle cx="${x}" cy="154" r="2.6" fill="${GOLD_L}"/>`).join(''),
  ];

  function court(suit, r) {
    const idx = r - 11;
    const s = { wands: 1.75, cups: 1.55, swords: 1.65, pentacles: 2.1 }[suit];
    const y = 282;
    let wings = '';
    if (idx === 1) wings = wing(130, 280, 1, 0.9) + wing(170, 280, -1, 0.9);
    let throne = '';
    if (idx >= 2) throne = `<path d="M84 392L84 222Q84 178 150 178Q216 178 216 222L216 392" fill="${INK}" fill-opacity=".07" ${ink(1.4).replace('fill="none" ', '')}/>`;
    return throne + `<circle cx="150" cy="${y}" r="58" fill="${GOLD_L}" fill-opacity=".18"/>` + wings +
      place(suit, 150, y, s) + INSIGNIA[idx]();
  }

  const GROUND = {
    wands: () => `<path d="M44 418L44 398Q80 380 116 396Q150 410 186 392Q222 376 256 396L256 418Z" fill="${GOLD_L}" fill-opacity=".38" ${ink(1.2).replace('fill="none" ', '')}/>`,
    cups: () => waves(394) + waves(406, 46, 254, 3.5) + waves(416, 46, 254, 2.5, 18, 1.1, 0.5),
    swords: () => `<path d="M44 418L44 404Q60 388 80 400Q100 384 122 398Q146 382 168 398Q190 384 212 400Q234 388 256 404L256 418Z" fill="${PAPER}" fill-opacity=".75" ${ink(1.2).replace('fill="none" ', '')} />` +
      `<path d="M84 118q5 -6 10 0q5 -6 10 0M196 108q5 -6 10 0q5 -6 10 0M214 128q4 -5 8 0q4 -5 8 0" ${ink(1.3)} opacity=".55"/>`,
    pentacles: () => `<path d="M44 418L44 396Q100 372 160 392Q210 408 256 386L256 418Z" fill="${INK}" fill-opacity=".12" ${ink(1.2).replace('fill="none" ', '')}/>` +
      `<path d="M60 408L96 398M110 412L150 402M180 408L220 398" ${ink(1)} opacity=".4"/>`,
  };

  function skyStars(seed) {
    const rand = rng(seed * 7919 + 13);
    let s = '';
    for (let i = 0; i < 14; i++) {
      const x = 54 + rand() * 192, y = 92 + rand() * 300;
      s += `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(0.8 + rand() * 1.1)}" fill="${GOLD}" opacity=".45"/>`;
    }
    return s;
  }

  /* ---------- the full face ---------- */

  const cache = new Map();

  function face(card) {
    if (cache.has(card.id)) return cache.get(card.id);
    const tint = TINT[card.arcana === 'major' ? 'major' : card.suit];
    const gid = `w${card.id}`;
    let emblem;
    if (card.arcana === 'major') emblem = skyStars(card.id) + MAJOR[card.number]();
    else if (card.rank === 1) emblem = GROUND[card.suit]() + ace(card.suit);
    else if (card.rank <= 10) emblem = GROUND[card.suit]() + pips(card.suit, card.rank);
    else emblem = GROUND[card.suit]() + court(card.suit, card.rank);

    const lw = card.label.length * 8 + 14;
    const name = card.name;
    const fs = name.length > 17 ? 17 : 19;
    const svg =
      `<svg viewBox="0 0 300 520" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">` +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAPER}"/><stop offset="1" stop-color="${tint}"/></linearGradient>` +
      `<clipPath id="${gid}c"><path d="M44 418L44 140A106 66 0 0 1 256 140L256 418Z"/></clipPath></defs>` +
      `<rect x="12" y="12" width="276" height="496" rx="10" fill="none" stroke="${GOLD}" stroke-width="2.4"/>` +
      `<rect x="19" y="19" width="262" height="482" rx="6" fill="none" stroke="${INK}" stroke-width="1"/>` +
      [[30, 30], [270, 30], [30, 490], [270, 490]].map(([x, y]) => star(x, y, 6, 2, 4, GOLD_L, 0.8)).join('') +
      `<text x="150" y="58" text-anchor="middle" font-family="${FONT}" font-size="20" font-weight="600" letter-spacing="3" fill="${INK}">${card.label}</text>` +
      `<path d="M${150 - lw - 30} 52L${150 - lw} 52M${150 + lw} 52L${150 + lw + 30} 52" stroke="${GOLD}" stroke-width="1.2"/>` +
      `<circle cx="${150 - lw - 34}" cy="52" r="1.8" fill="${GOLD}"/><circle cx="${150 + lw + 34}" cy="52" r="1.8" fill="${GOLD}"/>` +
      `<path d="M44 418L44 140A106 66 0 0 1 256 140L256 418Z" fill="url(#${gid})"/>` +
      `<g clip-path="url(#${gid}c)">${emblem}</g>` +
      `<path d="M44 418L44 140A106 66 0 0 1 256 140L256 418Z" fill="none" stroke="${INK}" stroke-width="1.6"/>` +
      `<path d="M38 424L38 138A112 72 0 0 1 262 138L262 424Z" fill="none" stroke="${GOLD}" stroke-width="1" opacity=".7"/>` +
      `<path d="M34 438L266 438L256 456L266 474L34 474L44 456Z" fill="${PAPER}" stroke="${GOLD}" stroke-width="1.6" stroke-linejoin="round"/>` +
      `<text x="150" y="${fs === 19 ? 462 : 461}" text-anchor="middle" font-family="${FONT}" font-size="${fs}" font-weight="600" letter-spacing=".6" fill="${INK}">${name}</text>` +
      star(150, 490, 5, 1.8, 4, GOLD_L, 0.8) +
      `</svg>`;
    cache.set(card.id, svg);
    return svg;
  }

  /* ---------- the card back: point-symmetric, so it never betrays a reversal ---------- */

  function back() {
    const NIGHT = '#0e1330';
    const rand = rng(1909);
    let stars = '';
    for (let i = 0; i < 46; i++) {
      const x = 24 + rand() * 252, y = 24 + rand() * 472;
      const r = r2(0.5 + rand() * 1.2), o = r2(0.35 + rand() * 0.55);
      const c = rand() > 0.7 ? '#fff6dc' : GOLD_L;
      stars += `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r}" fill="${c}" opacity="${o}"/>` +
        `<circle cx="${r2(300 - x)}" cy="${r2(520 - y)}" r="${r}" fill="${c}" opacity="${o}"/>`;
    }
    const corner = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})">` +
      `<path d="M0 30A30 30 0 0 0 30 0M0 40A40 40 0 0 0 40 0" fill="none" stroke="${GOLD_L}" stroke-width="1" opacity=".75"/>` +
      `<polygon points="${starPts(11, 11, 7, 2.4, 4)}" fill="${GOLD_L}"/></g>`;
    const ring = [];
    for (let i = 0; i < 32; i++) {
      const a = rad(i * 11.25);
      const R = i % 2 ? 72 : 80;
      ring.push(`M${r2(150 + Math.cos(a) * 58)} ${r2(260 + Math.sin(a) * 58)}L${r2(150 + Math.cos(a) * R)} ${r2(260 + Math.sin(a) * R)}`);
    }
    const g2 = (s) => s.replace(new RegExp(INK, 'g'), GOLD_L);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 520">` +
      `<defs><radialGradient id="bg" cx="50%" cy="50%" r="72%"><stop offset="0" stop-color="#2a3468"/><stop offset=".55" stop-color="#161c40"/><stop offset="1" stop-color="#0a0d22"/></radialGradient></defs>` +
      `<rect width="300" height="520" rx="16" fill="url(#bg)"/>` + stars +
      `<rect x="12" y="12" width="276" height="496" rx="10" fill="none" stroke="${GOLD_L}" stroke-width="2"/>` +
      `<rect x="20" y="20" width="260" height="480" rx="6" fill="none" stroke="${GOLD_L}" stroke-width=".8" opacity=".55"/>` +
      corner(20, 20, 0) + corner(280, 20, 90) + corner(280, 500, 180) + corner(20, 500, 270) +
      `<path d="M150 34L150 104M150 416L150 486" stroke="${GOLD_L}" stroke-width=".9" opacity=".7"/>` +
      `<polygon points="150,44 155,52 150,60 145,52" fill="${GOLD_L}"/><polygon points="150,460 155,468 150,476 145,468" fill="${GOLD_L}"/>` +
      `<circle cx="150" cy="260" r="98" fill="none" stroke="${GOLD_L}" stroke-width=".8" stroke-dasharray="2 5" opacity=".7"/>` +
      `<circle cx="150" cy="260" r="86" fill="${NIGHT}" fill-opacity=".55" stroke="${GOLD_L}" stroke-width="1.6"/>` +
      `<path d="${ring.join('')}" stroke="${GOLD_L}" stroke-width="1.1" stroke-linecap="round"/>` +
      `<circle cx="150" cy="260" r="56" fill="${NIGHT}" stroke="${GOLD_L}" stroke-width="1.4"/>` +
      `<polygon points="${starPts(150, 260, 44, 15, 8)}" fill="${GOLD_L}" opacity=".9"/>` +
      `<polygon points="${starPts(150, 260, 28, 10, 8, -67.5)}" fill="${NIGHT}" stroke="${GOLD_L}" stroke-width="1"/>` +
      `<circle cx="150" cy="260" r="9" fill="${GOLD_L}"/><circle cx="150" cy="260" r="4" fill="${NIGHT}"/>` +
      g2(crescent(150, 128, 18, 7, -90, NIGHT, 1.4)).replace(`fill="${GOLD_L}"`, `fill="${GOLD_L}"`) +
      g2(crescent(150, 392, 18, 7, 90, NIGHT, 1.4)) +
      `<polygon points="${starPts(150, 128, 5, 2, 4)}" fill="${GOLD_L}"/><polygon points="${starPts(150, 392, 5, 2, 4)}" fill="${GOLD_L}"/>` +
      `<polygon points="${starPts(46, 260, 8, 2.6, 4)}" fill="${GOLD_L}"/><polygon points="${starPts(254, 260, 8, 2.6, 4)}" fill="${GOLD_L}"/>` +
      `</svg>`;
  }

  g.TAROT_ART = { face, back };
})(typeof window !== 'undefined' ? window : globalThis);
