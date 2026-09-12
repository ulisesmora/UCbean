import * as THREE from 'three';

/**
 * Every surface in the builder, as a full PBR set.
 *
 * A normal map alone only tilts the light, which is why the earlier passes
 * still looked like plastic no matter how much relief went on them. What makes
 * a material read as real is the three maps together:
 *
 *   colour     — no surface is one flat tone
 *   roughness  — no surface is evenly glossy; that variation is the whole tell
 *   normal     — the relief you can feel
 *
 * These are painted rather than downloaded, so there is nothing to fetch and
 * nothing to decode. Each set is generated once and shared across instances.
 */

export type PbrSet = {
  map?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  normalMap?: THREE.Texture;
};

/* ── Helpers ─────────────────────────────────────────────── */

function canvas(size: number, h = size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function texture(c: HTMLCanvasElement, { srgb = false, repeat = [1, 1] as [number, number] } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  // These are read at near-constant scale, so a mipmap chain is a third more
  // texture memory for no visible gain.
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  return t;
}

/** Scatters soft blobs. The base of most natural-looking variation. */
function mottle(
  ctx: CanvasRenderingContext2D,
  size: number,
  count: number,
  radius: [number, number],
  shade: () => string,
) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = radius[0] + Math.random() * (radius[1] - radius[0]);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, shade());
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

const NORMAL_FLAT = '#8080ff';

/* ── Paper cup stock ─────────────────────────────────────── */

export function paperSet(): PbrSet {
  const S = 256;

  // Colour: pressed board is not uniform. Faint fibre streaks and the odd
  // darker fleck from the pulp.
  const [ac, actx] = canvas(S);
  actx.fillStyle = '#ffffff';
  actx.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const len = 6 + Math.random() * 34;
    const v = 224 + Math.random() * 26;
    actx.strokeStyle = `rgba(${v},${v - 6},${v - 16},0.5)`;
    actx.lineWidth = 0.6 + Math.random();
    actx.beginPath();
    actx.moveTo(x, y);
    actx.lineTo(x + (Math.random() - 0.5) * 4, y + len);
    actx.stroke();
  }
  mottle(actx, S, 70, [4, 16], () => `rgba(196,184,164,${0.1 + Math.random() * 0.16})`);

  // Roughness: board is matte overall, a touch smoother where it was pressed.
  const [rc, rctx] = canvas(S);
  rctx.fillStyle = '#c4c4c4';
  rctx.fillRect(0, 0, S, S);
  mottle(rctx, S, 120, [8, 30], () => {
    const v = Math.round(150 + Math.random() * 80);
    return `rgba(${v},${v},${v},0.4)`;
  });

  // Normal: the grain of the roll, so near vertical.
  const [nc, nctx] = canvas(S);
  nctx.fillStyle = NORMAL_FLAT;
  nctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const len = 8 + Math.random() * 44;
    const v = 116 + Math.random() * 26;
    nctx.strokeStyle = `rgba(${v},${v + 4},255,0.5)`;
    nctx.lineWidth = 0.6 + Math.random();
    nctx.beginPath();
    nctx.moveTo(x, y);
    nctx.lineTo(x + (Math.random() - 0.5) * 5, y + len);
    nctx.stroke();
  }

  return {
    map: texture(ac, { srgb: true, repeat: [3, 2] }),
    roughnessMap: texture(rc, { repeat: [3, 2] }),
    normalMap: texture(nc, { repeat: [3, 2] }),
  };
}

/* ── Kraft sleeve ────────────────────────────────────────── */

