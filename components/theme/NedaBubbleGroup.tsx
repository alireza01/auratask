// components/theme/NedaBubbleGroup.tsx
/**
 * NedaBubbleGroup - Renders a 3D interactive scene of task groups as floating bubbles.
 * Uses React Three Fiber for 3D rendering and Framer Motion for animations.
 * Each bubble is an InteractiveBubble component, displaying group emoji, name, task count, and completion progress.
 * This component is primarily used by TaskGroupsBubbles.tsx to visualize multiple task groups.
 */
"use client"

import { useRef, useState, useMemo, useCallback } from "react"
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber"
import { Html, Sphere, shaderMaterial } from "@react-three/drei"
import { motion, useMotionValue, animate, AnimatePresence } from "framer-motion" // Removed useSpring
import { useSpring as useReactSpring, animated } from "react-spring"
import * as THREE from "three"
import { extend } from "@react-three/fiber"
import type { Task, TaskGroup } from "@/types"
import { useAppStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Trash2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const BubbleMaterial = shaderMaterial(
  {
    uTime: 0,
    uPopProgress: 0,
    uPopInstability: 0,
    uJiggle: 0,
    uColor: new THREE.Color("#ff6b9d"),
  },
  // Vertex shader
  `
    uniform float uTime;
    uniform float uPopProgress;
    uniform float uPopInstability;
    uniform float uJiggle;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;

    float snoise(vec3 v) {
      return sin(v.x * 12.9898 + v.y * 78.233 + v.z * 37.719) * 0.5 + 0.5;
    }

    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normal;
      
      vec3 pos = position;
      
      // Breathing animation
      float breathe = sin(uTime * 1.5) * 0.03;
      pos += normal * breathe;
      
      // Jiggle effect when delete-ready
      if (uJiggle > 0.0) {
        float jiggleX = sin(uTime * 15.0) * uJiggle * 0.05;
        float jiggleY = cos(uTime * 12.0) * uJiggle * 0.05;
        float jiggleZ = sin(uTime * 18.0) * uJiggle * 0.03;
        pos += vec3(jiggleX, jiggleY, jiggleZ);
      }
      
      // Pop instability
      if (uPopProgress > 0.0) {
        float noise = snoise(pos * 8.0 + uTime * 25.0);
        pos += normal * noise * uPopInstability * 0.15;
      }
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float uTime;
    uniform float uPopProgress;
    uniform float uJiggle;
    uniform vec3 uColor;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;

    void main() {
      vec3 color = uColor;
      
      // Iridescent fresnel effect
      float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 1.5);
      vec3 iridescent = vec3(
        sin(fresnel * 6.28 + uTime * 2.0) * 0.5 + 0.5,
        sin(fresnel * 6.28 + uTime * 2.0 + 2.094) * 0.5 + 0.5,
        sin(fresnel * 6.28 + uTime * 2.0 + 4.188) * 0.5 + 0.5
      );
      
      color = mix(color, iridescent, 0.4 + fresnel * 0.3);
      
      // Jiggle glow effect
      if (uJiggle > 0.0) {
        color = mix(color, vec3(1.0, 0.8, 0.9), uJiggle * 0.3);
      }
      
      // Pop flash effect
      if (uPopProgress > 0.0) {
        float flash = 1.0 - uPopProgress;
        color = mix(color, vec3(1.0), flash * 0.9);
      }
      
      // Base transparency with fresnel
      float alpha = 0.85 + fresnel * 0.15;
      
      // Fade out during pop
      if (uPopProgress > 0.0) {
        alpha *= (1.0 - uPopProgress);
      }
      
      gl_FragColor = vec4(color, alpha);
    }
  `,
)

extend({ BubbleMaterial })

interface PopParticlesProps {
  position: [number, number, number]
  color: string
  onComplete: () => void
}

function PopParticles({ position, color, onComplete }: PopParticlesProps) {
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)

  const particleCount = 25
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.3
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3
    }
    return pos
  }, [])

  const velocities = useMemo(() => {
    const vel = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 2 + Math.random() * 4
      vel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      vel[i * 3 + 2] = Math.cos(phi) * speed
    }
    return vel
  }, [])

  useFrame((state, delta) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i * 3] * delta
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta

        // Apply gravity
        velocities[i * 3 + 1] -= 9.8 * delta

        // Fade and shrink
        velocities[i * 3] *= 0.98
        velocities[i * 3 + 1] *= 0.98
        velocities[i * 3 + 2] *= 0.98
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true

      // Auto-cleanup after 2.5 seconds
      if (state.clock.elapsedTime > 2.5) {
        onComplete()
      }
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color={color} transparent opacity={0.9} />
      </points>
    </group>
  )
}

interface InteractiveBubbleProps {
  group: TaskGroup
  tasks: Task[]
  position: [number, number, number]
  onDelete: () => void
  onClick: () => void
}

