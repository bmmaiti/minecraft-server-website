# 构建说明

## 项目构建

本项目包含一个简单的构建系统，用于准备部署版本。

### 构建脚本

项目包含以下 npm 脚本：

- `npm run build` - 构建项目到 `dist` 目录，包括：
  - 复制所有必要的文件
  - 优化 HTML 文件（移除注释和多余空白）
  - 优化 CSS 文件（移除注释和压缩空白）

- `npm start` - 启动 Node.js 服务器
- `npm run dev` - 启动 Python 开发服务器

### 构建输出

构建后的文件位于 `./dist` 目录中，包含：

- 所有 HTML 文件（已优化）
- CSS 文件（已优化）
- JavaScript 文件
- 静态资源（图片、字体等）
- 配置文件（web.config, site.webmanifest 等）

### 部署

构建后的 `dist` 目录可以直接部署到 Web 服务器（如 IIS）。

### 注意事项

- 构建过程会清理之前的 `dist` 目录
- 某些开发文件（如 `node_modules`, 构建脚本等）不会被包含在构建输出中
- HTML 和 CSS 优化会移除注释，但保留功能完整性