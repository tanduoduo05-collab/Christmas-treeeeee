import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, COLORS } from '../constants';

interface OrnamentProps {
  type: 'sphere' | 'box';
  targetState: number; // 0 or 1
}

const tempObject = new THREE.Object3D();

const Ornaments: React.FC<OrnamentProps> = ({ type, targetState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = type === 'sphere' ? CONFIG.ORNAMENT_SPHERE_COUNT : CONFIG.ORNAMENT_BOX_COUNT;
  const currentProgress = useRef(0);

  // Memoize geometry to prevent recreation on re-renders
  const geometry = useMemo(() => {
    return type === 'sphere' 
      ? new THREE.SphereGeometry(1, 16, 16) 
      : new THREE.BoxGeometry(1, 1, 1);
  }, [type]);

  // Pre-calculate positions
  const data = useMemo(() => {
    const scatterPositions = [];
    const treePositions = [];
    const rotations = [];
    const scales = [];
    const colors = [];

    // Custom Color Palettes
    let colorPalette: THREE.Color[];
    
    if (type === 'box') {
        // Boxes: Red, Gold (Dominant), Silver
        colorPalette = [
            COLORS.GOLD, COLORS.GOLD, COLORS.GOLD, COLORS.GOLD, // 4x Gold
            COLORS.ACCENT_RED,  // 1x Red
            COLORS.SILVER       // 1x Silver
        ];
    } else {
        // Spheres: Green (Majority), Gold, Red, Silver
        colorPalette = [
            COLORS.GOLD,
            COLORS.ACCENT_RED,
            COLORS.SILVER,
            COLORS.EMERALD_LIGHT, COLORS.EMERALD_LIGHT, COLORS.EMERALD_LIGHT, COLORS.EMERALD_LIGHT // 4x Green
        ];
    }

    // Golden Angle for spiral distribution
    const phi = Math.PI * (3 - Math.sqrt(5)); 
    // Offset angle for boxes so they don't align perfectly with spheres
    const typeOffset = type === 'box' ? 1.618 : 0; 

    for (let i = 0; i < count; i++) {
      // SCATTER
      const r = CONFIG.SCATTER_RADIUS * 1.5 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phiScatter = Math.acos(2 * Math.random() - 1);
      scatterPositions.push(
        r * Math.sin(phiScatter) * Math.cos(theta),
        r * Math.sin(phiScatter) * Math.sin(theta),
        r * Math.cos(phiScatter)
      );

      // TREE - Organic Spiral Distribution
      
      const k = (i + Math.random() * 0.1) / count;
      const effectiveHeight = CONFIG.TREE_HEIGHT - 1.0; 
      const topY = (CONFIG.TREE_HEIGHT / 2) - 0.5;
      
      // 1. Vertical Randomness
      const yJitter = (Math.random() - 0.5) * 1.0; 
      const y = topY - (effectiveHeight * Math.sqrt(k)) + yJitter;
      
      // Normalize Y for radius calc
      const normalizedY = (y + (CONFIG.TREE_HEIGHT / 2)) / CONFIG.TREE_HEIGHT;
      const safeNormY = Math.max(0, Math.min(1, normalizedY));
      
      // Calculate Base Angle
      const angleJitter = (Math.random() - 0.5) * 0.2; 
      const angle = i * phi + typeOffset + angleJitter;

      // 2. Organic Radius / Branch Simulation
      // - Base Cone Radius matching the foliage shape
      const baseConeRadius = CONFIG.TREE_RADIUS_BASE * (1.0 - safeNormY);
      
      // - Branch Undulation: Creates "lobes"
      //   Reduced amplitude (0.5) to keep ornaments closer to the foliage surface
      const branchNoise = Math.sin(angle * 5.0 + y * 0.5) * Math.cos(y * 2.0) * 0.5;
      
      // - Depth Jitter: Crucial for "Compact" feel. 
      //   Range: -1.2 (deep in leaves) to +0.4 (slightly sticking out).
      //   Previously was biased outward, causing the floating effect.
      const depthJitter = (Math.random() * 1.6) - 1.2;

      // Final Radius
      // Removed the fixed offset (was 0.4) to allow ornaments to sit flush or inside the tree volume
      const finalRadius = Math.max(0.2, baseConeRadius + branchNoise + depthJitter);

      treePositions.push(
        finalRadius * Math.cos(angle),
        y,
        finalRadius * Math.sin(angle)
      );

      // Rotation
      rotations.push(
          Math.random() * Math.PI * 2, 
          Math.random() * Math.PI * 2, 
          Math.random() * Math.PI * 2
      );
      
      // Size variation
      const scaleBase = type === 'sphere' ? 0.25 : 0.35;
      const scaleVariation = Math.random() * 0.4 + (Math.random() > 0.85 ? 0.25 : 0);
      scales.push(scaleBase + scaleVariation);
      
      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors.push(col.r, col.g, col.b);
    }
    return { scatterPositions, treePositions, rotations, scales, colors };
  }, [count, type]);

  // Apply colors
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const tempColor = new THREE.Color();
    for (let i = 0; i < count; i++) {
      tempColor.setRGB(data.colors[i * 3], data.colors[i * 3 + 1], data.colors[i * 3 + 2]);
      meshRef.current.setColorAt(i, tempColor);
    }
    if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [data, count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const dampSpeed = type === 'box' ? 1.0 : 1.8;
    currentProgress.current = THREE.MathUtils.damp(currentProgress.current, targetState, dampSpeed, delta);
    
    const t = currentProgress.current;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      
      const sx = data.scatterPositions[idx];
      const sy = data.scatterPositions[idx + 1];
      const sz = data.scatterPositions[idx + 2];
      
      const tx = data.treePositions[idx];
      const ty = data.treePositions[idx + 1];
      const tz = data.treePositions[idx + 2];

      const floatY = (1.0 - t) * Math.sin(time + sx) * 0.3;

      tempObject.position.set(
        THREE.MathUtils.lerp(sx, tx, t),
        THREE.MathUtils.lerp(sy, ty, t) + floatY,
        THREE.MathUtils.lerp(sz, tz, t)
      );

      const sway = t > 0.8 ? Math.sin(time * 1.5 + idx) * 0.05 : 0;
      
      const rotX = THREE.MathUtils.lerp(data.rotations[idx] + time * 0.5, data.rotations[idx] + sway, t);
      const rotY = THREE.MathUtils.lerp(data.rotations[idx + 1] + time * 0.5, data.rotations[idx + 1], t);
      const rotZ = THREE.MathUtils.lerp(data.rotations[idx + 2] + time * 0.5, data.rotations[idx + 2] + sway, t);

      tempObject.rotation.set(rotX, rotY, rotZ);

      const s = data.scales[i];
      const pulse = t > 0.9 ? (1 + Math.sin(time * 2 + idx) * 0.03) : 1;
      tempObject.scale.set(s * pulse, s * pulse, s * pulse);

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]} castShadow receiveShadow>
      <meshStandardMaterial 
        roughness={type === 'sphere' ? 0.15 : 0.25} 
        metalness={type === 'sphere' ? 0.95 : 0.7} 
        envMapIntensity={2.5}
      />
    </instancedMesh>
  );
};

export default Ornaments;