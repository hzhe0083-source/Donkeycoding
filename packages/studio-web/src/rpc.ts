import { invoke } from "@tauri-apps/api/core";
import { applyRpcResult } from "./notifications";
import {
  getOfficeBySessionId,
  getActiveOffice,
  guideFlow,
  pushLog,
  setSessionOffice,
  state,
  updateOfficeSnapshot,
} from "./state";
import type { ApiDuty, Role, RpcResult } from "./types";
import { safeJson, toErrorMessage } from "./utils";

const DEFAULT_DUTY_ROLE_POLICY: Record<ApiDuty, Role[]> = {
  developer: ["proposer", "synthesizer", "critic"],
  frontend: ["proposer", "synthesizer", "critic"],
  tester: ["verifier", "critic", "researcher"],
  product_manager: ["proposer", "synthesizer", "arbiter"],
  mathematician: ["verifier", "researcher", "critic"],
  researcher: ["researcher", "critic", "verifier"],
  architect: ["synthesizer", "arbiter", "proposer"],
  reviewer: ["critic", "verifier", "arbiter"],
};

export type ActionResult = {
  ok: boolean;
  message: string;
  sessionId?: string;
  outputs?: GuideParticipantOutput[];
};

export type GuideParticipantOutput = {
  participantId: string;
  status: string;
  content: string;
  latencyMs?: number;
  errorCode?: string;
  errorMessage?: string;
};

function isGuideParticipantOutput(
  item: GuideParticipantOutput | undefined,
): item is GuideParticipantOutput {
  return item !== undefined;
}

function parseCategories(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseOperatorConfig(configText: string, operatorName: string): unknown {
  const text = configText.trim();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`绠楀瓙 ${operatorName} 鐨?config 涓嶆槸鍚堟硶 JSON`);
  }
}

function getActiveGlobalApi(): import("./types").GlobalApiConfig | undefined {
  return state.globalApis[state.activeGlobalApiIndex] ?? state.globalApis[0];
}

function buildSecretaryCollaborationInstruction(secretaryCanFinalize: boolean): string {
  const finalizeRule = secretaryCanFinalize
    ? "4) The secretary may finalize on behalf of the user only when explicit authorization is already provided in this session; if authorization is missing or ambiguous, ask for confirmation first."
    : "4) The secretary must not make final decisions; always hand over a clear confirmation checkpoint to the user before finalizing.";

  return [
    "[Secretary Collaboration Mode]",
    "The leader acts as the user's Chief of Staff (secretary), not a unilateral decision maker.",
    "1) First restate the user's goal and constraints before proposing details.",
    "2) Do not jump to a final answer immediately; require at least one round of cross-review from other participants (feasibility, risk, missing details).",
    "3) After synthesizing options, provide a concrete confirmation checkpoint for the user.",
    finalizeRule,
  ].join("\n");
}

function asApiDuty(value: string | undefined): ApiDuty {
  if (!value) {
    return "developer";
  }

  if (
    value === "developer" ||
    value === "frontend" ||
    value === "tester" ||
    value === "product_manager" ||
    value === "mathematician" ||
    value === "researcher" ||
    value === "architect" ||
    value === "reviewer"
  ) {
    return value;
  }

  return "developer";
}

function rolePriorityForDuty(duty: ApiDuty): Role[] {
  const configured = state.dutyRolePolicy[duty];
  if (Array.isArray(configured) && configured.length > 0) {
    return configured;
  }
  return DEFAULT_DUTY_ROLE_POLICY[duty] ?? ["proposer", "critic", "researcher"];
}

function roleForDuty(duty: ApiDuty): Role {
  return rolePriorityForDuty(duty)[0] ?? "proposer";
}

