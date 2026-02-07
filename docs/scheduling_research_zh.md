# 调度相关论文调研笔记（中文）
日期：2026-02-05
范围：与 LLM 系统调度相关的论文和技术报告。
这里的调度定义：
1）条件计算路由（MoE 路由、专家选择、负载均衡）。
2）并行与放置（自动切分、条件计算的分布式训练）。
3）推理阶段调度（推理并行化，例如 speculative decoding）。
4）长上下文内存调度（KV cache 压缩或稀疏注意力）。

说明：Anthropic 与 OpenAI 在公开论文中与调度直接相关的内容较少。本文列出目前公开可获取且与调度相关的材料，并补充 Anthropic 的批量推理产品文档作为非论文参考。

## 执行摘要
- Google 相关论文最丰富：GShard（自动切分）、Switch Transformers（简化路由）、Expert Choice Routing（负载均衡）、GLaM（MoE 扩展）、V-MoE（自适应计算路由）、Speculative Decoding（推理加速）。
- OpenAI 公开的调度相关论文主要集中在稀疏注意力和长序列计算，代表是 Sparse Transformer。
- Anthropic 暂无明确聚焦调度的公开论文；公开材料中可见与调度相关的是 Message Batches API（非论文）。
- 国内调度相关文献包括 DeepSeekMoE 与 DeepSeek-V2（路由与 KV cache 压缩），以及 Qwen2.5、腾讯 Hunyuan-Large 的 MoE 技术报告，和字节跳动 Expert Race（路由策略）。

## 1. Google
### 1.1 Switch Transformers（2021）
调度关注点：简化 MoE 路由，降低通信与计算开销并提升稳定性。
核心要点：简化路由算法，降低通信与计算成本，提高训练稳定性。
系统启示：路由策略可以在保持质量的前提下简化，有利于生产级调度的可控性。

### 1.2 GShard（2020 或 2021）
调度关注点：条件计算的大规模自动切分与分布式训练。
核心要点：通过轻量注解与 XLA 扩展表达并行计算模式，实现自动切分并支持超大规模 MoE。
系统启示：调度层需要暴露放置与并行策略，同时隐藏复杂度。

### 1.3 Expert Choice Routing（2022）
调度关注点：负载均衡与路由策略。
核心要点：由专家选择 token，允许可变专家分配与固定桶容量，降低负载不均。
系统启示：专家侧选择可作为提升利用率与稳定性的调度原语。

### 1.4 GLaM（2021 或 2022）
调度关注点：MoE 扩展带来更低训练与推理成本。
核心要点：稀疏 MoE 在更低计算与能耗下扩展模型容量。
系统启示：稀疏激活是调度层控制计算预算的关键杠杆。

### 1.5 V-MoE（2021）
调度关注点：路由扩展实现按样本自适应计算。
核心要点：路由扩展可以对每个样本进行计算预算调整，实现性能与计算的平滑权衡。
系统启示：可以通过路由约束实现动态预算调度。

### 1.6 Speculative Decoding（2022 或 2023）
调度关注点：推理阶段并行化，减少解码时延。
核心要点：用小模型草拟多个 token，再由大模型验证，保持输出分布不变。
系统启示：调度器可为长生成任务配置草拟模型以降低延迟与成本。

## 2. OpenAI
### 2.1 Sparse Transformer（2019）
调度关注点：稀疏注意力降低长序列计算与内存负担。
核心要点：稀疏注意力将复杂度降到 O(n sqrt n)，并通过重计算节省内存，支持超长序列。
系统启示：稀疏注意力是长上下文调度的重要手段。

## 3. Anthropic
- 截止 2026-02-05，未找到明确聚焦调度的公开论文。
- 相关非论文参考：Message Batches API 提供异步批量推理。

## 4. 国内
### 4.1 DeepSeekMoE（2024）
调度关注点：专家分片与共享专家，提升专门化与利用率。
核心要点：细粒度划分专家并激活子集，同时设置共享专家，降低计算并保持性能。
系统启示：结构化专家池与共享专家可稳定路由并提升利用率。

