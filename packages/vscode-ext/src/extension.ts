import * as path from "node:path";
import * as vscode from "vscode";
import { OrchestratorClient } from "./rpc";
import { DashboardPanel, DashboardStateSnapshot } from "./dashboard";
import { ChatPanel } from "./chat";

type SessionAbortState = {
  stopped: boolean;
};

let client: OrchestratorClient | undefined;
let outputChannel: vscode.OutputChannel | undefined;

const dashboardState: DashboardStateSnapshot = {
  sessionId: "-",
  status: "idle",
  turnIndex: 0,
  agreementScore: 0,
  totalTokens: 0,
  totalCost: 0,
  participants: [],
};

const sessionAbort = new Map<string, SessionAbortState>();

function markSessionStopped(sessionId: string): void {
  const entry = sessionAbort.get(sessionId) ?? { stopped: false };
  entry.stopped = true;
  sessionAbort.set(sessionId, entry);
}

function clearSessionStopped(sessionId: string): void {
  const entry = sessionAbort.get(sessionId) ?? { stopped: false };
  entry.stopped = false;
  sessionAbort.set(sessionId, entry);
}

function isSessionStopped(sessionId: string): boolean {
  return sessionAbort.get(sessionId)?.stopped === true;
}

function nowIso(): string {
  return new Date().toISOString();
}

function appendDashboardEvent(source: "extension" | "engine", type: string, payload?: unknown): void {
  const panel = DashboardPanel.getCurrent();
  if (!panel) {
    return;
  }
  panel.append({
    time: nowIso(),
    source,
    type,
    payload,
  });
}

function renderDashboardState(): void {
  const panel = DashboardPanel.getCurrent();
  if (!panel) {
    return;
  }
  panel.updateState(dashboardState);
}

function parseNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function handleEngineNotification(method: string, params: unknown): void {
  const payload = (params && typeof params === "object") ? (params as Record<string, unknown>) : undefined;
  const chat = ChatPanel.getCurrent();

  if (!payload) {
    return;
  }

  if (method === "session/state") {
    const sessionId = payload["session_id"];
    if (typeof sessionId === "string") {
      dashboardState.sessionId = sessionId;
    }
    const status = payload["status"];
    if (typeof status === "string") {
      dashboardState.status = status;
    }
    renderDashboardState();
    return;
  }

  if (method === "session/participants") {
    const participants = payload["participants"];
    if (Array.isArray(participants)) {
      dashboardState.participants = participants
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          participant_id: typeof item["participant_id"] === "string" ? item["participant_id"] : "unknown",
          role: typeof item["role"] === "string" ? item["role"] : undefined,
          provider: typeof item["provider"] === "string" ? item["provider"] : undefined,
          model_id: typeof item["model_id"] === "string" ? item["model_id"] : undefined,
          status: "pending",
        }));
      renderDashboardState();
    }
    return;
  }

  if (method === "session/progress") {
    const turnIndex = parseNumber(payload["turn_index"]);
    const totalTokens = parseNumber(payload["total_tokens"]);
    const totalCost = parseNumber(payload["total_cost"]);
    const agreementScore = parseNumber(payload["agreement_score"]);

    if (turnIndex !== undefined) {
      dashboardState.turnIndex = turnIndex;
    }
    if (totalTokens !== undefined) {
      dashboardState.totalTokens = totalTokens;
    }
    if (totalCost !== undefined) {
      dashboardState.totalCost = totalCost;
    }
    if (agreementScore !== undefined) {
      dashboardState.agreementScore = agreementScore;
    }
    renderDashboardState();
    return;
  }

  if (method === "turn/complete") {
    const participantId = payload["participant_id"];
    if (typeof participantId !== "string") {
      return;
    }

    const sessionId = typeof payload["session_id"] === "string" ? payload["session_id"] : dashboardState.sessionId;
    const turnIndex = parseNumber(payload["turn_index"]);
    const status = typeof payload["status"] === "string" ? payload["status"] : undefined;
    const latency = parseNumber(payload["latency_ms"]);

    if (isSessionStopped(sessionId)) {
      return;
    }

    chat?.completeAssistantTurn({
      sessionId,
      participantId,
      turnIndex: turnIndex ?? dashboardState.turnIndex,
      status,
      latencyMs: latency,
    });

    const matched = dashboardState.participants.find((item) => item.participant_id === participantId);
    if (matched) {
      const status = payload["status"];
      const latency = parseNumber(payload["latency_ms"]);
      if (typeof status === "string") {
        matched.status = status;
      }
      if (latency !== undefined) {
        matched.latency_ms = latency;
      }
      renderDashboardState();
    }

    return;
  }

  if (method === "turn/chunk") {
    const sessionId = typeof payload["session_id"] === "string" ? payload["session_id"] : dashboardState.sessionId;
    const participantId = typeof payload["participant_id"] === "string" ? payload["participant_id"] : "assistant";
    const turnIndex = parseNumber(payload["turn_index"]);
    const delta = typeof payload["delta"] === "string" ? payload["delta"] : "";

    if (isSessionStopped(sessionId)) {
      return;
    }

    chat?.appendAssistantChunk({
      sessionId,
      participantId,
      turnIndex: turnIndex ?? dashboardState.turnIndex,
      delta,
    });
  }
}

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Workerflow");
  }
  return outputChannel;
}

