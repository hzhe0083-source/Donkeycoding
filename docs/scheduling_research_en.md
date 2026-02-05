# Scheduling Research Notes (EN)
Date: 2026-02-05
Scope: papers and official technical reports that relate to scheduling in LLM systems.
Definition of scheduling used here:
1) Conditional computation routing (MoE gating, expert choice, load balancing).
2) Parallelism and placement (automatic sharding, conditional compute at scale).
3) Inference time scheduling (speculative decoding and other parallel decode strategies).
4) Memory scheduling for long context (KV cache compression or sparse attention).

Note: Public scheduling focused papers from Anthropic and OpenAI are limited. This report lists what is public and relevant as of the date above; it also includes one Anthropic product document on batch inference as non paper context.

## Executive Summary
- Google has the richest scheduling literature: GShard (automatic sharding), Switch Transformers (simplified MoE routing), Expert Choice Routing (load balancing), GLaM (MoE scaling), V-MoE (routing for adaptive compute), and Speculative Decoding (inference acceleration).
- OpenAI scheduling related papers are mostly about sparse attention and efficient long sequence computation, especially Sparse Transformer.
- Anthropic has no clearly scheduling focused public papers; the only scheduling relevant public material located is the Message Batches API announcement (not a paper).
- Domestic literature with explicit scheduling relevance includes DeepSeekMoE and DeepSeek-V2 (routing plus KV cache compression), plus MoE technical reports from Qwen2.5 and Tencent Hunyuan-Large, and ByteDance Expert Race (routing strategy).

## 1. Google
### 1.1 Switch Transformers (2021)
Scheduling focus: simplified MoE routing to reduce communication and compute cost and improve stability.
Key ideas from abstract: Switch Transformer simplifies routing, reduces communication and compute cost, and improves training stability for large sparse models.
System takeaways: a router policy can be simplified while preserving quality, which is useful for a production scheduler that needs predictable behavior.

### 1.2 GShard (2020 or 2021)
Scheduling focus: automatic sharding for conditional computation and large scale distributed training.
Key ideas: lightweight annotation APIs and an XLA extension to express parallel computation patterns; enables very large MoE models with automatic sharding.
System takeaways: a scheduling layer should expose placement and parallelism policies while hiding complexity behind simple annotations.

### 1.3 Mixture of Experts with Expert Choice Routing (2022)
Scheduling focus: load balancing and routing policy.
Key ideas: experts select tokens instead of tokens selecting experts, enabling variable expert assignment and fixed bucket sizes to reduce load imbalance.
System takeaways: expert side selection is a scheduling primitive that can improve utilization and stability.

### 1.4 GLaM (2021 or 2022)
Scheduling focus: MoE scaling to reduce training and inference cost while increasing capacity.
Key ideas: MoE architecture scales capacity with lower training energy and lower inference compute than dense models.
System takeaways: a scheduler can target sparse activation as a core lever for capacity without proportional compute.

### 1.5 V-MoE (2021)
Scheduling focus: routing extension that prioritizes subsets of each input across the batch to trade off compute and quality.
Key ideas: routing extension enables adaptive per example compute and smooth performance compute tradeoffs.
System takeaways: dynamic per request compute budgeting is feasible via router constraints.

### 1.6 Speculative Decoding (2022 or 2023)
Scheduling focus: inference time parallelism by drafting tokens with a small model and verifying with a large model.
Key ideas: speculative decoding generates multiple tokens in parallel without changing the output distribution.
System takeaways: a scheduler can attach a draft model to reduce latency and cost on long generations.

## 2. OpenAI
### 2.1 Sparse Transformer (2019)
Scheduling focus: sparse attention reduces compute and memory for long sequences.
Key ideas: sparse factorizations reduce attention cost to O(n sqrt n); recomputation saves memory; enables very long sequences.
System takeaways: attention sparsity is a scheduling lever for long context workloads.

## 3. Anthropic
- No public scheduling focused papers identified as of 2026-02-05.
- Related non paper context: Message Batches API provides asynchronous batch inference.

## 4. China or Domestic
### 4.1 DeepSeekMoE (2024)
Scheduling focus: expert segmentation and shared experts to improve specialization and reduce compute.
Key ideas: segment experts and activate subsets; isolate shared experts; improves performance at lower compute compared with baselines.
System takeaways: structured expert pools and shared experts can stabilize routing and improve utilization.

