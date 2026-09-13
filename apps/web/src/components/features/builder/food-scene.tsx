'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { FoodKind } from '@/lib/product-scene';
import { CafeEnv, Counter, GLAZE, Steam, easeOut, easeOutBack, seg, usePbr } from './builder-cup';
import { beanSet, crustSet, paperSet, type PbrSet } from './builder-textures';
import { QualityContext, useQuality, useSceneLoop } from './render-budget';
import { useDeviceQuality, type Quality } from '@/lib/device-quality';

/**
 * Everything on the menu that is not poured.
 *
 * Same set, light and counter as the drinks, so a croissant and a flat white
 * look like they came from the same bar. Each item is procedural: a swept tube
 * for anything rolled (croissant, cinnamon roll), lathes for bowls, rounded
 * boxes and extrusions for the rest, all sharing one baked-crust texture set
 * tinted per bake. No model files to download or keep in sync with the menu.
 *
 * The timeline mirrors the cup: the plate or the box lands, the item drops
 * onto it, then it is served. For here the plate is set down; to go, the box
 * lid closes over it. That last beat is what `replay` plays again when someone
 * taps Add.
 */

const LAND_END = 0.8;
const DROP: [number, number] = [0.6, 1.8];
const CLOSE: [number, number] = [1.9, 3.1];
const TOTAL = 3.3;

const easeOutBounce = (x: number) => {
  const n = 7.5625;
  const d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
};

/** A geometry built once and released with the component. */
function useGeometry<T extends THREE.BufferGeometry>(make: () => T, deps: unknown[] = []): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are the caller's
  const g = useMemo(make, deps);
  useEffect(() => () => g.dispose(), [g]);
  return g;
}

/**
 * A tube whose radius changes along its length and around its section.
 *
 * TubeGeometry only does a constant radius, and a constant radius is exactly
 * what makes a croissant look like a sausage. Winding and normals follow
 * TubeGeometry so lighting matches the rest of three.js.
 */
function sweep(
  curve: THREE.Curve<THREE.Vector3>,
  radius: (t: number, a: number) => number,
  tubular = 140,
  radial = 28,
) {
  const frames = curve.computeFrenetFrames(tubular, false);
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, p);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const r = radius(t, a);
      n.copy(frames.normals[i])
        .multiplyScalar(-Math.cos(a))
        .addScaledVector(frames.binormals[i], Math.sin(a));
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
      uv.push(t * 4, j / radial);
    }
  }
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Scattered positions that stay put between renders. */
function useScatter(count: number, place: (i: number) => [number, number, number]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- placed once
  return useMemo(() => Array.from({ length: count }, (_, i) => place(i)), [count]);
}

type Crust = PbrSet;

/* ── Pastries ────────────────────────────────────────────── */

function Croissant({ crust }: { crust: Crust }) {
  const geo = useGeometry(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.95, 0, 0.38),
      new THREE.Vector3(-0.62, 0, -0.08),
      new THREE.Vector3(0, 0, -0.3),
      new THREE.Vector3(0.62, 0, -0.08),
      new THREE.Vector3(0.95, 0, 0.38),
    ]);
    return sweep(curve, (t) => {
      const body = 0.07 + 0.35 * Math.pow(Math.sin(Math.PI * t), 0.9);
      // Laminated dough is rolled in bands, and each band bulges.
      const bands = 1 + 0.14 * Math.pow(Math.abs(Math.sin(t * Math.PI * 7)), 0.6);
      return body * bands;
    });
  });
  return (
    <mesh geometry={geo} scale={[1, 0.72, 1]} position={[0, 0.33, 0]}>
      <meshPhysicalMaterial
        color="#D18E43"
        {...crust}
        roughness={0.5}
        // Egg wash: a thin shine that catches the room.
        clearcoat={0.6}
        clearcoatRoughness={0.3}
      />
    </mesh>
  );
}

