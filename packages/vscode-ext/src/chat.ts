import * as vscode from "vscode";

type ChatRole = "user" | "assistant" | "system";

export type ChatSessionStatus = "idle" | "running" | "stopped" | "error";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  time: string;
  streaming?: boolean;
};

type ChatSession = {
  id: string;
  title: string;
  status: ChatSessionStatus;
  target: "local" | "cloud";
  updatedAt: string;
  messages: ChatMessage[];
  lastUserMessage?: string;
  artifacts: string[];
  tests: string[];
  progress: number;
  budgetUsd: number;
  elapsedSec: number;
};

export type ChatSendRequest = { sessionId: string; text: string; target: "local" | "cloud" };
export type ChatRetryRequest = { sessionId: string; text: string; target: "local" | "cloud" };
export type ChatStopRequest = { sessionId: string };
export type ChatRunTestsRequest = { sessionId: string; target: "local" | "cloud" };
export type ChatGenerateArtifactRequest = { sessionId: string };

export type ChatHandlers = {
  onSendMessage: (request: ChatSendRequest) => Promise<void>;
  onRetryMessage: (request: ChatRetryRequest) => Promise<void>;
  onStopGeneration: (request: ChatStopRequest) => Promise<void>;
  onRunTests: (request: ChatRunTestsRequest) => Promise<void>;
  onGenerateArtifact: (request: ChatGenerateArtifactRequest) => Promise<void>;
};

type ChatMessageFromWebview = {
  type?: string;
  text?: string;
  sessionId?: string;
  target?: "local" | "cloud";
};

export type AssistantChunk = {
  sessionId: string;
  participantId: string;
  turnIndex: number;
  delta: string;
};

