'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { ContactShadows, Environment, RoundedBox } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import type { sceneOf } from '@/lib/builder';
import { makeCafeHdri } from './cafe-hdri';
import {
  beanSet,
  brewSet,
  creamSet,
  disposeSet,
  foamSet,
  glazeSet,
  iceSet,
  kraftSet,
  paperSet,
  stoneSet,
  type PbrSet,
} from './builder-textures';

/** Builds a PBR set once and releases it with the component. */
function usePbr(make: () => PbrSet): PbrSet {
  const set = useMemo(make, []);
  useEffect(() => () => disposeSet(set), [set]);
  return set;
}

type Scene = ReturnType<typeof sceneOf>;
/** How far each of the five stages has played. Reaches 1 and holds there. */
type Clock = MutableRefObject<number[]>;

/**
 * The drink is built in front of you, one stage per step.
 *
 * Nothing plays on mount except the first stage. Each later stage starts only
 * once the configurator reaches it, runs, and then holds. That is what makes
 * it read as being made rather than appearing.
 *
 * Every piece reads the shared stage clock inside its own frame loop, so the
 * animation values never pass through React state and never cause a re-render.
 *
 * ponytail: procedural geometry throughout. A cup, a mug, a bean and a piped
 * swirl are all surfaces of revolution, so a lathe gives us each of them from
 * a list of points, with no asset to download.
 */

/**
 * Closed shells, not open sheets.
 *
 * A lathe of a single rising line makes a surface with no thickness, and no
 * amount of DoubleSide hides that: the rim shows as a knife edge and the
 * inside is lit as if it were the outside. These profiles climb the outer
 * wall, roll over the lip, come back down the inside and close across the
 * inner floor, so the cup has a real wall you can see the end of.
 */
const TOGO_PROFILE: [number, number][] = [
  [0, 0],
  [0.575, 0],
  [0.6, 0.04], // outer base
  [0.72, 0.98],
  [0.82, 1.9], // outer wall
  [0.862, 1.975],
  [0.848, 2.005],
  [0.822, 1.985], // rolled lip
  [0.8, 1.9],
  [0.695, 1.0],
  [0.578, 0.07], // inner wall
  [0.5, 0.045],
  [0, 0.04], // inner floor
];
/** Monotonic inner wall, used for liquid level maths. */
const TOGO_INNER: [number, number][] = [
  [0.578, 0.07],
  [0.695, 1.0],
  [0.8, 1.9],
];
/** Monotonic outer wall, used for anything that wraps the cup. */
const TOGO_OUTER: [number, number][] = [
  [0.6, 0.04],
  [0.72, 0.98],
  [0.82, 1.9],
];

/**
 * A cappuccino cup. The wall swells out of a narrow foot and flares at the
 * lip, with a thick rim, which is what separates china from a paper cylinder.
 */
const MUG_PROFILE: [number, number][] = [
  [0, 0],
  [0.34, 0],
  [0.375, 0.025], // narrow foot
  [0.46, 0.1],
  [0.62, 0.26],
  [0.78, 0.48], // bowl swelling out
  [0.885, 0.7],
  [0.945, 0.86],
  [0.965, 0.945], // flaring to the lip
  [0.952, 0.968],
  [0.928, 0.945], // rolled lip
  [0.906, 0.86],
  [0.845, 0.68],
  [0.715, 0.44], // inner bowl
  [0.55, 0.22],
  [0.4, 0.105],
  [0.28, 0.082],
  [0, 0.078], // inner floor
];
const MUG_INNER: [number, number][] = [
  [0.4, 0.105],
  [0.715, 0.44],
  [0.845, 0.68],
  [0.906, 0.86],
];
const MUG_OUTER: [number, number][] = [
  [0.435, 0.025],
  [0.62, 0.26],
  [0.78, 0.48],
  [0.945, 0.86],
];

/**
 * A straight-sided tumbler. Thin walls and a thick base, because the base is
 * where glass shows its weight and where the light pools.
 */
const GLASS_PROFILE: [number, number][] = [
  [0, 0],
  [0.7, 0],
  [0.72, 0.05], // outer base
  [0.76, 0.9],
  [0.8, 1.86], // outer wall, barely tapered
  [0.805, 1.9],
  [0.792, 1.906],
  [0.78, 1.88], // thin lip
  [0.74, 0.95],
  [0.7, 0.3], // inner wall
  [0.66, 0.24],
  [0, 0.22], // thick base, seen through
];
const GLASS_INNER: [number, number][] = [
  [0.7, 0.3],
  [0.74, 0.95],
  [0.78, 1.88],
];
const GLASS_OUTER: [number, number][] = [
  [0.72, 0.05],
  [0.76, 0.9],
  [0.8, 1.86],
];

type Geom = {
  /** Closed shell that gets lathed. */
  profile: [number, number][];
  /** Rising inner wall, for working out where the liquid surface sits. */
  inner: [number, number][];
  /** Rising outer wall, for anything wrapped around the outside. */
  outer: [number, number][];
  rimY: number;
  rimR: number;
  fillY: number;
};
const TOGO: Geom = {
  profile: TOGO_PROFILE,
  inner: TOGO_INNER,
  outer: TOGO_OUTER,
  rimY: 2.005,
  rimR: 0.862,
  fillY: 1.8,
};
const MUG: Geom = {
  profile: MUG_PROFILE,
  inner: MUG_INNER,
  outer: MUG_OUTER,
  rimY: 0.968,
  rimR: 0.965,
  fillY: 0.8,
};
const GLASS: Geom = {
  profile: GLASS_PROFILE,
  inner: GLASS_INNER,
  outer: GLASS_OUTER,
  rimY: 1.906,
  rimR: 0.8,
  fillY: 1.7,
};

const SLEEVE_BOTTOM = 0.55;
const SLEEVE_TOP = 1.34;

/** Seconds each stage takes. Slow enough to watch, short enough not to wait. */
const STAGE_SECONDS = [0.9, 2.4, 1.8, 1.2, 1.4];