function buildGuideParticipantsFromGlobal(): Array<Record<string, unknown>> {
  if (state.globalApis.length === 0) {
    pushLog("[guide] buildGuideParticipantsFromGlobal: no global API config");
    return [];
  }

  const participants: Array<Record<string, unknown>> = [];
  let leaderSet = false;

  const secretaryIndex =
    state.activeGlobalApiIndex >= 0 && state.activeGlobalApiIndex < state.globalApis.length
      ? state.activeGlobalApiIndex
      : 0;

  state.globalApis.forEach((api, index) => {
    const provider = api.provider;
    const modelId = api.modelId.trim();
    if (!modelId) {
      pushLog(`[guide] skip api index=${index}: no modelId for provider=${provider}`);
      return;
    }

    const endpoint =
      api.endpoint.trim() ||
      (provider === "openai_compatible"
        ? state.openaiCompatibleEndpoint.trim()
        : provider === "anthropic"
        ? state.anthropicCompatibleEndpoint.trim()
        : "");
    const apiKey = api.apiKey.trim() || state.apiKeys[provider].trim();
    const duty = asApiDuty(api.duty as string);
    const role =
      index === secretaryIndex
        ? "proposer"
        : roleForDuty(duty);

    if (!apiKey) {
      pushLog(`[guide] skip api index=${index}: missing api key for provider=${provider}`);
      return;
    }

    participants.push({
      participant_id: `guide-${role}-${index + 1}`,
      role,
      provider,
      model_id: modelId,
      endpoint: endpoint || undefined,
      api_key: apiKey || undefined,
    });

    const participantId = `guide-${role}-${index + 1}`;

    if (!leaderSet && index === secretaryIndex) {
      guideFlow.leaderParticipantId = participantId;
      leaderSet = true;
    } else if (!leaderSet && role === "proposer") {
      guideFlow.leaderParticipantId = `guide-${role}-${index + 1}`;
      leaderSet = true;
    }

    const providerLabel =
      provider === "openai"
        ? "OpenAI"
        : provider === "openai_compatible"
        ? "OpenAI Compatible"
        : provider === "anthropic"
        ? "Anthropic"
        : provider === "google"
        ? "Google"
        : "DeepSeek";
    const roleLabel =
      role === "proposer"
        ? "Proposer"
        : role === "critic"
        ? "Critic"
        : role === "researcher"
        ? "Researcher"
        : role === "verifier"
        ? "Verifier"
        : role;
    guideFlow.participantLabels[participantId] =
      index === secretaryIndex
        ? `秘书（你的分身） · ${providerLabel}/${modelId}`
        : `${api.name.trim() || roleLabel}（${roleLabel}） · ${providerLabel}/${modelId}`;

    pushLog(
      `[guide] participant#${index + 1}: role=${role}, provider=${provider}, model=${modelId}, endpoint=${endpoint || "(default)"}, hasKey=${apiKey.length > 0}`,
    );
  });

  return participants;
}

function buildGuideOperatorsConfig(): Record<string, unknown> {
  return {
    chain: [
      { name: "sanitize_input", enabled: true, config: null },
      { name: "context_window", enabled: true, config: null },
      {
        name: "participant_selector",
        enabled: true,
        config: {
          max_participants: 5,
        },
      },
      {
        name: "role_response_format",
        enabled: true,
        config: {
          include_checklist: false,
          json_mode: false,
        },
      },
      {
        name: "guide_collaboration",
        enabled: true,
        config: {
          instruction: buildSecretaryCollaborationInstruction(
            guideFlow.secretaryCanFinalize,
          ),
          leader_participant_id: guideFlow.leaderParticipantId || null,
          require_visible_reasoning_path: true,
        },
      },
      { name: "review_instruction", enabled: false, config: null },
      { name: "review_findings", enabled: false, config: null },
      { name: "output_guard", enabled: true, config: null },
    ],
  };
}

function buildGuideReviewPolicy(): Record<string, unknown> {
  return {
    enabled: false,
    language: "zh-CN",
    min_severity: "MEDIUM",
    max_findings: 6,
    require_evidence: true,
    categories: ["correctness", "feasibility", "risk"],
  };
}

export async function refreshOrchestratorStatus(): Promise<void> {
  try {
    const result = await invoke<RpcResult<{ running: boolean }>>("orchestrator_status");
    state.orchestratorRunning = Boolean(result.data?.running);
    if (!state.orchestratorRunning && state.runStatus === "running") {
      state.runStatus = "stopped";
    }
  } catch (error) {
    state.orchestratorRunning = false;
    pushLog(`orchestrator_status failed: ${toErrorMessage(error)}`);
  }
}

