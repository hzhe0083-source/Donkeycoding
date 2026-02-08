import { invoke } from "@tauri-apps/api/core";
import { applyRpcResult } from "./notifications";
import {
  getOfficeBySessionId,
  getActiveOffice,
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
};

function parseCategories(text: string): string[] {
  return text
    .split(/[\n,，]+/)
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
      }));

    if (!objective) {
      throw new Error("请先填写办公室目标");
    }
    if (!Number.isFinite(office.maxRounds) || office.maxRounds < 1 || office.maxRounds > 20) {
      throw new Error("轮次需在 1 到 20 之间");
    }
    if (participants.some((participant) => !participant.model_id.trim())) {
      throw new Error("启用成员必须填写模型 ID");
    }

    if (participants.length < 2) {
      throw new Error("至少启用两个 AI 员工，才能开始辩论");
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
      return { ok: true, message: `办公室已启动（${sessionId}）`, sessionId };
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
