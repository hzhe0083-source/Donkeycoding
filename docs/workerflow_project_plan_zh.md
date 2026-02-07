# Workerflow（Workflow）与详细项目规划

日期：2026-02-06

## 1. 项目定位

你要做的是一个“多模型会议系统”，形态上是 VS Code 插件，能力上是一个可扩展的多模型协作引擎：

- 在同一对话窗口内组织多个模型（OpenAI/Anthropic/Google/DeepSeek 等）围绕同一任务讨论。
- 每个模型可被赋予不同角色（提出者、审稿人、质疑者、裁决者等）。
- 系统通过可配置策略决定：谁先发言、谁反驳、何时停止、如何合并结论。
- 支持 BYO Key（用户自带 API Key），后续可扩展托管模式。

一句话定义：

"Roo/Cline 形态 + 多模型会议式调度 + 可扩展策略引擎 + 高扩展插件协议"。

## 2. 产品目标与边界

### 2.1 核心目标

- 提升复杂任务（编码、架构、评审、决策）的正确率和稳健性。
- 降低单模型幻觉风险，提供可解释的讨论过程与决策依据。
- 提供强可配置调度框架，支持不同场景的停止策略、预算策略和质量策略。

### 2.2 非目标（第一阶段）

- 不追求一次性覆盖所有 IDE（先聚焦 VS Code）。
- 不做“大而全”项目管理平台（先把会话调度做透）。
- 不把所有论文算法全量落地（先做可演进的策略接口）。

## 3. 分发与接入模式（简述）

> 商业化不是第一阶段重点，此处仅做最小设计以保证架构预留。

- **BYO Key（默认）**：用户自配各厂商 API Key，请求直连厂商。
- **托管网关（后续）**：可选统一路由网关，预留计费与限流接口。

## 4. 技术架构（多语言混编）

### 4.1 组件分层

- VS Code Extension（TypeScript）
  - 聊天 UI、配置面板、命令入口、会话展示。
- Orchestrator Engine（Rust）
  - 核心调度器、策略执行器、预算与停止判定、结果融合。
- Model Adapters（多语言可插拔）
  - Node/Python/Rust/Go 均可；统一通过协议接入。
- Provider Gateway（可选，云端）
  - 计费、鉴权、模型路由、限流、审计。

### 4.2 通信协议

- 插件 ↔ Rust：**JSON-RPC 2.0 over stdio**（本地优先，落地快）。
  - 请求/响应：标准 `method` + `id` 调用。
  - **流式推送**：使用 JSON-RPC 2.0 **notification**（无 `id` 字段）实现服务端主动推送。
    - `turn/chunk`：单个模型的流式 token 片段。
    - `turn/complete`：单个参与者本轮输出完成。
    - `session/progress`：会话级进度（当前轮次、agreement_score、token 消耗）。
    - `session/state`：会话状态迁移（running/paused/completed/failed）与原因码。
  - 通知体建议统一字段：`session_id`、`turn_index`、`event_seq`、`timestamp`、`payload`。
  - 顺序保证：同一 `session_id` 下 `event_seq` 单调递增；插件端按 `event_seq` 重排并去重。
  - 背压约定：当插件消费滞后时发送 `session/backpressure` 请求，Rust 端降低 chunk 频率或切换摘要模式。
  - 消息帧格式：`Content-Length: <n>\r\n\r\n<JSON>`（与 LSP 一致）。
- Rust ↔ Adapter：JSON-RPC（后期可升级 gRPC）。
- 云端网关（可选）：HTTPS + SSE/WebSocket（流式返回）。

### 4.3 为什么这样拆

- VS Code 插件生态决定前端宿主适合 TS。
- Rust 负责调度核心，稳定、并发友好、便于长期扩展。
- Adapter 解耦厂商差异，避免核心引擎被 SDK 细节污染。

### 4.4 Adapter 进程模型

- **MVP 阶段（in-process）**：Adapter 以 Rust HTTP client 形式内嵌于 Orchestrator Engine，直接调用各厂商 REST API。
- **后续阶段（out-of-process）**：Adapter 抽离为独立子进程或 sidecar，通过 JSON-RPC/gRPC 通信，支持多语言实现。
- 选择依据：当需要 Python SDK（如 Google Vertex）或特殊运行时时，切换为 out-of-process。

### 4.5 跨平台构建与分发

- Rust 编译为 native binary，需为 Windows（x64/arm64）、macOS（x64/arm64）、Linux（x64/arm64）分别构建。
- CI 矩阵：GitHub Actions `matrix.os` × `matrix.target`，产出平台特定二进制。
- VS Code 插件按平台打包：`vsce package --target win32-x64`、`darwin-arm64` 等。
- 体积控制：strip symbols + UPX 压缩（可选）；考虑 WASM 作为轻量级替代方案（牺牲部分性能）。

## 5. 运行时 Workerflow（一次会话的完整闭环）

### 5.1 会话初始化