export async function startOrchestrator(): Promise<ActionResult> {
  state.runStatus = "starting";

  try {
    const result = await invoke<RpcResult<{ status?: string; exe?: string }>>(
      "start_orchestrator",
    );
    state.orchestratorRunning = result.success;
    state.runStatus = result.success ? "running" : "error";
    pushLog(`start_orchestrator: ${safeJson(result.data)}`);
    if (result.success) {
      return { ok: true, message: "寮曟搸鍚姩鎴愬姛" };
    }
    const reason = result.error ? `锛?{result.error}` : "";
    return { ok: false, message: `寮曟搸鍚姩澶辫触${reason}` };
  } catch (error) {
    state.orchestratorRunning = false;
    state.runStatus = "error";
    const message = `寮曟搸鍚姩澶辫触锛?{toErrorMessage(error)}`;
    pushLog(`start_orchestrator failed: ${toErrorMessage(error)}`);
    return { ok: false, message };
  }
}

export async function stopOrchestrator(): Promise<void> {
  try {
    const result = await invoke<RpcResult>("stop_orchestrator");
    state.orchestratorRunning = false;
    state.runStatus = result.success ? "stopped" : "error";
    pushLog(`stop_orchestrator: ${safeJson(result.data)}`);
  } catch (error) {
    state.runStatus = "error";
    pushLog(`stop_orchestrator failed: ${toErrorMessage(error)}`);
  }
}

export async function callRpc(method: string, params?: Record<string, unknown>): Promise<unknown> {
  if (!state.orchestratorRunning) {
    throw new Error("orchestrator not running");
  }

  const result = await invoke<unknown>("send_rpc", {
    method,
    params: params ?? null,
  });

  applyRpcResult(method, result);
  pushLog(`rpc ${method} -> ${safeJson(result)}`);
  return result;
}

export async function pingEngine(): Promise<void> {
  try {
    await callRpc("ping");
  } catch (error) {
    pushLog(`ping failed: ${toErrorMessage(error)}`);
  }
}

export async function setKeys(): Promise<ActionResult> {
  try {
    await callRpc("config/setKeys", {
      openai: state.apiKeys.openai,
      openai_compatible: state.apiKeys.openai_compatible,
      anthropic: state.apiKeys.anthropic,
      google: state.apiKeys.google,
      deepseek: state.apiKeys.deepseek,
    });
    return { ok: true, message: "API keys synced" };
  } catch (error) {
    const message = `Failed to sync API keys: ${toErrorMessage(error)}`;
    pushLog(`config/setKeys failed: ${toErrorMessage(error)}`);
    return { ok: false, message };
  }
}

