import {
  executeWorkflowScript,
  refreshOrchestratorStatus,
  sendGuideChat,
  sendOfficeChat,
  setKeys,
  startOfficeDebate,
  startOrchestrator,
  stopOfficeDebate,
} from "./rpc";
import {
  addOffice,
  closeGuideFlow,
  dismissToast,
  getActiveOffice,
  guideFlow,
  openGuideFlow,
  pushGuideMessage,
  pushToast,
  saveSettings,
  setActiveOffice,
  setBusyAction,
  setGuidePhase,
  state,
} from "./state";
import type {
  GlobalApiConfig,
  GuideAction,
  OfficeDraft,
  OfficeMember,
  OfficeSnapshot,
  Provider,
  Role,
  WorkspaceMode,
} from "./types";
import { escapeHtml, renderMarkdown } from "./utils";

function isThinkingPlaceholder(text: string): boolean {
  return /^\[[^\]]+ thinking\.\.\.\]\s*$/.test(text.trim());
}

function hasGuideStreamedReplySince(anchorMessageId: number): boolean {
  const anchorIndex = guideFlow.messages.findIndex((message) => message.id === anchorMessageId);
  const candidates = anchorIndex >= 0 ? guideFlow.messages.slice(anchorIndex + 1) : guideFlow.messages;

  return candidates.some((message) => {
    if (
      message.sender !== "ai" ||
      message.text.includes("⚠️ 本轮回复失败")
    ) {
      return false;
    }

    const [, ...bodyLines] = message.text.split("\n");
    const body = bodyLines.join("\n").trim();
    return body.length > 0 && !isThinkingPlaceholder(body);
  });
}

function appendGuideOutputsFallback(
  outputs: Array<{
    participantId: string;
    status: string;
    content: string;
    latencyMs?: number;
    errorCode?: string;
    errorMessage?: string;
  }>,
  anchorMessageId: number,
): void {
  if (outputs.length === 0) {
    return;
  }

  const hasStreamedReply = hasGuideStreamedReplySince(anchorMessageId);

  if (hasStreamedReply) {
    return;
  }

  for (const output of outputs) {
    const label = `🤖 ${output.participantId}`;
    if (output.status === "success" && output.content.trim()) {
      pushGuideMessage("ai", `${label}\n${output.content}`);
    } else {
      const reason = output.errorMessage?.trim();
      const code = output.errorCode?.trim();
      const detail =
        reason && code
          ? `${code}: ${reason}`
          : reason
          ? reason
          : code
          ? code
          : output.status;
      pushGuideMessage("ai", `${label}\n⚠️ 本轮回复失败（${detail}）`);
    }
  }
}

const app = document.querySelector<HTMLDivElement>("#app")!;
if (!app) {
  throw new Error("#app not found");
}

const ALL_PROVIDERS: Provider[] = [
  "openai",
  "openai_compatible",
  "anthropic",
  "google",
  "deepseek",
];

const PROVIDER_LABELS: Record<Provider, string> = {
  openai: "OpenAI",
  openai_compatible: "OpenAI Compatible",
  anthropic: "Anthropic",
  google: "Google",
  deepseek: "DeepSeek",
};

type OpenAICompatibleTemplate = {
  id: string;
  label: string;
  endpoint: string;
};

type AnthropicCompatibleTemplate = {
  id: string;
  label: string;
  endpoint: string;
};

const OPENAI_COMPATIBLE_TEMPLATES: OpenAICompatibleTemplate[] = [
  {
    id: "openrouter",
    label: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
  },
  {
    id: "groq",
    label: "Groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    id: "siliconflow",
    label: "SiliconFlow",
    endpoint: "https://api.siliconflow.cn/v1/chat/completions",
  },
  {
    id: "together",
    label: "Together AI",
    endpoint: "https://api.together.xyz/v1/chat/completions",
  },
  {
    id: "deepinfra",
    label: "DeepInfra",
    endpoint: "https://api.deepinfra.com/v1/openai/chat/completions",
  },
  {
    id: "fireworks",
    label: "Fireworks AI",
    endpoint: "https://api.fireworks.ai/inference/v1/chat/completions",
  },
  {
    id: "volcengine-ark",
    label: "Volcengine Ark",
    endpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
  },
  {
    id: "dashscope-compatible",
    label: "DashScope Compatible",
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  },
  {
    id: "rightcode-openai",
    label: "RightCode (OpenAI)",
    endpoint: "https://right.codes/codex/v1/chat/completions",
  },
  {
    id: "custom",
    label: "自定义",
    endpoint: "",
  },
];

const ANTHROPIC_COMPATIBLE_TEMPLATES: AnthropicCompatibleTemplate[] = [
  {
    id: "anthropic-official",
    label: "Anthropic 官方",
    endpoint: "https://api.anthropic.com",
  },
  {
    id: "aws-bedrock-anthropic",
    label: "AWS Bedrock (Anthropic)",
    endpoint: "https://bedrock-runtime.us-east-1.amazonaws.com",
  },
  {
    id: "rightcode-anthropic",
    label: "RightCode (Claude)",
    endpoint: "https://www.right.codes/claude-aws",
  },
  {
    id: "custom",
    label: "自定义",
    endpoint: "",
  },
];

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

type ApiKeyPanelScope = "side" | "flow";

type ApiKeyPanelState = {
  initialized: boolean;
  visibleProviders: Provider[];
  expandedByProvider: Partial<Record<Provider, boolean>>;
};

const apiKeyPanels: Record<ApiKeyPanelScope, ApiKeyPanelState> = {
  side: {
    initialized: false,
    visibleProviders: [],
    expandedByProvider: {},
  },
  flow: {
    initialized: false,
    visibleProviders: [],
    expandedByProvider: {},
  },
};

function scopePrefix(scope: ApiKeyPanelScope): "side" | "flow" {
  return scope;
}

function keyInputId(scope: ApiKeyPanelScope, provider: Provider): string {
  if (scope === "flow") {
    return `flow-key-${provider}`;
  }
  return `key-${provider}`;
}

function openaiTemplateId(scope: ApiKeyPanelScope): string {
  return scope === "flow" ? "flow-openai-compatible-template" : "openai-compatible-template";
}

function openaiEndpointId(scope: ApiKeyPanelScope): string {
  return scope === "flow" ? "flow-openai-compatible-endpoint" : "openai-compatible-endpoint";
}

function anthropicTemplateId(scope: ApiKeyPanelScope): string {
  return scope === "flow" ? "flow-anthropic-compatible-template" : "anthropic-compatible-template";
}

function anthropicEndpointId(scope: ApiKeyPanelScope): string {
  return scope === "flow" ? "flow-anthropic-compatible-endpoint" : "anthropic-compatible-endpoint";
}

function hasProviderPersistedConfig(provider: Provider): boolean {
  if (state.apiKeys[provider].trim().length > 0) {
    return true;
  }

  if (provider === "openai_compatible" && state.openaiCompatibleEndpoint.trim().length > 0) {
    return true;
  }

  if (provider === "anthropic" && state.anthropicCompatibleEndpoint.trim().length > 0) {
    return true;
  }

  return false;
}

function ensureApiKeyPanelInitialized(scope: ApiKeyPanelScope): void {
  const panel = apiKeyPanels[scope];
  if (panel.initialized) {
    return;
  }

  const visible = ALL_PROVIDERS.filter((provider) => hasProviderPersistedConfig(provider));
  if (visible.length === 0) {
    visible.push("openai");
  }

  panel.visibleProviders = visible;
  panel.expandedByProvider = Object.fromEntries(visible.map((provider) => [provider, true]));
  panel.initialized = true;
}

function ensureConfiguredProvidersVisible(scope: ApiKeyPanelScope): void {
  ensureApiKeyPanelInitialized(scope);
  const panel = apiKeyPanels[scope];

  for (const provider of ALL_PROVIDERS) {
    if (!hasProviderPersistedConfig(provider)) {
      continue;
    }
    if (!panel.visibleProviders.includes(provider)) {
      panel.visibleProviders.push(provider);
      panel.expandedByProvider[provider] = true;
    }
  }

  if (panel.visibleProviders.length === 0) {
    panel.visibleProviders.push("openai");
    panel.expandedByProvider.openai = true;
  }
}

function getHiddenProviders(scope: ApiKeyPanelScope): Provider[] {
  ensureConfiguredProvidersVisible(scope);
  const panel = apiKeyPanels[scope];
  return ALL_PROVIDERS.filter((provider) => !panel.visibleProviders.includes(provider));
}

function isProviderExpanded(scope: ApiKeyPanelScope, provider: Provider): boolean {
  ensureConfiguredProvidersVisible(scope);
  const panel = apiKeyPanels[scope];
  const value = panel.expandedByProvider[provider];
  return value !== false;
}

function toggleProviderExpanded(scope: ApiKeyPanelScope, provider: Provider): void {
  const panel = apiKeyPanels[scope];
  panel.expandedByProvider[provider] = !isProviderExpanded(scope, provider);
}

function addProviderToPanel(scope: ApiKeyPanelScope, provider: Provider): void {
  const panel = apiKeyPanels[scope];
  if (!panel.visibleProviders.includes(provider)) {
    panel.visibleProviders.push(provider);
  }
  panel.expandedByProvider[provider] = true;
}

function asApiKeyScope(value: string | undefined): ApiKeyPanelScope | undefined {
  if (value === "side" || value === "flow") {
    return value;
  }
  return undefined;
}

function asProvider(value: string | undefined): Provider | undefined {
  if (!value) {
    return undefined;
  }

  const provider = value as Provider;
  if (ALL_PROVIDERS.includes(provider)) {
    return provider;
  }
  return undefined;
}

function renderProviderForm(scope: ApiKeyPanelScope, provider: Provider): string {
  const keyId = keyInputId(scope, provider);

  if (provider === "openai_compatible") {
    return `
      <label class="field"><span>OpenAI Compatible Key</span><input id="${keyId}" type="password" value="${escapeHtml(state.apiKeys.openai_compatible)}" /></label>
      <label class="field"><span>OpenAI Compatible 模板</span><select id="${openaiTemplateId(scope)}">${renderOpenAICompatibleTemplateOptions(state.openaiCompatibleEndpoint)}</select></label>
      <label class="field"><span>OpenAI Compatible Base URL</span><input id="${openaiEndpointId(scope)}" value="${escapeHtml(state.openaiCompatibleEndpoint)}" placeholder="例如：https://api.groq.com/openai/v1 或 .../v1/chat/completions" /></label>
    `;
  }

  if (provider === "anthropic") {
    return `
      <label class="field"><span>Anthropic Key</span><input id="${keyId}" type="password" value="${escapeHtml(state.apiKeys.anthropic)}" /></label>
      <label class="field"><span>Anthropic Compatible 模板</span><select id="${anthropicTemplateId(scope)}">${renderAnthropicCompatibleTemplateOptions(state.anthropicCompatibleEndpoint)}</select></label>
      <label class="field"><span>Anthropic Compatible Base URL</span><input id="${anthropicEndpointId(scope)}" value="${escapeHtml(state.anthropicCompatibleEndpoint)}" placeholder="例如：https://api.anthropic.com" /></label>
    `;
  }

  if (provider === "openai") {
    return `<label class="field"><span>OpenAI Key</span><input id="${keyId}" type="password" value="${escapeHtml(state.apiKeys.openai)}" /></label>`;
  }

  if (provider === "google") {
    return `<label class="field"><span>Google Key</span><input id="${keyId}" type="password" value="${escapeHtml(state.apiKeys.google)}" /></label>`;
  }

  return `<label class="field"><span>DeepSeek Key</span><input id="${keyId}" type="password" value="${escapeHtml(state.apiKeys.deepseek)}" /></label>`;
}

