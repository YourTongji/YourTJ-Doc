import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

const startYear = 2026
const currentYear = new Date().getFullYear()
const copyrightYears = currentYear > startYear ? `${startYear}-${currentYear}` : `${startYear}`

export default withMermaid(
  defineConfig({
    title: 'YourTJ Hub开发文档',
    description: 'YourTJ Hub开发文档',
    lang: 'zh-CN',
    base: '/',
    srcExclude: ['PRD/**'],

    mermaid: {},

    vite: {
      ssr: {
        noExternal: ['@nolebase/*']
      }
    },

    head: [
      ['link', { rel: 'icon', type: 'image/png', href: '/yourtj-icon.png' }],
      ['link', { rel: 'apple-touch-icon', href: '/yourtj-icon.png' }],
      ['meta', { name: 'theme-color', content: '#06b6d4' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:locale', content: 'zh_CN' }],
      ['meta', { property: 'og:site_name', content: 'YourTJ Hub开发文档' }]
    ],

    themeConfig: {
      logo: '/yourtj-icon.png',
      siteTitle: 'YourTJ Hub开发文档',

      nav: [
        {
          text: '使用',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '社区', link: '/guide/community' },
            { text: '课程与排课', link: '/guide/courses' },
            { text: '我的校园', link: '/guide/campus' }
          ]
        },
        {
          text: '开发',
          items: [
            { text: '从这里开始', link: '/development/local-development' },
            { text: '架构', link: '/development/overview' },
            { text: 'API 契约', link: '/development/api' },
            { text: '测试', link: '/development/testing' }
          ]
        },
        {
          text: '其他',
          items: [
            { text: '常见问题', link: '/other/faq' },
            { text: '贡献者', link: '/other/contributors' },
            { text: '声明', link: '/other/disclaimer' }
          ]
        },
        { text: '社区', link: 'https://f.yourtj.de' },
        { text: 'GitHub', link: 'https://github.com/YourTongji/YourTJ-Hub' }
      ],

      sidebar: [
        {
          text: '简介',
          items: [
            { text: '关于 YourTJ Hub', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '常见问题', link: '/other/faq' }
          ]
        },
        {
          text: '使用',
          items: [
            { text: '社区', link: '/guide/community' },
            { text: '课程与排课', link: '/guide/courses' },
            { text: '我的校园', link: '/guide/campus' },
            { text: 'Wiki', link: '/guide/wiki' },
            { text: '校园地图', link: '/guide/campus-map' },
            { text: '账号与安全', link: '/guide/account-security' }
          ]
        },
        {
          text: '部署',
          collapsed: false,
          items: [
            { text: '部署 YourTJ Hub', link: '/guide/deployment' },
            { text: '配置参考', link: '/guide/configuration' },
            { text: '运行状态站', link: '/guide/status' }
          ]
        },
        {
          text: '开发',
          collapsed: true,
          items: [
            { text: '从这里开始', link: '/development/local-development' },
            { text: '架构', link: '/development/overview' },
            { text: '前端', link: '/development/frontend' },
            { text: '后端', link: '/development/backend' },
            { text: '数据库', link: '/development/database' },
            { text: 'API 契约', link: '/development/api' },
            { text: '课程与排课', link: '/development/courses' },
            { text: '身份与 OIDC', link: '/development/identity' },
            { text: '搜索', link: '/development/search' },
            {
              text: '移动端',
              collapsed: true,
              items: [
                { text: '概览', link: '/development/mobile/' }
              ]
            },
            { text: 'Agents 与 MCP', link: '/development/agents-mcp' },
            { text: '测试', link: '/development/testing' },
            { text: '贡献代码', link: '/guide/contributing' }
          ]
        },
        {
          text: '其他',
          collapsed: true,
          items: [
            { text: '声明', link: '/other/disclaimer' },
            { text: '贡献者', link: '/other/contributors' }
          ]
        }
      ],

      socialLinks: [
        { icon: 'github', link: 'https://github.com/YourTongji/YourTJ-Hub' }
      ],

      footer: {
        copyright: `Copyright © ${copyrightYears} YourTongji Team`
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
                navigateText: '切换',
                closeText: '关闭'
              }
            }
          }
        }
      },

      outline: {
        label: '目录',
        level: 'deep'
      },

      sidebarMenuLabel: '文章',
      returnToTopLabel: '返回顶部',

      docFooter: {
        prev: '上一篇',
        next: '下一篇'
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
        text: '发现文档有问题？在 GitHub 上编辑此页'
      }
    }
  })
)
