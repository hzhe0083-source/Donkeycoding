import type {
  ApiKeysForm,
  BusyAction,
  ChunkView,
  DashboardState,
  GlobalApiConfig,
  GuideAction,
  GuideFlowState,
  GuideMessage,
  GuidePhase,
  OfficeDraft,
  OfficeSnapshot,
  ParticipantView,
  Provider,
  Role,
  ToastKind,
} from "./types";

function createDefaultMember(
  officeId: string,
  suffix: string,
  provider: Provider,
  modelId: string,
  role: Role,
) {
  return {
    participantId: `${officeId}-${suffix}`,
    provider,
    modelId,
    role,
    enabled: true,
  };
}

function createDefaultOffice(
  officeId: string,
  officeName: string,
  objective: string,
): OfficeDraft {
  return {
    officeId,
    officeName,
    objective,
    maxRounds: 3,
    members: [
      createDefaultMember(officeId, "chatgpt", "openai", "gpt-4.1", "proposer"),
      createDefaultMember(officeId, "gemini", "google", "gemini-1.5-pro", "critic"),
      createDefaultMember(officeId, "claude", "anthropic", "claude-3-5-sonnet", "synthesizer"),
    ],
  };
}

function createEmptySnapshot(officeId: string): OfficeSnapshot {
  return {
    officeId,
    status: "idle",
    sessionId: "-",
    turnIndex: 0,
    agreementScore: 0,
    totalTokens: 0,
    totalCost: 0,
    lastSummary: "暂无会议结论",
    lastUpdatedAt: new Date().toISOString(),
  };
}

const initialOffices: OfficeDraft[] = [];

const initialSnapshots: Record<string, OfficeSnapshot> = Object.fromEntries(
  initialOffices.map((office) => [office.officeId, createEmptySnapshot(office.officeId)]),
);

export const state: DashboardState = {
  orchestratorRunning: false,
  runStatus: "idle",
  busyAction: "none",
  workspaceMode: "offices",
  officeStatusFilter: "all",
  officeSortBy: "priority",
  officeSortDirection: "asc",
  activeOfficeId: "",
  offices: initialOffices,
  officeSnapshots: initialSnapshots,
  sessionOfficeMap: {},
  sessionId: "-",
  turnIndex: 0,
  agreementScore: 0,
  totalTokens: 0,
  totalCost: 0,
  participants: [],
  chunks: [],
  notifications: [],
  logs: [],
  humanDraftByOfficeId: {},
  toasts: [],
  apiKeys: {
    openai: "",
    openai_compatible: "",
    anthropic: "",
    google: "",
    deepseek: "",
  },
  globalApis: [
    {
      name: "默认接口",
      duty: "developer",
      provider: "openai",
      modelId: "gpt-4.1",
      endpoint: "",
      apiKey: "",
    },
  ],
  dutyRolePolicy: {
    developer: ["proposer", "synthesizer", "critic"],
    frontend: ["proposer", "synthesizer", "critic"],
    tester: ["verifier", "critic", "researcher"],
    product_manager: ["proposer", "synthesizer", "arbiter"],
    mathematician: ["verifier", "researcher", "critic"],
    researcher: ["researcher", "critic", "verifier"],
    architect: ["synthesizer", "arbiter", "proposer"],
    reviewer: ["critic", "verifier", "arbiter"],
  },
  activeGlobalApiIndex: 0,
  globalApiImportText: "",
  openaiCompatibleEndpoint: "",
  anthropicCompatibleEndpoint: "",
  review: {
    enabled: true,
    language: "zh-CN",
    minSeverity: "MEDIUM",
    maxFindings: 8,
    requireEvidence: true,
    categoriesText: "correctness, security, performance, maintainability",
  },
  operators: [
    { name: "sanitize_input", enabled: true, configText: "null" },
    { name: "context_window", enabled: true, configText: "null" },
    { name: "participant_selector", enabled: true, configText: "null" },
    { name: "role_response_format", enabled: true, configText: "null" },
    { name: "review_instruction", enabled: true, configText: "null" },
    { name: "review_findings", enabled: true, configText: "null" },
    { name: "output_guard", enabled: true, configText: "null" },
  ],
  _subTab: "notifications",
};

let nextToastId = 1;

