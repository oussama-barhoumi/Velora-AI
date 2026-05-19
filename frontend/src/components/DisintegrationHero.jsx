import { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   CUSTOM GLSL — Disintegration Wireframe Shader
   ═══════════════════════════════════════════════════════ */

const vertexShader = /* glsl */ `
  attribute vec3 aBarycentric;

  uniform float uProgress;
  uniform float uTime;

  varying vec3  vBary;
  varying vec3  vNormal;
  varying vec3  vWorldPos;
  varying float vNormY;

  void main() {
    vBary   = aBarycentric;
    vNormal = normalize(normalMatrix * normal);

    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos  = world.xyz;

    // Normalize Y into 0..1 range (model centered ≈ -1.5 → 1.5)
    vNormY = clamp((position.y + 1.5) / 3.0, 0.0, 1.0);

    // Subtle outward push at the transition edge
    float edgeDist = abs(vNormY - uProgress);
    float push     = (1.0 - smoothstep(0.0, 0.12, edgeDist)) * uProgress;
    vec3 displaced = position + normal * push * 0.025;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  #extension GL_OES_standard_derivatives : enable

  uniform float uProgress;
  uniform float uTime;
  uniform vec3  uLineColor;
  uniform vec3  uBaseColor;
  uniform float uLineWidth;
  uniform float uBandWidth;

  varying vec3  vBary;
  varying vec3  vNormal;
  varying vec3  vWorldPos;
  varying float vNormY;

  /* ── Analytical wireframe via screen-space derivatives ── */
  float edgeFactor(vec3 bary, float w) {
    vec3 d  = fwidth(bary);
    vec3 f  = smoothstep(d * (w - 0.5), d * (w + 0.5), bary);
    return min(min(f.x, f.y), f.z);          // 0 on edge, 1 interior
  }

  /* ── Simple PBR-ish hemisphere + key light ── */
  vec3 lightSolid(vec3 n, vec3 col) {
    float hemi = dot(n, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
    vec3 ambient = mix(vec3(0.06), vec3(0.82, 0.85, 0.92), hemi);

    float key  = max(dot(n, normalize(vec3(0.5, 0.8, 0.4))), 0.0);
    float rim  = pow(1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);

    return col * ambient
         + col * vec3(1.0, 0.98, 0.94) * key * 0.7
         + vec3(0.15, 0.35, 0.15) * rim * 0.25;
  }

  void main() {
    float halfBand = uBandWidth * 0.5;
    float dist     = vNormY - uProgress;          // >0 = above scanline

    /* ── Zone flags ── */
    float behind = smoothstep(-halfBand, halfBand, dist);       // 1 = wireframe zone
    float band   = 1.0 - smoothstep(0.0, halfBand * 2.5, abs(dist));  // glow band

    float wire = edgeFactor(vBary, uLineWidth);   // 0 = edge, 1 = interior

    /* ────────────────────────────────────────────
       ZONE A — Fully transitioned → wireframe only
       ──────────────────────────────────────────── */
    if (behind > 0.99 && uProgress > 0.005) {
      if (wire > 0.5) discard;                    // kill interior faces

      // Neon edge with subtle flicker
      float flicker = 1.0 + sin(uTime * 5.0 + vWorldPos.y * 10.0) * 0.12;
      vec3 neon     = uLineColor * flicker * 1.3;
      float alpha   = (1.0 - wire) * 0.92;

      // Fade edges further from the scanline for depth
      alpha *= mix(0.25, 1.0, 1.0 - smoothstep(0.0, 0.5, dist - halfBand));

      gl_FragColor = vec4(neon, alpha);
      return;
    }

    /* ────────────────────────────────────────────
       ZONE B — Scanline transition band
       ──────────────────────────────────────────── */
    if (band > 0.01 && uProgress > 0.005) {
      vec3 solid = lightSolid(vNormal, uBaseColor);

      // Horizontal scanlines inside the band
      float scan = sin(vWorldPos.y * 140.0 + uTime * 10.0) * 0.5 + 0.5;
      vec3 glow  = uLineColor * (2.2 + scan * 0.4);

      // Edge highlight
      float wireEdge = 1.0 - wire;

      vec3 col = mix(solid, glow, band * behind);
      col      = mix(col, uLineColor * 2.0, wireEdge * band * 0.75);

      float alpha = mix(1.0, wireEdge * 0.85 + 0.15, behind);
      gl_FragColor = vec4(col, alpha);
      return;
    }

    /* ────────────────────────────────────────────
       ZONE C — Solid (untouched)
       ──────────────────────────────────────────── */
    gl_FragColor = vec4(lightSolid(vNormal, uBaseColor), 1.0);
  }
`;

/* ═══════════════════════════════════════════════════════
   Geometry Helper — Barycentric Coordinates
   ═══════════════════════════════════════════════════════
   Converts indexed → non-indexed geometry, then assigns
   (1,0,0) / (0,1,0) / (0,0,1) per triangle vertex.
   Required for the analytical wireframe technique.       */

function addBarycentricCoords(geometry) {
  if (geometry.index) {
    const ni = geometry.toNonIndexed();
    for (const key of Object.keys(ni.attributes)) {
      geometry.setAttribute(key, ni.attributes[key]);
    }
    geometry.setIndex(null);
  }

  const count = geometry.attributes.position.count;
  const bary  = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 3) {
    bary.set([1, 0, 0], i * 3);
    bary.set([0, 1, 0], (i + 1) * 3);
    bary.set([0, 0, 1], (i + 2) * 3);
  }

  geometry.setAttribute('aBarycentric', new THREE.BufferAttribute(bary, 3));
}

