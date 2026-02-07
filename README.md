# Auto_donkey

Donkey Studio 的当前形态是一个 **Rust Orchestrator + VS Code Studio 前端原型**。

## 项目结构

- `crates/orchestrator`：Rust JSON-RPC over stdio 引擎（MVP）
- `packages/vscode-ext`：VS Code 扩展（Studio Webview + Dashboard）
- `packages/studio-web`：独立前端原型（可单独运行，后续可打包 Windows 客户端）
- `docker`：本地开发容器编排（支持改完后 `restart`）

## 快速启动（推荐）

### 1) 构建引擎

```bash
cargo build -p orchestrator
```

产物路径：

- Windows: `target/debug/orchestrator.exe`
- macOS/Linux: `target/debug/orchestrator`

### 2) 构建扩展

```bash
cd packages/vscode-ext
npm install
npm run build
```

### 3) 启动调试

1. 用 VS Code 打开仓库根目录。
2. 按 `F5`（`Debug: Start Debugging`）打开 Extension Development Host。
3. 在命令面板运行：
   - `Workerflow: Open Chat`
   - `Workerflow: Open Dashboard`
   - `Workerflow: Ping Engine`
   - `Workerflow: Start Session`
   - `Workerflow: Show Engine Logs`

如果默认找不到引擎，可配置：

- `workerflow.orchestratorPath`

例如 Windows：

- `e:\donkey\Auto_donkey\target\debug\orchestrator.exe`

## 当前功能（前端原型）

### Studio（`Workerflow: Open Chat`）

- 左侧 Workspace 列表（多会话）
- 中央对话区（输入、流式输出、重试、停止）
- Local / Cloud 运行目标切换
- 运行指标卡片（Target / Elapsed / Budget / Progress）
- 右侧 Artifacts / Test Runs 面板（当前为占位流程）

### Dashboard（`Workerflow: Open Dashboard`）

- 会话状态卡片（Session、Status、Turn、Agreement、Token、Cost）
- Agreement 圆环进度显示
- 参与者状态表格
- 事件流（request/response/notification/stderr）

## 协议与链路（MVP）

- 扩展启动 Rust 子进程，通过 `Content-Length` 帧收发 JSON-RPC 2.0。
- 已接通方法：
  - `ping`
  - `session/start`
  - `chat/send`
  - `chat/stop`
- 已接通通知：
  - `session/state`
  - `session/participants`
  - `session/progress`
  - `turn/chunk`
  - `turn/complete`

## Docker 开发模式（可选）

如果你希望代码改动后通过重启容器快速生效：

```bash
docker compose -f docker/docker-compose.yml up -d --build
docker compose -f docker/docker-compose.yml restart orchestrator
```

常用命令：

```bash
docker compose -f docker/docker-compose.yml logs -f orchestrator
docker compose -f docker/docker-compose.yml down
```

详细说明：`docker/README.md`

## 打包 VSIX

```bash
cd packages/vscode-ext
npx vsce package
```

然后在 VS Code 执行：

- `Extensions: Install from VSIX...`

## Donkey Studio（独立前端）

```bash
cd packages/studio-web
npm install
npm run dev
```

打开：`http://127.0.0.1:5173`

桌面版（Windows）启动：

```bash
cd packages/studio-web
npm run tauri:dev
```

打包安装包：

```bash
cd packages/studio-web
npm run tauri:build
```

更新检查支持 `VITE_UPDATE_MANIFEST_URL`，可指向你的线上版本清单。

## 说明与限制

- 当前是前端优先的原型阶段：
  - `Run Tests` / `Generate Artifact` 仍是前端占位流。
  - Cloud 目标切换目前主要体现于前端与请求参数，后端路由待接入。
- 若看到 `node_modules/@types/node/*.d.ts` 飘红，通常是 TS Server 问题，不影响本项目构建；可尝试 `TypeScript: Restart TS Server`。