export function kraftSet(): PbrSet {
  const W = 512;
  const H = 128;

  // Colour: recycled board is flecked with darker fibre.
  const [ac, actx] = canvas(W, H);
  actx.fillStyle = '#ffffff';
  actx.fillRect(0, 0, W, H);
  for (let i = 0; i < 1600; i++) {
    const v = 190 + Math.random() * 56;
    actx.fillStyle = `rgba(${v},${v - 14},${v - 34},${0.25 + Math.random() * 0.4})`;
    actx.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 1 + Math.random());
  }
  // The ridges also read slightly darker in their troughs.
  for (let x = 0; x < W; x++) {
    const wave = Math.sin((x / W) * Math.PI * 2 * 58);
    if (wave < -0.3) {
      actx.fillStyle = `rgba(150,132,104,${(-wave - 0.3) * 0.3})`;
      actx.fillRect(x, 0, 1, H);
    }
  }

  // Roughness: corrugation is uniformly matte, troughs very slightly more so.
  const [rc, rctx] = canvas(W, H);
  for (let x = 0; x < W; x++) {
    const wave = Math.sin((x / W) * Math.PI * 2 * 58);
    const v = Math.round(206 + wave * 22);
    rctx.fillStyle = `rgb(${v},${v},${v})`;
    rctx.fillRect(x, 0, 1, H);
  }

  // Normal: the ridges themselves, which are what make a sleeve a sleeve.
  const [nc, nctx] = canvas(W, H);
  for (let x = 0; x < W; x++) {
    const wave = Math.sin((x / W) * Math.PI * 2 * 58);
    const v = Math.round(128 + wave * 64);
    nctx.fillStyle = `rgb(${v},128,255)`;
    nctx.fillRect(x, 0, 1, H);
  }

  return {
    map: texture(ac, { srgb: true }),
    roughnessMap: texture(rc),
    normalMap: texture(nc),
  };
}

/* ── Glazed porcelain ────────────────────────────────────── */

export function glazeSet(): PbrSet {
  const S = 256;

  // Colour: china is faintly warm and never perfectly even, with the odd
  // speck fired into the glaze.
  const [ac, actx] = canvas(S);
  actx.fillStyle = '#ffffff';
  actx.fillRect(0, 0, S, S);
  mottle(actx, S, 60, [12, 44], () => `rgba(246,243,236,${0.2 + Math.random() * 0.3})`);
  for (let i = 0; i < 70; i++) {
    const v = 200 + Math.random() * 40;
    actx.fillStyle = `rgba(${v},${v - 6},${v - 14},0.35)`;
    actx.fillRect(Math.random() * S, Math.random() * S, 1.2, 1.2);
  }

  // Roughness: glaze pools thicker in some places and thinner in others, so
  // the sheen wanders. This is the map that stops china reading as plastic.
  const [rc, rctx] = canvas(S);
  rctx.fillStyle = '#2a2a2a';
  rctx.fillRect(0, 0, S, S);
  mottle(rctx, S, 110, [14, 56], () => {
    const v = Math.round(16 + Math.random() * 62);
    return `rgba(${v},${v},${v},0.5)`;
  });

  return {
    map: texture(ac, { srgb: true, repeat: [2, 2] }),
    roughnessMap: texture(rc, { repeat: [2, 2] }),
  };
}

/* ── Brew surface ────────────────────────────────────────── */

export function brewSet(): PbrSet {
  const S = 256;

  // Roughness: coffee is not a mirror. Oils ride on the surface in slicks
  // that are glossier than the liquid around them.
  const [rc, rctx] = canvas(S);
  rctx.fillStyle = '#5a5a5a';
  rctx.fillRect(0, 0, S, S);
  mottle(rctx, S, 80, [18, 70], () => {
    const v = Math.round(20 + Math.random() * 70);
    return `rgba(${v},${v},${v},0.45)`;
  });

  // Normal: slow concentric ripples, drifting.
  const [nc, nctx] = canvas(S);
  nctx.fillStyle = NORMAL_FLAT;
  nctx.fillRect(0, 0, S, S);
  const mid = S / 2;
  for (let ring = 0; ring < 30; ring++) {
    const r = (ring / 30) * mid;
    nctx.strokeStyle = `rgba(${134 + Math.random() * 26},${128},255,0.4)`;
    nctx.lineWidth = 1.6 + Math.random() * 1.4;
    nctx.beginPath();
    nctx.arc(mid, mid, r, 0, Math.PI * 2);
    nctx.stroke();
  }

  return { roughnessMap: texture(rc), normalMap: texture(nc) };
}

/* ── Milk foam ───────────────────────────────────────────── */

