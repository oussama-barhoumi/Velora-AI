/**
 * RobotScrollSection — materials match HeroModel exactly
 * ────────────────────────────────────────────────────────
 * ✓ Same SceneEnvironment (PMREM studio map)
 * ✓ Same enhanceMaterials logic (MeshPhysicalMaterial per mesh type)
 * ✓ Same lighting rig (ambient + key + fill + rim + hemisphere)
 * ✓ Same ACES tone mapping / exposure 1.1
 * ✓ Scroll-driven color cycling on eye/cable glow materials
 * ✓ Mouse-parallax tilt + floating bob
 * ✓ Image fallback when GLB fails (ErrorBoundary)
 */

import { useEffect, useRef, Suspense, useMemo, Component, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const GLB_URL = '/3d-model/robo_face.glb';

/* ─── Step data ──────────────────────────────────────────── */
const STEPS = [
  {
    cls: 'rs-t1',
    tag: '01',
    title: 'Save time',
    body: 'Let our AI handle the tedious parts. Auto-apply to hundreds of matched roles while you focus on what matters.',
    accent: '#26D862',
  },
  {
    cls: 'rs-t2',
    tag: '02',
    title: 'Better job matches',
    body: 'Semantic AI cross-references your skills, values, and ambitions to surface roles you would never have found alone.',
    accent: '#26D862',
  },
  {
    cls: 'rs-t3',
    tag: '03',
    title: 'Increase hiring chances',
    body: 'CVs tailored to each individual job description receive a 3× higher callback rate from hiring managers.',
    accent: '#26D862',
  },
  {
    cls: 'rs-t4',
    tag: '04',
    title: 'ATS optimised CV',
    body: 'Never get filtered out by robots. Your resume is automatically tuned to pass every Applicant Tracking System.',
    accent: '#26D862',
  },
];

/* ─── Identical to HeroModel's SceneEnvironment ─────────── */
function SceneEnvironment() {
  const { gl, scene } = useThree();

  const envMap = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();

    const W = 256, H = 128;
    const data = new Float32Array(W * H * 4);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const ny = y / H;

        let r, g, b;
        if (ny < 0.45) {
          const t = ny / 0.45;
          r = THREE.MathUtils.lerp(1.4, 0.9, t);
          g = THREE.MathUtils.lerp(1.35, 0.88, t);
          b = THREE.MathUtils.lerp(1.3, 0.85, t);
        } else if (ny < 0.55) {
          const t = (ny - 0.45) / 0.1;
          r = THREE.MathUtils.lerp(0.9, 0.05, t);
          g = THREE.MathUtils.lerp(0.88, 0.05, t);
          b = THREE.MathUtils.lerp(0.85, 0.06, t);
        } else {
          r = g = b = 0.04;
        }

        // Subtle blue accent strip
        const nx = x / W;
        if (nx > 0.62 && nx < 0.70 && ny < 0.5) {
          g += 0.15;
          b += 0.55;
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 1.0;
      }
    }

    const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.needsUpdate = true;

    const rt = pmrem.fromEquirectangular(tex);
    tex.dispose();
    pmrem.dispose();
    return rt.texture;
  }, [gl]);

  useEffect(() => {
    scene.environment = envMap;
    return () => { scene.environment = null; };
  }, [envMap, scene]);

  return null;
}