function PainAuChocolat({ crust }: { crust: Crust }) {
  return (
    <group position={[0, 0.25, 0]}>
      <RoundedBox args={[1.6, 0.46, 0.95]} radius={0.2} smoothness={5}>
        <meshPhysicalMaterial
          color="#CF8C45"
          {...crust}
          roughness={0.52}
          clearcoat={0.55}
          clearcoatRoughness={0.3}
        />
      </RoundedBox>
      {/* The folds on top, each a shade darker where the oven got to it. */}
      {[-0.45, 0, 0.45].map((x) => (
        <RoundedBox
          key={x}
          args={[0.32, 0.1, 0.88]}
          radius={0.05}
          smoothness={3}
          position={[x, 0.22, 0]}
        >
          <meshPhysicalMaterial color="#B6722E" {...crust} roughness={0.5} clearcoat={0.5} />
        </RoundedBox>
      ))}
      {/* Two sticks of chocolate showing at each end, as in the real thing. */}
      {[-0.8, 0.8].flatMap((x) =>
        [-0.2, 0.2].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.01, z]}>
            <boxGeometry args={[0.08, 0.1, 0.2]} />
            <meshPhysicalMaterial color="#3A2215" roughness={0.35} clearcoat={0.4} />
          </mesh>
        )),
      )}
    </group>
  );
}

function CinnamonRoll({ crust }: { crust: Crust }) {
  const coil = useGeometry(() => {
    const pts: THREE.Vector3[] = [];
    const turns = 3.3;
    for (let i = 0; i <= 200; i++) {
      const th = (i / 200) * turns * Math.PI * 2;
      const r = 0.06 + 0.13 * (th / (Math.PI * 2));
      pts.push(new THREE.Vector3(Math.cos(th) * r, 0, Math.sin(th) * r));
    }
    return sweep(
      new THREE.CatmullRomCurve3(pts),
      (t) => {
        const start = Math.min(1, 0.4 + t * 20);
        const end = t > 0.96 ? 1 - ((t - 0.96) / 0.04) * 0.55 : 1;
        return 0.135 * start * end;
      },
      320,
      20,
    );
  });
  const icing = useGeometry(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 7; i++) {
      pts.push(new THREE.Vector3(-0.52 + i * 0.15, 0, i % 2 ? 0.42 : -0.42));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.035, 10, false);
  });
  return (
    <group position={[0, 0.25, 0]}>
      <mesh geometry={coil} scale={[1, 1.9, 1]}>
        <meshPhysicalMaterial color="#C47B3A" {...crust} roughness={0.6} clearcoat={0.35} />
      </mesh>
      <mesh geometry={icing} position={[0, 0.27, 0]}>
        <meshPhysicalMaterial
          color="#FFF7EA"
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </group>
  );
}

function Scone({ crust, berries }: { crust: Crust; berries: boolean }) {
  const geo = useGeometry(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.7, -0.42);
    s.quadraticCurveTo(0, -0.6, 0.7, -0.42);
    s.quadraticCurveTo(0.52, 0.12, 0, 0.66);
    s.quadraticCurveTo(-0.52, 0.12, -0.7, -0.42);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.38,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 5,
      curveSegments: 24,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  });
  const dots = useScatter(11, (i) => {
    const a = i * 2.4;
    const r = 0.1 + (i % 4) * 0.12;
    return [Math.cos(a) * r, 0.53 + (i % 3) * 0.01, -Math.sin(a) * r * 0.8 + 0.05];
  });
  return (
    <group position={[0, 0.14, 0]}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#D9A462" {...crust} roughness={0.9} />
      </mesh>
      {berries &&
        dots.map((p, i) => (
          <mesh key={i} position={p} scale={[1, 0.8, 1]}>
            <sphereGeometry args={[0.06, 12, 10]} />
            <meshPhysicalMaterial color="#2E3261" roughness={0.3} clearcoat={0.6} />
          </mesh>
        ))}
    </group>
  );
}

