# Auto_donkey 重构执行文档（第一阶段）

## 1. 目标

本阶段聚焦两类问题：

1. **通信稳定性**：修复 Tauri 到 orchestrator 的 JSON-RPC 通道竞态与状态漂移。
2. **文档可维护性**：整理 `docs/` 的导航与分层，减少“文档很多但不好找”的问题。

---

## 2. 约束与原则

- 只做**高优先级、低破坏性**改动。
- 不引入新的复杂依赖。
- 每项改动都要能通过本地构建验证。
- 文档先行：先定义改动项，再按文档实施。

---

## 3. 第一阶段实施项

### A. Tauri RPC 通道修复（必做）

1. 修复 `send_rpc` 的 pending 注册时序：
   - 先注册 pending，再写入 stdin。
   - 避免“响应先到但 pending 未注册”的竞态。

2. 增强 pending 清理机制：
   - orchestrator 重启时清理 pending。
   - orchestrator 停止时清理 pending。
   - 请求超时后移除对应 pending，避免泄漏。

3. 进程状态一致性：
   - orchestrator stdout 关闭时，回写共享状态（`child/stdin` 置空）。
   - `orchestrator_status` 增加 `try_wait` 检查，避免“进程已退出但状态仍显示运行”。

### B. docs 整理（必做）

1. 新增 `docs/README.md` 作为统一入口。
2. 明确“核心文档 / 研究文档”分组。
3. 保留历史研究内容，不做破坏性删除。

---

## 4. 完成定义（DoD）

- [ ] `packages/studio-web/src-tauri/src/main.rs` 完成上述 A 类修复。
- [ ] `docs/README.md` 新增并可用。
- [ ] Rust 与 TS 相关构建通过。

---

## 5. 第二阶段建议（后续）

- 拆分 `packages/studio-web/src/ui.ts`（渲染、事件、样式分离）。
- 引入统一协议类型（Rust/TS 共用 schema）。
- 增加最小测试集合（RPC framing、通知归并、状态机）。

