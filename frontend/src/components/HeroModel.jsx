import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ===========================
   Premium Material Enhancement
   =========================== */
function enhanceMaterials(scene) {
  scene.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    // Ensure MeshStandardMaterial or MeshPhysicalMaterial
    if (
      !(child.material instanceof THREE.MeshStandardMaterial) &&
      !(child.material instanceof THREE.MeshPhysicalMaterial)
    ) {
      child.material = new THREE.MeshPhysicalMaterial();
    }

    const mat = child.material;
    mat.needsUpdate = true;

    const name = mat.name.toLowerCase();
    const meshName = child.name.toLowerCase();

    const isEye = name.includes('material_12') || meshName.includes('eye');
    const isCable = name.includes('wire') || meshName.includes('wire');
    const isFace = name.includes('face') || meshName.includes('face') || meshName.includes('head_front');
    const isBlack = name.includes('skull') || name.includes('neck') || name.includes('back');
    const isGold = name.includes('gold') || meshName.includes('gold');
    const isChrome = name.includes('chrome') || meshName.includes('chrome');

    if (isEye) {
      // Vivid green glow (brand color)
      mat.color.set('#26D862');
      mat.emissive.set('#26D862');
      mat.emissiveIntensity = 2.0;
      mat.metalness = 0.0;
      mat.roughness = 0.0;
      mat.transparent = true;
      mat.opacity = 0.95;

    } else if (isCable) {
      // Deep green wires (brand color)
      mat.color.set('#26D862');
      mat.emissive.set('#1DB954'); // Slightly darker green for cable depth
      mat.emissiveIntensity = 0.7;
      mat.metalness = 0.6;
      mat.roughness = 0.3;

    } else if (isGold) {
      // Warm brushed gold
      mat.color.set('#c8961e');
      mat.emissive.set('#7a5000');
      mat.emissiveIntensity = 0.2;
      mat.metalness = 1.0;
      mat.roughness = 0.25;
      mat.envMapIntensity = 2.0;

    } else if (isChrome) {
      // Mirror chrome
      mat.color.set('#e8e8e8');
      mat.metalness = 1.0;
      mat.roughness = 0.05;
      mat.envMapIntensity = 2.5;

    } else if (isFace) {
      // Cool polished titanium-silver face
      mat.color.set('#cfd8e3');
      mat.emissive.set('#0d1a2a');
      mat.emissiveIntensity = 0.05;
      mat.metalness = 0.92;
      mat.roughness = 0.1;
      mat.clearcoat = 1.0;
      mat.clearcoatRoughness = 0.02;
      mat.envMapIntensity = 2.0;

    } else if (isBlack) {
      // Satin matte black with subtle sheen
      mat.color.set('#0d0d0d');
      mat.emissive.set('#050505');
      mat.emissiveIntensity = 0.03;
      mat.metalness = 0.4;
      mat.roughness = 0.55;
      mat.clearcoat = 0.5;
      mat.clearcoatRoughness = 0.15;
      mat.envMapIntensity = 1.0;

    } else {
      // Default: dark gunmetal
      mat.color.set('#1c2128');
      mat.metalness = 0.6;
      mat.roughness = 0.45;
      mat.clearcoat = 0.3;
      mat.clearcoatRoughness = 0.2;
      mat.envMapIntensity = 1.2;
    }
  });
}

/* ===========================
   Studio Environment Map
   (high-contrast gradient for sharp metal reflections)
   =========================== */
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
        const ny = y / H; // 0 = top, 1 = bottom

        // Sky: bright warm white; floor: very dark
        let r, g, b;
        if (ny < 0.45) {
          // Upper hemisphere – bright studio ceiling
          const t = ny / 0.45;
          r = THREE.MathUtils.lerp(1.4, 0.9, t);
          g = THREE.MathUtils.lerp(1.35, 0.88, t);
          b = THREE.MathUtils.lerp(1.3, 0.85, t);
        } else if (ny < 0.55) {
          // Horizon band – soft grey
          const t = (ny - 0.45) / 0.1;
          r = THREE.MathUtils.lerp(0.9, 0.05, t);
          g = THREE.MathUtils.lerp(0.88, 0.05, t);
          b = THREE.MathUtils.lerp(0.85, 0.06, t);
        } else {
          // Lower hemisphere – near-black floor
          r = g = b = 0.04;
        }

        // Add a subtle blue accent strip on one side
        const nx = x / W;
        if (nx > 0.62 && nx < 0.70 && ny < 0.5) {
          r += 0.0;
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

/* ===========================
   Floating / Mouse-Reactive Model
   =========================== */
function FloatingModel({ url }) {
  const groupRef = useRef();
  const { scene } = useGLTF(url);
  const mouse = useRef({ x: 0, y: 0 });
  const scrollProgress = useRef({ value: 0 });

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    enhanceMaterials(clone);
    return clone;
  }, [scene]);

  // Center + auto-scale the model
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    clonedScene.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (groupRef.current) groupRef.current.scale.setScalar(2 / maxDim);
  }, [clonedScene]);

  // Mouse tracking
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Scroll-driven rotation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(scrollProgress.current, {
        value: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Gentle float
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.12;

    // Mouse look + scroll rotation
    const targetX = mouse.current.y * 0.12;
    const targetY = mouse.current.x * 0.12 + scrollProgress.current.value * Math.PI * 0.15;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.04);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.04);
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

/* ===========================
   WebGL Context Loss Handler
   =========================== */
function ContextHandler() {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (e) => { e.preventDefault(); console.warn('WebGL context lost'); };
    const onRestored = () => { console.info('WebGL context restored'); };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [gl]);
  return null;
}

/* ===========================
   Main Export
   =========================== */
const MODEL_URL = '/3d-model/your-model.glb';

export default function HeroModel() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className="velora-hero__model-canvas"
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', opacity: 0.4, paddingBottom: '10rem' }}
      >
        3D view unavailable
      </div>
    );
  }

  return (
    <div className="velora-hero__model-canvas">
      <Canvas
        camera={{ position: [0, -1, 3.8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance', // was 'default' — request better GPU tier
        }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1; // slight lift for richer highlights
          gl.outputColorSpace = THREE.SRGBColorSpace; // correct gamma output
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setHasError(true);
          });
        }}
      >
        <ContextHandler />
        <SceneEnvironment />

        {/* Studio Lighting Rig */}
        <ambientLight intensity={0.25} color="#c8d8ff" />

        {/* Key light – warm upper-left */}
        <directionalLight position={[4, 8, 4]} intensity={1.6} color="#fff5e0" castShadow />

        {/* Fill light – cool right */}
        <directionalLight position={[-6, 2, -3]} intensity={0.6} color="#aac4ff" />

        {/* Rim / back light – blue accent */}
        <directionalLight position={[0, -3, -6]} intensity={0.8} color="#3a7cff" />

        {/* Soft sky dome */}
        <hemisphereLight args={['#c0d4ff', '#0a0a14', 0.15]} />

        <FloatingModel url={MODEL_URL} />
      </Canvas>
    </div>
  );
}

// Preload once
useGLTF.preload(MODEL_URL);