function Cookie({ crust, chips }: { crust: Crust; chips: boolean }) {
  const geo = useGeometry(() => {
    const g = new THREE.CylinderGeometry(0.72, 0.74, 0.14, 56, 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const a = Math.atan2(v.z, v.x);
      // Hand-scooped dough spreads unevenly and cracks as it bakes.
      const edge = 1 + 0.045 * Math.sin(a * 5) + 0.02 * Math.sin(a * 13);
      v.x *= edge;
      v.z *= edge;
      if (v.y > 0) v.y += 0.03 * Math.sin(v.x * 9) * Math.cos(v.z * 7);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
  const bits = useScatter(9, (i) => {
    const a = i * 2.2;
    const r = 0.15 + (i % 3) * 0.17;
    return [Math.cos(a) * r, 0.09, Math.sin(a) * r];
  });
  const one = (
    <>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#C98A4B" {...crust} roughness={0.85} />
      </mesh>
      {chips &&
        bits.map((p, i) => (
          <mesh key={i} position={p} scale={[1, 0.6, 1]} rotation={[i, i * 2, 0]}>
            <dodecahedronGeometry args={[0.07, 0]} />
            <meshPhysicalMaterial color="#35200F" roughness={0.35} clearcoat={0.3} />
          </mesh>
        ))}
    </>
  );
  return (
    <group>
      <group position={[-0.35, 0.08, 0.1]}>{one}</group>
      <group position={[0.45, 0.3, -0.15]} rotation={[0.1, 0.8, 0.32]}>
        {one}
      </group>
    </group>
  );
}

function Muffin({ crust, berries }: { crust: Crust; berries: boolean }) {
  const liner = useGeometry(() => {
    const g = new THREE.CylinderGeometry(0.72, 0.56, 0.56, 64, 1, true);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // The pleats of the paper case.
      const k = 1 + 0.035 * Math.sin(Math.atan2(v.z, v.x) * 24);
      pos.setXYZ(i, v.x * k, v.y, v.z * k);
    }
    g.computeVertexNormals();
    return g;
  });
  const dots = useScatter(8, (i) => {
    const a = i * 2.5;
    return [Math.cos(a) * 0.35, 0.95 - (i % 3) * 0.06, Math.sin(a) * 0.35];
  });
  return (
    <group>
      <mesh geometry={liner} position={[0, 0.28, 0]}>
        <meshPhysicalMaterial color="#EDE4D3" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.5, 0]} scale={[1, 0.78, 1]}>
        <sphereGeometry args={[0.86, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
        <meshPhysicalMaterial color="#B97A3E" {...crust} roughness={0.8} />
      </mesh>
      {berries &&
        dots.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.07, 12, 10]} />
            <meshPhysicalMaterial color="#2E3261" roughness={0.3} clearcoat={0.6} />
          </mesh>
        ))}
    </group>
  );
}