### 4.2 DeepSeek-V2（2024）
调度关注点：KV cache 压缩与稀疏 MoE 以提升推理效率。
核心要点：MLA 压缩 KV cache，DeepSeekMoE 提供稀疏计算，并报告显著的成本与缓存下降以及吞吐提升。
系统启示：调度器应将 KV cache 视为核心资源并主动优化。

### 4.3 Qwen2.5 技术报告（2024 或 2025）
调度关注点：MoE 变体用于托管方案与长上下文。
核心要点：Qwen2.5 系列包含 MoE 变体用于托管模型。
系统启示：产品分层可以与路由与预算策略结合。

### 4.4 腾讯 Hunyuan-Large（2024）
调度关注点：MoE 模型的激活参数规模与成本控制。
核心要点：总参数 389B，激活参数 52B，长上下文能力。
系统启示：激活参数规模可作为调度预算指标。

### 4.5 字节跳动 Expert Race（2025）
调度关注点：路由策略让 token 与专家共同竞争选择候选。
核心要点：灵活路由提升专家利用率。
系统启示：竞争式路由可用于平衡质量与资源利用。

## 5. 交叉规律与系统启示
- 路由策略是调度的核心模块：Switch、Expert Choice、V-MoE 表明路由设计直接影响利用率与稳定性。
- 自动切分与放置：GShard 说明大规模 MoE 必须配合自动切分。
- 推理加速：speculative decoding 提供通用并行解码策略。
- 长上下文预算：稀疏注意力与 KV cache 压缩可降低内存压力。
- 建议在产品中暴露的调度信号：激活参数规模、路由负载均衡、KV cache 占用、草拟模型接受率。

## 6. 推荐阅读顺序
1）Switch Transformers 与 Expert Choice Routing。
2）GShard。
3）GLaM 与 V-MoE。
4）Speculative Decoding。
5）DeepSeekMoE 与 DeepSeek-V2。
6）OpenAI Sparse Transformer。

## 参考链接
- Switch Transformers: https://arxiv.org/abs/2101.03961
- GShard: https://arxiv.org/abs/2006.16668
- Expert Choice Routing: https://arxiv.org/abs/2202.09368
- GLaM: https://arxiv.org/abs/2112.06905
- V-MoE: https://arxiv.org/abs/2106.05974
- Speculative Decoding: https://arxiv.org/abs/2211.17192
- OpenAI Sparse Transformer: https://arxiv.org/abs/1904.10509
- DeepSeekMoE: https://arxiv.org/abs/2401.06066
- DeepSeek-V2: https://arxiv.org/abs/2405.04434
- Qwen2.5 技术报告: https://arxiv.org/abs/2412.15115
- Hunyuan-Large: https://arxiv.org/abs/2411.02265
- ByteDance Expert Race: https://seed.bytedance.com/en/public_papers/expert-race-a-flexible-routing-strategy-for-scaling-diffusion-transformer-with-mixture-of-experts
- Anthropic Message Batches API: https://www.anthropic.com/news/message-batches-api

## 7. 推理服务调度系统论文
### 7.1 vLLM / PagedAttention（SOSP 2023）
调度关注点：KV cache 内存管理，提升有效批量规模。
核心要点：
- KV cache 被划分为固定大小的 KV blocks，可非连续存放。
- 注意力按块计算（block attention），通过页表定位 KV blocks。
- vLLM 几乎消除 KV cache 碎片浪费，并支持请求内/跨请求共享。
系统启示：把 KV cache 当作一等调度资源；使用 block allocator + page table；在可控场景下做安全共享（如 copy-on-write）。

### 7.2 FastServe（2023）
调度关注点：token 级抢占，减少 head-of-line blocking 与尾延迟。
核心要点：
- 以 token 为粒度的抢占式调度。
- Skip-join 多级反馈队列（MLFQ）；根据输入长度选择队列。
- 通过 GPU/CPU 内存的主动 offload/upload 加速抢占。
系统启示：优先级队列 + 抢占；用 prompt 长度估计任务长度。