export function setBusyAction(action: BusyAction): void {
  state.busyAction = action;
}

export function pushToast(kind: ToastKind, message: string): number {
  const id = nextToastId;
  nextToastId += 1;

  state.toasts = [...state.toasts, { id, kind, message }].slice(-4);
  return id;
}

export function dismissToast(id: number): void {
  state.toasts = state.toasts.filter((toast) => toast.id !== id);
}

export function getActiveOffice(): OfficeDraft | undefined {
  const found = state.offices.find((office) => office.officeId === state.activeOfficeId);
  if (found) {
    return found;
  }

  const fallback = state.offices[0];
  if (!fallback) {
    state.activeOfficeId = "";
    return undefined;
  }

  state.activeOfficeId = fallback.officeId;
  return fallback;
}

export function setActiveOffice(officeId: string): void {
  if (state.offices.some((office) => office.officeId === officeId)) {
    state.activeOfficeId = officeId;
  }
}

export function getOfficeBySessionId(sessionId: string): OfficeDraft | undefined {
  const officeId = state.sessionOfficeMap[sessionId];
  if (!officeId) {
    return undefined;
  }
  return state.offices.find((office) => office.officeId === officeId);
}

export function setSessionOffice(sessionId: string, officeId: string): void {
  if (!officeId || !state.offices.some((office) => office.officeId === officeId)) {
    return;
  }

  state.sessionOfficeMap[sessionId] = officeId;
  updateOfficeSnapshot(officeId, { sessionId });
}

