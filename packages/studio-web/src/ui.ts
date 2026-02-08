import {
  refreshOrchestratorStatus,
  sendOfficeChat,
  setKeys,
  startOfficeDebate,
  startOrchestrator,
  stopOfficeDebate,
} from "./rpc";
import {
  addOffice,
  dismissToast,
  getActiveOffice,
  pushToast,
  setActiveOffice,
  setBusyAction,
  state,
} from "./state";
import type {
  OfficeDraft,
  OfficeMember,
  OfficeSnapshot,
  Provider,
  Role,
  WorkspaceMode,
} from "./types";
import { escapeHtml } from "./utils";

const app = document.querySelector<HTMLDivElement>("#app")!;
if (!app) {
  throw new Error("#app not found");
}

const ALL_PROVIDERS: Provider[] = ["openai", "anthropic", "google", "deepseek"];

const PROVIDER_LABELS: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  deepseek: "DeepSeek",
};

type WorkflowOptionId = "quick" | "balanced" | "research" | "review" | "strict";
type ProviderStrategy = "recommended" | "single-provider";
type SyncState = "idle" | "syncing" | "success" | "error";

type WorkflowOption = {
  id: WorkflowOptionId;
  title: string;
  summary: string;
  rounds: number;
  roles: Role[];
};

const WORKFLOW_OPTIONS: WorkflowOption[] = [
  {
    id: "quick",
    title: "方案 A · 快速对齐",
    summary: "快速澄清目标并产出最小可执行计划，适合先跑通。",
    rounds: 2,
    roles: ["proposer", "critic", "synthesizer"],
  },
  {
    id: "balanced",
    title: "方案 B · 平衡推进",
    summary: "提案 + 质疑 + 调研 + 整合，给出 2-3 版路线供你敲定。",
    rounds: 3,
    roles: ["proposer", "critic", "researcher", "synthesizer"],
  },
  {
    id: "research",
    title: "方案 C · 研究优先",
    summary: "引入验证视角，降低事实风险与返工概率。",
    rounds: 4,
    roles: ["proposer", "critic", "researcher", "verifier", "synthesizer"],
  },
  {
    id: "review",
    title: "方案 D · 决策闭环",
    summary: "在多方案基础上加入裁决角色，强制收敛到单一结论。",
    rounds: 4,
    roles: ["proposer", "critic", "researcher", "synthesizer", "arbiter"],
  },
  {
    id: "strict",
    title: "方案 E · 深度审查",
    summary: "全角色办公室，强调证据、验证与最终裁决。",
    rounds: 5,
    roles: ["proposer", "critic", "researcher", "verifier", "synthesizer", "arbiter"],
  },
];

const createOfficeFlow: {
  open: boolean;
  goal: string;
  officeName: string;
  planCount: number;
  selectedPlanId: WorkflowOptionId;
  maxRounds: number;
  providerStrategy: ProviderStrategy;
  singleProvider: Provider;
  syncState: SyncState;
  syncMessage: string;
} = {
  open: false,
  goal: "",
  officeName: "",
  planCount: 3,
  selectedPlanId: "balanced",
  maxRounds: 3,
  providerStrategy: "recommended",
  singleProvider: "openai",
  syncState: "idle",
  syncMessage: "",
};

function getSnapshot(officeId: string): OfficeSnapshot {
  return (
    state.officeSnapshots[officeId] ?? {
      officeId,
      status: "idle",
      sessionId: "-",
      turnIndex: 0,
      agreementScore: 0,
      totalTokens: 0,
      totalCost: 0,
      lastSummary: "暂无会议结论",
      lastUpdatedAt: new Date().toISOString(),
    }
  );
}

function statusText(status: OfficeSnapshot["status"]): string {
  const map: Record<OfficeSnapshot["status"], string> = {
    idle: "空闲",
    starting: "启动中",
    running: "运行中",
    completed: "已完成",
    stopped: "已停止",
    error: "异常",
  };
  return map[status] ?? status;
}

function roleDescription(member: OfficeMember): string {
  const map: Record<OfficeMember["role"], string> = {
    proposer: "提方案，推进第一版。",
    critic: "找风险，提反例和改进。",
    synthesizer: "整合观点，形成折中方案。",
    arbiter: "做裁决，给最终结论。",
    researcher: "补事实和证据。",
    verifier: "做验证，控一致性。",
  };
  return map[member.role] ?? "参与协作";
}

function officeModelSummary(office: OfficeDraft): string {
  const providers = Array.from(new Set(office.members.filter((m) => m.enabled).map((m) => m.provider)));
  return providers.length > 0 ? providers.join(" / ") : "未启用模型";
}

function officeArbiterLabel(office: OfficeDraft): string {
  const arbiter = office.members.find((m) => m.enabled && (m.role === "arbiter" || m.role === "synthesizer"));
  return arbiter ? `${arbiter.participantId}` : "未设置";
}

function toast(message: string, kind: "info" | "success" | "error" = "info"): void {
  const id = pushToast(kind, message);
  render();
  window.setTimeout(() => {
    dismissToast(id);
    render();
  }, 3500);
}

function clampRounds(value: number): number {
  if (!Number.isFinite(value)) {
    return 3;
  }
  return Math.max(1, Math.min(20, Math.trunc(value)));
}

function roleOptions(current: Role): string {
  const roles: Role[] = [
    "proposer",
    "critic",
    "synthesizer",
    "arbiter",
    "researcher",
    "verifier",
  ];
  return roles
    .map((role) => `<option value="${role}" ${role === current ? "selected" : ""}>${escapeHtml(role)}</option>`)
    .join("");
}

function providerOptions(current: Provider): string {
  return ALL_PROVIDERS
    .map((provider) => `<option value="${provider}" ${provider === current ? "selected" : ""}>${escapeHtml(provider)}</option>`)
    .join("");
}

function hasProviderKey(provider: Provider): boolean {
  return state.apiKeys[provider].trim().length > 0;
}

function getConfiguredProviders(): Provider[] {
  return ALL_PROVIDERS.filter((provider) => hasProviderKey(provider));
}

function hasAnyConfiguredKey(): boolean {
  return getConfiguredProviders().length > 0;
}

function nextOfficeNameSuggestion(): string {
  const index = state.offices.length + 1;
  if (index >= 1 && index <= 26) {
    return `办公室 ${String.fromCharCode(64 + index)}`;
  }
  return `办公室 ${index}`;
}

function getVisibleWorkflowOptions(): WorkflowOption[] {
  const count = Math.max(2, Math.min(5, createOfficeFlow.planCount));
  return WORKFLOW_OPTIONS.slice(0, count);
}

function getSelectedWorkflowOption(): WorkflowOption {
  const visible = getVisibleWorkflowOptions();
  const found = visible.find((option) => option.id === createOfficeFlow.selectedPlanId);
  return found ?? visible[0] ?? WORKFLOW_OPTIONS[0];
}

function defaultModelByProvider(provider: Provider): string {
  const map: Record<Provider, string> = {
    openai: "gpt-4.1",
    anthropic: "claude-3-5-sonnet",
    google: "gemini-1.5-pro",
    deepseek: "deepseek-chat",
  };
  return map[provider];
}

