# LLM 调度框架与评分表（中文）
日期：2026-02-05
目标：给出可落地的调度决策框架，把业务需求映射到调度原语与评估指标。

## 1. 范围与术语
- 调度范围：准入控制、批处理、prefill/decode 编排、KV cache 管理、公平性与资源放置。
- SLO 类型：TTFT（首 token 延迟）、TPOT（每 token 延迟）、p95/p99、吞吐与 goodput。

## 2. 系统分层（参考架构）
1）请求入口
   - 解析元数据：模型、prompt 长度、最大输出、SLO、优先级、计费层级。
2）准入控制
   - 基于 SLO、队列深度、内存余量决定接收/延迟。
3）队列管理
   - SLO 感知排序、公平性约束、尾延迟保护。
4）批处理规划
   - 决定 batch 组成；连续/离散批处理；chunked prefill。
5）Prefill/Decode 编排
   - 决定共批与否；必要时做解耦。
6）内存/KV 管理
   - KV 分页、驱逐、抢占状态保存/恢复。
7）放置与扩缩
   - 实例放置、迁移、自动扩缩。

## 3. 核心调度信号
- 请求维度：prompt 长度、最大输出、优先级、SLO、租户层级。
- 模型维度：模型规模、KV/token、并行策略、草拟模型可用性。
- 硬件维度：显存/带宽/互联/CPU/SSD 层级。
- 运行态：队列深度、KV 占用、batch 迭代时间、speculation 接受率、抢占率。

## 4. 调度原语（可调的控制点）
- 批处理：连续批处理、chunked prefill、decode-maximal。
- 抢占：token 级 vs 请求级；CPU/SSD offload。
- 解耦：prefill/decode 分离。
- Speculation：草拟模型 + 并行验证；动态 speculative length。
- 迁移：实例间 live migration。
- 缓存：prefix/KV 复用、分页、adapter-aware paging。
- 公平：token 级计量、公平优先级。
- 成本：spot-aware 调度、多层内存 offload。

## 5. 决策矩阵（需求 -> 策略）
### 5.1 低延迟优先（TTFT/TPOT 紧 SLO）
- 推荐：小 batch、抢占、SLO 队列、speculation。
- 避免：过大 batch、带额外传输成本的过度解耦。

### 5.2 吞吐优先（离线/宽松 SLO）
- 推荐：大批连续 batching、chunked prefill、KV paging、解耦。
- 避免：高频抢占。

### 5.3 成本优先（预算敏感）
- 推荐：spot-aware、分层内存 offload、batch 合并。
- 避免：高频迁移。

### 5.4 公平性优先（多租户）
- 推荐：VTC 等 token 级公平；考虑 locality 的公平策略。
- 避免：仅 FCFS 或纯最短任务优先。

## 6. 评分表（评估指标）
### 6.1 延迟
- TTFT p50/p95/p99
- TPOT p50/p95
- 尾延迟异常值

### 6.2 吞吐与 Goodput
- Tokens/s
- Goodput = 满足 SLO 的 tokens / 总 tokens

### 6.3 资源利用
- GPU 利用率、SM 占用率
- KV cache 占用与碎片率
- CPU/SSD offload 带宽占用

### 6.4 公平与隔离
- 租户服务比
- 请求间服务差异上界

### 6.5 成本
- $/1M tokens
- 抢占对稳定性的影响

## 7. 实现接口建议（模块化）
- SchedulerCore
  - Inputs: RequestQueue, ResourceSnapshot, PolicyConfig
  - Outputs: BatchPlan, PlacementPlan, CachePlan
- QueueManager
  - Policy: SLO 感知排序、公平约束
- BatchPlanner
  - Policy: continuous batching、chunked prefill、slice-level
- MemoryManager
  - Policy: KV paging、eviction、adapter-aware pooling
- PlacementManager
  - Policy: migration、disaggregation、autoscaling
- Telemetry
  - 统一指标汇聚与告警

## 8. 论文到原语映射（示例）
- PagedAttention/vLLM -> KV 分页
- SARATHI/Sarathi-Serve -> chunked prefill
- DistServe -> prefill/decode 解耦
- ORCA -> iteration-level 调度
- SpecInfer/AdaSpec -> speculative decoding
- QLM/UELLM -> 队列管理与全局协同
- SpotServe -> 成本敏感调度

## 9. 实战调参清单
1）设定 SLO 分级（延迟/吞吐/成本）
2）选择 batch 策略（连续 vs chunked）
3）确定抢占粒度（token vs 请求）
4）确定解耦阈值（队列深度、模型规模）
5）speculation 仅在接受率稳定时开启
6）内存压力升高时启用 KV paging
7）建立公平指标并设置上限