### 4.2 DeepSeek-V2 (2024)
Scheduling focus: inference efficiency via KV cache compression and sparse MoE.
Key ideas: MLA compresses KV cache for efficient inference; DeepSeekMoE provides economical sparse compute; reports large training cost and KV cache reductions and throughput gains.
System takeaways: a scheduler can treat KV cache as a first class resource and select architectures that reduce cache pressure.

### 4.3 Qwen2.5 Technical Report (2024 or 2025)
Scheduling focus: MoE variants for hosted models and long context.
Key ideas: MoE variants are part of the Qwen2.5 series for hosted solutions.
System takeaways: product tiering can align with model routing and budget policy.

### 4.4 Hunyuan-Large (Tencent, 2024)
Scheduling focus: MoE scale and active parameter count for cost control.
Key ideas: 389B total parameters, 52B activated parameters, long context length.
System takeaways: activated parameter count is a useful scheduling metric for budget aware routing.

### 4.5 ByteDance Expert Race (2025)
Scheduling focus: routing strategy that lets tokens and experts compete to choose top candidates.
Key ideas: flexible routing improves expert utilization in MoE diffusion transformers.
System takeaways: competitive routing mechanisms can be adapted to balance quality and utilization.

## 5. Cross cutting scheduling patterns and implications for your system
- Router policy as a first class module: Switch, Expert Choice, and V-MoE show that routing design strongly affects compute utilization and stability.
- Sharding and placement layer: GShard shows automatic sharding is essential for very large MoE systems.
- Inference acceleration path: speculative decoding offers a general strategy to parallelize decoding without changing output distribution.
- Long context budgeting: sparse attention and KV cache compression reduce memory pressure and allow longer contexts at fixed hardware.
- Scheduling signals to expose in your product: active parameter count, router load balance, KV cache footprint, and draft model acceptance rate.

## 6. Suggested reading order
1) Switch Transformers and Expert Choice Routing for routing fundamentals.
2) GShard for sharding and large scale conditional compute.
3) GLaM and V-MoE for scaling and adaptive compute.
4) Speculative Decoding for inference scheduling.
5) DeepSeekMoE and DeepSeek-V2 for domestic MoE and KV cache efficiency.
6) OpenAI Sparse Transformer for sparse attention and long sequence scheduling.

## References (links)
- Switch Transformers: https://arxiv.org/abs/2101.03961
- GShard: https://arxiv.org/abs/2006.16668
- Expert Choice Routing: https://arxiv.org/abs/2202.09368
- GLaM: https://arxiv.org/abs/2112.06905
- V-MoE: https://arxiv.org/abs/2106.05974
- Speculative Decoding: https://arxiv.org/abs/2211.17192
- OpenAI Sparse Transformer: https://arxiv.org/abs/1904.10509
- DeepSeekMoE: https://arxiv.org/abs/2401.06066
- DeepSeek-V2: https://arxiv.org/abs/2405.04434
- Qwen2.5 Technical Report: https://arxiv.org/abs/2412.15115
- Hunyuan-Large: https://arxiv.org/abs/2411.02265
- ByteDance Expert Race: https://seed.bytedance.com/en/public_papers/expert-race-a-flexible-routing-strategy-for-scaling-diffusion-transformer-with-mixture-of-experts
- Anthropic Message Batches API: https://www.anthropic.com/news/message-batches-api

## 7. Inference-serving scheduling systems (papers)
### 7.1 vLLM / PagedAttention (SOSP 2023)
Scheduling focus: KV cache memory management to unlock larger effective batches.
Key ideas:
- KV cache is partitioned into fixed-size KV blocks and stored non-contiguously.
- Attention is computed block-wise (block attention) while fetching blocks via a page table.
- vLLM achieves near-zero KV cache waste and enables flexible sharing within and across requests.
System takeaways: treat KV cache as a first-class schedulable resource; use a block allocator + page table; enable safe sharing (e.g., copy-on-write) where possible.