function renderApiKeyEditor(scope: ApiKeyPanelScope): string {
  ensureConfiguredProvidersVisible(scope);
  const panel = apiKeyPanels[scope];
  const hiddenProviders = getHiddenProviders(scope);
  const prefix = scopePrefix(scope);

  const cards = panel.visibleProviders
    .map((provider) => {
      const expanded = isProviderExpanded(scope, provider);
      return `
        <div class="provider-card">
          <button
            class="provider-card-head"
            data-api-provider-toggle="1"
            data-api-scope="${scope}"
            data-api-provider="${provider}"
          >
            <span>${escapeHtml(PROVIDER_LABELS[provider])}</span>
            <span>${expanded ? "▾" : "▸"}</span>
          </button>
          ${expanded ? `<div class="provider-card-body">${renderProviderForm(scope, provider)}</div>` : ""}
        </div>
      `;
    })
    .join("");

  const addOptions = hiddenProviders
    .map((provider) => `<option value="${provider}">${escapeHtml(PROVIDER_LABELS[provider])}</option>`)
    .join("");

  return `
    <div class="provider-manager">
      <div class="provider-toolbar">
        <span class="provider-toolbar-label">API 提供商</span>
        ${hiddenProviders.length > 0
          ? `
            <div class="provider-add-row">
              <select id="${prefix}-add-provider-select">${addOptions}</select>
              <button id="${prefix}-add-provider-btn" data-api-provider-add="1" data-api-scope="${scope}">＋</button>
            </div>
          `
          : `<span class="muted">已添加全部可选提供商</span>`}
      </div>
      <div class="provider-card-list">${cards}</div>
    </div>
  `;
}

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
    .map(
      (provider) =>
        `<option value="${provider}" ${provider === current ? "selected" : ""}>${escapeHtml(PROVIDER_LABELS[provider])}</option>`,
    )
    .join("");
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.trim().replace(/\/+$/, "").toLowerCase();
}

function detectOpenAICompatibleTemplateId(endpoint: string): string {
  const target = normalizeEndpoint(endpoint);
  if (!target) {
    return "custom";
  }

  for (const template of OPENAI_COMPATIBLE_TEMPLATES) {
    if (!template.endpoint) {
      continue;
    }
    if (normalizeEndpoint(template.endpoint) === target) {
      return template.id;
    }
  }

  return "custom";
}

function renderOpenAICompatibleTemplateOptions(endpoint: string): string {
  const selectedId = detectOpenAICompatibleTemplateId(endpoint);
  return OPENAI_COMPATIBLE_TEMPLATES.map(
    (template) =>
      `<option value="${template.id}" ${template.id === selectedId ? "selected" : ""}>${escapeHtml(template.label)}</option>`,
  ).join("");
}

function applyOpenAICompatibleTemplate(templateId: string): void {
  const template = OPENAI_COMPATIBLE_TEMPLATES.find((item) => item.id === templateId);
  if (!template || !template.endpoint) {
    return;
  }
  state.openaiCompatibleEndpoint = template.endpoint;
}

function normalizeAnthropicEndpoint(endpoint: string): string {
  return endpoint.trim().replace(/\/+$/, "").toLowerCase();
}

function detectAnthropicCompatibleTemplateId(endpoint: string): string {
  const target = normalizeAnthropicEndpoint(endpoint);
  if (!target) {
    return "custom";
  }

  for (const template of ANTHROPIC_COMPATIBLE_TEMPLATES) {
    if (!template.endpoint) {
      continue;
    }
    if (normalizeAnthropicEndpoint(template.endpoint) === target) {
      return template.id;
    }
  }

  return "custom";
}

function renderAnthropicCompatibleTemplateOptions(endpoint: string): string {
  const selectedId = detectAnthropicCompatibleTemplateId(endpoint);
  return ANTHROPIC_COMPATIBLE_TEMPLATES.map(
    (template) =>
      `<option value="${template.id}" ${template.id === selectedId ? "selected" : ""}>${escapeHtml(template.label)}</option>`,
  ).join("");
}

function applyAnthropicCompatibleTemplate(templateId: string): void {
  const template = ANTHROPIC_COMPATIBLE_TEMPLATES.find((item) => item.id === templateId);
  if (!template || !template.endpoint) {
    return;
  }
  state.anthropicCompatibleEndpoint = template.endpoint;
}

function hasProviderKey(provider: Provider): boolean {
  return state.apiKeys[provider].trim().length > 0;
}

function getActiveGlobalApi(): GlobalApiConfig | undefined {
  return state.globalApis[state.activeGlobalApiIndex] ?? state.globalApis[0];
}

function hasGlobalApiConfig(): boolean {
  const active = getActiveGlobalApi();
  if (!active) {
    return false;
  }
  const modelReady = active.modelId.trim().length > 0;
  const keyReady =
    active.apiKey.trim().length > 0 || hasProviderKey(active.provider);
  return modelReady && keyReady;
}

function hasAnyGlobalApiConfig(): boolean {
  return state.globalApis.some((api) => {
    const modelReady = api.modelId.trim().length > 0;
    const keyReady = api.apiKey.trim().length > 0 || hasProviderKey(api.provider);
    return modelReady && keyReady;
  });
}

function applyGlobalApiToRuntime(): void {
  for (const api of state.globalApis) {
    const key = api.apiKey.trim();
    if (key) {
      state.apiKeys[api.provider] = key;
    }

    const endpoint = api.endpoint.trim();
    if (api.provider === "openai_compatible" && endpoint) {
      state.openaiCompatibleEndpoint = endpoint;
    }
    if (api.provider === "anthropic" && endpoint) {
      state.anthropicCompatibleEndpoint = endpoint;
    }
  }
}

function getConfiguredProviders(): Provider[] {
  const configured = ALL_PROVIDERS.filter((provider) => hasProviderKey(provider));
  for (const api of state.globalApis) {
    const modelReady = api.modelId.trim().length > 0;
    const keyReady = api.apiKey.trim().length > 0 || hasProviderKey(api.provider);
    if (modelReady && keyReady && !configured.includes(api.provider)) {
      configured.push(api.provider);
    }
  }
  return configured;
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
    openai_compatible: "gpt-4o-mini",
    anthropic: "claude-3-5-sonnet",
    google: "gemini-1.5-pro",
    deepseek: "deepseek-chat",
  };
  return map[provider];
}

