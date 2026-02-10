# LLM Scheduling Deep Dives (20 Papers, EN)
Date: 2026-02-05
Scope: 20 core papers on routing, inference serving, and scheduling. Each entry summarizes problem, mechanism, and system implications.

## 0. How to Read
- "Mechanism" highlights the scheduling primitive.
- "Implementation notes" capture engineering hints.
- "System implications" connect to production scheduling decisions.

---

## 1. Switch Transformers (2021) — Simplified MoE Routing
Source: arXiv 2101.03961
- Problem: MoE routing can be unstable and communication-heavy at scale.
- Mechanism: Simplified routing (one expert per token) with auxiliary load-balancing.
- Scheduling primitive: Router policy as a first-class scheduler.
- Implementation notes: Capacity factor and balance loss are critical for stability.
- System implications: Predictable routing reduces tail latency and compute variance.

## 2. GShard (2020) — Automatic Sharding for Conditional Computation
Source: arXiv 2006.16668
- Problem: Large MoE models require complex manual sharding across devices.
- Mechanism: XLA/annotation-based auto-sharding for SPMD-style partitioning.
- Scheduling primitive: Placement and sharding as compile-time scheduling.
- Implementation notes: Decouple model definition from partitioning strategy.
- System implications: Sharding policy can be exposed as a scheduler configuration knob.

## 3. Expert Choice Routing (2022) — Load-Balanced Routing
Source: arXiv 2202.09368
- Problem: Token-to-expert routing often yields load imbalance.
- Mechanism: Experts select tokens (expert choice) for balanced capacity usage.
- Scheduling primitive: Expert-side selection to enforce load balance.
- Implementation notes: Capacity is bounded per expert; reduces router collapse.
- System implications: Improved utilization can lower cost for fixed quality.

## 4. V-MoE (2021) — Adaptive Compute via Sparse Routing
Source: arXiv 2106.05974
- Problem: Dense computation wastes budget on easy inputs.
- Mechanism: Sparse expert routing enables adaptive per-input compute.
- Scheduling primitive: Conditional compute as a per-request budget policy.
- Implementation notes: Router calibration influences quality/compute tradeoffs.
- System implications: Dynamic compute policies align with multi-tier SLOs.

## 5. Sparse Transformer (2019) — Long-Context Scheduling
Source: arXiv 1904.10509
- Problem: Quadratic attention makes long sequences infeasible.
- Mechanism: Sparse attention factorizations reduce compute and memory.
- Scheduling primitive: Memory/time budgeting by sparsity pattern selection.
- Implementation notes: Sparse patterns must match downstream context needs.
- System implications: Long-context support depends on attention scheduling.

## 6. Speculative Decoding (2022) — Parallelized Decoding
Source: arXiv 2211.17192
- Problem: Autoregressive decoding is sequential and slow.
- Mechanism: Draft model proposes tokens; target model verifies in parallel.
- Scheduling primitive: Draft/verify pipeline with acceptance rate control.
- Implementation notes: Speculative length trades wasted compute vs latency.
- System implications: Speculation is most useful when acceptance rate is stable.

## 7. vLLM / PagedAttention (2023) — KV Cache Paging
Source: arXiv 2309.06180
- Problem: KV cache fragmentation limits batch size.
- Mechanism: Paging KV blocks and block-wise attention with a page table.
- Scheduling primitive: KV cache as a paged, allocatable resource.
- Implementation notes: Block allocator and copy-on-write enable sharing.
- System implications: Paging enables higher concurrency under memory pressure.

## 8. FastServe (2023) — Token-Level Preemption
Source: arXiv 2305.05920
- Problem: Head-of-line blocking inflates tail latency.
- Mechanism: Token-level preemption with multi-level feedback queues.
- Scheduling primitive: Preemptive scheduling with length-based priority.
- Implementation notes: Requires fast KV state save/restore and offload.
- System implications: Tail latency improves at the cost of extra state churn.

## 9. SARATHI (2023) — Chunked Prefill + Piggyback Decodes
Source: arXiv 2308.16369
- Problem: Prefill stalls reduce decode throughput in continuous batching.
- Mechanism: Split prefill into chunks and piggyback decodes per batch.
- Scheduling primitive: Chunked prefill scheduling.
- Implementation notes: Chunk size tunes TTFT vs throughput.
- System implications: Chunking stabilizes iteration times and improves goodput.

