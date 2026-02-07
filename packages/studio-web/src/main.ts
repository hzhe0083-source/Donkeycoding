type RunTarget = "local" | "cloud";
type SessionStatus = "idle" | "running" | "stopped" | "error";

type Message = {
  role: "user" | "assistant" | "system";
  text: string;
  time: string;
};

type Session = {
  id: string;
  title: string;
  status: SessionStatus;
  target: RunTarget;
  progress: number;
  elapsedSec: number;
  budgetUsd: number;
  updatedAt: string;
  messages: Message[];
  tests: string[];
  artifacts: string[];
};

type ReleaseManifest = {
  version: string;
  notes?: string;
  download_url?: string;
  published_at?: string;
};

const APP_VERSION = "0.1.0";
const UPDATE_MANIFEST_URL =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_UPDATE_MANIFEST_URL || "").trim() ||
  "/release-manifest.json";
const AUTO_CHECK_ENABLED =
  (((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_UPDATE_AUTO_CHECK || "true").trim().toLowerCase() !==
    "false");
const AUTO_CHECK_DELAY_MS = (() => {
  const raw = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_UPDATE_AUTO_CHECK_DELAY_MS || "").trim();
  if (!raw) {
    return 3000;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 3000;
  }
  return Math.trunc(parsed);
})();

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("#app not found");
}

const state: {
  sessions: Session[];
  activeId: string;
  latestUpdate: string;
  updateDownloadUrl: string | null;
  updateToastVisible: boolean;
  updateToastText: string;
  updateUnread: boolean;
} = {
  sessions: [],
  activeId: "",
  latestUpdate: "尚未检查更新",
  updateDownloadUrl: null,
  updateToastVisible: false,
  updateToastText: "",
  updateUnread: false,
};

let updateToastTimer: number | null = null;

function clearUpdateToastTimer(): void {
  if (updateToastTimer !== null) {
    window.clearTimeout(updateToastTimer);
    updateToastTimer = null;
  }
}

function showUpdateToast(text: string): void {
  clearUpdateToastTimer();
  state.updateToastVisible = true;
  state.updateToastText = text;
  state.updateUnread = true;

  updateToastTimer = window.setTimeout(() => {
    state.updateToastVisible = false;
    state.updateToastText = "";
    updateToastTimer = null;
    render();
  }, 8000);
}

function hideUpdateToastAndMarkRead(): void {
  clearUpdateToastTimer();
  state.updateToastVisible = false;
  state.updateToastText = "";
  state.updateUnread = false;
}

function openExternalUrl(url: string): void {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) {
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.click();
}

function nowIso(): string {
  return new Date().toISOString();
}