function resolveOrchestratorExecutable(context: vscode.ExtensionContext): { command: string; args: string[] } {
  const configured = vscode.workspace.getConfiguration("workerflow").get<string>("orchestratorPath");
  if (configured && configured.trim().length > 0) {
    return { command: configured, args: [] };
  }

  const exeName = process.platform === "win32" ? "orchestrator.exe" : "orchestrator";
  const command = path.join(context.extensionPath, "..", "..", "target", "debug", exeName);
  return { command, args: [] };
}

async function ensureClient(context: vscode.ExtensionContext): Promise<OrchestratorClient> {
  if (!client) {
    const executable = resolveOrchestratorExecutable(context);
    appendDashboardEvent("extension", "engine.spawning", executable);
    client = new OrchestratorClient(executable.command, executable.args, {
      onNotification: (notification) => {
        appendDashboardEvent("engine", `notification.${notification.method}`, notification.params);
        handleEngineNotification(notification.method, notification.params);
      },
      onStderr: (message) => {
        const channel = getOutputChannel();
        channel.appendLine(message.trimEnd());
        appendDashboardEvent("engine", "stderr", message.trimEnd());
      },
      onExit: (code) => {
        appendDashboardEvent("engine", "process.exit", { code });
      },
    });
  }
  return client;
}

