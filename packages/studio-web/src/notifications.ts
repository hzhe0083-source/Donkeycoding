import {
  getActiveOffice,
  getOfficeBySessionId,
  guideFlow,
  pushChunk,
  pushGuideMessage,
  pushNotification,
  setSessionOffice,
  state,
  updateOfficeSnapshot,
  updateParticipant,
} from "./state";
import type { NotificationEnvelope, RunStatus } from "./types";
import { asRecord, parseNumber, parseString } from "./utils";

function toRunStatus(value: string | undefined): RunStatus | undefined {
  if (
    value === "idle" ||
    value === "starting" ||
    value === "running" ||
    value === "completed" ||
    value === "stopped" ||
    value === "error"
  ) {
    return value;
  }
  return undefined;
}

function updateParticipantsFromValue(value: unknown): void {
  if (!Array.isArray(value)) {
    return;
  }

  const statusById = new Map(state.participants.map((item) => [item.participantId, item]));
  const parsed = value
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== undefined)
    .map((item) => {
      const participantId = parseString(item.participant_id) ?? "unknown";
      const old = statusById.get(participantId);

      return {
        participantId,
        role: parseString(item.role) ?? old?.role ?? "-",
        provider: parseString(item.provider) ?? old?.provider ?? "-",
        modelId: parseString(item.model_id) ?? old?.modelId ?? "-",
        status: old?.status ?? "pending",
        latencyMs: old?.latencyMs,
      };
    });

  state.participants = parsed;
}

function updateSnapshotBySession(
  sessionId: string,
  patch: {
    status?: RunStatus;
    turnIndex?: number;
    agreementScore?: number;
    totalTokens?: number;
    totalCost?: number;
    lastSummary?: string;
  },
): void {
  const office = getOfficeBySessionId(sessionId);
  if (!office) {
    return;
  }
  updateOfficeSnapshot(office.officeId, patch);
}

function isGuideFlowSession(sessionId: string | undefined): boolean {
  if (!guideFlow.open || !sessionId) {
    return false;
  }

  // 如果已经绑定了 sessionId，直接匹配
  if (guideFlow.sessionId) {
    return guideFlow.sessionId === sessionId;
  }

  // 尚未绑定 sessionId 时：
  // 只要 guide 弹窗打开且 AI 正在思考（或刚刚完成思考），
  // 并且该 session 没有被映射到任何办公室，就认为是 guide session
  if (!guideFlow.aiThinking && !guideFlow.creating) {
    return false;
  }

  if (state.sessionOfficeMap[sessionId]) {
    return false;
  }

  guideFlow.sessionId = sessionId;
  return true;
}

export function applyRpcResult(_method: string, result: unknown): void {
  const record = asRecord(result);
  if (!record) {
    return;
  }

  const sessionId = parseString(record.session_id);
  if (sessionId) {
    // 如果是引导对话的 session，不要映射到办公室，也不要覆盖 state.sessionId
    const isGuideSession = guideFlow.open && (
      guideFlow.sessionId === sessionId ||
      (!guideFlow.sessionId && (guideFlow.aiThinking || guideFlow.creating))
    );
    if (!isGuideSession) {
      state.sessionId = sessionId;
      if (!state.sessionOfficeMap[sessionId]) {
        const activeOffice = getActiveOffice();
        if (activeOffice) {
          setSessionOffice(sessionId, activeOffice.officeId);
        }
      }
    }
  }

  const status = parseString(record.status);
  const runStatus = toRunStatus(status);
  if (runStatus) {
    state.runStatus = runStatus;
  }

  const turnIndex =
    parseNumber(record.turn_index) ??
    parseNumber(record.current_turn) ??
    parseNumber(record.total_turns);
  if (turnIndex !== undefined) {
    state.turnIndex = turnIndex;
  }

  const totalTokens = parseNumber(record.total_tokens);
  if (totalTokens !== undefined) {
    state.totalTokens = totalTokens;
  }

  const totalCost = parseNumber(record.total_cost);
  if (totalCost !== undefined) {
    state.totalCost = totalCost;
  }

  const agreement = parseNumber(record.agreement_score) ?? parseNumber(record.final_agreement);
  if (agreement !== undefined) {
    state.agreementScore = agreement;
  }

  if (sessionId) {
    updateSnapshotBySession(sessionId, {
      status: runStatus,
      turnIndex,
      agreementScore: agreement,
      totalTokens,
      totalCost,
      lastSummary:
        typeof record.stop_reason === "string"
          ? `会议结束：${record.stop_reason}`
          : status
          ? `会话状态更新：${status}`
          : undefined,
    });
  }
}

