import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, COLORS } from '../constants';

interface TreeTopperProps {
  targetState: number; // 0 = Scatter, 1 = Tree
}

const TreeTopper: React.FC<TreeTopperProps> = ({ targetState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentProgress = useRef(0);

  const { scatterPos, treePos, starGeometry } = useMemo(() => {
    // Tree Position: Exact top of the tree
    const treePos = new THREE.Vector3(0, CONFIG.TREE_HEIGHT / 2 + 0.8, 0);
    
    // Scatter Position: Random far away point
    const r = CONFIG.SCATTER_RADIUS * 1.2;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const scatterPos = new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );

    // Create Star Shape
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.2;
    const innerRadius = 0.5;
    
    shape.moveTo(0, outerRadius);
    for (let i = 0; i < points * 2; i++) {
        const rad = (i % 2 === 0) ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / points;
        shape.lineTo(Math.sin(angle) * rad, Math.cos(angle) * rad);
    }
    shape.closePath();

    const starGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2
    });
    starGeometry.center(); // Center geometry for rotation
    
    return { scatterPos, treePos, starGeometry };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Smooth transition
    currentProgress.current = THREE.MathUtils.damp(currentProgress.current, targetState, 1.5, delta);
    const t = currentProgress.current;
    
    // Interpolate position
    groupRef.current.position.lerpVectors(scatterPos, treePos, t);
    
    // Animation
    const time = state.clock.elapsedTime;
    
    // Rotation: Tumble when scattered, precise spin when assembled
    const scatterRot = time * 0.2;
    const treeRot = time * 0.5;
    
    groupRef.current.rotation.y = THREE.MathUtils.lerp(scatterRot, treeRot, t);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(scatterRot, 0, t); // Stabilize upright when formed
    
    // Scale: Pulse effect
    const pulse = 1.0 + Math.sin(time * 2.0) * 0.05;
    const size = THREE.MathUtils.lerp(0.5, 1.0, t); // Larger when assembled
    groupRef.current.scale.setScalar(size * pulse);
  });

  return (
    <group ref={groupRef}>
      {/* Main Star Body */}
      <mesh castShadow geometry={starGeometry}>
        <meshStandardMaterial 
          color={COLORS.GOLD} 
          emissive={COLORS.GOLD}
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={1.0}
        />
      </mesh>
      
      {/* Inner Glow Light */}
      <pointLight color={COLORS.GOLD} intensity={30} distance={15} decay={2} />
    </group>
  );
};

export default TreeTopper;