export function foamSet(): PbrSet {
  const S = 256;

  // Colour: foam is not one cream tone. Bubble walls catch light and the
  // gaps between them sit in shadow.
  const [ac, actx] = canvas(S);
  actx.fillStyle = '#ffffff';
  actx.fillRect(0, 0, S, S);
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 1 + Math.random() * 4.5;
    const g = actx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.8)');
    g.addColorStop(0.65, 'rgba(236,226,208,0.45)');
    g.addColorStop(1, 'rgba(206,192,168,0.5)');
    actx.fillStyle = g;
    actx.beginPath();
    actx.arc(x, y, r, 0, Math.PI * 2);
    actx.fill();
  }

  // Roughness: wet microfoam is glossy, dry foam is chalky, and real foam is
  // a mix of the two across the same surface.
  const [rc, rctx] = canvas(S);
  rctx.fillStyle = '#b4b4b4';
  rctx.fillRect(0, 0, S, S);
  mottle(rctx, S, 140, [6, 26], () => {
    const v = Math.round(120 + Math.random() * 120);
    return `rgba(${v},${v},${v},0.45)`;
  });

  // Normal: the bubble relief.
  const [nc, nctx] = canvas(S);
  nctx.fillStyle = '#808080';
  nctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 1.2 + Math.random() * 4.5;
    const g = nctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.6, 'rgba(128,128,128,0.35)');
    g.addColorStop(1, 'rgba(40,40,40,0.45)');
    nctx.fillStyle = g;
    nctx.beginPath();
    nctx.arc(x, y, r, 0, Math.PI * 2);
    nctx.fill();
  }

  return {
    map: texture(ac, { srgb: true, repeat: [3, 3] }),
    roughnessMap: texture(rc, { repeat: [3, 3] }),
    normalMap: texture(nc, { repeat: [3, 3] }),
  };
}

/* ── Whipped cream ───────────────────────────────────────── */

export function creamSet(): PbrSet {
  const S = 256;

  // Colour: dairy whites are warm in the hollows and near-white on the peaks.
  const [ac, actx] = canvas(S);
  actx.fillStyle = '#ffffff';
  actx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y++) {
    const wave = Math.sin((y / S) * Math.PI * 2 * 14);
    if (wave < 0) {
      actx.fillStyle = `rgba(240,228,206,${-wave * 0.35})`;
      actx.fillRect(0, y, S, 1);
    }
  }
  mottle(actx, S, 240, [2, 8], () => `rgba(248,240,224,${0.2 + Math.random() * 0.3})`);

  // Roughness: cream is matte, a touch wetter in the valleys.
  const [rc, rctx] = canvas(S);
  rctx.fillStyle = '#dcdcdc';
  rctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y++) {
    const wave = Math.sin((y / S) * Math.PI * 2 * 14);
    const v = Math.round(214 + wave * 26);
    rctx.fillStyle = `rgb(${v},${v},${v})`;
    rctx.fillRect(0, y, S, 1);
  }

  // Normal: the piped ridges, plus the pitting of aerated dairy.
  const [nc, nctx] = canvas(S);
  nctx.fillStyle = NORMAL_FLAT;
  nctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y++) {
    const wave = Math.sin((y / S) * Math.PI * 2 * 14);
    const v = Math.round(128 + wave * 44);
    nctx.fillStyle = `rgba(128,${v},255,0.85)`;
    nctx.fillRect(0, y, S, 1);
  }
  for (let i = 0; i < 900; i++) {
    const r = 0.8 + Math.random() * 2.4;
    nctx.fillStyle = `rgba(${110 + Math.random() * 44},${110 + Math.random() * 44},255,0.4)`;
    nctx.beginPath();
    nctx.arc(Math.random() * S, Math.random() * S, r, 0, Math.PI * 2);
    nctx.fill();
  }

  return {
    map: texture(ac, { srgb: true, repeat: [3, 1] }),
    roughnessMap: texture(rc, { repeat: [3, 1] }),
    normalMap: texture(nc, { repeat: [3, 1] }),
  };
}

/* ── Ice ─────────────────────────────────────────────────── */

export function iceSet(): PbrSet {
  const S = 256;

  // Roughness: a cube out of a freezer is frosted on the outside and clear
  // deeper in, and the frost is patchy.
  const [rc, rctx] = canvas(S);
  rctx.fillStyle = '#3c3c3c';
  rctx.fillRect(0, 0, S, S);
  mottle(rctx, S, 130, [10, 44], () => {
    const v = Math.round(40 + Math.random() * 150);
    return `rgba(${v},${v},${v},0.5)`;
  });

  // Normal: internal fractures and trapped air.
  const [nc, nctx] = canvas(S);
  nctx.fillStyle = NORMAL_FLAT;
  nctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 30; i++) {
    let x = Math.random() * S;
    let y = Math.random() * S;
    nctx.strokeStyle = `rgba(${150 + Math.random() * 60},${90 + Math.random() * 40},255,0.55)`;
    nctx.lineWidth = 0.7 + Math.random() * 1.8;
    nctx.beginPath();
    nctx.moveTo(x, y);
    for (let seg = 0; seg < 4; seg++) {
      x += (Math.random() - 0.5) * 70;
      y += (Math.random() - 0.5) * 70;
      nctx.lineTo(x, y);
    }
    nctx.stroke();
  }
  for (let i = 0; i < 460; i++) {
    const r = 0.6 + Math.random() * 2.2;
    nctx.fillStyle = `rgba(${120 + Math.random() * 40},${120 + Math.random() * 40},255,0.35)`;
    nctx.beginPath();
    nctx.arc(Math.random() * S, Math.random() * S, r, 0, Math.PI * 2);
    nctx.fill();
  }

  return { roughnessMap: texture(rc), normalMap: texture(nc) };
}