### 7.3 SARATHI（2023）
调度关注点：chunked-prefill + decode-maximal batching，减少 pipeline bubbles。
核心要点：
- 把 prefill 切成等大小 chunks。
- 每个 batch 用 1 个 prefill chunk + 多个 decode 组成，decode piggyback 计算。
- 批次计算更均匀，降低流水线不平衡。

### 7.4 Sarathi-Serve（2024）
调度关注点：面向连续批处理的 stall-free schedule，兼顾吞吐与延迟。
核心要点：
- chunked-prefill + stall-free scheduling，插入新请求时不中断 decodes。
- 统一 batch 形态，减少迭代不均衡与 bubbles。

### 7.5 DistServe（2024）
调度关注点：prefill 与 decode 分离部署，按阶段优化资源。
核心要点：
- prefill / decode 分配到不同 GPU，消除相互干扰。
- 按 TTFT 与 TPOT 需求分别优化，并做带宽感知的放置。
系统启示：把 prefill 和 decode 视为两个子服务独立扩缩。

### 7.6 ORCA（OSDI 2022）
调度关注点：分布式 LLM 推理的 iteration-level 调度，兼顾吞吐与请求级并行。
核心要点：
- iteration-level scheduling 在保持吞吐型批处理的同时支持灵活的请求级并行。
- selective batching 避免 padding 导致的冗余计算。
系统启示：iteration-level 调度与 selective batching 适合在商品 GPU 集群上做分布式推理服务。

### 7.7 面向 LLM 服务的公平性调度（OSDI 2024）
调度关注点：连续批处理场景的公平性。
核心要点：
- Virtual Token Counter (VTC) 跟踪连续批处理中每个请求获得的服务量。
- 调度器对请求间服务差异给出紧的上界。
系统启示：token 级计量可在连续批处理中实现公平性保证。

### 7.8 SpecInfer（ASPLOS 2024）
调度关注点：基于树结构的 speculative inference 与并行验证。
核心要点：
- 为 decoder-only LMs 引入 tree attention，实现树形 speculative decoding。
- 草稿模型生成 token tree，目标模型并行验证；接受后用 DFS 更新 KV cache。
系统启示：树形草拟能提升 speculative 深度并提高验证并行度。

### 7.9 AdaSpec（SoCC 2025，预印本）
调度关注点：面向 SLO 的 speculative decoding。
核心要点：
- 通过 adaptive drafter 动态选择 speculative length。
- 结合 confidence-prior verifier 与 SLO-aware efficiency estimator 以满足延迟 SLO。
系统启示：自适应 speculation 可在吞吐与尾延迟之间动态权衡。

### 7.10 FlexGen（ICML 2023）
调度关注点：GPU/CPU/SSD 多层存储的资源放置与 offload 调度。
核心要点：
- 将权重、attention 与 KV cache offload 到 CPU 和磁盘。
- 使用优化求解器规划计算/通信以在有限显存下最大化吞吐。
系统启示：多层内存调度可在小显存预算下运行更大模型。

### 7.11 S-LoRA（2023）
调度关注点：多 LoRA 适配器并发服务的统一内存管理。
核心要点：
- Unified Paging 将 KV cache 与 LoRA 适配器放入统一内存池，减少碎片。
- Adapter Clustering 共享相同适配器前缀请求的 KV cache 块。
系统启示：统一分页与适配器感知调度可提升多适配器并发服务能力。

### 7.12 FineInfer（EuroMLSys 2024）
调度关注点：面向并发微调与推理的 deferred continuous batching。
核心要点：
- base model multiplexing + deferred continuous batching，实现 iteration-level 的上下文切换。
- 支持并发微调与推理，并兼顾推理延迟的 SLO 约束。
系统启示：deferred continuous batching 可在不中断推理的情况下穿插微调任务。

