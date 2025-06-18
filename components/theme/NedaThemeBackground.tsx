// alireza01/auratask/auratask-28ecc72e0305e315df0a1f5b0618e2b9c07e5ded/components/theme/NedaThemeBackground.tsx
"use client"

import { useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Plane, shaderMaterial } from "@react-three/drei"
import * as THREE from "three"
import { extend } from "@react-three/fiber"

const NedaBackgroundMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(),
  },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader - exact port from prototype
  `
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // Simplex noise implementation
    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 mod289(vec4 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x) {
      return mod289(((x*34.0)+1.0)*x);
    }

    vec4 taylorInvSqrt(vec4 r) {
      return 1.79284291400159 - 0.85373472095314 * r;
    }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      vec2 st = vUv;
      
      // Create flowing, iridescent patterns
      float noise1 = snoise(vec3(st * 2.5, uTime * 0.08));
      float noise2 = snoise(vec3(st * 5.0, uTime * 0.12));
      float noise3 = snoise(vec3(st * 10.0, uTime * 0.06));
      
      // Combine noise layers for complexity
      float combined = noise1 * 0.6 + noise2 * 0.3 + noise3 * 0.1;
      
      // Iridescent color palette - vibrant and magical
      vec3 color1 = vec3(0.9, 0.3, 0.8); // Bright pink
      vec3 color2 = vec3(0.3, 0.7, 0.9); // Cyan
      vec3 color3 = vec3(0.8, 0.5, 0.9); // Purple
      vec3 color4 = vec3(0.1, 0.05, 0.2); // Deep base
      
      // Create flowing color transitions
      vec3 finalColor = mix(color4, color1, smoothstep(-0.3, 0.7, combined));
      finalColor = mix(finalColor, color2, smoothstep(0.1, 0.9, sin(st.x * 6.28 + uTime * 0.3)));
      finalColor = mix(finalColor, color3, smoothstep(0.2, 0.8, sin(st.y * 6.28 + uTime * 0.25)));
      
      // Add radial gradient for depth
      float radial = 1.0 - length(st - 0.5) * 1.4;
      finalColor = mix(color4, finalColor, radial);
      
      // Subtle shimmer effect
      float shimmer = sin(uTime * 4.0 + combined * 10.0) * 0.1 + 0.9;
      finalColor *= shimmer;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
)

extend({ NedaBackgroundMaterial })

function BackgroundPlane() {
  const materialRef = useRef<any>(null)
  const { size } = useThree()

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime
      materialRef.current.uResolution.set(size.width, size.height)
    }
  })

  return (
    <Plane args={[2, 2]}>
      <nedaBackgroundMaterial ref={materialRef} />
    </Plane>
  )
}

export function NedaThemeBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ width: "100vw", height: "100vh" }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <BackgroundPlane />
      </Canvas>
    </div>
  )
}