export async function startOfficeDebate(): Promise<ActionResult> {
  const office = getActiveOffice();
  if (!office) {
    return { ok: false, message: "Please create an office first" };
  }

  try {
    const categories = parseCategories(state.review.categoriesText);
    const objective = office.objective.trim();

    const chain = state.operators
      .filter((operator) => operator.name.trim().length > 0)
      .map((operator) => ({
        name: operator.name.trim(),
        enabled: operator.enabled,
        config: parseOperatorConfig(operator.configText, operator.name.trim()),
      }));

    const participants = office.members
      .filter((member) => member.enabled)
      .map((member) => ({
        participant_id: member.participantId,
        role: member.role,
        provider: member.provider,
        model_id: member.modelId,
        endpoint: member.endpoint?.trim() || undefined,
        api_key: member.apiKey?.trim() || undefined,
      }));

    if (!objective) {
      throw new Error("Please fill in office objective first");
    }
    if (!Number.isFinite(office.maxRounds) || office.maxRounds < 1 || office.maxRounds > 20) {
      throw new Error("杞闇€瑕佸湪 1 鍒?20 涔嬮棿");
    }
    if (participants.some((participant) => !participant.model_id.trim())) {
      throw new Error("鍚敤鎴愬憳蹇呴』濉啓妯″瀷 ID");
    }
    if (participants.length < 2) {
      throw new Error("Enable at least 2 AI members to start discussion");
    }
    if (categories.length === 0) {
      throw new Error("review categories 涓嶈兘涓虹┖");
    }
    if (chain.filter((operator) => operator.enabled).length === 0) {
      throw new Error("Enable at least one operator");
    }

    updateOfficeSnapshot(office.officeId, {
      status: "starting",
      turnIndex: 0,
      lastSummary: "鍔炲叕瀹や細璁惎鍔ㄤ腑...",
    });

    const result = await callRpc("session/start", {
      task: objective,
      participants,
      policy: {
        stop: {
          max_rounds: office.maxRounds,
        },
      },
      review: {
        enabled: state.review.enabled,
        language: state.review.language,
        min_severity: state.review.minSeverity,
        max_findings: state.review.maxFindings,
        require_evidence: state.review.requireEvidence,
        categories,
      },
      operators: {
        chain,
      },
    });

    const asRecord = result as Record<string, unknown>;
    const sessionId = typeof asRecord.session_id === "string" ? asRecord.session_id : "";
    if (sessionId) {
      setSessionOffice(sessionId, office.officeId);
      updateOfficeSnapshot(office.officeId, { sessionId, status: "running" });
      state.sessionId = sessionId;
      return { ok: true, message: `Office started: ${sessionId}`, sessionId };
    }

    updateOfficeSnapshot(office.officeId, {
      status: "running",
      lastSummary: "session/start sent, waiting for session ID",
    });
    return { ok: true, message: "Office debate started" };
  } catch (error) {
    const reason = toErrorMessage(error);
    pushLog(`startOfficeDebate failed: ${reason}`);
    updateOfficeSnapshot(office.officeId, {
      status: "error",
      lastSummary: `Start failed: ${reason}`,
    });
    state.runStatus = "error";
    return { ok: false, message: `Start failed: ${reason}` };
  }
}

export async function sendOfficeChat(message: string): Promise<ActionResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { ok: false, message: "Please enter a message first" };
  }

  try {
    const params: Record<string, unknown> = { message: trimmed };
    if (state.sessionId !== "-") {
      params.session_id = state.sessionId;
    }
    await callRpc("chat/send", params);
    return { ok: true, message: "Message sent" };
  } catch (error) {
    const reason = toErrorMessage(error);
    pushLog(`chat/send failed: ${reason}`);
    return { ok: false, message: `Send failed: ${reason}` };
  }
}

export async function stopOfficeDebate(): Promise<ActionResult> {
  if (state.sessionId === "-") {
    pushLog("chat/stop skipped: no active session");
    return { ok: false, message: "No active session to stop" };
  }

  const targetSessionId = state.sessionId;

  try {
    await callRpc("chat/stop", { session_id: targetSessionId });

    const office = getOfficeBySessionId(targetSessionId);
    if (office) {
      updateOfficeSnapshot(office.officeId, {
        status: "stopped",
        lastSummary: "Session stopped",
      });
    }

    return { ok: true, message: "Stop command sent" };
  } catch (error) {
    const reason = toErrorMessage(error);
    pushLog(`chat/stop failed: ${reason}`);
    return { ok: false, message: `Stop failed: ${reason}` };
  }
}