function pickProviderForRole(role: Role, available: Provider[], fallback: Provider): Provider {
  const preference: Record<Role, Provider[]> = {
    proposer: ["openai", "deepseek", "anthropic", "google"],
    critic: ["anthropic", "openai", "google", "deepseek"],
    synthesizer: ["openai", "anthropic", "google", "deepseek"],
    arbiter: ["anthropic", "openai", "google", "deepseek"],
    researcher: ["google", "deepseek", "openai", "anthropic"],
    verifier: ["google", "openai", "anthropic", "deepseek"],
  };

  for (const provider of preference[role]) {
    if (available.includes(provider)) {
      return provider;
    }
  }

  if (available.length > 0) {
    return available[0];
  }
  return fallback;
}

function buildFlowMembers(officeId: string): OfficeMember[] {
  const selected = getSelectedWorkflowOption();
  const available = getConfiguredProviders();
  const fallback = createOfficeFlow.singleProvider;

  return selected.roles.map((role, index) => {
    const provider =
      createOfficeFlow.providerStrategy === "single-provider"
        ? createOfficeFlow.singleProvider
        : pickProviderForRole(role, available, fallback);
    return {
      participantId: `${officeId}-${role}-${index + 1}`,
      provider,
      modelId: defaultModelByProvider(provider),
      role,
      enabled: true,
    };
  });
}

function buildFlowPreviewRows(): string {
  const previewMembers = buildFlowMembers("preview");
  return previewMembers
    .map(
      (member) => `
        <div class="flow-preview-row">
          <span class="flow-preview-role">${escapeHtml(member.role)}</span>
          <span class="flow-preview-provider">${escapeHtml(PROVIDER_LABELS[member.provider])}</span>
          <span class="flow-preview-model">${escapeHtml(member.modelId)}</span>
        </div>
      `,
    )
    .join("");
}

function openCreateOfficeFlow(): void {
  const configured = getConfiguredProviders();
  const preferred = configured[0] ?? "openai";

  createOfficeFlow.open = true;
  createOfficeFlow.goal = "";
  createOfficeFlow.officeName = nextOfficeNameSuggestion();
  createOfficeFlow.planCount = 3;
  createOfficeFlow.selectedPlanId = "balanced";
  createOfficeFlow.maxRounds = 3;
  createOfficeFlow.providerStrategy = "recommended";
  createOfficeFlow.singleProvider = preferred;
  createOfficeFlow.syncState = "idle";
  createOfficeFlow.syncMessage = "";
}

function closeCreateOfficeFlow(): void {
  createOfficeFlow.open = false;
  createOfficeFlow.syncState = "idle";
  createOfficeFlow.syncMessage = "";
}

function ensureVisibleWorkflowSelection(): void {
  const visible = getVisibleWorkflowOptions();
  if (!visible.some((option) => option.id === createOfficeFlow.selectedPlanId)) {
    const first = visible[0];
    if (first) {
      createOfficeFlow.selectedPlanId = first.id;
      createOfficeFlow.maxRounds = first.rounds;
    }
  }
}

function listMissingProvidersForOffice(office: OfficeDraft): Provider[] {
  const required = new Set(
    office.members.filter((member) => member.enabled).map((member) => member.provider),
  );
  return Array.from(required).filter((provider) => !hasProviderKey(provider));
}

async function syncKeysWithEngine(): Promise<{ ok: boolean; message: string }> {
  if (!hasAnyConfiguredKey()) {
    return { ok: false, message: "请至少配置一个全局 API Key" };
  }

  if (!state.orchestratorRunning) {
    const started = await startOrchestrator();
    await refreshOrchestratorStatus();
    if (!started.ok || !state.orchestratorRunning) {
      return { ok: false, message: started.message };
    }
  }

  return setKeys();
}

function renderCreateOfficeModal(): string {
  if (!createOfficeFlow.open) {
    return "";
  }

  const visiblePlans = getVisibleWorkflowOptions();
  const selected = getSelectedWorkflowOption();
  const keyReady = hasAnyConfiguredKey();
  const singleProviderInvalid =
    createOfficeFlow.providerStrategy === "single-provider" && !hasProviderKey(createOfficeFlow.singleProvider);
  const canCreate =
    createOfficeFlow.goal.trim().length > 0 &&
    keyReady &&
    !singleProviderInvalid &&
    createOfficeFlow.syncState !== "syncing";

  const syncButtonLabel = createOfficeFlow.syncState === "syncing" ? "同步中..." : "保存并同步 Keys";
  const syncStatusClass =
    createOfficeFlow.syncState === "success"
      ? "flow-sync-success"
      : createOfficeFlow.syncState === "error"
      ? "flow-sync-error"
      : "";

  const singleProviderOptions = ALL_PROVIDERS.map((provider) => {
    const ready = hasProviderKey(provider);
    const suffix = ready ? "" : "（未配置 Key）";
    const disabled = ready ? "" : "disabled";
    return `<option value="${provider}" ${provider === createOfficeFlow.singleProvider ? "selected" : ""} ${disabled}>${escapeHtml(PROVIDER_LABELS[provider])}${suffix}</option>`;
  }).join("");

  const planCards = visiblePlans
    .map((option) => {
      const active = option.id === selected.id;
      const roleText = option.roles.join(" · ");
      return `
        <button class="flow-plan-card ${active ? "active" : ""}" data-flow-plan="${option.id}">
          <div class="flow-plan-title">${escapeHtml(option.title)}</div>
          <div class="flow-plan-summary">${escapeHtml(option.summary)}</div>
          <div class="flow-plan-meta">轮次 ${option.rounds} · 角色 ${escapeHtml(roleText)}</div>
        </button>
      `;
    })
    .join("");

  return `
    <div class="flow-modal-mask">
      <div class="flow-modal">
        <div class="flow-modal-head">
          <div>
            <div class="flow-modal-title">开始 Workerflow</div>
            <div class="flow-modal-sub">先明确目标，再从 2-5 套候选 workflow 中选择并创建办公室。</div>
          </div>
          <button id="btn-flow-cancel">取消</button>
        </div>

        <div class="flow-modal-body">
          <section class="flow-section">
            <div class="flow-section-title">1) 你想让 AI 完成什么</div>
            <textarea id="flow-goal" rows="3" placeholder="例如：先给出 3 套可执行方案，再由我选择继续实现">${escapeHtml(createOfficeFlow.goal)}</textarea>
          </section>

          <section class="flow-section">
            <div class="flow-section-title">2) 选择候选 workflow（2-5 套）</div>
            <label class="field">
              <span>候选方案数量</span>
              <select id="flow-plan-count">
                <option value="2" ${createOfficeFlow.planCount === 2 ? "selected" : ""}>2</option>
                <option value="3" ${createOfficeFlow.planCount === 3 ? "selected" : ""}>3</option>
                <option value="4" ${createOfficeFlow.planCount === 4 ? "selected" : ""}>4</option>
                <option value="5" ${createOfficeFlow.planCount === 5 ? "selected" : ""}>5</option>
              </select>
            </label>
            <div class="flow-plan-grid">${planCards}</div>
          </section>

          <section class="flow-section">
            <div class="flow-section-title">3) 构建办公室</div>
            <label class="field">
              <span>办公室名称</span>
              <input id="flow-office-name" value="${escapeHtml(createOfficeFlow.officeName)}" placeholder="比如：方案评审办公室" />
            </label>
            <label class="field">
              <span>最大轮次（1~20）</span>
              <input id="flow-max-rounds" type="number" min="1" max="20" value="${createOfficeFlow.maxRounds}" />
            </label>
            <label class="field">
              <span>模型分配策略</span>
              <select id="flow-provider-strategy">
                <option value="recommended" ${createOfficeFlow.providerStrategy === "recommended" ? "selected" : ""}>推荐分配（按角色自动分工）</option>
                <option value="single-provider" ${createOfficeFlow.providerStrategy === "single-provider" ? "selected" : ""}>单一厂商（全部角色同厂商）</option>
              </select>
            </label>

            ${createOfficeFlow.providerStrategy === "single-provider"
              ? `
                <label class="field">
                  <span>单一厂商</span>
                  <select id="flow-single-provider">${singleProviderOptions}</select>
                </label>
              `
              : ""}

            <div class="flow-preview-box">
              <div class="flow-preview-title">将要创建的成员</div>
              ${buildFlowPreviewRows()}
            </div>
          </section>

          ${!keyReady
            ? `
              <section class="flow-section flow-alert">
                <div class="flow-section-title">先配置全局 API Key</div>
                <div class="muted">至少配置一个厂商 Key 后，才能创建并启动办公室。</div>
                <label class="field"><span>OpenAI Key</span><input id="flow-key-openai" type="password" value="${escapeHtml(state.apiKeys.openai)}" /></label>
                <label class="field"><span>Anthropic Key</span><input id="flow-key-anthropic" type="password" value="${escapeHtml(state.apiKeys.anthropic)}" /></label>
                <label class="field"><span>Google Key</span><input id="flow-key-google" type="password" value="${escapeHtml(state.apiKeys.google)}" /></label>
                <label class="field"><span>DeepSeek Key</span><input id="flow-key-deepseek" type="password" value="${escapeHtml(state.apiKeys.deepseek)}" /></label>
                <button id="btn-flow-sync-keys" ${createOfficeFlow.syncState === "syncing" ? "disabled" : ""}>${syncButtonLabel}</button>
                ${createOfficeFlow.syncMessage ? `<div class="flow-sync-msg ${syncStatusClass}">${escapeHtml(createOfficeFlow.syncMessage)}</div>` : ""}
              </section>
            `
            : ""}
        </div>

        <div class="flow-modal-foot">
          <button id="btn-flow-create" ${canCreate ? "" : "disabled"}>创建办公室并进入讨论</button>
        </div>
      </div>
    </div>
  `;
}