function InteractiveBubble({ group, tasks, position, onDelete, onClick }: InteractiveBubbleProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)
  const [isHeld, setIsHeld] = useState(false)
  const [deleteReady, setDeleteReady] = useState(false)
  const [isPopping, setIsPopping] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null)

  const popProgress = useMotionValue(0)
  const popInstability = useMotionValue(0)
  const jiggleAmount = useMotionValue(0)
  // const scale = useSpring(1, { stiffness: 400, damping: 25 }) // Old framer-motion spring
  const [scaleSpring, api] = useReactSpring(() => ({ scale: 1, config: { stiffness: 400, damping: 25 } })) // New react-spring

  // React Spring for organic jiggle animation
  const jiggleSpring = useReactSpring({
    rotation: deleteReady ? [0.1, -0.1, 0.05] : [0, 0, 0],
    config: { tension: 300, friction: 10 },
    loop: deleteReady,
  })

  const completedTasks = tasks.filter((task) => task.is_completed).length
  const totalTasks = tasks.length
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime
      materialRef.current.uPopProgress = popProgress.get()
      materialRef.current.uPopInstability = popInstability.get()
      materialRef.current.uJiggle = jiggleAmount.get()
    }
  })

  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [])

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      setIsHeld(true)
      api.start({ scale: 0.9 }) // Updated scale setting
      triggerHaptic()

      const timer = setTimeout(() => {
        if (isHeld) {
          setDeleteReady(true)
          jiggleAmount.set(1)
          triggerHaptic()
        }
      }, 500)

      setHoldTimer(timer)
    },
    [isHeld, api, jiggleAmount, triggerHaptic], // Updated dependencies
  )

  const handlePointerUp = useCallback(() => {
    if (holdTimer) {
      clearTimeout(holdTimer)
      setHoldTimer(null)
    }

    if (!deleteReady && !isPopping) {
      onClick()
      triggerHaptic()
    }

    setIsHeld(false)
    setDeleteReady(false)
    api.start({ scale: 1 }) // Updated scale setting
    jiggleAmount.set(0)
  }, [holdTimer, deleteReady, isPopping, onClick, api, jiggleAmount, triggerHaptic]) // Updated dependencies

  const handleDelete = useCallback(async () => {
    setIsPopping(true)
    triggerHaptic()

    // Start particle explosion
    setShowParticles(true)

    // Orchestrate the multi-stage pop animation
    await Promise.all([
      animate(popProgress, 1, { duration: 0.6, ease: "easeOut" }),
      animate(popInstability, 1, { duration: 0.4, ease: "easeOut" }),
      api.start({ scale: 0, config: { duration: 600 } }), // Updated scale animation
    ])

    onDelete()
  }, [popProgress, popInstability, api, onDelete, triggerHaptic]) // Updated dependencies

  return (
    <>
      <animated.group position={position} rotation={jiggleSpring.rotation as any}>
        <animated.group scale={scaleSpring.scale}> {/* Updated scale prop usage */}
          <Sphere
            ref={meshRef}
            args={[1, 32, 32]}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <BubbleMaterial
              ref={materialRef}
              uColor={new THREE.Color(group.color || "#ff6b9d")}
              transparent
              side={THREE.DoubleSide}
            />
          </Sphere>
        </animated.group>
        <Html
          center
          distanceFactor={8}
          style={{
            pointerEvents: deleteReady ? "auto" : "none",
            userSelect: "none",
          }}
        >
          <div className="flex flex-col items-center space-y-3 text-center">
            <motion.div
              className="text-5xl"
              animate={{
                scale: deleteReady ? [1, 1.2, 1] : 1,
                rotate: deleteReady ? [0, 5, -5, 0] : 0,
              }}
              transition={{
                duration: 0.5,
                repeat: deleteReady ? Number.POSITIVE_INFINITY : 0,
              }}
            >
              {group.emoji}
            </motion.div>

            <h3 className="font-bold text-xl text-white drop-shadow-lg tracking-wide">{group.name}</h3>

            <div className="flex gap-2 flex-wrap justify-center">
              <Badge className="bg-white/25 backdrop-blur-md text-white border-white/30 shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                {totalTasks} وظیفه
              </Badge>
              {completedTasks > 0 && (
                <Badge className="bg-emerald-500/80 backdrop-blur-md text-white shadow-lg">
                  ✓ {completedTasks} تکمیل
                </Badge>
              )}
            </div>

            {totalTasks > 0 && (
              <div className="w-28 bg-white/20 rounded-full h-3 backdrop-blur-md shadow-inner">
                <motion.div
                  className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 h-3 rounded-full shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            )}

            <AnimatePresence>
              {deleteReady && (
                <motion.button
                  initial={{ scale: 0, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 10 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDelete}
                  className={cn(
                    "mt-3 p-3 bg-red-500/90 backdrop-blur-md rounded-full text-white",
                    "hover:bg-red-600/90 transition-all duration-200 shadow-lg",
                    "border border-red-400/50",
                  )}
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </Html>
      </animated.group>

      {showParticles && (
        <PopParticles position={position} color={group.color || "#ff6b9d"} onComplete={() => setShowParticles(false)} />
      )}
    </>
  )
}

interface NedaBubbleGroupProps {
  groups: TaskGroup[]
  tasks: Task[]
  onGroupClick: (groupId: string) => void
}

export function NedaBubbleGroup({ groups, tasks, onGroupClick }: NedaBubbleGroupProps) {
  const { deleteGroup } = useAppStore()

  const groupedTasks = groups.map((group) => ({
    ...group,
    tasks: tasks.filter((task) => task.group_id === group.id),
  }))

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }} dpr={[1, 2]} performance={{ min: 0.5 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, 5]} intensity={0.4} color="#ff6b9d" />

        {groupedTasks.map((group, index) => {
          const angle = (index / groupedTasks.length) * Math.PI * 2
          const radius = Math.min(groupedTasks.length * 0.8, 4)
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const z = (Math.random() - 0.5) * 2

          return (
            <InteractiveBubble
              key={group.id}
              group={group}
              tasks={group.tasks}
              position={[x, y, z]}
              onDelete={() => deleteGroup(group.id)}
              onClick={() => onGroupClick(group.id)}
            />
          )
        })}
      </Canvas>
    </div>
  )
}
