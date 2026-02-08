export type RunStatus =
  | "idle"
  | "starting"
  | "running"
  | "completed"
  | "stopped"
  | "error";

export type WorkspaceMode =
  | "offices"
  | "dashboard"
  | "subscription"
  | "settings"
  | "creation"
  | "review";

export type OfficeStatusFilter = "all" | RunStatus;

export type OfficeSortBy =
  | "priority"
  | "updated"
  | "agreement"
  | "tokens"
  | "cost";

export type SortDirection = "asc" | "desc";

export type NotificationMethod =
  | "turn/chunk"
  | "turn/complete"
  | "session/progress"
  | "session/state"
  | "session/participants"
  | "workflow/step"
  | "workflow/complete";

export type NotificationEnvelope = {
  jsonrpc?: string;
  method?: string;
  params?: Record<string, unknown>;
};

export type RpcResult<T = unknown> = {
  success: boolean;
  data: T;
  error?: string | null;
};

export type ApiKeysForm = {
  openai: string;
  openai_compatible: string;
  anthropic: string;
  google: string;
  deepseek: string;
};

export type GlobalApiConfig = {
  name: string;
  provider: Provider;
  modelId: string;
  endpoint: string;
  apiKey: string;
};

export type Provider =
  | "openai"
  | "openai_compatible"
  | "anthropic"
  | "google"
  | "deepseek";

export type Role =
  | "proposer"
  | "critic"
  | "synthesizer"
  | "arbiter"
  | "researcher"
  | "verifier";

export type OfficeMember = {
  participantId: string;
  provider: Provider;
  modelId: string;
  endpoint?: string;
  apiKey?: string;
  role: Role;
  enabled: boolean;
};

export type OfficeDraft = {
  officeId: string;
  officeName: string;
  objective: string;
  maxRounds: number;
  members: OfficeMember[];
};

export type OfficeSnapshot = {
  officeId: string;
  status: RunStatus;
  sessionId: string;
  turnIndex: number;
  agreementScore: number;
  totalTokens: number;
  totalCost: number;
  lastSummary: string;
  lastUpdatedAt: string;
};

export type ParticipantView = {
  participantId: string;
  role: string;
  provider: string;
  modelId: string;
  status: string;
  latencyMs?: number;
};

export type ChunkView = {
  time: string;
  sessionId: string;
  turnIndex: number;
  participantId: string;
  delta: string;
};

export type ReviewDraft = {
  enabled: boolean;
  language: string;
  minSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  maxFindings: number;
  requireEvidence: boolean;
  categoriesText: string;
};

export type OperatorDraft = {
  name: string;
  enabled: boolean;
  configText: string;
};

export type ToastKind = "info" | "success" | "error";

// AI 引导对话相关类型
export type GuideSender = "ai" | "user" | "system";

export type GuidePhase =
  | "greeting"       // AI 打招呼，询问目标
  | "goal-confirm"   // 确认目标
  | "plan-suggest"   // AI 推荐 workflow 方案
  | "plan-confirm"   // 用户确认方案
  | "config-review"  // AI 展示最终配置供确认
  | "creating"       // 正在创建
  | "done";          // 完成

export type GuideMessage = {
  id: number;
  sender: GuideSender;
  text: string;
  timestamp: string;
  /** 可选：附带快捷操作按钮 */
  actions?: GuideAction[];
};

export type GuideAction = {
  id: string;
  label: string;
  /** 点击后的行为类型 */
  kind: "select-plan" | "confirm" | "edit" | "cancel" | "create";
  /** 附带数据，如方案 ID */
  payload?: string;
};

export type GuideFlowState = {
  open: boolean;
  phase: GuidePhase;
  messages: GuideMessage[];
  userInput: string;
  /** 用户确认的目标 */
  confirmedGoal: string;
  /** AI 推荐并用户选择的方案 ID */
  selectedPlanId: string;
  /** 办公室名称 */
  officeName: string;
  /** 最大轮次 */
  maxRounds: number;
  /** 是否正在等待 AI 回复 */
  aiThinking: boolean;
  /** 是否正在创建办公室 */
  creating: boolean;
  /** 引导对话的 session ID，用于匹配 turn/chunk 通知 */
  sessionId: string;
};

export type UiToast = {
  id: number;
  kind: ToastKind;
  message: string;
};

export type BusyAction =
  | "none"
  | "syncing-keys"
  | "starting-office"
  | "stopping-office"
  | "sending-human"
  | "executing-workflow";

export type SubTab = "notifications" | "chunks";

export type DashboardState = {
  orchestratorRunning: boolean;
  runStatus: RunStatus;
  busyAction: BusyAction;
  workspaceMode: WorkspaceMode;
  officeStatusFilter: OfficeStatusFilter;
  officeSortBy: OfficeSortBy;
  officeSortDirection: SortDirection;
  activeOfficeId: string;
  offices: OfficeDraft[];
  officeSnapshots: Record<string, OfficeSnapshot>;
  sessionOfficeMap: Record<string, string>;
  sessionId: string;
  turnIndex: number;
  agreementScore: number;
  totalTokens: number;
  totalCost: number;
  participants: ParticipantView[];
  chunks: ChunkView[];
  notifications: Array<{ time: string; method: string; payload: unknown }>;
  logs: string[];
  humanDraftByOfficeId: Record<string, string>;
  toasts: UiToast[];
  apiKeys: ApiKeysForm;
  globalApis: GlobalApiConfig[];
  activeGlobalApiIndex: number;
  globalApiImportText: string;
  openaiCompatibleEndpoint: string;
  anthropicCompatibleEndpoint: string;
  review: ReviewDraft;
  operators: OperatorDraft[];
  _subTab: SubTab;
};
