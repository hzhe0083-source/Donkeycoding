# LLM Scheduling Framework and Scorecard (EN)
Date: 2026-02-05
Goal: Provide a practical decision framework for LLM serving schedulers, mapping workload requirements to scheduling primitives and evaluation metrics.

## 1. Scope and Terminology
- Scheduling scope: admission control, batching, prefill/decode orchestration, KV cache management, fairness, and resource placement.
- SLO types: TTFT (time-to-first-token), TPOT (time-per-output-token), p95/p99 latency, throughput, goodput.

## 2. System Layers (Reference Architecture)
1) Request Intake
   - Parse metadata: model, prompt length, max output length, SLO tier, user priority, billing tier.
2) Admission Control
   - Decide accept/reject/defer based on SLO, queue depth, memory headroom.
3) Queue Management
   - SLO-aware ordering; fairness constraints; tail-latency guardrails.
4) Batching Planner
   - Decide batch composition; continuous vs discrete batching; chunked prefill options.
5) Prefill/Decode Orchestrator
   - Decide co-scheduling of prefill/decode; disaggregation if needed.
6) Memory/KV Cache Manager
   - Allocate KV blocks; paging; eviction; preemption save/restore.
7) Placement and Scaling
   - Decide instance placement, migration, and autoscaling.

## 3. Core Signals (Scheduler Inputs)
- Request: prompt length, max output, priority, user tier, SLO class.
- Model: model size, KV per token, parallelism strategy, draft model availability.
- Hardware: GPU memory, bandwidth, interconnect, CPU/SSD tiers.
- Runtime: queue depth, KV cache utilization, batch iteration time, acceptance rate (speculation), preemptions.

## 4. Scheduling Primitives (What You Can Control)
- Batching: continuous batching, chunked prefill, decode-maximal batches.
- Preemption: token-level vs request-level; offload to CPU/SSD.
- Disaggregation: separate prefill and decode pools.
- Speculation: draft model with verification; dynamic speculative length.
- Migration: live migration across instances.
- Caching: prefix/KV reuse, block paging, adapter-aware paging.
- Fairness: token-level accounting, SLO-aware priority.
- Cost-aware: spot-aware scheduling, tiered memory offload.

## 5. Decision Matrix (Workload -> Policy)
### 5.1 Latency-critical (tight TTFT/TPOT SLO)
- Prefer: small batch size, preemption, SLO-aware queueing, speculation.
- Avoid: large batch sizes, aggressive disaggregation if it adds transfer latency.

### 5.2 Throughput-heavy (batch/offline or loose SLO)
- Prefer: large continuous batching, chunked prefill, KV paging, disaggregation.
- Avoid: frequent preemption.

### 5.3 Cost-sensitive (budget-constrained)
- Prefer: spot-aware scheduling, tiered memory offload, batch consolidation.
- Avoid: high-frequency migrations.

### 5.4 Fairness-critical (multi-tenant)
- Prefer: token-level fairness (VTC), locality-aware fairness where data locality matters.
- Avoid: purely FCFS or shortest-first without fairness constraints.

## 6. Scorecard (What to Measure)
### 6.1 Latency
- TTFT p50/p95/p99
- TPOT p50/p95
- Tail latency outliers

### 6.2 Throughput & Goodput
- Tokens/s (overall)
- Goodput: tokens that meet SLO / total tokens

### 6.3 Resource Utilization
- GPU utilization, SM occupancy
- KV cache utilization and fragmentation
- CPU/SSD offload bandwidth utilization

### 6.4 Fairness & Isolation
- Per-tenant service ratio
- Max service difference between requests

### 6.5 Cost
- $/1M tokens
- Spot interruption rate impact

## 7. Implementation Interface (Suggested Modules)
- SchedulerCore
  - Inputs: RequestQueue, ResourceSnapshot, PolicyConfig
  - Outputs: BatchPlan, PlacementPlan, CachePlan
- QueueManager
  - Policy: SLO-aware ordering, fairness constraints
- BatchPlanner
  - Policy: continuous batching, chunked prefill, slice-level scheduling
- MemoryManager
  - Policy: KV paging, eviction, adapter-aware pooling
- PlacementManager
  - Policy: migration, disaggregation, autoscaling
- Telemetry
  - Metrics aggregation and alerting

## 8. Mapping Papers to Primitives (Examples)
- PagedAttention/vLLM -> KV paging
- SARATHI/Sarathi-Serve -> chunked prefill scheduling
- DistServe -> prefill/decode disaggregation
- ORCA -> iteration-level scheduling
- SpecInfer/AdaSpec -> speculative decoding
- QLM/UELLM -> queue management and global coordination
- SpotServe -> cost-aware scheduling on preemptible instances

## 9. Practical Tuning Checklist
1) Set SLO tiers (latency / throughput / cost)
2) Choose batch strategy (continuous vs chunked)
3) Decide preemption granularity (token vs request)
4) Decide disaggregation threshold (queue depth, model size)
5) Enable speculation if acceptance rate is stable
6) Enable KV paging when memory pressure exceeds threshold
7) Track fairness metrics and enforce caps

