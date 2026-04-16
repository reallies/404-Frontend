import { Suspense, useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sparkles, Stars } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Step4 우측 히어로: 와이어프레임 지구 + 천천히 회전·미세 요동·포인터 패럴랙스.
 * 정적 이미지 대신 WebGL로 “살아 움직이는” 느낌을 줍니다.
 */
function LivingGlobe({ mouse }) {
  const wireRef = useRef(null)
  const glowRef = useRef(null)
  const groupRef = useRef(null)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const g = groupRef.current
    const wire = wireRef.current
    const glow = glowRef.current
    if (!g) return

    g.rotation.y += delta * 0.11

    const mx = mouse.current.x
    const my = mouse.current.y
    const targetX = my * 0.16 + Math.sin(t * 0.32) * 0.065
    const targetZ = mx * 0.12 + Math.cos(t * 0.27) * 0.045

    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetX, 0.048)
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, targetZ, 0.042)

    if (wire?.material) {
      wire.material.emissiveIntensity = 0.13 + Math.sin(t * 1.75) * 0.05
    }
    if (glow?.material) {
      glow.material.opacity = 0.038 + Math.sin(t * 2.1) * 0.018
    }
  })

  return (
    <Float speed={1.1} rotationIntensity={0.14} floatIntensity={0.28}>
      <group ref={groupRef}>
        <mesh ref={glowRef} renderOrder={-1}>
          <sphereGeometry args={[2.12, 48, 48]} />
          <meshBasicMaterial
            color="#00e8ff"
            transparent
            opacity={0.045}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
        <mesh ref={wireRef}>
          <sphereGeometry args={[2, 72, 72]} />
          <meshStandardMaterial
            color="#081a22"
            emissive="#00e8ff"
            emissiveIntensity={0.14}
            wireframe
            metalness={0.2}
            roughness={0.42}
          />
        </mesh>
        <mesh scale={1.018}>
          <sphereGeometry args={[2, 36, 36]} />
          <meshBasicMaterial color="#40fff2" transparent opacity={0.055} wireframe depthWrite={false} />
        </mesh>
      </group>
    </Float>
  )
}

/** CSS 'transparent' 대신 WebGL 클리어 알파로 투명 배경 (THREE.Color 경고 방지) */
function TransparentClear() {
  const { scene, gl } = useThree()
  useLayoutEffect(() => {
    scene.background = null
    gl.setClearColor(0x000000, 0)
  }, [scene, gl])
  return null
}

function SceneContent({ mouse }) {
  return (
    <>
      <TransparentClear />
      <hemisphereLight args={['#2a5a62', '#0a1218', 1.05]} />
      <directionalLight position={[6, 8, 10]} intensity={1.35} color="#cffff9" />
      <directionalLight position={[-8, -3, -6]} intensity={0.45} color="#006080" />

      <Stars radius={90} depth={45} count={1600} factor={2.8} saturation={0.15} fade speed={0.35} />
      <LivingGlobe mouse={mouse} />
      <Sparkles
        count={90}
        scale={9}
        size={2.8}
        speed={0.45}
        opacity={0.5}
        color="#6dfff0"
        position={[0, 0, 0]}
      />
    </>
  )
}

export default function Step4GlobeHero() {
  const mouse = useRef({ x: 0, y: 0 })

  return (
    <div
      className="absolute inset-0 touch-none"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1
        const ny = ((e.clientY - r.top) / r.height) * 2 - 1
        mouse.current.x = nx
        mouse.current.y = ny
      }}
      onPointerLeave={() => {
        mouse.current.x = 0
        mouse.current.y = 0
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6.1], fov: 40, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        aria-hidden
      >
        <Suspense fallback={null}>
          <SceneContent mouse={mouse} />
        </Suspense>
      </Canvas>
    </div>
  )
}
