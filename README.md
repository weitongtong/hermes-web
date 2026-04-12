# Hermes Web

Hermes Agent 的 Web 管理界面，提供对话、记忆、技能、定时任务等功能的可视化操作。

## 技术栈

| 层 | 技术 |
|---|------|
| 前端框架 | React 19 + React Router 7 |
| 构建工具 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 数据请求 | TanStack Query 5 |
| BFF 服务 | Express 5 (Node.js) |
| 本地数据 | better-sqlite3（读取 hermes-agent 的 SQLite） |
| 包管理 | pnpm |

## 项目结构

```
hermes-web/
├── server/                  # BFF 层 (Express)
│   ├── index.js             # 服务入口，挂载路由
│   ├── preload.js           # 预加载脚本
│   ├── routes/
│   │   ├── chat.js          # 对话 & 模型列表（代理到 Agent API）
│   │   ├── sessions.js      # 会话历史（读取本地 SQLite）
│   │   ├── memory.js        # 记忆文件管理
│   │   ├── skills.js        # 技能管理
│   │   ├── config.js        # 配置 & 环境变量
│   │   ├── status.js        # 系统状态
│   │   ├── jobs.js          # 定时任务（代理到 Agent API）
│   │   └── channels.js      # 频道目录
│   └── utils/
│       ├── hermes-paths.js  # ~/.hermes/ 路径解析
│       └── yaml-helper.js   # YAML 读写工具
├── src/                     # 前端
│   ├── App.jsx              # 路由定义
│   ├── main.jsx             # 入口
│   ├── pages/
│   │   ├── Chat.jsx         # 对话页
│   │   ├── Dashboard.jsx    # 仪表盘
│   │   ├── Sessions.jsx     # 会话历史
│   │   ├── Jobs.jsx         # 定时任务管理
│   │   ├── Memory.jsx       # 记忆管理
│   │   ├── Skills.jsx       # 技能管理
│   │   └── Settings.jsx     # 系统设置
│   ├── components/
│   │   ├── layout/          # Layout, Sidebar
│   │   ├── chat/            # ChatInput, MessageBubble, ToolCallCard 等
│   │   └── common/          # MarkdownRenderer 等通用组件
│   ├── hooks/
│   │   ├── useChat.js       # 对话 SSE 流式通信
│   │   └── useHermesAPI.js  # TanStack Query 封装
│   └── lib/
│       ├── api.js           # API 客户端
│       ├── cn.js            # className 工具
│       └── message-adapter.js
├── vite.config.js
└── package.json
```

## 架构说明

```
┌──────────┐    :8181     ┌────────────┐    :3001     ┌─────────────┐
│  浏览器   │ ◄──────────► │  Vite Dev   │ ──/api──► │  Express BFF │
└──────────┘              └────────────┘              └──────┬──────┘
                                                             │
                                              ┌──────────────┼──────────────┐
                                              │              │              │
                                              ▼              ▼              ▼
                                      ~/.hermes/DB    ~/.hermes/配置   Agent API :8642
                                      (SQLite直读)    (文件直读写)    (HTTP代理)
```

- **Vite Dev Server** (端口 8181)：开发时提供前端热更新，`/api` 请求代理到 BFF
- **Express BFF** (端口 3001)：中间层服务，部分接口直接读写 `~/.hermes/` 下的文件和 SQLite 数据库，部分接口（对话、模型、定时任务）代理到 hermes-agent 的 HTTP API
- **Hermes Agent API** (端口 8642)：Python 后端，需在 `~/.hermes/.env` 中设置 `API_SERVER_ENABLED=true`

## 快速开始

### 前置条件

- Node.js >= 18
- pnpm
- hermes-agent 已运行且 API Server 已启用

### 安装与启动

```bash
# 安装依赖
pnpm install

# 开发模式（同时启动 Vite + Express）
pnpm dev

# 访问 http://localhost:8181
```

### 生产构建

```bash
# 构建前端
pnpm build

# 启动生产服务（Express 托管静态文件 + API）
pnpm start
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | Express BFF 监听端口 |
| `HERMES_HOME` | `~/.hermes` | hermes-agent 数据目录路径 |

## 页面功能

| 页面 | 路由 | 说明 |
|------|------|------|
| 对话 | `/chat/:sessionId?` | 与 Agent 进行 SSE 流式对话 |
| 仪表盘 | `/dashboard` | 系统状态总览、模型信息、任务统计 |
| 会话历史 | `/sessions` | 查看和搜索历史对话记录 |
| 定时任务 | `/jobs` | 创建、编辑、暂停、执行定时任务 |
| 记忆 | `/memory` | 查看和编辑 Agent 的记忆文件 |
| 技能 | `/skills` | 管理 Agent 可用的技能 |
| 设置 | `/settings` | 编辑 config.yaml 和环境变量 |
