import { ref, toValue, type MaybeRef } from 'vue'
import { Vector3 } from 'three'
import { usePointerGesture } from './usePointerGesture'

export interface SceneCameraConfig {
  pitchClamp: [number, number]
  zoomClamp: [number, number]
  initialAngle?: { x: number; y: number }
  initialDistance?: number
  initialCenter?: [number, number, number]
  dragSensitivity?: number
  zoomSpeed?: number
  dampFactor?: number
  centerDampFactor?: number
  autoRotate?: false | { delay: number; speed: number }
  momentumDecay?: number
  touchMultiplier?: number
}

function damp(factor: number, dt: number) {
  return 1 - Math.pow(1 - factor, dt * 60)
}

function rubberBand(value: number, min: number, max: number, elasticity = 0.15) {
  if (value < min) return min - (min - value) * elasticity
  if (value > max) return max + (value - max) * elasticity
  return value
}

export function useSceneInteraction(
  el: MaybeRef<HTMLElement | null>,
  config: SceneCameraConfig
) {
  const {
    pitchClamp,
    zoomClamp,
    initialAngle = { x: 0.15, y: 0 },
    initialDistance = 18,
    initialCenter = [0, 0, 0],
    dragSensitivity = 0.004,
    zoomSpeed = 0.015,
    dampFactor = 0.08,
    centerDampFactor = 0.06,
    autoRotate: autoRotateCfg = false,
    momentumDecay = 0.92,
    touchMultiplier = 1.5,
  } = config

  const gesture = usePointerGesture(el)

  const camState = {
    angleX: initialAngle.x,
    angleY: initialAngle.y,
    distance: initialDistance,
  }
  const target = {
    angleX: initialAngle.x,
    angleY: initialAngle.y,
    distance: initialDistance,
  }
  const center = new Vector3(...initialCenter)
  const targetCenter = new Vector3(...initialCenter)

  const momentum = { x: 0, y: 0 }
  let wasDragging = false
  let idleTime = 0
  let paused = false
  let autoRotateActive = autoRotateCfg !== false

  function pause() {
    paused = true
  }

  function resume() {
    paused = false
  }

  function resetIdle() {
    idleTime = 0
    if (autoRotateCfg !== false) autoRotateActive = false
  }

  function setAngle(x: number, y: number) {
    target.angleX = x
    target.angleY = y
    camState.angleX = x
    camState.angleY = y
    momentum.x = 0
    momentum.y = 0
  }

  function setDistance(d: number) {
    target.distance = d
    camState.distance = d
  }

  function setCenter(x: number, y: number, z: number) {
    targetCenter.set(x, y, z)
    center.set(x, y, z)
  }

  function setTargetAngle(x: number, y: number) {
    target.angleX = x
    target.angleY = y
  }

  function setTargetDistance(d: number) {
    target.distance = d
  }

  function setTargetCenter(x: number, y: number, z: number) {
    targetCenter.set(x, y, z)
  }

  function update(dt: number) {
    if (paused) return

    const isTouch = gesture.pointerType.value === 'touch'
    const sens = dragSensitivity * (isTouch ? touchMultiplier : 1)

    // Process drag input
    if (gesture.isDragging.value) {
      const drag = gesture.consumeDrag()
      target.angleY -= drag.x * sens
      target.angleX = clampPitch(target.angleX + drag.y * sens)
      resetIdle()
    }

    // Process wheel input
    const wheel = gesture.consumeWheel()
    if (wheel.delta !== 0) {
      const speed = wheel.ctrl ? zoomSpeed * 0.2 : zoomSpeed
      target.distance = clampZoom(target.distance + wheel.delta * speed)
      resetIdle()
    }

    // Process pinch input
    const pinch = gesture.consumePinch()
    if (pinch !== 0) {
      target.distance = clampZoom(target.distance * (1 - pinch))
      resetIdle()
    }

    // Capture velocity on release (only once, when transitioning from dragging to not)
    if (!gesture.isDragging.value && wasDragging) {
      const vel = gesture.getVelocity()
      momentum.x = vel.x
      momentum.y = vel.y
    }
    wasDragging = gesture.isDragging.value

    // Momentum after release
    if (!gesture.isDragging.value && (Math.abs(momentum.x) > 0.0001 || Math.abs(momentum.y) > 0.0001)) {
      target.angleY -= momentum.x * sens
      target.angleX = clampPitch(target.angleX + momentum.y * sens)
      const decayFactor = Math.pow(momentumDecay, dt * 60)
      momentum.x *= decayFactor
      momentum.y *= decayFactor
    }

    // Auto-rotate
    idleTime += dt
    if (autoRotateCfg !== false && idleTime > autoRotateCfg.delay && !gesture.isDragging.value) {
      autoRotateActive = true
    }
    if (autoRotateActive && !gesture.isDragging.value) {
      target.angleY += dt * autoRotateCfg!.speed
    }

    // Frame-rate independent damping
    const af = damp(dampFactor, dt)
    camState.angleX += (target.angleX - camState.angleX) * af
    camState.angleY += (target.angleY - camState.angleY) * af
    camState.distance += (target.distance - camState.distance) * af
    center.lerp(targetCenter, damp(centerDampFactor, dt))
  }

  function clampPitch(v: number) {
    return Math.max(pitchClamp[0], Math.min(pitchClamp[1], v))
  }

  function clampZoom(v: number) {
    return Math.max(zoomClamp[0], Math.min(zoomClamp[1], v))
  }

  function applyCameraPosition(camera: { position: { set(x: number, y: number, z: number): void }; lookAt(v: Vector3): void }) {
    const cx = center.x + Math.sin(camState.angleY) * Math.cos(camState.angleX) * camState.distance
    const cy = center.y + Math.sin(camState.angleX) * camState.distance
    const cz = center.z + Math.cos(camState.angleY) * Math.cos(camState.angleX) * camState.distance
    camera.position.set(cx, cy, cz)
    camera.lookAt(center)
  }

  return {
    camState,
    target,
    center,
    targetCenter,
    gesture,
    pause,
    resume,
    update,
    setAngle,
    setDistance,
    setCenter,
    setTargetAngle,
    setTargetDistance,
    setTargetCenter,
    applyCameraPosition,
    get isPaused() { return paused },
  }
}