export function handleNotification(envelope: NotificationEnvelope): void {
  const method = envelope.method;
  if (!method) {
    return;
  }

  const params = envelope.params ?? {};
  pushNotification(method, params);

  const sessionId = parseString(params.session_id);

  // 先检查是否属于 guide 对话的 session，避免错误映射到办公室
  const isKnownGuideSession = sessionId && guideFlow.open && (
    guideFlow.sessionId === sessionId ||
    (!guideFlow.sessionId && (guideFlow.aiThinking || guideFlow.creating))
  );

  if (sessionId && !isKnownGuideSession && !state.sessionOfficeMap[sessionId]) {
    const activeOffice = getActiveOffice();
    if (activeOffice) {
      setSessionOffice(sessionId, activeOffice.officeId);
    }
  }

  if (method === "session/state") {
    const sid = parseString(params.session_id);
    const status = parseString(params.status);
    const reason = parseString(params.reason);
    const runStatus = toRunStatus(status);

    if (sid) {
      state.sessionId = sid;
    }
    if (runStatus) {
      state.runStatus = runStatus;
    }

    if (sid) {
      updateSnapshotBySession(sid, {
        status: runStatus,
        lastSummary: status
          ? reason
            ? `状态：${status}，${reason}`
            : `状态：${status}`
          : undefined,
      });
    }
  }

  if (method === "session/progress") {
    const turn = parseNumber(params.turn_index);
    const tokens = parseNumber(params.total_tokens);
    const cost = parseNumber(params.total_cost);
    const agreement = parseNumber(params.agreement_score);

    if (turn !== undefined) {
      state.turnIndex = turn;
    }
    if (tokens !== undefined) {
      state.totalTokens = tokens;
    }
    if (cost !== undefined) {
      state.totalCost = cost;
    }
    if (agreement !== undefined) {
      state.agreementScore = agreement;
    }

    if (sessionId) {
      updateSnapshotBySession(sessionId, {
        status: "running",
        turnIndex: turn,
        agreementScore: agreement,
        totalTokens: tokens,
        totalCost: cost,
        lastSummary:
          agreement !== undefined
            ? `第${turn ?? 0}轮，共识 ${agreement.toFixed(3)}`
            : undefined,
      });
    }
  }

  if (method === "session/participants") {
    updateParticipantsFromValue(params.participants);
  }

  if (method === "turn/complete") {
    const participantId = parseString(params.participant_id);
    const participantStatus = parseString(params.status) ?? "unknown";
    const matchedGuideSession = isGuideFlowSession(sessionId);

    if (participantId) {
      updateParticipant(participantId, {
        status: participantStatus,
        latencyMs: parseNumber(params.latency_ms),
      });
    }

    if (sessionId && participantId) {
      updateSnapshotBySession(sessionId, {
        lastSummary: `${participantId} 已完成，状态：${participantStatus}`,
      });
    }

    // 引导对话：当参与者完成回复时，标记 aiThinking = false
    if (matchedGuideSession) {
      guideFlow.aiThinking = false;
    }
  }

  if (method === "turn/chunk") {
    const participantId = parseString(params.participant_id) ?? "unknown";
    const sid = parseString(params.session_id) ?? state.sessionId;
    const turnIndex = parseNumber(params.turn_index) ?? state.turnIndex;
    const delta = parseString(params.delta) ?? "";
    const matchedGuideSession = isGuideFlowSession(sid);

    pushChunk({
      time: new Date().toISOString(),
      sessionId: sid,
      turnIndex,
      participantId,
      delta,
    });

    updateSnapshotBySession(sid, {
      status: "running",
      turnIndex,
      lastSummary: `${participantId} 正在输出第${turnIndex}轮内容`,
    });

    // 引导对话：将 AI 参与者的流式 chunk 追加到引导对话消息中
    if (matchedGuideSession && delta) {
      const label = `🤖 ${participantId}`;
      // 查找该参与者最后一条未完成的 AI 消息（通过 text 前缀匹配）
      const lastMsg = [...guideFlow.messages]
        .reverse()
        .find(
          (m) =>
            m.sender === "ai" &&
            m.text.startsWith(label),
        );

      if (lastMsg) {
        // 追加 delta 到已有消息
        lastMsg.text += delta;
      } else {
        // 创建新的 AI 消息（带参与者标识）
        pushGuideMessage("ai", `${label}\n${delta}`);
      }
    }
  }

  if (method === "workflow/step") {
    const sid = parseString(params.session_id) ?? state.sessionId;
    const name = parseString(params.name) ?? "step";
    const stepStatus = parseString(params.status) ?? "unknown";
    const kind = parseString(params.kind) ?? "workflow";

    if (sid) {
      updateSnapshotBySession(sid, {
        status: "running",
        lastSummary: `workflow ${kind}/${name}: ${stepStatus}`,
      });
    }
  }

  if (method === "workflow/complete") {
    const sid = parseString(params.session_id) ?? state.sessionId;
    const wfStatus = parseString(params.status) ?? "completed";
    const stepsTotal = parseNumber(params.steps_total);
    const stepsError = parseNumber(params.steps_error);

    if (sid) {
      updateSnapshotBySession(sid, {
        status: wfStatus === "completed" ? "running" : "error",
        lastSummary:
          stepsTotal !== undefined
            ? `workflow结束：${wfStatus}，步骤 ${stepsTotal}，失败 ${stepsError ?? 0}`
            : `workflow结束：${wfStatus}`,
      });
    }
  }
}