export function activate(context: vscode.ExtensionContext): void {
  const openChat = vscode.commands.registerCommand("workerflow.openChat", async () => {
    const submitChat = async (
      sessionId: string,
      text: string,
      appendUser: boolean,
      target: "local" | "cloud",
    ): Promise<void> => {
      const rpc = await ensureClient(context);
      clearSessionStopped(sessionId);

      if (appendUser) {
        panel.appendUserMessage(sessionId, text);
      }
      panel.setSessionStatus(sessionId, "running");

      const payload = {
        session_id: sessionId,
        message: text,
        execution_target: target,
      };

      appendDashboardEvent("extension", "request.chat/send", payload);

      const result = await rpc.request("chat/send", payload);
      appendDashboardEvent("engine", "response.chat/send", result);

      if (result && typeof result === "object") {
        const casted = result as Record<string, unknown>;
        const nextSessionId = casted["session_id"];
        if (typeof nextSessionId === "string") {
          dashboardState.sessionId = nextSessionId;
          clearSessionStopped(nextSessionId);
        }

        const turnIndex = parseNumber(casted["turn_index"]);
        if (turnIndex !== undefined) {
          dashboardState.turnIndex = turnIndex;
        }

        const status = casted["status"];
        if (typeof status === "string") {
          dashboardState.status = status;
        }
      }

      renderDashboardState();
    };

    const panel = ChatPanel.createOrShow(context, {
      onSendMessage: async (request) => {
        await submitChat(request.sessionId, request.text, true, request.target);
      },
      onRetryMessage: async (request) => {
        await submitChat(request.sessionId, request.text, false, request.target);
      },
      onStopGeneration: async (request) => {
        const rpc = await ensureClient(context);
        markSessionStopped(request.sessionId);
        panel.setSessionStatus(request.sessionId, "stopped");
        appendDashboardEvent("extension", "request.chat/stop", { session_id: request.sessionId });

        const result = await rpc.request("chat/stop", { session_id: request.sessionId });
        appendDashboardEvent("engine", "response.chat/stop", result);

        panel.appendSystemMessage("已停止当前生成。", request.sessionId);
      },
      onRunTests: async (request) => {
        appendDashboardEvent("extension", "request.tests/run", request);
        panel.appendSystemMessage(
          request.target === "cloud"
            ? "已提交 Cloud 测试（当前为前端原型占位流程）。"
            : "已触发 Local 测试（当前为前端原型占位流程）。",
          request.sessionId,
        );
      },
      onGenerateArtifact: async (request) => {
        appendDashboardEvent("extension", "request.artifact/generate", request);
        panel.appendSystemMessage("已生成交付产物（原型占位）。", request.sessionId);
      },
    });

    panel.reveal();
    panel.appendSystemMessage(
      "Studio 已就绪：支持 Local/Cloud、测试与产物面板、重试与停止。",
      panel.getActiveSessionId(),
    );
  });

  const openDashboard = vscode.commands.registerCommand("workerflow.openDashboard", () => {
    const panel = DashboardPanel.createOrShow(context);
    panel.reveal();
    renderDashboardState();
    appendDashboardEvent("extension", "dashboard.opened", {
      workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "<none>",
    });
  });

  const ping = vscode.commands.registerCommand("workerflow.pingEngine", async () => {
    try {
      DashboardPanel.createOrShow(context);
      const rpc = await ensureClient(context);
      appendDashboardEvent("extension", "request.ping", {});
      const result = await rpc.request("ping");
      appendDashboardEvent("engine", "response.ping", result);
      void vscode.window.showInformationMessage(`Workerflow engine ping ok: ${JSON.stringify(result)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendDashboardEvent("extension", "error.ping", { message });
      void vscode.window.showErrorMessage(`Workerflow ping failed: ${message}`);
    }
  });

  const startSession = vscode.commands.registerCommand("workerflow.startSession", async () => {
    try {
      DashboardPanel.createOrShow(context);
      const rpc = await ensureClient(context);
      const payload = { task: "code-review" };
      dashboardState.sessionId = "-";
      dashboardState.status = "starting";
      dashboardState.turnIndex = 0;
      dashboardState.agreementScore = 0;
      dashboardState.totalTokens = 0;
      dashboardState.totalCost = 0;
      dashboardState.participants = [];
      renderDashboardState();
      appendDashboardEvent("extension", "request.session/start", payload);
      const result = await rpc.request("session/start", { task: "code-review" });
      if (result && typeof result === "object") {
        const casted = result as Record<string, unknown>;
        if (typeof casted["session_id"] === "string") {
          dashboardState.sessionId = casted["session_id"];
        }
        if (typeof casted["status"] === "string") {
          dashboardState.status = casted["status"];
        }
      }
      renderDashboardState();
      appendDashboardEvent("engine", "response.session/start", result);
      void vscode.window.showInformationMessage(`Workerflow session started: ${JSON.stringify(result)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendDashboardEvent("extension", "error.session/start", { message });
      void vscode.window.showErrorMessage(`Workerflow start failed: ${message}`);
    }
  });

  const showLogs = vscode.commands.registerCommand("workerflow.showLogs", () => {
    getOutputChannel().show(true);
  });

  context.subscriptions.push(
    openChat,
    openDashboard,
    ping,
    startSession,
    showLogs,
    {
      dispose: () => {
        client?.dispose();
        client = undefined;
        outputChannel?.dispose();
        outputChannel = undefined;
      },
    },
  );
}

export function deactivate(): void {
  client?.dispose();
  client = undefined;
  outputChannel?.dispose();
  outputChannel = undefined;
}