function renderToasts(): string {
  if (state.toasts.length === 0) {
    return "";
  }

  return `
    <div class="toast-stack">
      ${state.toasts
        .map(
          (item) => `
            <div class="toast toast-${item.kind}">${escapeHtml(item.message)}</div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderOfficeCards(): string {
  const cards = state.offices
    .map((office) => {
      const snapshot = getSnapshot(office.officeId);
      const active = office.officeId === state.activeOfficeId;
      return `
        <button class="office-card ${active ? "active" : ""}" data-office-id="${office.officeId}">
          <div class="office-title">${escapeHtml(office.officeName)}</div>
          <div class="office-line">任务：${escapeHtml(office.objective || "未设置")}</div>
          <div class="office-line">裁决人：${escapeHtml(officeArbiterLabel(office))}</div>
          <div class="office-line">模型：${escapeHtml(officeModelSummary(office))}</div>
          <div class="office-meta">${statusText(snapshot.status)} · 第 ${snapshot.turnIndex} 轮</div>
        </button>
      `;
    })
    .join("");

  const addCard = `<button class="office-card add" id="btn-add-office">新建办公室</button>`;
  return `${cards}${addCard}`;
}

function fmtNumber(n: number, digits = 2): string {
  if (typeof n !== "number" || Number.isNaN(n)) {
    return "-";
  }
  return n.toFixed(digits);
}

function fmtInt(n: number): string {
  if (typeof n !== "number" || Number.isNaN(n)) {
    return "0";
  }
  return String(Math.trunc(n));
}

function normalizeAgreement(score: number): number {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return 0;
  }
  if (score > 1) {
    return Math.max(0, Math.min(1, score / 100));
  }
  return Math.max(0, Math.min(1, score));
}

function agreementClass(normalized: number): string {
  if (normalized >= 0.8) return "ring-good";
  if (normalized >= 0.5) return "ring-warn";
  return "ring-bad";
}

function renderDashboardView(): string {
  const officeRows = state.offices
    .map((office) => {
      const snapshot = getSnapshot(office.officeId);
      const normalized = normalizeAgreement(snapshot.agreementScore);
      return `
        <tr>
          <td>${escapeHtml(office.officeName)}</td>
          <td><span class="status-badge status-${snapshot.status}">${statusText(snapshot.status)}</span></td>
          <td>${escapeHtml(snapshot.sessionId)}</td>
          <td>${snapshot.turnIndex}</td>
          <td>${fmtNumber(normalized * 100, 1)}%</td>
          <td>${fmtInt(snapshot.totalTokens)}</td>
          <td>$${fmtNumber(snapshot.totalCost, 4)}</td>
          <td class="summary-cell">${escapeHtml(snapshot.lastSummary)}</td>
        </tr>
      `;
    })
    .join("");

  const totalTokens = Object.values(state.officeSnapshots).reduce((sum, s) => sum + (s.totalTokens || 0), 0);
  const totalCost = Object.values(state.officeSnapshots).reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const runningCount = Object.values(state.officeSnapshots).filter((s) => s.status === "running").length;

  const participantRows = state.participants.length > 0
    ? state.participants
        .map(
          (p) => `
          <tr>
            <td>${escapeHtml(p.participantId)}</td>
            <td>${escapeHtml(p.role)}</td>
            <td>${escapeHtml(p.provider)} / ${escapeHtml(p.modelId)}</td>
            <td><span class="status-badge status-${p.status === "done" ? "completed" : p.status === "pending" ? "idle" : "running"}">${escapeHtml(p.status)}</span></td>
            <td>${p.latencyMs !== undefined ? `${p.latencyMs}ms` : "-"}</td>
          </tr>
        `,
        )
        .join("")
    : `<tr><td colspan="5" class="muted">暂无参与者数据</td></tr>`;

  const logLines = state.logs
    .slice(0, 50)
    .map((line) => `<div class="log-line">${escapeHtml(line)}</div>`)
    .join("");

  return `
    <div class="dashboard-view">
      <h2 class="view-title">Dashboard</h2>
      <p class="view-desc">全局概览：所有办公室状态、参与者、系统日志</p>

      <div class="dash-summary-grid">
        <div class="dash-card">
          <div class="dash-card-label">办公室总数</div>
          <div class="dash-card-value">${state.offices.length}</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-label">运行中</div>
          <div class="dash-card-value">${runningCount}</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-label">总 Tokens</div>
          <div class="dash-card-value">${fmtInt(totalTokens)}</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-label">总花费</div>
          <div class="dash-card-value">$${fmtNumber(totalCost, 4)}</div>
        </div>
      </div>

      <div class="dash-section">
        <h3>办公室状态</h3>
        <div class="dash-table-wrap">
          <table class="dash-table">
            <thead>
              <tr>
                <th>办公室</th>
                <th>状态</th>
                <th>Session</th>
                <th>轮次</th>
                <th>共识</th>
                <th>Tokens</th>
                <th>花费</th>
                <th>最新摘要</th>
              </tr>
            </thead>
            <tbody>${officeRows}</tbody>
          </table>
        </div>
      </div>

      <div class="dash-section">
        <h3>参与者</h3>
        <div class="dash-table-wrap">
          <table class="dash-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>角色</th>
                <th>Provider / Model</th>
                <th>状态</th>
                <th>延迟</th>
              </tr>
            </thead>
            <tbody>${participantRows}</tbody>
          </table>
        </div>
      </div>

      <div class="dash-section">
        <h3>系统日志 <span class="muted">(最近 50 条)</span></h3>
        <div class="log-box">${logLines || '<div class="muted">暂无日志</div>'}</div>
      </div>
    </div>
  `;
}

