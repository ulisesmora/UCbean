import * as THREE from 'three';

/**
 * The room the drink sits in, built from a real photograph.
 *
 * Two things were wrong with painting it by hand. A drawn room reflects as a
 * drawing, and a canvas caps at 1.0, so the windows and lamps came out as pale
 * paint rather than light. The point of an .hdr capture is not resolution, it
 * is range: a lamp in a real room is twenty times the brightness of the wall
 * beside it, and that ratio is what makes a highlight look like a highlight.
 *
 * So this takes an actual café interior, wraps it into an equirectangular
 * panorama, and rebuilds it as a half-float texture with everything above the
 * highlight knee pushed far past 1. The lamps in the photograph become real
 * light sources. Around 4MB on the GPU, against the tens of megabytes a
 * downloaded .hdr costs once decoded and pre-filtered, which is what kept
 * costing us the WebGL context.
 */

const W = 1024;
const H = 512;

/** sRGB byte to linear float, the transfer function three.js expects. */
function toLinear(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Wraps one photograph around the full 360.
 *
 * A single frame covers maybe 60 degrees, so it is laid down four times with
 * every other copy mirrored. Mirroring is what makes the seams meet: the edge
 * of one copy is the edge of the next, so there is no visible join to blur out.
 */
function wrap(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const copies = 4;
  const cw = W / copies;

  // Cover: fill the band vertically and crop the sides, rather than squashing.
  const scale = Math.max(cw / img.width, H / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  // Bias upward so the ceiling and lamps stay in frame, which is where the
  // light in this photograph actually is.
  const dy = (H - dh) * 0.32;

  for (let i = 0; i < copies; i++) {
    ctx.save();
    ctx.translate(i * cw, 0);
    if (i % 2 === 1) {
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(img, (cw - dw) / 2, dy, dw, dh);
    ctx.restore();
  }
}

/** Darkens the lower band so the floor reads as floor, not more wall. */
function groundFalloff(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, H * 0.62, 0, H);
  g.addColorStop(0, 'rgba(28,20,12,0)');
  g.addColorStop(1, 'rgba(28,20,12,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.62, W, H * 0.38);
}

/**
 * Builds the environment from a loaded image.
 *
 * `boost` sets how far above white the highlights are pushed. Higher gives
 * harder, more photographic speculars; too high and everything blooms.
 */
export function makeCafeHdri(img: HTMLImageElement, boost = 26): THREE.DataTexture {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  wrap(ctx, img);
  groundFalloff(ctx);

  const src = ctx.getImageData(0, 0, W, H).data;
  const out = new Float32Array(W * H * 4);

  for (let i = 0; i < W * H; i++) {
    const r = toLinear(src[i * 4]);
    const g = toLinear(src[i * 4 + 1]);
    const b = toLinear(src[i * 4 + 2]);

    // Rec. 709 luminance. Above the knee the gain climbs steeply, so lamps and
    // window panes end up many times the wall beside them, as they would in a
    // real capture. Below it the room keeps the values the camera recorded.
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const KNEE = 0.62;
    const gain = lum > KNEE ? 1 + Math.pow((lum - KNEE) / (1 - KNEE), 1.8) * boost : 1;

    out[i * 4] = r * gain;
    out[i * 4 + 1] = g * gain;
    out[i * 4 + 2] = b * gain;
    out[i * 4 + 3] = 1;
  }

  const texture = new THREE.DataTexture(out, W, H, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.NoColorSpace; // already linear
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
