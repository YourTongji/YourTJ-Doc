---
layout: home

hero:
  name: "YourTJ"
  text: "选课社区"
  tagline: 不记名，自由，简洁，高效的选课社区
  image:
    src: /favicon.svg
    alt: YourTJ Logo
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看文档
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/YourTongji/YourTJCourse-Serverless

features:
  - title: ✍️课程评价
    details: 支持站内课程不记名点评展示
  - title: 🔍智能筛选
    details: 支持按开课单位和有无评价维度筛选，快速找到目标课程
  - title: 📋社区互动
    details: 基于 Waline 的留言反馈系统，支持实时留言反馈
  - title: 🛡️安全验证
    details: 集成 YourTJCaptcha 人机验证，保障评价真实可信
  - title: ⚛️现代架构
    details: 基于 React + Cloudflare Workers 的 Serverless 架构
  - title: 💕开源共建
    details: 完全开源，欢迎参与社区贡献代码与数据
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #06b6d4 30%, #3b82f6);
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #06b6d4 50%, #3b82f6 50%);
  --vp-home-hero-image-filter: blur(44px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>