function renderSubscriptionView(): string {
  const notificationItems = state.notifications.length > 0
    ? state.notifications
        .slice(0, 100)
        .map(
          (n) => `
          <div class="sub-event-item">
            <div class="sub-event-head">
              <span class="sub-event-method">${escapeHtml(n.method)}</span>
              <span class="sub-event-time">${escapeHtml(n.time)}</span>
            </div>
            <pre class="sub-event-body">${escapeHtml(typeof n.payload === "string" ? n.payload : JSON.stringify(n.payload, null, 2))}</pre>
          </div>
        `,
        )
        .join("")
    : `<div class="muted">暂无事件通知。启动办公室讨论后，这里会实时显示引擎推送的事件流。</div>`;

  const chunkItems = state.chunks.length > 0
    ? state.chunks
        .slice(0, 80)
        .map(
          (c) => `
          <div class="sub-chunk-item">
            <div class="sub-chunk-head">
              <span class="sub-chunk-participant">${escapeHtml(c.participantId)}</span>
              <span class="sub-chunk-meta">session: ${escapeHtml(c.sessionId)} · 第${c.turnIndex}轮 · ${escapeHtml(c.time)}</span>
            </div>
            <div class="sub-chunk-body">${escapeHtml(c.delta)}</div>
          </div>
        `,
        )
        .join("")
    : `<div class="muted">暂无消息流。</div>`;

  return `
    <div class="subscription-view">
      <h2 class="view-title">订阅</h2>
      <p class="view-desc">实时事件流：引擎通知、消息 chunk、会话状态变更</p>

      <div class="sub-tabs">
        <button class="sub-tab ${state._subTab !== "chunks" ? "active" : ""}" data-sub-tab="notifications">事件通知 (${state.notifications.length})</button>
        <button class="sub-tab ${state._subTab === "chunks" ? "active" : ""}" data-sub-tab="chunks">消息流 (${state.chunks.length})</button>
      </div>

      <div class="sub-content">
        ${state._subTab === "chunks" ? chunkItems : notificationItems}
      </div>
    </div>
  `;
}

function navLabel(mode: WorkspaceMode): string {
  const map: Record<WorkspaceMode, string> = {
    offices: "蜂群办公室",
    dashboard: "Dashboard",
    subscription: "订阅",
    creation: "创作",
    review: "审查",
  };
  return map[mode] ?? mode;
}

const navModes: WorkspaceMode[] = ["offices", "dashboard", "subscription"];

function renderCenterContent(): string {
  switch (state.workspaceMode) {
    case "dashboard":
      return renderDashboardView();
    case "subscription":
      return renderSubscriptionView();
    case "offices":
    default:
      return `<div class="grid">${renderOfficeCards()}</div>`;
  }
}

function renderDiscussionPanel(): string {
  const office = getActiveOffice();
  if (!office) {
    return `
      <div class="right-title">暂无办公室</div>
      <div class="right-sub">请先在中间区域点击“新建办公室”，再开始配置与讨论。</div>
      <div class="discussion-box">
        <div class="muted">当前还没有可编辑的办公室。创建后将显示目标、成员、会话和人类参与输入。</div>
      </div>
    `;
  }

  const snapshot = getSnapshot(office.officeId);
  const humanDraft = state.humanDraftByOfficeId[office.officeId] ?? "";
  const busyAction = state.busyAction;
  const hasSession = snapshot.sessionId !== "-";
  const isBusy = busyAction !== "none";
  const isRunning = snapshot.status === "running" || snapshot.status === "starting";
  const hasObjective = office.objective.trim().length > 0;
  const canStart = !isBusy && !isRunning && hasObjective;
  const canStop = !isBusy && hasSession && isRunning;
  const canSendHuman = !isBusy && hasSession;
  const syncLabel = busyAction === "syncing-keys" ? "同步中..." : "同步 Keys";
  const startLabel = busyAction === "starting-office" ? "启动中..." : "启动该办公室讨论";
  const stopLabel = busyAction === "stopping-office" ? "停止中..." : "停止";
  const sendLabel = busyAction === "sending-human" ? "发送中..." : "发送到该办公室";

  const memberEditorRows = office.members
    .map(
      (member, index) => `
        <div class="member-editor-row" data-member-row="${index}">
          <label class="check">
            <input type="checkbox" data-member-enabled="${index}" ${member.enabled ? "checked" : ""} />
            启用
          </label>
          <input data-member-id="${index}" value="${escapeHtml(member.participantId)}" placeholder="participant_id" />
          <select data-member-role="${index}">${roleOptions(member.role)}</select>
          <select data-member-provider="${index}">${providerOptions(member.provider)}</select>
          <input data-member-model="${index}" value="${escapeHtml(member.modelId)}" placeholder="model_id" />
        </div>
      `,
    )
    .join("");

  const chunks =
    snapshot.sessionId !== "-"
      ? state.chunks
          .filter((chunk) => chunk.sessionId === snapshot.sessionId)
          .slice(0, 80)
          .reverse()
      : [];

  const chunkHtml =
    chunks.length === 0
      ? `<div class="muted">启动办公室后，这里会显示讨论消息流，你也可以作为人类参与发言。</div>`
      : chunks
          .map(
            (chunk) => `
              <div class="message-item">
                <div class="message-head">${escapeHtml(chunk.participantId)} · 第${chunk.turnIndex}轮</div>
                <div class="message-body">${escapeHtml(chunk.delta)}</div>
              </div>
            `,
          )
          .join("");

  const memberList = office.members
    .map(
      (member) => `
        <div class="member-row">
          <b>${escapeHtml(member.participantId)}</b>
          <span>${escapeHtml(member.role)} · ${escapeHtml(member.modelId)}</span>
          <p>${escapeHtml(roleDescription(member))}</p>
        </div>
      `,
    )
    .join("");

  return `
    <div class="right-title">${escapeHtml(office.officeName)}</div>
    <div class="right-sub">状态：${statusText(snapshot.status)}｜session：${escapeHtml(snapshot.sessionId)}</div>

    <label class="field">
      <span>办公室名称</span>
      <input id="office-name" value="${escapeHtml(office.officeName)}" placeholder="比如：前端评审组" />
    </label>
    <label class="field">
      <span>本轮目标</span>
      <textarea id="office-objective" rows="3" placeholder="明确本轮要达成的目标">${escapeHtml(office.objective)}</textarea>
    </label>
    <label class="field">
      <span>最大轮次（1~20）</span>
      <input id="office-max-rounds" type="number" min="1" max="20" value="${office.maxRounds}" />
    </label>

    <div class="member-editor">
      <div class="member-editor-title">成员配置（启用成员会参与讨论）</div>
      ${memberEditorRows}
    </div>

    <div id="discussion-stream" class="discussion-box">${chunkHtml}</div>

    <label class="field">
      <span>人类参与输入</span>
      <textarea id="human-input" rows="3" placeholder="给这个办公室补充方向、约束或反馈">${escapeHtml(humanDraft)}</textarea>
    </label>

    <div class="actions">
      <button id="btn-send-human" ${canSendHuman ? "" : "disabled"}>${sendLabel}</button>
      <button id="btn-start-office" ${canStart ? "" : "disabled"}>${startLabel}</button>
      <button id="btn-stop-office" ${canStop ? "" : "disabled"}>${stopLabel}</button>
    </div>

    <div class="right-divider"></div>

    <label class="field"><span>OpenAI Key</span><input id="key-openai" type="password" value="${escapeHtml(state.apiKeys.openai)}" /></label>
    <label class="field"><span>Anthropic Key</span><input id="key-anthropic" type="password" value="${escapeHtml(state.apiKeys.anthropic)}" /></label>
    <label class="field"><span>Google Key</span><input id="key-google" type="password" value="${escapeHtml(state.apiKeys.google)}" /></label>
    <label class="field"><span>DeepSeek Key</span><input id="key-deepseek" type="password" value="${escapeHtml(state.apiKeys.deepseek)}" /></label>
    <button id="btn-set-keys" ${isBusy ? "disabled" : ""}>${syncLabel}</button>

    <div class="right-divider"></div>
    <div class="member-list">${memberList}</div>
  `;
}