function createSession(title: string): Session {
  return {
    id: `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    status: "idle",
    target: "local",
    progress: 0,
    elapsedSec: 0,
    budgetUsd: 0,
    updatedAt: nowIso(),
    messages: [],
    tests: [],
    artifacts: [],
  };
}

function activeSession(): Session {
  const found = state.sessions.find((s) => s.id === state.activeId);
  if (found) {
    return found;
  }
  const created = createSession(`Workspace ${state.sessions.length + 1}`);
  state.sessions.unshift(created);
  state.activeId = created.id;
  return created;
}

function addMessage(session: Session, role: Message["role"], text: string): void {
  session.messages.push({ role, text, time: nowIso() });
  session.updatedAt = nowIso();
}

function fakeAssistantReply(session: Session, userText: string): void {
  session.status = "running";
  session.progress = Math.min(95, session.progress + 15);
  if (session.target === "cloud") {
    session.budgetUsd += 0.02;
  }
  session.elapsedSec += 2;

  const summary = userText.length > 90 ? `${userText.slice(0, 90)}...` : userText;
  addMessage(
    session,
    "assistant",
    `已收到任务：${summary}\n\n下一步建议：\n1) 先拆分验收标准\n2) 先跑 local smoke test\n3) 需要时切到 cloud 做大规模测试`,
  );
  session.status = "idle";
  session.progress = 100;
}

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((n) => Number(n));
  const pb = b.split(".").map((n) => Number(n));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av > bv) {
      return 1;
    }
    if (av < bv) {
      return -1;
    }
  }
  return 0;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function checkForUpdates(): Promise<void> {
  const button = document.querySelector<HTMLButtonElement>("#checkUpdateBtn");
  if (button) {
    button.disabled = true;
    button.textContent = "检查中...";
  }

  try {
    const response = await fetch(UPDATE_MANIFEST_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const manifest = (await response.json()) as ReleaseManifest;
    if (!manifest.version) {
      throw new Error("manifest 缺少 version 字段");
    }

    if (compareSemver(manifest.version, APP_VERSION) > 0) {
      state.updateDownloadUrl = manifest.download_url ?? null;
      if (state.updateDownloadUrl) {
        state.latestUpdate = `发现新版本 ${manifest.version}（当前 ${APP_VERSION}）`;
        showUpdateToast(`发现新版本 ${manifest.version}`);
      } else {
        state.latestUpdate = `发现新版本 ${manifest.version}，但未提供下载地址`;
        state.updateToastVisible = false;
        state.updateToastText = "";
        state.updateUnread = false;
      }
    } else {
      state.updateDownloadUrl = null;
      state.latestUpdate = `当前已是最新版本（${APP_VERSION}）`;
      state.updateToastVisible = false;
      state.updateToastText = "";
      state.updateUnread = false;
    }
  } catch (error) {
    state.updateDownloadUrl = null;
    state.updateToastVisible = false;
    state.updateToastText = "";
    state.updateUnread = false;
    const detail = error instanceof Error ? error.message : String(error);
    state.latestUpdate = `检查更新失败：${detail}`;
  } finally {
    render();
    const latestUpdateEl = document.querySelector<HTMLPreElement>("#latestUpdate");
    latestUpdateEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function render(): void {
  const current = activeSession();

  app.innerHTML = `
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; }
    .layout { display: grid; grid-template-columns: 220px minmax(460px,1fr) 280px; height: 100vh; font-family: Inter, Segoe UI, Arial, sans-serif; color: #d4d4d4; background: #1e1e1e; }
    .left { border-right: 1px solid #2b2b2b; padding: 8px; overflow: auto; }
    .center { display: grid; grid-template-rows: auto 1fr auto; min-width: 0; }
    .right { border-left: 1px solid #2b2b2b; display: grid; grid-template-rows: auto 1fr 1fr; }
    .title { font-size: 14px; font-weight: 700; margin: 0; }
    .muted { color: #9da0a6; font-size: 12px; }
    .btn { border: 1px solid #3f3f46; background: #2f3136; color: #f3f4f6; border-radius: 8px; padding: 6px 10px; cursor: pointer; }
    .btn:hover { background: #3a3d42; }
    .btn.primary { background: #0e639c; border-color: #0e639c; }
    .btn.primary:hover { background: #1177bb; }
    .session { border: 1px solid #333; border-radius: 8px; padding: 8px; margin-top: 8px; cursor: pointer; }
    .session.active { border-color: #0e639c; background: #172632; }
    .header { border-bottom: 1px solid #2b2b2b; padding: 10px; display: grid; gap: 8px; }
    .headerTop { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .switch { display: inline-flex; border: 1px solid #3f3f46; border-radius: 999px; overflow: hidden; }
    .switch button { border: none; background: transparent; color: #d4d4d4; padding: 4px 10px; cursor: pointer; }
    .switch button.active { background: #0e639c; color: #fff; }
    .kpis { display: grid; grid-template-columns: repeat(4, minmax(70px, 1fr)); gap: 8px; }
    .kpi { border: 1px solid #2f2f2f; border-radius: 8px; padding: 8px; }
    .kpiLabel { font-size: 11px; color: #9da0a6; }
    .kpiValue { font-size: 14px; font-weight: 700; }
    .messages { overflow: auto; padding: 10px; display: grid; gap: 10px; }
    .msg { border: 1px solid #343434; border-radius: 10px; padding: 8px 10px; max-width: 92%; white-space: pre-wrap; line-height: 1.45; }
    .msg.user { justify-self: end; background: #133247; }
    .msg.assistant { justify-self: start; background: #242628; }
    .msg.system { justify-self: center; width: 98%; background: #2b2730; }
    .composer { border-top: 1px solid #2b2b2b; padding: 10px; display: grid; gap: 8px; }
    .composer textarea { width: 100%; min-height: 86px; background: #1f2226; color: #f3f4f6; border: 1px solid #3f3f46; border-radius: 8px; padding: 8px; }
    .actions { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }
    .panelHead { border-bottom: 1px solid #2b2b2b; padding: 10px; font-size: 12px; font-weight: 700; }
    .list { margin: 0; padding: 10px; list-style: none; overflow: auto; display: grid; gap: 8px; }
    .list li { border: 1px solid #333; border-radius: 8px; padding: 8px; font-size: 12px; }
    .updateBox { border-bottom: 1px solid #2b2b2b; padding: 10px; display: grid; gap: 8px; }
    .updateBtnWrap { position: relative; display: inline-flex; width: fit-content; }
    .updateBadge { position: absolute; top: -6px; right: -6px; width: 10px; height: 10px; border-radius: 999px; background: #e11d48; border: 1px solid #1e1e1e; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; color: #9da0a6; font-size: 12px; }
    .toast { position: fixed; top: 14px; left: 50%; transform: translateX(-50%); background: #20262d; border: 1px solid #0e639c; border-radius: 10px; padding: 8px 10px; display: flex; gap: 8px; align-items: center; z-index: 1000; box-shadow: 0 8px 30px rgba(0, 0, 0, .35); }
    .toastText { font-size: 12px; }
  </style>

  ${
    state.updateToastVisible
      ? `<div id="updateToast" class="toast"><span class="toastText">${escapeHtml(state.updateToastText)}</span><button id="toastDownloadBtn" class="btn primary">Download Update</button><button id="toastCloseBtn" class="btn">关闭</button></div>`
      : ""
  }

  <div class="layout">
    <aside class="left">
      <h3 class="title">Workspaces</h3>
      <div class="muted">独立前端原型（可后续打包成 Windows 客户端）</div>
      <button id="newWorkspaceBtn" class="btn" style="width:100%;margin-top:8px;">+ New Workspace</button>
      ${state.sessions
        .map(
          (session) => `
            <div class="session ${session.id === state.activeId ? "active" : ""}" data-session-id="${session.id}">
              <div><strong>${escapeHtml(session.title)}</strong></div>
              <div class="muted">${escapeHtml(session.status)} · ${escapeHtml(session.updatedAt)}</div>
              <div class="muted">${escapeHtml(session.messages.at(-1)?.text.slice(0, 32) ?? "暂无消息")}</div>
            </div>
          `,
        )
        .join("")}
    </aside>

    <main class="center">
      <div class="header">
        <div class="headerTop">
          <div>
            <div class="title">${escapeHtml(current.title)}</div>
            <div class="muted">状态：${escapeHtml(current.status)}（v${APP_VERSION}）</div>
          </div>
          <div class="switch">
            <button id="targetLocalBtn" class="${current.target === "local" ? "active" : ""}">Local</button>
            <button id="targetCloudBtn" class="${current.target === "cloud" ? "active" : ""}">Cloud</button>
          </div>
        </div>
        <div class="kpis">
          <div class="kpi"><div class="kpiLabel">Target</div><div class="kpiValue">${current.target.toUpperCase()}</div></div>
          <div class="kpi"><div class="kpiLabel">Elapsed</div><div class="kpiValue">${current.elapsedSec}s</div></div>
          <div class="kpi"><div class="kpiLabel">Budget</div><div class="kpiValue">$${current.budgetUsd.toFixed(2)}</div></div>
          <div class="kpi"><div class="kpiLabel">Progress</div><div class="kpiValue">${current.progress}%</div></div>
        </div>
      </div>

      <div class="messages">
        ${
          current.messages.length === 0
            ? `<div class="muted">输入需求后点击 Send 开始。</div>`
            : current.messages
                .map(
                  (message) => `
                    <div class="msg ${message.role}">
                      <div class="muted">${escapeHtml(message.time)} · ${escapeHtml(message.role)}</div>
                      <div>${escapeHtml(message.text)}</div>
                    </div>
                  `,
                )
                .join("")
        }
      </div>

      <div class="composer">
        <textarea id="input" placeholder="例如：实现登录页并生成测试脚本"></textarea>
        <div class="actions">
          <button id="runTestsBtn" class="btn">Run Tests</button>
          <button id="genArtifactBtn" class="btn">Generate Artifact</button>
          <button id="clearBtn" class="btn">Clear</button>
          <button id="sendBtn" class="btn primary">Send</button>
        </div>
      </div>
    </main>

    <aside class="right">
      <section class="updateBox">
        <div class="panelHead" style="padding:0;border:none;">更新</div>
        <div class="updateBtnWrap"><button id="checkUpdateBtn" class="btn">检查更新</button>${state.updateUnread ? `<span class="updateBadge"></span>` : ""}</div>
        ${state.updateDownloadUrl ? `<button id="downloadUpdateBtn" class="btn primary">Download Update</button>` : ""}
        <pre id="latestUpdate">${escapeHtml(state.latestUpdate)}</pre>
      </section>

      <section style="display:grid;grid-template-rows:auto 1fr;min-height:0;">
        <div class="panelHead">Artifacts</div>
        <ul class="list">${
          current.artifacts.length === 0
            ? `<li class="muted">暂无产物</li>`
            : current.artifacts.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
        }</ul>
      </section>

      <section style="display:grid;grid-template-rows:auto 1fr;min-height:0;">
        <div class="panelHead">Test Runs</div>
        <ul class="list">${
          current.tests.length === 0
            ? `<li class="muted">暂无测试记录</li>`
            : current.tests.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
        }</ul>
      </section>
    </aside>
  </div>
  `;

  wireEvents();
}

function wireEvents(): void {
  const session = activeSession();

  const newWorkspaceBtn = document.querySelector<HTMLButtonElement>("#newWorkspaceBtn");
  newWorkspaceBtn?.addEventListener("click", () => {
    const created = createSession(`Workspace ${state.sessions.length + 1}`);
    state.sessions.unshift(created);
    state.activeId = created.id;
    render();
  });

  for (const node of document.querySelectorAll<HTMLElement>(".session[data-session-id]")) {
    const sessionId = node.dataset.sessionId;
    node.addEventListener("click", () => {
      if (!sessionId) {
        return;
      }
      state.activeId = sessionId;
      render();
    });
  }

  const targetLocalBtn = document.querySelector<HTMLButtonElement>("#targetLocalBtn");
  targetLocalBtn?.addEventListener("click", () => {
    session.target = "local";
    session.updatedAt = nowIso();
    render();
  });

  const targetCloudBtn = document.querySelector<HTMLButtonElement>("#targetCloudBtn");
  targetCloudBtn?.addEventListener("click", () => {
    session.target = "cloud";
    session.updatedAt = nowIso();
    render();
  });

  const sendBtn = document.querySelector<HTMLButtonElement>("#sendBtn");
  const inputEl = document.querySelector<HTMLTextAreaElement>("#input");
  const send = () => {
    if (!inputEl) {
      return;
    }
    const text = inputEl.value.trim();
    if (!text) {
      return;
    }
    addMessage(session, "user", text);
    fakeAssistantReply(session, text);
    inputEl.value = "";
    render();
  };
  sendBtn?.addEventListener("click", send);
  inputEl?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  });

  const runTestsBtn = document.querySelector<HTMLButtonElement>("#runTestsBtn");
  runTestsBtn?.addEventListener("click", () => {
    session.tests.unshift(`${session.target.toUpperCase()} test run @ ${new Date().toLocaleTimeString()}`);
    session.tests = session.tests.slice(0, 10);
    addMessage(session, "system", `已触发 ${session.target} 测试。`);
    render();
  });

  const genArtifactBtn = document.querySelector<HTMLButtonElement>("#genArtifactBtn");
  genArtifactBtn?.addEventListener("click", () => {
    session.artifacts.unshift(`delivery-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.zip`);
    session.artifacts = session.artifacts.slice(0, 10);
    addMessage(session, "system", "已生成产物。可接入真实下载服务。");
    render();
  });

  const clearBtn = document.querySelector<HTMLButtonElement>("#clearBtn");
  clearBtn?.addEventListener("click", () => {
    session.messages = [];
    session.progress = 0;
    session.status = "idle";
    session.updatedAt = nowIso();
    render();
  });

  const checkUpdateBtn = document.querySelector<HTMLButtonElement>("#checkUpdateBtn");
  checkUpdateBtn?.addEventListener("click", () => {
    state.updateUnread = false;
    void checkForUpdates();
  });

  const downloadUpdateBtn = document.querySelector<HTMLButtonElement>("#downloadUpdateBtn");
  downloadUpdateBtn?.addEventListener("click", () => {
    if (!state.updateDownloadUrl) {
      return;
    }
    hideUpdateToastAndMarkRead();
    render();
    openExternalUrl(state.updateDownloadUrl);
  });

  const toastDownloadBtn = document.querySelector<HTMLButtonElement>("#toastDownloadBtn");
  toastDownloadBtn?.addEventListener("click", () => {
    if (!state.updateDownloadUrl) {
      return;
    }
    openExternalUrl(state.updateDownloadUrl);
  });

  const toastCloseBtn = document.querySelector<HTMLButtonElement>("#toastCloseBtn");
  toastCloseBtn?.addEventListener("click", () => {
    hideUpdateToastAndMarkRead();
    render();
  });
}

state.sessions = [createSession("Workspace 1")];
state.activeId = state.sessions[0].id;
render();

if (AUTO_CHECK_ENABLED) {
  window.setTimeout(() => {
    void checkForUpdates();
  }, AUTO_CHECK_DELAY_MS);
}