export function updateOfficeSnapshot(officeId: string, patch: Partial<OfficeSnapshot>): void {
  const current = state.officeSnapshots[officeId] ?? createEmptySnapshot(officeId);
  state.officeSnapshots[officeId] = {
    ...current,
    ...patch,
    officeId,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function nextOfficeIndex(): number {
  const used = new Set(
    state.offices
      .map((office) => office.officeId)
      .map((id) => id.replace("office-", ""))
      .map((indexText) => Number(indexText))
      .filter((index) => Number.isFinite(index) && index > 0),
  );

  let index = 1;
  while (used.has(index)) {
    index += 1;
  }
  return index;
}

function officeLabelByIndex(index: number): string {
  if (index >= 1 && index <= 26) {
    return `办公室 ${String.fromCharCode(64 + index)}`;
  }
  return `办公室 ${index}`;
}

export function addOffice(): void {
  const index = nextOfficeIndex();
  const officeId = `office-${index}`;
  const officeName = officeLabelByIndex(index);
  const office = createDefaultOffice(officeId, officeName, "在这里定义该办公室本轮创作目标");

  state.offices.push(office);
  state.officeSnapshots[officeId] = createEmptySnapshot(officeId);
  state.activeOfficeId = officeId;
}

export function removeOffice(officeId: string): void {
  if (state.offices.length <= 1) {
    return;
  }

  state.offices = state.offices.filter((office) => office.officeId !== officeId);
  delete state.officeSnapshots[officeId];

  for (const [sessionId, mappedOfficeId] of Object.entries(state.sessionOfficeMap)) {
    if (mappedOfficeId === officeId) {
      delete state.sessionOfficeMap[sessionId];
    }
  }

  if (state.activeOfficeId === officeId) {
    const fallback = state.offices[0];
    state.activeOfficeId = fallback ? fallback.officeId : "";
  }
}

export function pushLog(line: string): void {
  state.logs.unshift(`[${new Date().toISOString()}] ${line}`);
  if (state.logs.length > 300) {
    state.logs = state.logs.slice(0, 300);
  }
}

export function pushNotification(method: string, payload: unknown): void {
  state.notifications.unshift({
    time: new Date().toISOString(),
    method,
    payload,
  });
  if (state.notifications.length > 200) {
    state.notifications = state.notifications.slice(0, 200);
  }
}

// ─── AI 引导对话状态 ───

let nextGuideMessageId = 1;

export const guideFlow: GuideFlowState = {
  open: false,
  phase: "greeting",
  messages: [],
  participantLabels: {},
  leaderParticipantId: "",
  secretaryCanFinalize: false,
  userInput: "",
  confirmedGoal: "",
  selectedPlanId: "",
  officeName: "",
  maxRounds: 3,
  aiThinking: false,
  creating: false,
  sessionId: "",
};

export function openGuideFlow(): void {
  guideFlow.open = true;
  guideFlow.phase = "greeting";
  guideFlow.messages = [];
  guideFlow.participantLabels = {};
  guideFlow.leaderParticipantId = "";
  guideFlow.secretaryCanFinalize = false;
  guideFlow.userInput = "";
  guideFlow.confirmedGoal = "";
  guideFlow.selectedPlanId = "";
  guideFlow.officeName = "";
  guideFlow.maxRounds = 3;
  guideFlow.aiThinking = false;
  guideFlow.creating = false;
  guideFlow.sessionId = "";

  // AI 主动打招呼
  pushGuideMessage("ai", "👋 你好！我是你的 Workerflow 助手。\n\n告诉我你想让 AI 团队帮你完成什么任务？\n比如：\n• 帮我做一个技术方案评审\n• 写一份产品需求文档\n• 分析竞品并给出建议\n\n请描述你的目标，我来帮你组建最合适的 AI 办公室 🏢", []);
}

export function closeGuideFlow(): void {
  guideFlow.open = false;
  guideFlow.aiThinking = false;
  guideFlow.creating = false;
}

export function pushGuideMessage(
  sender: GuideMessage["sender"],
  text: string,
  actions?: GuideAction[],
  meta?: Pick<GuideMessage, "participantId" | "authorLabel" | "streamKey">,
): GuideMessage {
  const msg: GuideMessage = {
    id: nextGuideMessageId++,
    sender,
    text,
    timestamp: new Date().toISOString(),
    actions,
    participantId: meta?.participantId,
    authorLabel: meta?.authorLabel,
    streamKey: meta?.streamKey,
  };
  guideFlow.messages.push(msg);
  return msg;
}

export function setGuidePhase(phase: GuidePhase): void {
  guideFlow.phase = phase;
}

export function pushChunk(chunk: ChunkView): void {
  state.chunks.unshift(chunk);
  if (state.chunks.length > 400) {
    state.chunks = state.chunks.slice(0, 400);
  }
}

export function updateParticipant(participantId: string, patch: Partial<ParticipantView>): void {
  const found = state.participants.find((item) => item.participantId === participantId);
  if (found) {
    Object.assign(found, patch);
    return;
  }

  state.participants.push({
    participantId,
    role: patch.role ?? "-",
    provider: patch.provider ?? "-",
    modelId: patch.modelId ?? "-",
    status: patch.status ?? "pending",
    latencyMs: patch.latencyMs,
  });
}

// ─── 持久化设置到 localStorage ───

const STORAGE_KEY = "beboss-settings";
const LEGACY_STORAGE_KEY = "donkey-studio-settings";

type PersistedSettings = {
  globalApis: GlobalApiConfig[];
  dutyRolePolicy: import("./types").DutyRolePolicy;
  activeGlobalApiIndex: number;
  apiKeys: ApiKeysForm;
  openaiCompatibleEndpoint: string;
  anthropicCompatibleEndpoint: string;
  offices: OfficeDraft[];
};

export function saveSettings(): void {
  try {
    const data: PersistedSettings = {
      globalApis: state.globalApis,
      dutyRolePolicy: state.dutyRolePolicy,
      activeGlobalApiIndex: state.activeGlobalApiIndex,
      apiKeys: state.apiKeys,
      openaiCompatibleEndpoint: state.openaiCompatibleEndpoint,
      anthropicCompatibleEndpoint: state.anthropicCompatibleEndpoint,
      offices: state.offices,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 不可用时静默忽略
  }
}

export function loadSettings(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return;
    }

    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, raw);
    }

    const data = JSON.parse(raw) as Partial<PersistedSettings>;

    if (Array.isArray(data.globalApis) && data.globalApis.length > 0) {
      state.globalApis = data.globalApis.map((api) => ({
        name:
          api && typeof api === "object" && "name" in api && typeof (api as { name?: unknown }).name === "string"
            ? (api as { name: string }).name
            : "接口",
        duty:
          api && typeof api === "object" && "duty" in api
            ? ((api as { duty?: unknown }).duty === "developer" ||
                (api as { duty?: unknown }).duty === "frontend" ||
                (api as { duty?: unknown }).duty === "tester" ||
                (api as { duty?: unknown }).duty === "product_manager" ||
                (api as { duty?: unknown }).duty === "mathematician" ||
                (api as { duty?: unknown }).duty === "researcher" ||
                (api as { duty?: unknown }).duty === "architect" ||
                (api as { duty?: unknown }).duty === "reviewer"
                ? ((api as { duty: import("./types").ApiDuty }).duty)
                : "developer")
            : "developer",
        provider:
          api && typeof api === "object" && "provider" in api
            ? ((api as { provider: import("./types").Provider }).provider)
            : "openai",
        modelId:
          api && typeof api === "object" && "modelId" in api && typeof (api as { modelId?: unknown }).modelId === "string"
            ? (api as { modelId: string }).modelId
            : "",
        endpoint:
          api && typeof api === "object" && "endpoint" in api && typeof (api as { endpoint?: unknown }).endpoint === "string"
            ? (api as { endpoint: string }).endpoint
            : "",
        apiKey:
          api && typeof api === "object" && "apiKey" in api && typeof (api as { apiKey?: unknown }).apiKey === "string"
            ? (api as { apiKey: string }).apiKey
            : "",
      }));
    }
    if (typeof data.activeGlobalApiIndex === "number" && data.activeGlobalApiIndex >= 0) {
      state.activeGlobalApiIndex = Math.min(data.activeGlobalApiIndex, state.globalApis.length - 1);
    }
    if (data.dutyRolePolicy && typeof data.dutyRolePolicy === "object") {
      const raw = data.dutyRolePolicy as Partial<import("./types").DutyRolePolicy>;
      const normalizeRoleList = (roles: unknown, fallback: import("./types").Role[]): import("./types").Role[] => {
        if (!Array.isArray(roles)) {
          return fallback;
        }

        const valid = roles.filter(
          (role): role is import("./types").Role =>
            role === "proposer" ||
            role === "critic" ||
            role === "synthesizer" ||
            role === "arbiter" ||
            role === "researcher" ||
            role === "verifier",
        );

        return valid.length > 0 ? valid : fallback;
      };

      state.dutyRolePolicy = {
        developer: normalizeRoleList(raw.developer, state.dutyRolePolicy.developer),
        frontend: normalizeRoleList(raw.frontend, state.dutyRolePolicy.frontend),
        tester: normalizeRoleList(raw.tester, state.dutyRolePolicy.tester),
        product_manager: normalizeRoleList(raw.product_manager, state.dutyRolePolicy.product_manager),
        mathematician: normalizeRoleList(raw.mathematician, state.dutyRolePolicy.mathematician),
        researcher: normalizeRoleList(raw.researcher, state.dutyRolePolicy.researcher),
        architect: normalizeRoleList(raw.architect, state.dutyRolePolicy.architect),
        reviewer: normalizeRoleList(raw.reviewer, state.dutyRolePolicy.reviewer),
      };
    }
    if (data.apiKeys && typeof data.apiKeys === "object") {
      const keys = data.apiKeys;
      if (typeof keys.openai === "string") state.apiKeys.openai = keys.openai;
      if (typeof keys.openai_compatible === "string") state.apiKeys.openai_compatible = keys.openai_compatible;
      if (typeof keys.anthropic === "string") state.apiKeys.anthropic = keys.anthropic;
      if (typeof keys.google === "string") state.apiKeys.google = keys.google;
      if (typeof keys.deepseek === "string") state.apiKeys.deepseek = keys.deepseek;
    }
    if (typeof data.openaiCompatibleEndpoint === "string") {
      state.openaiCompatibleEndpoint = data.openaiCompatibleEndpoint;
    }
    if (typeof data.anthropicCompatibleEndpoint === "string") {
      state.anthropicCompatibleEndpoint = data.anthropicCompatibleEndpoint;
    }
    if (Array.isArray(data.offices) && data.offices.length > 0) {
      state.offices = data.offices;
      state.officeSnapshots = Object.fromEntries(
        data.offices.map((office) => [office.officeId, createEmptySnapshot(office.officeId)]),
      );
      state.activeOfficeId = data.offices[0].officeId;
    }
  } catch {
    // JSON 解析失败或 localStorage 不可用时静默忽略
  }
}
