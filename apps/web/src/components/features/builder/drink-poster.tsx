'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { sceneOf } from '@/lib/builder';
import type { Recipe } from '@/lib/recipes';
import { useDeviceQuality, type Quality } from '@/lib/device-quality';
import { CafeEnv, Cup } from './builder-cup';
import { QualityContext, useSceneLoop } from './render-budget';

/**
 * The menu as a poster.
 *
 * Clear cups floating and turning over the café's colours, the drink's own
 * ingredients drifting around them, and its name set large behind (the markup
 * around this canvas draws the type). The look of a launch poster, made from
 * the same formulas that price and pour each drink, so it can never show a
 * drink the café does not make.
 *
 * It keeps moving while it is on screen and stops drawing once scrolled away
 * or when the tab is hidden. It never falls back to a photo: on lighter devices
 * it shows fewer cups and ingredients, with see-through glass instead of
 * refraction.
 */

type BitKind = 'bean' | 'drop' | 'cinnamon' | 'citrus' | 'ice' | 'leaf' | 'cream';

/** What floats around a drink, read off its formula. */
function bitsFor(recipe: Recipe): { kinds: BitKind[]; dust: string | null } {
  const b = recipe.build;
  const kinds: BitKind[] = [];
  let dust: string | null = null;

  if (b.base === 'matcha') {
    kinds.push('leaf', 'drop');
    dust = '#7FA33E';
  } else if (b.base === 'hojicha') {
    kinds.push('leaf', 'drop');
    dust = '#A87246';
  } else if (b.base === 'yuzu') {
    kinds.push('citrus', 'ice');
  } else {
    kinds.push('bean', b.milk !== 'none' ? 'drop' : 'bean');
  }
  if (b.extras.includes('cinnamon')) {
    kinds.push('cinnamon');
    dust = dust ?? '#9A5A2E';
  }
  if (b.extras.includes('cream') || b.serve === 'blended') kinds.push('cream');
  if (b.serve === 'iced' && !kinds.includes('ice')) kinds.push('ice');
  return { kinds, dust };
}

/** Every drink in a clear cup: glass for a hot one, a lidded plastic cup for a cold one. */
const posterScene = (r: Recipe) =>
  sceneOf({ ...r.build, vessel: r.build.serve === 'hot' ? 'glass' : 'togo' });

/** A small repeatable random, so a drink's ingredients land in the same places each time. */
function seeded(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const hashOf = (text: string) =>
  [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) >>> 0;

/** Where each cup floats: the chosen drink up front, companions behind. */
const SLOTS = [
  { pos: [0.2, -0.45, 0] as const, scale: 1, tilt: -0.14, phase: 0 },
  { pos: [-2.4, 0.85, -1.7] as const, scale: 0.72, tilt: 0.28, phase: 1.7 },
  { pos: [2.45, 1.15, -2.3] as const, scale: 0.64, tilt: -0.32, phase: 3.1 },
];

const easeOutBack = (x: number) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);

function FloatingCup({
  recipe,
  slot,
  animate,
}: {
  recipe: Recipe;
  slot: number;
  animate: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const scene = useMemo(() => posterScene(recipe), [recipe]);
  const born = useRef<number | null>(null);
  const s = SLOTS[slot];

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    if (born.current === null) born.current = t;
    // Each cup drops in on its own beat, then floats.
    const age = Math.min(1, (t - born.current) / (0.9 + slot * 0.22));
    const enter = easeOutBack(age);
    const bob = animate ? Math.sin(t * 0.9 + s.phase) * 0.12 : 0;
    g.position.set(s.pos[0], s.pos[1] + bob + (1 - enter) * 5, s.pos[2]);
    g.rotation.z = s.tilt + (animate ? Math.sin(t * 0.6 + s.phase) * 0.05 : 0);
    g.rotation.y = animate ? t * 0.35 + s.phase : s.phase;
  });

  return (
    <group ref={group} scale={s.scale}>
      <Cup scene={scene} stage={4} animate={false} />
    </group>
  );
}

function Bit({ kind }: { kind: BitKind }) {
  switch (kind) {
    case 'bean':
      return (
        <mesh scale={[0.16, 0.12, 0.09]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshPhysicalMaterial color="#4A2A18" roughness={0.45} clearcoat={0.6} />
        </mesh>
      );
    case 'drop':
      return (
        <mesh scale={0.09}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshPhysicalMaterial color="#FFF8EE" roughness={0.2} clearcoat={1} />
        </mesh>
      );
    case 'cream':
      return (
        <mesh scale={[0.2, 0.14, 0.2]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshPhysicalMaterial color="#FFFDF7" roughness={0.6} sheen={0.8} sheenColor="#FFF1DC" />
        </mesh>
      );
    case 'cinnamon':
      return (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 10]} />
          <meshStandardMaterial color="#8B4A24" roughness={0.9} />
        </mesh>
      );
    case 'citrus':
      return (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.05, 24]} />
            <meshPhysicalMaterial color="#F2C230" roughness={0.4} clearcoat={0.5} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.26, 0.03, 8, 24]} />
            <meshStandardMaterial color="#F7E7A8" roughness={0.6} />
          </mesh>
        </group>
      );
    case 'ice':
      return (
        <RoundedBox args={[0.32, 0.32, 0.32]} radius={0.06} smoothness={2}>
          <meshPhysicalMaterial
            color="#EAF6FB"
            roughness={0.1}
            transparent
            opacity={0.55}
            clearcoat={1}
          />
        </RoundedBox>
      );
    case 'leaf':
      return (
        <mesh scale={[0.22, 0.02, 0.1]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#5E8A3A" roughness={0.7} />
        </mesh>
      );
  }
}