function Loaf({ crust, name, togo }: { crust: Crust; name: string; togo: boolean }) {
  const brownie = /brownie|chocolate/i.test(name);
  const light = /cake|lemon|pound|vanilla/i.test(name);
  const outside = brownie ? '#3A2317' : light ? '#B7803F' : '#6D4426';
  const inside = brownie ? '#4A2C1C' : light ? '#E7C98F' : '#B98452';
  return (
    <group
      rotation={togo ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
      position={togo ? [0, 0.18, 0.5] : [0, 0, 0]}
    >
      {[0, 1].map((i) => (
        <group
          key={i}
          position={[i * 0.34 - 0.17, 0.52, i * 0.12]}
          rotation={[0, 0.25, i ? -0.1 : 0]}
        >
          <RoundedBox args={[1.3, 1.02, 0.32]} radius={0.08} smoothness={3}>
            <meshPhysicalMaterial color={outside} {...crust} roughness={0.8} />
          </RoundedBox>
          {[1, -1].map((s) => (
            <mesh key={s} position={[0, -0.03, s * 0.161]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
              <planeGeometry args={[1.14, 0.86]} />
              <meshPhysicalMaterial color={inside} {...crust} roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ── Savoury ─────────────────────────────────────────────── */

function Bagel({ crust }: { crust: Crust }) {
  const seeds = useScatter(46, (i) => {
    const a = (i / 46) * Math.PI * 2 + (i % 2) * 0.1;
    const b = 0.35 + ((i * 7) % 10) * 0.035;
    const R = 0.55 + 0.28 * Math.cos(b * Math.PI);
    return [Math.cos(a) * R, 0.42 + 0.28 * Math.sin(b * Math.PI) * 0.5, Math.sin(a) * R];
  });
  const flat = [-Math.PI / 2, 0, 0] as [number, number, number];
  return (
    <group position={[0, 0.14, 0]}>
      <mesh rotation={flat} scale={[1, 1, 0.5]}>
        <torusGeometry args={[0.55, 0.28, 24, 56]} />
        <meshPhysicalMaterial color="#C8894A" {...crust} roughness={0.55} clearcoat={0.55} />
      </mesh>
      <mesh rotation={flat} scale={[1, 1, 0.22]} position={[0, 0.15, 0]}>
        <torusGeometry args={[0.58, 0.3, 16, 56]} />
        <meshPhysicalMaterial color="#F5EFE3" roughness={0.65} />
      </mesh>
      {/* Salmon folds: a ring that rises and falls around the bagel. */}
      <mesh rotation={[-Math.PI / 2, 0, 0.3]} scale={[1.02, 1.02, 0.2]} position={[0, 0.23, 0]}>
        <torusGeometry args={[0.6, 0.29, 16, 56]} />
        <meshPhysicalMaterial
          color="#F0875A"
          roughness={0.3}
          clearcoat={0.7}
          sheen={0.4}
          sheenColor="#FFD2B8"
        />
      </mesh>
      <mesh rotation={flat} scale={[1, 1, 0.5]} position={[0, 0.42, 0]}>
        <torusGeometry args={[0.55, 0.28, 24, 56]} />
        <meshPhysicalMaterial color="#C07F42" {...crust} roughness={0.5} clearcoat={0.6} />
      </mesh>
      {seeds.map((p, i) => (
        <mesh key={i} position={p} rotation={[i, i * 1.3, 0]} scale={[1, 0.5, 0.6]}>
          <sphereGeometry args={[0.028, 8, 6]} />
          <meshStandardMaterial color="#F3E6C4" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Sandwich({ crust }: { crust: Crust }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.78, 0.72, 0.3, 48]} />
        <meshPhysicalMaterial color="#C57A34" {...crust} roughness={0.5} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.33, 0]} scale={[1, 1, 1]}>
        <cylinderGeometry args={[0.86, 0.86, 0.05, 20]} />
        <meshPhysicalMaterial color="#6E9B3A" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.74, 0.74, 0.13, 48]} />
        <meshPhysicalMaterial color="#F3C23F" roughness={0.45} clearcoat={0.3} />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.74, 0.06, 10, 48]} />
        <meshPhysicalMaterial color="#FFF6E4" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[1.22, 0.03, 1.22]} />
        <meshPhysicalMaterial color="#F0A73A" roughness={0.4} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 0.52, 0]} scale={[1, 0.62, 1]}>
        <sphereGeometry args={[0.82, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#B5672A"
          {...crust}
          roughness={0.45}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
        />
      </mesh>
    </group>
  );
}

function Toast({ crust }: { crust: Crust }) {
  const slice = useGeometry(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.72, -0.62);
    s.lineTo(0.72, -0.62);
    s.lineTo(0.72, 0.3);
    s.bezierCurveTo(0.95, 0.72, 0.2, 0.86, 0, 0.62);
    s.bezierCurveTo(-0.2, 0.86, -0.95, 0.72, -0.72, 0.3);
    s.lineTo(-0.72, -0.62);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.05,
      bevelSegments: 3,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  });
  const smash = useScatter(16, (i) => {
    const a = i * 2.39;
    const r = 0.08 + (i % 5) * 0.11;
    return [Math.cos(a) * r, 0.26, -Math.sin(a) * r * 0.9];
  });
  return (
    <group position={[0, 0.05, 0]}>
      <mesh geometry={slice}>
        <meshPhysicalMaterial color="#C98E4E" {...crust} roughness={0.9} />
      </mesh>
      {smash.map((p, i) => (
        <mesh key={i} position={p} scale={[1, 0.45, 1]}>
          <sphereGeometry args={[0.2 + (i % 3) * 0.04, 16, 12]} />
          <meshPhysicalMaterial
            color={i % 4 ? '#8DB255' : '#A9C56A'}
            roughness={0.55}
            clearcoat={0.3}
          />
        </mesh>
      ))}
      {[
        [-0.3, 0.2],
        [0.25, -0.25],
        [0.35, 0.25],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} rotation={[-Math.PI / 2 + 0.15, 0, i]}>
          <cylinderGeometry args={[0.13, 0.13, 0.02, 24]} />
          <meshPhysicalMaterial color="#E56C8A" roughness={0.4} clearcoat={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Wrap({ crust, togo }: { crust: Crust; togo: boolean }) {
  const half = (
    key: string,
    props: { position?: [number, number, number]; rotation?: [number, number, number] },
  ) => (
    <group key={key} {...props}>
      <mesh>
        <cylinderGeometry args={[0.33, 0.33, 1.0, 40, 1, true]} />
        <meshPhysicalMaterial color="#E7CF9E" {...crust} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* The cut face: tortilla, greens, chicken, peppers. */}
      <group position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <circleGeometry args={[0.32, 32]} />
          <meshStandardMaterial color="#E2D2B8" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <ringGeometry args={[0.2, 0.3, 32]} />
          <meshStandardMaterial color="#5F9A3B" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.004]}>
          <ringGeometry args={[0.08, 0.15, 32]} />
          <meshStandardMaterial color="#C0452F" roughness={0.6} />
        </mesh>
      </group>
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.33, 32]} />
        <meshPhysicalMaterial color="#E7CF9E" {...crust} roughness={0.85} />
      </mesh>
    </group>
  );
  return togo ? (
    <group position={[0, 0.34, 0]}>
      {half('a', { position: [-0.35, 0, 0.2], rotation: [0, 0.3, Math.PI / 2] })}
      {half('b', { position: [0.4, 0, -0.25], rotation: [0, -0.2, -Math.PI / 2] })}
    </group>
  ) : (
    <group>
      {half('a', { position: [-0.35, 0.5, 0] })}
      {half('b', { position: [0.42, 0.33, 0.25], rotation: [0, 0.4, Math.PI / 2] })}
    </group>
  );
}

/** A ceramic bowl, for soup and salad served at a table. */
function Bowl() {
  const geo = useGeometry(() => {
    const pts: [number, number][] = [
      [0, 0],
      [0.42, 0],
      [0.46, 0.03],
      [0.82, 0.32],
      [0.98, 0.6],
      [0.94, 0.62],
      [0.78, 0.36],
      [0.4, 0.08],
      [0, 0.08],
    ];
    return new THREE.LatheGeometry(
      pts.map(([x, y]) => new THREE.Vector2(x, y)),
      64,
    );
  });
  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial {...GLAZE} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Soup({ name, togo }: { name: string; togo: boolean }) {
  const color = /pumpkin|squash|carrot|lentil/i.test(name)
    ? '#D9822B'
    : /mushroom|chowder|potato|leek/i.test(name)
      ? '#D8C3A0'
      : /green|pea|broccoli|spinach/i.test(name)
        ? '#7E9A3E'
        : '#C4452F';
  const clock = useRef([1, 1, 1, 1, 1]);
  const y = togo ? 0.56 : 0.48;
  return (
    <group>
      {!togo && <Bowl />}
      <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[togo ? 0.9 : 0.86, 48]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.25}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
        />
      </mesh>
      <mesh position={[0.1, y + 0.01, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.025, 8, 40, Math.PI * 1.6]} />
        <meshPhysicalMaterial color="#FFF8EC" roughness={0.3} clearcoat={0.6} />
      </mesh>
      {[
        [-0.35, 0.2],
        [0.3, -0.3],
        [-0.1, -0.45],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, y + 0.04, z]} rotation={[i, i * 2, 0]}>
          <boxGeometry args={[0.1, 0.08, 0.1]} />
          <meshPhysicalMaterial color="#C99152" roughness={0.9} />
        </mesh>
      ))}
      <Steam played={clock} y={y} active />
    </group>
  );
}

