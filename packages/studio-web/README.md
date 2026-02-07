# Donkey Studio (Standalone)

这是从 VS Code 扩展中拆出的独立前端，并已接入 Tauri 桌面壳。

当前 UI 形态是“店铺平面视角”：

- 左侧主区为会议室格子（每个格子是一个 AI 会议室）
- 右侧为选中会议室详情（讨论流 / 产物）
- 顶栏可切 Local/Cloud、推进全部房间一轮、检查更新

## 目录说明

- `src/`：前端页面逻辑（Vite + TypeScript）
- `public/release-manifest.json`：本地更新清单示例
- `src-tauri/`：Tauri Rust 壳（Windows 桌面应用）

## 本地 Web 运行

```bash
cd packages/studio-web
npm install
npm run dev
```

打开：`http://127.0.0.1:5173`

## 启动桌面版（Tauri）

```bash
cd packages/studio-web
npm install
npm run tauri:dev
```

> 前提：本机已安装 Rust 工具链（`rustup`, `cargo`）和 WebView2 运行时（Windows 通常已内置）。

## 打包 Windows 安装包

```bash
cd packages/studio-web
npm run tauri:build
```

产物会在 `packages/studio-web/src-tauri/target/release/bundle/` 下。

## 检查更新（快速方案）

前端内置“检查更新”按钮，通过版本清单 URL 拉取 JSON 并比较版本号。

当检测到新版本且清单中包含 `download_url` 时，会显示 `Download Update` 按钮，点击后直接打开下载地址。

同时会在顶部弹出更新 Toast，支持：

- `Download Update` 一键下载
- `关闭` 隐藏提示
- Toast 8 秒自动消失；有新版本时“检查更新”按钮带未读红点

默认清单地址：

- `/release-manifest.json`

可通过环境变量覆盖：

- `VITE_UPDATE_MANIFEST_URL`
- `VITE_UPDATE_AUTO_CHECK`（默认 `true`）
- `VITE_UPDATE_AUTO_CHECK_DELAY_MS`（默认 `3000`）

示例：

```bash
# Windows PowerShell
$env:VITE_UPDATE_MANIFEST_URL="https://api.yourdomain.com/studio/release-manifest.json"
$env:VITE_UPDATE_AUTO_CHECK="true"
$env:VITE_UPDATE_AUTO_CHECK_DELAY_MS="3000"
npm run tauri:dev
```

默认会在应用启动后约 3 秒自动检查更新（可通过环境变量关闭或调整延迟）。

清单格式示例：

```json
{
  "version": "0.1.1",
  "notes": "Bug fixes",
  "download_url": "https://yourdomain.com/download/donkey-studio-0.1.1.exe",
  "published_at": "2026-02-07"
}
```

## 后续可升级

- 自动下载并安装（静默更新）
- 分渠道更新（stable/beta/internal）
- 差分包更新（降低带宽）
