# LLM 调度深挖（20 篇论文，中文）
日期：2026-02-05
范围：20 篇核心论文，覆盖路由、推理服务与调度系统。

## 0. 阅读说明
- “机制”强调调度原语。
- “实现要点”给出工程落地提示。
- “系统启示”用于指导生产调度策略。

---

## 1. Switch Transformers（2021）— 简化 MoE 路由
来源：arXiv 2101.03961
- 问题：MoE 路由不稳定且通信开销大。
- 机制：简化路由（每 token 选一个 expert）+ 负载均衡损失。
- 调度原语：路由策略作为一等调度模块。
- 实现要点：capacity factor 与 balance loss 影响稳定性。
- 系统启示：可预测路由降低尾延迟与计算波动。

## 2. GShard（2020）— 条件计算自动切分
来源：arXiv 2006.16668
- 问题：超大 MoE 的切分/放置成本高。
- 机制：基于 XLA 的注解式自动切分（SPMD）。
- 调度原语：放置与切分作为编译期调度。
- 实现要点：模型定义与切分策略解耦。
- 系统启示：切分策略可成为调度配置的核心参数。

## 3. Expert Choice Routing（2022）— 负载均衡路由
来源：arXiv 2202.09368
- 问题：token 选 expert 易导致负载不均。
- 机制：expert 选 token 的路由策略。
- 调度原语：expert 侧选择实现更好的负载均衡。
- 实现要点：每个 expert 的容量上限可控。
- 系统启示：更高利用率可降低同质量成本。

## 4. V-MoE（2021）— 自适应计算路由
来源：arXiv 2106.05974
- 问题：对所有样本使用相同计算预算效率低。
- 机制：稀疏路由实现按样本自适应计算。
- 调度原语：条件计算作为按请求预算的策略。
- 实现要点：router 校准决定性能/成本权衡。
- 系统启示：可与多级 SLO 对齐进行动态预算。

## 5. Sparse Transformer（2019）— 长上下文调度
来源：arXiv 1904.10509
- 问题：注意力二次复杂度限制长序列。
- 机制：稀疏注意力分解，降低计算/内存。
- 调度原语：通过稀疏模式选择进行内存预算。
- 实现要点：稀疏模式需与实际上下文需求匹配。
- 系统启示：长上下文能力取决于注意力调度策略。

## 6. Speculative Decoding（2022）— 并行解码
来源：arXiv 2211.17192
- 问题：自回归解码串行、吞吐低。
- 机制：草拟模型生成候选，目标模型并行验证。
- 调度原语：草拟/验证流水线。
- 实现要点：speculative length 决定延迟与浪费。
- 系统启示：接受率稳定时适合启用。

## 7. vLLM / PagedAttention（2023）— KV cache 分页
来源：arXiv 2309.06180
- 问题：KV cache 碎片限制并发。
- 机制：分页式 KV blocks + 页表访问。
- 调度原语：KV cache 作为分页资源。
- 实现要点：block allocator + copy-on-write 支持共享。
- 系统启示：在高内存压力下显著提升并发。

## 8. FastServe（2023）— token 级抢占
来源：arXiv 2305.05920
- 问题：head-of-line blocking 抬高尾延迟。
- 机制：token 级抢占 + 多级反馈队列。
- 调度原语：抢占式调度与长度优先级。
- 实现要点：KV 状态快速保存/恢复。
- 系统启示：改善尾延迟但增加状态迁移成本。

## 9. SARATHI（2023）— Chunked Prefill
来源：arXiv 2308.16369
- 问题：prefill 阻塞 decode 导致吞吐下降。
- 机制：prefill 切片 + decode piggyback。
- 调度原语：chunked prefill 调度。
- 实现要点：chunk 大小影响 TTFT/吞吐折中。
- 系统启示：稳定迭代时间并提升 goodput。

## 10. Sarathi-Serve（2024）— Stall-Free 连续批处理
来源：MSR 论文页
- 问题：连续批处理在插入新请求时产生 stall。
- 机制：stall-free scheduling + chunked prefill。
- 调度原语：无停顿 batch 形成策略。
- 实现要点：统一迭代形态减少 bubbles。
- 系统启示：在稳态负载下平衡延迟与吞吐。

## 11. DistServe（2024）— Prefill/Decode 解耦
来源：arXiv 2401.09670
- 问题：prefill 与 decode 资源争用。
- 机制：将 prefill 与 decode 分配到不同 GPU 池。
- 调度原语：阶段化放置与扩缩。
- 实现要点：跨池带宽与传输调度至关重要。
- 系统启示：可以按阶段独立扩缩以满足 SLO。