/* ── Roasted bean ────────────────────────────────────────── */

export function beanSet(): PbrSet {
  const S = 256;

  // Colour: roast is uneven. Darker ridges, pale patches, the odd scorched spot.
  const [ac, actx] = canvas(S);
  actx.fillStyle = '#ffffff';
  actx.fillRect(0, 0, S, S);
  mottle(actx, S, 320, [6, 30], () => {
    const v = Math.random();
    const tone = v > 0.7 ? 236 : v > 0.35 ? 152 : 94;
    return `rgba(${tone},${Math.round(tone * 0.82)},${Math.round(tone * 0.7)},0.4)`;
  });

  // Roughness: the oils that surface on a darker roast sit in patches, so a
  // bean is glossy in places and chalky in others.
  const [rc, rctx] = canvas(S);
  rctx.fillStyle = '#787878';
  rctx.fillRect(0, 0, S, S);
  mottle(rctx, S, 150, [8, 36], () => {
    const v = Math.round(28 + Math.random() * 124);
    return `rgba(${v},${v},${v},0.6)`;
  });

  // Normal: wrinkled, pitted skin.
  const [nc, nctx] = canvas(S);
  nctx.fillStyle = NORMAL_FLAT;
  nctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 1.5 + Math.random() * 5;
    const g = nctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    g.addColorStop(0, 'rgba(170,170,255,0.5)');
    g.addColorStop(1, 'rgba(94,94,255,0.35)');
    nctx.fillStyle = g;
    nctx.beginPath();
    nctx.arc(x, y, r, 0, Math.PI * 2);
    nctx.fill();
  }

  return {
    map: texture(ac, { srgb: true }),
    roughnessMap: texture(rc),
    normalMap: texture(nc),
  };
}

/* ── Counter stone ───────────────────────────────────────── */

export function stoneSet(): PbrSet {
  const S = 256;

  const [ac, actx] = canvas(S);
  actx.fillStyle = '#ffffff';
  actx.fillRect(0, 0, S, S);
  mottle(actx, S, 180, [8, 40], () => `rgba(228,224,216,${0.18 + Math.random() * 0.3})`);
  for (let i = 0; i < 3000; i++) {
    const v = 190 + Math.random() * 60;
    actx.fillStyle = `rgba(${v},${v},${v - 6},0.3)`;
    actx.fillRect(Math.random() * S, Math.random() * S, 1.3, 1.3);
  }

  const [rc, rctx] = canvas(S);
  rctx.fillStyle = '#8c8c8c';
  rctx.fillRect(0, 0, S, S);
  mottle(rctx, S, 150, [10, 48], () => {
    const v = Math.round(80 + Math.random() * 110);
    return `rgba(${v},${v},${v},0.45)`;
  });

  const [nc, nctx] = canvas(S);
  nctx.fillStyle = NORMAL_FLAT;
  nctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const r = 0.8 + Math.random() * 2.6;
    nctx.fillStyle = `rgba(${112 + Math.random() * 34},${112 + Math.random() * 34},255,0.35)`;
    nctx.beginPath();
    nctx.arc(Math.random() * S, Math.random() * S, r, 0, Math.PI * 2);
    nctx.fill();
  }

  return {
    map: texture(ac, { srgb: true, repeat: [6, 6] }),
    roughnessMap: texture(rc, { repeat: [6, 6] }),
    normalMap: texture(nc, { repeat: [6, 6] }),
  };
}

/** Releases every texture in a set. */
export function disposeSet(set: PbrSet) {
  set.map?.dispose();
  set.roughnessMap?.dispose();
  set.normalMap?.dispose();
}