/* ═══════════════════════════════════════════════════════
   R3F Inner Component — Model + Shader + Animation
   ═══════════════════════════════════════════════════════ */

const MODEL_PATH = '/3d-model/your-model.glb';

// Shared mutable ref for scroll → shader communication
const scrollProxy = { progress: 0 };

function DisintegrationModel() {
  const groupRef    = useRef();
  const materialRef = useRef();
  const mouse       = useRef({ x: 0, y: 0 });

  const { scene } = useGLTF(MODEL_PATH);

  /* ── Clone scene, prepare geometry, apply shader ── */
  const { clonedScene, shaderMaterial } = useMemo(() => {
    const clone = scene.clone(true);

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uProgress:  { value: 0.0 },
        uTime:      { value: 0.0 },
        uBaseColor: { value: new THREE.Color('#cfd8e3') },   // Titanium silver
        uLineColor: { value: new THREE.Color('#00ff66') },   // Neon green
        uLineWidth: { value: 1.4 },
        uBandWidth: { value: 0.09 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
      extensions: { derivatives: true },
    });

    // Center + scale, then prepare each mesh
    const box    = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    const size   = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    clone.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 2.2 / maxDim;

    clone.traverse((child) => {
      if (!child.isMesh) return;
      addBarycentricCoords(child.geometry);
      if (!child.geometry.attributes.normal) {
        child.geometry.computeVertexNormals();
      }
      child.material = mat;
    });

    return { clonedScene: clone, shaderMaterial: mat, scaleFactor: s };
  }, [scene]);

  /* ── Scale the group ── */
  useEffect(() => {
    if (!groupRef.current) return;
    const box  = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    groupRef.current.scale.setScalar(2.2 / maxDim);
  }, [clonedScene]);

  /* ── Mouse tracking ── */
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  /* ── Per-frame updates ── */
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Update shader uniforms
    shaderMaterial.uniforms.uTime.value     = t;
    shaderMaterial.uniforms.uProgress.value = scrollProxy.progress;

    // Gentle float
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.7) * 0.1;

      // Mouse-reactive rotation
      const tx = mouse.current.y * 0.1;
      const ty = mouse.current.x * 0.1;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tx, 0.04);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, ty, 0.04);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   Studio Lighting Rig
   ═══════════════════════════════════════════════════════ */

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.2} color="#c8d8ff" />
      <directionalLight position={[4, 8, 4]}  intensity={1.2} color="#fff5e0" />
      <directionalLight position={[-5, 2, -3]} intensity={0.4} color="#aac4ff" />
      <directionalLight position={[0, -3, -5]} intensity={0.5} color="#26D862" />
      <hemisphereLight args={['#c0d4ff', '#0a0a14', 0.12]} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Loading Spinner
   ═══════════════════════════════════════════════════════ */

function Loader() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 48, height: 48,
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#00ff66',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Export — DisintegrationHero
   ═══════════════════════════════════════════════════════
   Drop this component anywhere. It renders a full-height
   section with a sticky 3D canvas. Scrolling through the
   section drives the solid → wireframe transition.

   Usage:
     <DisintegrationHero />
*/

export default function DisintegrationHero() {
  const sectionRef = useRef(null);

  /* ── GSAP ScrollTrigger → shader uniform ── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.to(scrollProxy, {
        progress: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,          // Smooth 1.5s scrub
          // markers: true,    // Uncomment to debug
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="disintegration-hero"
      id="disintegration"
      style={{
        position: 'relative',
        height: '300vh',               // 3× viewport for scroll room
        background: '#050505',
      }}
    >
      {/* Sticky canvas viewport */}
      <div style={{
        position: 'sticky',
        top: 0,
        width: '100%',
        height: '100vh',
        zIndex: 1,
      }}>
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          style={{ background: 'transparent' }}
        >
          <Lighting />
          <Suspense fallback={null}>
            <DisintegrationModel />
          </Suspense>
        </Canvas>

        {/* HUD overlay text */}
        <div style={{
          position: 'absolute',
          bottom: 48,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.35)',
          fontFamily: 'var(--font-sans, system-ui)',
          fontSize: '0.82rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          scroll to transform
        </div>
      </div>

      {/* Fallback loader (shown while model loads) */}
      <Loader />
    </section>
  );
}

// Preload the model on module import
useGLTF.preload(MODEL_PATH);
