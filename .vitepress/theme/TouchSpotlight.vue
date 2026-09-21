<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'

const spotlightModeKey = 'vitepress-nolebase-enhanced-readabilities-spotlight-mode'
const spotlightStyleKey = 'vitepress-nolebase-enhanced-readabilities-spotlight-styles'

const route = useRoute()
const isCoarsePointer = ref(false)
const spotlightOn = ref(true)
const spotlightStyle = ref<1 | 2>(2)
const boxStyle = ref<Record<string, string>>({ display: 'none' })

let root: HTMLElement | null = null
let selected: HTMLElement | null = null
let pointerStart: { x: number, y: number } | null = null

function readPreference() {
  const storedMode = window.localStorage.getItem(spotlightModeKey)
  const storedStyle = Number(window.localStorage.getItem(spotlightStyleKey))

  spotlightOn.value = storedMode === null ? true : storedMode === 'true'
  spotlightStyle.value = storedStyle === 1 ? 1 : 2
}

function findTopLevelBlock(target: EventTarget | null) {
  if (!(target instanceof Element) || !root || !root.contains(target))
    return null

  let current: Element | null = target
  while (current?.parentElement && current.parentElement !== root)
    current = current.parentElement

  return current?.parentElement === root ? current as HTMLElement : null
}

function updateBox() {
  if (!selected || !spotlightOn.value || !isCoarsePointer.value) {
    boxStyle.value = { display: 'none' }
    return
  }

  const rect = selected.getBoundingClientRect()
  if (rect.bottom < 0 || rect.top > window.innerHeight || rect.width === 0 || rect.height === 0) {
    boxStyle.value = { display: 'none' }
    return
  }

  boxStyle.value = {
    display: 'block',
    width: `${rect.width + 8}px`,
    height: `${rect.height + 8}px`,
    left: `${rect.left - 4}px`,
    top: `${rect.top - 4}px`,
  }
}

function focusTarget(target: EventTarget | null) {
  if (!spotlightOn.value || !isCoarsePointer.value)
    return

  const block = findTopLevelBlock(target)
  if (!block)
    return

  selected = block
  updateBox()
}

function handleClick(event: MouseEvent) {
  focusTarget(event.target)
}

function handlePointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse')
    return

  pointerStart = { x: event.clientX, y: event.clientY }
}

function handlePointerUp(event: PointerEvent) {
  if (event.pointerType === 'mouse' || !pointerStart)
    return

  const distance = Math.hypot(
    event.clientX - pointerStart.x,
    event.clientY - pointerStart.y,
  )
  pointerStart = null

  if (distance <= 12)
    focusTarget(event.target)
}

function handlePreferenceChange(event?: Event) {
  if (event instanceof StorageEvent && ![spotlightModeKey, spotlightStyleKey].includes(event.key || ''))
    return

  readPreference()
  if (!spotlightOn.value)
    selected = null
  updateBox()
}

function handleCustomPreferenceChange(event: Event) {
  const detail = (event as CustomEvent<{ enabled?: boolean, style?: 1 | 2 }>).detail
  if (typeof detail?.enabled === 'boolean')
    spotlightOn.value = detail.enabled
  if (detail?.style === 1 || detail?.style === 2)
    spotlightStyle.value = detail.style
  if (!spotlightOn.value)
    selected = null
  updateBox()
}

function bindRoot() {
  root = document.querySelector('.VPDoc main .vp-doc > div')
}

onMounted(() => {
  isCoarsePointer.value = window.matchMedia('(pointer: coarse)').matches
  readPreference()
  bindRoot()

  document.addEventListener('click', handleClick, true)
  document.addEventListener('pointerdown', handlePointerDown, true)
  document.addEventListener('pointerup', handlePointerUp, true)
  window.addEventListener('scroll', updateBox, true)
  window.addEventListener('resize', updateBox)
  window.addEventListener('storage', handlePreferenceChange)
  window.addEventListener('yourtj:spotlight-change', handleCustomPreferenceChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClick, true)
  document.removeEventListener('pointerdown', handlePointerDown, true)
  document.removeEventListener('pointerup', handlePointerUp, true)
  window.removeEventListener('scroll', updateBox, true)
  window.removeEventListener('resize', updateBox)
  window.removeEventListener('storage', handlePreferenceChange)
  window.removeEventListener('yourtj:spotlight-change', handleCustomPreferenceChange)
})

watch(route, async () => {
  selected = null
  boxStyle.value = { display: 'none' }
  await nextTick()
  bindRoot()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isCoarsePointer && spotlightOn"
      aria-hidden="true"
      class="yourtj-touch-spotlight"
      :class="{
        'yourtj-touch-spotlight--under': spotlightStyle === 1,
        'yourtj-touch-spotlight--aside': spotlightStyle === 2,
      }"
      :style="boxStyle"
    />
  </Teleport>
</template>
