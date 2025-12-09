import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import TreeTopper from './TreeTopper';
import Effects from './Effects';
import { COLORS } from '../constants';

interface SceneProps {
  isTreeForm: boolean;
}

const Scene: React.FC<SceneProps> = ({ isTreeForm }) => {
  const targetState = isTreeForm ? 1 : 0;

  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: false, toneMappingExposure: 1.2 }}>
      <PerspectiveCamera makeDefault position={[0, 2, 35]} fov={50} />
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.6}
        minDistance={10}
        maxDistance={60}
        autoRotate={isTreeForm}
        autoRotateSpeed={0.8}
        zoomSpeed={0.5}
      />
      
      <group position={[0, -5, 0]}>
        {/* Pass targetState (0 or 1). Components handle the smooth transition (lerp) internally in useFrame */}
        <Foliage targetState={targetState} />
        <TreeTopper targetState={targetState} />
        <Ornaments type="sphere" targetState={targetState} />
        <Ornaments type="box" targetState={targetState} />
      </group>

      {/* Dramatic Lighting */}
      <ambientLight intensity={0.1} color={COLORS.EMERALD_DEEP} />
      
      {/* Key Light (Warm Gold) */}
      <spotLight 
        position={[15, 30, 15]} 
        angle={0.25} 
        penumbra={1} 
        intensity={250} 
        color={COLORS.WHITE_WARM} 
        castShadow 
        shadow-bias={-0.0001}
      />
      
      {/* Fill Light (Cooler to contrast gold) */}
      <pointLight position={[-15, 10, -15]} intensity={10} color="#002211" />
      
      {/* Rim Light for contour */}
      <spotLight position={[0, 10, -20]} intensity={50} color={COLORS.GOLD} />

      <Environment preset="city" blur={0.7} background={false} />
      
      {/* Subtle background particles */}
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
      
      <Effects />
    </Canvas>
  );
};

export default Scene;