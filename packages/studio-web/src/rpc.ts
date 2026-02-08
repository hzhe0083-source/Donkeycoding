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
import type { RpcResult } from "./types";
import { safeJson, toErrorMessage } from "./utils";

export type ActionResult = {
  ok: boolean;
  message: string;
  sessionId?: string;
  outputs?: Array<{
    participantId: string;
    status: string;
    content: string;
    latencyMs?: number;
    errorCode?: string;
    errorMessage?: string;
  }>;
};

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
    throw new Error(`算子 ${operatorName} 的 config 不是合法 JSON`);
  }
}

function getActiveGlobalApi(): import("./types").GlobalApiConfig | undefined {
  return state.globalApis[state.activeGlobalApiIndex] ?? state.globalApis[0];
}

function buildGuideParticipantsFromGlobal(): Array<Record<string, unknown>> {
  const active = getActiveGlobalApi();
  if (!active) {
    pushLog("[guide] buildGuideParticipantsFromGlobal: no active global API config");
    return [];
  }

  const provider = active.provider;
  const modelId = active.modelId.trim();
  const endpoint =
    active.endpoint.trim() ||
    (provider === "openai_compatible"
      ? state.openaiCompatibleEndpoint.trim()
      : provider === "anthropic"
      ? state.anthropicCompatibleEndpoint.trim()
      : "");
  const apiKey = active.apiKey.trim() || state.apiKeys[provider].trim();

  if (!modelId) {
    pushLog(`[guide] buildGuideParticipantsFromGlobal: no modelId for provider=${provider}`);
    return [];
  }

  pushLog(`[guide] buildGuideParticipantsFromGlobal: provider=${provider}, model=${modelId}, endpoint=${endpoint || "(default)"}, hasKey=${apiKey.length > 0}`);

  return [
    {
      participant_id: "guide-proposer-1",
      role: "proposer",
      provider,
      model_id: modelId,
      endpoint: endpoint || undefined,
      api_key: apiKey || undefined,
    },
  ];
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
      return { ok: true, message: "引擎启动成功" };
    }
    const reason = result.error ? `：${result.error}` : "";
    return { ok: false, message: `引擎启动失败${reason}` };
  } catch (error) {
    state.orchestratorRunning = false;
    state.runStatus = "error";
    const message = `引擎启动失败：${toErrorMessage(error)}`;
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
    return { ok: true, message: "API Keys 已同步" };
  } catch (error) {
    const message = `同步 Keys 失败：${toErrorMessage(error)}`;
    pushLog(`config/setKeys failed: ${toErrorMessage(error)}`);
    return { ok: false, message };
  }
}

export async function startOfficeDebate(): Promise<ActionResult> {
  const office = getActiveOffice();
  if (!office) {
    return { ok: false, message: "请先新建办公室" };
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
      throw new Error("请先填写办公室目标");
    }
    if (!Number.isFinite(office.maxRounds) || office.maxRounds < 1 || office.maxRounds > 20) {
      throw new Error("轮次需要在 1 到 20 之间");
    }
    if (participants.some((participant) => !participant.model_id.trim())) {
      throw new Error("启用成员必须填写模型 ID");
    }
    if (participants.length < 2) {
      throw new Error("至少启用两个 AI 成员，才能开始讨论");
    }
    if (categories.length === 0) {
      throw new Error("review categories 不能为空");
    }
    if (chain.filter((operator) => operator.enabled).length === 0) {
      throw new Error("operators 至少需要启用一个");
    }

    updateOfficeSnapshot(office.officeId, {
      status: "starting",
      turnIndex: 0,
      lastSummary: "办公室会议启动中...",
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
      return { ok: true, message: `办公室已启动：${sessionId}`, sessionId };
    }

    updateOfficeSnapshot(office.officeId, {
      status: "running",
      lastSummary: "已发起 session/start，等待会话 ID 回传",
    });
    return { ok: true, message: "已发起办公室讨论" };
  } catch (error) {
    const reason = toErrorMessage(error);
    pushLog(`startOfficeDebate failed: ${reason}`);
    updateOfficeSnapshot(office.officeId, {
      status: "error",
      lastSummary: `启动失败：${reason}`,
    });
    state.runStatus = "error";
    return { ok: false, message: `启动失败：${reason}` };
  }
}