function Salad({ togo }: { togo: boolean }) {
  const y = togo ? 0.5 : 0.42;
  const grains = useScatter(90, (i) => {
    const a = i * 2.399;
    const r = Math.sqrt(i / 90) * 0.78;
    return [Math.cos(a) * r, y + 0.03 + ((i * 13) % 7) * 0.006, Math.sin(a) * r];
  });
  const leaves = useScatter(9, (i) => {
    const a = (i / 9) * Math.PI * 2;
    return [Math.cos(a) * 0.45, y + 0.1, Math.sin(a) * 0.45];
  });
  return (
    <group>
      {!togo && <Bowl />}
      <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.84, 40]} />
        <meshStandardMaterial color="#D9C9A4" roughness={0.9} />
      </mesh>
      {grains.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.035, 6, 5]} />
          <meshStandardMaterial color={i % 5 ? '#E6D6B0' : '#B34A3A'} roughness={0.8} />
        </mesh>
      ))}
      {leaves.map((p, i) => (
        <mesh key={i} position={p} rotation={[0.4, i, 0.3]} scale={[1, 0.18, 0.55]}>
          <sphereGeometry args={[0.22, 16, 10]} />
          <meshPhysicalMaterial color={i % 2 ? '#5E9A3B' : '#7DB24A'} roughness={0.5} sheen={0.4} />
        </mesh>
      ))}
      {[
        [0.2, 0.1],
        [-0.25, -0.2],
        [0.05, -0.4],
        [-0.35, 0.3],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, y + 0.12, z]}>
          <sphereGeometry args={[0.1, 20, 14]} />
          <meshPhysicalMaterial
            color="#D8402E"
            roughness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ── Retail: beans and anything unmapped ─────────────────── */