export function patchDiscussionStream(): void {
  if (state.workspaceMode !== "offices") {
    return;
  }

  const office = getActiveOffice();
  if (!office) {
    return;
  }

  const snapshot = getSnapshot(office.officeId);
  const target = app.querySelector<HTMLDivElement>("#discussion-stream");
  if (!target) {
    return;
  }

  const chunks =
    snapshot.sessionId !== "-"
      ? state.chunks
          .filter((chunk) => chunk.sessionId === snapshot.sessionId)
          .slice(0, 80)
          .reverse()
      : [];

  target.innerHTML =
    chunks.length === 0
      ? `<div class="muted">启动办公室后，这里会显示讨论消息流，你也可以作为人类参与发言。</div>`
      : chunks
          .map(
            (chunk) => `
              <div class="message-item">
                <div class="message-head">${escapeHtml(chunk.participantId)} · 第${chunk.turnIndex}轮</div>
                <div class="message-body">${escapeHtml(chunk.delta)}</div>
              </div>
            `,
          )
          .join("");
}

export function render(): void {
  const office = getActiveOffice();

  const navItems = navModes
    .map(
      (mode) =>
        `<button class="nav-item ${state.workspaceMode === mode ? "active" : ""}" data-nav-mode="${mode}">${navLabel(mode)}</button>`,
    )
    .join("");

  const showRightPanel = state.workspaceMode === "offices";

  app.innerHTML = `
    <div class="frame">
      <header class="topbar">
        <div class="brand">Donkey<br/>Studio</div>
        <div class="engine-status ${state.orchestratorRunning ? "online" : "offline"}">
          引擎：${state.orchestratorRunning ? "在线" : "离线"}
        </div>
      </header>

      <div class="body ${showRightPanel ? "" : "no-right-panel"}">
        <aside class="left-nav">
          ${navItems}
          <div class="nav-spacer"></div>
          <div class="profile">当前用户</div>
        </aside>

        <main class="center">
          ${renderCenterContent()}
        </main>

        ${showRightPanel ? `<aside class="right-panel">${renderDiscussionPanel()}</aside>` : ""}
      </div>
    </div>
    ${renderCreateOfficeModal()}
    ${renderToasts()}
  `;

  bindEvents(office);
}

