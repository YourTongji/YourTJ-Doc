<script setup lang="ts">
import { onMounted, ref } from 'vue'

const spotlightModeKey = 'vitepress-nolebase-enhanced-readabilities-spotlight-mode'
const spotlightStyleKey = 'vitepress-nolebase-enhanced-readabilities-spotlight-styles'

const spotlightOn = ref(true)
const spotlightStyle = ref<1 | 2>(2)

function readPreference() {
  const storedMode = window.localStorage.getItem(spotlightModeKey)
  const storedStyle = Number(window.localStorage.getItem(spotlightStyleKey))

  spotlightOn.value = storedMode === null ? true : storedMode === 'true'
  spotlightStyle.value = storedStyle === 1 ? 1 : 2
}

function notify() {
  window.dispatchEvent(new CustomEvent('yourtj:spotlight-change', {
    detail: {
      enabled: spotlightOn.value,
      style: spotlightStyle.value,
    },
  }))
}

function setSpotlight(enabled: boolean) {
  spotlightOn.value = enabled
  window.localStorage.setItem(spotlightModeKey, String(enabled))
  notify()
}

function setSpotlightStyle(style: 1 | 2) {
  spotlightStyle.value = style
  window.localStorage.setItem(spotlightStyleKey, String(style))
  notify()
}

onMounted(readPreference)
</script>

<template>
  <section class="yourtj-mobile-readability" aria-labelledby="yourtj-mobile-readability-title">
    <div class="yourtj-mobile-readability__heading">
      <span class="yourtj-mobile-readability__icon" aria-hidden="true">◉</span>
      <strong id="yourtj-mobile-readability-title">阅读增强</strong>
    </div>

    <p class="yourtj-mobile-readability__hint">
      触屏端可点击正文块进行聚光；页面宽度调整仅在桌面端提供。
    </p>

    <div class="yourtj-mobile-readability__setting">
      <span class="yourtj-mobile-readability__label">聚光灯</span>
      <div class="yourtj-mobile-readability__segmented" role="group" aria-label="聚光灯开关">
        <button
          type="button"
          :aria-pressed="spotlightOn"
          :class="{ active: spotlightOn }"
          @click="setSpotlight(true)"
        >
          ON
        </button>
        <button
          type="button"
          :aria-pressed="!spotlightOn"
          :class="{ active: !spotlightOn }"
          @click="setSpotlight(false)"
        >
          OFF
        </button>
      </div>
    </div>

    <div v-if="spotlightOn" class="yourtj-mobile-readability__setting">
      <span class="yourtj-mobile-readability__label">聚光灯样式</span>
      <div class="yourtj-mobile-readability__segmented" role="group" aria-label="聚光灯样式">
        <button
          type="button"
          :aria-pressed="spotlightStyle === 1"
          :class="{ active: spotlightStyle === 1 }"
          @click="setSpotlightStyle(1)"
        >
          底部高亮
        </button>
        <button
          type="button"
          :aria-pressed="spotlightStyle === 2"
          :class="{ active: spotlightStyle === 2 }"
          @click="setSpotlightStyle(2)"
        >
          侧边标记
        </button>
      </div>
    </div>
  </section>
</template>