/** The bag's label, drawn once: café name, product name, one detail line. */
function useLabel(title: string, detail: string) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 440;
    const x = c.getContext('2d')!;
    x.fillStyle = '#F4EEE2';
    x.fillRect(0, 0, 512, 440);
    x.strokeStyle = '#0A0A0A';
    x.lineWidth = 10;
    x.strokeRect(18, 18, 476, 404);
    x.fillStyle = '#0A0A0A';
    x.textAlign = 'center';
    x.font = '600 28px ui-monospace, Menlo, monospace';
    x.fillText('AROUND THE BEAN', 256, 84);
    x.font = '800 54px system-ui, sans-serif';
    const lines: string[] = [];
    for (const word of title.split(/\s+/)) {
      const last = lines[lines.length - 1];
      if (last && (last + ' ' + word).length <= 13) lines[lines.length - 1] = `${last} ${word}`;
      else lines.push(word);
    }
    lines.slice(0, 3).forEach((l, i) => x.fillText(l, 256, 180 + i * 62));
    x.font = '500 26px system-ui, sans-serif';
    x.fillStyle = '#3C6B4A';
    x.fillText(detail, 256, 386);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [title, detail]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function RetailBag({ name, beans }: { name: string; beans: boolean }) {
  const paper = usePbr(paperSet);
  const beanMaps = usePbr(beanSet);
  const label = useLabel(name, beans ? 'Whole beans · 340 g' : 'Made in Vancouver');
  const bean = useGeometry(() => {
    const g = new THREE.SphereGeometry(0.5, 24, 16);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.y *= 0.76;
      v.z *= v.z > 0 ? 0.45 : 0.7;
      // The crease down the flat face.
      if (v.z > 0) v.z -= Math.exp(-(v.x * v.x) / 0.01) * 0.12;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
  const scattered = useScatter(beans ? 9 : 0, (i) => [
    -0.9 + (i % 5) * 0.42,
    0.07,
    0.75 + ((i * 3) % 4) * 0.12,
  ]);
  return (
    <group>
      <RoundedBox args={[1.3, 1.8, 0.72]} radius={0.07} smoothness={3} position={[0, 0.9, 0]}>
        <meshPhysicalMaterial color="#C39463" {...paper} roughness={0.88} />
      </RoundedBox>
      {/* The rolled top, folded over twice. */}
      <RoundedBox args={[1.3, 0.14, 0.34]} radius={0.05} smoothness={3} position={[0, 1.86, 0]}>
        <meshPhysicalMaterial color="#A97C4E" {...paper} roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 0.95, 0.365]}>
        <planeGeometry args={[1.0, 0.86]} />
        <meshStandardMaterial map={label} roughness={0.7} />
      </mesh>
      {beans && (
        <mesh position={[0, 1.52, 0.366]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.02, 20]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.4} />
        </mesh>
      )}
      {scattered.map((p, i) => (
        <mesh key={i} geometry={bean} position={p} rotation={[Math.PI / 2, 0, i]} scale={0.2}>
          <meshPhysicalMaterial color="#5A3420" {...beanMaps} roughness={0.45} clearcoat={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Plate, box, container ───────────────────────────────── */

function Plate() {
  return (
    <group>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[1.55, 1.32, 0.06, 64]} />
        <meshPhysicalMaterial {...GLAZE} />
      </mesh>
      <mesh position={[0, 0.062, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.025, 10, 64]} />
        <meshPhysicalMaterial {...GLAZE} />
      </mesh>
    </group>
  );
}

const BOX = { w: 2.4, h: 0.95, d: 1.8, wall: 0.035 };

/** The café's round sticker, for the lid of a to-go box. */
function useSticker() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d')!;
    x.fillStyle = '#A9C23F';
    x.beginPath();
    x.arc(128, 128, 124, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#0A0A0A';
    x.textAlign = 'center';
    x.font = '800 44px system-ui, sans-serif';
    x.fillText('AROUND', 128, 112);
    x.fillText('THE BEAN', 128, 162);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function TakeawayBox({ lid, paper }: { lid: React.RefObject<THREE.Group | null>; paper: PbrSet }) {
  const sticker = useSticker();
  const { w, h, d, wall } = BOX;
  const kraft = <meshPhysicalMaterial color="#C29462" {...paper} roughness={0.9} />;
  return (
    <group>
      <mesh position={[0, wall / 2, 0]}>
        <boxGeometry args={[w, wall, d]} />
        {kraft}
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={`z${s}`} position={[0, h / 2, (s * d) / 2]}>
          <boxGeometry args={[w, h, wall]} />
          {kraft}
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <mesh key={`x${s}`} position={[(s * w) / 2, h / 2, 0]}>
          <boxGeometry args={[wall, h, d]} />
          {kraft}
        </mesh>
      ))}
      {/* Hinged along the back edge, the way a clamshell box folds shut. */}
      <group ref={lid} position={[0, h, -d / 2]} rotation={[-1.95, 0, 0]}>
        <mesh position={[0, wall / 2, d / 2]}>
          <boxGeometry args={[w + 0.04, wall, d + 0.04]} />
          {kraft}
        </mesh>
        <mesh position={[0, wall + 0.002, d / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.36, 48]} />
          <meshStandardMaterial map={sticker} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function RoundContainer({
  lid,
  paper,
}: {
  lid: React.RefObject<THREE.Group | null>;
  paper: PbrSet;
}) {
  const lite = useQuality() !== 'high';
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.98, 0.82, 0.7, 64, 1, true]} />
        <meshPhysicalMaterial color="#C29462" {...paper} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.82, 48]} />
        <meshPhysicalMaterial color="#B98A5A" roughness={0.9} />
      </mesh>
      <group ref={lid} position={[0, 2.6, 0]}>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[1.02, 1.02, 0.06, 64]} />
          <meshPhysicalMaterial
            color="#FFFFFF"
            roughness={0.06}
            transmission={lite ? 0 : 0.9}
            transparent={lite}
            opacity={lite ? 0.3 : 1}
            thickness={0.06}
            ior={1.46}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ── The served item ─────────────────────────────────────── */