### 7.13 Llumnix（OSDI 2024 / arXiv 2406.03243）
调度关注点：跨实例的动态重调度与在线迁移。
核心要点：
- 在多实例间进行 runtime rescheduling，提升负载均衡与隔离性。
- 通过请求状态的 live migration 实现细粒度调度。
系统启示：跨实例迁移可作为一等调度原语。

### 7.14 Slice-Level Scheduling（arXiv 2406.13511）
调度关注点：切片级调度以稳定内存/时延估计。
核心要点：
- 将最大生成长度切分为固定 slices，按 slice 逐批处理。
- 为 batch 提供更可预测的时间与内存区间。
系统启示：切片化调度有助于提升吞吐与负载均衡。

### 7.15 ELIS（arXiv 2505.09142）
调度关注点：结合应答长度预测的最短剩余时间调度。
核心要点：
- ISRTF 根据剩余 token 数优先级调度。
- 长度预测使迭代式批处理具备 SJF 行为。
系统启示：长度预测可显著缓解 head-of-line blocking。

### 7.16 Past-Future Scheduler（arXiv 2507.10150）
调度关注点：SLA 约束下的连续批处理与内存估计。
核心要点：
- 使用历史输出长度分布估计峰值内存。
- 在排队延迟与驱逐风险间权衡，提升 goodput。
系统启示：内存预测是连续批处理中提升 SLO 的关键。

### 7.17 BucketServe（arXiv 2507.17120）
调度关注点：面向异质请求的分桶动态批处理。
核心要点：
- 按序列长度分桶，降低 padding 浪费。
- 自适应分桶与优先级调度减少碎片。
系统启示：分桶策略可显著提升 GPU 利用率与 goodput。

### 7.18 SLO-Aware Scheduling（arXiv 2504.14966）
调度关注点：多 SLO 场景的优先级调度。
核心要点：
- 基于模拟退火的调度器，综合 SLO 与长度估计排序。
- 面向异构任务提升 SLO 达成率。
系统启示：显式 SLO 感知优于 FCFS。

### 7.19 TaiChi（arXiv 2508.01989）
调度关注点：统一 prefill-decode 聚合与解耦以优化 goodput。
核心要点：
- 结合 prefill-heavy 与 decode-heavy 实例的混合架构。
- 根据 TTFT/TPOT 的 SLO 权衡动态切换模式。
系统启示：聚合与解耦应随 SLO 组合自适应。

### 7.20 Aladdin（arXiv 2405.06856）
调度关注点：面向 SLO 的联合放置与资源扩缩。
核心要点：
- 预测满足 SLO 的最小资源与 worker 配置。
- 将请求放置与资源扩缩协同优化。
系统启示：集群级放置与扩缩是调度关键杠杆。

### 7.21 变长 Prefill/Decode 的 LLM Serving 优化（arXiv 2508.06133）
调度关注点：变长 prefill/decode 与 KV 约束下的调度建模。
核心要点：
- 建模解码阶段 KV 内存随时间增长。
- 提出具备竞争比保证的调度算法。
系统启示：调度策略必须考虑解码导致的内存增长。

### 7.22 KV Cache 约束下的在线调度（arXiv 2502.07115）
调度关注点：KV 约束下的在线批处理/调度。
核心要点：
- 给出理论最优基准与在线算法。
- 在一定条件下可达到常数竞争比。
系统启示：理论界限可指导工程调度策略设计。

### 7.23 消费级 GPU 的分布式 LLM Serving（EMNLP Findings 2025）
调度关注点：通信感知的分布式调度。
核心要点：
- 设计 prefill 与 decode 的传输调度，缓解通信不均衡。
- 通过分块传输控制 prefill 的发送粒度。
系统启示：分布式场景需把通信调度纳入系统策略。

