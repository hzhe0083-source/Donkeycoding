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

### 一键启动（Windows）

在仓库根目录双击或终端运行：

```bat
start_workerflow.bat
```

它会自动执行：
- `cargo build -p orchestrator`
- `packages/vscode-ext` 的 `npm install`（首次）与 `npm run build`
- 启动 VS Code 扩展开发窗口（Extension Development Host）

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
  - `session/state`
  - `config/setKeys`
  - `workflow/execute`
- 已接通通知：
  - `session/state`
  - `session/participants`
  - `session/progress`
  - `turn/chunk`
  - `turn/complete`
  - `workflow/step`
  - `workflow/complete`

## Workflow 落地执行（API + Command）

新增 `workflow/execute`，支持在一次调用中串行执行多步流程，并可将执行结果回灌到会话继续讨论。

示例：

```json
{
  "session_id": "sess-xxxx",
  "stop_on_error": true,
  "continue_chat": true,
  "followup_prompt": "已执行步骤，请继续给出下一步编码改动",
  "steps": [
    {
      "kind": "http",
      "name": "health-check",
      "method": "GET",
      "url": "https://httpbin.org/get",
      "timeout_ms": 15000
    },
    {
      "kind": "command",
      "name": "run-tests",
      "command": "npm test",
      "cwd": ".",
      "timeout_ms": 120000
    }
  ]
}
```

前端（Donkey Studio）右侧面板新增“落地 Workflow（JSON）”输入框和“执行落地脚本”按钮，可直接触发上述 RPC。

## Orchestrator 算子链（已接入）

`session/start` 支持传入 `operators`，用于控制每轮执行前后逻辑（输入清洗、上下文窗口、参与者筛选、输出格式约束等）。

示例：

```json
{
  "task": "给 monorepo 增加 CI 质量门禁",
  "operators": {
    "chain": [
      { "name": "sanitize_input", "enabled": true, "config": { "max_chars": 3000 } },
      { "name": "context_window", "enabled": true, "config": { "max_messages": 20 } },
      { "name": "participant_selector", "enabled": true, "config": { "max_participants": 2 } },
      { "name": "role_response_format", "enabled": true, "config": { "json_mode": false } },
      { "name": "output_guard", "enabled": true, "config": { "min_chars": 16 } }
    ]
  }
}
```

当前内置算子：
- `sanitize_input`
- `context_window`
- `participant_selector`
- `role_response_format`
- `review_instruction`
- `review_findings`
- `output_guard`

## 审核工程化（Review Policy）

`session/start` 可同时传 `review`，用于控制审核输出门槛和报告聚合策略。

示例：

```json
{
  "task": "审核本次 PR 的安全与正确性风险",
  "review": {
    "enabled": true,
    "language": "zh-CN",
    "min_severity": "MEDIUM",
    "max_findings": 6,
    "require_evidence": true,
    "categories": ["correctness", "security", "performance"]
  }
}
```

完成后 `session/start` 返回中会包含 `review` 聚合结果（summary / overall_risk / findings）。

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

## Launch Notes (Windows)

- `start_workerflow.bat`：默认启动 **Donkey Studio 桌面窗口**（`packages/studio-web` + `tauri:dev`）。
- `start_vscode_mode.bat`：启动 **VS Code 扩展调试模式**（Extension Development Host）。
- `scripts/start_desktop_mode.ps1 -Web`：改为启动 **Web 模式**（Vite dev server）。