export type AssistantComplete = {
  sessionId: string;
  participantId: string;
  turnIndex: number;
  status?: string;
  latencyMs?: number;
};

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export class ChatPanel {
  private static current: ChatPanel | undefined;

  public static createOrShow(context: vscode.ExtensionContext, handlers: ChatHandlers): ChatPanel {
    if (ChatPanel.current) {
      ChatPanel.current.setHandlers(handlers);
      ChatPanel.current.panel.reveal(vscode.ViewColumn.One);
      return ChatPanel.current;
    }

    const panel = vscode.window.createWebviewPanel("workerflowChat", "Workerflow Studio", vscode.ViewColumn.One, {
      enableScripts: true,
    });

    ChatPanel.current = new ChatPanel(panel, context, handlers);
    return ChatPanel.current;
  }

  public static getCurrent(): ChatPanel | undefined {
    return ChatPanel.current;
  }

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private handlers: ChatHandlers;
  private sessions: ChatSession[] = [];
  private activeSessionId = "";
  private streamMessageMap = new Map<string, string>();
  private sessionCounter = 1;

  private constructor(panel: vscode.WebviewPanel, _context: vscode.ExtensionContext, handlers: ChatHandlers) {
    this.panel = panel;
    this.handlers = handlers;

    const first = this.createSession();
    this.activeSessionId = first.id;

    this.panel.webview.html = this.renderHtml();
    this.postState();

    this.panel.onDidDispose(() => {
      this.dispose();
    }, null, this.disposables);

    this.panel.webview.onDidReceiveMessage((message: ChatMessageFromWebview) => {
      if (!message?.type) {
        return;
      }

      if (message.type === "chat.newSession") {
        const created = this.createSession();
        this.activeSessionId = created.id;
        this.postState();
        return;
      }

      if (message.type === "chat.switchSession") {
        if (typeof message.sessionId === "string" && this.sessions.some((s) => s.id === message.sessionId)) {
          this.activeSessionId = message.sessionId;
          this.postState();
        }
        return;
      }

      if (message.type === "chat.setTarget") {
        const session = this.getActiveSession();
        session.target = message.target === "cloud" ? "cloud" : "local";
        session.updatedAt = nowIso();
        this.postState();
        return;
      }

      if (message.type === "chat.clearSession") {
        const session = this.getActiveSession();
        session.messages = [];
        session.lastUserMessage = undefined;
        session.progress = 0;
        session.status = "idle";
        session.updatedAt = nowIso();
        this.postState();
        return;
      }

      if (message.type === "chat.runTests") {
        const session = this.getActiveSession();
        session.tests = [`${session.target.toUpperCase()} test queued @ ${new Date().toLocaleTimeString()}`, ...session.tests].slice(0, 8);
        session.updatedAt = nowIso();
        this.appendSystemMessage(`已触发 ${session.target} 测试。`, session.id);
        void this.handlers.onRunTests({ sessionId: session.id, target: session.target }).catch((error: unknown) => {
          const detail = error instanceof Error ? error.message : String(error);
          this.appendSystemMessage(`测试触发失败：${detail}`, session.id);
        });
        this.postState();
        return;
      }

      if (message.type === "chat.generateArtifact") {
        const session = this.getActiveSession();
        session.artifacts = [`delivery-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.zip`, ...session.artifacts].slice(0, 8);
        session.updatedAt = nowIso();
        this.appendSystemMessage("产物已生成到 Artifacts 列表。", session.id);
        void this.handlers.onGenerateArtifact({ sessionId: session.id }).catch((error: unknown) => {
          const detail = error instanceof Error ? error.message : String(error);
          this.appendSystemMessage(`产物生成失败：${detail}`, session.id);
        });
        this.postState();
        return;
      }

      if (message.type === "chat.send") {
        const text = typeof message.text === "string" ? message.text.trim() : "";
        if (!text) {
          return;
        }

        const session = this.getActiveSession();
        void this.handlers.onSendMessage({ sessionId: session.id, text, target: session.target }).catch((error: unknown) => {
          const detail = error instanceof Error ? error.message : String(error);
          this.setSessionStatus(session.id, "error");
          this.appendSystemMessage(`发送失败：${detail}`, session.id);
        });
        return;
      }

      if (message.type === "chat.retry") {
        const session = this.getActiveSession();
        const text = session.lastUserMessage;
        if (!text) {
          this.appendSystemMessage("当前会话没有可重试的用户消息。", session.id);
          return;
        }

        void this.handlers.onRetryMessage({ sessionId: session.id, text, target: session.target }).catch((error: unknown) => {
          const detail = error instanceof Error ? error.message : String(error);
          this.setSessionStatus(session.id, "error");
          this.appendSystemMessage(`重试失败：${detail}`, session.id);
        });
        return;
      }

      if (message.type === "chat.stop") {
        const session = this.getActiveSession();
        this.setSessionStatus(session.id, "stopped");

        void this.handlers.onStopGeneration({ sessionId: session.id }).catch((error: unknown) => {
          const detail = error instanceof Error ? error.message : String(error);
          this.setSessionStatus(session.id, "error");
          this.appendSystemMessage(`停止失败：${detail}`, session.id);
        });
      }
    }, null, this.disposables);
  }

  public setHandlers(handlers: ChatHandlers): void {
    this.handlers = handlers;
  }

  public reveal(): void {
    this.panel.reveal(vscode.ViewColumn.One);
  }

  public getActiveSessionId(): string {
    return this.getActiveSession().id;
  }

  public setSessionStatus(sessionId: string, status: ChatSessionStatus): void {
    const session = this.ensureSession(sessionId);
    session.status = status;
    session.updatedAt = nowIso();
    this.postState();
  }

  public appendSystemMessage(text: string, sessionId?: string): void {
    const session = this.ensureSession(sessionId);
    this.pushMessage(session, { id: makeId("msg"), role: "system", text, time: nowIso() });
    this.postState();
  }

  public appendUserMessage(sessionId: string, text: string): void {
    const session = this.ensureSession(sessionId);
    session.lastUserMessage = text;
    session.status = "running";
    session.progress = Math.min(95, session.progress + 12);
    this.pushMessage(session, { id: makeId("msg"), role: "user", text, time: nowIso() });
    this.postState();
  }

  public appendAssistantChunk(chunk: AssistantChunk): void {
    const session = this.ensureSession(chunk.sessionId);
    if (session.status === "stopped") {
      return;
    }

    session.status = "running";
    session.progress = Math.min(98, session.progress + 1);
    session.updatedAt = nowIso();

    const key = `${chunk.sessionId}:${chunk.participantId}:${chunk.turnIndex}`;
    const existing = this.streamMessageMap.get(key);
    if (!existing) {
      const created: ChatMessage = { id: makeId("msg"), role: "assistant", text: chunk.delta, time: nowIso(), streaming: true };
      this.pushMessage(session, created);
      this.streamMessageMap.set(key, created.id);
      this.postState();
      return;
    }

    const target = session.messages.find((item) => item.id === existing);
    if (target) {
      target.text = `${target.text}${chunk.delta}`;
      target.time = nowIso();
      this.postState();
    }
  }

  public completeAssistantTurn(complete: AssistantComplete): void {
    const session = this.ensureSession(complete.sessionId);
    const key = `${complete.sessionId}:${complete.participantId}:${complete.turnIndex}`;
    const existing = this.streamMessageMap.get(key);
    if (existing) {
      const target = session.messages.find((item) => item.id === existing);
      if (target) {
        target.streaming = false;
        target.time = nowIso();
      }
      this.streamMessageMap.delete(key);
    }

    if (session.status !== "stopped") {
      session.status = complete.status === "error" ? "error" : "idle";
    }
    session.progress = session.status === "error" ? session.progress : 100;
    session.elapsedSec += 3;
    session.budgetUsd += session.target === "cloud" ? 0.02 : 0;
    session.updatedAt = nowIso();
    this.postState();
  }

  public dispose(): void {
    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
    ChatPanel.current = undefined;
  }

  private ensureSession(sessionId?: string): ChatSession {
    if (!sessionId) {
      return this.getActiveSession();
    }
    const existing = this.sessions.find((item) => item.id === sessionId);
    if (existing) {
      return existing;
    }
    const created = this.createSession(sessionId, `Workspace ${this.sessionCounter}`);
    this.activeSessionId = created.id;
    return created;
  }

  private getActiveSession(): ChatSession {
    const existing = this.sessions.find((item) => item.id === this.activeSessionId);
    if (existing) {
      return existing;
    }
    const created = this.createSession();
    this.activeSessionId = created.id;
    return created;
  }

  private createSession(sessionId?: string, title?: string): ChatSession {
    const session: ChatSession = {
      id: sessionId ?? makeId("sess"),
      title: title ?? `Workspace ${this.sessionCounter}`,
      status: "idle",
      target: "local",
      updatedAt: nowIso(),
      messages: [],
      artifacts: [],
      tests: [],
      progress: 0,
      budgetUsd: 0,
      elapsedSec: 0,
    };
    this.sessionCounter += 1;
    this.sessions.unshift(session);
    return session;
  }

  private pushMessage(session: ChatSession, message: ChatMessage): void {
    session.messages.push(message);
    if (session.messages.length > 1000) {
      session.messages = session.messages.slice(-1000);
    }
    session.updatedAt = nowIso();
    this.sessions = [session, ...this.sessions.filter((item) => item.id !== session.id)];
    this.activeSessionId = session.id;
  }

  private postState(): void {
    const active = this.getActiveSession();
    const sessions = this.sessions.map((session) => {
      const latest = session.messages[session.messages.length - 1];
      return {
        id: session.id,
        title: session.title,
        status: session.status,
        updatedAt: session.updatedAt,
        preview: latest?.text?.replace(/\s+/g, " ").slice(0, 42) ?? "",
      };
    });

    void this.panel.webview.postMessage({
      type: "state",
      state: {
        sessions,
        activeSessionId: active.id,
        messages: active.messages,
        runtime: { target: active.target, status: active.status, progress: active.progress, budgetUsd: active.budgetUsd, elapsedSec: active.elapsedSec },
        artifacts: active.artifacts,
        tests: active.tests,
      },
    });
  }

  private renderHtml(): string {
    return CHAT_HTML;
  }
}

