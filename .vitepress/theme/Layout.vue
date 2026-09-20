<script setup lang="ts">
import {
  NolebaseEnhancedReadabilitiesMenu,
  NolebaseEnhancedReadabilitiesScreenMenu,
} from '@nolebase/vitepress-plugin-enhanced-readabilities/client'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
</script>

<template>
  <div class="yourtj-doc-shell">
    <div v-if="frontmatter.layout === 'home'" class="spectrum-field" aria-hidden="true" />
    <Layout class="yourtj-doc-layout">
      <template #nav-bar-content-after>
        <NolebaseEnhancedReadabilitiesMenu />
      </template>
      <template #nav-screen-content-after>
        <NolebaseEnhancedReadabilitiesScreenMenu />
      </template>
    </Layout>
  </div>
</template>
