import * as THREE from 'three';

/* ===========================
   Disintegration Shader Material
   ===========================
   A custom ShaderMaterial that transitions a 3D model from solid surface
   to neon wireframe via a Y-axis scanline sweep.

   Usage:
     import { createDisintegrationMaterial, addBarycentricCoords } from './DisintegrationShader';

     // Prepare geometry (required once)
     addBarycentricCoords(mesh.geometry);

     // Create material
     const mat = createDisintegrationMaterial({
       baseColor: new THREE.Color('#cfd8e3'),
       lineColor: new THREE.Color('#26D862'),
       lineWidth: 1.5,
     });

     mesh.material = mat;

     // Animate in render loop or GSAP
     mat.uniforms.uProgress.value = scrollProgress; // 0.0 → 1.0
*/

/* ===========================
   Barycentric Coordinate Helper
   ===========================
   Assigns per-vertex barycentric coords (1,0,0), (0,1,0), (0,0,1)
   to every triangle. Requires converting to non-indexed geometry first.
*/
export function addBarycentricCoords(geometry) {
  // Must be non-indexed so each triangle has unique vertices
  if (geometry.index) {
    const nonIndexed = geometry.toNonIndexed();
    // Copy all attributes from the non-indexed version
    for (const key of Object.keys(nonIndexed.attributes)) {
      geometry.setAttribute(key, nonIndexed.attributes[key]);
    }
    geometry.setIndex(null);
  }

  const posAttr = geometry.attributes.position;
  const count = posAttr.count;
  const bary = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 3) {
    // Vertex 0 of triangle → (1, 0, 0)
    bary[i * 3 + 0] = 1;
    bary[i * 3 + 1] = 0;
    bary[i * 3 + 2] = 0;
    // Vertex 1 of triangle → (0, 1, 0)
    bary[(i + 1) * 3 + 0] = 0;
    bary[(i + 1) * 3 + 1] = 1;
    bary[(i + 1) * 3 + 2] = 0;
    // Vertex 2 of triangle → (0, 0, 1)
    bary[(i + 2) * 3 + 0] = 0;
    bary[(i + 2) * 3 + 1] = 0;
    bary[(i + 2) * 3 + 2] = 1;
  }

  geometry.setAttribute('aBarycentric', new THREE.BufferAttribute(bary, 3));
}

/* ===========================
   Vertex Shader
   =========================== */
