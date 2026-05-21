/**
 * RobotScrollSection — production-ready
 * ──────────────────────────────────────
 * Fixes applied vs previous version:
 *  ✓ useGLTF called at component top-level (Rules of Hooks)
 *  ✓ ErrorBoundary catches GLB load failures gracefully
 *  ✓ GSAP pin uses correct API (trigger + pin same element)
 *  ✓ Sequential text: fade-in → hold → fade-out per step
 *  ✓ scrollProg ref shared with R3F via closure (no re-renders)
 *  ✓ Full cleanup on unmount
 */

import { useEffect, useRef, Suspense, useMemo, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
    accent: '#00F2FE',
  },
  {
    cls: 'rs-t3',
    tag: '03',
    title: 'Increase hiring chances',
    body: 'CVs tailored to each individual job description receive a 3× higher callback rate from hiring managers.',
    accent: '#FF007F',
  },
  {
    cls: 'rs-t4',
    tag: '04',
    title: 'ATS optimised CV',
    body: 'Never get filtered out by robots. Your resume is automatically tuned to pass every Applicant Tracking System.',
    accent: '#FFD700',
  },
];

/* ─── Error boundary for the Canvas ─────────────────────── */
class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <FallbackCanvas scrollProg={this.props.scrollProg} />;
    return this.props.children;
  }
}

/* ─── Fallback (no GLB) ──────────────────────────────────── */
function FallbackMesh({ scrollProg }) {
  const groupRef = useRef();
  const mouse = useRef({ x: 0, y: 0 });
  const pointLightRef = useRef();

  const stepColors = useMemo(() => {
    return STEPS.map((s) => new THREE.Color(s.accent));
  }, []);

  const eyeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#26D862'),
      emissive: new THREE.Color('#26D862'),
      emissiveIntensity: 3,
    });
  }, []);

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
    groupRef.current.position.y = Math.sin(t * 0.9) * 0.1 - 0.45;
    const ty = mouse.current.x * 0.2 + scrollProg.current * Math.PI * 1.5;
    const tx = mouse.current.y * 0.14;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, ty, 0.05);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tx, 0.05);

    // Smoothly transition colors based on scroll progress
    const p = Math.max(0, Math.min(0.999, scrollProg.current)) * (stepColors.length - 1);
    const idx1 = Math.floor(p);
    const idx2 = idx1 + 1;
    const fraction = p - idx1;

    const activeColor = new THREE.Color();
    activeColor.lerpColors(stepColors[idx1], stepColors[idx2], fraction);

    eyeMaterial.color.copy(activeColor);
    eyeMaterial.emissive.copy(activeColor);

    if (pointLightRef.current) {
      pointLightRef.current.color.copy(activeColor);
    }
  });

  return (
    <group ref={groupRef} scale={0.7}>
      <mesh castShadow>
        <boxGeometry args={[1.4, 1.8, 1.4]} />
        <meshPhysicalMaterial color="#ffffff" metalness={0.1} roughness={0.2} clearcoat={1.0} />
      </mesh>
      {[[-0.32, 0.3, 0.71], [0.32, 0.3, 0.71]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} material={eyeMaterial}>
          <sphereGeometry args={[0.13, 16, 16]} />
        </mesh>
      ))}
      <pointLight ref={pointLightRef} position={[0, -2, 3]} intensity={1.8} />
    </group>
  );
}

function FallbackCanvas({ scrollProg }) {
  return (
    <Canvas camera={{ position: [0, 0, 4.2], fov: 42 }} dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 8, 4]} intensity={2} />
      <FallbackMesh scrollProg={scrollProg} />
    </Canvas>
  );
}

