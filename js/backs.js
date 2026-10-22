/* Card backs for each historical deck, drawn as SVG in the spirit of its period.
   Every back is point-symmetric so a reversed card never shows itself early. */
(function (g) {
  'use strict';

  const r2 = (n) => Math.round(n * 100) / 100;
  const rad = (d) => (d * Math.PI) / 180;

  function starPts(cx, cy, R, r, n, rot = -90) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = rad(rot + (i * 180) / n);
      const d = i % 2 ? r : R;
      pts.push(`${r2(cx + Math.cos(a) * d)},${r2(cy + Math.sin(a) * d)}`);
    }
    return pts.join(' ');
  }

  function sunburst(cx, cy, r1, r2_, n, color, w = 1.4, wavy = false) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = rad((i * 360) / n);
      const R = i % 2 ? r1 + (r2_ - r1) * 0.7 : r2_;
      if (wavy && i % 2 === 0) {
        const c = Math.cos(a), s = Math.sin(a);
        for (let k = 0; k <= 10; k++) {
          const t = k / 10, along = r1 + (R - r1) * t, side = Math.sin(t * Math.PI * 3) * 3;
          d += `${k ? 'L' : 'M'}${r2(cx + c * along - s * side)} ${r2(cy + s * along + c * side)}`;
        }
      } else {
        d += `M${r2(cx + Math.cos(a) * r1)} ${r2(cy + Math.sin(a) * r1)}L${r2(cx + Math.cos(a) * R)} ${r2(cy + Math.sin(a) * R)}`;
      }
    }
    return `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  }

  const lily = (c, s = 1) => `<g transform="scale(${s})" fill="${c}">` +
    '<path d="M0 -16C5 -10 5 -2 0 4C-5 -2 -5 -10 0 -16Z"/>' +
    '<path d="M-2 2C-6 -6 -14 -6 -15 1C-14 -3 -8 -2 -4 5Z"/><path d="M2 2C6 -6 14 -6 15 1C14 -3 8 -2 4 5Z"/>' +
    '<rect x="-7" y="4" width="14" height="3" rx="1"/>' +
    '<path d="M-3 7C-3 12 -6 14 -9 15C-5 15 -1 13 0 9C1 13 5 15 9 15C6 14 3 12 3 7Z"/></g>';

  function frame(W, H, inset, color, w, rx = 8, extra = '') {
    return `<rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" rx="${rx}" fill="none" stroke="${color}" stroke-width="${w}" ${extra}/>`;
  }

  const BACKS = {
    // Milan: the Sforza radiant sun tooled into gold over red lacquer
    visconti(W, H) {
      const cx = W / 2, cy = H / 2;
      return `<defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8862c"/><stop offset=".45" stop-color="#f0d687"/><stop offset=".7" stop-color="#c99a3e"/><stop offset="1" stop-color="#8f6420"/></linearGradient>
        <radialGradient id="red" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#9a2a22"/><stop offset="1" stop-color="#4e0f10"/></radialGradient>
        <pattern id="punch" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="9" cy="9" r="1.3" fill="#f3dc94" opacity=".55"/><circle cx="0" cy="0" r=".9" fill="#f3dc94" opacity=".35"/></pattern>
      </defs>
      <rect width="${W}" height="${H}" rx="14" fill="url(#gold)"/>
      <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="6" fill="url(#red)"/>
      <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="6" fill="url(#punch)"/>
      ${frame(W, H, 22, '#e9c96f', 1, 4, 'opacity=".7"')}
      <circle cx="${cx}" cy="${cy}" r="${W * 0.36}" fill="none" stroke="#e9c96f" stroke-width=".8" stroke-dasharray="1 4" opacity=".8"/>
      ${sunburst(cx, cy, W * 0.15, W * 0.31, 32, 'url(#gold)', 3, true)}
      <circle cx="${cx}" cy="${cy}" r="${W * 0.14}" fill="url(#gold)" stroke="#5a1410" stroke-width="1.2"/>
      <circle cx="${cx}" cy="${cy}" r="${W * 0.1}" fill="none" stroke="#5a1410" stroke-width=".8" stroke-dasharray="1.5 2.5"/>
      ${[[cx, 52], [cx, H - 52]].map(([x, y]) => `<polygon points="${starPts(x, y, 10, 4, 6)}" fill="url(#gold)"/>`).join('')}`;
    },

    // Ferrara/Venice engraving: crosshatched ivory with a laurel cartouche
    solabusca(W, H) {
      const cx = W / 2, cy = H / 2;
      let laurel = '';
      for (let i = 0; i < 28; i++) {
        const t = (i / 28) * Math.PI * 2;
        const x = cx + Math.cos(t) * W * 0.27, y = cy + Math.sin(t) * H * 0.22;
        const ang = (Math.atan2(H * 0.22 * Math.cos(t), -W * 0.27 * Math.sin(t)) * 180) / Math.PI + (i % 2 ? 30 : -30);
        laurel += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="9" ry="3.6" transform="rotate(${r2(ang)} ${r2(x)} ${r2(y)})" fill="#3b2a1a" opacity=".8"/>`;
      }
      return `<defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0L0 6" stroke="#5b4128" stroke-width=".7" opacity=".45"/></pattern>
        <pattern id="hatch2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 0L0 6" stroke="#5b4128" stroke-width=".6" opacity=".3"/></pattern>
      </defs>
      <rect width="${W}" height="${H}" rx="14" fill="#efe2c4"/>
      <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="url(#hatch)"/>
      <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="url(#hatch2)"/>
      ${frame(W, H, 14, '#3b2a1a', 2.2, 2)}${frame(W, H, 20, '#3b2a1a', .8, 1)}
      <ellipse cx="${cx}" cy="${cy}" rx="${W * 0.3}" ry="${H * 0.25}" fill="#efe2c4" stroke="#3b2a1a" stroke-width="1.6"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${W * 0.22}" ry="${H * 0.18}" fill="#e6d3ab" stroke="#3b2a1a" stroke-width="1"/>
      ${laurel}
      <polygon points="${starPts(cx, cy, W * 0.1, W * 0.04, 8)}" fill="#a83a26" stroke="#3b2a1a" stroke-width="1"/>
      <circle cx="${cx}" cy="${cy}" r="${W * 0.025}" fill="#efe2c4" stroke="#3b2a1a"/>`;
    },

    // Florence: the red lily (giglio) repeated on white
    minchiate(W, H) {
      const cx = W / 2, cy = H / 2;
      return `<defs>
        <pattern id="lil" width="40" height="46" patternUnits="userSpaceOnUse"><g transform="translate(20 20)">${lily('#b3261e', 0.75)}</g><g transform="translate(0 43)">${lily('#b3261e', 0.45)}</g><g transform="translate(40 43)">${lily('#b3261e', 0.45)}</g></pattern>
      </defs>
      <rect width="${W}" height="${H}" rx="14" fill="#f4ecdc"/>
      <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="url(#lil)" opacity=".85"/>
      ${frame(W, H, 10, '#b3261e', 6, 8)}${frame(W, H, 18, '#1d3b73', 1.6, 3)}
      <circle cx="${cx}" cy="${cy}" r="${W * 0.22}" fill="#f4ecdc" stroke="#1d3b73" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${W * 0.19}" fill="none" stroke="#b3261e" stroke-width="1"/>
      <g transform="translate(${cx} ${cy + 3})">${lily('#b3261e', 2.6)}</g>`;
    },

    // Marseille: bold woodcut lattice in stencilled blue and red
    marseille(W, H) {
      const cx = W / 2, cy = H / 2;
      return `<defs>
        <pattern id="lat" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="28" height="28" fill="#f1e4c3"/><rect x="0" y="0" width="28" height="7" fill="#2f5d9a"/><rect x="0" y="0" width="7" height="28" fill="#2f5d9a"/>
          <rect x="14" y="14" width="7" height="7" fill="#c8402f"/><path d="M0 0H28M0 7H28M0 0V28M7 0V28" stroke="#1c1712" stroke-width="1.2"/></pattern>
      </defs>
      <rect width="${W}" height="${H}" rx="14" fill="#f1e4c3"/>
      <rect x="16" y="16" width="${W - 32}" height="${H - 32}" fill="url(#lat)"/>
      ${frame(W, H, 16, '#1c1712', 3, 2)}${frame(W, H, 8, '#c8402f', 3, 10)}
      <rect x="${cx - W * 0.2}" y="${cy - W * 0.2}" width="${W * 0.4}" height="${W * 0.4}" transform="rotate(45 ${cx} ${cy})" fill="#f1e4c3" stroke="#1c1712" stroke-width="3"/>
      <polygon points="${starPts(cx, cy, W * 0.13, W * 0.055, 8)}" fill="#e2b33a" stroke="#1c1712" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${W * 0.035}" fill="#c8402f" stroke="#1c1712" stroke-width="2"/>`;
    },

    // Paris, 1780s: an engraved oval of the heavens on buff paper
    etteilla(W, H) {
      const cx = W / 2, cy = H / 2;
      let ring = '';
      for (let i = 0; i < 12; i++) {
        const a = rad(i * 30 - 90);
        ring += `<polygon points="${starPts(cx + Math.cos(a) * W * 0.24, cy + Math.sin(a) * H * 0.2, 6, 2.4, 5)}" fill="#5a3c22"/>`;
      }
      return `<defs>
        <radialGradient id="paper" cx="50%" cy="50%" r="75%"><stop offset="0" stop-color="#ecdcb6"/><stop offset="1" stop-color="#cdb07c"/></radialGradient>
        <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r=".8" fill="#5a3c22" opacity=".35"/></pattern>
      </defs>
      <rect width="${W}" height="${H}" rx="14" fill="url(#paper)"/>
      <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="url(#dots)"/>
      ${frame(W, H, 12, '#5a3c22', 1.6, 4)}${frame(W, H, 18, '#5a3c22', .8, 2)}
      <ellipse cx="${cx}" cy="${cy}" rx="${W * 0.32}" ry="${H * 0.27}" fill="#ecdcb6" stroke="#5a3c22" stroke-width="1.6"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${W * 0.29}" ry="${H * 0.245}" fill="none" stroke="#5a3c22" stroke-width=".7"/>
      ${ring}
      ${sunburst(cx, cy, W * 0.07, W * 0.15, 24, '#5a3c22', 1)}
      <circle cx="${cx}" cy="${cy}" r="${W * 0.065}" fill="#ecdcb6" stroke="#5a3c22" stroke-width="1.4"/>
      <circle cx="${cx}" cy="${cy}" r="${W * 0.02}" fill="#5a3c22"/>`;
    },

    // Wirth: soft esoteric violet with a rose cross
    wirth(W, H) {
      const cx = W / 2, cy = H / 2;
      let petals = '';
      for (let i = 0; i < 8; i++) {
        const a = i * 45;
        petals += `<ellipse cx="${cx}" cy="${cy - 14}" rx="7" ry="13" transform="rotate(${a} ${cx} ${cy})" fill="#c9566a" stroke="#3a2a4a" stroke-width=".8"/>`;
      }
      return `<defs>
        <radialGradient id="dusk" cx="50%" cy="50%" r="72%"><stop offset="0" stop-color="#5d5a8a"/><stop offset=".6" stop-color="#3b3a63"/><stop offset="1" stop-color="#25233f"/></radialGradient>
      </defs>
      <rect width="${W}" height="${H}" rx="14" fill="url(#dusk)"/>
      ${frame(W, H, 14, '#e2c98a', 1.6, 6)}${frame(W, H, 22, '#e2c98a', .6, 3, 'opacity=".6"')}
      <circle cx="${cx}" cy="${cy}" r="${W * 0.34}" fill="none" stroke="#e2c98a" stroke-width=".8" opacity=".6"/>
      <path d="M${cx} ${cy - W * 0.3}V${cy + W * 0.3}M${cx - W * 0.3} ${cy}H${cx + W * 0.3}" stroke="#e2c98a" stroke-width="8" stroke-linecap="round"/>
      <path d="M${cx} ${cy - W * 0.3}V${cy + W * 0.3}M${cx - W * 0.3} ${cy}H${cx + W * 0.3}" stroke="#25233f" stroke-width="1"/>
      ${[[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => `<circle cx="${cx + dx * W * 0.3}" cy="${cy + dy * W * 0.3}" r="7" fill="#e2c98a"/>`).join('')}
      ${petals}<circle cx="${cx}" cy="${cy}" r="9" fill="#e2c98a" stroke="#3a2a4a"/>
      ${[[cx, 48], [cx, H - 48]].map(([x, y]) => `<polygon points="${starPts(x, y, 7, 2.8, 5)}" fill="#e2c98a" opacity=".8"/>`).join('')}`;
    },
  };

  // London, 1909: a night sky with sun and crescent moons
  BACKS.rws = (W, H) => {
    const cx = W / 2, cy = H / 2, G = '#dcb65c', NIGHT = '#0e1330';
    let seed = 1909;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    let stars = '';
    for (let i = 0; i < 46; i++) {
      const x = 24 + rand() * (W - 48), y = 24 + rand() * (H - 48);
      const r = r2(0.5 + rand() * 1.2), o = r2(0.35 + rand() * 0.55), c = rand() > 0.7 ? '#fff6dc' : G;
      stars += `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r}" fill="${c}" opacity="${o}"/><circle cx="${r2(W - x)}" cy="${r2(H - y)}" r="${r}" fill="${c}" opacity="${o}"/>`;
    }
    const moon = (y, rot) => {
      const r = 18, k = 7, rr = (r * r + k * k) / (2 * k);
      return `<path d="M${cx} ${y - r}A${r} ${r} 0 0 0 ${cx} ${y + r}A${r2(rr)} ${r2(rr)} 0 0 1 ${cx} ${y - r}Z" fill="${NIGHT}" stroke="${G}" stroke-width="1.4" transform="rotate(${rot} ${cx} ${y})"/>` +
        `<polygon points="${starPts(cx, y, 5, 2, 4)}" fill="${G}"/>`;
    };
    return `<defs><radialGradient id="bg" cx="50%" cy="50%" r="72%"><stop offset="0" stop-color="#2a3468"/><stop offset=".55" stop-color="#161c40"/><stop offset="1" stop-color="#0a0d22"/></radialGradient></defs>
      <rect width="${W}" height="${H}" rx="14" fill="url(#bg)"/>${stars}
      ${frame(W, H, 12, G, 2, 10)}${frame(W, H, 20, G, .8, 6, 'opacity=".55"')}
      <path d="M${cx} 34V${cy - 156}M${cx} ${cy + 156}V${H - 34}" stroke="${G}" stroke-width=".9" opacity=".7"/>
      <circle cx="${cx}" cy="${cy}" r="98" fill="none" stroke="${G}" stroke-width=".8" stroke-dasharray="2 5" opacity=".7"/>
      <circle cx="${cx}" cy="${cy}" r="86" fill="${NIGHT}" fill-opacity=".55" stroke="${G}" stroke-width="1.6"/>
      ${sunburst(cx, cy, 58, 80, 32, G, 1.1)}
      <circle cx="${cx}" cy="${cy}" r="56" fill="${NIGHT}" stroke="${G}" stroke-width="1.4"/>
      <polygon points="${starPts(cx, cy, 44, 15, 8)}" fill="${G}" opacity=".9"/>
      <polygon points="${starPts(cx, cy, 28, 10, 8, -67.5)}" fill="${NIGHT}" stroke="${G}" stroke-width="1"/>
      <circle cx="${cx}" cy="${cy}" r="9" fill="${G}"/><circle cx="${cx}" cy="${cy}" r="4" fill="${NIGHT}"/>
      ${moon(cy - 132, -90)}${moon(cy + 132, 90)}
      <polygon points="${starPts(46, cy, 8, 2.6, 4)}" fill="${G}"/><polygon points="${starPts(W - 46, cy, 8, 2.6, 4)}" fill="${G}"/>`;
  };

  function back(deckId, ratio) {
    const W = 300, H = Math.round(300 / ratio);
    const body = (BACKS[deckId] || BACKS.marseille)(W, H);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${body}</svg>`;
  }

  g.TAROT_BACKS = { back };
})(window);