### 7.24 QLM（面向 SLO 的 LLM Serving 队列管理，SoCC 2024）
调度关注点：在线队列管理以提升 SLO 达成率并降低尾延迟。
核心要点：
- LLM serving 的排队动态独特（如连续批处理的 head-of-line blocking）。
- QLM 通过改进队列调度，降低响应时间异常值且开销较低。
系统启示：SLO 驱动的队列管理应作为一等调度策略。

### 7.25 UELLM（arXiv 2409.14961）
调度关注点：统一高效的 LLM 推理服务系统。
核心要点：
- 集成 resource profiler、batch scheduler 与 system deployer。
- 通过系统级协同优化吞吐与延迟。
系统启示：跨 profiling、batching、deployment 的端到端协同能显著改善调度效果。

### 7.26 Locality-Aware Fair Scheduling（arXiv 2501.14312）
调度关注点：考虑数据局部性的公平性调度。
核心要点：
- 提出兼顾公平与性能的 locality-aware 策略。
- 引入 DLPM/D2LPM 以处理 locality 约束下的 token 调度。
系统启示：公平性调度必须考虑局部性，否则会带来吞吐损失。

### 7.27 SpotServe（arXiv 2311.15566）
调度关注点：面向 spot（可抢占）实例的成本敏感调度。
核心要点：
- 利用 spot 实例降低成本，同时满足延迟 SLO。
- 调度设计需考虑抢占风险与尾延迟。
系统启示：成本优化必须引入抢占风险模型。

## 8. 算法与实现细节深挖（精选）
### 8.1 Switch Transformers（路由简化）
- Router logits = X W；router_probs = softmax(logits)。
- 每个 token 选择 top-1 expert（expert_gate, expert_index）。
- 基于 router_probs 与 expert_mask 的辅助负载均衡损失，避免路由塌缩。
- 每个 expert 有固定 capacity，超出的 token 会被丢弃或延期。
实现要点：top-1 降低通信，但需要平衡损失与 capacity factor 的细致调参。

### 8.2 Expert Choice Routing（负载均衡路由）
- expert 选 token：每个 expert 选择 top-k tokens；token 可被多个 expert 选中。
- 容量公式：k = ceil(C * T / E)，其中 C 为 capacity factor，T 为 batch token 数，E 为专家数。
- 天然负载均衡，避免额外的 balance loss。
实现要点：小 batch 自回归推理不易发挥优势，需要额外 batching 策略。

### 8.3 GShard（自动切分）
- 通过对关键张量标注 sharding 策略，XLA 编译器自动分区。
- 采用 SPMD 风格分区，避免图结构膨胀；模型定义与切分策略解耦。
实现要点：适合超大 MoE；把切分/放置当作编译问题处理。

### 8.4 Speculative Decoding（推理调度）
- 草稿模型先生成 K 个候选 token；大模型并行验证。
- 接受最长匹配前缀；采样分布保持不变。
- 加速取决于接受率与草稿/目标模型的成本比。
实现要点：调度器需要选择 K（lookahead）以平衡浪费与延迟。

### 8.5 Sparse Transformer（长上下文调度）
- 因式分解的稀疏注意力降低二次复杂度。
- 通过 attention 复计算节省内存，支持超长序列。
实现要点：根据上下文长度与显存预算选择稀疏模式。

### 8.6 PagedAttention / vLLM（KV cache 分页）
- KV cache 划分为固定大小 blocks（block size B），可非连续存储。
- 注意力按块计算，通过页表定位 KV blocks。
实现要点：block allocator + page table；可跨请求共享 KV blocks 以复用前缀。

### 8.7 FastServe（抢占式推理）
- Skip-join MLFQ：任务按输入长度进入队列；跳过高优先级队列以减少降级。
- token 级抢占显著减少 head-of-line blocking。
实现要点：需要快速保存/恢复 KV 状态，必要时使用主机内存 offload。

### 8.8 SARATHI / Sarathi-Serve（chunked prefill 调度）
- chunked-prefill 把长 prefill 切成等大小 chunks。
- SARATHI 使用 decode-maximal batches；Sarathi-Serve 使用 stall-free schedule。
实现要点：chunk size 决定 TTFT 与吞吐的折中。