## 12. ORCA（OSDI 2022）— 迭代级调度
来源：USENIX OSDI 2022
- 问题：静态 batch 造成 padding 浪费。
- 机制：iteration-level 调度 + selective batching。
- 调度原语：迭代级 re-batching。
- 实现要点：适合分布式集群。
- 系统启示：在吞吐提升下保持较小延迟代价。

## 13. LLM 服务公平性（OSDI 2024）— VTC
来源：USENIX OSDI 2024
- 问题：连续批处理导致请求被饿死。
- 机制：Virtual Token Counter 计量服务量并保证公平。
- 调度原语：token 级公平计量。
- 实现要点：在调度循环中维护每请求 token credit。
- 系统启示：公平性可与高利用率共存。

## 14. SpecInfer（ASPLOS 2024）— 树形 Speculation
来源：arXiv 2305.09781
- 问题：线性 speculative decoding 并行度有限。
- 机制：token tree + tree attention；并行验证。
- 调度原语：树形草拟调度。
- 实现要点：DFS 更新 KV cache；内存开销更大。
- 系统启示：在高内存预算下提升吞吐。

## 15. AdaSpec（SoCC 2025）— SLO 感知 Speculation
来源：arXiv 2503.05096
- 问题：固定 speculative 长度会影响 SLO。
- 机制：adaptive drafter + SLO-aware estimator。
- 调度原语：动态 speculative 深度。
- 实现要点：根据接受率与延迟预算动态调整。
- 系统启示：适合多 SLO 混合业务。

## 16. FlexGen（ICML 2023）— 分层内存调度
来源：PMLR ICML 2023
- 问题：显存不足导致大模型无法推理。
- 机制：权重/激活/KV offload 到 CPU/SSD。
- 调度原语：多层内存放置与传输调度。
- 实现要点：使用成本模型规划数据迁移。
- 系统启示：小显存也能部署大模型。

## 17. S-LoRA（2023）— 统一分页
来源：arXiv 2311.03285
- 问题：多 LoRA 并发造成 KV 碎片。
- 机制：KV cache + adapter 统一分页，adapter clustering。
- 调度原语：adapter 感知分页与共享。
- 实现要点：按 adapter 前缀聚类请求。
- 系统启示：提升多租户适配器并发能力。

## 18. Llumnix（2024）— 在线迁移
来源：arXiv 2406.03243
- 问题：固定放置导致尾延迟与隔离性差。
- 机制：请求状态 live migration。
- 调度原语：跨实例重调度。
- 实现要点：迁移过程中最小化中断。
- 系统启示：提升多租户集群利用率。

## 19. FineInfer（EuroMLSys 2024）— 微调/推理共存
来源：EuroMLSys 2024
- 问题：微调与推理资源争抢。
- 机制：deferred continuous batching + base model multiplexing。
- 调度原语：迭代级上下文切换。
- 实现要点：在吞吐与延迟间权衡。
- 系统启示：支持混合负载而不破坏 SLO。

## 20. Slice-Level Scheduling（2024）— 可预测批处理
来源：arXiv 2406.13511
- 问题：请求长度异质导致内存/延迟波动。
- 机制：固定 slices 分段服务。
- 调度原语：slice 级批处理。
- 实现要点：slice 大小决定稳定性与开销。
- 系统启示：适合波动性大场景。

---

## 参考链接
- Switch Transformers: https://arxiv.org/abs/2101.03961
- GShard: https://arxiv.org/abs/2006.16668
- Expert Choice Routing: https://arxiv.org/abs/2202.09368
- V-MoE: https://arxiv.org/abs/2106.05974
- Sparse Transformer: https://arxiv.org/abs/1904.10509
- Speculative Decoding: https://arxiv.org/abs/2211.17192
- vLLM / PagedAttention: https://arxiv.org/abs/2309.06180
- FastServe: https://arxiv.org/abs/2305.05920
- SARATHI: https://arxiv.org/abs/2308.16369
- Sarathi-Serve: https://www.microsoft.com/en-us/research/publication/taming-throughput-latency-tradeoff-in-llm-inference-with-sarathi-serve/
- DistServe: https://arxiv.org/abs/2401.09670
- ORCA: https://www.usenix.org/conference/osdi22/presentation/yu
- Fairness in Serving LLMs: https://www.usenix.org/conference/osdi24/presentation/sheng
- SpecInfer: https://arxiv.org/abs/2305.09781
- AdaSpec: https://arxiv.org/abs/2503.05096
- FlexGen: https://proceedings.mlr.press/v202/chen23v.html
- S-LoRA: https://arxiv.org/abs/2311.03285
- Llumnix: https://arxiv.org/abs/2406.03243
- FineInfer: https://www.research-collection.ethz.ch/entities/publication/f3551dc7-d718-4b5d-becf-be1b6b631910
- Slice-Level Scheduling: https://arxiv.org/abs/2406.13511
