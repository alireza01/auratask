"use client";
import * as THREE from 'three';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { useTheme } from 'next-themes';
import { useMemo, useRef } from 'react';
import { MaterialNode } from '@react-three/fiber';

// Define the shader material using drei's shaderMaterial helper
const AlirezaBackgroundMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uResolution: new THREE.Vector2(),
    uMouse: new THREE.Vector2(),
    uColor1: new THREE.Color('#ff0000'), // Default color
    uColor2: new THREE.Color('#0000ff'), // Default color
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying vec2 vUv;

  // GLSL noise function
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    st.x *= uResolution.x / uResolution.y;

    vec3 color = mix(uColor1, uColor2, vUv.y);

    float n = noise(vUv * 10.0 + uTime * 0.1);
    color += n * 0.1;

    gl_FragColor = vec4(color, 1.0);
  }
  `
);

// Extend Three.js with our custom material
extend({ AlirezaBackgroundMaterial });

// Typing for our custom material
// This is the main fix for the original error.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      alirezaBackgroundMaterial: MaterialNode<
        typeof AlirezaBackgroundMaterial & {
          uTime?: number;
          uResolution?: THREE.Vector2;
          uMouse?: THREE.Vector2;
          uColor1?: THREE.Color;
          uColor2?: THREE.Color;
        },
        typeof AlirezaBackgroundMaterial
      >;
    }
  }
}

const Scene = () => {
  // We use a properly typed ref for our material
  const materialRef = useRef<THREE.ShaderMaterial & typeof AlirezaBackgroundMaterial>(null);
  const { theme } = useTheme();

  // We use useMemo to efficiently update colors when the theme changes
  const colors = useMemo(() => {
    // Check for system theme preference as well
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      return {
        color1: new THREE.Color('#1E293B'), // Dark Slate
        color2: new THREE.Color('#0F172A'), // Darker Slate
      };
    }
    return {
      color1: new THREE.Color('#F1F5F9'), // Light Slate
      color2: new THREE.Color('#E2E8F0'), // Lighter Slate
    };
  }, [theme]);

  // useFrame runs on every frame, perfect for animations
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uResolution.value.x = state.viewport.width * state.viewport.dpr;
      materialRef.current.uniforms.uResolution.value.y = state.viewport.height * state.viewport.dpr;
      materialRef.current.uniforms.uMouse.value = state.mouse;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      {/* We pass the theme colors as props to our material */}
      <alirezaBackgroundMaterial ref={materialRef} uColor1={colors.color1} uColor2={colors.color2} />
    </mesh>
  );
};

export const AlirezaThemeBackground = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
};
