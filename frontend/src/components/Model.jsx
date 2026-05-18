import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const ModelContent = ({ modelPath }) => {
  const { scene } = useGLTF(modelPath);
  const meshRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Continuous gentle floating animation
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(t) * 0.1;
      
      // Mouse-reactive: tilts slightly toward cursor
      const { x, y } = state.mouse;
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -y * 0.2, 0.1);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, x * 0.2, 0.1);
    }
  });

  return (
    <primitive 
      ref={meshRef}
      object={scene} 
      scale={2.5} 
      position={[0, 0, 0]} 
      rotation={[0, 0, 0]}
    />
  );
};

const Model = () => {
  // Path based on what was found in the public directory
  const modelPath = '/3d-model/your-model.glb';

  return (
    <div className="w-full h-[400px] md:h-[600px] relative">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Suspense fallback={null}>
          <ModelContent modelPath={modelPath} />
          <Environment preset="city" />
          <ContactShadows 
            position={[0, -1.5, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2.5} 
            far={4.5} 
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Model;