export async function executeWorkflowScript(scriptText: string): Promise<ActionResult> {
  const office = getActiveOffice();
  if (!office) {
    return { ok: false, message: "Please create an office first" };
  }

  const trimmed = scriptText.trim();
  if (!trimmed) {
    return { ok: false, message: "璇峰厛杈撳叆 workflow JSON" };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return { ok: false, message: "workflow JSON 瑙ｆ瀽澶辫触" };
  }

  const payload: Record<string, unknown> = {
    ...parsed,
    session_id: state.sessionId !== "-" ? state.sessionId : undefined,
    continue_chat:
      typeof parsed.continue_chat === "boolean" ? parsed.continue_chat : true,
    followup_prompt:
      typeof parsed.followup_prompt === "string"
        ? parsed.followup_prompt
        : "I have executed the workflow steps. Continue the coding plan and propose the next actionable change.",
  };

  try {
    const result = (await callRpc("workflow/execute", payload)) as Record<string, unknown>;
    const sessionId = typeof result.session_id === "string" ? result.session_id : "";
    if (sessionId) {
      setSessionOffice(sessionId, office.officeId);
      updateOfficeSnapshot(office.officeId, {
        sessionId,
        status: "running",
        lastSummary: "Workflow executed and fed back into session",
      });
      state.sessionId = sessionId;
    }

    const total = Number(result.steps_total ?? 0);
    const errors = Number(result.steps_error ?? 0);
    const message =
      errors > 0 ? `Workflow done: ${total} steps, ${errors} failed` : `Workflow done: ${total} steps`;
    return { ok: true, message, sessionId: sessionId || undefined };
  } catch (error) {
    const reason = toErrorMessage(error);
    pushLog(`workflow/execute failed: ${reason}`);
    return { ok: false, message: `Workflow failed: ${reason}` };
  }
}

export async function sendGuideChat(message: string): Promise<ActionResult> {
  if (!state.orchestratorRunning) {
    return {
      ok: false,
      message: "Engine is not running. Start the engine first.",
    };
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return { ok: false, message: "Please enter a message first" };
  }

  try {
    const guideParticipants = buildGuideParticipantsFromGlobal();
    const params: Record<string, unknown> = { message: trimmed };

    if (guideParticipants.length > 0) {
      params.participants = guideParticipants;
      params.operators = buildGuideOperatorsConfig();
      params.review = buildGuideReviewPolicy();
    } else {
      const activeOffice = getActiveOffice();
      if (activeOffice) {
        const participants = activeOffice.members
          .filter((member) => member.enabled)
          .map((member) => ({
            participant_id: member.participantId,
            role: member.role,
            provider: member.provider,
            model_id: member.modelId,
            endpoint: member.endpoint?.trim() || undefined,
            api_key: member.apiKey?.trim() || undefined,
          }));

        if (participants.length > 0) {
          params.participants = participants;
        }
      }
    }

    if (guideFlow.sessionId) {
      params.session_id = guideFlow.sessionId;
    }

    const result = (await callRpc("chat/send", params)) as Record<string, unknown>;
    const sessionId = typeof result.session_id === "string" ? result.session_id : "";

    if (sessionId && !guideFlow.sessionId) {
      guideFlow.sessionId = sessionId;
    }

    const outputsRaw = Array.isArray(result.outputs) ? result.outputs : [];
    const outputs = outputsRaw
      .map((item): GuideParticipantOutput | undefined => {
        const record = item as Record<string, unknown>;
        const participantId =
          typeof record.participant_id === "string" ? record.participant_id : "";
        const status = typeof record.status === "string" ? record.status : "unknown";
        const content = typeof record.content === "string" ? record.content : "";
        const latencyMs =
          typeof record.latency_ms === "number" ? record.latency_ms : undefined;
        const error =
          record.error && typeof record.error === "object"
            ? (record.error as Record<string, unknown>)
            : undefined;
        const errorCode =
          error && typeof error.code === "string" ? error.code : undefined;
        const errorMessage =
          error && typeof error.message === "string" ? error.message : undefined;

        if (!participantId) {
          return undefined;
        }

        return {
          participantId,
          status,
          content,
          latencyMs,
          errorCode,
          errorMessage,
        };
      })
      .filter(isGuideParticipantOutput);

    return {
      ok: true,
      message: "Message sent",
      sessionId: sessionId || undefined,
      outputs,
    };
  } catch (error) {
    const reason = toErrorMessage(error);
    pushLog(`sendGuideChat failed: ${reason}`);
    return { ok: false, message: `Send failed: ${reason}` };
  }
}

export async function querySessionState(): Promise<void> {
  if (state.sessionId === "-") {
    pushLog("session/state skipped: no active session");
    return;
  }

  try {
    await callRpc("session/state", { session_id: state.sessionId });
  } catch (error) {
    pushLog(`session/state failed: ${toErrorMessage(error)}`);
  }
}

