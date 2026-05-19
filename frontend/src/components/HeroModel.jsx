import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createDisintegrationMaterial, addBarycentricCoords } from '../shaders/DisintegrationShader';

gsap.registerPlugin(ScrollTrigger);

/* ===========================
   Premium Material Enhancement
   =========================== */
function enhanceMaterials(scene, materialsRef) {
  materialsRef.current = [];

  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  const minY = box.min.y;
  const heightY = box.max.y - box.min.y;

  scene.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    // Clone geometry to prevent mutating shared useGLTF cache and breaking WebGLRenderer VAO state
    let geom = child.geometry.clone();
    if (geom.index) {
      geom = geom.toNonIndexed();
    }
    addBarycentricCoords(geom);
    if (!geom.attributes.normal) {
      geom.computeVertexNormals();
    }
    child.geometry = geom;

    // Create premium MeshPhysicalMaterial for ultra-realistic Apple-quality PBR lighting & reflections
    const mat = new THREE.MeshPhysicalMaterial({ transparent: true });
    mat.needsUpdate = true;

    const name = child.material.name.toLowerCase();
    const meshName = child.name.toLowerCase();

    const isEye = name.includes('material_12') || meshName.includes('eye');
    const isCable = name.includes('wire') || meshName.includes('wire');
    const isFace = name.includes('face') || meshName.includes('face') || meshName.includes('head_front');
    const isBlack = name.includes('skull') || name.includes('neck') || name.includes('back');
    const isGold = name.includes('gold') || meshName.includes('gold');
    const isChrome = name.includes('chrome') || meshName.includes('chrome');

    if (isEye) {
      mat.color.set('#26D862');
      mat.emissive.set('#26D862');
      mat.emissiveIntensity = 2.0;
      mat.metalness = 0.0;
      mat.roughness = 0.0;
      mat.opacity = 0.95;
    } else if (isCable) {
      mat.color.set('#26D862');
      mat.emissive.set('#1DB954');
      mat.emissiveIntensity = 0.7;
      mat.metalness = 0.6;
      mat.roughness = 0.3;
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
      mat.color.set('#1c2128');
      mat.metalness = 0.6;
      mat.roughness = 0.45;
      mat.clearcoat = 0.3;
      mat.clearcoatRoughness = 0.2;
      mat.envMapIntensity = 1.2;
    }

    // Inject Disintegration Shader logic directly into MeshPhysicalMaterial via onBeforeCompile!!!
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uProgress = { value: 0.0 };
      shader.uniforms.uTime = { value: 0.0 };
      shader.uniforms.uMinY = { value: minY };
      shader.uniforms.uHeightY = { value: heightY };
      shader.uniforms.uLineColor = { value: new THREE.Color('#26D862') };
      shader.uniforms.uLineWidth = { value: 1.5 };
      shader.uniforms.uScanlineWidth = { value: 0.12 };

      materialsRef.current.push(shader.uniforms);

      // Vertex Shader Injection
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        attribute vec3 aBarycentric;
        uniform float uProgress;
        uniform float uTime;
        uniform float uMinY;
        uniform float uHeightY;
        varying vec3 vBarycentric;
        varying float vNormalizedY;
        varying float vYPosition;`
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vBarycentric = aBarycentric;
        vYPosition = position.y;
        float h = uHeightY > 0.001 ? uHeightY : 3.0;
        float m = uHeightY > 0.001 ? uMinY : -1.5;
        vNormalizedY = clamp((position.y - m) / h, 0.0, 1.0);

        float edgeGlow = smoothstep(0.0, 0.1, abs(vNormalizedY - uProgress));
        edgeGlow = 1.0 - edgeGlow;
        transformed += normal * edgeGlow * 0.02 * uProgress;`
      );

      // Fragment Shader Injection
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
        uniform float uProgress;
        uniform float uTime;
        uniform vec3 uLineColor;
        uniform float uLineWidth;
        uniform float uScanlineWidth;
        varying vec3 vBarycentric;
        varying float vNormalizedY;
        varying float vYPosition;

        float wireframe(vec3 bary, float width) {
          vec3 d = fwidth(bary);
          vec3 a3 = smoothstep(d * (width - 0.5), d * (width + 0.5), bary);
          return min(min(a3.x, a3.y), a3.z);
        }`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>

        float scanlinePos = 1.0 - uProgress;
        float waveHalf = uScanlineWidth * 0.5;
        float dist = vNormalizedY - scanlinePos;

        float behindWave = smoothstep(-waveHalf, waveHalf, dist);
        float inWave = 1.0 - smoothstep(0.0, waveHalf * 2.0, abs(dist));

        float wire = wireframe(vBarycentric, uLineWidth);

        if (behindWave > 0.99 && uProgress > 0.01) {
          if (wire > 0.5) {
            discard;
          }
          vec3 neonEdge = uLineColor * (1.2 + sin(uTime * 4.0 + vYPosition * 8.0) * 0.15);
          float fade = 1.0 - smoothstep(0.0, 0.6, dist - waveHalf);
          float edgeAlpha = (1.0 - wire) * max(fade, 0.6);
          gl_FragColor = vec4(neonEdge, edgeAlpha);
        } else if (inWave > 0.01 && uProgress > 0.01) {
          float wireEdge = 1.0 - wire;
          vec3 scanGlow = uLineColor * (2.0 + sin(uTime * 6.0 + vYPosition * 12.0) * 0.5);
          vec3 transitionColor = mix(gl_FragColor.rgb, scanGlow, inWave * behindWave);
          transitionColor = mix(transitionColor, uLineColor * 1.8, wireEdge * inWave * 0.7);
          gl_FragColor = vec4(transitionColor, gl_FragColor.a);
        }`
      );
    };

    child.material = mat;
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
  const disintProgress = useRef({ value: 0 });
  const shaderMaterialsRef = useRef([]);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    enhanceMaterials(clone, shaderMaterialsRef);
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

  // Scroll-driven rotation & disintegration
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Existing scroll rotation
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

      // 2. Disintegration progress synced with ScrollStorySection
      gsap.to(disintProgress.current, {
        value: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.velora-scroll-story',
          start: 'top bottom',
          end: 'top 45%', // Fully wireframe by the time the green signal line emerges!
          scrub: 1,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const p = disintProgress.current.value;

    // Update all shader materials
    shaderMaterialsRef.current.forEach((mat) => {
      if (mat && mat.uniforms) {
        mat.uniforms.uTime.value = t;
        mat.uniforms.uProgress.value = p;
      }
    });

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