/* ─── Same material classification as HeroModel ─────────── */
function buildMaterials(scene, glowMatsRef) {
  const glows = [];

  scene.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    child.castShadow = true;
    child.receiveShadow = true;

    const name = (child.material.name || '').toLowerCase();
    const meshName = (child.name || '').toLowerCase();

    const isEye = name.includes('material_12') || meshName.includes('eye');
    const isCable = name.includes('wire') || meshName.includes('wire');
    const isFace = name.includes('face') || meshName.includes('face') || meshName.includes('head_front');
    const isBlack = name.includes('skull') || name.includes('neck') || name.includes('back');
    const isGold = name.includes('gold') || meshName.includes('gold');
    const isChrome = name.includes('chrome') || meshName.includes('chrome');

    const orig = child.material;
    const mat = new THREE.MeshPhysicalMaterial({ transparent: true });

    if (isEye) {
      mat.color.set('#26D862');
      mat.emissive.set('#26D862');
      mat.emissiveIntensity = 2.0;
      mat.metalness = 0.0;
      mat.roughness = 0.0;
      mat.opacity = 0.95;
      glows.push(mat);

    } else if (isCable) {
      mat.color.set('#26D862');
      mat.emissive.set('#1DB954');
      mat.emissiveIntensity = 0.7;
      mat.metalness = 0.6;
      mat.roughness = 0.3;
      glows.push(mat);

    } else if (isGold) {
      mat.color.set('#c8961e');
      mat.emissive.set('#7a5000');
      mat.emissiveIntensity = 0.2;
      mat.metalness = 1.0;
      mat.roughness = 0.25;
      mat.envMapIntensity = 2.0;

    } else if (isChrome) {
      mat.color.set('#e8e8e8');
      mat.metalness = 1.0;
      mat.roughness = 0.05;
      mat.envMapIntensity = 2.5;

    } else if (isFace) {
      mat.color.set('#cfd8e3');
      mat.emissive.set('#0d1a2a');
      mat.emissiveIntensity = 0.05;
      mat.metalness = 0.92;
      mat.roughness = 0.1;
      mat.clearcoat = 1.0;
      mat.clearcoatRoughness = 0.02;
      mat.envMapIntensity = 2.0;

    } else if (isBlack) {
      mat.color.set('#0d0d0d');
      mat.emissive.set('#050505');
      mat.emissiveIntensity = 0.03;
      mat.metalness = 0.4;
      mat.roughness = 0.55;
      mat.clearcoat = 0.5;
      mat.clearcoatRoughness = 0.15;
      mat.envMapIntensity = 1.0;

    } else {
      // luminance-based fallback
      const r = orig.color?.r ?? 0.5;
      const g = orig.color?.g ?? 0.5;
      const b = orig.color?.b ?? 0.5;
      const lum = r * 0.299 + g * 0.587 + b * 0.114;

      if (lum < 0.40) {
        mat.color.set('#1c2128');
        mat.metalness = 0.6;
        mat.roughness = 0.45;
        mat.clearcoat = 0.3;
        mat.clearcoatRoughness = 0.2;
        mat.envMapIntensity = 1.2;
      } else {
        // light / ceramic parts
        mat.color.set('#cfd8e3');
        mat.metalness = 0.92;
        mat.roughness = 0.1;
        mat.clearcoat = 1.0;
        mat.clearcoatRoughness = 0.02;
        mat.envMapIntensity = 2.0;
      }
    }

    // Preserve maps from original
    mat.map = orig.map ?? null;
    mat.normalMap = orig.normalMap ?? null;
    child.material = mat;
  });

  glowMatsRef.current = glows;
}

/* ─── GLB Scene ──────────────────────────────────────────── */
function GLBScene({ scrollProg }) {
  const groupRef = useRef();
  const mouse = useRef({ x: 0, y: 0 });
  const glowMatsRef = useRef([]);
  const { scene } = useGLTF(GLB_URL);

  const stepColors = useMemo(() =>
    STEPS.map(s => new THREE.Color(s.accent)), []);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    buildMaterials(clone, glowMatsRef);

    // Centre + auto-scale
    const box = new THREE.Box3().setFromObject(clone);
    const centre = new THREE.Vector3();
    box.getCenter(centre);
    clone.position.sub(centre);
    const size = new THREE.Vector3();
    box.getSize(size);
    clone.scale.setScalar(1.8 / Math.max(size.x, size.y, size.z, 0.001));

    return clone;
  }, [scene]);

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Float
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.12 - 0.30;

    // Mouse + scroll tilt (same lerp factors as HeroModel)
    const tx = mouse.current.y * 0.12;
    const ty = mouse.current.x * 0.12 + scrollProg.current * Math.PI * 1.5;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tx, 0.04);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, ty, 0.04);

    // Scroll-driven glow color
    const p = Math.max(0, Math.min(0.9999, scrollProg.current)) * (stepColors.length - 1);
    const idx1 = Math.floor(p);
    const idx2 = Math.min(idx1 + 1, stepColors.length - 1);
    const col = new THREE.Color().lerpColors(stepColors[idx1], stepColors[idx2], p - idx1);

    glowMatsRef.current.forEach((mat) => {
      mat.color.copy(col);
      mat.emissive.copy(col);
    });
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
    </group>
  );
}

