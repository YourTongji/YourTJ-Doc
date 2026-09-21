<script setup lang="ts">
import { NolebaseEnhancedReadabilitiesMenu } from '@nolebase/vitepress-plugin-enhanced-readabilities/client'
import { NolebaseHighlightTargetedHeading } from '@nolebase/vitepress-plugin-highlight-targeted-heading/client'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import MobileReadabilityMenu from './MobileReadabilityMenu.vue'
import TouchSpotlight from './TouchSpotlight.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()

if (typeof window !== 'undefined') {
  const spotlightModeKey = 'vitepress-nolebase-enhanced-readabilities-spotlight-mode'
  const spotlightStyleKey = 'vitepress-nolebase-enhanced-readabilities-spotlight-styles'
  const storedMode = window.localStorage.getItem(spotlightModeKey)
  const storedStyle = window.localStorage.getItem(spotlightStyleKey)

  if (storedMode !== null && storedMode !== 'true' && storedMode !== 'false')
    window.localStorage.setItem(spotlightModeKey, 'true')

  if (storedStyle !== null && storedStyle !== '1' && storedStyle !== '2')
    window.localStorage.setItem(spotlightStyleKey, '2')
}
</script>

<template>
  <div class="yourtj-doc-shell">
    <div v-if="frontmatter.layout === 'home'" class="spectrum-field" aria-hidden="true" />
    <Layout class="yourtj-doc-layout">
      <template #layout-top>
        <NolebaseHighlightTargetedHeading />
        <TouchSpotlight />
      </template>
      <template #nav-bar-content-after>
        <NolebaseEnhancedReadabilitiesMenu />
      </template>
      <template #nav-screen-content-after>
        <MobileReadabilityMenu />
      </template>
    </Layout>
  </div>
</template>
