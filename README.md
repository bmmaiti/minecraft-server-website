# 网站项目

这是一个静态网站项目，包含了主页、友链页面等多个页面。

## 项目结构

- `index.html` - 主页
- `links.html` - 友链页面
- `links.json` - 友链数据文件
- `css/` - 样式文件
- `js/` - JavaScript 文件
- `logos/` - logo 图片
- `logo/` - logo 图片
- `photos/` - 照片资源
- `scenery/` - 风景图片
- `tietu3/` - 贴图资源
- `lizi/` - 粒子效果图片
- `fonts/` - 字体文件

## 构建系统

本项目包含一个简单的构建系统：

- `npm run build` - 构建项目到 `dist` 目录
- `npm start` - 启动 Node.js 服务器
- `npm run dev` - 启动 Python 开发服务器

## 部署

项目包含 IIS 部署所需的配置文件：

- `web.config` - IIS 配置文件
- `site.webmanifest` - Web 应用清单文件
- `一键部署脚本.bat` - Windows 部署脚本
- `部署说明.txt` - 部署指南

## 功能特性

- 响应式设计
- 动态加载友链
- 本地 logo 缓存
- 优雅的加载错误处理
- 现代化的 UI 设计