### 7.2 FastServe (2023)
Scheduling focus: token-level preemption to reduce head-of-line blocking and tail latency.
Key ideas:
- Preemptive scheduling at per-token granularity.
- Skip-join multi-level feedback queue (MLFQ) scheduler; queue chosen from input length.
- Proactive GPU memory offload/upload of intermediate state for fast preemption.
System takeaways: combine preemption with priority queues; estimate job length from prompt length.

### 7.3 SARATHI (2023)
Scheduling focus: chunked-prefill + decode-maximal batching to reduce pipeline bubbles.
Key ideas:
- Split prefill into equal chunks.
- Batch one prefill chunk with many decodes so decodes piggyback the compute-bound prefill.
- Uniform compute per batch reduces pipeline imbalance.

### 7.4 Sarathi-Serve (2024)
Scheduling focus: stall-free schedules for continuous batching under latency SLOs.
Key ideas:
- Chunked-prefills with stall-free scheduling to insert new requests without pausing decodes.
- Uniform batches minimize iteration imbalance and pipeline bubbles.

### 7.5 DistServe (2024)
Scheduling focus: disaggregate prefill and decode across GPUs and co-opt resources per phase.
Key ideas:
- Separate prefill/decode to remove interference.
- Optimize TTFT and TPOT per phase with bandwidth-aware placement.
System takeaways: treat prefill and decode as distinct services; scale each independently.

### 7.6 ORCA (OSDI 2022)
Scheduling focus: iteration-level scheduling for distributed LLM serving with flexible per-request parallelism.
Key ideas:
- Iteration-level scheduling maintains throughput-oriented batching while supporting flexible per-request parallelism.
- Selective batching avoids redundant computation from padding.
System takeaways: iteration-level scheduling and selective batching are useful for distributed serving on commodity GPU clusters.

### 7.7 Fairness in Serving Large Language Models (OSDI 2024)
Scheduling focus: fairness in continuous batching.
Key ideas:
- Virtual Token Counter (VTC) tracks service received by requests in continuous batching.
- Scheduler provides a tight bound on service difference between requests.
System takeaways: token-level accounting can provide fairness guarantees without sacrificing continuous batching.

### 7.8 SpecInfer (ASPLOS 2024)
Scheduling focus: speculative inference with tree-based decoding and parallel verification.
Key ideas:
- Introduces tree-based speculative decoding with tree attention for decoder-only LMs.
- Draft model builds a token tree; target model verifies in parallel; DFS update for KV cache after acceptance.
System takeaways: tree-structured drafting increases speculative depth and improves verification parallelism.

### 7.9 AdaSpec (SoCC 2025, preprint)
Scheduling focus: SLO-aware speculative decoding for LLM serving.
Key ideas:
- Adaptive drafter with dynamic speculative length.
- Confidence-prior verifier and SLO-aware efficiency estimator to meet latency SLOs.
System takeaways: adaptive speculation can trade off throughput and tail latency under SLO constraints.

### 7.10 FlexGen (ICML 2023)
Scheduling focus: resource-aware placement/offload across GPU/CPU/SSD for LLM inference.
Key ideas:
- Offloads weights, attention, and KV cache to CPU and disk.
- Uses an optimization solver to plan computation/communication and maximize throughput on limited GPU memory.
System takeaways: tiered-memory scheduling enables large models on small GPU budgets.

### 7.11 S-LoRA (2023)
Scheduling focus: serving many LoRA adapters with unified memory management.
Key ideas:
- Unified Paging puts KV cache and LoRA adapters into a single memory pool to reduce fragmentation.
- Adapter Clustering shares KV cache blocks for requests with the same adapter prefix.
System takeaways: unified paging and adapter-aware scheduling improve concurrent adapter serving.

### 7.12 FineInfer (EuroMLSys 2024)
Scheduling focus: deferred continuous batching for concurrent fine-tuning and inference.
Key ideas:
- Base model multiplexing plus deferred continuous batching enables iteration-level context switches.
- Supports concurrent fine-tuning and inference while keeping inference latency within SLO constraints.
System takeaways: deferred continuous batching can safely interleave fine-tuning and inference workloads.

### 7.13 Llumnix (OSDI 2024 / arXiv 2406.03243)
Scheduling focus: dynamic cross-instance rescheduling with live migration.
Key ideas:
- Runtime rescheduling across model instances improves load balancing and isolation.
- Live migration of in-memory request state enables fine-grained scheduling decisions.
System takeaways: treat cross-instance migration as a first-class scheduling primitive.

