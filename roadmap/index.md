---
layout: page
---

<script setup>
import { ref } from 'vue'
import roadmapData from './data.json'

const columns = ref(roadmapData.columns)

// 状态配置映射
const statusConfig = {
  done: { class: 'done', titleClass: 'done-title' },
  progress: { class: 'progress', titleClass: 'progress-title' },
  next: { class: 'next', titleClass: 'next-title' },
  backlog: { class: 'backlog', titleClass: 'backlog-title' }
}
</script>

<div class="roadmap-header">
  <h1>开发计划</h1>
</div>

<div class="roadmap-wrapper">
<div class="roadmap-board">

<div v-for="column in columns" :key="column.id" class="roadmap-column">
  <div class="column-header">
    <div :class="['status-indicator', statusConfig[column.id].class]"></div>
    <span :class="['column-title', statusConfig[column.id].titleClass]">{{ column.icon }} {{ column.title }}</span>
    <span class="item-count">{{ column.items.length }}</span>
  </div>
  <div class="card-list">
    <template v-if="column.items.length > 0">
      <div v-for="(item, index) in column.items" :key="index" class="roadmap-card">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </div>
    </template>
    <div v-else class="empty-state">
      <p>暂无待规划项目</p>
    </div>
  </div>
</div>

</div>
</div>

<style>
/* 标题区域样式 */
.roadmap-header {
  text-align: center;
  margin-bottom: 0rem;
  padding: 0rem 0rem 0rem;
}

.roadmap-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  padding: 1rem 0;
  background: linear-gradient(135deg, var(--vp-c-brand-1) 0%, var(--vp-c-brand-2) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.6;
}

/* RoadMap 看板容器 - 不覆盖 VitePress 默认布局 */
.roadmap-wrapper {
  width: 100%;
  margin: 0 auto;
}

.roadmap-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 1.5rem 0;
  min-height: 500px;
}

.roadmap-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
}

.column-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  margin: -0.25rem -0.25rem 0.5rem -0.25rem;
  border-radius: 10px;
  background: var(--vp-c-bg);
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

.status-indicator.done {
  background: #10b981;
  color: #10b981;
}

.status-indicator.progress {
  background: #3b82f6;
  color: #3b82f6;
}

.status-indicator.next {
  background: #a855f7;
  color: #a855f7;
}

.status-indicator.backlog {
  background: #6b7280;
  color: #6b7280;
}

.column-title {
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}

.column-title.done-title {
  color: #10b981;
}

.column-title.progress-title {
  color: #3b82f6;
}

.column-title.next-title {
  color: #a855f7;
}

.column-title.backlog-title {
  color: #6b7280;
}

.item-count {
  margin-left: auto;
  font-size: 0.8125rem;
  color: var(--vp-c-text-3);
  font-family: monospace;
  font-weight: 600;
  background: var(--vp-c-bg-soft);
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  min-width: 1.5rem;
  text-align: center;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.roadmap-card {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  padding: 1.125rem;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.roadmap-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--vp-c-brand), var(--vp-c-brand-light));
  opacity: 0;
  transition: opacity 0.4s ease;
}

.roadmap-card:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: var(--vp-c-brand-light);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08), 0 6px 12px rgba(0, 0, 0, 0.04);
}

.roadmap-card:hover::before {
  opacity: 0.8;
}

.roadmap-column:nth-child(1) .roadmap-card::before {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.roadmap-column:nth-child(2) .roadmap-card::before {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.roadmap-column:nth-child(3) .roadmap-card::before {
  background: linear-gradient(90deg, #a855f7, #c084fc);
}

.roadmap-column:nth-child(4) .roadmap-card::before {
  background: linear-gradient(90deg, #6b7280, #9ca3af);
}

.roadmap-card h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0 0 0.625rem 0;
  color: var(--vp-c-text-1);
  line-height: 1.4;
  letter-spacing: -0.01em;
}

.roadmap-card p {
  font-size: 0.8125rem;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--vp-c-text-3);
  font-size: 0.875rem;
  background: var(--vp-c-bg);
  border-radius: 12px;
  border: 2px dashed var(--vp-c-divider);
}

@media (max-width: 960px) {
  .roadmap-board {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

@media (max-width: 640px) {
  .roadmap-board {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem 0;
  }

  .roadmap-column {
    width: 100%;
  }

  .roadmap-card {
    padding: 0.875rem;
  }

  .roadmap-card h3 {
    font-size: 0.8125rem;
  }

  .roadmap-card p {
    font-size: 0.6875rem;
    line-height: 1.4;
  }

  .column-title {
    font-size: 0.8125rem;
  }

  .item-count {
    font-size: 0.6875rem;
  }

  .tag {
    font-size: 0.5625rem;
    padding: 0.1875rem 0.375rem;
  }
}
</style>
