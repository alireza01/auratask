"use client"

import { useRef, useEffect, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Plane, shaderMaterial } from "@react-three/drei"
import * as THREE from "three"
import { extend } from "@react-three/fiber"

const AlirezaBackgroundMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(),
    uMouse: new THREE.Vector2(),
  },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader - Digital data stream
  `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    varying vec2 vUv;

    // Random function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // Noise function
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      vec2 st = vUv;
      vec2 mouse = uMouse / uResolution;
      
      // Base dark color - deep charcoal
      vec3 baseColor = vec3(0.05, 0.05, 0.08);
      
      // Electric yellow accent
      vec3 yellowAccent = vec3(1.0, 0.84, 0.04); // #FFD60A
      
      // Magenta and cyan glitch colors
      vec3 magentaGlitch = vec3(1.0, 0.0, 0.5);
      vec3 cyanGlitch = vec3(0.0, 1.0, 1.0);
      
      // Create grid pattern
      vec2 grid = fract(st * 20.0);
      float gridLines = step(0.95, grid.x) + step(0.95, grid.y);
      
      // Data stream effect
      float stream1 = noise(vec2(st.x * 5.0, st.y * 10.0 - uTime * 2.0));
      float stream2 = noise(vec2(st.x * 8.0, st.y * 15.0 - uTime * 1.5));
      float stream3 = noise(vec2(st.x * 12.0, st.y * 8.0 - uTime * 3.0));
      
      // Combine streams
      float dataFlow = (stream1 + stream2 + stream3) / 3.0;
      dataFlow = smoothstep(0.4, 0.8, dataFlow);
      
      // Mouse interaction - intensify effects near cursor
      float mouseDistance = distance(st, mouse);
      float mouseInfluence = 1.0 - smoothstep(0.0, 0.3, mouseDistance);
      
      // Glitch effect
      float glitchNoise = random(vec2(floor(st.y * 50.0), floor(uTime * 10.0)));
      float glitch = step(0.98, glitchNoise) * mouseInfluence;
      
      // Build final color
      vec3 finalColor = baseColor;
      
      // Add grid
      finalColor = mix(finalColor, yellowAccent * 0.3, gridLines * 0.1);
      
      // Add data streams
      finalColor = mix(finalColor, yellowAccent, dataFlow * 0.4);
      
      // Add mouse interaction glow
      finalColor = mix(finalColor, yellowAccent, mouseInfluence * 0.2);
      
      // Add glitch effects
      if (glitch > 0.5) {
        finalColor.r = mix(finalColor.r, magentaGlitch.r, 0.8);
        finalColor.g = mix(finalColor.g, cyanGlitch.g, 0.6);
      }
      
      // Subtle scanlines
      float scanline = sin(st.y * 800.0 + uTime * 5.0) * 0.02;
      finalColor += scanline;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
)

extend({ AlirezaBackgroundMaterial })

function DataStreamPlane() {
  const materialRef = useRef<any>()
  const { size } = useThree()
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMouse({
        x: event.clientX,
        y: event.clientY,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime
      materialRef.current.uResolution.set(size.width, size.height)
      materialRef.current.uMouse.set(mouse.x, size.height - mouse.y)
    }
  })

  return (
    <Plane args={[2, 2]}>
      <alirezaBackgroundMaterial ref={materialRef} />
    </Plane>
  )
}

export function AlirezaThemeBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ width: "100vw", height: "100vh" }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <DataStreamPlane />
      </Canvas>
    </div>
  )
}