## 10. Sarathi-Serve (2024) — Stall-Free Continuous Batching
Source: MSR publication
- Problem: Continuous batching introduces stalls when new requests arrive.
- Mechanism: Stall-free schedules that integrate chunked prefills.
- Scheduling primitive: Stall-free batch formation.
- Implementation notes: Uniform iteration shapes reduce pipeline bubbles.
- System implications: Better latency/throughput balance at steady load.

## 11. DistServe (2024) — Prefill/Decode Disaggregation
Source: arXiv 2401.09670
- Problem: Prefill and decode contend for compute resources.
- Mechanism: Disaggregate prefill and decode onto separate GPU pools.
- Scheduling primitive: Phase-aware placement.
- Implementation notes: Bandwidth-aware transfer between pools is critical.
- System implications: Enables per-phase scaling and improved SLO control.

## 12. ORCA (OSDI 2022) — Iteration-Level Scheduling
Source: USENIX OSDI 2022
- Problem: Static batching wastes compute due to padding.
- Mechanism: Iteration-level scheduling with selective batching.
- Scheduling primitive: Fine-grained re-batching at each iteration.
- Implementation notes: Works well for distributed clusters.
- System implications: Iteration-level control improves throughput without large latency penalties.

## 13. Fairness in Serving LLMs (OSDI 2024) — VTC Fairness
Source: USENIX OSDI 2024
- Problem: Continuous batching can starve some requests.
- Mechanism: Virtual Token Counter (VTC) to track service and enforce fairness.
- Scheduling primitive: Token-level fairness accounting.
- Implementation notes: Maintain per-request token credit in the scheduler loop.
- System implications: Fairness constraints can coexist with high utilization.

## 14. SpecInfer (ASPLOS 2024) — Tree-Based Speculation
Source: arXiv 2305.09781
- Problem: Linear speculative decoding limits verification parallelism.
- Mechanism: Token tree with tree attention; parallel verification.
- Scheduling primitive: Tree-structured draft scheduling.
- Implementation notes: DFS-based KV updates; higher memory usage.
- System implications: Higher speculative depth improves throughput when memory allows.

## 15. AdaSpec (SoCC 2025) — SLO-Aware Speculation
Source: arXiv 2503.05096
- Problem: Fixed speculative length can violate latency SLOs.
- Mechanism: Adaptive drafter with SLO-aware efficiency estimator.
- Scheduling primitive: Dynamic speculative depth selection.
- Implementation notes: Balance acceptance rate vs latency budget.
- System implications: Enables speculation in mixed SLO environments.

## 16. FlexGen (ICML 2023) — Tiered Memory Scheduling
Source: PMLR ICML 2023
- Problem: GPU memory limits prevent large-model inference.
- Mechanism: Offload weights/activations/KV to CPU/SSD with async I/O.
- Scheduling primitive: Memory-tier placement and offload scheduling.
- Implementation notes: Use cost models to plan data movement.
- System implications: Makes large models viable on limited GPUs.

## 17. S-LoRA (2023) — Unified Paging for Adapters
Source: arXiv 2311.03285
- Problem: Serving many LoRA adapters fragments KV cache.
- Mechanism: Unified paging pool for KV cache + adapters; adapter clustering.
- Scheduling primitive: Adapter-aware paging and cache sharing.
- Implementation notes: Cluster requests by adapter prefix for reuse.
- System implications: Improves multi-tenant adapter throughput.

## 18. Llumnix (2024) — Live Migration for Serving
Source: arXiv 2406.03243
- Problem: Static placement causes stragglers and poor isolation.
- Mechanism: Live migration of in-flight requests across instances.
- Scheduling primitive: Cross-instance rescheduling with migration.
- Implementation notes: Migrate request state with minimal interruption.
- System implications: Improves utilization and tail latency in multi-tenant clusters.

## 19. FineInfer (EuroMLSys 2024) — Co-Serving Fine-Tuning + Inference
Source: EuroMLSys 2024
- Problem: Fine-tuning and inference compete for resources.
- Mechanism: Deferred continuous batching with base-model multiplexing.
- Scheduling primitive: Iteration-level context switching between FT/INF.
- Implementation notes: Balance tuning throughput and inference latency.
- System implications: Enables mixed workloads without violating SLOs.

## 20. Slice-Level Scheduling (2024) — Predictable Batching
Source: arXiv 2406.13511
- Problem: Variable sequence lengths cause unpredictable memory/latency.
- Mechanism: Split max length into fixed slices; batch slice-by-slice.
- Scheduling primitive: Slice-level batch scheduling.
- Implementation notes: Slice size tunes memory/latency predictability.
- System implications: More stable service under heterogeneous requests.

---

## References
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