const CHAT_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Workerflow Studio</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); }
    .layout { display: grid; grid-template-columns: 220px minmax(460px,1fr) 280px; height: 100vh; }
    .left { border-right: 1px solid var(--vscode-panel-border); display: grid; grid-template-rows: auto 1fr; }
    .leftTop { padding: 8px; border-bottom: 1px solid var(--vscode-panel-border); }
    .btn { border: 1px solid var(--vscode-button-border, transparent); border-radius: 6px; padding: 6px 10px; cursor: pointer; background: var(--vscode-button-secondaryBackground, var(--vscode-button-background)); color: var(--vscode-button-secondaryForeground, var(--vscode-button-foreground)); }
    .btn:hover { background: var(--vscode-button-secondaryHoverBackground, var(--vscode-button-hoverBackground)); }
    .btn.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    #newSessionBtn { width: 100%; }
    #sessionList { list-style: none; padding: 8px; margin: 0; display: grid; gap: 6px; overflow-y: auto; }
    .sessionItem { border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 7px; cursor: pointer; }
    .sessionItem.active { border-color: var(--vscode-focusBorder); background: color-mix(in srgb, var(--vscode-list-activeSelectionBackground, #094771) 35%, transparent); }
    .sessionTitle { font-size: 12px; font-weight: 600; }
    .sessionMeta, .sessionPreview { font-size: 11px; color: var(--vscode-descriptionForeground); }
    .sessionPreview { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .center { display: grid; grid-template-rows: auto 1fr auto; min-width: 0; }
    .header { border-bottom: 1px solid var(--vscode-panel-border); padding: 8px 10px; display: grid; gap: 8px; }
    .headerTop { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .title { font-size: 13px; font-weight: 600; }
    .status { font-size: 11px; color: var(--vscode-descriptionForeground); }
    .modeSwitch { display: inline-flex; border: 1px solid var(--vscode-panel-border); border-radius: 999px; overflow: hidden; }
    .modeBtn { border: none; background: transparent; color: inherit; padding: 4px 10px; cursor: pointer; font-size: 11px; }
    .modeBtn.active { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .kpis { display: grid; grid-template-columns: repeat(4,minmax(70px,1fr)); gap: 6px; }
    .kpi { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 6px; }
    .kpiLabel { font-size: 10px; color: var(--vscode-descriptionForeground); }
    .kpiValue { font-size: 13px; font-weight: 600; }
    .progressTrack { grid-column: 1 / -1; height: 8px; border-radius: 999px; overflow: hidden; background: color-mix(in srgb, var(--vscode-panel-border) 55%, transparent); }
    .progressFill { height: 100%; width: 0%; background: var(--vscode-progressBar-background, #0e70c0); transition: width .18s ease; }

    #messages { overflow-y: auto; padding: 10px; display: grid; gap: 10px; }
    .empty { color: var(--vscode-descriptionForeground); text-align: center; margin-top: 24px; }
    .msg { border: 1px solid var(--vscode-panel-border); border-radius: 10px; padding: 8px 10px; max-width: min(900px,95%); }
    .msg.user { justify-self: end; background: color-mix(in srgb, var(--vscode-button-background) 20%, transparent); }
    .msg.assistant { justify-self: start; }
    .msg.system { justify-self: center; width: min(900px,98%); background: color-mix(in srgb, var(--vscode-textCodeBlock-background) 70%, transparent); }
    .msg.streaming { border-style: dashed; }
    .msgMeta { font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; }
    .msgText { white-space: pre-wrap; word-break: break-word; line-height: 1.45; }

    .composer { border-top: 1px solid var(--vscode-panel-border); padding: 10px; display: grid; gap: 8px; }
    #input { width: 100%; min-height: 86px; resize: vertical; padding: 8px; border-radius: 8px; border: 1px solid var(--vscode-input-border, var(--vscode-panel-border)); background: var(--vscode-input-background); color: inherit; font: inherit; }
    .actions { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }

    .right { border-left: 1px solid var(--vscode-panel-border); display: grid; grid-template-rows: 1fr 1fr; min-width: 0; }
    .panel { display: grid; grid-template-rows: auto 1fr; min-height: 0; }
    .panel + .panel { border-top: 1px solid var(--vscode-panel-border); }
    .panelHead { padding: 8px 10px; border-bottom: 1px solid var(--vscode-panel-border); font-size: 12px; font-weight: 600; }
    .panelBody { margin: 0; padding: 8px; list-style: none; overflow-y: auto; display: grid; gap: 6px; }
    .panelItem { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 7px; font-size: 12px; }
    .panelEmpty { color: var(--vscode-descriptionForeground); font-size: 11px; }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="left">
      <div class="leftTop"><button id="newSessionBtn" class="btn">+ New Workspace</button></div>
      <ul id="sessionList"></ul>
    </aside>

    <section class="center">
      <div class="header">
        <div class="headerTop">
          <div><div id="headerTitle" class="title">Workerflow Studio</div><div id="headerStatus" class="status">idle</div></div>
          <div class="modeSwitch"><button id="targetLocalBtn" class="modeBtn active">Local</button><button id="targetCloudBtn" class="modeBtn">Cloud</button></div>
        </div>
        <div class="kpis">
          <div class="kpi"><div class="kpiLabel">Target</div><div id="kpiTarget" class="kpiValue">Local</div></div>
          <div class="kpi"><div class="kpiLabel">Elapsed</div><div id="kpiElapsed" class="kpiValue">0s</div></div>
          <div class="kpi"><div class="kpiLabel">Budget</div><div id="kpiBudget" class="kpiValue">$0.00</div></div>
          <div class="kpi"><div class="kpiLabel">Progress</div><div id="kpiProgress" class="kpiValue">0%</div></div>
          <div class="progressTrack"><div id="progressFill" class="progressFill"></div></div>
        </div>
      </div>

      <div id="messages"></div>

      <div class="composer">
        <textarea id="input" placeholder="输入任务描述，Enter 发送，Shift+Enter 换行"></textarea>
        <div class="actions">
          <button id="runTestsBtn" class="btn">Run Tests</button>
          <button id="generateArtifactBtn" class="btn">Generate Artifact</button>
          <button id="retryBtn" class="btn">Retry</button>
          <button id="stopBtn" class="btn">Stop</button>
          <button id="clearBtn" class="btn">Clear</button>
          <button id="sendBtn" class="btn primary">Send</button>
        </div>
      </div>
    </section>

    <aside class="right">
      <section class="panel"><div class="panelHead">Artifacts</div><ul id="artifactList" class="panelBody"></ul></section>
      <section class="panel"><div class="panelHead">Test Runs</div><ul id="testList" class="panelBody"></ul></section>
    </aside>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const state = { sessions: [], activeSessionId: '', messages: [], runtime: { target: 'local', status: 'idle', progress: 0, budgetUsd: 0, elapsedSec: 0 }, artifacts: [], tests: [] };

    const ui = {
      sessionList: document.getElementById('sessionList'),
      headerTitle: document.getElementById('headerTitle'),
      headerStatus: document.getElementById('headerStatus'),
      kpiTarget: document.getElementById('kpiTarget'),
      kpiElapsed: document.getElementById('kpiElapsed'),
      kpiBudget: document.getElementById('kpiBudget'),
      kpiProgress: document.getElementById('kpiProgress'),
      progressFill: document.getElementById('progressFill'),
      messages: document.getElementById('messages'),
      artifactList: document.getElementById('artifactList'),
      testList: document.getElementById('testList'),
      input: document.getElementById('input'),
      newSessionBtn: document.getElementById('newSessionBtn'),
      targetLocalBtn: document.getElementById('targetLocalBtn'),
      targetCloudBtn: document.getElementById('targetCloudBtn'),
      runTestsBtn: document.getElementById('runTestsBtn'),
      generateArtifactBtn: document.getElementById('generateArtifactBtn'),
      retryBtn: document.getElementById('retryBtn'),
      stopBtn: document.getElementById('stopBtn'),
      clearBtn: document.getElementById('clearBtn'),
      sendBtn: document.getElementById('sendBtn'),
    };

    function roleLabel(role) { return role === 'user' ? 'You' : role === 'assistant' ? 'Assistant' : 'System'; }
    function activeSession() { return state.sessions.find((s) => s.id === state.activeSessionId); }

    function renderSessions() {
      ui.sessionList.innerHTML = '';
      for (const session of state.sessions) {
        const item = document.createElement('li');
        item.className = 'sessionItem' + (session.id === state.activeSessionId ? ' active' : '');
        const title = document.createElement('div');
        title.className = 'sessionTitle';
        title.textContent = session.title || 'Workspace';
        const meta = document.createElement('div');
        meta.className = 'sessionMeta';
        meta.textContent = (session.status || 'idle') + ' · ' + (session.updatedAt || '');
        const preview = document.createElement('div');
        preview.className = 'sessionPreview';
        preview.textContent = session.preview || '暂无消息';
        item.appendChild(title); item.appendChild(meta); item.appendChild(preview);
        item.addEventListener('click', () => vscode.postMessage({ type: 'chat.switchSession', sessionId: session.id }));
        ui.sessionList.appendChild(item);
      }
    }

    function renderHeader() {
      const session = activeSession();
      ui.headerTitle.textContent = session?.title || 'Workerflow Studio';
      ui.headerStatus.textContent = state.runtime.status || 'idle';
      const isCloud = state.runtime.target === 'cloud';
      ui.targetLocalBtn.classList.toggle('active', !isCloud);
      ui.targetCloudBtn.classList.toggle('active', isCloud);
      ui.kpiTarget.textContent = isCloud ? 'Cloud' : 'Local';
      ui.kpiElapsed.textContent = String(state.runtime.elapsedSec || 0) + 's';
      const budget = Number(state.runtime.budgetUsd || 0);
      ui.kpiBudget.textContent = '$' + budget.toFixed(2);
      const progress = Math.max(0, Math.min(100, Number(state.runtime.progress || 0)));
      ui.kpiProgress.textContent = String(progress) + '%';
      ui.progressFill.style.width = String(progress) + '%';
    }

    function renderMessages() {
      ui.messages.innerHTML = '';
      if (!Array.isArray(state.messages) || state.messages.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = '输入需求后发送，再运行测试并生成产物。';
        ui.messages.appendChild(empty);
        return;
      }
      for (const msg of state.messages) {
        const item = document.createElement('div');
        item.className = 'msg ' + (msg.role || 'system') + (msg.streaming ? ' streaming' : '');
        const meta = document.createElement('div');
        meta.className = 'msgMeta';
        meta.textContent = '[' + (msg.time || '') + '] ' + roleLabel(msg.role || 'system');
        const text = document.createElement('div');
        text.className = 'msgText';
        text.textContent = msg.text || '';
        item.appendChild(meta); item.appendChild(text);
        ui.messages.appendChild(item);
      }
      ui.messages.scrollTop = ui.messages.scrollHeight;
    }

    function renderSimpleList(el, list, emptyText) {
      el.innerHTML = '';
      if (!Array.isArray(list) || list.length === 0) {
        const li = document.createElement('li');
        li.className = 'panelItem panelEmpty';
        li.textContent = emptyText;
        el.appendChild(li);
        return;
      }
      for (const itemText of list) {
        const li = document.createElement('li');
        li.className = 'panelItem';
        li.textContent = itemText;
        el.appendChild(li);
      }
    }

    function renderAll() {
      renderSessions();
      renderHeader();
      renderMessages();
      renderSimpleList(ui.artifactList, state.artifacts, '暂无产物');
      renderSimpleList(ui.testList, state.tests, '暂无测试记录');
    }

    function sendCurrentInput() {
      const text = ui.input.value.trim();
      if (!text) { return; }
      vscode.postMessage({ type: 'chat.send', text });
      ui.input.value = '';
      ui.input.focus();
    }

    ui.newSessionBtn.addEventListener('click', () => vscode.postMessage({ type: 'chat.newSession' }));
    ui.targetLocalBtn.addEventListener('click', () => vscode.postMessage({ type: 'chat.setTarget', target: 'local' }));
    ui.targetCloudBtn.addEventListener('click', () => vscode.postMessage({ type: 'chat.setTarget', target: 'cloud' }));
    ui.runTestsBtn.addEventListener('click', () => vscode.postMessage({ type: 'chat.runTests' }));
    ui.generateArtifactBtn.addEventListener('click', () => vscode.postMessage({ type: 'chat.generateArtifact' }));
    ui.retryBtn.addEventListener('click', () => vscode.postMessage({ type: 'chat.retry' }));
    ui.stopBtn.addEventListener('click', () => vscode.postMessage({ type: 'chat.stop' }));
    ui.clearBtn.addEventListener('click', () => vscode.postMessage({ type: 'chat.clearSession' }));
    ui.sendBtn.addEventListener('click', sendCurrentInput);
    ui.input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendCurrentInput(); } });

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type !== 'state') { return; }
      const next = message.state || {};
      state.sessions = Array.isArray(next.sessions) ? next.sessions : [];
      state.activeSessionId = typeof next.activeSessionId === 'string' ? next.activeSessionId : '';
      state.messages = Array.isArray(next.messages) ? next.messages : [];
      state.runtime = next.runtime || state.runtime;
      state.artifacts = Array.isArray(next.artifacts) ? next.artifacts : [];
      state.tests = Array.isArray(next.tests) ? next.tests : [];
      renderAll();
    });

    renderAll();
    ui.input.focus();
  </script>
</body>
</html>`;
