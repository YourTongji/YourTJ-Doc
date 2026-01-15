# 贡献者

感谢你们的贡献！🎉

<script setup>
import { ref, onMounted } from 'vue'

const contributors = ref([])
const loading = ref(true)
const loadError = ref(false)

// 静态回退数据（当 API 无法访问时使用）
const fallbackContributors = [
  {
    id: 1,
    login: 'WALKERKILLER',
    avatar_url: 'https://avatars.githubusercontent.com/u/62551949',
    html_url: 'https://github.com/WALKERKILLER',
    contributions: '-'
  }
]

// 使用图片代理加速国内访问
const getProxiedAvatar = (url) => {
  if (!url) return ''
  // wsrv.nl 是一个免费的图片代理服务，国内访问较快
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=128&h=128`
}

// 图片加载失败时的默认头像
const handleImageError = (e) => {
  e.target.src = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="32" fill="#e2e8f0"/>
      <circle cx="32" cy="24" r="12" fill="#94a3b8"/>
      <path d="M8 56c0-13.255 10.745-24 24-24s24 10.745 24 24" fill="#94a3b8"/>
    </svg>
  `)
}

onMounted(async () => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时

  try {
    const response = await fetch(
      'https://api.github.com/repos/YourTongji/YourTJCourse-Serverless/contributors',
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (!response.ok) throw new Error('API request failed')

    const data = await response.json()
    if (Array.isArray(data) && data.length > 0) {
      contributors.value = data
    } else {
      throw new Error('Invalid data')
    }
  } catch (error) {
    console.warn('Failed to fetch contributors, using fallback:', error.message)
    contributors.value = fallbackContributors
    loadError.value = true
  } finally {
    loading.value = false
  }
})
</script>

<div class="contributors-grid" v-if="!loading">
  <a
    v-for="contributor in contributors"
    :key="contributor.id"
    :href="contributor.html_url"
    target="_blank"
    rel="noopener noreferrer"
    class="contributor-card"
  >
    <img
      :src="getProxiedAvatar(contributor.avatar_url)"
      :alt="contributor.login"
      class="contributor-avatar"
      @error="handleImageError"
      loading="lazy"
    />
    <span class="contributor-name">{{ contributor.login }}</span>
    <span class="contributor-commits">{{ contributor.contributions }} commits</span>
  </a>
</div>

<div v-else class="loading">
  <span class="loading-spinner"></span>
  加载中...
</div>

<div v-if="loadError" class="load-error-hint">
  <small>（数据来自缓存，可能不是最新）</small>
</div>

<style>
.contributors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.contributor-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.contributor-card:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: var(--vp-c-brand);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.contributor-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin-bottom: 0.75rem;
  border: 2px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.contributor-name {
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  text-align: center;
  word-break: break-all;
}

.contributor-commits {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-top: 0.25rem;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--vp-c-text-2);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.load-error-hint {
  text-align: center;
  color: var(--vp-c-text-3);
  margin-top: 0.5rem;
}
</style>