export async function sendOfficeChat(message: string): Promise<ActionResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { ok: false, message: "请输入消息后再发送" };
  }

  try {
    const params: Record<string, unknown> = { message: trimmed };
    if (state.sessionId !== "-") {
      params.session_id = state.sessionId;
    }
    await callRpc("chat/send", params);
    return { ok: true, message: "消息已发送" };
  } catch (error) {
    const reason = toErrorMessage(error);
    pushLog(`chat/send failed: ${reason}`);
    return { ok: false, message: `发送失败：${reason}` };
  }
}

export async function stopOfficeDebate(): Promise<ActionResult> {
  if (state.sessionId === "-") {
    pushLog("chat/stop skipped: no active session");
    return { ok: false, message: "当前没有可停止的会话" };
  }

  const targetSessionId = state.sessionId;

  try {
    await callRpc("chat/stop", { session_id: targetSessionId });

    const office = getOfficeBySessionId(targetSessionId);
    if (office) {
      updateOfficeSnapshot(office.officeId, {
        status: "stopped",
        lastSummary: "会话已停止",
      });
    }

    return { ok: true, message: "已发送停止指令" };
  } catch (error) {
    const reason = toErrorMessage(error);
    pushLog(`chat/stop failed: ${reason}`);
    return { ok: false, message: `停止失败：${reason}` };
  }
}

export async function executeWorkflowScript(scriptText: string): Promise<ActionResult> {
  const office = getActiveOffice();
  if (!office) {
    return { ok: false, message: "请先创建办公室" };
  }

  const trimmed = scriptText.trim();
  if (!trimmed) {
    return { ok: false, message: "请先输入 workflow JSON" };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return { ok: false, message: "workflow JSON 解析失败" };
  }

  const payload: Record<string, unknown> = {
    ...parsed,
    session_id: state.sessionId !== "-" ? state.sessionId : undefined,
    continue_chat:
      typeof parsed.continue_chat === "boolean" ? parsed.continue_chat : true,
    followup_prompt:
      typeof parsed.followup_prompt === "string"
        ? parsed.followup_prompt
        : "我已经执行了落地步骤，请基于结果继续推进 coding，并给出下一步可执行改动。",
  };

  try {
    const result = (await callRpc("workflow/execute", payload)) as Record<string, unknown>;
    const sessionId = typeof result.session_id === "string" ? result.session_id : "";
    if (sessionId) {
      setSessionOffice(sessionId, office.officeId);
      updateOfficeSnapshot(office.officeId, {
        sessionId,
        status: "running",
        lastSummary: "工作流已执行，已回灌到会话",
      });
      state.sessionId = sessionId;
    }

    const total = Number(result.steps_total ?? 0);
    const errors = Number(result.steps_error ?? 0);
    const message =
      errors > 0 ? `工作流执行完成：${total} 步，失败 ${errors}` : `工作流执行完成：${total} 步`;
    return { ok: true, message, sessionId: sessionId || undefined };
  } catch (error) {
    const reason = toErrorMessage(error);
    pushLog(`workflow/execute failed: ${reason}`);
    return { ok: false, message: `workflow 执行失败：${reason}` };
  }
}

export async function sendGuideChat(message: string): Promise<ActionResult> {
  if (!state.orchestratorRunning) {
    return {
      ok: false,
      message: "引擎尚未启动，请先在顶部点击「启动引擎」",
    };
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return { ok: false, message: "请输入消息后再发送" };
  }

  try {
    const activeOffice = getActiveOffice();
    const params: Record<string, unknown> = { message: trimmed };

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
    } else {
      const participants = buildGuideParticipantsFromGlobal();
      if (participants.length > 0) {
        params.participants = participants;
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
      .map((item) => {
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
      .filter(
        (
          item,
        ): item is {
          participantId: string;
          status: string;
          content: string;
          latencyMs?: number;
          errorCode?: string;
          errorMessage?: string;
        } =>
          Boolean(item),
      );

    return {
      ok: true,
      message: "消息已发送",
      sessionId: sessionId || undefined,
      outputs,
    };
  } catch (error) {
    const reason = toErrorMessage(error);
    pushLog(`sendGuideChat failed: ${reason}`);
    return { ok: false, message: `发送失败：${reason}` };
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