const vertexShader = /* glsl */ `
  attribute vec3 aBarycentric;

  uniform float uProgress;
  uniform float uTime;
  uniform float uMinY;
  uniform float uHeightY;

  varying vec3 vBarycentric;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vYPosition;       // Local Y for scanline direction
  varying float vNormalizedY;     // 0..1 mapped Y for clean transition

  void main() {
    vBarycentric = aBarycentric;
    vNormal = normalize(normalMatrix * normal);

    // World position for lighting
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    // Local Y position (model space) for the transition wave
    vYPosition = position.y;

    // Compute exact 0..1 normalized Y based on geometry bounding box
    float h = uHeightY > 0.001 ? uHeightY : 3.0;
    float m = uHeightY > 0.001 ? uMinY : -1.5;
    vNormalizedY = clamp((position.y - m) / h, 0.0, 1.0);

    // Subtle vertex displacement during transition
    vec3 displaced = position;
    float transitionZone = smoothstep(
      vNormalizedY - 0.05,
      vNormalizedY + 0.05,
      uProgress
    );

    // Push vertices slightly outward in the transition zone
    float edgeGlow = smoothstep(0.0, 0.1, abs(vNormalizedY - uProgress));
    edgeGlow = 1.0 - edgeGlow;
    displaced += normal * edgeGlow * 0.02 * uProgress;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

/* ===========================
   Fragment Shader
   =========================== */
const fragmentShader = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform vec3  uBaseColor;
  uniform vec3  uLineColor;
  uniform float uLineWidth;
  uniform float uScanlineWidth;   // Width of the glowing transition band
  uniform float uOpacity;

  varying vec3  vBarycentric;
  varying vec3  vNormal;
  varying vec3  vWorldPosition;
  varying float vYPosition;
  varying float vNormalizedY;

  /* -----------------------------------------------
     Analytical Wireframe via Barycentric Coordinates
     Uses screen-space derivatives for pixel-perfect
     line width regardless of triangle size.
     ----------------------------------------------- */
  float wireframe(vec3 bary, float width) {
    vec3 d = fwidth(bary);                     // screen-space partial derivatives
    vec3 a3 = smoothstep(d * (width - 0.5), d * (width + 0.5), bary);
    return min(min(a3.x, a3.y), a3.z);        // 0.0 on edge, 1.0 in interior
  }

  /* -----------------------------------------------
     Simple hemisphere lighting for the solid phase
     ----------------------------------------------- */
  vec3 hemisphereLight(vec3 normal, vec3 baseCol) {
    vec3 skyColor   = vec3(0.85, 0.88, 0.95);  // Cool white sky
    vec3 groundColor = vec3(0.08, 0.08, 0.1);  // Dark ground
    float hemi = dot(normal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
    vec3 light = mix(groundColor, skyColor, hemi);

    // Add a subtle directional key light
    float key = max(dot(normal, normalize(vec3(0.5, 0.8, 0.6))), 0.0);
    light += vec3(1.0, 0.97, 0.92) * key * 0.6;

    return baseCol * light;
  }

  void main() {
    /* --- Transition Zones ---
       scanlinePos goes from 1.0 (top) down to 0.0 (bottom) as uProgress goes from 0.0 to 1.0.
       behindWave:  1.0 = fully transitioned (wireframe zone)
       inWave:      1.0 = on the glowing scanline edge
    */
    float scanlinePos = 1.0 - uProgress;
    float waveHalf = uScanlineWidth * 0.5;

    // How far this fragment is from the scanline (in normalized Y)
    float dist = vNormalizedY - scanlinePos;

    // Behind the wave → wireframe zone (positive dist = above scanline)
    float behindWave = smoothstep(-waveHalf, waveHalf, dist);

    // The narrow glowing band at the transition edge
    float inWave = 1.0 - smoothstep(0.0, waveHalf * 2.0, abs(dist));

    // --- Wireframe computation ---
    float wire = wireframe(vBarycentric, uLineWidth);
    // wire = 0.0 on edges, 1.0 in interior

    /* --- Solid Phase (ahead of / below scanline) --- */
    vec3 solidColor = hemisphereLight(vNormal, uBaseColor);

    /* --- Wireframe Phase (behind / above scanline) --- */
    // Discard the interior of triangles, keep only edges
    if (behindWave > 0.99 && uProgress > 0.01) {
      if (wire > 0.5) {
        discard;  // Kill interior fragments → only wireframe edges remain
      }
      // Surviving edge fragments get the neon wireframe color
      vec3 neonEdge = uLineColor * (1.2 + sin(uTime * 4.0 + vYPosition * 8.0) * 0.15);
      float edgeAlpha = (1.0 - wire) * uOpacity;

      // Add subtle distance fade for depth
      float fade = 1.0 - smoothstep(0.0, 0.6, dist - waveHalf);
      edgeAlpha *= max(fade, 0.6);

      gl_FragColor = vec4(neonEdge, edgeAlpha);
      return;
    }

    /* --- Transition Band (the glowing scanline) --- */
    if (inWave > 0.01 && uProgress > 0.01) {
      // Blend between solid and wireframe in the scanline zone
      float wireEdge = 1.0 - wire;

      // Scanline glow: bright neon pulse
      vec3 scanGlow = uLineColor * (2.0 + sin(uTime * 6.0 + vWorldPosition.x * 12.0) * 0.5);
      // Horizontal scan lines within the band
      float scanLines = sin(vWorldPosition.y * 120.0 + uTime * 8.0) * 0.5 + 0.5;
      scanGlow += uLineColor * scanLines * 0.3;

      // Mix: solid surface → glowing edges
      vec3 transitionColor = mix(solidColor, scanGlow, inWave * behindWave);
      // Add wireframe overlay in the band
      transitionColor = mix(transitionColor, uLineColor * 1.8, wireEdge * inWave * 0.7);

      float transAlpha = mix(uOpacity, uOpacity * (wireEdge * 0.8 + 0.2), behindWave);
      gl_FragColor = vec4(transitionColor, transAlpha);
      return;
    }

    /* --- Solid Phase (untouched) --- */
    gl_FragColor = vec4(solidColor, uOpacity);
  }
`;

/* ===========================
   Material Factory
   =========================== */
export function createDisintegrationMaterial(options = {}) {
  const {
    baseColor = new THREE.Color('#cfd8e3'),
    lineColor = new THREE.Color('#26D862'),
    lineWidth = 1.5,
    scanlineWidth = 0.08,
    opacity = 1.0,
    minY = -1.5,
    heightY = 3.0,
  } = options;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uProgress:      { value: 0.0 },
      uTime:          { value: 0.0 },
      uBaseColor:     { value: baseColor },
      uLineColor:     { value: lineColor },
      uLineWidth:     { value: lineWidth },
      uScanlineWidth: { value: scanlineWidth },
      uOpacity:       { value: opacity },
      uMinY:          { value: minY },
      uHeightY:       { value: heightY },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
    extensions: {
      derivatives: true,
    },
  });
}

/* ===========================
   Scene Integration Helper
   ===========================
   Traverses a loaded GLTF scene and replaces all mesh materials
   with the disintegration shader. Returns the shared material
   so you can animate its uniforms externally.

   Usage:
     const { scene } = useGLTF('/model.glb');
     const shaderMat = applyDisintegrationShader(scene);
     // In animation loop:
     shaderMat.uniforms.uProgress.value = progress;
     shaderMat.uniforms.uTime.value = clock.getElapsedTime();
*/
export function applyDisintegrationShader(scene, options = {}) {
  const material = createDisintegrationMaterial(options);

  scene.traverse((child) => {
    if (!child.isMesh) return;

    // Prepare barycentric coordinates on the geometry
    addBarycentricCoords(child.geometry);

    // Ensure normals exist
    if (!child.geometry.attributes.normal) {
      child.geometry.computeVertexNormals();
    }

    // Replace with our custom shader
    child.material = material;
  });

  return material;
}