function Food({
  kind,
  name,
  togo,
  crust,
}: {
  kind: FoodKind;
  name: string;
  togo: boolean;
  crust: Crust;
}) {
  switch (kind) {
    case 'croissant':
      return <Croissant crust={crust} />;
    case 'painAuChocolat':
      return <PainAuChocolat crust={crust} />;
    case 'cinnamonRoll':
      return <CinnamonRoll crust={crust} />;
    case 'scone':
      return <Scone crust={crust} berries={/berr/i.test(name)} />;
    case 'cookie':
      return <Cookie crust={crust} chips={/chocolate|chip/i.test(name)} />;
    case 'muffin':
      return <Muffin crust={crust} berries={/berr/i.test(name)} />;
    case 'loaf':
      return <Loaf crust={crust} name={name} togo={togo} />;
    case 'bagel':
      return <Bagel crust={crust} />;
    case 'toast':
      return <Toast crust={crust} />;
    case 'sandwich':
      return <Sandwich crust={crust} />;
    case 'wrap':
      return <Wrap crust={crust} togo={togo} />;
    case 'soup':
      return <Soup name={name} togo={togo} />;
    case 'bowl':
      return <Salad togo={togo} />;
    default:
      return <RetailBag name={name} beans={kind === 'beans'} />;
  }
}