function bindEvents(office: OfficeDraft | undefined): void {
  // 导航切换
  app.querySelectorAll<HTMLButtonElement>("[data-nav-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.navMode as WorkspaceMode | undefined;
      if (mode && mode !== state.workspaceMode) {
        state.workspaceMode = mode;
        render();
      }
    });
  });

  // 订阅页 tab 切换
  app.querySelectorAll<HTMLButtonElement>("[data-sub-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.subTab;
      state._subTab = tab === "chunks" ? "chunks" : "notifications";
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-office-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const officeId = button.dataset.officeId;
      if (!officeId) {
        return;
      }
      setActiveOffice(officeId);
      const snapshot = getSnapshot(officeId);
      state.sessionId = snapshot.sessionId;
      render();
    });
  });

  app.querySelector<HTMLButtonElement>("#btn-add-office")?.addEventListener("click", () => {
    openCreateOfficeFlow();
    render();
  });

  app.querySelector<HTMLButtonElement>("#btn-flow-cancel")?.addEventListener("click", () => {
    closeCreateOfficeFlow();
    render();
  });

  app.querySelector<HTMLTextAreaElement>("#flow-goal")?.addEventListener("input", (event) => {
    const target = event.currentTarget as HTMLTextAreaElement;
    createOfficeFlow.goal = target.value;
  });

  app.querySelector<HTMLInputElement>("#flow-office-name")?.addEventListener("input", (event) => {
    const target = event.currentTarget as HTMLInputElement;
    createOfficeFlow.officeName = target.value;
  });

  app.querySelector<HTMLInputElement>("#flow-max-rounds")?.addEventListener("input", (event) => {
    const target = event.currentTarget as HTMLInputElement;
    createOfficeFlow.maxRounds = clampRounds(Number(target.value));
  });

  app.querySelector<HTMLInputElement>("#flow-max-rounds")?.addEventListener("blur", () => {
    createOfficeFlow.maxRounds = clampRounds(createOfficeFlow.maxRounds);
    render();
  });

  app.querySelector<HTMLSelectElement>("#flow-plan-count")?.addEventListener("change", (event) => {
    const target = event.currentTarget as HTMLSelectElement;
    createOfficeFlow.planCount = Math.max(2, Math.min(5, Number(target.value) || 3));
    ensureVisibleWorkflowSelection();
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-flow-plan]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.flowPlan as WorkflowOptionId | undefined;
      const option = WORKFLOW_OPTIONS.find((item) => item.id === id);
      if (!option) {
        return;
      }
      createOfficeFlow.selectedPlanId = option.id;
      createOfficeFlow.maxRounds = clampRounds(option.rounds);
      render();
    });
  });

  app.querySelector<HTMLSelectElement>("#flow-provider-strategy")?.addEventListener("change", (event) => {
    const target = event.currentTarget as HTMLSelectElement;
    const strategy = target.value === "single-provider" ? "single-provider" : "recommended";
    createOfficeFlow.providerStrategy = strategy;
    render();
  });

  app.querySelector<HTMLSelectElement>("#flow-single-provider")?.addEventListener("change", (event) => {
    const target = event.currentTarget as HTMLSelectElement;
    const provider = target.value as Provider;
    if (ALL_PROVIDERS.includes(provider)) {
      createOfficeFlow.singleProvider = provider;
      render();
    }
  });

  const flowKeys: Array<keyof typeof state.apiKeys> = ["openai", "anthropic", "google", "deepseek"];
  for (const key of flowKeys) {
    const field = app.querySelector<HTMLInputElement>(`#flow-key-${key}`);
    field?.addEventListener("input", () => {
      state.apiKeys[key] = field.value;
    });
  }

  app.querySelector<HTMLButtonElement>("#btn-flow-sync-keys")?.addEventListener("click", async () => {
    createOfficeFlow.syncState = "syncing";
    createOfficeFlow.syncMessage = "正在同步 Key 到引擎...";
    render();

    const result = await syncKeysWithEngine();
    createOfficeFlow.syncState = result.ok ? "success" : "error";
    createOfficeFlow.syncMessage = result.message;
    if (result.ok) {
      toast("全局 Keys 已同步", "success");
    } else {
      toast(result.message, "error");
    }
    render();
  });

  app.querySelector<HTMLButtonElement>("#btn-flow-create")?.addEventListener("click", async () => {
    const goal = createOfficeFlow.goal.trim();
    const name = createOfficeFlow.officeName.trim();

    if (!goal) {
      toast("请先输入本次 Workerflow 目标", "error");
      return;
    }

    if (!hasAnyConfiguredKey()) {
      createOfficeFlow.syncState = "error";
      createOfficeFlow.syncMessage = "请先配置并同步至少一个 API Key";
      render();
      return;
    }

    addOffice();
    const office = getActiveOffice();
    if (!office) {
      toast("创建办公室失败，请重试", "error");
      return;
    }

    office.officeName = name || nextOfficeNameSuggestion();
    office.objective = goal;
    office.maxRounds = clampRounds(createOfficeFlow.maxRounds);
    office.members = buildFlowMembers(office.officeId);
    state.workspaceMode = "offices";

    const missingProviders = listMissingProvidersForOffice(office);
    if (missingProviders.length > 0) {
      const labels = missingProviders.map((provider) => PROVIDER_LABELS[provider]).join("、");
      closeCreateOfficeFlow();
      toast(`办公室已创建，但缺少 ${labels} 的 Key，请先补充后再启动`, "error");
      render();
      return;
    }

    setBusyAction("syncing-keys");
    render();
    try {
      const syncResult = await syncKeysWithEngine();
      if (!syncResult.ok) {
        toast(syncResult.message, "error");
        return;
      }

      closeCreateOfficeFlow();
      setBusyAction("starting-office");
      render();

      const startResult = await startOfficeDebate();
      if (startResult.ok) {
        toast("办公室已创建并自动开始讨论", "success");
      } else {
        toast(`办公室已创建，但自动启动失败：${startResult.message}`, "error");
      }
    } finally {
      setBusyAction("none");
      render();
    }
  });

  const officeName = app.querySelector<HTMLInputElement>("#office-name");
  officeName?.addEventListener("input", () => {
    if (!office) {
      return;
    }
    office.officeName = officeName.value;
    render();
  });

  const objective = app.querySelector<HTMLTextAreaElement>("#office-objective");
  objective?.addEventListener("input", () => {
    if (!office) {
      return;
    }
    office.objective = objective.value;
    render();
  });

  const maxRounds = app.querySelector<HTMLInputElement>("#office-max-rounds");
  maxRounds?.addEventListener("input", () => {
    if (!office) {
      return;
    }
    office.maxRounds = clampRounds(Number(maxRounds.value));
  });
  maxRounds?.addEventListener("blur", () => {
    if (!office) {
      return;
    }
    office.maxRounds = clampRounds(Number(maxRounds.value));
    render();
  });

  app.querySelectorAll<HTMLInputElement>("[data-member-enabled]").forEach((field) => {
    field.addEventListener("change", () => {
      const index = Number(field.dataset.memberEnabled);
      if (!office) {
        return;
      }
      const target = office.members[index];
      if (!target) {
        return;
      }
      target.enabled = field.checked;
      render();
    });
  });

  app.querySelectorAll<HTMLInputElement>("[data-member-id]").forEach((field) => {
    field.addEventListener("input", () => {
      const index = Number(field.dataset.memberId);
      if (!office) {
        return;
      }
      const target = office.members[index];
      if (!target) {
        return;
      }
      target.participantId = field.value;
    });
    field.addEventListener("blur", () => {
      const index = Number(field.dataset.memberId);
      if (!office) {
        return;
      }
      const target = office.members[index];
      if (!target) {
        return;
      }
      target.participantId = target.participantId.trim() || `${office.officeId}-member-${index + 1}`;
      render();
    });
  });

  app.querySelectorAll<HTMLSelectElement>("[data-member-role]").forEach((field) => {
    field.addEventListener("change", () => {
      const index = Number(field.dataset.memberRole);
      if (!office) {
        return;
      }
      const target = office.members[index];
      if (!target) {
        return;
      }
      target.role = field.value as Role;
      render();
    });
  });

  app.querySelectorAll<HTMLSelectElement>("[data-member-provider]").forEach((field) => {
    field.addEventListener("change", () => {
      const index = Number(field.dataset.memberProvider);
      if (!office) {
        return;
      }
      const target = office.members[index];
      if (!target) {
        return;
      }
      target.provider = field.value as Provider;
      render();
    });
  });

  app.querySelectorAll<HTMLInputElement>("[data-member-model]").forEach((field) => {
    field.addEventListener("input", () => {
      const index = Number(field.dataset.memberModel);
      if (!office) {
        return;
      }
      const target = office.members[index];
      if (!target) {
        return;
      }
      target.modelId = field.value;
    });
    field.addEventListener("blur", () => {
      const index = Number(field.dataset.memberModel);
      if (!office) {
        return;
      }
      const target = office.members[index];
      if (!target) {
        return;
      }
      target.modelId = target.modelId.trim();
      render();
    });
  });

  const keys: Array<keyof typeof state.apiKeys> = ["openai", "anthropic", "google", "deepseek"];
  for (const key of keys) {
    const field = app.querySelector<HTMLInputElement>(`#key-${key}`);
    field?.addEventListener("input", () => {
      state.apiKeys[key] = field.value;
    });
  }

  const humanInput = app.querySelector<HTMLTextAreaElement>("#human-input");
  humanInput?.addEventListener("input", () => {
    if (!office) {
      return;
    }
    state.humanDraftByOfficeId[office.officeId] = humanInput.value;
  });

  app.querySelector<HTMLButtonElement>("#btn-set-keys")?.addEventListener("click", async () => {
    setBusyAction("syncing-keys");
    render();
    try {
      const result = await syncKeysWithEngine();
      toast(result.message, result.ok ? "success" : "error");
    } finally {
      setBusyAction("none");
      render();
    }
  });

  app.querySelector<HTMLButtonElement>("#btn-start-office")?.addEventListener("click", async () => {
    if (!office) {
      toast("请先新建办公室", "error");
      return;
    }

    if (!office.objective.trim()) {
      toast("请先填写办公室目标", "error");
      return;
    }

    const missingProviders = listMissingProvidersForOffice(office);
    if (missingProviders.length > 0) {
      const labels = missingProviders.map((provider) => PROVIDER_LABELS[provider]).join("、");
      toast(`缺少 ${labels} 的 API Key，请先在右侧同步 Keys`, "error");
      return;
    }

    setBusyAction("starting-office");
    render();
    try {
      const syncResult = await syncKeysWithEngine();
      if (!syncResult.ok) {
        toast(syncResult.message, "error");
        return;
      }
      const result = await startOfficeDebate();
      toast(result.message, result.ok ? "success" : "error");
    } finally {
      setBusyAction("none");
      render();
    }
  });

  app.querySelector<HTMLButtonElement>("#btn-stop-office")?.addEventListener("click", async () => {
    setBusyAction("stopping-office");
    render();
    try {
      const result = await stopOfficeDebate();
      toast(result.message, result.ok ? "success" : "error");
    } finally {
      setBusyAction("none");
      render();
    }
  });

  app.querySelector<HTMLButtonElement>("#btn-send-human")?.addEventListener("click", async () => {
    if (!office) {
      toast("请先新建办公室", "error");
      return;
    }

    const input = app.querySelector<HTMLTextAreaElement>("#human-input");
    const text = input?.value ?? "";
    if (!text.trim()) {
      return;
    }
    const snapshot = getSnapshot(office.officeId);
    state.sessionId = snapshot.sessionId;

    setBusyAction("sending-human");
    render();
    try {
      const result = await sendOfficeChat(text);
      toast(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        state.humanDraftByOfficeId[office.officeId] = "";
        if (input) {
          input.value = "";
        }
      }
    } finally {
      setBusyAction("none");
      render();
    }
  });
}

