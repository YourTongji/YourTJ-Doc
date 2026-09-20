---
lastUpdated: false
---

# YourTJ Hub 贡献者

<p class="contributors-thanks">
  感谢所有参与 YourTJ Hub 开发与维护的贡献者！
  <button
    class="contributors-celebration"
    type="button"
    aria-label="播放庆祝彩纸特效"
    title="🎉"
    @click="burstConfetti"
  >🎉</button>
</p>

<script setup>
import confetti from 'canvas-confetti'
import { ref, onMounted } from 'vue'

const fallbackContributors = [
  {
    "id": 46484956,
    "login": "yzxoi",
    "avatar_url": "https://avatars.githubusercontent.com/u/46484956?v=4",
    "html_url": "https://github.com/yzxoi",
    "contributions": 741
  },
  {
    "id": 189623296,
    "login": "WALKERKILLER",
    "avatar_url": "https://avatars.githubusercontent.com/u/189623296?v=4",
    "html_url": "https://github.com/WALKERKILLER",
    "contributions": 194
  },
  {
    "id": 67222274,
    "login": "HalfAnElephant",
    "avatar_url": "https://avatars.githubusercontent.com/u/67222274?v=4",
    "html_url": "https://github.com/HalfAnElephant",
    "contributions": 145
  },
  {
    "id": 119778255,
    "login": "oierxjn",
    "avatar_url": "https://avatars.githubusercontent.com/u/119778255?v=4",
    "html_url": "https://github.com/oierxjn",
    "contributions": 106
  },
  {
    "id": 49699333,
    "login": "dependabot[bot]",
    "avatar_url": "https://avatars.githubusercontent.com/in/29110?v=4",
    "html_url": "https://github.com/apps/dependabot",
    "contributions": 24
  },
  {
    "id": 180716751,
    "login": "Pengyiyan0411",
    "avatar_url": "https://avatars.githubusercontent.com/u/180716751?v=4",
    "html_url": "https://github.com/Pengyiyan0411",
    "contributions": 13
  },
  {
    "id": 89736158,
    "login": "Ricepies",
    "avatar_url": "https://avatars.githubusercontent.com/u/89736158?v=4",
    "html_url": "https://github.com/Ricepies",
    "contributions": 11
  },
  {
    "id": 182899058,
    "login": "wendaining",
    "avatar_url": "https://avatars.githubusercontent.com/u/182899058?v=4",
    "html_url": "https://github.com/wendaining",
    "contributions": 10
  },
  {
    "id": 299065080,
    "login": "synergy-agent[bot]",
    "avatar_url": "https://avatars.githubusercontent.com/in/4198809?v=4",
    "html_url": "https://github.com/apps/synergy-agent",
    "contributions": 6
  },
  {
    "id": 299070056,
    "login": "synergy-agent",
    "avatar_url": "https://avatars.githubusercontent.com/u/299070056?v=4",
    "html_url": "https://github.com/synergy-agent",
    "contributions": 5
  },
  {
    "id": 220479871,
    "login": "pyz2190",
    "avatar_url": "https://avatars.githubusercontent.com/u/220479871?v=4",
    "html_url": "https://github.com/pyz2190",
    "contributions": 5
  },
  {
    "id": 201120162,
    "login": "TTAWDTT",
    "avatar_url": "https://avatars.githubusercontent.com/u/201120162?v=4",
    "html_url": "https://github.com/TTAWDTT",
    "contributions": 3
  },
  {
    "id": 65916846,
    "login": "actions-user",
    "avatar_url": "https://avatars.githubusercontent.com/u/65916846?v=4",
    "html_url": "https://github.com/actions-user",
    "contributions": 2
  },
  {
    "id": 41898282,
    "login": "github-actions[bot]",
    "avatar_url": "https://avatars.githubusercontent.com/in/15368?v=4",
    "html_url": "https://github.com/apps/github-actions",
    "contributions": 2
  },
  {
    "id": 156947530,
    "login": "TrueEway",
    "avatar_url": "https://avatars.githubusercontent.com/u/156947530?v=4",
    "html_url": "https://github.com/TrueEway",
    "contributions": 1
  }
]

// 先渲染构建时清单，浏览器加载后再尝试更新 GitHub 实时数据。
const contributors = ref(fallbackContributors)
const live = ref(false)
const burstConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 170,
    origin: { y: 0.6 },
    disableForReducedMotion: true
  })
}

const fallbackAvatar = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#e2e8f0"/>
    <circle cx="32" cy="24" r="12" fill="#94a3b8"/>
    <path d="M8 56c0-13.255 10.745-24 24-24s24 10.745 24 24" fill="#94a3b8"/>
  </svg>
`)}`

const handleImageError = (event) => {
  event.target.src = fallbackAvatar
}

onMounted(async () => {
  burstConfetti()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(
      'https://api.github.com/repos/YourTongji/YourTJ-Hub/contributors?per_page=100',
      { signal: controller.signal }
    )
    if (!response.ok) return

    const data = await response.json()
    if (Array.isArray(data) && data.length > 0) {
      contributors.value = data
      live.value = true
    }
  } catch (_) {
    // 保留构建时清单。
  } finally {
    clearTimeout(timeout)
  }
})
</script>

<div class="contributors-meta">
  <span>{{ contributors.length }} 位贡献者</span>
  <span v-if="live">· GitHub 数据已刷新</span>
  <span v-else>· 使用构建时缓存</span>
</div>

<div class="contributors-grid">
  <a
    v-for="contributor in contributors"
    :key="contributor.id"
    :href="contributor.html_url"
    target="_blank"
    rel="noopener noreferrer"
    class="contributor-card"
  >
    <img
      :src="contributor.avatar_url"
      :alt="contributor.login"
      class="contributor-avatar"
      @error="handleImageError"
      loading="lazy"
    />
    <span class="contributor-name">{{ contributor.login }}</span>
    <span class="contributor-commits">{{ contributor.contributions }} commits</span>
  </a>
</div>

<style>
.contributors-thanks {
  display: flex;
  align-items: center;
  gap: 2px;
}

.contributors-celebration {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: -5px 0;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 120ms ease, transform 120ms ease;
}

.contributors-celebration:hover {
  background: var(--vp-c-bg-soft);
}

.contributors-celebration:active {
  transform: scale(0.96);
}

.contributors-celebration:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.contributors-meta {
  margin: 1rem 0 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.contributors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.contributor-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.contributor-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.contributor-avatar {
  width: 64px;
  height: 64px;
  margin-bottom: 10px;
  border-radius: 50%;
  background: var(--vp-c-bg-alt);
}

.contributor-name {
  max-width: 100%;
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 600;
  overflow-wrap: anywhere;
  text-align: center;
}

.contributor-commits {
  margin-top: 2px;
  color: var(--vp-c-text-3);
  font-size: 12px;
}

@media (prefers-reduced-motion: reduce) {
  .contributor-card,
  .contributors-celebration {
    transition: none;
  }
}

</style>