/* ─── Canvas — same settings as HeroModel ────────────────── */
function RobotCanvas({ scrollProg }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <SceneEnvironment />

      {/* Same lighting rig as HeroModel */}
      <ambientLight intensity={0.25} color="#c8d8ff" />
      <directionalLight position={[4, 8, 4]} intensity={1.6} color="#fff5e0" castShadow />
      <directionalLight position={[-6, 2, -3]} intensity={0.6} color="#aac4ff" />
      <directionalLight position={[0, -3, -6]} intensity={0.8} color="#3a7cff" />
      <hemisphereLight args={['#c0d4ff', '#0a0a14', 0.15]} />

      <Suspense fallback={null}>
        <group position={[-1, -0.3, 0]}>
          <GLBScene scrollProg={scrollProg} />
          <ContactShadows
            position={[0, -1.35, 0]}
            opacity={0.35}
            scale={6}
            blur={3}
            far={4}
            color="#888"
          />
        </group>
      </Suspense>
    </Canvas>
  );
}

/* ─── Image fallback (when GLB errors) ──────────────────── */
function ImageFallback() {
  return (
    <div className="rs-image-stage" aria-hidden="true">
      <div className="rs-image-glow" />
      <div className="rs-image-tilt">
        <img
          src="/robot-head.png"
          alt=""
          className="rs-robot-img"
          draggable="false"
        />
      </div>
      <div className="rs-image-ground" />
    </div>
  );
}

/* ─── Error boundary ─────────────────────────────────────── */
class CanvasErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError
      ? <ImageFallback />
      : this.props.children;
  }
}

/* ─── Spinner ────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="rs-loader">
      <div className="rs-spinner" />
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────── */
export default function RobotScrollSection() {
  const wrapRef = useRef(null);
  const pinRef = useRef(null);
  const scrollProg = useRef(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const pin = pinRef.current;
    if (!wrap || !pin) return;

    const texts = STEPS.map(s => pin.querySelector(`.${s.cls}`));
    gsap.set(texts, { opacity: 0, y: 60 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        pin: pin,
        pinSpacing: true,
        start: 'top top',
        end: '+=300%',
        scrub: 1,
        onUpdate: (self) => { scrollProg.current = self.progress; },
      },
    });

    const SLOT = 1;
    const IN_DUR = 0.18;
    const OUT_AT = 0.68;
    const OUT_DUR = 0.28;

    texts.forEach((el, i) => {
      if (!el) return;
      const base = i * SLOT;

      tl.fromTo(el,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, ease: 'power2.out', duration: IN_DUR },
        base
      );

      if (i < STEPS.length - 1) {
        tl.to(el,
          { opacity: 0, y: -50, ease: 'power2.in', duration: OUT_DUR },
          base + OUT_AT
        );
      }
    });

    tl.to({}, { duration: 0.4 });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <div ref={wrapRef} className="rs-wrap" id="robot-section">
      <div ref={pinRef} className="rs-pin">

        {/* Ambient glow rings */}
        <div className="rs-bg-ring rs-ring-1" aria-hidden="true" />
        <div className="rs-bg-ring rs-ring-2" aria-hidden="true" />

        {/* 3D Canvas */}
        <div className="rs-canvas-wrap" aria-hidden="true">
          <Suspense fallback={<Spinner />}>
            <CanvasErrorBoundary>
              <RobotCanvas scrollProg={scrollProg} />
            </CanvasErrorBoundary>
          </Suspense>
        </div>

        {/* Text blocks */}
        <div className="rs-text-panel" aria-live="polite">
          {STEPS.map((step) => (
            <div key={step.cls} className={`rs-text-block ${step.cls}`}>
              <span
                className="rs-tag"
                style={{ color: step.accent, borderColor: `${step.accent}55` }}
              >
                {step.tag}
              </span>
              <h2 className="rs-title">{step.title}</h2>
              <p className="rs-body">{step.body}</p>
              <div className="rs-line" style={{ backgroundColor: step.accent }} />
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="rs-scroll-hint" aria-hidden="true">
          <span>scroll</span>
          <div className="rs-scroll-arrow" />
        </div>

      </div>
    </div>
  );
}

useGLTF.preload(GLB_URL);