### 8.9 DistServe（prefill/decode 分离）
- prefill 与 decode 分开部署，按阶段分别优化 TTFT 与 TPOT。
- 带宽感知放置减少跨 GPU 传输开销。
实现要点：明确的阶段化 pipeline；独立扩缩资源。

### 8.10 DeepSeekMoE（国内 MoE 路由）
- 细粒度专家切分 + 共享专家，提升专门化并降低冗余。
- 引入 device-level balance loss，平衡设备间计算负载。
实现要点：共享专家稳定路由；设备级平衡比严格专家级更实用。

### 8.11 DeepSeek-V2（国内 KV 优化）
- Multi-head Latent Attention (MLA) 压缩 KV cache 到 latent 向量。
- 采用 DeepSeekMoE；236B 总参数、21B 激活参数；128K 上下文。
实现要点：KV cache 是调度资源；压缩可提升 batch size 与吞吐。

### 8.12 ORCA（iteration-level 调度）
- iteration-level scheduling 保持吞吐型批处理，同时支持请求级并行。
- selective batching 减少 padding 冗余计算。
实现要点：iteration-level 调度是分布式推理集群中的关键调度原语。

### 8.13 公平性调度（VTC）
- Virtual Token Counter (VTC) 统计连续批处理中每个请求获得的服务量。
- 调度器给出请求间服务差异的 2x 紧上界。
实现要点：将 VTC 融入连续批处理循环可获得公平性保证。

### 8.14 SpecInfer（树形 speculative decoding）
- tree attention 让 decoder-only LMs 能够关注草稿 token tree。
- token tree 可在一次前向中生成；验证过程并行进行。
- 接受后使用 DFS 更新 KV cache。
实现要点：树形草拟在提高接受率的同时会增加内存开销。

### 8.15 AdaSpec（SLO-aware speculation）
- adaptive drafter 动态选择 speculative length。
- confidence-prior verifier 与 SLO-aware efficiency estimator 指导接受与延迟目标。
实现要点：根据 SLO 约束动态调整 speculative 深度。

### 8.16 FlexGen（多层内存调度）
- 权重、attention 与 KV cache offload 到 CPU 与磁盘，配合异步 I/O。
- 通过优化求解器规划计算与通信以提升吞吐。
实现要点：把内存层级视为可调度资源。

### 8.17 S-LoRA（统一分页）
- Unified Paging 将 KV cache 与 LoRA 适配器合并进统一内存池。
- Adapter Clustering 共享相同适配器前缀请求的 KV cache 块。
实现要点：适配器感知分页有助于降低碎片并提高并发。