### 7.14 Slice-Level Scheduling (arXiv 2406.13511)
Scheduling focus: slice-level scheduling to stabilize memory/time estimation.
Key ideas:
- Split maximum generation length into fixed slices and serve batches slice-by-slice.
- Provides more predictable memory and time ranges for batches.
System takeaways: slice-based scheduling improves throughput and load balance under heterogeneous lengths.

### 7.15 ELIS (arXiv 2505.09142)
Scheduling focus: shortest-remaining-time scheduling with response length prediction.
Key ideas:
- ISRTF scheduler prioritizes requests with fewer remaining tokens.
- Response length predictor enables shortest-job-first behavior in iterative batching.
System takeaways: length prediction can mitigate head-of-line blocking in continuous batching.

### 7.16 Past-Future Scheduler (arXiv 2507.10150)
Scheduling focus: memory-aware continuous batching under SLA constraints.
Key ideas:
- Estimates peak memory using historical output-length distributions.
- Balances queueing delay and eviction risk to improve goodput.
System takeaways: memory prediction improves SLO satisfaction in continuous batching.

### 7.17 BucketServe (arXiv 2507.17120)
Scheduling focus: bucket-based dynamic batching for heterogeneous workloads.
Key ideas:
- Groups requests into length-homogeneous buckets to reduce padding.
- Adaptive bucket split/merge and priority-aware scheduling reduce fragmentation.
System takeaways: bucketing can improve GPU utilization and goodput.

### 7.18 SLO-Aware Scheduling (arXiv 2504.14966)
Scheduling focus: multi-SLO priority scheduling for LLM inference.
Key ideas:
- Simulated-annealing scheduler orders requests using SLOs and length estimates.
- Targets higher SLO attainment across heterogeneous tasks.
System takeaways: explicit SLO-aware policies outperform FCFS under mixed objectives.

### 7.19 TaiChi (arXiv 2508.01989)
Scheduling focus: unify prefill-decode aggregation and disaggregation for goodput.
Key ideas:
- Hybrid architecture with prefill-heavy and decode-heavy instances.
- Adapts scheduling to TTFT/TPOT SLO regimes for better goodput.
System takeaways: combining aggregation and disaggregation is SLO-dependent.

### 7.20 Aladdin (arXiv 2405.06856)
Scheduling focus: joint placement and scaling for SLO-aware LLM serving.
Key ideas:
- Predicts minimal resources and worker configuration to meet SLOs.
- Co-adapts request placement with resource scaling.
System takeaways: cluster-level placement and autoscaling are critical scheduling levers.

### 7.21 LLM Serving Optimization with Variable Prefill/Decode Lengths (arXiv 2508.06133)
Scheduling focus: formal scheduling with variable prefill/decode lengths and KV constraints.
Key ideas:
- Formulates the problem with growing KV memory during decoding.
- Proposes algorithms with provable competitive ratios.
System takeaways: scheduling policies must account for decode-driven memory growth.

### 7.22 Online Scheduling with KV Cache Constraints (arXiv 2502.07115)
Scheduling focus: online batching and scheduling under KV cache constraints.
Key ideas:
- Defines a theoretical benchmark (hindsight optimal) and online algorithms.
- Provides conditions for constant-competitive scheduling.
System takeaways: theoretical bounds can guide practical schedulers.

### 7.23 Distributed LLM Serving on Consumer-Grade GPUs (EMNLP Findings 2025)
Scheduling focus: communication-aware scheduling in distributed serving.
Key ideas:
- Schedules prefill vs decode transmission to reduce communication imbalance.
- Uses chunking to split large prefill transfers just-in-time.
System takeaways: network transmission scheduling matters in distributed deployments.

### 7.24 QLM (Queue Management for SLO-Oriented LLM Serving, SoCC 2024)
Scheduling focus: online queue management to improve SLO attainment and reduce tail latency.
Key ideas:
- LLM serving has unique queueing dynamics (e.g., head-of-line blocking in continuous batching).
- QLM improves queue scheduling to reduce response time outliers with low overhead.
System takeaways: SLO-driven queue management can be a first-class scheduling policy.

