import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: "YourTJ Hub 开发文档",
    description: "同济大学校园社区平台 YourTJ Hub —— 板块化论坛、统一身份、搜索与多端访问开发文档",
    lang: 'zh-CN',
    base: '/',

    mermaid: {
      // Mermaid 配置选项
    },

    head: [
      ['link', { rel: 'icon', href: '/favicon.svg' }],
      ['meta', { name: 'theme-color', content: '#06b6d4' }],
      ['meta', { name: 'og:type', content: 'website' }],
      ['meta', { name: 'og:locale', content: 'zh_CN' }],
      ['meta', { name: 'og:site_name', content: 'YourTJ Hub 开发文档' }],
    ],

    themeConfig: {
      logo: '/favicon.svg',

      nav: [
        { text: '首页', link: '/' },
        { text: '指南', link: '/guide/introduction' },
        { text: '开发', link: '/development/overview' },
        { text: '路线图', link: '/roadmap/' },
        {
          text: '更多',
          items: [
            { text: 'FAQ', link: '/other/faq' },
            { text: '声明', link: '/other/disclaimer' },
            { text: '贡献者', link: '/other/contributors' }
          ]
        }
      ],

      sidebar: {
        '/guide/': [
          {
            text: '开始',
            items: [
              { text: '项目简介', link: '/guide/introduction' },
              { text: '快速开始', link: '/guide/getting-started' },
              { text: '配置说明', link: '/guide/configuration' },
              { text: '部署指南', link: '/guide/deployment' },
              { text: '贡献指南', link: '/guide/contributing' }
            ]
          }
        ],
        '/development/': [
          {
            text: '架构与总览',
            items: [
              { text: '开发概述与架构', link: '/development/overview' }
            ]
          },
          {
            text: '核心模块',
            items: [
              { text: '前端（Vue 3）', link: '/development/frontend' },
              { text: '后端（Go）', link: '/development/backend' },
              { text: '数据库', link: '/development/database' },
              { text: 'API 契约', link: '/development/api' },
              { text: '课评', link: '/development/courses' }
            ]
          },
          {
            text: '共享能力',
            items: [
              { text: '身份与 OIDC', link: '/development/identity' },
              { text: '搜索', link: '/development/search' },
              { text: '移动端', link: '/development/mobile' }
            ]
          },
          {
            text: '质量保障',
            items: [
              { text: '测试策略', link: '/development/testing' }
            ]
          }
        ],
        '/roadmap/': [
          {
            text: '路线图',
            items: [
              { text: '能力状态', link: '/roadmap/' }
            ]
          }
        ],
        '/other/': [
          {
            text: '其他',
            items: [
              { text: 'FAQ', link: '/other/faq' },
              { text: '声明', link: '/other/disclaimer' },
              { text: '贡献者', link: '/other/contributors' }
            ]
          }
        ]
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/YourTongji/YourTJ-Hub' }
      ],

      footer: {
        message: 'MIT 许可仅适用于 apps/gooseforum（基于 <a href="https://github.com/leancodebox/GooseForum" target="_blank" rel="noopener noreferrer">GooseForum</a> 的修改）；monorepo 其余部分暂无根级许可证',
        copyright: `Copyright © 2026-${new Date().getFullYear()} YourTongji Team`
      },

      search: {
        provider: 'local',
        options: {
          translations: {
            button: {
              buttonText: '搜索文档',
              buttonAriaLabel: '搜索文档'
            },
            modal: {
              noResultsText: '无法找到相关结果',
              resetButtonTitle: '清除查询条件',
              footer: {
                selectText: '选择',
                navigateText: '切换'
              }
            }
          }
        }
      },

      outline: {
        label: '页面导航',
        level: [2, 3]
      },

      docFooter: {
        prev: '上一页',
        next: '下一页'
      },

      lastUpdated: {
        text: '最后更新于',
        formatOptions: {
          dateStyle: 'short',
          timeStyle: 'medium'
        }
      },

      editLink: {
        pattern: 'https://github.com/YourTongji/YourTJ-Doc/edit/main/:path',
        text: '在 GitHub 上编辑此页面'
      }
    }
  })
)