## 9. 新增参考链接
- vLLM / PagedAttention (SOSP 2023): https://arxiv.org/pdf/2309.06180.pdf
- FastServe: https://arxiv.org/pdf/2305.05920.pdf
- DistServe: https://arxiv.org/pdf/2401.09670.pdf
- SARATHI (chunked prefill): https://www.microsoft.com/en-us/research/publication/sarathi-efficient-llm-inference-by-piggybacking-decodes-with-chunked-prefills/
- Sarathi-Serve: https://www.microsoft.com/en-us/research/publication/taming-throughput-latency-tradeoff-in-llm-inference-with-sarathi-serve/
- Switch Transformers: https://arxiv.org/abs/2101.03961
- Expert Choice Routing: https://arxiv.org/abs/2202.09368
- GShard: https://arxiv.org/abs/2006.16668
- Speculative Decoding: https://arxiv.org/abs/2211.17192
- Sparse Transformer: https://arxiv.org/abs/1904.10509
- DeepSeekMoE: https://arxiv.org/abs/2401.06066
- DeepSeek-V2: https://arxiv.org/abs/2405.04434
- ORCA（OSDI 2022）: https://www.usenix.org/conference/osdi22/presentation/yu
- 面向 LLM 服务的公平性调度（OSDI 2024）: https://www.usenix.org/conference/osdi24/presentation/zhong
- SpecInfer（ASPLOS 2024）: https://arxiv.org/pdf/2305.09781.pdf
- AdaSpec（SoCC 2025 预印本）: https://arxiv.org/pdf/2503.05096
- FlexGen（ICML 2023）: https://proceedings.mlr.press/v202/chen23e.html
- S-LoRA（2023）: https://arxiv.org/pdf/2311.03285.pdf
- FineInfer（EuroMLSys 2024）: https://www.research-collection.ethz.ch/entities/publication/f3551dc7-d718-4b5d-becf-be1b6b631910
- Llumnix: https://arxiv.org/abs/2406.03243
- Slice-Level Scheduling: https://arxiv.org/abs/2406.13511
- ELIS: https://arxiv.org/abs/2505.09142
- Past-Future Scheduler: https://arxiv.org/abs/2507.10150
- BucketServe: https://arxiv.org/abs/2507.17120
- SLO-Aware Scheduling: https://arxiv.org/abs/2504.14966
- TaiChi: https://arxiv.org/abs/2508.01989
- Aladdin: https://arxiv.org/abs/2405.06856
- 变长 Prefill/Decode LLM Serving 优化: https://arxiv.org/abs/2508.06133
- KV Cache 约束下的在线调度: https://arxiv.org/abs/2502.07115
- 消费级 GPU 分布式 LLM Serving（EMNLP Findings 2025）: https://aclanthology.org/2025.findings-emnlp.957/
- QLM（SoCC 2024）: https://arxiv.org/abs/2407.00047
- UELLM: https://arxiv.org/abs/2409.14961
- Locality-Aware Fair Scheduling: https://arxiv.org/abs/2501.14312
- SpotServe: https://arxiv.org/abs/2311.15566

## 10. 新增阅读论文（第 4 批）
### 10.1 Splitwise（arXiv 2311.18677）
调度关注点：将 prompt 计算与 token 生成进行阶段拆分。
核心要点：
- 将 prefill（算力密集）与 decode（内存密集）部署在不同机器。
- 优化跨阶段状态传输与高速互联利用。
系统启示：按阶段匹配硬件可提升吞吐与成本效率。

### 10.2 Inference without Interference（arXiv 2401.11181）
调度关注点：混合负载下的解耦推理服务。
核心要点：
- 解耦不同服务阶段，降低负载相互干扰。
- 提升异构请求间的隔离性。
系统启示：解耦策略可显著提升生产环境稳定性。

### 10.3 Mooncake（arXiv 2407.00079）
调度关注点：以 KVCache 为中心的解耦架构。
核心要点：
- 将 KV cache 作为系统架构中心。
- 支持计算路径与 KV 服务路径分离。
系统启示：显式 KV 服务化有利于扩缩与调度灵活性。

### 10.4 CachedAttention for Multi-turn Serving（arXiv 2403.19708）
调度关注点：多轮对话场景下的 cache 感知优化。
核心要点：
- 复用多轮会话中的注意力缓存状态。
- 面向长对话降低服务成本。
系统启示：跨轮缓存复用策略是聊天场景的重要调度杠杆。

### 10.5 P/D-Serve（arXiv 2408.08147）
调度关注点：大规模解耦推理服务。
核心要点：
- 通过 prefill/decode 解耦实现阶段扩展。
- 强调集群级部署实践。
系统启示：大规模解耦必须与带宽感知调度配合。

### 10.6 HeteGen（arXiv 2403.01164）
调度关注点：资源受限场景下的异构并行推理。
核心要点：
- 让异构设备协同完成 LLM 推理。
- 聚焦资源受限部署场景。
系统启示：异构设备调度可扩大可部署范围。

### 10.7 Efficient Streaming LMs with Attention Sinks（arXiv 2309.17453）
调度关注点：长流式推理的内存管理。
核心要点：
- 通过 attention sinks 稳定受限上下文下的流式生成。
- 在有界内存下支持更长会话。
系统启示：结构化缓存保留策略可提升流式稳定性。