### 7.25 UELLM (arXiv 2409.14961)
Scheduling focus: unified system for efficient LLM inference serving.
Key ideas:
- Integrates resource profiler, batch scheduler, and system deployer.
- Targets improved throughput and latency with system-level coordination.
System takeaways: end-to-end coordination across profiling, batching, and deployment improves global scheduling outcomes.

### 7.26 Locality-Aware Fair Scheduling (arXiv 2501.14312)
Scheduling focus: fairness-aware token allocation that respects data locality.
Key ideas:
- Proposes locality-aware policies to balance fairness and performance.
- Introduces DLPM/D2LPM to handle locality constraints in token scheduling.
System takeaways: fairness must account for locality to avoid throughput loss.

### 7.27 SpotServe (arXiv 2311.15566)
Scheduling focus: cost-aware scheduling on preemptible (spot) instances under latency SLOs.
Key ideas:
- Leverages spot instances while maintaining latency SLOs.
- Designs scheduling to mitigate preemption risk and tail latency.
System takeaways: cost-aware schedulers need preemption risk models.

## 8. Algorithm and implementation deep dives (selected)
### 8.1 Switch Transformers (routing simplification)
- Router logits = X W; router_probs = softmax(logits).
- Top-1 expert selected per token (expert_gate, expert_index).
- Auxiliary load-balancing loss computed from router_probs and expert_mask to avoid collapse.
- Experts have fixed capacity; overflow tokens are dropped or deferred.
Implementation notes: top-1 routing reduces communication but needs careful balance loss and capacity factor tuning.

### 8.2 Expert Choice Routing (load-balanced routing)
- Experts select tokens: each expert picks its top-k tokens; each token can be routed to a variable number of experts.
- Capacity formula: k = ceil(C * T / E), where C is capacity factor, T is tokens in batch, E is number of experts.
- Perfect load balance by design; avoids auxiliary load-balance loss.
Implementation notes: small batch inference can be problematic; batching strategies are needed for autoregressive serving.

### 8.3 GShard (automatic sharding)
- Model code is annotated with sharding policies; XLA compiler performs automatic partitioning.
- Uses SPMD-style partitioning to avoid graph blowup; separates model definition from partitioning strategy.
Implementation notes: ideal for giant MoE models; treat sharding and placement as compilation problems.

### 8.4 Speculative Decoding (inference scheduling)
- Draft model proposes K tokens; target model verifies them in parallel.
- Accept the longest prefix that matches; sampling distribution is preserved.
- Expected speedup depends on acceptance rate and cost ratio between draft and target.
Implementation notes: scheduler chooses K (speculative lookahead) to trade off wasted compute vs latency.

### 8.5 Sparse Transformer (long-context scheduling)
- Factorized sparse attention patterns reduce quadratic attention cost.
- Recomputation of attention matrices saves memory; enables very long sequences.
Implementation notes: choose sparse patterns based on context length and memory budget.

### 8.6 PagedAttention / vLLM (KV cache paging)
- KV cache partitioned into fixed-size blocks (block size B) stored non-contiguously.
- Attention computed block-wise; blocks fetched via a page table.
Implementation notes: block allocator + page table; sharing KV blocks across requests for prefix reuse.

### 8.7 FastServe (preemptive serving)
- Skip-join MLFQ: job joins a queue based on input length; higher queues skipped to reduce demotions.
- Token-level preemption reduces head-of-line blocking.
Implementation notes: fast save/restore of KV state is required; use host offload if needed.

### 8.8 SARATHI / Sarathi-Serve (chunked prefill scheduling)
- Chunked-prefill splits long prefill into equal chunks.
- Decode-maximal batches (SARATHI) or stall-free schedules (Sarathi-Serve) let decodes piggyback.
Implementation notes: chunk size tunes TTFT vs throughput.

### 8.9 DistServe (prefill/decode disaggregation)
- Separate prefill and decode GPUs; co-opt resources for TTFT and TPOT.
- Bandwidth-aware placement reduces transfer overhead.
Implementation notes: explicit per-phase pipeline; independent scaling.