export function mountStyles(): void {
  if (document.getElementById("donkey-studio-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "donkey-studio-style";
  style.textContent = `
    :root {
      color-scheme: light;
      --bg: #f3f5f8;
      --panel: #ffffff;
      --line: #d6deea;
      --text: #1f2937;
      --muted: #6f7d92;
      --card: #f7f9fc;
      --accent: #2f6fed;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      background: radial-gradient(circle at 20% -20%, #e8eef9 0%, var(--bg) 42%, #eff2f7 100%);
      color: var(--text);
      font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    }
    #app { padding: 12px; }
    .frame {
      border: 1px solid var(--line);
      border-radius: 10px;
      min-height: calc(100vh - 24px);
      background: var(--panel);
      overflow: hidden;
    }
    .topbar {
      height: 72px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px;
      background: #f8fafd;
    }
    .brand {
      font-size: 20px;
      font-weight: 700;
      line-height: 1.05;
    }
    .engine-status {
      font-size: 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 6px 10px;
      color: var(--muted);
      background: #f4f7fd;
    }
    .engine-status.online {
      color: #235ac7;
      border-color: #8eaee9;
    }
    .engine-status.offline {
      color: #6b7280;
      border-color: #c0c8d6;
    }
    .body {
      display: grid;
      grid-template-columns: 220px 1fr 360px;
      min-height: calc(100vh - 96px);
    }
    .left-nav {
      border-right: 1px solid var(--line);
      display: grid;
      grid-template-rows: repeat(3, 56px) 1fr auto;
      background: #f5f7fb;
    }
    .nav-item {
      border: 0;
      border-bottom: 1px solid var(--line);
      background: transparent;
      color: var(--text);
      font-size: 15px;
      text-align: left;
      padding: 0 14px;
      cursor: pointer;
    }
    .nav-item.active {
      font-weight: 700;
      background: #e8f0ff;
    }
    .nav-spacer { border-bottom: 1px solid var(--line); }
    .profile {
      font-size: 14px;
      padding: 14px;
      color: var(--muted);
      border-top: 1px solid var(--line);
    }
    .center {
      border-right: 1px solid var(--line);
      padding: 16px;
      overflow: auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(180px, 1fr));
      gap: 14px;
    }
    .office-card {
      min-height: 156px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--card);
      color: var(--text);
      text-align: left;
      padding: 12px;
      cursor: pointer;
      display: grid;
      align-content: start;
      gap: 6px;
      transition: border-color 120ms ease, transform 120ms ease;
    }
    .office-card:hover {
      border-color: var(--accent);
      transform: translateY(-1px);
    }
    .office-card.active {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px rgba(47, 111, 237, 0.25) inset;
    }
    .office-card.add {
      place-items: center;
      display: grid;
      text-align: center;
      font-size: 20px;
      color: #2f6fed;
      border-style: dashed;
      background: #f3f7ff;
    }
    .office-title { font-size: 16px; font-weight: 700; }
    .office-line {
      color: #4a5c75;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .office-meta { color: var(--muted); font-size: 12px; margin-top: auto; }
    .right-panel {
      padding: 14px;
      overflow: auto;
      background: #f8fafd;
    }
    .right-title { font-size: 18px; font-weight: 700; }
    .right-sub { color: var(--muted); font-size: 12px; margin-top: 4px; }
    .discussion-box {
      margin-top: 12px;
      border: 1px solid var(--line);
      border-radius: 10px;
      min-height: 220px;
      max-height: 320px;
      overflow: auto;
      padding: 10px;
      background: #ffffff;
    }
    .message-item {
      margin-bottom: 8px;
      border: 1px solid #d6deea;
      border-radius: 8px;
      padding: 8px;
      background: #f2f6ff;
    }
    .message-head { font-size: 12px; color: #2f6fed; margin-bottom: 4px; }
    .message-body { font-size: 12px; white-space: pre-wrap; word-break: break-word; }
    .field { display: grid; gap: 4px; margin-top: 10px; }
    .field span { color: var(--muted); font-size: 12px; }
    input, textarea, select {
      width: 100%;
      background: #ffffff;
      color: var(--text);
      border: 1px solid #c8d4e8;
      border-radius: 8px;
      padding: 8px;
      font-size: 13px;
    }
    input, textarea, select, button {
      outline: none;
    }
    input:focus-visible, textarea:focus-visible, select:focus-visible, button:focus-visible {
      box-shadow: 0 0 0 2px rgba(47, 111, 237, 0.22);
      border-color: #5d8cef;
    }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    button {
      border: 1px solid #95b2e9;
      background: #edf3ff;
      color: #1f3f7f;
      border-radius: 8px;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 13px;
    }
    button:hover { background: #dbe8ff; }
    button:disabled { opacity: 0.45; cursor: not-allowed; }
    .danger { border-color: #d6a0a0; background: #fff2f2; color: #7a2f2f; }
    .danger:hover { background: #ffe5e5; }
    .right-divider { border-top: 1px dashed #c4d2e8; margin: 14px 0; }
    .member-list { display: grid; gap: 8px; }
    .member-row { border: 1px solid #d6deea; border-radius: 8px; padding: 8px; background: #ffffff; }
    .member-row b { display: block; font-size: 13px; }
    .member-row span { color: #2f6fed; font-size: 12px; }
    .member-row p { margin: 4px 0 0; color: #4a5c75; font-size: 12px; }
    .member-editor {
      margin-top: 12px;
      border: 1px solid #d6deea;
      border-radius: 10px;
      background: #ffffff;
      padding: 10px;
      display: grid;
      gap: 8px;
    }
    .member-editor-title {
      font-size: 12px;
      font-weight: 600;
      color: #3b4f73;
    }
    .member-editor-row {
      display: grid;
      grid-template-columns: 56px 1fr 104px 104px 1fr;
      gap: 6px;
      align-items: center;
    }
    .check {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #4a5c75;
    }
    .check input {
      width: 14px;
      height: 14px;
      margin: 0;
      padding: 0;
    }
    .toast-stack {
      position: fixed;
      right: 20px;
      bottom: 20px;
      display: grid;
      gap: 8px;
      z-index: 999;
      max-width: 360px;
    }
    .toast {
      border-radius: 10px;
      border: 1px solid #d6deea;
      background: #ffffff;
      padding: 10px 12px;
      font-size: 12px;
      color: #1f2937;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
    }
    .toast-success {
      border-color: #8bd0a3;
      background: #edfbf2;
      color: #14532d;
    }
    .toast-error {
      border-color: #efb4b4;
      background: #fff2f2;
      color: #7f1d1d;
    }
    .toast-info {
      border-color: #b8c7e7;
      background: #f3f7ff;
      color: #1e3a8a;
    }

    /* Create flow modal */
    .flow-modal-mask {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      display: grid;
      place-items: center;
      z-index: 800;
      padding: 24px;
    }
    .flow-modal {
      width: min(980px, calc(100vw - 32px));
      max-height: calc(100vh - 32px);
      overflow: auto;
      border: 1px solid #c6d4eb;
      border-radius: 14px;
      background: #ffffff;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
      display: grid;
      grid-template-rows: auto 1fr auto;
    }
    .flow-modal-head {
      border-bottom: 1px solid #d6deea;
      padding: 12px 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      position: sticky;
      top: 0;
      background: #ffffff;
      z-index: 1;
    }
    .flow-modal-title {
      font-size: 18px;
      font-weight: 700;
    }
    .flow-modal-sub {
      margin-top: 4px;
      font-size: 12px;
      color: #66768f;
    }
    .flow-modal-body {
      padding: 14px;
      display: grid;
      gap: 12px;
    }
    .flow-section {
      border: 1px solid #d6deea;
      border-radius: 10px;
      padding: 10px;
      background: #f9fbff;
    }
    .flow-alert {
      border-color: #f0b8b8;
      background: #fff6f6;
    }
    .flow-section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1f3f7f;
      margin-bottom: 8px;
    }
    .flow-plan-grid {
      margin-top: 8px;
      display: grid;
      grid-template-columns: repeat(2, minmax(220px, 1fr));
      gap: 8px;
    }
    .flow-plan-card {
      border: 1px solid #c8d4e8;
      border-radius: 10px;
      background: #ffffff;
      text-align: left;
      padding: 10px;
      display: grid;
      gap: 6px;
      cursor: pointer;
    }
    .flow-plan-card.active {
      border-color: #2f6fed;
      box-shadow: 0 0 0 1px rgba(47, 111, 237, 0.2) inset;
      background: #eef4ff;
    }
    .flow-plan-title {
      font-size: 13px;
      font-weight: 700;
      color: #1f3f7f;
    }
    .flow-plan-summary {
      font-size: 12px;
      color: #4a5c75;
      line-height: 1.45;
    }
    .flow-plan-meta {
      font-size: 11px;
      color: #5d6f8f;
    }
    .flow-preview-box {
      margin-top: 10px;
      border: 1px dashed #c4d2e8;
      border-radius: 10px;
      background: #ffffff;
      padding: 8px;
      display: grid;
      gap: 6px;
    }
    .flow-preview-title {
      font-size: 12px;
      font-weight: 700;
      color: #3b4f73;
    }
    .flow-preview-row {
      display: grid;
      grid-template-columns: 110px 120px 1fr;
      gap: 8px;
      font-size: 12px;
      color: #334155;
      align-items: center;
    }
    .flow-preview-role {
      font-weight: 600;
      color: #1f3f7f;
    }
    .flow-preview-provider {
      color: #2f6fed;
    }
    .flow-preview-model {
      color: #475569;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .flow-sync-msg {
      margin-top: 8px;
      font-size: 12px;
      color: #475569;
    }
    .flow-sync-success {
      color: #166534;
    }
    .flow-sync-error {
      color: #b91c1c;
    }
    .flow-modal-foot {
      border-top: 1px solid #d6deea;
      padding: 12px 14px;
      display: flex;
      justify-content: flex-end;
      background: #ffffff;
      position: sticky;
      bottom: 0;
    }
    .muted { color: var(--muted); font-size: 12px; }

    /* no-right-panel 布局 */
    .body.no-right-panel {
      grid-template-columns: 220px 1fr;
    }

    /* Dashboard 视图 */
    .dashboard-view, .subscription-view {
      padding: 4px 0;
    }
    .view-title {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }
    .view-desc {
      color: var(--muted);
      font-size: 13px;
      margin: 0 0 16px 0;
    }
    .dash-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .dash-card {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 14px;
      background: var(--card);
    }
    .dash-card-label {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .dash-card-value {
      font-size: 22px;
      font-weight: 700;
    }
    .dash-section {
      margin-bottom: 20px;
    }
    .dash-section h3 {
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 10px 0;
    }
    .dash-table-wrap {
      overflow-x: auto;
    }
    .dash-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .dash-table th, .dash-table td {
      border-bottom: 1px solid var(--line);
      padding: 8px 10px;
      text-align: left;
    }
    .dash-table th {
      color: var(--muted);
      font-weight: 500;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-cell {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
    }
    .status-idle { background: #eef3fb; color: #64748b; }
    .status-starting { background: #fff7e6; color: #b7791f; }
    .status-running { background: #eaf8f0; color: #2f855a; }
    .status-completed { background: #e7f0ff; color: #2b6cb0; }
    .status-stopped { background: #f3f4f6; color: #6b7280; }
    .status-error { background: #fdecec; color: #c53030; }
    .log-box {
      border: 1px solid var(--line);
      border-radius: 10px;
      max-height: 300px;
      overflow: auto;
      padding: 10px;
      background: #ffffff;
      font-family: "Cascadia Code", "Fira Code", monospace;
    }
    .log-line {
      font-size: 11px;
      color: #4a5c75;
      padding: 2px 0;
      border-bottom: 1px solid #e5ebf5;
      word-break: break-all;
    }

    /* 订阅视图 */
    .sub-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    .sub-tab {
      border: 1px solid var(--line);
      background: transparent;
      color: var(--muted);
      border-radius: 8px;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 13px;
    }
    .sub-tab.active {
      background: #e8f0ff;
      color: #1f3f7f;
      border-color: var(--accent);
      font-weight: 600;
    }
    .sub-content {
      max-height: calc(100vh - 280px);
      overflow: auto;
    }
    .sub-event-item {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 8px;
      background: var(--card);
    }
    .sub-event-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .sub-event-method {
      font-size: 13px;
      font-weight: 600;
      color: var(--accent);
    }
    .sub-event-time {
      font-size: 11px;
      color: var(--muted);
    }
    .sub-event-body {
      font-size: 11px;
      color: #4a5c75;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
      max-height: 120px;
      overflow: auto;
      background: #f8fafd;
      border-radius: 6px;
      padding: 6px;
    }
    .sub-chunk-item {
      border: 1px solid #d6deea;
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 8px;
      background: #f2f6ff;
    }
    .sub-chunk-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .sub-chunk-participant {
      font-size: 13px;
      font-weight: 600;
      color: #2f6fed;
    }
    .sub-chunk-meta {
      font-size: 11px;
      color: var(--muted);
    }
    .sub-chunk-body {
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    @media (max-width: 1600px) {
      .body { grid-template-columns: 180px 1fr 320px; }
      .body.no-right-panel { grid-template-columns: 180px 1fr; }
      .grid { grid-template-columns: repeat(2, minmax(180px, 1fr)); }
      .dash-summary-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 1200px) {
      .body { grid-template-columns: 1fr; }
      .body.no-right-panel { grid-template-columns: 1fr; }
      .left-nav, .right-panel { border-right: 0; border-top: 1px solid var(--line); }
      .left-nav { grid-template-rows: repeat(3, 48px) auto; }
      .dash-summary-grid { grid-template-columns: 1fr 1fr; }
      .member-editor-row { grid-template-columns: 56px 1fr; }
      .flow-plan-grid { grid-template-columns: 1fr; }
      .flow-preview-row { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}
