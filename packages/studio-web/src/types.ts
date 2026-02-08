export type RunStatus =
  | "idle"
  | "starting"
  | "running"
  | "completed"
  | "stopped"
  | "error";

export type WorkspaceMode = "offices" | "dashboard" | "subscription" | "creation" | "review";

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
  | "session/participants";

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
  anthropic: string;
  google: string;
  deepseek: string;
};

export type Provider = "openai" | "anthropic" | "google" | "deepseek";

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
  | "sending-human";

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
  review: ReviewDraft;
  operators: OperatorDraft[];
  _subTab: SubTab;
};
