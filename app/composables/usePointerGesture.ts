import { ref, toValue, watch, onUnmounted, type MaybeRef, type Ref } from 'vue'

export interface GestureState {
  isDragging: boolean
  pointerType: 'mouse' | 'touch' | 'pen'
  pointer: { x: number; y: number }
  pointerDirty: boolean
}

export function usePointerGesture(el: MaybeRef<HTMLElement | null>) {
  const isDragging = ref(false)
  const pointerType = ref<'mouse' | 'touch' | 'pen'>('mouse')
  const pointer = { x: 0, y: 0 }
  let pointerDirty = false

  let dragStartPos = { x: 0, y: 0 }
  let prevPos = { x: 0, y: 0 }
  let wasTap = false

  const frameDelta = { x: 0, y: 0 }
  const velocityEMA = { x: 0, y: 0 }
  const VELOCITY_SMOOTH = 0.35

  const activePointers = new Map<number, { x: number; y: number }>()
  let prevPinchDist = 0
  let framePinchDelta = 0

  let frameWheelDelta = 0
  let frameWheelCtrl = false

  function onPointerDown(e: PointerEvent) {
    const target = toValue(el)
    if (!target) return
    try { target.setPointerCapture(e.pointerId) } catch {}

    isDragging.value = true
    wasTap = false
    pointerType.value = e.pointerType as 'mouse' | 'touch' | 'pen'
    dragStartPos = { x: e.clientX, y: e.clientY }
    prevPos = { x: e.clientX, y: e.clientY }
    velocityEMA.x = 0
    velocityEMA.y = 0

    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (activePointers.size === 2) {
      prevPinchDist = getPinchDist()
    }
  }

  function onPointerMove(e: PointerEvent) {
    const target = toValue(el)
    if (!target) return

    const rect = target.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    pointerDirty = true
    pointerType.value = e.pointerType as 'mouse' | 'touch' | 'pen'

    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (isDragging.value) {
      frameDelta.x += e.clientX - prevPos.x
      frameDelta.y += e.clientY - prevPos.y

      const dx = e.clientX - prevPos.x
      const dy = e.clientY - prevPos.y
      velocityEMA.x = velocityEMA.x * (1 - VELOCITY_SMOOTH) + dx * VELOCITY_SMOOTH
      velocityEMA.y = velocityEMA.y * (1 - VELOCITY_SMOOTH) + dy * VELOCITY_SMOOTH

      prevPos = { x: e.clientX, y: e.clientY }

      if (activePointers.size === 2) {
        const dist = getPinchDist()
        if (prevPinchDist > 0) {
          framePinchDelta += dist / prevPinchDist - 1
        }
        prevPinchDist = dist
      }
    }
  }

  function onPointerUp(e: PointerEvent) {
    const target = toValue(el)
    if (target) {
      try { target.releasePointerCapture(e.pointerId) } catch {}
    }

    activePointers.delete(e.pointerId)
    prevPinchDist = 0

    if (isDragging.value) {
      const dx = Math.abs(e.clientX - dragStartPos.x)
      const dy = Math.abs(e.clientY - dragStartPos.y)
      const threshold = pointerType.value === 'touch' ? 15 : 5
      wasTap = dx < threshold && dy < threshold

      isDragging.value = false
    }
  }

  function onPointerLeave() {
    pointerDirty = false
    isDragging.value = false
    activePointers.clear()
    prevPinchDist = 0
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    frameWheelDelta += e.deltaY
    frameWheelCtrl = e.ctrlKey || e.metaKey
  }

  function getPinchDist() {
    const pts = Array.from(activePointers.values())
    if (pts.length < 2) return 0
    const dx = pts[1].x - pts[0].x
    const dy = pts[1].y - pts[0].y
    return Math.sqrt(dx * dx + dy * dy)
  }

  function consumeDrag() {
    const d = { x: frameDelta.x, y: frameDelta.y }
    frameDelta.x = 0
    frameDelta.y = 0
    return d
  }

  function consumeWheel() {
    const d = { delta: frameWheelDelta, ctrl: frameWheelCtrl }
    frameWheelDelta = 0
    frameWheelCtrl = false
    return d
  }

  function consumePinch() {
    const d = framePinchDelta
    framePinchDelta = 0
    return d
  }

  function consumeTap() {
    const t = wasTap
    wasTap = false
    return t
  }

  function getVelocity() {
    return { x: velocityEMA.x, y: velocityEMA.y }
  }

  let boundTarget: HTMLElement | null = null

  function bind(target: HTMLElement) {
    if (boundTarget === target) return
    unbind()
    boundTarget = target
    target.style.touchAction = 'none'
    target.addEventListener('pointerdown', onPointerDown)
    target.addEventListener('pointermove', onPointerMove)
    target.addEventListener('pointerup', onPointerUp)
    target.addEventListener('pointerleave', onPointerLeave)
    target.addEventListener('pointercancel', onPointerUp)
    target.addEventListener('wheel', onWheel, { passive: false })
  }

  function unbind() {
    if (!boundTarget) return
    boundTarget.removeEventListener('pointerdown', onPointerDown)
    boundTarget.removeEventListener('pointermove', onPointerMove)
    boundTarget.removeEventListener('pointerup', onPointerUp)
    boundTarget.removeEventListener('pointerleave', onPointerLeave)
    boundTarget.removeEventListener('pointercancel', onPointerUp)
    boundTarget.removeEventListener('wheel', onWheel)
    boundTarget = null
  }

  watch(
    () => toValue(el),
    (target) => { if (target) bind(target) },
    { immediate: true, flush: 'post' }
  )

  onUnmounted(unbind)

  return {
    isDragging,
    pointerType,
    pointer,
    isPointerDirty: () => pointerDirty,
    clearPointerDirty: () => { pointerDirty = false },
    consumeDrag,
    consumeWheel,
    consumePinch,
    consumeTap,
    getVelocity,
  }
}
