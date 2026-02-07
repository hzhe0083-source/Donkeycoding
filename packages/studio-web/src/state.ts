import type {
  ChunkView,
  DashboardState,
  OfficeDraft,
  OfficeSnapshot,
  ParticipantView,
  Provider,
  Role,
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

const initialOffices: OfficeDraft[] = [
  createDefaultOffice(
    "office-1",
    "办公室 A",
    "设计并实现一个可复用的三模型协作创作流程",
  ),
  createDefaultOffice(
    "office-2",
    "办公室 B",
    "围绕同一目标提出替代方案，并进行风险评审",
  ),
];

const initialSnapshots: Record<string, OfficeSnapshot> = Object.fromEntries(
  initialOffices.map((office) => [office.officeId, createEmptySnapshot(office.officeId)]),
);

export const state: DashboardState = {
  orchestratorRunning: false,
  runStatus: "idle",
  workspaceMode: "offices",
  activeOfficeId: "office-1",
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
  apiKeys: {
    openai: "",
    anthropic: "",
    google: "",
    deepseek: "",
  },
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
};

export function getActiveOffice(): OfficeDraft {
  const found = state.offices.find((office) => office.officeId === state.activeOfficeId);
  if (found) {
    return found;
  }

  const fallback = state.offices[0];
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
    state.activeOfficeId = state.offices[0].officeId;
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