/** Fine powder hanging in the air: matcha, hojicha or cinnamon. */
function Dust({ color, count, animate }: { color: string; count: number; animate: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const random = seeded(count * 13 + 7);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 7;
      positions[i * 3 + 1] = (random() - 0.5) * 4.5;
      positions[i * 3 + 2] = -1.5 + random() * 2.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    if (!ref.current || !animate) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.05;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={0.045}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
}

function Ingredients({
  recipe,
  count,
  animate,
}: {
  recipe: Recipe;
  count: number;
  animate: boolean;
}) {
  const { kinds, dust } = useMemo(() => bitsFor(recipe), [recipe]);
  const items = useMemo(() => {
    const random = seeded(hashOf(recipe.id));
    return Array.from({ length: count }, (_, i) => ({
      kind: kinds[i % kinds.length],
      x: (random() - 0.5) * 8.5,
      y: (random() - 0.5) * 5.5,
      z: -2.5 + random() * 3.2,
      rx: random() * 6,
      ry: random() * 6,
      spin: (random() - 0.5) * 1.4,
      rise: 0.12 + random() * 0.25,
      size: 0.7 + random() * 0.6,
    }));
  }, [recipe.id, kinds, count]);
  const nodes = useRef<(THREE.Object3D | null)[]>([]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const t = state.clock.elapsedTime;
    items.forEach((it, i) => {
      const node = nodes.current[i];
      if (!node) return;
      if (animate) {
        // Rising slowly and wrapping round, like things caught in a pour.
        it.y += it.rise * dt;
        if (it.y > 3) it.y = -3;
        node.rotation.x += it.spin * dt;
        node.rotation.y += it.spin * 0.7 * dt;
      }
      node.position.set(it.x + Math.sin(t * 0.5 + i) * 0.15, it.y, it.z);
    });
  });

  return (
    <>
      {items.map((it, i) => (
        <group
          key={i}
          ref={(node) => {
            nodes.current[i] = node;
          }}
          rotation={[it.rx, it.ry, 0]}
          scale={it.size}
        >
          <Bit kind={it.kind} />
        </group>
      ))}
      {dust && <Dust color={dust} count={count * 8} animate={animate} />}
    </>
  );
}

export default function DrinkPoster({
  focus,
  companions,
  animate,
}: {
  /** The drink the poster is about. */
  focus: Recipe;
  /** Other drinks floating behind it. */
  companions: Recipe[];
  animate: boolean;
}) {
  const detected = useDeviceQuality();
  // Always 3D here. A weak device gets the light scene rather than a photo.
  const quality: Quality = detected === 'low' ? 'mid' : detected;
  const lite = quality !== 'high';
  // Never marked done: it keeps moving while visible, and only pauses when it
  // is scrolled away or the tab is hidden.
  const { ref, frameloop } = useSceneLoop(focus.id);
  const cups = [focus, ...companions].slice(0, lite ? 2 : 3);
  const count = detected === 'low' ? 8 : lite ? 14 : 22;

  return (
    <div ref={ref} className="h-full w-full">
      <Canvas
        dpr={lite ? 1 : [1, 1.5]}
        frameloop={frameloop}
        camera={{ position: [0, 0.4, 9.5], fov: 32 }}
        // Transparent, so the café colours and the drink's name show through.
        gl={{ antialias: true, alpha: true, toneMappingExposure: 1.0 }}
        onCreated={({ gl, camera }) => {
          gl.localClippingEnabled = true;
          camera.lookAt(0, 0, 0);
        }}
        aria-hidden="true"
      >
        <QualityContext.Provider value={quality}>
          <Suspense fallback={null}>
            <CafeEnv backdrop={false} />
          </Suspense>
          <ambientLight intensity={0.45} color="#FFF9F0" />
          <directionalLight position={[3, 5, 5]} intensity={2.2} color="#FFF6E8" />
          <directionalLight position={[-5, 2, -2]} intensity={0.7} color="#D8F0A0" />
          {cups.map((recipe, i) => (
            <FloatingCup key={`${recipe.id}-${i}`} recipe={recipe} slot={i} animate={animate} />
          ))}
          <Ingredients recipe={focus} count={count} animate={animate} />
        </QualityContext.Provider>
      </Canvas>
    </div>
  );
}