1. 用户提交任务。
2. 读取场景模板（Coding/Review/Architect/Debug/Research）。
3. 组装参与者清单：模型 + 角色 + 预算 + 优先级。
4. 生成会议计划（轮次上限、停止阈值、预算阈值）。

### 5.2 多轮讨论

1. 首轮提出方案（Proposer）。
2. 交叉质询（Critic/Skeptic）。
3. 补证据与修正（Researcher/Verifier）。
4. 合成中间结论（Synthesizer）。
5. 若冲突高 -> 继续下一轮；若一致度达标 -> 进入裁决。

### 5.3 裁决与输出

1. Arbiter 生成候选结论。
2. 执行质量门禁（正确性/风险/预算/SLO）。
3. 输出最终结果：答案 + 决策理由 + 分歧点 + 后续建议。

### 5.4 上下文窗口管理

1. **滚动摘要层**：每轮结束后生成结构化摘要（结论、分歧、证据、待决项），替代冗长原文历史。
2. **滑动窗口层**：保留最近 N 轮原始片段 + 关键证据，超过窗口的内容仅以摘要形式注入。
3. **选择性注入层**：按当前角色与任务类型注入最相关历史（如 Critic 优先分歧与反例，Arbiter 优先结论与证据）。
4. **预算守卫层**：当预计 token 超过 `context_window_limit` 的 85% 时，自动触发压缩；超过 95% 时强制降级为“摘要优先模式”。
5. **可追溯性**：摘要保留 `source_turn_refs`，支持回放时定位到原始轮次，避免信息不可解释。

## 6. 调度策略框架（核心）

### 6.1 参与者选择策略

- Static Top-K：固定模型组合，适合稳定场景。
- Task-aware：按任务类型动态选择模型组。
- Budget-aware：在成本预算下最优组合。
- Reliability-aware：优先历史稳定模型。

### 6.2 发言顺序策略

- Parallel First：并行首答，后续串行反驳。
- Debate Tree：树状辩论，适合复杂设计问题。
- Judge Loop：每轮由裁决者引导聚焦冲突点。

### 6.3 结果融合策略

- Weighted Voting：按模型权重/历史表现加权投票。
- Evidence Scoring：证据链质量评分后再融合。
- Pairwise Tournament：两两比较淘汰，输出冠军方案。
- Hybrid：投票 + 证据 + 裁决模型三段式。

### 6.4 停止策略（必须可配置）

- 达到最大轮次。
- 达到 token/费用预算。
- 一致度超过阈值。
- 边际收益低于阈值（连续两轮提升很小）。
- 用户显式终止。

### 6.5 一致度算法（agreement_score）

- 定义：`agreement_score ∈ [0,1]`，用于衡量本轮结论收敛程度。
- 默认计算：`0.5 * semantic_similarity + 0.3 * keypoint_overlap + 0.2 * vote_consistency`。
- 默认阈值：`agreement_score >= 0.78` 且连续 2 轮满足，可触发自动停止。
- 分歧升级：若 `agreement_score < 0.45` 且冲突项增加，强制进入裁决轮或人工复核。

### 6.6 策略组合与冲突优先级

- 优先级链：`Safety/HumanReview > Budget Hard Limit > Reliability > Quality`。
- 同级冲突时：先选满足约束的最小模型组，再按“更低成本 + 更低时延”择优。
- 不可满足时：进入降级路径（减少参与者、切换备选模型、提高摘要压缩率），并记录降级原因。

### 6.7 Human-in-the-Loop 触发条件

- `policy.human_review_trigger` 建议字段：`min_confidence`、`max_disagreement`、`risk_actions[]`、`required_roles[]`。
- 默认触发条件：
  - `confidence < 0.75`；
  - `agreement_score < 0.60` 且连续两轮不收敛；
  - 任一关键角色（如 Arbiter/Verifier）返回 `timeout/error`；
  - 输出包含高风险动作（删除、部署、生产配置变更、权限调整）。
- 触发后行为：会话转为 `paused`，要求用户在“确认执行 / 修改后执行 / 终止”中选择。

## 7. 关键数据结构（建议）

### 7.1 MeetingRequest

- session_id
- task
- participants[]（participant_id, role, provider, model_id, model_config, context_window_limit, vote_weight, priority）
- policy（schedule, merge, stop, concurrency_limit, retry_policy, human_review_trigger）
- budget（max_tokens, max_cost, max_rounds）

### 7.2 ParticipantOutput

- participant_id
- status（`success | error | timeout | skipped`）
- content（文本或结构化片段）
- latency_ms
- tokens_used（prompt_tokens, completion_tokens, total_tokens）
- cost_estimate
- error（可选：code, message, retryable）

### 7.3 TurnResult

- turn_index
- outputs[]（ParticipantOutput）
- conflict_map（参与者两两冲突强度矩阵，例如 `{"modelA:modelB": 0.72}`）
- agreement_score
- quality_signals（factuality, completeness, risk_score）
- degraded_paths（可选：记录回退链路与触发原因）

### 7.4 SessionState

- session_id
- status（`running | paused | completed | failed`）
- current_turn
- turns（`Vec<TurnResult>`）
- rolling_summary（压缩后的历史上下文）
- total_tokens
- total_cost
- created_at / updated_at

