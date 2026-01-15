import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: "YourTJ 选课社区",
    description: "同济大学课程评价与选课指南平台文档",
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
      ['meta', { name: 'og:site_name', content: 'YourTJ 选课社区' }],
    ],

    themeConfig: {
      logo: '/favicon.svg',

      nav: [
        { text: '首页', link: '/' },
        { text: '指南', link: '/guide/introduction' },
        { text: '开发', link: '/development/overview' },
        { text: 'RoadMap', link: '/roadmap/' },
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
            text: '开发文档',
            items: [
              { text: '概述', link: '/development/overview' },
              { text: '前端架构', link: '/development/frontend' },
              { text: '后端架构', link: '/development/backend' },
              { text: '数据表结构', link: '/development/database' },
              { text: 'API 接口', link: '/development/api' }
            ]
          },
          {
            text: '核心功能',
            items: [
              { text: '筛选逻辑', link: '/development/filtering' },
              { text: '验证系统', link: '/development/verification' },
              { text: '人机验证', link: '/development/captcha' },
              { text: '评论系统', link: '/development/comments' },
              { text: '唯一标识符', link: '/development/sqids' }
            ]
          },
          {
            text: '部署配置',
            items: [
              { text: '环境变量', link: '/development/env-variables' },
              { text: 'Cloudflare Workers', link: '/development/cloudflare' },
              { text: 'Waline 部署', link: '/development/waline' }
            ]
          }
        ],
        '/roadmap/': [
          {
            text: 'RoadMap',
            items: [
              { text: '开发计划', link: '/roadmap/' }
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
        { icon: 'github', link: 'https://github.com/YourTongji/YourTJCourse-Serverless' }
      ],

      footer: {
        message: '基于 <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">MIT 许可</a>发布',
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