/* ─── GLB model (unconditional hook — correct) ───────────── */
function GLBScene({ scrollProg }) {
  const groupRef = useRef();
  const mouse = useRef({ x: 0, y: 0 });
  const { scene } = useGLTF('/3d-model/robo_face.glb');
  const glowMaterials = useRef([]);
  const pointLightRef = useRef();

  const stepColors = useMemo(() => {
    return STEPS.map((s) => new THREE.Color(s.accent));
  }, []);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    const glows = [];

    clone.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const orig = child.material;
      const nm = (orig.name || '').toLowerCase();
      const mn = (child.name || '').toLowerCase();

      // Eye sockets — soft mint glow
      const isEye =
        nm.includes('eye') || mn.includes('eye');

      // Neon cables / tubes / wires — vivid green
      const isCable =
        nm.includes('glow') || nm.includes('neon') || nm.includes('cable') ||
        nm.includes('wire') || nm.includes('tube') ||
        mn.includes('glow') || mn.includes('neon') || mn.includes('cable') ||
        mn.includes('wire') || mn.includes('tube') ||
        (!isEye && orig.emissive && orig.emissive.r + orig.emissive.g + orig.emissive.b > 0.01);

      const isGlow = isEye || isCable;

      child.castShadow    = true;
      child.receiveShadow = true;

      if (isEye) {
        // ── Soft mint eye glow ────────────────────────────────
        const mat = new THREE.MeshPhysicalMaterial({
          color:             new THREE.Color('#7dffc0'),
          emissive:          new THREE.Color('#7dffc0'),
          emissiveIntensity: 1.6,
          metalness: 0,
          roughness: 0.08,
          transparent: orig.transparent ?? false,
          opacity:     orig.opacity    ?? 1,
        });
        child.material = mat;
        glows.push(mat);

      } else if (isCable) {
        // ── Vivid green neon (cables / tubes) ────────────────
        const mat = new THREE.MeshPhysicalMaterial({
          color:             new THREE.Color('#26D862'),
          emissive:          new THREE.Color('#26D862'),
          emissiveIntensity: 3.5,
          metalness: 0,
          roughness: 0.04,
          transparent: orig.transparent ?? false,
          opacity:     orig.opacity    ?? 1,
        });
        child.material = mat;
        glows.push(mat);

      } else {
        // Classify body parts by original colour luminance
        const r   = orig.color?.r ?? 0.5;
        const g   = orig.color?.g ?? 0.5;
        const b   = orig.color?.b ?? 0.5;
        const lum = r * 0.299 + g * 0.587 + b * 0.114;
        // Raised threshold: dark armor < 0.40, light skin >= 0.40
        const isDark = lum < 0.40;

        if (isDark) {
          // ── Dark blue-grey gunmetal armour ────────────────
          child.material = new THREE.MeshPhysicalMaterial({
            color:              new THREE.Color('#22272f'),
            metalness:          0.94,
            roughness:          0.07,
            clearcoat:          1.0,
            clearcoatRoughness: 0.04,
            reflectivity:       1.0,
            envMapIntensity:    1.5,
            map:       orig.map       ?? null,
            normalMap: orig.normalMap ?? null,
          });
        } else {
          // ── Smooth white ceramic skin / face ─────────────
          child.material = new THREE.MeshPhysicalMaterial({
            color:              new THREE.Color('#eaeaea'),
            metalness:          0.0,
            roughness:          0.14,
            clearcoat:          0.9,
            clearcoatRoughness: 0.06,
            envMapIntensity:    0.6,
            map:       orig.map       ?? null,
            normalMap: orig.normalMap ?? null,
          });
        }
      }
    });

    glowMaterials.current = glows;

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
    groupRef.current.position.y = Math.sin(t * 0.9) * 0.1 - 0.50;
    const ty = mouse.current.x * 0.18 + scrollProg.current * Math.PI * 1.5;
    const tx = mouse.current.y * 0.14;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, ty, 0.04);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tx, 0.04);

    // Smoothly transition colors based on scroll progress
    const p = Math.max(0, Math.min(0.999, scrollProg.current)) * (stepColors.length - 1);
    const idx1 = Math.floor(p);
    const idx2 = idx1 + 1;
    const fraction = p - idx1;

    const activeColor = new THREE.Color();
    activeColor.lerpColors(stepColors[idx1], stepColors[idx2], fraction);

    // Update all glow materials in the model
    glowMaterials.current.forEach((mat) => {
      mat.color.copy(activeColor);
      mat.emissive.copy(activeColor);
    });

    if (pointLightRef.current) {
      pointLightRef.current.color.copy(activeColor);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
      <pointLight ref={pointLightRef} position={[0, -2, 3]} intensity={1.8} />
    </group>
  );
}

/* ─── Canvas wrapper ─────────────────────────────────────── */
function RobotCanvas({ scrollProg }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      {/* Soft neutral fill */}
      <ambientLight intensity={0.45} color="#e8f0f8" />
      {/* Main key light — slightly above-front, warm white */}
      <directionalLight position={[2, 6, 5]}   intensity={2.8} color="#ffffff" castShadow />
      {/* Rim light from upper-left, cool blue */}
      <directionalLight position={[-5, 4, -3]} intensity={0.7} color="#b8d4ff" />
      {/* Subtle warm bounce from below */}
      <directionalLight position={[0, -3, 2]}  intensity={0.3} color="#fff8e8" />
      <Suspense fallback={null}>
        <GLBScene scrollProg={scrollProg} />
        <Environment preset="studio" background={false} />
        <ContactShadows position={[0, -1.35, 0]} opacity={0.4} scale={6} blur={3} far={4} color="#888" />
      </Suspense>
    </Canvas>
  );
}

/* ─── Spinner shown while Suspense resolves ──────────────── */
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

    const texts = STEPS.map((s) => pin.querySelector(`.${s.cls}`));

    // Hide all text blocks at start
    gsap.set(texts, { opacity: 0, y: 60 });

    /*
     * Timeline explanation
     * ─────────────────────
     * end: '+=300%' gives 3 full viewport-heights of scroll per pin.
     * Total virtual duration = STEPS.length (4 units).
     * Each step gets 1 unit:
     *   [0 → 0.2]  fade-in  (opacity 0→1, y 60→0)
     *   [0.2→0.7]  hold     (no change)
     *   [0.7→1.0]  fade-out (opacity 1→0, y 0→-50)  ← skip on last
     */
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

      // Fade in
      tl.fromTo(el,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, ease: 'power2.out', duration: IN_DUR },
        base
      );

      // Fade out (not last step)
      if (i < STEPS.length - 1) {
        tl.to(el,
          { opacity: 0, y: -50, ease: 'power2.in', duration: OUT_DUR },
          base + OUT_AT
        );
      }
    });

    // Extra padding so last step stays visible at end of scroll
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

        {/* 3D Canvas — full viewport */}
        <div className="rs-canvas-wrap" aria-hidden="true">
          <Suspense fallback={<Spinner />}>
            <CanvasErrorBoundary scrollProg={scrollProg}>
              <RobotCanvas scrollProg={scrollProg} />
            </CanvasErrorBoundary>
          </Suspense>
        </div>

        {/* Text blocks — right panel */}
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

useGLTF.preload('/3d-model/robo_face.glb');