### 7.5 FinalDecision

- final_answer
- confidence
- rationale
- dissenting_opinions
- action_items

## 8. 安全、合规与信任

- Key 管理：本地加密存储 + 最小权限访问。
- 数据策略：可选“纯本地上下文模式”。
- 审计：记录策略路径与调用摘要（可脱敏）。
- 高风险任务定义（命中任一即要求人工确认）：
  - 文件删除/覆盖、批量重写、自动执行终端命令；
  - 部署、数据库迁移、生产环境配置变更；
  - 权限策略、安全规则、支付或隐私数据处理。
- 人工确认触发：结合 `human_review_trigger` 与实时质量信号（confidence、agreement、关键角色状态）统一判定。

## 9. 可观测性与评估指标

### 9.1 质量指标

- 任务完成率
- 人工采纳率
- 回归错误率
- 幻觉率（人工标注）

### 9.2 性能指标

- TTFT、总时延、每轮时延
- token 消耗、费用消耗
- 并发会话数、失败率

### 9.3 调度效果指标

- 一致度收敛速度
- 冲突解决率
- 边际收益曲线（轮次 vs 质量提升）

### 9.4 稳定性指标

- 回退触发率（熔断/降级）
- 重试成功率与平均重试次数
- 背压队列长度与排队时延

## 10. 里程碑规划（12 周版本）

### 阶段 A（第 1-2 周）：MVP 骨架

- VS Code 插件壳 + Rust 引擎进程通信。
- 单轮多模型并发 + 基础聚合输出。
- 支持 BYO Key（2-3 家厂商）。
- 建立测试基线：Rust `cargo test` + TS `vitest/jest`。
- 建立 CI 骨架：`lint + unit test + build`。
- 固化 JSON-RPC 协议契约测试（request/response/notification）。

### 阶段 B（第 3-5 周）：会议调度 v1

- 角色系统（Proposer/Critic/Synthesizer/Arbiter）。
- 多轮讨论与停止策略。
- 会话回放与日志面板。
- 上下文窗口管理 v1（摘要压缩 + 滑动窗口 + 选择性注入）。
- Adapter mock 集成测试与确定性回放测试。

### 阶段 C（第 6-8 周）：策略引擎 v2 与工程化

- 策略热加载：运行时切换调度/融合/停止策略，无需重启。
- Adapter 熔断与自动回退（超时、限流、模型故障切换）。
- 端到端集成测试框架 + 跨平台 CI 矩阵流水线。
- 配置管理方案（TOML/JSON Schema，workspace/user 分层覆盖）。
- 可选：路由网关原型（预留计费接口）。

### 阶段 D（第 9-10 周）：质量与稳定性

- 压测与故障注入。
- 降级策略（超时、限流、模型故障切换）。
- 指标看板与告警。
- 并发控制与背压参数调优（`concurrency_limit`、排队阈值、退避策略）。

### 阶段 E（第 11-12 周）：Beta 发布

- 小范围内测。
- 收集用户反馈，修订默认策略。
- 准备公开版本与文档。
- 自动化打包与灰度发布流程。

## 11. 项目风险与应对

- 风险：多模型成本过高。
  - 应对：分级策略 + 预算守卫 + 早停。
- 风险：延迟过高影响体验。
  - 应对：并行优先 + speculation + 缓存复用。
- 风险：结论冲突难融合。
  - 应对：引入裁决轮 + 证据评分。
- 风险：厂商 API 波动。
  - 应对：适配器熔断 + 自动回退。
- 风险：Rust 二进制跨平台分发复杂，插件体积膨胀。
  - 应对：CI 矩阵构建 + 按平台分包 + 可选 WASM 替代评估。
- 风险：多轮会话上下文爆炸，导致 token 和成本失控。
  - 应对：摘要压缩 + 滑动窗口 + 历史选择性注入。
- 风险：策略逻辑复杂，回归测试困难。
  - 应对：策略接口 trait 化 + mock adapter + 确定性回放测试。
- 风险：Orchestrator 单点故障导致会话中断。
  - 应对：进程守护 + 崩溃自动重启 + SessionState 持久化恢复。

## 12. 下一步落地清单（可立即执行）

1. 确定 v0 的 3 家首发模型厂商与 fallback 顺序。
2. 固化 JSON-RPC 协议：request/response/notification、错误码、事件序号规则。
3. 明确核心结构体与 Schema：`MeetingRequest`、`ParticipantOutput`、`TurnResult`、`SessionState`。
4. 实现上下文管理器 v1：摘要压缩、滑动窗口、选择性注入。
5. 在策略层落地 `agreement_score` 默认算法与阈值。
6. 在仓库创建 `packages/vscode-ext` 与 `crates/orchestrator`，打通单场景（Code Review）端到端闭环。
7. 建立 CI 流水线（lint/test/build/package）与跨平台产物矩阵。
8. 完成结构化日志、配置分层（workspace/user）与高风险人工确认策略。

---