### 10.8 H2O（arXiv 2306.14048）
调度关注点：基于 heavy-hitter 的 KV 保留策略。
核心要点：
- 优先保留高重要度 token 的 KV。
- 在生成过程中驱逐低重要度 KV。
系统启示：重要度感知驱逐可优化内存-延迟权衡。

### 10.9 Scissorhands（arXiv 2305.17118）
调度关注点：测试时 KV cache 压缩。
核心要点：
- 利用重要度持久性进行 KV 剪枝。
- 在较小质量损失下压缩 KV。
系统启示：实用 KV 压缩可提升有效 batch 容量。

### 10.10 KIVI（arXiv 2402.02750）
调度关注点：服务场景下的 KV 量化。
核心要点：
- 免调参的非对称 2-bit KV 量化。
- 降低长输出场景下 KV 内存占用。
系统启示：KV 量化是提升并发的直接手段。

### 10.11 SnapKV（arXiv 2404.14469）
调度关注点：生成前的选择性 KV 保留。
核心要点：
- 提前识别并保留可能关键的上下文。
- 减少不必要的 KV 存储成本。
系统启示：KV 预筛选可提升长 prompt 下内存效率。

### 10.12 Punica（arXiv 2310.18547）
调度关注点：多租户 LoRA 服务。
核心要点：
- 优化共享 base model 上的大量 LoRA 适配器服务。
- 提升适配器密集场景吞吐。
系统启示：adapter 感知 batch 与内存管理是 SaaS 场景关键。

### 10.13 Medusa（arXiv 2401.10774）
调度关注点：无需独立草稿模型的 speculative 风格加速。
核心要点：
- 增加多解码头预测未来 token。
- 结合树状验证并行接受。
系统启示：辅助解码头是双模型 speculation 的可部署替代。

### 10.14 EAGLE（arXiv 2401.15077）
调度关注点：特征级 speculative sampling。
核心要点：
- 以次顶层特征预测重构 speculative 过程。
- 针对特征不确定性优化加速质量。
系统启示：特征级预测可提升接受率与加速收益。

### 10.15 Recurrent Drafter（arXiv 2403.09919）
调度关注点：高效草稿生成器。
核心要点：
- 用 recurrent drafter 生成候选 token 供快速验证。
- 相比完整草稿模型降低额外开销。
系统启示：轻量草稿器能改善 speculation 的成本/性能。

### 10.16 Lookahead Decoding（arXiv 2402.02057）
调度关注点：打破解码串行依赖。
核心要点：
- 用 lookahead 机制提前规划未来 token 并并行校验。
- 在自回归约束下降低解码延迟。
系统启示：lookahead 规划是实用的解码加速原语。

## 11. 新增参考链接（第 4 批）
- Splitwise: https://arxiv.org/abs/2311.18677
- Inference without Interference: https://arxiv.org/abs/2401.11181
- Mooncake: https://arxiv.org/abs/2407.00079
- CachedAttention for Multi-turn Serving: https://arxiv.org/abs/2403.19708
- P/D-Serve: https://arxiv.org/abs/2408.08147
- HeteGen: https://arxiv.org/abs/2403.01164
- Efficient Streaming LMs with Attention Sinks: https://arxiv.org/abs/2309.17453
- H2O: https://arxiv.org/abs/2306.14048
- Scissorhands: https://arxiv.org/abs/2305.17118
- KIVI: https://arxiv.org/abs/2402.02750
- SnapKV: https://arxiv.org/abs/2404.14469
- Punica: https://arxiv.org/abs/2310.18547
- Medusa: https://arxiv.org/abs/2401.10774
- EAGLE: https://arxiv.org/abs/2401.15077
- Recurrent Drafter: https://arxiv.org/abs/2403.09919
- Lookahead Decoding: https://arxiv.org/abs/2402.02057