function Served({
  kind,
  name,
  togo,
  replay,
  onComplete,
}: {
  kind: FoodKind;
  name: string;
  togo: boolean;
  replay: number;
  onComplete?: () => void;
}) {
  const crust = usePbr(crustSet);
  const paper = usePbr(paperSet);
  const t = useRef(0);
  const fired = useRef(false);
  const done = useRef(onComplete);
  done.current = onComplete;

  const turn = useRef<THREE.Group>(null);
  const base = useRef<THREE.Group>(null);
  const food = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);

  const retail = kind === 'beans' || kind === 'bag';
  const round = kind === 'soup' || kind === 'bowl';
  const baseTop = retail ? 0 : togo ? (round ? 0.02 : BOX.wall) : 0.065;

  // A different choice is a different plate: play it from the start.
  useEffect(() => {
    t.current = 0;
    fired.current = false;
  }, [kind, togo]);

  // Served again: the lid closes (or the plate is set down) once more.
  useEffect(() => {
    if (replay > 0) {
      t.current = Math.min(t.current, CLOSE[0]);
      fired.current = false;
    }
  }, [replay]);

  useFrame((_, delta) => {
    // Capped for the same reason as the cup: waking up must not skip the serve.
    t.current = Math.min(TOTAL, t.current + Math.min(delta, 0.05));
    const time = t.current;
    const land = easeOut(seg(time, 0, LAND_END));
    const drop = seg(time, DROP[0], DROP[1]);
    const close = seg(time, CLOSE[0], CLOSE[1]);

    if (base.current) {
      base.current.position.y = (1 - land) * 1.4;
      base.current.visible = retail || land > 0.002;
    }
    if (food.current) {
      food.current.position.y = baseTop + (1 - easeOutBounce(drop)) * 2.4;
      food.current.rotation.y = (1 - drop) * 1.1;
      food.current.visible = drop > 0.002;
    }
    if (lid.current) {
      if (round) lid.current.position.y = THREE.MathUtils.lerp(2.6, 0.7, easeOutBack(close));
      else lid.current.rotation.x = THREE.MathUtils.lerp(-1.95, 0, easeOutBack(close));
    }
    if (turn.current) {
      turn.current.rotation.y += delta * 0.16;
      // For here, the plate is lifted and set down in front of you.
      turn.current.position.y = -1 + (togo || retail ? 0 : Math.sin(Math.PI * close) * 0.12);
    }
    if (time >= TOTAL && !fired.current) {
      fired.current = true;
      done.current?.();
    }
  });

  return (
    <group ref={turn} position={[0, -1, 0]} rotation={[0, -0.35, 0]}>
      <group ref={base}>
        {!retail &&
          (togo ? (
            round ? (
              <RoundContainer lid={lid} paper={paper} />
            ) : (
              <TakeawayBox lid={lid} paper={paper} />
            )
          ) : (
            <Plate />
          ))}
      </group>
      <group ref={food} scale={togo && !retail ? 0.8 : 1}>
        <Food kind={kind} name={name} togo={togo} crust={crust} />
      </group>
    </group>
  );
}

export default function FoodScene({
  kind,
  name,
  togo,
  replay = 0,
  onComplete,
}: {
  kind: FoodKind;
  name: string;
  togo: boolean;
  replay?: number;
  onComplete?: () => void;
}) {
  const detected = useDeviceQuality();
  const quality: Quality = detected === 'low' ? 'mid' : detected;
  const lite = quality !== 'high';
  const { ref, frameloop, markDone } = useSceneLoop(kind, name, togo, replay);
  const done = useRef(onComplete);
  done.current = onComplete;
  const handleComplete = useCallback(() => {
    markDone();
    done.current?.();
  }, [markDone]);

  return (
    <div ref={ref} className="h-full w-full">
      <Canvas
        dpr={lite ? 1 : [1, 1.5]}
        frameloop={frameloop}
        camera={{ position: [0, 2.7, 6.6], fov: 28 }}
        gl={{ antialias: true, toneMappingExposure: 1.0 }}
        onCreated={({ camera }) => camera.lookAt(0, -0.35, 0)}
        aria-hidden="true"
      >
        <QualityContext.Provider value={quality}>
          {lite && <color attach="background" args={['#E9E2D6']} />}
          <Suspense fallback={null}>
            <CafeEnv />
          </Suspense>
          <ambientLight intensity={0.3} color="#F2F6F8" />
          <directionalLight position={[3.6, 6, 4]} intensity={2.1} color="#FFF8F0" />
          <directionalLight position={[-4.5, 2, -3]} intensity={0.6} color="#BFD8FF" />
          <Counter />
          <Served kind={kind} name={name} togo={togo} replay={replay} onComplete={handleComplete} />
          <ContactShadows
            position={[0, -1.018, 0]}
            opacity={0.55}
            scale={6}
            blur={1.6}
            far={2}
            resolution={lite ? 256 : 512}
            color="#3A342C"
          />
        </QualityContext.Provider>
      </Canvas>
    </div>
  );
}
