import React, { useMemo, useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, COLORS } from '../constants';

// Define the custom shader material
class FoliageMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 }, // 0 = Scatter, 1 = Tree
      },
      vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        
        attribute vec3 aScatterPos;
        attribute vec3 aTreePos;
        attribute float aRandom;
        
        varying float vAlpha;
        varying vec3 vColor;

        void main() {
          float t = smoothstep(0.0, 1.0, uProgress);
          
          // Mix positions
          vec3 pos = mix(aScatterPos, aTreePos, t);
          
          // Turbulence when scattered
          float floatIntensity = (1.0 - t) * 0.8 + (t * 0.02); 
          vec3 noise = vec3(
            sin(uTime * 0.5 + aScatterPos.y),
            cos(uTime * 0.3 + aScatterPos.x),
            sin(uTime * 0.5 + aScatterPos.z)
          ) * floatIntensity;
          
          // Spiral assembly effect
          if (t > 0.05 && t < 0.95) {
             float twist = (1.0 - t) * 10.0;
             float angle = twist * (pos.y / 10.0);
             float s = sin(angle);
             float c = cos(angle);
             // Simple rotation matrix application around Y
             float x = pos.x * c - pos.z * s;
             float z = pos.x * s + pos.z * c;
             pos.x = x;
             pos.z = z;
          }
          
          vec3 finalPos = pos + noise;
          vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size attenuation
          float sizeBase = (1.0 - t) * 5.0 + t * 4.5;
          gl_PointSize = sizeBase * (40.0 / -mvPosition.z);
          
          // Color Logic
          float heightFactor = (aTreePos.y + 7.0) / 14.0;
          vec3 cDeep = vec3(0.0, 0.1, 0.05); // Deep Emerald
          vec3 cLight = vec3(0.02, 0.3, 0.15); // Lighter Green
          vColor = mix(cDeep, cLight, heightFactor);
          
          // Gold Glitter
          if (aRandom > 0.85) {
             float sparkle = sin(uTime * 3.0 + aRandom * 100.0);
             if (sparkle > 0.5) {
                vColor = vec3(1.0, 0.8, 0.2); // Gold
                gl_PointSize *= 1.5;
             }
          }

          vAlpha = 0.6 + 0.4 * sin(uTime + aRandom * 10.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          
          // Glowy center
          float strength = 1.0 - (dist * 2.0);
          strength = pow(strength, 1.5);
          
          gl_FragColor = vec4(vColor, vAlpha * strength);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }
}

extend({ FoliageMaterial });

interface FoliageProps {
  targetState: number; // 0 or 1
}

const Foliage: React.FC<FoliageProps> = ({ targetState }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const count = CONFIG.FOLIAGE_COUNT;
  const currentProgress = useRef(0);

  // Generate Geometry Data
  const attributes = useMemo(() => {
    const scatterPos = new Float32Array(count * 3);
    const treePos = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      randoms[i] = Math.random();

      // SCATTER
      const r = CONFIG.SCATTER_RADIUS * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      scatterPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      scatterPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      scatterPos[i * 3 + 2] = r * Math.cos(phi);

      // TREE
      const y = (Math.random() * CONFIG.TREE_HEIGHT) - (CONFIG.TREE_HEIGHT / 2);
      const normalizedY = (y + (CONFIG.TREE_HEIGHT / 2)) / CONFIG.TREE_HEIGHT;
      const currentRadius = CONFIG.TREE_RADIUS_BASE * (1.0 - normalizedY);
      const angle = i * 2.39996;
      const radiusJitter = (Math.random() - 0.5) * 1.5;
      
      treePos[i * 3] = (currentRadius + radiusJitter) * Math.cos(angle);
      treePos[i * 3 + 1] = y;
      treePos[i * 3 + 2] = (currentRadius + radiusJitter) * Math.sin(angle);
    }
    return { scatterPos, treePos, randoms };
  }, [count]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Foliage moves quickly and lightly
      currentProgress.current = THREE.MathUtils.damp(currentProgress.current, targetState, 2.0, delta);
      
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = currentProgress.current;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={attributes.scatterPos} itemSize={3} />
        <bufferAttribute attach="attributes-aScatterPos" count={count} array={attributes.scatterPos} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={count} array={attributes.treePos} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={attributes.randoms} itemSize={1} />
      </bufferGeometry>
      {/* @ts-ignore */}
      <foliageMaterial ref={materialRef} />
    </points>
  );
};

export default Foliage;
