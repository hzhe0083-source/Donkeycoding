import { invoke } from "@tauri-apps/api/core";
import { applyRpcResult } from "./notifications";
import {
  getActiveOffice,
  pushLog,
  setSessionOffice,
  state,
  updateOfficeSnapshot,
} from "./state";
import type { RpcResult } from "./types";
import { safeJson, toErrorMessage } from "./utils";

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

export async function startOrchestrator(): Promise<void> {
  state.runStatus = "starting";

  try {
    const result = await invoke<RpcResult<{ status?: string; exe?: string }>>(
      "start_orchestrator",
    );
    state.orchestratorRunning = result.success;
    state.runStatus = result.success ? "running" : "error";
    pushLog(`start_orchestrator: ${safeJson(result.data)}`);
  } catch (error) {
    state.orchestratorRunning = false;
    state.runStatus = "error";
    pushLog(`start_orchestrator failed: ${toErrorMessage(error)}`);
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

export async function setKeys(): Promise<void> {
  try {
    await callRpc("config/setKeys", {
      openai: state.apiKeys.openai,
      anthropic: state.apiKeys.anthropic,
      google: state.apiKeys.google,
      deepseek: state.apiKeys.deepseek,
    });
  } catch (error) {
    pushLog(`config/setKeys failed: ${toErrorMessage(error)}`);
  }
}

export async function startOfficeDebate(): Promise<void> {
  try {
    const office = getActiveOffice();
    const categories = parseCategories(state.review.categoriesText);

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
      status: "running",
      turnIndex: 0,
      lastSummary: "办公室会议已启动，等待员工开始发言...",
    });

    const result = await callRpc("session/start", {
      task: office.objective,
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
    }
  } catch (error) {
    pushLog(`startOfficeDebate failed: ${toErrorMessage(error)}`);
    state.runStatus = "error";
  }
}

export async function sendOfficeChat(message: string): Promise<void> {
  const trimmed = message.trim();
  if (!trimmed) {
    return;
  }

  try {
    const params: Record<string, unknown> = { message: trimmed };
    if (state.sessionId !== "-") {
      params.session_id = state.sessionId;
    }
    await callRpc("chat/send", params);
  } catch (error) {
    pushLog(`chat/send failed: ${toErrorMessage(error)}`);
  }
}

export async function stopOfficeDebate(): Promise<void> {
  if (state.sessionId === "-") {
    pushLog("chat/stop skipped: no active session");
    return;
  }

  try {
    await callRpc("chat/stop", { session_id: state.sessionId });
  } catch (error) {
    pushLog(`chat/stop failed: ${toErrorMessage(error)}`);
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
