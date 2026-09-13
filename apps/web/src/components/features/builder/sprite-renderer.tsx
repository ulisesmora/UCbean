'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sceneOf } from '@/lib/builder';
import { SPRITE_FRAMES, SPRITE_SIZE, useDrinkSprites } from '@/lib/drink-sprites';
import { Cup } from './builder-cup';
import { QualityContext } from './render-budget';

/**
 * Lighting without a download: three.js's generated studio room, so glaze and
 * glass have something to reflect.
 */
function Room() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Warm-up frames before capture: the cup settles into its finished state. */
const WARMUP = 3;

function Job() {
  const job = useDrinkSprites((s) => s.queue[0]);
  const done = useDrinkSprites((s) => s.done);
  const turn = useRef<THREE.Group>(null);
  const frame = useRef(0);
  const sheet = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = SPRITE_SIZE * SPRITE_FRAMES;
    canvas.height = SPRITE_SIZE;
    return { canvas, ctx: canvas.getContext('2d') };
  }, []);
  const scene = useMemo(() => (job ? sceneOf(job.build) : null), [job]);

  useEffect(() => {
    frame.current = 0;
  }, [job?.key]);

  // Priority 1: this callback does the rendering itself, after the cup's own
  // frame logic (priority 0) has run.
  useFrame(({ gl, scene: world, camera }) => {
    if (!job || !turn.current || !sheet.ctx) {
      gl.render(world, camera);
      return;
    }
    if (frame.current++ < WARMUP) {
      gl.render(world, camera);
      return;
    }

    const { canvas, ctx } = sheet;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < SPRITE_FRAMES; i++) {
      turn.current.rotation.y = (i / SPRITE_FRAMES) * Math.PI * 2;
      gl.render(world, camera);
      ctx.drawImage(gl.domElement, i * SPRITE_SIZE, 0, SPRITE_SIZE, SPRITE_SIZE);
    }
    turn.current.rotation.y = 0;

    let url = '';
    try {
      url = canvas.toDataURL('image/webp', 0.82);
    } catch {
      // A thumbnail that cannot be encoded keeps showing its photo.
    }
    done(job.key, url);
  }, 1);

  if (!job || !scene) return null;
  // A mug is short: raise and enlarge it so it fills the frame like a tall cup.
  const mug = scene.vessel === 'here';
  return (
    <group ref={turn} key={job.key} position={[0, mug ? 0.45 : 0, 0]} scale={mug ? 1.25 : 1}>
      <Cup scene={scene} stage={4} animate={false} />
    </group>
  );
}

/**
 * The hidden renderer behind every drink thumbnail.
 *
 * Off screen, one small canvas, rendering only while drinks are queued.
 */
export default function SpriteRenderer() {
  const pending = useDrinkSprites((s) => s.queue.length > 0);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: -10000,
        top: 0,
        width: SPRITE_SIZE,
        height: SPRITE_SIZE,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        dpr={1}
        frameloop={pending ? 'always' : 'never'}
        camera={{ position: [0, 0.35, 7.2], fov: 30 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ gl, camera }) => {
          gl.localClippingEnabled = true;
          gl.setClearColor(0x000000, 0);
          camera.lookAt(0, 0, 0);
        }}
      >
        <QualityContext.Provider value="mid">
          <Room />
          <ambientLight intensity={0.5} color="#FFF9F0" />
          <directionalLight position={[3, 5, 5]} intensity={2.1} color="#FFF6E8" />
          <directionalLight position={[-4, 2, -3]} intensity={0.6} color="#BFD8FF" />
          <Job />
        </QualityContext.Provider>
      </Canvas>
    </div>
  );
}