### 8.10 DeepSeekMoE (domestic MoE routing)
- Fine-grained expert segmentation + shared experts to improve specialization and reduce redundancy.
- Introduces device-level balance loss to balance computation across devices.
Implementation notes: shared experts stabilize routing; device-level balancing is more practical than strict per-expert balance.

### 8.11 DeepSeek-V2 (domestic KV optimization)
- Uses Multi-head Latent Attention (MLA) to compress KV cache into a latent vector.
- Uses DeepSeekMoE; 236B total parameters, 21B activated per token; 128K context.
Implementation notes: KV cache is a schedulable resource; compression increases batch size and throughput.

### 8.12 ORCA (iteration-level scheduling)
- Iteration-level scheduling keeps throughput-oriented batching while enabling flexible per-request parallelism.
- Selective batching avoids redundant padding computation.
Implementation notes: iteration-level scheduling is a useful primitive for distributed LLM serving.

### 8.13 Fairness in Serving LLMs (VTC)
- Virtual Token Counter (VTC) tracks service per request during continuous batching.
- The scheduler provides a 2x tight upper bound on service difference between any two requests.
Implementation notes: VTC can be integrated as a token-level fairness metric in a continuous batching loop.

### 8.14 SpecInfer (tree-based speculative decoding)
- Tree attention enables decoder-only LMs to attend over a draft token tree.
- A token tree is decoded in one forward pass; verification is parallel.
- DFS-based KV cache updates after acceptance.
Implementation notes: tree-based drafting trades off memory for higher acceptance.

### 8.15 AdaSpec (SLO-aware speculation)
- Adaptive drafter selects speculative length dynamically.
- Confidence-prior verifier and SLO-aware efficiency estimator guide acceptance and latency targets.
Implementation notes: tune speculative depth to meet SLOs.

### 8.16 FlexGen (tiered memory scheduling)
- Offloads weights, attention, and KV cache to CPU and disk with asynchronous I/O.
- Uses an optimization solver to plan compute/communication for throughput.
Implementation notes: treat memory tiers as schedulable resources.

### 8.17 S-LoRA (unified paging)
- Unified Paging merges KV cache and LoRA adapters into one memory pool.
- Adapter clustering shares KV cache blocks among requests with the same adapter prefix.
Implementation notes: adapter-aware paging reduces fragmentation.

## 9. Additional references (new)
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
- ORCA (OSDI 2022): https://www.usenix.org/conference/osdi22/presentation/yu
- Fairness in Serving Large Language Models (OSDI 2024): https://www.usenix.org/conference/osdi24/presentation/zhong
- SpecInfer (ASPLOS 2024): https://arxiv.org/pdf/2305.09781.pdf
- AdaSpec (SoCC 2025 preprint): https://arxiv.org/pdf/2503.05096
- FlexGen (ICML 2023): https://proceedings.mlr.press/v202/chen23e.html
- S-LoRA (2023): https://arxiv.org/pdf/2311.03285.pdf
- FineInfer (EuroMLSys 2024): https://www.research-collection.ethz.ch/entities/publication/f3551dc7-d718-4b5d-becf-be1b6b631910
- Llumnix: https://arxiv.org/abs/2406.03243
- Slice-Level Scheduling: https://arxiv.org/abs/2406.13511
- ELIS: https://arxiv.org/abs/2505.09142
- Past-Future Scheduler: https://arxiv.org/abs/2507.10150
- BucketServe: https://arxiv.org/abs/2507.17120
- SLO-Aware Scheduling: https://arxiv.org/abs/2504.14966
- TaiChi: https://arxiv.org/abs/2508.01989
- Aladdin: https://arxiv.org/abs/2405.06856
- LLM Serving Optimization with Variable Prefill/Decode Lengths: https://arxiv.org/abs/2508.06133
- Online Scheduling with KV Cache Constraints: https://arxiv.org/abs/2502.07115
- Distributed LLM Serving on Consumer-Grade GPUs (EMNLP Findings 2025): https://aclanthology.org/2025.findings-emnlp.957/
- QLM (SoCC 2024): https://arxiv.org/abs/2407.00047
- UELLM: https://arxiv.org/abs/2409.14961
- Locality-Aware Fair Scheduling: https://arxiv.org/abs/2501.14312
- SpotServe: https://arxiv.org/abs/2311.15566