function pickProviderForRole(role: Role, available: Provider[], fallback: Provider): Provider {
  const preference: Record<Role, Provider[]> = {
    proposer: ["openai", "openai_compatible", "deepseek", "anthropic", "google"],
    critic: ["anthropic", "openai", "openai_compatible", "google", "deepseek"],
    synthesizer: ["openai", "openai_compatible", "anthropic", "google", "deepseek"],
    arbiter: ["anthropic", "openai", "openai_compatible", "google", "deepseek"],
    researcher: ["google", "deepseek", "openai_compatible", "openai", "anthropic"],
    verifier: ["google", "openai", "openai_compatible", "anthropic", "deepseek"],
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
      endpoint:
        provider === "openai_compatible"
          ? state.openaiCompatibleEndpoint.trim()
          : provider === "anthropic"
          ? state.anthropicCompatibleEndpoint.trim()
          : "",
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

function buildInstantOfficeMembers(officeId: string): OfficeMember[] {
  const roles: Role[] = ["proposer", "critic", "synthesizer"];

  if (hasGlobalApiConfig()) {
    const active = getActiveGlobalApi()!;
    const provider = active.provider;
    const modelId = active.modelId.trim() || defaultModelByProvider(provider);
    const endpoint =
      active.endpoint.trim() ||
      (provider === "openai_compatible"
        ? state.openaiCompatibleEndpoint.trim()
        : provider === "anthropic"
        ? state.anthropicCompatibleEndpoint.trim()
        : "");
    const apiKey = active.apiKey.trim();

    return roles.map((role, index) => ({
      participantId: `${officeId}-${role}-${index + 1}`,
      provider,
      modelId,
      endpoint,
      apiKey,
      role,
      enabled: true,
    }));
  }

  const available = getConfiguredProviders();
  const fallback = available[0] ?? "openai";

  return roles.map((role, index) => {
    const provider = pickProviderForRole(role, available, fallback);
    return {
      participantId: `${officeId}-${role}-${index + 1}`,
      provider,
      modelId: defaultModelByProvider(provider),
      endpoint:
        provider === "openai_compatible"
          ? state.openaiCompatibleEndpoint.trim()
          : provider === "anthropic"
          ? state.anthropicCompatibleEndpoint.trim()
          : "",
      role,
      enabled: true,
    };
  });
}

async function createOfficeAndKickoffDiscussion(
  goal?: string,
  kickoffText?: string,
  officeName?: string,
): Promise<boolean> {
  applyGlobalApiToRuntime();

  addOffice();
  const office = getActiveOffice();
  if (!office) {
    toast("创建办公室失败，请重试", "error");
    return false;
  }

  office.officeName = officeName?.trim() || `Workerflow 讨论 ${state.offices.length}`;
  office.objective =
    goal?.trim() || "你是我的 Workerflow 结对搭档。先向我提 3 个澄清问题，再给出一版最小可执行流程。";
  office.maxRounds = 1;
  office.members = buildInstantOfficeMembers(office.officeId);
  state.workspaceMode = "offices";
  state.humanDraftByOfficeId[office.officeId] = "";

  setBusyAction("starting-office");
  render();
  try {
    const syncResult = await syncKeysWithEngine();
    if (!syncResult.ok) {
      toast(syncResult.message, "error");
      return false;
    }

    const startResult = await startOfficeDebate();
    if (!startResult.ok) {
      toast(`办公室已创建，但自动启动失败：${startResult.message}`, "error");
      return false;
    }

    const kickoffResult = await sendOfficeChat(
      kickoffText?.trim() ||
        "我们现在开始讨论 Workerflow。请先问我 3 个关键问题，然后给出第一步实施建议。",
    );

    if (kickoffResult.ok) {
      toast("办公室已创建，AI 已开始和你讨论 Workerflow", "success");
      return true;
    } else {
      toast(`办公室已启动，但首条引导消息发送失败：${kickoffResult.message}`, "error");
      return true;
    }
  } finally {
    setBusyAction("none");
    render();
  }
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
  applyGlobalApiToRuntime();

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
                ${renderApiKeyEditor("flow")}
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

  const addCard = `
    <button class="office-card add" id="btn-add-office">
      <span class="office-add-icon">＋</span>
      <span class="office-add-title">新建办公室</span>
      <span class="office-add-sub">通过 AI 向导快速创建并开始讨论</span>
    </button>
  `;
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

function renderGlobalApiCard(api: GlobalApiConfig, index: number): string {
  const isActive = index === state.activeGlobalApiIndex;
  const providerOptionsHtml = ALL_PROVIDERS.map(
    (provider) =>
      `<option value="${provider}" ${api.provider === provider ? "selected" : ""}>${escapeHtml(
        PROVIDER_LABELS[provider],
      )}</option>`,
  ).join("");

  return `
    <div class="dash-section global-api-card ${isActive ? "global-api-card-active" : ""}" data-global-api-index="${index}">
      <div class="global-api-card-header">
        <label class="field" style="flex:1;margin-bottom:0">
          <span>名称</span>
          <input class="global-api-name" data-index="${index}" value="${escapeHtml(api.name)}" placeholder="接口名称" />
        </label>
        <div class="global-api-card-actions">
          ${isActive ? '<span class="badge badge-active">当前使用</span>' : `<button class="btn-sm global-api-activate" data-index="${index}">设为当前</button>`}
          <button class="btn-sm btn-danger global-api-remove" data-index="${index}" ${state.globalApis.length <= 1 ? "disabled" : ""}>删除</button>
        </div>
      </div>
      <label class="field">
        <span>Provider</span>
        <select class="global-api-provider" data-index="${index}">${providerOptionsHtml}</select>
      </label>
      <label class="field">
        <span>Model ID</span>
        <input class="global-api-model" data-index="${index}" value="${escapeHtml(api.modelId)}" placeholder="例如：gpt-4.1" />
      </label>
      <label class="field">
        <span>Endpoint（可选）</span>
        <input class="global-api-endpoint" data-index="${index}" value="${escapeHtml(api.endpoint)}" placeholder="例如：https://api.openai.com/v1 或 .../v1/chat/completions" />
      </label>
      <label class="field">
        <span>API Key（可选）</span>
        <input class="global-api-key" data-index="${index}" value="${escapeHtml(api.apiKey)}" placeholder="sk-..." />
      </label>
    </div>
  `;
}

function renderSettingsView(): string {
  const apiCards = state.globalApis.map((api, index) => renderGlobalApiCard(api, index)).join("");

  return `
    <div class="subscription-view">
      <h2 class="view-title">设置</h2>
      <p class="view-desc">全局 API 接口配置：可配置多个接口，统一维护并导入到办公室成员</p>

      <div class="global-api-list">
        ${apiCards}
      </div>

      <div class="actions" style="margin-bottom:16px">
        <button id="btn-settings-add-global">＋ 添加接口</button>
      </div>

      <div class="dash-section">
        <h3>JSON 导入</h3>
        <label class="field">
          <span>粘贴 JSON（单个或数组）</span>
          <textarea id="settings-global-import" rows="6" placeholder='{"name":"我的接口","provider":"openai","modelId":"gpt-4.1","endpoint":"","apiKey":""}&#10;或 [{"name":"接口1",...},{"name":"接口2",...}]'>${escapeHtml(
            state.globalApiImportText,
          )}</textarea>
        </label>
        <div class="actions">
          <button id="btn-settings-import-global">从 JSON 导入</button>
          <button id="btn-settings-apply-global-office">导入当前接口到办公室成员</button>
          <button id="btn-settings-sync-global">同步全局 Keys 到引擎</button>
        </div>
      </div>
    </div>
  `;
}

function renderGuideModal(): string {
  if (!guideFlow.open) {
    return "";
  }

  const messages = guideFlow.messages
    .map((message) => {
      const cls = message.sender === "ai" ? "guide-msg-ai" : message.sender === "user" ? "guide-msg-user" : "guide-msg-system";
      const roleIcon = message.sender === "ai" ? "🤖" : message.sender === "user" ? "👤" : "⚙️";
      const roleLabel = message.sender === "ai" ? "AI" : message.sender === "user" ? "你" : "系统";
      // AI 消息使用 Markdown 渲染，用户消息保持纯文本
      const bodyHtml = message.sender === "ai"
        ? `<div class="guide-msg-text md-body">${renderMarkdown(message.text)}</div>`
        : `<div class="guide-msg-text">${escapeHtml(message.text)}</div>`;
      return `
        <div class="guide-msg ${cls}">
          <div class="guide-msg-role">${roleIcon} ${escapeHtml(roleLabel)}</div>
          ${bodyHtml}
        </div>
      `;
    })
    .join("");

  // AI 思考中的动画指示器
  const thinkingIndicator = guideFlow.aiThinking
    ? `<div class="guide-msg guide-msg-ai guide-thinking">
        <div class="guide-msg-role">🤖 AI</div>
        <div class="guide-msg-text">
          <div class="thinking-indicator">
            <div class="thinking-dots">
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
            </div>
            <span class="thinking-label">AI 正在思考...</span>
          </div>
        </div>
      </div>`
    : "";

  const canSend = guideFlow.userInput.trim().length > 0 && !guideFlow.aiThinking && !guideFlow.creating;
  const sendLabel = guideFlow.aiThinking ? "AI 思考中..." : "继续讨论";
  const createLabel = guideFlow.creating ? "创建中..." : "按这个想法创建办公室";

  return `
    <div class="flow-modal-mask">
      <div class="flow-modal">
        <div class="flow-modal-head">
          <div>
            <div class="flow-modal-title">和 AI 共创 Workerflow</div>
            <div class="flow-modal-sub">先聊清楚目标，再一键创建办公室并开聊。</div>
          </div>
          <button id="btn-guide-cancel">取消</button>
        </div>

        <div class="flow-modal-body">
          <div class="guide-thread">${messages}${thinkingIndicator}</div>

          <label class="field">
            <span>你的想法</span>
            <textarea id="guide-input" rows="3" placeholder="例如：我想先梳理需求，再评估技术方案和排期">${escapeHtml(
              guideFlow.userInput,
            )}</textarea>
          </label>
        </div>

        <div class="flow-modal-foot">
          <button id="btn-guide-send" ${canSend ? "" : "disabled"}>${sendLabel}</button>
          <button id="btn-guide-create" ${guideFlow.creating ? "disabled" : ""}>${createLabel}</button>
        </div>
      </div>
    </div>
  `;
}

function navIcon(mode: WorkspaceMode): string {
  const map: Record<WorkspaceMode, string> = {
    offices: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    subscription: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    creation: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    review: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  };
  return map[mode] ?? "";
}

function navLabel(mode: WorkspaceMode): string {
  const map: Record<WorkspaceMode, string> = {
    offices: "蜂群办公室",
    dashboard: "数据看板",
    subscription: "事件订阅",
    settings: "系统设置",
    creation: "创作",
    review: "审查",
  };
  return map[mode] ?? mode;
}

const navModes: WorkspaceMode[] = ["offices", "dashboard", "subscription", "settings"];

function renderCenterContent(): string {
  switch (state.workspaceMode) {
    case "dashboard":
      return renderDashboardView();
    case "subscription":
      return renderSubscriptionView();
    case "settings":
      return renderSettingsView();
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
  const canExecuteWorkflow = !isBusy && hasSession;
  const syncLabel = busyAction === "syncing-keys" ? "同步中..." : "同步 Keys";
  const startLabel = busyAction === "starting-office" ? "启动中..." : "启动该办公室讨论";
  const stopLabel = busyAction === "stopping-office" ? "停止中..." : "停止";
  const sendLabel = busyAction === "sending-human" ? "发送中..." : "发送到该办公室";
  const workflowLabel = busyAction === "executing-workflow" ? "执行中..." : "执行落地脚本";

  const workflowDraft =
    state.humanDraftByOfficeId[`workflow:${office.officeId}`] ??
    `{
  "stop_on_error": true,
  "continue_chat": true,
  "steps": [
    {
      "kind": "command",
      "name": "安装依赖",
      "command": "npm install",
      "cwd": ".",
      "timeout_ms": 120000
    },
    {
      "kind": "command",
      "name": "运行测试",
      "command": "npm test",
      "cwd": ".",
      "timeout_ms": 120000
    }
  ]
}`;

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
          <input data-member-endpoint="${index}" value="${escapeHtml(member.endpoint ?? "")}" placeholder="endpoint（仅 OpenAI Compatible）" />
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
                <div class="message-body md-body">${renderMarkdown(chunk.delta)}</div>
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

    <label class="field">
      <span>落地 Workflow（JSON）</span>
      <textarea id="workflow-script" rows="10" placeholder='{"steps":[{"kind":"command","name":"run","command":"npm test"}] }'>${escapeHtml(workflowDraft)}</textarea>
    </label>

    <div class="actions">
      <button id="btn-send-human" ${canSendHuman ? "" : "disabled"}>${sendLabel}</button>
      <button id="btn-execute-workflow" ${canExecuteWorkflow ? "" : "disabled"}>${workflowLabel}</button>
      <button id="btn-start-office" ${canStart ? "" : "disabled"}>${startLabel}</button>
      <button id="btn-stop-office" ${canStop ? "" : "disabled"}>${stopLabel}</button>
    </div>

    <div class="right-divider"></div>

    ${renderApiKeyEditor("side")}
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
                <div class="message-body md-body">${renderMarkdown(chunk.delta)}</div>
              </div>
            `,
          )
          .join("");
}

let saveSettingsTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedSaveSettings(): void {
  if (saveSettingsTimer !== null) {
    clearTimeout(saveSettingsTimer);
  }
  saveSettingsTimer = setTimeout(() => {
    saveSettings();
    saveSettingsTimer = null;
  }, 500);
}

export function render(): void {
  debouncedSaveSettings();
  const office = getActiveOffice();

  const navItems = navModes
    .map(
      (mode) =>
        `<button class="nav-item ${state.workspaceMode === mode ? "active" : ""}" data-nav-mode="${mode}">
          <span class="nav-icon">${navIcon(mode)}</span>
          <span class="nav-text">${navLabel(mode)}</span>
        </button>`,
    )
    .join("");

  const showRightPanel = state.workspaceMode === "offices";

  app.innerHTML = `
    <div class="frame">
      <header class="topbar">
        <div class="brand">
          <span class="brand-icon">🫏</span>
          <div class="brand-copy">
            <span class="brand-text">BeBoss</span>
            <span class="brand-sub">AI Workerflow 协作平台</span>
          </div>
        </div>
        <div class="topbar-right">
          <div class="engine-status ${state.orchestratorRunning ? "online" : "offline"}">
            <span class="engine-dot"></span>
            引擎：${state.orchestratorRunning ? "在线" : "离线"}
          </div>
        </div>
      </header>

      <div class="body ${showRightPanel ? "" : "no-right-panel"}">
        <aside class="left-nav">
          <div class="nav-group">
            ${navItems}
          </div>
          <div class="nav-bottom">
            <div class="profile">
              <span class="profile-avatar">U</span>
              <div class="profile-copy">
                <span class="profile-name">当前用户</span>
                <span class="profile-role">Workspace Admin</span>
              </div>
            </div>
          </div>
        </aside>

        <main class="center">
          ${renderCenterContent()}
        </main>

        ${showRightPanel ? `<aside class="right-panel">${renderDiscussionPanel()}</aside>` : ""}
      </div>
    </div>
    ${renderCreateOfficeModal()}
    ${renderGuideModal()}
    ${renderToasts()}
  `;

  bindEvents(office);
}

function bindEvents(office: OfficeDraft | undefined): void {
  ensureConfiguredProvidersVisible("side");
  ensureConfiguredProvidersVisible("flow");

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

  app.querySelector<HTMLButtonElement>("#btn-add-office")?.addEventListener("click", async () => {
    applyGlobalApiToRuntime();

    if (!hasAnyConfiguredKey()) {
      openCreateOfficeFlow();
      toast("请先在“设置”里配置全局 API（或先同步 Key）后再一键开聊。", "info");
      render();
      return;
    }

    openGuideFlow();
    render();
  });

  app.querySelector<HTMLButtonElement>("#btn-guide-cancel")?.addEventListener("click", () => {
    closeGuideFlow();
    render();
  });

  app.querySelector<HTMLTextAreaElement>("#guide-input")?.addEventListener("input", (event) => {
    const target = event.currentTarget as HTMLTextAreaElement;
    guideFlow.userInput = target.value;

    // 局部更新按钮 disabled 状态，避免全量 render 导致输入框失焦
    const canSend = guideFlow.userInput.trim().length > 0 && !guideFlow.aiThinking && !guideFlow.creating;
    const sendBtn = app.querySelector<HTMLButtonElement>("#btn-guide-send");
    if (sendBtn) {
      sendBtn.disabled = !canSend;
    }
  });

  const sendGuideMessage = async () => {
    const text = guideFlow.userInput.trim();
    if (!text) {
      return;
    }

    const userMessage = pushGuideMessage("user", text);
    guideFlow.userInput = "";
    guideFlow.aiThinking = true;
    render();

    try {
      const syncResult = await syncKeysWithEngine();
      if (!syncResult.ok) {
        guideFlow.aiThinking = false;
        pushGuideMessage("ai", `⚠️ 发送前同步 Key 失败：${syncResult.message}`);
        render();
        return;
      }

      const result = await sendGuideChat(text);

      if (result.ok) {
        if (result.sessionId) {
          guideFlow.sessionId = result.sessionId;
        }
        // 给通知系统一个短暂的处理窗口（通知可能在 RPC 响应之后异步到达）
        await new Promise((resolve) => setTimeout(resolve, 200));
        appendGuideOutputsFallback(result.outputs ?? [], userMessage.id);
        // 无论 outputs 是否为空，都重置 aiThinking
        // 因为 chat/send 是同步返回的，outputs 已包含完整回复
        guideFlow.aiThinking = false;
        setGuidePhase("plan-suggest");
      } else {
        guideFlow.aiThinking = false;
        pushGuideMessage(
          "ai",
          `⚠️ AI 回复失败：${result.message}\n\n请检查：\n1. 引擎是否已启动\n2. API Key 是否已配置\n3. 网络是否正常`,
        );
      }
    } catch (error) {
      guideFlow.aiThinking = false;
      pushGuideMessage(
        "ai",
        `⚠️ 发生错误：${error instanceof Error ? error.message : String(error)}`,
      );
    }

    render();
  };

  app.querySelector<HTMLButtonElement>("#btn-guide-send")?.addEventListener("click", () => {
    sendGuideMessage();
  });

  app.querySelector<HTMLTextAreaElement>("#guide-input")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    sendGuideMessage();
  });

  app.querySelector<HTMLButtonElement>("#btn-guide-create")?.addEventListener("click", async () => {
    const latestUserGoal = [...guideFlow.messages]
      .reverse()
      .find((message) => message.sender === "user")
      ?.text;
    const finalGoal = latestUserGoal?.trim() || "一起讨论 Workerflow 的初步构想并形成执行计划";

    guideFlow.creating = true;
    render();
    try {
      const ok = await createOfficeAndKickoffDiscussion(
        finalGoal,
        `我们开始围绕这个目标讨论：${finalGoal}\n请先输出 3 个澄清问题，再给出第一步落地建议。`,
        "Workerflow 共创办公室",
      );
      if (ok) {
        closeGuideFlow();
      }
    } finally {
      guideFlow.creating = false;
      render();
    }
  });

  app.querySelector<HTMLButtonElement>("#btn-flow-cancel")?.addEventListener("click", () => {
    closeCreateOfficeFlow();
    render();
  });

  // ─── 多个全局 API 接口卡片事件 ───

  app.querySelectorAll<HTMLInputElement>(".global-api-name").forEach((input) => {
    input.addEventListener("input", (event) => {
      const target = event.currentTarget as HTMLInputElement;
      const index = Number(target.dataset.index);
      if (state.globalApis[index]) {
        state.globalApis[index].name = target.value;
      }
    });
  });

  app.querySelectorAll<HTMLSelectElement>(".global-api-provider").forEach((select) => {
    select.addEventListener("change", (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      const index = Number(target.dataset.index);
      const provider = target.value as Provider;
      if (state.globalApis[index] && ALL_PROVIDERS.includes(provider)) {
        state.globalApis[index].provider = provider;
      }
    });
  });

  app.querySelectorAll<HTMLInputElement>(".global-api-model").forEach((input) => {
    input.addEventListener("input", (event) => {
      const target = event.currentTarget as HTMLInputElement;
      const index = Number(target.dataset.index);
      if (state.globalApis[index]) {
        state.globalApis[index].modelId = target.value;
      }
    });
  });

  app.querySelectorAll<HTMLInputElement>(".global-api-endpoint").forEach((input) => {
    input.addEventListener("input", (event) => {
      const target = event.currentTarget as HTMLInputElement;
      const index = Number(target.dataset.index);
      if (state.globalApis[index]) {
        state.globalApis[index].endpoint = target.value;
      }
    });
  });

  app.querySelectorAll<HTMLInputElement>(".global-api-key").forEach((input) => {
    input.addEventListener("input", (event) => {
      const target = event.currentTarget as HTMLInputElement;
      const index = Number(target.dataset.index);
      if (state.globalApis[index]) {
        state.globalApis[index].apiKey = target.value;
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>(".global-api-activate").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      if (index >= 0 && index < state.globalApis.length) {
        state.activeGlobalApiIndex = index;
        toast(`已切换到「${state.globalApis[index].name || "接口 " + (index + 1)}」`, "success");
        render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>(".global-api-remove").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      if (state.globalApis.length <= 1) {
        toast("至少保留一个接口配置", "error");
        return;
      }
      state.globalApis.splice(index, 1);
      if (state.activeGlobalApiIndex >= state.globalApis.length) {
        state.activeGlobalApiIndex = state.globalApis.length - 1;
      } else if (state.activeGlobalApiIndex > index) {
        state.activeGlobalApiIndex -= 1;
      }
      toast("接口已删除", "success");
      render();
    });
  });

  app.querySelector<HTMLButtonElement>("#btn-settings-add-global")?.addEventListener("click", () => {
    const newIndex = state.globalApis.length + 1;
    state.globalApis.push({
      name: `接口 ${newIndex}`,
      provider: "openai",
      modelId: "",
      endpoint: "",
      apiKey: "",
    });
    toast("已添加新接口配置", "success");
    render();
  });

  app.querySelector<HTMLTextAreaElement>("#settings-global-import")?.addEventListener("input", (event) => {
    const target = event.currentTarget as HTMLTextAreaElement;
    state.globalApiImportText = target.value;
  });

  app.querySelector<HTMLButtonElement>("#btn-settings-import-global")?.addEventListener("click", () => {
    const text = state.globalApiImportText.trim();
    if (!text) {
      toast("请先粘贴 JSON", "error");
      return;
    }

    try {
      const raw = JSON.parse(text);
      const items: Array<Partial<GlobalApiConfig>> = Array.isArray(raw) ? raw : [raw];
      let importedCount = 0;

      for (const parsed of items) {
        const provider = parsed.provider && ALL_PROVIDERS.includes(parsed.provider) ? parsed.provider : "openai";
        const entry: GlobalApiConfig = {
          name: typeof parsed.name === "string" ? parsed.name : `导入接口 ${state.globalApis.length + 1}`,
          provider,
          modelId: typeof parsed.modelId === "string" ? parsed.modelId : "",
          endpoint: typeof parsed.endpoint === "string" ? parsed.endpoint : "",
          apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
        };
        state.globalApis.push(entry);
        importedCount += 1;
      }

      toast(`已导入 ${importedCount} 个接口配置`, "success");
      render();
    } catch {
      toast("JSON 解析失败", "error");
    }
  });

  app.querySelector<HTMLButtonElement>("#btn-settings-apply-global-office")?.addEventListener("click", () => {
    const activeOffice = getActiveOffice();
    if (!activeOffice) {
      toast("当前没有可导入的办公室", "error");
      return;
    }

    const active = getActiveGlobalApi();
    if (!active) {
      toast("没有可用的全局接口配置", "error");
      return;
    }

    const modelId = active.modelId.trim();
    if (!modelId) {
      toast("请先填写当前接口的 Model ID", "error");
      return;
    }

    const endpoint = active.endpoint.trim();
    const apiKey = active.apiKey.trim();

    activeOffice.members.forEach((member) => {
      member.provider = active.provider;
      member.modelId = modelId;
      member.endpoint = endpoint;
      member.apiKey = apiKey;
    });

    if (apiKey) {
      state.apiKeys[active.provider] = apiKey;
    }

    toast(`已将「${active.name}」导入到当前办公室成员`, "success");
    render();
  });

  app.querySelector<HTMLButtonElement>("#btn-settings-sync-global")?.addEventListener("click", async () => {
    // 将所有全局接口的 key 同步到 apiKeys
    for (const api of state.globalApis) {
      const key = api.apiKey.trim();
      if (key) {
        state.apiKeys[api.provider] = key;
      }
    }

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

  app.querySelectorAll<HTMLButtonElement>("[data-api-provider-add]").forEach((button) => {
    button.addEventListener("click", () => {
      const scope = asApiKeyScope(button.dataset.apiScope);
      if (!scope) {
        return;
      }

      const select = app.querySelector<HTMLSelectElement>(`#${scopePrefix(scope)}-add-provider-select`);
      const provider = asProvider(select?.value);
      if (!provider) {
        return;
      }

      addProviderToPanel(scope, provider);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-api-provider-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const scope = asApiKeyScope(button.dataset.apiScope);
      const provider = asProvider(button.dataset.apiProvider);
      if (!scope || !provider) {
        return;
      }

      toggleProviderExpanded(scope, provider);
      render();
    });
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

  for (const scope of ["flow", "side"] as const) {
    const keys: Array<keyof typeof state.apiKeys> = ["openai", "openai_compatible", "anthropic", "google", "deepseek"];
    for (const key of keys) {
      const field = app.querySelector<HTMLInputElement>(`#${keyInputId(scope, key)}`);
      field?.addEventListener("input", () => {
        state.apiKeys[key] = field.value;
      });
    }

    app.querySelector<HTMLInputElement>(`#${openaiEndpointId(scope)}`)?.addEventListener("input", (event) => {
      const target = event.currentTarget as HTMLInputElement;
      state.openaiCompatibleEndpoint = target.value;
    });

    app.querySelector<HTMLInputElement>(`#${openaiEndpointId(scope)}`)?.addEventListener("blur", () => {
      state.openaiCompatibleEndpoint = state.openaiCompatibleEndpoint.trim();
      render();
    });

    app.querySelector<HTMLSelectElement>(`#${openaiTemplateId(scope)}`)?.addEventListener("change", (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      applyOpenAICompatibleTemplate(target.value);
      render();
    });

    app.querySelector<HTMLInputElement>(`#${anthropicEndpointId(scope)}`)?.addEventListener("input", (event) => {
      const target = event.currentTarget as HTMLInputElement;
      state.anthropicCompatibleEndpoint = target.value;
    });

    app.querySelector<HTMLInputElement>(`#${anthropicEndpointId(scope)}`)?.addEventListener("blur", () => {
      state.anthropicCompatibleEndpoint = state.anthropicCompatibleEndpoint.trim();
      render();
    });

    app.querySelector<HTMLSelectElement>(`#${anthropicTemplateId(scope)}`)?.addEventListener("change", (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      applyAnthropicCompatibleTemplate(target.value);
      render();
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
      if (target.provider === "openai_compatible") {
        target.endpoint = target.endpoint?.trim() || state.openaiCompatibleEndpoint.trim();
      } else if (target.provider === "anthropic") {
        target.endpoint = target.endpoint?.trim() || state.anthropicCompatibleEndpoint.trim();
      } else {
        target.endpoint = "";
      }
      render();
    });
  });

  app.querySelectorAll<HTMLInputElement>("[data-member-endpoint]").forEach((field) => {
    field.addEventListener("input", () => {
      const index = Number(field.dataset.memberEndpoint);
      if (!office) {
        return;
      }
      const target = office.members[index];
      if (!target) {
        return;
      }
      target.endpoint = field.value;
    });
    field.addEventListener("blur", () => {
      const index = Number(field.dataset.memberEndpoint);
      if (!office) {
        return;
      }
      const target = office.members[index];
      if (!target) {
        return;
      }
      target.endpoint = target.endpoint?.trim() || "";
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


  const humanInput = app.querySelector<HTMLTextAreaElement>("#human-input");
  humanInput?.addEventListener("input", () => {
    if (!office) {
      return;
    }
    state.humanDraftByOfficeId[office.officeId] = humanInput.value;
  });

  const workflowInput = app.querySelector<HTMLTextAreaElement>("#workflow-script");
  workflowInput?.addEventListener("input", () => {
    if (!office) {
      return;
    }
    state.humanDraftByOfficeId[`workflow:${office.officeId}`] = workflowInput.value;
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

  app.querySelector<HTMLButtonElement>("#btn-execute-workflow")?.addEventListener("click", async () => {
    if (!office) {
      toast("请先新建办公室", "error");
      return;
    }

    const script = workflowInput?.value ?? "";
    if (!script.trim()) {
      toast("请先输入 workflow JSON", "error");
      return;
    }

    const snapshot = getSnapshot(office.officeId);
    state.sessionId = snapshot.sessionId;

    setBusyAction("executing-workflow");
    render();
    try {
      const result = await executeWorkflowScript(script);
      toast(result.message, result.ok ? "success" : "error");
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
      grid-template-columns: 56px 1fr 104px 124px 1fr 1.25fr;
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
      gap: 8px;
      background: #ffffff;
      position: sticky;
      bottom: 0;
    }
    .guide-thread {
      border: 1px solid #d6deea;
      border-radius: 10px;
      padding: 10px;
      background: #f8fafd;
      max-height: 320px;
      overflow: auto;
      display: grid;
      gap: 8px;
    }
    .guide-msg {
      border-radius: 10px;
      padding: 8px 10px;
      border: 1px solid #d6deea;
      background: #ffffff;
    }
    .guide-msg-ai {
      border-color: #c8d8ff;
      background: #eef4ff;
    }
    .guide-msg-user {
      border-color: #cde7d7;
      background: #effaf3;
    }
    .guide-msg-system {
      border-color: #e4d5ff;
      background: #f6f1ff;
    }
    .guide-msg-role {
      font-size: 11px;
      font-weight: 700;
      color: #3b4f73;
      margin-bottom: 4px;
    }
    .guide-msg-text {
      font-size: 13px;
      color: #24344d;
      line-height: 1.5;
    }
    .guide-msg-text:not(.md-body) {
      white-space: pre-wrap;
    }

    /* ─── Markdown 渲染样式 ─── */
    .md-body {
      font-size: 13px;
      line-height: 1.6;
      word-break: break-word;
    }
    .md-body p {
      margin: 0 0 8px 0;
    }
    .md-body p:last-child {
      margin-bottom: 0;
    }
    .md-body h1, .md-body h2, .md-body h3, .md-body h4, .md-body h5, .md-body h6 {
      margin: 12px 0 6px 0;
      font-weight: 700;
      line-height: 1.3;
    }
    .md-body h1 { font-size: 18px; }
    .md-body h2 { font-size: 16px; }
    .md-body h3 { font-size: 14px; }
    .md-body h4, .md-body h5, .md-body h6 { font-size: 13px; }
    .md-body strong { font-weight: 700; }
    .md-body em { font-style: italic; }
    .md-body ul, .md-body ol {
      margin: 4px 0 8px 0;
      padding-left: 20px;
    }
    .md-body li {
      margin-bottom: 2px;
    }
    .md-body li > p {
      margin: 0;
    }
    .md-body code {
      background: rgba(47, 111, 237, 0.08);
      border: 1px solid rgba(47, 111, 237, 0.15);
      border-radius: 4px;
      padding: 1px 4px;
      font-size: 12px;
      font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
    }
    .md-body pre {
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      overflow-x: auto;
      margin: 8px 0;
      font-size: 12px;
      line-height: 1.5;
    }
    .md-body pre code {
      background: transparent;
      border: none;
      padding: 0;
      color: inherit;
      font-size: inherit;
    }
    .md-body blockquote {
      border-left: 3px solid #2f6fed;
      margin: 8px 0;
      padding: 4px 12px;
      color: #4a5c75;
      background: rgba(47, 111, 237, 0.04);
      border-radius: 0 6px 6px 0;
    }
    .md-body blockquote p {
      margin: 0;
    }
    .md-body table {
      border-collapse: collapse;
      width: 100%;
      margin: 8px 0;
      font-size: 12px;
    }
    .md-body th, .md-body td {
      border: 1px solid #d6deea;
      padding: 6px 10px;
      text-align: left;
    }
    .md-body th {
      background: #f0f4fa;
      font-weight: 700;
    }
    .md-body tr:nth-child(even) {
      background: #f8fafd;
    }
    .md-body hr {
      border: none;
      border-top: 1px solid #d6deea;
      margin: 12px 0;
    }
    .md-body a {
      color: #2f6fed;
      text-decoration: none;
    }
    .md-body a:hover {
      text-decoration: underline;
    }
    .md-body img {
      max-width: 100%;
      border-radius: 6px;
    }
    .md-body del {
      text-decoration: line-through;
      color: #6f7d92;
    }

    /* ─── AI 思考动画 ─── */
    .guide-thinking {
      animation: thinking-pulse 2s ease-in-out infinite;
    }
    @keyframes thinking-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .thinking-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }
    .thinking-dots {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .thinking-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #2f6fed;
      animation: thinking-bounce 1.4s ease-in-out infinite;
    }
    .thinking-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    .thinking-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes thinking-bounce {
      0%, 80%, 100% {
        transform: scale(0.6);
        opacity: 0.4;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
    .thinking-label {
      font-size: 12px;
      color: #2f6fed;
      font-weight: 500;
    }

    .provider-manager {
      margin-top: 8px;
      display: grid;
      gap: 8px;
    }
    .provider-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .provider-toolbar-label {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
    }
    .provider-add-row {
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }
    .provider-add-row select {
      min-width: 180px;
      max-width: 260px;
    }
    .provider-card-list {
      display: grid;
      gap: 8px;
    }
    .provider-card {
      border: 1px solid #d6deea;
      border-radius: 10px;
      overflow: hidden;
      background: #ffffff;
    }
    .provider-card-head {
      width: 100%;
      border: 0;
      background: #f8fafd;
      border-bottom: 1px solid #e4ecf8;
      color: #1e3a8a;
      padding: 8px 10px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .provider-card-head:hover {
      background: #eef4ff;
    }
    .provider-card-body {
      padding: 8px;
      display: grid;
      gap: 6px;
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

    /* 全局 API 多接口卡片 */
    .global-api-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 8px;
    }
    .global-api-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      transition: border-color 0.15s;
    }
    .global-api-card-active {
      border-color: var(--accent, #3b82f6);
      box-shadow: 0 0 0 1px var(--accent, #3b82f6);
    }
    .global-api-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .global-api-card-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-shrink: 0;
    }
    .btn-sm {
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid var(--line);
      background: var(--bg);
      color: var(--fg);
    }
    .btn-sm:hover {
      background: var(--hover, #f0f0f0);
    }
    .btn-sm.btn-danger {
      color: #dc2626;
      border-color: #fca5a5;
    }
    .btn-sm.btn-danger:hover {
      background: #fef2f2;
    }
    .btn-sm:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 500;
    }
    .badge-active {
      background: #dbeafe;
      color: #1d4ed8;
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

    /* Refined warm theme */
    :root {
      --bg: #f5efe4;
      --panel: #f6efe3;
      --panel-soft: #fbf7f0;
      --panel-strong: #efe5d6;
      --line: #dccfb9;
      --line-strong: #ccb89a;
      --text: #2f2a22;
      --muted: #8a7c6a;
      --card: #f8f1e6;
      --accent: #c78133;
      --accent-strong: #a6631d;
      --accent-soft: #f2e2c8;
      --success: #2f7a45;
      --danger: #b54a3a;
      --radius-lg: 16px;
      --radius-md: 12px;
      --shadow-sm: 0 6px 16px rgba(71, 53, 25, 0.08);
      --shadow-md: 0 16px 32px rgba(71, 53, 25, 0.12);
    }
    html, body {
      background:
        radial-gradient(circle at -10% -20%, #fdfaf2 0%, rgba(253, 250, 242, 0) 55%),
        linear-gradient(180deg, #f6f1e8 0%, #f3eee5 100%);
      color: var(--text);
    }
    #app {
      padding: 16px;
    }
    .frame {
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: var(--panel-soft);
      box-shadow: var(--shadow-sm);
      min-height: calc(100vh - 32px);
    }
    .topbar {
      height: 88px;
      padding: 0 18px;
      border-bottom: 1px solid var(--line);
      background: linear-gradient(180deg, #fffdf8 0%, #f7f1e6 100%);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: inline-grid;
      place-items: center;
      background: var(--accent-soft);
      border: 1px solid #e6ccaa;
      font-size: 20px;
    }
    .brand-copy {
      display: grid;
      gap: 2px;
    }
    .brand-text {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 0.2px;
      color: #2e271f;
      line-height: 1;
    }
    .brand-sub {
      font-size: 12px;
      color: var(--muted);
      line-height: 1;
    }
    .topbar-right {
      display: inline-flex;
      align-items: center;
    }
    .engine-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: #fff8ee;
      color: #8a7462;
      font-weight: 600;
      letter-spacing: 0.1px;
    }
    .engine-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #ada395;
      box-shadow: 0 0 0 2px rgba(173, 163, 149, 0.28);
      flex-shrink: 0;
    }
    .engine-status.online {
      color: #7d541f;
      border-color: #dbb786;
      background: #fff2e0;
    }
    .engine-status.online .engine-dot {
      background: var(--accent);
      box-shadow: 0 0 0 2px rgba(199, 129, 51, 0.26);
    }
    .engine-status.offline {
      color: #8a7c6a;
      border-color: var(--line-strong);
      background: #f7f0e4;
    }

    .body {
      grid-template-columns: 248px 1fr 368px;
      min-height: calc(100vh - 120px);
      background: var(--panel-soft);
    }
    .body.no-right-panel {
      grid-template-columns: 248px 1fr;
    }
    .left-nav {
      display: flex;
      flex-direction: column;
      padding: 14px 12px;
      border-right: 1px solid var(--line);
      background: linear-gradient(180deg, #f2ebdf 0%, #efe7d8 100%);
      gap: 12px;
    }
    .nav-group {
      display: grid;
      gap: 8px;
    }
    .nav-item {
      border: 1px solid transparent;
      border-radius: 12px;
      background: transparent;
      color: #514537;
      padding: 10px 12px;
      font-size: 15px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-align: left;
      transition: all 140ms ease;
    }
    .nav-item:hover {
      border-color: #dfcdb4;
      background: #f8f0e2;
      color: #3f3428;
    }
    .nav-item.active {
      border-color: #d9b483;
      background: linear-gradient(180deg, #f6e8d2 0%, #f2dfc2 100%);
      color: #7e4f1d;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }
    .nav-icon {
      width: 18px;
      height: 18px;
      display: inline-grid;
      place-items: center;
      flex-shrink: 0;
    }
    .nav-text {
      line-height: 1;
    }
    .nav-bottom {
      margin-top: auto;
    }
    .profile {
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid #ddcfb8;
      border-radius: 12px;
      background: #f8f2e7;
      padding: 10px;
    }
    .profile-avatar {
      width: 30px;
      height: 30px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: var(--accent-soft);
      color: var(--accent-strong);
      font-weight: 700;
      border: 1px solid #e6ccaa;
      flex-shrink: 0;
    }
    .profile-copy {
      display: grid;
      gap: 2px;
      line-height: 1.1;
    }
    .profile-name {
      color: #4a3d30;
      font-size: 13px;
      font-weight: 700;
    }
    .profile-role {
      color: var(--muted);
      font-size: 11px;
    }

    .center {
      padding: 18px;
      border-right: 1px solid var(--line);
      background: var(--panel-soft);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(220px, 1fr));
      gap: 14px;
    }
    .office-card {
      min-height: 164px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: linear-gradient(180deg, #fffdf8 0%, #faf3e8 100%);
      box-shadow: 0 4px 12px rgba(65, 48, 24, 0.07);
      color: var(--text);
      text-align: left;
      padding: 14px;
      display: grid;
      gap: 7px;
      align-content: start;
      transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
    }
    .office-card:hover {
      border-color: #d6b183;
      box-shadow: 0 10px 18px rgba(65, 48, 24, 0.12);
      transform: translateY(-1px);
    }
    .office-card.active {
      border-color: var(--accent);
      background: linear-gradient(180deg, #fff8ee 0%, #f7ead7 100%);
      box-shadow: 0 0 0 1px rgba(199, 129, 51, 0.24) inset;
    }
    .office-card.add {
      place-items: center;
      text-align: center;
      border-style: dashed;
      border-color: #d6bb96;
      background: linear-gradient(180deg, #f9f1e4 0%, #f3e5cf 100%);
      color: #93602a;
      gap: 4px;
    }
    .office-add-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: inline-grid;
      place-items: center;
      background: #f2dfc2;
      border: 1px solid #e0be8f;
      font-size: 24px;
      line-height: 1;
      font-weight: 500;
    }
    .office-add-title {
      font-size: 22px;
      font-weight: 700;
      color: #7f4f1f;
      line-height: 1.2;
    }
    .office-add-sub {
      font-size: 12px;
      color: #8f7b63;
      max-width: 220px;
      line-height: 1.4;
    }
    .office-title {
      font-size: 18px;
      font-weight: 800;
      color: #3a3127;
    }
    .office-line {
      color: #675949;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .office-meta {
      margin-top: auto;
      font-size: 12px;
      color: var(--muted);
    }

    .right-panel {
      padding: 16px;
      overflow: auto;
      background: linear-gradient(180deg, #f1eadf 0%, #eee5d7 100%);
    }
    .right-title {
      font-size: 30px;
      line-height: 1.1;
      font-weight: 800;
      color: #2f281f;
      margin-top: 2px;
    }
    .right-sub {
      margin-top: 6px;
      margin-bottom: 2px;
      font-size: 12px;
      color: #857666;
    }
    .discussion-box {
      margin-top: 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      min-height: 220px;
      max-height: 320px;
      padding: 10px;
      overflow: auto;
      background: #fffcf6;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }
    .message-item {
      margin-bottom: 8px;
      border: 1px solid #e2d5c2;
      border-radius: 10px;
      padding: 9px;
      background: #f9f2e6;
    }
    .message-head {
      color: #8f5a20;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .message-body {
      color: #4d4336;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .field {
      display: grid;
      gap: 6px;
      margin-top: 11px;
    }
    .field span {
      color: #77695b;
      font-size: 12px;
      font-weight: 600;
    }
    input, textarea, select {
      width: 100%;
      border: 1px solid #d8c9b2;
      border-radius: 10px;
      background: #fffaf2;
      color: var(--text);
      padding: 9px 10px;
      font-size: 13px;
      transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
    }
    textarea {
      resize: vertical;
      line-height: 1.45;
    }
    #workflow-script,
    #settings-global-import {
      font-family: "Cascadia Code", "Fira Code", monospace;
      font-size: 12px;
      line-height: 1.5;
    }
    input, textarea, select, button {
      outline: none;
    }
    input:focus-visible, textarea:focus-visible, select:focus-visible, button:focus-visible {
      border-color: #d39a58;
      box-shadow: 0 0 0 3px rgba(199, 129, 51, 0.2);
      background: #fffdf9;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    button {
      border: 1px solid #d3bf9e;
      border-radius: 10px;
      background: #f8f0e2;
      color: #6d4b23;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.1px;
      padding: 8px 12px;
      cursor: pointer;
      transition: transform 110ms ease, background-color 110ms ease, border-color 110ms ease;
    }
    button:hover {
      background: #f4e4cb;
      border-color: #d0aa76;
    }
    button:active {
      transform: translateY(1px);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    #btn-start-office,
    #btn-send-human,
    #btn-set-keys,
    #btn-flow-create,
    #btn-guide-send,
    #btn-guide-create,
    #btn-flow-sync-keys,
    #btn-settings-sync-global,
    #btn-settings-import-global {
      background: linear-gradient(180deg, #cf8c3f 0%, #c07a2f 100%);
      border-color: #c07a2f;
      color: #fffaf1;
      box-shadow: 0 4px 10px rgba(166, 99, 29, 0.22);
    }
    #btn-start-office:hover,
    #btn-send-human:hover,
    #btn-set-keys:hover,
    #btn-flow-create:hover,
    #btn-guide-send:hover,
    #btn-guide-create:hover,
    #btn-flow-sync-keys:hover,
    #btn-settings-sync-global:hover,
    #btn-settings-import-global:hover {
      background: linear-gradient(180deg, #d5954c 0%, #c88439 100%);
      border-color: #bf7b31;
    }
    #btn-stop-office {
      background: #fff1ee;
      border-color: #e5b7af;
      color: #a14537;
    }
    #btn-stop-office:hover {
      background: #ffe6e2;
      border-color: #dca59b;
    }
    #btn-flow-cancel,
    #btn-guide-cancel {
      background: #f7f0e3;
      color: #67523a;
      border-color: #d6c4aa;
    }
    .danger {
      border-color: #e1aea5;
      background: #fff2f0;
      color: #a84336;
    }
    .danger:hover {
      background: #ffe7e3;
    }

    .right-divider {
      border-top: 1px dashed #d5c6af;
      margin: 14px 0;
    }
    .member-list {
      display: grid;
      gap: 8px;
    }
    .member-row {
      border: 1px solid #ddceb7;
      border-radius: 10px;
      padding: 9px;
      background: #fffaf2;
    }
    .member-row b {
      display: block;
      font-size: 13px;
      color: #3f3429;
    }
    .member-row span {
      color: #8f5a20;
      font-size: 12px;
      font-weight: 600;
    }
    .member-row p {
      margin: 4px 0 0;
      color: #6f6356;
      font-size: 12px;
      line-height: 1.45;
    }

    .member-editor {
      margin-top: 12px;
      border: 1px solid #ddceb7;
      border-radius: 12px;
      padding: 10px;
      background: #fff9f0;
      display: grid;
      gap: 8px;
    }
    .member-editor-title {
      font-size: 12px;
      font-weight: 700;
      color: #5f4a31;
    }
    .member-editor-row {
      display: grid;
      grid-template-columns: 56px 1fr 104px 124px 1fr 1.25fr;
      gap: 6px;
      align-items: center;
    }
    .check {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #6f6356;
      font-weight: 600;
    }
    .check input {
      width: 14px;
      height: 14px;
      margin: 0;
      padding: 0;
    }

    .provider-manager {
      margin-top: 8px;
      display: grid;
      gap: 8px;
    }
    .provider-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .provider-toolbar-label {
      color: #5b4730;
      font-size: 12px;
      font-weight: 700;
    }
    .provider-add-row {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .provider-add-row select {
      min-width: 180px;
      max-width: 260px;
    }
    .provider-card-list {
      display: grid;
      gap: 8px;
    }
    .provider-card {
      border: 1px solid #ddceb7;
      border-radius: 10px;
      background: #fffaf2;
      overflow: hidden;
    }
    .provider-card-head {
      width: 100%;
      border: 0;
      border-bottom: 1px solid #e8dcca;
      border-radius: 0;
      background: #f7eddc;
      color: #6f4822;
      padding: 9px 10px;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .provider-card-head:hover {
      background: #f3e4cd;
      border-color: #cfb188;
    }
    .provider-card-body {
      display: grid;
      gap: 6px;
      padding: 8px;
    }

    .toast-stack {
      right: 20px;
      bottom: 20px;
      max-width: 360px;
    }
    .toast {
      border-radius: 12px;
      border: 1px solid #ddceb7;
      background: #fff9f0;
      color: #4f4134;
      padding: 10px 12px;
      font-size: 12px;
      box-shadow: var(--shadow-sm);
    }
    .toast-success {
      border-color: #bdd9c5;
      background: #f0fbf3;
      color: #235f35;
    }
    .toast-error {
      border-color: #e8b7b0;
      background: #fff3f1;
      color: #9d3e32;
    }
    .toast-info {
      border-color: #d9c7ad;
      background: #faf3e7;
      color: #78572f;
    }

    .flow-modal-mask {
      background: rgba(45, 33, 18, 0.32);
      backdrop-filter: blur(2px);
      padding: 22px;
    }
    .flow-modal {
      border: 1px solid #dccfb9;
      border-radius: 14px;
      background: #fffaf2;
      box-shadow: var(--shadow-md);
    }
    .flow-modal-head {
      border-bottom: 1px solid #e5d7c3;
      padding: 12px 14px;
      background: linear-gradient(180deg, #fdf8ef 0%, #f7efdf 100%);
    }
    .flow-modal-title {
      color: #3b3023;
      font-size: 20px;
      font-weight: 800;
    }
    .flow-modal-sub {
      color: #867868;
      font-size: 12px;
    }
    .flow-modal-body {
      display: grid;
      gap: 12px;
      padding: 14px;
    }
    .flow-section {
      border: 1px solid #dfd1bb;
      border-radius: 12px;
      background: #fff7eb;
      padding: 10px;
    }
    .flow-alert {
      border-color: #e9beb7;
      background: #fff2f0;
    }
    .flow-section-title {
      margin-bottom: 8px;
      color: #6f4a24;
      font-size: 13px;
      font-weight: 800;
    }
    .flow-plan-grid {
      margin-top: 8px;
      display: grid;
      grid-template-columns: repeat(2, minmax(220px, 1fr));
      gap: 8px;
    }
    .flow-plan-card {
      border: 1px solid #dfceb5;
      border-radius: 10px;
      background: #fffaf2;
      text-align: left;
      padding: 10px;
      display: grid;
      gap: 6px;
      cursor: pointer;
    }
    .flow-plan-card.active {
      border-color: #d39a58;
      box-shadow: 0 0 0 1px rgba(199, 129, 51, 0.2) inset;
      background: #fff1dd;
    }
    .flow-plan-title {
      color: #5a3f20;
      font-size: 13px;
      font-weight: 800;
    }
    .flow-plan-summary {
      color: #665a4c;
      font-size: 12px;
      line-height: 1.45;
    }
    .flow-plan-meta {
      color: #8c7d6c;
      font-size: 11px;
    }
    .flow-preview-box {
      margin-top: 10px;
      border: 1px dashed #d5c1a4;
      border-radius: 10px;
      background: #fffaf2;
      padding: 8px;
      display: grid;
      gap: 6px;
    }
    .flow-preview-title {
      color: #6a4a25;
      font-size: 12px;
      font-weight: 700;
    }
    .flow-preview-row {
      display: grid;
      grid-template-columns: 110px 120px 1fr;
      gap: 8px;
      align-items: center;
      color: #5e5447;
      font-size: 12px;
    }
    .flow-preview-role {
      color: #5d4020;
      font-weight: 700;
    }
    .flow-preview-provider {
      color: #a0601d;
      font-weight: 600;
    }
    .flow-preview-model {
      color: #72685d;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .flow-sync-msg {
      margin-top: 8px;
      font-size: 12px;
      color: #72685d;
    }
    .flow-sync-success {
      color: #22603a;
    }
    .flow-sync-error {
      color: #a64537;
    }
    .flow-modal-foot {
      border-top: 1px solid #e5d7c3;
      padding: 12px 14px;
      background: #fbf4e7;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .guide-thread {
      border: 1px solid #ddceb7;
      border-radius: 12px;
      background: #fffaf2;
      max-height: 320px;
      overflow: auto;
      padding: 10px;
      display: grid;
      gap: 8px;
    }
    .guide-msg {
      border: 1px solid #e0d2bc;
      border-radius: 10px;
      padding: 8px 10px;
      background: #fffefb;
    }
    .guide-msg-ai {
      border-color: #e3cfb0;
      background: #fff4e5;
    }
    .guide-msg-user {
      border-color: #d6ddc6;
      background: #f4f8ea;
    }
    .guide-msg-system {
      border-color: #d9d2ea;
      background: #f5f2fc;
    }
    .guide-msg-role {
      margin-bottom: 4px;
      color: #6b4a27;
      font-size: 11px;
      font-weight: 800;
    }
    .guide-msg-text {
      color: #43392d;
      font-size: 13px;
      line-height: 1.5;
    }
    .guide-msg-text:not(.md-body) {
      white-space: pre-wrap;
    }

    /* ─── 暗色主题 Markdown 覆盖 ─── */
    .md-body code {
      background: rgba(160, 96, 29, 0.1);
      border-color: rgba(160, 96, 29, 0.2);
    }
    .md-body pre {
      background: #2c2418;
      color: #e8ddd0;
    }
    .md-body blockquote {
      border-left-color: #a0601d;
      background: rgba(160, 96, 29, 0.06);
      color: #72685d;
    }
    .md-body th {
      background: #f0e8d8;
    }
    .md-body th, .md-body td {
      border-color: #ddceb7;
    }
    .md-body tr:nth-child(even) {
      background: #faf3e6;
    }
    .md-body hr {
      border-top-color: #ddceb7;
    }
    .md-body a {
      color: #a0601d;
    }
    .thinking-dot {
      background: #a0601d;
    }
    .thinking-label {
      color: #a0601d;
    }

    .dashboard-view, .subscription-view {
      padding: 4px 0;
    }
    .view-title {
      margin: 0 0 4px 0;
      font-size: 32px;
      font-weight: 800;
      color: #352c22;
      line-height: 1.12;
    }
    .view-desc {
      margin: 0 0 16px 0;
      color: #857868;
      font-size: 13px;
    }
    .dash-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .dash-card {
      border: 1px solid #decfb8;
      border-radius: 12px;
      background: #fff8ee;
      padding: 14px;
      box-shadow: 0 3px 8px rgba(66, 48, 24, 0.06);
    }
    .dash-card-label {
      margin-bottom: 6px;
      color: #8a7c6a;
      font-size: 12px;
      font-weight: 600;
    }
    .dash-card-value {
      font-size: 24px;
      font-weight: 800;
      color: #3b3023;
    }
    .dash-section {
      margin-bottom: 18px;
      border: 1px solid #deceb6;
      border-radius: 12px;
      background: #fff9f0;
      padding: 12px;
    }
    .dash-section h3 {
      margin: 0 0 10px 0;
      color: #5d452a;
      font-size: 15px;
      font-weight: 800;
    }
    .dash-table-wrap {
      overflow-x: auto;
      border: 1px solid #e6d9c6;
      border-radius: 10px;
      background: #fffdf9;
    }
    .dash-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .dash-table th,
    .dash-table td {
      border-bottom: 1px solid #eee1cf;
      padding: 9px 10px;
      text-align: left;
      vertical-align: top;
    }
    .dash-table th {
      color: #8f7f6a;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      background: #f8f0e3;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .summary-cell {
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
    }
    .status-idle { background: #ece3d5; color: #756858; }
    .status-starting { background: #fae8cf; color: #9a651f; }
    .status-running { background: #e9f2de; color: #3d6f32; }
    .status-completed { background: #e4ecf9; color: #345980; }
    .status-stopped { background: #ece6dc; color: #766b5f; }
    .status-error { background: #fbe4e1; color: #a4473a; }

    .log-box {
      border: 1px solid #e3d6c2;
      border-radius: 10px;
      background: #fffdf9;
      max-height: 300px;
      overflow: auto;
      padding: 10px;
      font-family: "Cascadia Code", "Fira Code", monospace;
    }
    .log-line {
      font-size: 11px;
      color: #625647;
      border-bottom: 1px solid #eee2d1;
      padding: 3px 0;
      word-break: break-all;
    }

    .sub-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    .sub-tab {
      border: 1px solid #d8c6a9;
      border-radius: 10px;
      background: #f9f0e1;
      color: #7b6243;
      font-size: 13px;
      font-weight: 600;
      padding: 7px 14px;
      cursor: pointer;
    }
    .sub-tab:hover {
      background: #f4e2c8;
      border-color: #d0aa76;
    }
    .sub-tab.active {
      border-color: #d39a58;
      background: #f3dfbf;
      color: #744418;
      font-weight: 700;
    }
    .sub-content {
      max-height: calc(100vh - 290px);
      overflow: auto;
    }
    .sub-event-item {
      border: 1px solid #decfb8;
      border-radius: 10px;
      background: #fff8ef;
      padding: 10px;
      margin-bottom: 8px;
    }
    .sub-event-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .sub-event-method {
      color: #8f5a20;
      font-size: 13px;
      font-weight: 700;
    }
    .sub-event-time {
      color: #8a7c6a;
      font-size: 11px;
    }
    .sub-event-body {
      margin: 0;
      border-radius: 8px;
      background: #f9f0e2;
      color: #5d5247;
      font-size: 11px;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 120px;
      overflow: auto;
      padding: 7px;
    }
    .sub-chunk-item {
      border: 1px solid #dcc9ad;
      border-radius: 10px;
      background: #fff3e1;
      padding: 10px;
      margin-bottom: 8px;
    }
    .sub-chunk-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .sub-chunk-participant {
      color: #8f5a20;
      font-size: 13px;
      font-weight: 700;
    }
    .sub-chunk-meta {
      color: #8a7c6a;
      font-size: 11px;
    }
    .sub-chunk-body {
      color: #4f4538;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .global-api-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 8px;
    }
    .global-api-card {
      margin-bottom: 0;
      border: 1px solid #ddceb7;
      border-radius: 12px;
      padding: 14px;
      background: #fff9f0;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .global-api-card-active {
      border-color: #d39a58;
      box-shadow: 0 0 0 1px rgba(199, 129, 51, 0.22);
    }
    .global-api-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .global-api-card-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .btn-sm {
      border: 1px solid #d3bf9e;
      border-radius: 8px;
      background: #f8f0e2;
      color: #6d4b23;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      cursor: pointer;
    }
    .btn-sm:hover {
      background: #f4e4cb;
      border-color: #d0aa76;
    }
    .btn-sm.btn-danger {
      color: #a74437;
      border-color: #dfb0aa;
      background: #fff1ee;
    }
    .btn-sm.btn-danger:hover {
      background: #ffe7e3;
      border-color: #dca59b;
    }
    .btn-sm:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .badge {
      display: inline-block;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
    }
    .badge-active {
      background: #f3dfbf;
      color: #744418;
    }
    .muted {
      color: #8a7c6a;
      font-size: 12px;
      line-height: 1.45;
    }

    @media (max-width: 1600px) {
      .body { grid-template-columns: 220px 1fr 340px; }
      .body.no-right-panel { grid-template-columns: 220px 1fr; }
      .grid { grid-template-columns: repeat(2, minmax(220px, 1fr)); }
      .dash-summary-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 1200px) {
      .body,
      .body.no-right-panel {
        grid-template-columns: 1fr;
      }
      .left-nav {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .nav-group {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .nav-item {
        justify-content: center;
        padding: 10px 8px;
      }
      .nav-text {
        font-size: 13px;
      }
      .center {
        border-right: 0;
      }
      .right-panel {
        border-top: 1px solid var(--line);
      }
      .member-editor-row {
        grid-template-columns: 56px 1fr;
      }
      .flow-plan-grid {
        grid-template-columns: 1fr;
      }
      .flow-preview-row {
        grid-template-columns: 1fr;
      }
      .dash-summary-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 760px) {
      #app {
        padding: 10px;
      }
      .frame {
        border-radius: 12px;
        min-height: calc(100vh - 20px);
      }
      .topbar {
        height: auto;
        padding: 12px;
        gap: 10px;
        align-items: flex-start;
        flex-direction: column;
      }
      .brand-text {
        font-size: 28px;
      }
      .brand-sub {
        font-size: 11px;
      }
      .nav-group {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .grid {
        grid-template-columns: 1fr;
      }
      .dash-summary-grid {
        grid-template-columns: 1fr;
      }
      .view-title {
        font-size: 26px;
      }
      .global-api-card-header {
        flex-wrap: wrap;
      }
      .sub-event-head,
      .sub-chunk-head {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    /* Crisp modern override */
    :root {
      --bg: #f3f5f8;
      --panel: #ffffff;
      --panel-soft: #f8fafc;
      --panel-strong: #eef2f6;
      --line: #d9e0ea;
      --line-strong: #c7d2e0;
      --text: #0f172a;
      --muted: #64748b;
      --card: #ffffff;
      --accent: #f59e0b;
      --accent-strong: #d97706;
      --accent-soft: #fff7e6;
      --danger: #dc2626;
      --radius-lg: 12px;
      --radius-md: 10px;
      --shadow-sm: 0 4px 14px rgba(15, 23, 42, 0.06);
      --shadow-md: 0 18px 38px rgba(15, 23, 42, 0.18);
    }
    html, body {
      background: linear-gradient(180deg, #f5f7fb 0%, #f1f4f8 100%);
      color: var(--text);
    }
    #app {
      padding: 14px;
    }
    .frame {
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: var(--panel);
      box-shadow: var(--shadow-sm);
      min-height: calc(100vh - 28px);
    }
    .topbar {
      height: 68px;
      padding: 0 16px;
      border-bottom: 1px solid var(--line);
      background: #ffffff;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .brand-icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: inline-grid;
      place-items: center;
      border: 1px solid #ffe8ba;
      background: var(--accent-soft);
      font-size: 17px;
    }
    .brand-copy {
      display: grid;
      gap: 2px;
      line-height: 1;
    }
    .brand-text {
      font-size: 26px;
      font-weight: 800;
      color: #111827;
      letter-spacing: 0;
    }
    .brand-sub {
      font-size: 11px;
      color: var(--muted);
    }
    .engine-status {
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: #f8fafc;
      color: #475569;
      padding: 6px 11px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .engine-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #94a3b8;
      box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.26);
      flex-shrink: 0;
    }
    .engine-status.online {
      border-color: #f0c36b;
      color: #b45309;
      background: #fffbf0;
    }
    .engine-status.online .engine-dot {
      background: var(--accent);
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.24);
    }

    .body {
      grid-template-columns: 224px 1fr 352px;
      min-height: calc(100vh - 82px);
      background: #ffffff;
    }
    .body.no-right-panel {
      grid-template-columns: 224px 1fr;
    }
    .left-nav {
      background: var(--panel-soft);
      border-right: 1px solid var(--line);
      padding: 12px 10px;
      gap: 10px;
    }
    .nav-group {
      display: grid;
      gap: 6px;
    }
    .nav-item {
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      background: transparent;
      color: #334155;
      padding: 10px 12px;
      font-size: 14px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-align: left;
      transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
    }
    .nav-item:hover {
      border-color: var(--line);
      background: #ffffff;
      color: #0f172a;
    }
    .nav-item.active {
      border-color: var(--line-strong);
      background: #ffffff;
      color: #0f172a;
      box-shadow: inset 3px 0 0 var(--accent);
    }
    .nav-icon {
      width: 18px;
      height: 18px;
      color: #64748b;
    }
    .nav-item.active .nav-icon {
      color: #b45309;
    }
    .profile {
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      background: #ffffff;
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .profile-avatar {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      background: #eef2f7;
      border: 1px solid var(--line);
      color: #334155;
      font-size: 12px;
      font-weight: 700;
      display: grid;
      place-items: center;
    }
    .profile-name {
      color: #0f172a;
      font-size: 13px;
      font-weight: 700;
    }
    .profile-role {
      color: var(--muted);
      font-size: 11px;
    }

    .center {
      border-right: 1px solid var(--line);
      background: #f5f7fb;
      padding: 16px;
    }
    .right-panel {
      background: var(--panel-soft);
      padding: 14px;
    }
    .right-title {
      font-size: 24px;
      line-height: 1.2;
      font-weight: 800;
      color: #111827;
      margin-top: 0;
    }
    .right-sub {
      font-size: 12px;
      color: var(--muted);
      margin-top: 4px;
    }

    .grid {
      grid-template-columns: repeat(3, minmax(210px, 1fr));
      gap: 12px;
    }
    .office-card {
      min-height: 156px;
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      padding: 12px;
      gap: 6px;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }
    .office-card:hover {
      border-color: #f2c572;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
      transform: none;
    }
    .office-card.active {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2);
      background: #fffdfa;
    }
    .office-title {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
    }
    .office-line {
      color: #475569;
      font-size: 12px;
    }
    .office-meta {
      color: #64748b;
      font-size: 12px;
    }
    .office-card.add {
      border-style: dashed;
      border-color: #f2c572;
      background: #fffdf8;
      color: #92400e;
      gap: 5px;
    }
    .office-add-icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: var(--accent-soft);
      border: 1px solid #f6d79a;
      font-size: 20px;
      display: inline-grid;
      place-items: center;
    }
    .office-add-title {
      font-size: 18px;
      font-weight: 700;
      color: #92400e;
    }
    .office-add-sub {
      font-size: 12px;
      color: #64748b;
      max-width: 220px;
    }

    .field {
      gap: 6px;
      margin-top: 10px;
    }
    .field span {
      color: #475569;
      font-size: 12px;
      font-weight: 600;
    }
    input, textarea, select {
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      background: #ffffff;
      color: var(--text);
      padding: 8px 10px;
      font-size: 13px;
    }
    input:focus-visible, textarea:focus-visible, select:focus-visible, button:focus-visible {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
    }

    button {
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      background: #ffffff;
      color: #334155;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 11px;
      transition: border-color 120ms ease, background-color 120ms ease;
    }
    button:hover {
      border-color: #f2c572;
      background: #fffaf0;
    }
    #btn-start-office,
    #btn-send-human,
    #btn-set-keys,
    #btn-flow-create,
    #btn-guide-send,
    #btn-guide-create,
    #btn-flow-sync-keys,
    #btn-settings-sync-global,
    #btn-settings-import-global {
      border-color: var(--accent-strong);
      background: var(--accent);
      color: #ffffff;
      box-shadow: none;
    }
    #btn-start-office:hover,
    #btn-send-human:hover,
    #btn-set-keys:hover,
    #btn-flow-create:hover,
    #btn-guide-send:hover,
    #btn-guide-create:hover,
    #btn-flow-sync-keys:hover,
    #btn-settings-sync-global:hover,
    #btn-settings-import-global:hover {
      border-color: #b45309;
      background: #d97706;
    }
    #btn-stop-office {
      border-color: #fecaca;
      background: #fef2f2;
      color: #b91c1c;
    }
    #btn-stop-office:hover {
      border-color: #fca5a5;
      background: #fee2e2;
    }

    .discussion-box,
    .member-editor,
    .member-row,
    .provider-card,
    .dash-section,
    .global-api-card,
    .sub-event-item,
    .sub-chunk-item,
    .guide-thread,
    .guide-msg,
    .flow-section,
    .flow-plan-card,
    .flow-preview-box,
    .log-box {
      border-color: var(--line);
      background: #ffffff;
    }
    .message-item {
      border-color: var(--line);
      background: #f8fafc;
      border-radius: 8px;
    }
    .message-head,
    .sub-event-method,
    .sub-chunk-participant,
    .flow-section-title,
    .flow-preview-role,
    .provider-card-head {
      color: #1f2937;
    }
    .provider-card-head {
      background: #f8fafc;
      border-bottom: 1px solid var(--line);
    }

    .view-title {
      font-size: 28px;
      color: #111827;
    }
    .view-desc,
    .muted,
    .sub-event-time,
    .sub-chunk-meta,
    .flow-modal-sub,
    .flow-plan-meta,
    .office-add-sub {
      color: #64748b;
    }
    .dash-section {
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 14px;
    }
    .dash-section h3 {
      color: #111827;
      font-size: 14px;
      font-weight: 700;
    }
    .dash-card {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #ffffff;
      box-shadow: none;
      padding: 12px;
      position: relative;
      overflow: hidden;
    }
    .dash-card::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
    }
    .dash-card-value {
      font-size: 22px;
      color: #111827;
    }
    .dash-table-wrap {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #ffffff;
    }
    .dash-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
    }
    .dash-table th,
    .dash-table td {
      border-bottom: 1px solid #e5eaf1;
      padding: 8px 10px;
    }

    .status-idle { background: #edf2f7; color: #475569; }
    .status-starting { background: #fffbeb; color: #b45309; }
    .status-running { background: #ecfdf3; color: #15803d; }
    .status-completed { background: #eff6ff; color: #1d4ed8; }
    .status-stopped { background: #f1f5f9; color: #64748b; }
    .status-error { background: #fef2f2; color: #b91c1c; }

    .sub-tab {
      border-radius: 8px;
      border-color: var(--line-strong);
      background: #ffffff;
      color: #475569;
    }
    .sub-tab.active {
      border-color: #f2c572;
      background: #fffaf0;
      color: #92400e;
    }
    .badge-active {
      background: #fff7e6;
      color: #92400e;
    }

    .flow-modal-mask {
      background: rgba(15, 23, 42, 0.45);
    }
    .flow-modal {
      border-color: var(--line);
      border-radius: 12px;
      background: #ffffff;
      box-shadow: var(--shadow-md);
    }
    .flow-modal-head,
    .flow-modal-foot {
      border-color: var(--line);
      background: #ffffff;
    }
    .flow-modal-title {
      color: #111827;
      font-size: 20px;
    }

    .global-api-card-active {
      border-color: #f2c572;
      box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.22);
    }
    .btn-sm {
      border-radius: 8px;
      border-color: var(--line-strong);
      background: #ffffff;
      color: #334155;
    }
    .btn-sm:hover {
      border-color: #f2c572;
      background: #fffaf0;
    }
    .btn-sm.btn-danger {
      border-color: #fecaca;
      background: #fff5f5;
      color: #b91c1c;
    }
    .btn-sm.btn-danger:hover {
      border-color: #fca5a5;
      background: #fee2e2;
    }

    @media (max-width: 1600px) {
      .body { grid-template-columns: 210px 1fr 320px; }
      .body.no-right-panel { grid-template-columns: 210px 1fr; }
      .grid { grid-template-columns: repeat(2, minmax(200px, 1fr)); }
      .dash-summary-grid { grid-template-columns: repeat(2, minmax(120px, 1fr)); }
    }
    @media (max-width: 1200px) {
      .body,
      .body.no-right-panel {
        grid-template-columns: 1fr;
      }
      .left-nav {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .nav-group {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .center {
        border-right: 0;
      }
      .right-panel {
        border-top: 1px solid var(--line);
      }
      .member-editor-row {
        grid-template-columns: 56px 1fr;
      }
      .flow-plan-grid {
        grid-template-columns: 1fr;
      }
      .flow-preview-row {
        grid-template-columns: 1fr;
      }
      .dash-summary-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 760px) {
      #app {
        padding: 10px;
      }
      .frame {
        border-radius: 10px;
        min-height: calc(100vh - 20px);
      }
      .topbar {
        height: auto;
        padding: 12px;
        gap: 10px;
        align-items: flex-start;
        flex-direction: column;
      }
      .brand-text {
        font-size: 22px;
      }
      .nav-group {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .grid,
      .dash-summary-grid {
        grid-template-columns: 1fr;
      }
      .view-title {
        font-size: 24px;
      }
      .global-api-card-header {
        flex-wrap: wrap;
      }
      .sub-event-head,
      .sub-chunk-head {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `;
  document.head.appendChild(style);
}