const clamp01 = (x: number) => THREE.MathUtils.clamp(x, 0, 1);
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOutBack = (x: number) => {
  const c = 1.4;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
const damping = (d: number) => 1 - Math.pow(0.0015, d);

/** Radius at a height along one of the monotonic walls. */
function walk(p: [number, number][], y: number) {
  for (let i = 1; i < p.length; i++) {
    if (y <= p[i][1] || i === p.length - 1) {
      const [r0, y0] = p[i - 1];
      const [r1, y1] = p[i];
      const t = y1 === y0 ? 0 : clamp01((y - y0) / (y1 - y0));
      return r0 + (r1 - r0) * t;
    }
  }
  return p[p.length - 1][0];
}

/** Inside the cup: where the liquid sits. */
const radiusAt = (g: Geom, y: number) => walk(g.inner, y);
/** Outside the cup: where the sleeve wraps. */
const outerAt = (g: Geom, y: number) => walk(g.outer, y);

/** Height the liquid starts from: just above the inside of the base. */
const floorY = (g: Geom) => g.inner[0][1] + 0.02;

/* ── Textures ────────────────────────────────────────────── */

/**
 * Height of the crown of the foam dome.
 *
 * The dome is a spherical cap of radius 0.7 swept to 0.44π, so it stands
 * 0.7 * (1 - cos(0.44π)) tall before scaling. Guessing this number is what
 * let the dome poke through the latte art as a circle on thin foam.
 */
const CAP_RISE = 0.7 * (1 - Math.cos(Math.PI * 0.44));
const foamApex = (coverage: number, height: number) => 0.012 + CAP_RISE * coverage * (height / 0.7);

/* ── Latte art ───────────────────────────────────────────── */

/**
 * The pattern, drawn to a canvas and laid on the brew as a transparent map.
 *
 * Real latte art is milk poured through crema, so it is never a hard-edged
 * stamp: every shape is drawn with a soft outer glow so it bleeds into the
 * surface the way poured milk does.
 */
function useArtTexture(art: string) {
  return useMemo(() => {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const mid = size / 2;

    ctx.clearRect(0, 0, size, size);
    if (art === 'none') return finish(c);

    // Poured milk is brighter than the crema but not white, and it feathers
    // at every edge because it is displacing foam, not sitting on top of it.
    ctx.fillStyle = '#FFFAF0';
    ctx.strokeStyle = '#FFFAF0';
    ctx.shadowColor = 'rgba(255,248,236,0.9)';
    ctx.shadowBlur = 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    /** One heart, pointing down the cup towards the handle. */
    const heart = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + r);
      ctx.bezierCurveTo(cx - r * 1.5, cy - r * 0.35, cx - r * 0.55, cy - r * 1.2, cx, cy - r * 0.4);
      ctx.bezierCurveTo(cx + r * 0.55, cy - r * 1.2, cx + r * 1.5, cy - r * 0.35, cx, cy + r);
      ctx.fill();
    };

    if (art === 'heart') {
      heart(mid, mid - size * 0.02, size * 0.3);
    }

    if (art === 'rosetta') {
      // A rosetta is a stack of arcs that narrow towards the stem, left and
      // right alternating, then a line pulled straight through the middle.
      const leaves = 9;
      for (let i = 0; i < leaves; i++) {
        const t = i / (leaves - 1);
        const y = mid - size * 0.34 + t * size * 0.62;
        const w = (1 - t) ** 0.7 * size * 0.31 + size * 0.025;
        const h = size * 0.072 * (1 - t * 0.4);
        ctx.beginPath();
        ctx.ellipse(mid, y, w, h, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineWidth = size * 0.026;
      ctx.beginPath();
      ctx.moveTo(mid, mid - size * 0.4);
      ctx.lineTo(mid, mid + size * 0.4);
      ctx.stroke();
    }

    if (art === 'tulip') {
      // Stacked hearts, biggest at the base.
      const bulbs = 3;
      for (let i = 0; i < bulbs; i++) {
        const t = i / (bulbs - 1);
        heart(mid, mid + size * 0.24 - t * size * 0.46, size * (0.26 - t * 0.1));
      }
    }

    if (art === 'swan') {
      // Rosetta wing, then the neck curving up into a head.
      const leaves = 6;
      for (let i = 0; i < leaves; i++) {
        const t = i / (leaves - 1);
        ctx.beginPath();
        ctx.ellipse(
          mid + size * 0.08,
          mid + size * 0.04 + t * size * 0.3,
          (1 - t) ** 0.7 * size * 0.26 + size * 0.02,
          size * 0.072 * (1 - t * 0.35),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.lineWidth = size * 0.05;
      ctx.beginPath();
      ctx.moveTo(mid + size * 0.05, mid - size * 0.03);
      ctx.bezierCurveTo(
        mid - size * 0.24,
        mid - size * 0.18,
        mid - size * 0.3,
        mid - size * 0.38,
        mid - size * 0.09,
        mid - size * 0.41,
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(
        mid - size * 0.068,
        mid - size * 0.418,
        size * 0.048,
        size * 0.036,
        0.3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // Feather the whole pattern, then break its surface up with the same
    // bubble structure the foam has. Without this it reads as a sticker.
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 2600; i++) {
      const r = 0.8 + Math.random() * 3.2;
      ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.16})`;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fade the outer rim so the pattern dissolves into the crema rather than
    // ending on a cut line.
    const fade = ctx.createRadialGradient(mid, mid, size * 0.44, mid, mid, size * 0.5);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'source-over';

    return finish(c);

    function finish(canvas: HTMLCanvasElement) {
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      t.generateMipmaps = false;
      t.minFilter = THREE.LinearFilter;
      return t;
    }
  }, [art]);
}

function LatteArt({
  played,
  art,
  y,
  radius,
  lift,
}: {
  played: Clock;
  art: string;
  y: number;
  radius: number;
  lift: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const texture = useArtTexture(art);
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(() => {
    if (!mesh.current) return;
    // Poured in at the tail of the milk, after the surface has settled.
    const t = easeOut(seg(played.current[2], 0.55, 1));
    mesh.current.visible = t > 0.01;
    // Sits on the crown of the foam, not beneath it.
    mesh.current.position.y = y + lift + 0.006;
    // Grows outward from the centre, the way the pattern actually forms.
    // Planar UVs, so the drawing lands at the size it was drawn. Fills the
    // brew nearly to the wall, the way a pour actually does.
    const k = (radius / 0.8) * t;
    mesh.current.scale.set(k, k, 1);
    (mesh.current.material as THREE.MeshPhysicalMaterial).opacity = t * 0.95;
  });

  if (art === 'none') return null;

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <circleGeometry args={[0.8, 96]} />
      <meshPhysicalMaterial
        map={texture}
        // Lit, not emissive. Poured milk sits in the same light as the foam
        // it displaced, so it has to shade with it.
        transparent
        opacity={0}
        depthWrite={false}
        roughness={0.72}
        sheen={0.6}
        sheenColor="#FFF4E2"
        envMapIntensity={0.8}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  );
}

/* ── Stage 1 · the beans ─────────────────────────────────── */

const BEAN_COUNT = 14;

function Beans({ played, color }: { played: Clock; color: string }) {
  const group = useRef<THREE.Group>(null);
  const maps = usePbr(beanSet);

  /**
   * A real bean, not a squashed ball.
   *
   * Scaling a sphere gives an egg, which is why these never looked right no
   * matter what texture went on them. A coffee bean has three features and it
   * needs all of them: an oblate body, one face pressed flat, and a deep crease
   * running down that face with a slight S to it. So displace the vertices.
   */
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(0.5, 40, 28);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    const halfY = 0.5 * 0.76;

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // Oblate body: long axis, shorter across, shallow through.
      v.y *= 0.76;
      v.z *= 0.66;

      if (v.z > 0) {
        // The flat face. A bean is pressed, not round, on this side.
        v.z *= 0.72;

        // The crease: a narrow trough down the face that wanders slightly,
        // deepest at the middle and closing towards each end.
        const sBend = Math.sin((v.y / halfY) * 1.9) * 0.055;
        const dx = v.x - sBend;
        const trough = Math.exp(-(dx * dx) / 0.01);
        const ends = 1 - Math.min(1, Math.abs(v.y) / halfY) ** 1.6;
        v.z -= trough * 0.165 * (0.25 + 0.75 * ends);

        // Either side of the crease the face swells, the way the two halves do.
        const lobe = Math.exp(-((Math.abs(dx) - 0.2) ** 2) / 0.02);
        v.z += lobe * 0.022 * ends;
      } else {
        // The back is a smooth dome, slightly fuller than the front.
        v.z *= 1.06;
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const beans = useMemo(
    () =>
      Array.from({ length: BEAN_COUNT }, (_, i) => {
        const a = (i / BEAN_COUNT) * Math.PI * 2 + Math.random() * 0.4;
        const r = 0.22 + Math.random() * 0.5;
        return {
          pos: [Math.cos(a) * r, Math.random() * 0.12, Math.sin(a) * r] as const,
          rot: [Math.random() * 3, Math.random() * 3, Math.random() * 3] as const,
          size: 0.2 + Math.random() * 0.07,
          delay: Math.random() * 0.35,
          spin: (Math.random() - 0.5) * 5,
        };
      }),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    const reveal = played.current[0];
    // The pile empties over the first third of the pour stage.
    const fall = seg(played.current[1], 0, 0.3);

    group.current.children.forEach((child, i) => {
      const b = beans[i];
      // Staggered on both ends, so the pile fills and empties bean by bean.
      const show = clamp01((reveal - b.delay) / (1 - b.delay));
      const drop = easeInOut(clamp01((fall - b.delay * 0.5) / (1 - b.delay * 0.5)));

      child.visible = show > 0.01 && drop < 0.995;
      child.scale.setScalar(b.size * easeOut(show) * (1 - drop * 0.15));

      // Falling beans converge over the cup mouth before dropping inside.
      const x = THREE.MathUtils.lerp(b.pos[0], b.pos[0] * 0.18, drop);
      const z = THREE.MathUtils.lerp(b.pos[2], b.pos[2] * 0.18, drop);
      const lift = (1 - easeOut(show)) * 1.2;
      child.position.set(x, THREE.MathUtils.lerp(b.pos[1] + lift, -1.5, drop), z);
      child.rotation.set(b.rot[0] + time * 0.25, b.rot[1] + time * 0.4 + drop * b.spin, b.rot[2]);
    });
  });

  return (
    <group ref={group} position={[0, 2.42, 0]}>
      {beans.map((_, i) => (
        <group key={i}>
          <mesh geometry={geometry}>
            <meshPhysicalMaterial
              color={color}
              {...maps}
              roughness={0.6}
              normalScale={new THREE.Vector2(0.75, 0.75)}
              // Roast oils, which is the shine on a darker bean.
              clearcoat={0.45}
              clearcoatRoughness={0.35}
              sheen={0.25}
              sheenColor="#FFD9A8"
              envMapIntensity={1.1}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── The pour ────────────────────────────────────────────── */

/** A falling stream. It exists only while liquid is actually moving. */
function Stream({
  activeRef,
  surfaceRef,
  radius,
  color,
  offsetX = 0,
}: {
  activeRef: MutableRefObject<number>;
  surfaceRef: MutableRefObject<number>;
  radius: number;
  color: string;
  offsetX?: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const FROM = 3.3;

  useFrame((state) => {
    if (!mesh.current) return;
    const active = activeRef.current;
    const to = surfaceRef.current;
    const height = Math.max(0.01, FROM - to);

    mesh.current.visible = active > 0.01;
    mesh.current.scale.set(1, height, 1);
    mesh.current.position.set(offsetX, to + height / 2, 0);
    // A little wobble, so it is not a rigid tube.
    mesh.current.rotation.z = Math.sin(state.clock.elapsedTime * 9) * 0.012;
    (mesh.current.material as THREE.MeshPhysicalMaterial).opacity = active;
  });

  return (
    <mesh ref={mesh} visible={false}>
      <cylinderGeometry args={[radius * 0.72, radius, 1, 20, 1, true]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.12}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Rings spreading out from where the stream lands. */
function Splash({
  activeRef,
  surfaceRef,
  radius,
  color,
}: {
  activeRef: MutableRefObject<number>;
  surfaceRef: MutableRefObject<number>;
  radius: number;
  color: string;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    const active = activeRef.current;
    group.current.position.y = surfaceRef.current + 0.004;

    group.current.children.forEach((child, i) => {
      const life = (time * 1.5 + i * 0.33) % 1;
      const mesh = child as THREE.Mesh;
      mesh.visible = active > 0.01;
      mesh.scale.setScalar(THREE.MathUtils.lerp(0.12, radius / 0.4, life));
      (mesh.material as THREE.MeshBasicMaterial).opacity = active * (1 - life) * 0.35;
    });
  });

  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.4, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Pour({
  played,
  scene,
  g,
  fillY,
  fillRadius,
}: {
  played: Clock;
  scene: Scene;
  g: Geom;
  fillY: number;
  fillRadius: number;
}) {
  const brew = useRef(0);
  const milk = useRef(0);
  const surface = useRef(floorY(g));

  useFrame(() => {
    const pourT = played.current[1];
    const milkT = played.current[2];
    // Each stream fades in as its pour starts and out before it finishes.
    brew.current = seg(pourT, 0.26, 0.36) * (1 - seg(pourT, 0.84, 0.96));
    milk.current = scene.hasMilk ? seg(milkT, 0.18, 0.3) * (1 - seg(milkT, 0.72, 0.9)) : 0;
    surface.current = THREE.MathUtils.lerp(floorY(g), fillY, easeInOut(seg(pourT, 0.28, 0.86)));
  });

  return (
    <>
      <Stream activeRef={brew} surfaceRef={surface} color={scene.brewed} radius={0.075} />
      <Stream
        activeRef={milk}
        surfaceRef={surface}
        color={scene.milkTint}
        radius={0.058}
        offsetX={0.2}
      />
      <Splash activeRef={brew} surfaceRef={surface} radius={fillRadius} color={scene.brewed} />
    </>
  );
}

/** The ring of liquid pulled up the cup wall by surface tension. */
function Meniscus({
  played,
  g,
  fillY,
  colorRef,
}: {
  played: Clock;
  g: Geom;
  fillY: number;
  colorRef: React.RefObject<THREE.MeshPhysicalMaterial | null>;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame(() => {
    if (!mesh.current) return;
    const pouring = seg(played.current[1], 0.28, 0.86);
    const y = THREE.MathUtils.lerp(floorY(g), fillY, easeInOut(pouring));
    const r = radiusAt(g, y) * 0.965;
    mesh.current.visible = pouring > 0.004;
    mesh.current.position.y = y + 0.012;
    // The torus lies in XY, so after the -90° turn its local Z is world up.
    const k = r / 0.8;
    mesh.current.scale.set(k, k, 1);
    // It is the same liquid, a shade deeper where it is thicker.
    if (mat.current && colorRef.current) {
      mat.current.color.copy(colorRef.current.color).multiplyScalar(0.86);
    }
  });

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <torusGeometry args={[0.8, 0.026, 8, 48]} />
      <meshPhysicalMaterial ref={mat} roughness={0.1} clearcoat={1} clearcoatRoughness={0.05} />
    </mesh>
  );
}

/* ── Steam ───────────────────────────────────────────────── */

const STEAM_COUNT = 18;

function Steam({ played, y, active }: { played: Clock; y: number; active: boolean }) {
  const group = useRef<THREE.Group>(null);

  // A soft blob drawn once. No image to ship.
  const texture = useMemo(() => {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  const wisps = useMemo(
    () =>
      Array.from({ length: STEAM_COUNT }, (_, i) => ({
        phase: i / STEAM_COUNT + Math.random() * 0.04,
        speed: 0.15 + Math.random() * 0.1,
        drift: (Math.random() - 0.5) * 0.55,
        offsetX: (Math.random() - 0.5) * 0.5,
        offsetZ: (Math.random() - 0.5) * 0.5,
        scale: 0.45 + Math.random() * 0.6,
      })),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    // Steam only once there is hot liquid to rise off.
    const settled = seg(played.current[1], 0.7, 1);
    group.current.position.y = y + 0.04;

    group.current.children.forEach((child, i) => {
      const w = wisps[i];
      const life = (time * w.speed + w.phase) % 1;
      const mesh = child as THREE.Sprite;
      mesh.position.set(
        w.offsetX + Math.sin(time * 0.6 + w.phase * 9) * 0.16 + w.drift * life,
        life * 1.7,
        w.offsetZ + Math.cos(time * 0.5 + w.phase * 7) * 0.13,
      );
      mesh.scale.setScalar((0.32 + life * 1.6) * w.scale);
      const fade = Math.sin(Math.PI * Math.min(1, life * 1.15)) ** 1.6;
      (mesh.material as THREE.SpriteMaterial).opacity = active ? fade * 0.3 * settled : 0;
    });
  });

  return (
    <group ref={group}>
      {wisps.map((w, i) => (
        <sprite key={i} scale={w.scale}>
          <spriteMaterial
            map={texture}
            color="#FFFFFF"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}

/**
 * A blended drink is not liquid with a surface, it is crushed ice suspended in
 * it. So: a soft mound rather than a disc, with a coarse surface that catches
 * light in grains instead of reflecting the room.
 */
function Slush({
  played,
  y,
  radius,
  color,
}: {
  played: Clock;
  y: number;
  radius: number;
  color: string;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const grit = useMemo(() => {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, size, size);
    // Crushed ice: angular chips, not round bubbles.
    for (let i = 0; i < 1800; i++) {
      const x = Math.random() * size;
      const y2 = Math.random() * size;
      const r = 1.5 + Math.random() * 4;
      const v = 96 + Math.random() * 70;
      ctx.fillStyle = `rgba(${v},${v},255,0.5)`;
      ctx.beginPath();
      ctx.moveTo(x, y2 - r);
      ctx.lineTo(x + r, y2);
      ctx.lineTo(x, y2 + r * 0.7);
      ctx.lineTo(x - r * 0.8, y2);
      ctx.closePath();
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    return t;
  }, []);
  useEffect(() => () => grit.dispose(), [grit]);

  useFrame(() => {
    if (!mesh.current) return;
    const t = easeOut(seg(played.current[1], 0.55, 1));
    mesh.current.visible = t > 0.01;
    mesh.current.position.y = y - 0.015;
    /**
     * The cap is 0.8 radius swept to 0.46π, so it already stands 0.70 tall
     * before anything scales it. Multiplying that by 1.3 gave a mound almost
     * as tall as the cup is wide, which is the egg. A frappé heaps maybe a
     * fifth of its width, so the vertical scale has to bring 0.70 down to
     * about 0.20, not push it past it.
     */
    const k = (radius / 0.8) * t;
    mesh.current.scale.set(k * 1.02, t * 0.29, k * 0.97);
    // Just enough lean to be out of round, not enough to read as tilted.
    mesh.current.rotation.set(0.02, mesh.current.rotation.y + 0.0012, 0.015);
  });

  return (
    <mesh ref={mesh} visible={false}>
      <sphereGeometry args={[0.8, 48, 22, 0, Math.PI * 2, 0, Math.PI * 0.46]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.86}
        normalMap={grit}
        normalScale={new THREE.Vector2(1.3, 1.3)}
        // Crushed ice in liquid is wet, so it catches a little of the room
        // rather than going entirely chalky.
        clearcoat={0.35}
        clearcoatRoughness={0.55}
        sheen={0.75}
        sheenColor="#EAF4FF"
        envMapIntensity={1.1}
      />
    </mesh>
  );
}

/* ── Ice ─────────────────────────────────────────────────── */

const ICE_COUNT = 11;

function Ice({ played, y, radius }: { played: Clock; y: number; radius: number }) {
  const group = useRef<THREE.Group>(null);
  const ice = usePbr(iceSet);

  const cubes = useMemo(
    () =>
      Array.from({ length: ICE_COUNT }, (_, i) => {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * 0.62;
        return {
          pos: [Math.cos(a) * r, -0.05 - Math.random() * 0.42, Math.sin(a) * r] as const,
          rot: [Math.random() * 3, Math.random() * 3, Math.random() * 3] as const,
          size: 0.19 + Math.random() * 0.09,
          // No two cubes come out of a tray the same shape.
          stretch: [
            0.86 + Math.random() * 0.3,
            0.8 + Math.random() * 0.34,
            0.86 + Math.random() * 0.3,
          ] as const,
          // Cloudier cubes scatter more and transmit less.
          cloud: Math.random(),
          bob: 0.4 + Math.random() * 0.6,
          delay: i / ICE_COUNT,
        };
      }),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    // Cubes go in once the cup is nearly full, one after another.
    const reveal = seg(played.current[1], 0.6, 1);
    group.current.position.y = y;

    group.current.children.forEach((child, i) => {
      const c = cubes[i];
      const t = easeOut(clamp01((reveal - c.delay * 0.55) / (1 - c.delay * 0.55)));
      child.visible = t > 0.01;
      child.scale.set(
        c.size * c.stretch[0] * t,
        c.size * c.stretch[1] * t,
        c.size * c.stretch[2] * t,
      );
      child.position.set(
        c.pos[0],
        THREE.MathUtils.lerp(1.4, c.pos[1], t) + Math.sin(time * c.bob + i) * 0.012 * t,
        c.pos[2],
      );
    });
  });

  return (
    <group ref={group} scale={[radius / 0.8, 1, radius / 0.8]}>
      {cubes.map((c, i) => (
        <RoundedBox key={i} args={[1, 1, 1]} radius={0.14} smoothness={2} rotation={c.rot}>
          <meshPhysicalMaterial
            color="#F4FBFF"
            // Refraction is back, but only here. Every transmissive material
            // costs three.js a screen-sized buffer and a second render of the
            // scene, so one shared material across eleven cubes is the budget.
            {...ice}
            roughness={0.18 + c.cloud * 0.3}
            transmission={0.82 - c.cloud * 0.25}
            thickness={0.45 + c.cloud * 0.4}
            ior={1.309}
            attenuationColor="#C6E2F5"
            attenuationDistance={1.4}
            normalScale={new THREE.Vector2(0.45, 0.45)}
            clearcoat={1}
            clearcoatRoughness={0.05 + c.cloud * 0.2}
            envMapIntensity={1.8}
          />
        </RoundedBox>
      ))}
    </group>
  );
}

/* ── Whipped cream ───────────────────────────────────────── */

function Cream({ played, y, radius }: { played: Clock; y: number; radius: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const cream = usePbr(creamSet);

  const geometry = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const steps = 120;
    const coils = 4;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Each coil bulges then tucks under the next one. That overhang is the
      // whole reason piped cream looks piped and a cone does not.
      const taper = (1 - t) ** 0.62 * 0.66 + 0.035;
      const coil = Math.sin(t * Math.PI * 2 * coils) * 0.055 * (1 - t * 0.45);
      // The tip flicks over at the very end, the way the nozzle lifts away.
      const tip = t > 0.92 ? (t - 0.92) * 1.4 : 0;
      pts.push(new THREE.Vector2(Math.max(0.012, taper + coil - tip), t * 0.86));
    }
    return new THREE.LatheGeometry(pts, 48);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    if (!mesh.current) return;
    const t = easeOut(played.current[3]);
    mesh.current.visible = t > 0.01;
    // Piped from the base up: it gains height before it gains width.
    const w = (radius / 0.8) * clamp01(t * 1.6);
    mesh.current.scale.set(w, t, w);
    mesh.current.position.y = y;
    mesh.current.rotation.y = (1 - t) * 2.4;
  });

  return (
    <mesh ref={mesh} visible={false}>
      <primitive object={geometry} attach="geometry" />
      <meshPhysicalMaterial
        color="#FFFCF6"
        roughness={0.88}
        // Dairy scatters light a short way in. Without it cream reads as vinyl.
        sheen={0.85}
        sheenRoughness={0.6}
        sheenColor="#FFF4E2"
        clearcoat={0.04}
        envMapIntensity={0.6}
      />
    </mesh>
  );
}

/* ── Cinnamon ────────────────────────────────────────────── */

const DUST_COUNT = 90;

/** Ground cinnamon, as scattered grains. A tinted disc reads as a plate. */
function Cinnamon({
  played,
  scene,
  fillY,
  fillRadius,
}: {
  played: Clock;
  scene: Scene;
  fillY: number;
  fillRadius: number;
}) {
  const inst = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Dust lands heavier near the middle, the way it falls off a shaker.
  const spread = scene.cream ? 0.42 : 0.86;
  const grains = useMemo(
    () =>
      Array.from({ length: DUST_COUNT }, () => {
        const a = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.62);
        return {
          a,
          r,
          size: 0.012 + Math.random() * 0.026,
          rot: Math.random() * Math.PI,
          delay: Math.random(),
          shade: 0.72 + Math.random() * 0.42,
        };
      }),
    [],
  );

  useFrame(() => {
    if (!inst.current) return;
    const t = easeOut(seg(played.current[3], 0.35, 1));
    inst.current.visible = t > 0.01;

    grains.forEach((g, i) => {
      // Grains land one after another rather than all at once.
      const land = clamp01((t - g.delay * 0.5) / (1 - g.delay * 0.5));
      const r = g.r * fillRadius * spread;
      // On cream the grains have to follow the cone, or they read as a decal
      // hovering over it. Height and tilt both come from the swirl's slope.
      const onCream = scene.cream;
      const rest = onCream ? (1 - g.r) ** 1.4 * 0.62 : 0;
      const slope = onCream ? -0.85 : 0;
      dummy.position.set(
        Math.cos(g.a) * r,
        THREE.MathUtils.lerp(0.5, rest, easeOut(land)),
        Math.sin(g.a) * r,
      );
      dummy.rotation.set(-Math.PI / 2 + slope, 0, g.a + g.rot);
      dummy.scale.setScalar(g.size * land);
      dummy.updateMatrix();
      inst.current!.setMatrixAt(i, dummy.matrix);
    });
    inst.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={inst}
      args={[undefined, undefined, DUST_COUNT]}
      position={[0, fillY + (scene.cream ? 0.02 : 0.014), 0]}
      visible={false}
    >
      <circleGeometry args={[1, 5]} />
      <meshStandardMaterial
        color="#8A5323"
        roughness={1}
        // Ground spice is matte and slightly warm, never glossy.
        metalness={0}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

/** Fired porcelain glaze. High clearcoat over a near-matte body is what
 *  separates china from white plastic. */
const GLAZE = {
  color: '#FAFAF8',
  roughness: 0.14,
  clearcoat: 1,
  clearcoatRoughness: 0.035,
  envMapIntensity: 1.5,
  sheen: 0.2,
  sheenColor: '#EAF2FF',
} as const;

/* ── Sugar ───────────────────────────────────────────────── */

const SUGAR_COUNT = 34;

/** Sugar crystals dropping in and sinking. Faceted, not round: a sphere reads
 *  as a bubble, and sugar is cut glass at this scale. */
function Sugar({ played, y, radius }: { played: Clock; y: number; radius: number }) {
  const inst = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const grains = useMemo(
    () =>
      Array.from({ length: SUGAR_COUNT }, () => {
        const a = Math.random() * Math.PI * 2;
        return {
          a,
          r: Math.sqrt(Math.random()) * 0.72,
          size: 0.018 + Math.random() * 0.016,
          rot: [Math.random() * 3, Math.random() * 3, Math.random() * 3] as const,
          delay: Math.random(),
          spin: (Math.random() - 0.5) * 6,
        };
      }),
    [],
  );

  useFrame((state) => {
    if (!inst.current) return;
    const t = easeOut(seg(played.current[3], 0.1, 0.85));
    inst.current.visible = t > 0.01;
    const time = state.clock.elapsedTime;

    grains.forEach((g, i) => {
      const fall = clamp01((t - g.delay * 0.6) / (1 - g.delay * 0.6));
      const r = g.r * radius;
      dummy.position.set(
        Math.cos(g.a) * r,
        // Drops from above the rim, then sinks just under the surface.
        THREE.MathUtils.lerp(1.5, -0.06 - g.delay * 0.1, easeInOut(fall)),
        Math.sin(g.a) * r,
      );
      dummy.rotation.set(g.rot[0] + time * 0.3, g.rot[1] + fall * g.spin, g.rot[2]);
      dummy.scale.setScalar(g.size * clamp01(fall * 3));
      dummy.updateMatrix();
      inst.current!.setMatrixAt(i, dummy.matrix);
    });
    inst.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={inst}
      args={[undefined, undefined, SUGAR_COUNT]}
      position={[0, y, 0]}
      visible={false}
    >
      <boxGeometry args={[1, 0.8, 1]} />
      <meshPhysicalMaterial
        color="#FFFFFF"
        roughness={0.08}
        clearcoat={1}
        clearcoatRoughness={0.03}
        transparent
        opacity={0.95}
      />
    </instancedMesh>
  );
}

/**
 * The handle.
 *
 * A torus was always going to be wrong here: a ring has one centre, and a cup
 * handle has to meet a curved wall at two different heights and two different
 * radii. So this is a tube swept along a curve whose ends land on the wall.
 *
 * Wall radius on the mug profile: 0.62 at y 0.26, 0.78 at 0.48, 0.885 at 0.70.
 * The ends sit just inside those so the joins close.
 */
function Handle() {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.86, 0.78, 0), // upper join, into the wall
      new THREE.Vector3(1.14, 0.83, 0),
      new THREE.Vector3(1.35, 0.67, 0),
      new THREE.Vector3(1.38, 0.47, 0),
      new THREE.Vector3(1.18, 0.33, 0),
      new THREE.Vector3(0.62, 0.29, 0), // lower join, into the wall
    ]);
    return new THREE.TubeGeometry(curve, 48, 0.052, 14, false);
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial {...GLAZE} />
    </mesh>
  );
}

/* ── The cup ─────────────────────────────────────────────── */

function Cup({ scene, stage, animate }: { scene: Scene; stage: number; animate: boolean }) {
  const spin = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Group>(null);
  const liquid = useRef<THREE.Mesh>(null);
  const foam = useRef<THREE.Mesh>(null);
  const sleeve = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const liquidMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const foamMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const sleeveMat = useRef<THREE.MeshStandardMaterial>(null);

  const played = useRef([0, 0, 0, 0, 0]);
  const foamPbr = usePbr(foamSet);
  const brewPbr = usePbr(brewSet);
  const paperPbr = usePbr(paperSet);
  const kraftPbr = usePbr(kraftSet);
  const glazePbr = usePbr(glazeSet);
  const togo = scene.vessel === 'togo';
  const glass = scene.vessel === 'glass';
  const g = glass ? GLASS : togo ? TOGO : MUG;

  const profile = useMemo(() => g.profile.map(([x, y]) => new THREE.Vector2(x, y)), [g]);

  const brewedColor = useMemo(() => new THREE.Color(scene.brewed), [scene.brewed]);
  const finalColor = useMemo(() => new THREE.Color(scene.liquid), [scene.liquid]);
  const sleeveColor = useMemo(() => new THREE.Color(scene.sleeve), [scene.sleeve]);
  const foamColor = useMemo(() => {
    const c = new THREE.Color(scene.liquid);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    return new THREE.Color().setHSL(hsl.h, Math.min(hsl.s, 0.5), Math.min(0.78, hsl.l + 0.28));
  }, [scene.liquid]);

  /**
   * Changing a choice replays that stage and every stage after it, because a
   * later stage is only meaningful on top of the one before it. Rewinding is
   * what makes a change feel like the drink being remade.
   */
  const rewindFrom = (i: number) => {
    for (let n = i; n < played.current.length; n++) played.current[n] = 0;
  };
  useEffect(() => {
    rewindFrom(0);
  }, [scene.bean]);
  useEffect(() => {
    rewindFrom(1);
  }, [scene.brewed, scene.ice, scene.fill]);
  useEffect(() => {
    rewindFrom(2);
  }, [scene.liquid, scene.hasMilk, scene.art, scene.foamHeight, scene.foamRoughness]);
  useEffect(() => {
    rewindFrom(3);
  }, [scene.cream, scene.cinnamon, scene.sugar, scene.syrup]);
  useEffect(() => {
    rewindFrom(4);
  }, [scene.vessel, scene.sleeve]);

  const fillY = g.fillY * scene.fill;
  const fillRadius = radiusAt(g, fillY) * 0.95;
  const scratch = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    const k = damping(delta);

    // Only stages the user has reached advance, and each holds once at 1.
    const top = Math.min(stage, STAGE_SECONDS.length - 1);
    for (let i = 0; i <= top; i++) {
      played.current[i] = animate ? Math.min(1, played.current[i] + delta / STAGE_SECONDS[i]) : 1;
    }
    const [beansT, pourT, milkT, , cupT] = played.current;

    /* The cup lands as soon as the beans are on screen. */
    const land = easeOut(seg(beansT, 0.15, 1));
    if (shell.current) {
      shell.current.position.y = (1 - land) * 1.2;
      shell.current.scale.setScalar(0.94 + land * 0.06);
    }

    /* Stage 2: the brew pours and the level climbs the taper. */
    const pouring = seg(pourT, 0.28, 0.86);
    if (liquid.current) {
      const y = THREE.MathUtils.lerp(floorY(g), fillY, easeInOut(pouring));
      liquid.current.position.y = y;
      liquid.current.scale.setScalar((radiusAt(g, y) * 0.965) / 0.8);
      liquid.current.visible = pouring > 0.004;
    }

    /* Stage 3: the colour shifts while the milk is actually falling. */
    if (liquidMat.current) {
      scratch.copy(brewedColor).lerp(finalColor, easeInOut(seg(milkT, 0.2, 0.85)));
      liquidMat.current.color.lerp(scratch, k);
      liquidMat.current.roughness = THREE.MathUtils.lerp(
        liquidMat.current.roughness,
        scene.gloss,
        k,
      );
    }

    /* Crema forms as the milk settles. */
    const crema = easeOut(seg(milkT, 0.6, 1)) * scene.foam;
    if (foam.current) {
      foam.current.visible = crema > 0.01 && !scene.cream;
      foam.current.position.y = fillY + 0.012;
      // Height is what separates a flat white from a cappuccino, so the dome
      // scales on its own axis rather than uniformly.
      foam.current.scale.set(crema, crema * (scene.foamHeight / 0.7), crema);
    }
    if (foamMat.current) {
      foamMat.current.roughness = THREE.MathUtils.lerp(
        foamMat.current.roughness,
        scene.foamRoughness,
        k,
      );
    }

    /* Stage 5: the sleeve slides on, then the lid caps it. */
    if (sleeveMat.current) sleeveMat.current.color.lerp(sleeveColor, k);
    const cuff = seg(cupT, 0, 0.6);
    if (sleeve.current) {
      sleeve.current.position.y = THREE.MathUtils.lerp(3.0, 0, easeOutBack(cuff));
      sleeve.current.visible = cuff > 0.004;
    }
    if (lid.current) {
      const cap = seg(cupT, 0.45, 1);
      lid.current.position.y = THREE.MathUtils.lerp(3.4, 0, easeOutBack(cap));
      lid.current.visible = cap > 0.004;
    }

    /* The cup turns slowly once there is something in it to look at. */
    if (spin.current) {
      spin.current.scale.setScalar(
        THREE.MathUtils.lerp(spin.current.scale.x || scene.scale, scene.scale, k),
      );
      if (animate) {
        spin.current.rotation.y += delta * (0.08 + 0.2 * easeOut(pourT));
        spin.current.position.y = -1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.025;
      } else {
        spin.current.position.y = -1;
      }
    }
  });

  return (
    <group ref={spin} position={[0, -1, 0]}>
      <group ref={shell}>
        <mesh>
          <latheGeometry args={[profile, 64]} />
          {glass ? (
            <meshPhysicalMaterial
              color="#FFFFFF"
              // Real glass: nearly clear, refracting, with a faint green cast
              // in thickness the way soda-lime actually goes.
              roughness={0.02}
              transmission={0.98}
              thickness={0.38}
              ior={1.52}
              attenuationColor="#DDF2E6"
              attenuationDistance={2.4}
              clearcoat={1}
              clearcoatRoughness={0.02}
              envMapIntensity={2}
              side={THREE.DoubleSide}
            />
          ) : togo ? (
            <meshPhysicalMaterial
              color="#F6F0E4"
              {...paperPbr}
              roughness={0.74}
              normalScale={new THREE.Vector2(0.35, 0.35)}
              clearcoat={0.16}
              clearcoatRoughness={0.55}
              sheen={0.3}
              sheenColor="#FFE9C9"
            />
          ) : (
            <meshPhysicalMaterial {...GLAZE} {...glazePbr} />
          )}
        </mesh>
      </group>

      {!togo && !glass && (
        <>
          <Handle />

          {/* Foot ring. China never sits flat on its whole base. */}
          <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.34, 0.022, 10, 48]} />
            <meshPhysicalMaterial color="#F1F0EA" roughness={0.3} clearcoat={0.55} />
          </mesh>

          {/* Saucer. It has to sit ON the counter, not in it: the counter
              plane is 0.03 below the cup base, so anything under that is
              buried and z-fights. */}
          <mesh position={[0, -0.006, 0]}>
            <cylinderGeometry args={[1.62, 1.46, 0.05, 64]} />
            <meshPhysicalMaterial {...GLAZE} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.54, 0.018, 8, 48]} />
            <meshPhysicalMaterial color="#EDECE6" roughness={0.36} clearcoat={0.45} />
          </mesh>
          <mesh position={[0, -0.028, 0]}>
            <cylinderGeometry args={[1.46, 1.32, 0.03, 64]} />
            <meshPhysicalMaterial color="#F0EFE9" roughness={0.3} clearcoat={0.5} />
          </mesh>
        </>
      )}

      <Beans played={played} color={scene.bean} />

      <mesh ref={liquid} position={[0, fillY, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <circleGeometry args={[0.8, 64]} />
        <meshPhysicalMaterial
          ref={liquidMat}
          color={scene.brewed}
          roughness={scene.gloss}
          metalness={0}
          clearcoat={0.85}
          clearcoatRoughness={0.14}
          envMapIntensity={1.6}
          roughnessMap={brewPbr.roughnessMap}
          clearcoatNormalMap={brewPbr.normalMap}
          clearcoatNormalScale={new THREE.Vector2(0.16, 0.16)}
        />
      </mesh>

      {/* Meniscus: the lip of liquid climbing the wall. A flat disc that meets
          the cup at a hard edge is the tell that it is not really liquid. */}
      <Meniscus played={played} g={g} fillY={fillY} colorRef={liquidMat} />

      <Pour played={played} scene={scene} g={g} fillY={fillY} fillRadius={fillRadius} />

      {scene.blended && (
        <Slush played={played} y={fillY} radius={fillRadius} color={scene.liquid} />
      )}
      <LatteArt
        played={played}
        art={scene.art}
        y={fillY}
        radius={fillRadius * 0.98}
        lift={foamApex(scene.foam, scene.foamHeight)}
      />
      {scene.ice && <Ice played={played} y={fillY} radius={fillRadius} />}
      <Steam played={played} y={fillY + scene.foamHeight} active={scene.hot} />
      {scene.cream && <Cream played={played} y={fillY - 0.02} radius={fillRadius} />}

      <mesh ref={foam} position={[0, fillY + 0.012, 0]} visible={false}>
        <sphereGeometry args={[0.7, 48, 18, 0, Math.PI * 2, 0, Math.PI * 0.44]} />
        <meshPhysicalMaterial
          ref={foamMat}
          color={foamColor}
          {...foamPbr}
          roughness={0.98}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          sheen={0.55}
          sheenColor="#FFF3E0"
          envMapIntensity={0.45}
        />
      </mesh>

      {scene.sugar && <Sugar played={played} y={fillY} radius={fillRadius} />}
      {scene.cinnamon && (
        <Cinnamon played={played} scene={scene} fillY={fillY} fillRadius={fillRadius} />
      )}

      {togo && (
        <>
          <group ref={sleeve} visible={false}>
            <mesh position={[0, (SLEEVE_BOTTOM + SLEEVE_TOP) / 2, 0]}>
              <cylinderGeometry
                args={[
                  outerAt(g, SLEEVE_TOP) + 0.01,
                  outerAt(g, SLEEVE_BOTTOM) + 0.01,
                  SLEEVE_TOP - SLEEVE_BOTTOM,
                  64,
                  1,
                  true,
                ]}
              />
              <meshStandardMaterial
                ref={sleeveMat}
                color={scene.sleeve}
                {...kraftPbr}
                roughness={0.96}
                normalScale={new THREE.Vector2(1.1, 1.1)}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* A cold drink gets a straw, a hot one gets a lid. */}
          {scene.ice || scene.cream ? (
            <group ref={lid} visible={false}>
              <mesh position={[0.22, g.rimY + 0.42, 0.1]} rotation={[0.18, 0, 0.16]}>
                <cylinderGeometry args={[0.055, 0.055, 1.9, 24, 1, true]} />
                <meshPhysicalMaterial color="#F2F4F5" roughness={0.18} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ) : (
            <group ref={lid} visible={false}>
              <mesh position={[0, g.rimY + 0.05, 0]}>
                <cylinderGeometry args={[0.9, 0.87, 0.16, 48]} />
                <meshPhysicalMaterial color="#2A2A28" roughness={0.42} clearcoat={0.3} />
              </mesh>
              <mesh position={[0, g.rimY + 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.3, 0.42, 48, 1, 0, Math.PI * 0.9]} />
                <meshStandardMaterial color="#151514" roughness={0.6} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}
        </>
      )}
    </group>
  );
}

/* ── Camera ──────────────────────────────────────────────── */

/**
 * One framing per stage. A fixed wide shot shows the drink being made but
 * never lets you see any of it, so the camera moves in for the pour and the
 * milk and pulls back out for the finished cup, the way a product film cuts.
 *
 * Positions are world space. The cup group sits at y = -1, so its rim is at
 * world y = 1 and the brew surface at roughly 0.85.
 */
const FRAMINGS: { pos: [number, number, number]; look: [number, number, number] }[] = [
  // Beans hovering over an empty cup: high and slightly off-axis.
  { pos: [0.9, 2.7, 5.6], look: [0, 1.05, 0] },
  // The pour: wide enough to hold the whole falling stream.
  { pos: [0.1, 2.0, 8.8], look: [0, 0.15, 0] },
  // Milk going in: over the rim, looking down at the surface.
  { pos: [0.5, 3.1, 4.5], look: [0, 0.8, 0] },
  // Extras: closer still, because this is all surface detail.
  { pos: [0.6, 2.7, 3.9], look: [0, 0.92, 0] },
  // Finished: back out to the full shot with the counter in frame.
  { pos: [0, 1.75, 9.2], look: [0, 0.05, 0] },
];

function CameraRig({ stage, animate }: { stage: number; animate: boolean }) {
  const target = useMemo(() => new THREE.Vector3(0, 0.05, 0), []);
  const wanted = useMemo(() => new THREE.Vector3(), []);
  const wantedLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const f = FRAMINGS[Math.min(stage, FRAMINGS.length - 1)];
    const time = state.clock.elapsedTime;

    // A breath of drift, so a held shot is never dead still.
    const sway = animate ? Math.sin(time * 0.25) * 0.16 : 0;
    const rise = animate ? Math.sin(time * 0.19) * 0.07 : 0;
    wanted.set(f.pos[0] + sway, f.pos[1] + rise, f.pos[2]);

    // Slow enough to read as a move, fast enough not to feel stuck.
    const k = 1 - Math.pow(0.06, delta);
    state.camera.position.lerp(wanted, k);
    wantedLook.set(f.look[0], f.look[1], f.look[2]);
    target.lerp(wantedLook, k);
    state.camera.lookAt(target);
  });

  return null;
}

/* ── The set ─────────────────────────────────────────────── */

/** Brushed-concrete counter with a real reflection, plus a studio sweep
 *  behind it. Floating on flat white is what read as a render rather than a
 *  photograph: the cup had no surface and nothing to sit in. */
function Counter() {
  const stone = usePbr(stoneSet);

  return (
    <>
      <mesh position={[0, -1.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 26]} />
        {/* A mirror material renders its own passes, which is memory this
            scene does not have to spare. A polished stone surface with a real
            roughness map gives the sheen for the cost of one texture. */}
        <meshPhysicalMaterial
          color="#3A3028"
          {...stone}
          // Dark and polished: it picks the room up as a reflection rather
          // than competing with it as another invented material.
          roughness={0.34}
          normalScale={new THREE.Vector2(0.22, 0.22)}
          metalness={0.1}
          clearcoat={0.7}
          clearcoatRoughness={0.22}
          envMapIntensity={1.3}
        />
      </mesh>
    </>
  );
}

/**
 * The room, used twice: as the reflection in the glaze and as what you see
 * behind the cup. Shown blurred, so it reads as depth rather than competing
 * with the drink.
 */
function CafeEnv() {
  // Suspense waits on the photograph, so the scene never renders half-lit.
  const photo = useLoader(THREE.ImageLoader, '/env/cafe-interior.jpg');
  const map = useMemo(() => makeCafeHdri(photo), [photo]);
  useEffect(() => () => map.dispose(), [map]);
  return <Environment map={map} background backgroundBlurriness={0.6} environmentIntensity={1.0} />;
}

/* ── Scene ───────────────────────────────────────────────── */

export default function BuilderCup({
  scene,
  stage,
  animate,
}: {
  scene: Scene;
  stage: number;
  animate: boolean;
}) {
  return (
    <Canvas
      dpr={1}
      camera={{ position: [0, 1.75, 9.2], fov: 26 }}
      gl={{ antialias: true, toneMappingExposure: 1.0 }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <CafeEnv />
      </Suspense>

      <ambientLight intensity={0.3} color="#F2F6F8" />
      <directionalLight position={[3.6, 6, 4]} intensity={2.1} color="#FFF8F0" />
      <directionalLight position={[-4.5, 2, -3]} intensity={0.6} color="#BFD8FF" />

      <CameraRig stage={stage} animate={animate} />
      <Counter />
      <Cup scene={scene} stage={stage} animate={animate} />

      {/* Tight contact shadow on top of the reflection: the reflection places
          the cup, the shadow is what makes it touch. */}
      <ContactShadows
        position={[0, -1.018, 0]}
        opacity={0.55}
        scale={5}
        blur={1.5}
        far={1.6}
        resolution={512}
        color="#3A342C"
      />
    </Canvas>
  );
}
