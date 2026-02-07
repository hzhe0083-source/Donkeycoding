import {
  pingEngine,
  querySessionState,
  refreshOrchestratorStatus,
  sendOfficeChat,
  setKeys,
  startOfficeDebate,
  startOrchestrator,
  stopOfficeDebate,
  stopOrchestrator,
} from "./rpc";
import {
  addOffice,
  getActiveOffice,
  removeOffice,
  setActiveOffice,
  state,
} from "./state";
import type {
  OfficeDraft,
  OfficeMember,
  OfficeSnapshot,
  OperatorDraft,
  ReviewDraft,
  WorkspaceMode,
} from "./types";
import { escapeHtml, safeJson } from "./utils";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("#app not found");
}

const modeMeta: Record<WorkspaceMode, { title: string; desc: string }> = {
  offices: {
    title: "办公室看板",
    desc: "查看多个办公室并行会议的状态",
  },
  creation: {
    title: "创作工作区",
    desc: "查看当前办公室的实时产出",
  },
  review: {
    title: "审查日志",
    desc: "查看通知流、RPC 和系统日志",
  },
};

function setMode(mode: WorkspaceMode): void {
  state.workspaceMode = mode;
  render();
}

function getSnapshot(officeId: string): OfficeSnapshot {
  return (
    state.officeSnapshots[officeId] ?? {
      officeId,
      status: "idle",
      sessionId: "-",
      turnIndex: 0,
      agreementScore: 0,
      totalTokens: 0,
      totalCost: 0,
      lastSummary: "暂无会议结论",
      lastUpdatedAt: new Date().toISOString(),
    }
  );
}

function statusLabel(status: OfficeSnapshot["status"]): string {
  const labels: Record<string, string> = {
    idle: "空闲",
    starting: "启动中",
    running: "运行中",
    completed: "已完成",
    stopped: "已停止",
    error: "异常",
  };
  return labels[status] ?? status;
}

function formatCost(value: number): string {
  if (!Number.isFinite(value)) {
    return "0.0000";
  }
  return value.toFixed(4);
}

function formatTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString();
}

function renderModeButton(mode: WorkspaceMode): string {
  const active = state.workspaceMode === mode;
  const info = modeMeta[mode];
  return `
    <button class="mode-btn ${active ? "active" : ""}" data-mode="${mode}">
      <div class="mode-title">${escapeHtml(info.title)}</div>
      <div class="mode-desc">${escapeHtml(info.desc)}</div>
    </button>
  `;
}

function renderOfficeList(): string {
  return state.offices
    .map((office) => {
      const snapshot = getSnapshot(office.officeId);
      const active = office.officeId === state.activeOfficeId;
      const enabled = office.members.filter((member) => member.enabled).length;
      return `
        <button class="office-item ${active ? "active" : ""}" data-office-id="${office.officeId}">
          <div class="office-name">${escapeHtml(office.officeName)}</div>
          <div class="office-meta">${enabled} 名员工 · ${office.maxRounds} 轮 · ${statusLabel(snapshot.status)}</div>
          <div class="office-sub">轮次 ${snapshot.turnIndex} · 共识 ${snapshot.agreementScore.toFixed(3)}</div>
        </button>
      `;
    })
    .join("");
}

function renderOfficeCards(): string {
  return state.offices
    .map((office) => {
      const snapshot = getSnapshot(office.officeId);
      return `
        <button class="office-card" data-office-id="${office.officeId}">
          <div class="office-card-head">
            <h3>${escapeHtml(office.officeName)}</h3>
            <span class="status-pill ${snapshot.status}">${statusLabel(snapshot.status)}</span>
          </div>
          <div class="office-card-objective">${escapeHtml(office.objective || "未设置目标")}</div>
          <div class="office-card-grid">
            <div><span>轮次</span><b>${snapshot.turnIndex}</b></div>
            <div><span>共识</span><b>${snapshot.agreementScore.toFixed(3)}</b></div>
            <div><span>Tokens</span><b>${snapshot.totalTokens}</b></div>
            <div><span>Cost</span><b>${formatCost(snapshot.totalCost)}</b></div>
          </div>
          <div class="office-card-session">Session: ${escapeHtml(snapshot.sessionId)}</div>
          <div class="office-card-summary">${escapeHtml(snapshot.lastSummary || "暂无摘要")}</div>
          <div class="office-card-time">更新时间：${escapeHtml(formatTime(snapshot.lastUpdatedAt))}</div>
        </button>
      `;
    })
    .join("");
}

function renderParticipantsTable(): string {
  if (state.participants.length === 0) {
    return `<div class="muted">暂无参与者状态。</div>`;
  }

  return `
    <table class="table">
      <thead>
        <tr><th>员工</th><th>角色</th><th>Provider</th><th>Model</th><th>状态</th><th>延迟(ms)</th></tr>
      </thead>
      <tbody>
        ${state.participants
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(item.participantId)}</td>
                <td>${escapeHtml(item.role)}</td>
                <td>${escapeHtml(item.provider)}</td>
                <td>${escapeHtml(item.modelId)}</td>
                <td>${escapeHtml(item.status)}</td>
                <td>${item.latencyMs ?? "-"}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderChunks(): string {
  if (state.chunks.length === 0) {
    return `<div class="muted">暂无流式输出。</div>`;
  }

  return state.chunks
    .slice(0, 180)
    .map(
      (chunk) => `
        <div class="log-item">
          <div class="log-title">${escapeHtml(chunk.time)} · 第 ${chunk.turnIndex} 轮 · ${escapeHtml(chunk.participantId)}</div>
          <pre>${escapeHtml(chunk.delta)}</pre>
        </div>
      `,
    )
    .join("");
}

function renderNotifications(): string {
  if (state.notifications.length === 0) {
    return `<div class="muted">暂无通知。</div>`;
  }

  return state.notifications
    .slice(0, 120)
    .map(
      (item) => `
        <div class="log-item">
          <div class="log-title">${escapeHtml(item.time)} · ${escapeHtml(item.method)}</div>
          <pre>${escapeHtml(safeJson(item.payload))}</pre>
        </div>
      `,
    )
    .join("");
}

function renderLogs(): string {
  if (state.logs.length === 0) {
    return `<div class="muted">暂无日志。</div>`;
  }

  return state.logs
    .slice(0, 220)
    .map((line) => `<div class="log-line">${escapeHtml(line)}</div>`)
    .join("");
}

function renderMembersEditor(office: OfficeDraft): string {
  return office.members
    .map(
      (member, index) => `
        <div class="member-row">
          <input class="member-enabled" type="checkbox" data-member-index="${index}" ${
            member.enabled ? "checked" : ""
          } />
          <input class="member-id" type="text" data-member-index="${index}" value="${escapeHtml(member.participantId)}" />
          <select class="member-provider" data-member-index="${index}">
            <option value="openai" ${member.provider === "openai" ? "selected" : ""}>chatgpt / openai</option>
            <option value="google" ${member.provider === "google" ? "selected" : ""}>gemini / google</option>
            <option value="anthropic" ${member.provider === "anthropic" ? "selected" : ""}>claude / anthropic</option>
            <option value="deepseek" ${member.provider === "deepseek" ? "selected" : ""}>deepseek</option>
          </select>
          <input class="member-model" type="text" data-member-index="${index}" value="${escapeHtml(member.modelId)}" />
          <select class="member-role" data-member-index="${index}">
            <option value="proposer" ${member.role === "proposer" ? "selected" : ""}>proposer</option>
            <option value="critic" ${member.role === "critic" ? "selected" : ""}>critic</option>
            <option value="synthesizer" ${member.role === "synthesizer" ? "selected" : ""}>synthesizer</option>
            <option value="arbiter" ${member.role === "arbiter" ? "selected" : ""}>arbiter</option>
            <option value="researcher" ${member.role === "researcher" ? "selected" : ""}>researcher</option>
            <option value="verifier" ${member.role === "verifier" ? "selected" : ""}>verifier</option>
          </select>
        </div>
      `,
    )
    .join("");
}

function renderOperatorsEditor(operators: OperatorDraft[]): string {
  return operators
    .map(
      (operator, index) => `
        <div class="operator-row">
          <input class="operator-enabled" type="checkbox" data-operator-index="${index}" ${
            operator.enabled ? "checked" : ""
          } />
          <input class="operator-name" type="text" data-operator-index="${index}" value="${escapeHtml(operator.name)}" />
          <input class="operator-config" type="text" data-operator-index="${index}" value="${escapeHtml(operator.configText)}" />
          <button class="operator-move-up" data-operator-index="${index}" ${index === 0 ? "disabled" : ""}>上移</button>
          <button class="operator-move-down" data-operator-index="${index}" ${
            index === operators.length - 1 ? "disabled" : ""
          }>下移</button>
          <button class="operator-remove danger" data-operator-index="${index}">删除</button>
        </div>
      `,
    )
    .join("");
}

function renderStatusMetrics(officeId: string): string {
  const snapshot = getSnapshot(officeId);
  return `
    <div class="metrics">
      <div class="card"><div>状态</div><b>${escapeHtml(statusLabel(snapshot.status))}</b></div>
      <div class="card"><div>轮次</div><b>${snapshot.turnIndex}</b></div>
      <div class="card"><div>共识</div><b>${snapshot.agreementScore.toFixed(3)}</b></div>
      <div class="card"><div>Tokens</div><b>${snapshot.totalTokens}</b></div>
      <div class="card"><div>Cost</div><b>${formatCost(snapshot.totalCost)}</b></div>
      <div class="card"><div>Session</div><b>${escapeHtml(snapshot.sessionId)}</b></div>
    </div>
  `;
}

function renderCenterWorkspace(activeOffice: OfficeDraft): string {
  if (state.workspaceMode === "offices") {
    return `
      <section class="workspace-panel">
        <h2>办公室总览</h2>
        <div class="muted">每个办公室可以独立运行：ChatGPT、Gemini、Claude 协作并产出结果。</div>
        <div class="office-cards">${renderOfficeCards()}</div>
      </section>
    `;
  }

  if (state.workspaceMode === "creation") {
    return `
      <section class="workspace-panel">
        <h2>${escapeHtml(activeOffice.officeName)} · 创作工作区</h2>
        <div class="muted">目标：${escapeHtml(activeOffice.objective)}</div>
        ${renderStatusMetrics(activeOffice.officeId)}
        <div class="split-vertical">
          <div class="sub-panel">
            <h3>实时输出流</h3>
            ${renderChunks()}
          </div>
          <div class="sub-panel">
            <h3>参与者状态</h3>
            ${renderParticipantsTable()}
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="workspace-panel">
      <h2>审查与日志</h2>
      <div class="split-vertical">
        <div class="sub-panel">
          <h3>通知流</h3>
          ${renderNotifications()}
        </div>
        <div class="sub-panel">
          <h3>系统日志</h3>
          ${renderLogs()}
        </div>
      </div>
    </section>
  `;
}

function renderRightPanel(office: OfficeDraft): string {
  const review: ReviewDraft = state.review;
  const snapshot = getSnapshot(office.officeId);
  return `
    <aside class="right-config panel">
      <h2>参数控制</h2>

      <div class="sub-title">办公室配置</div>
      <div class="stack">
        <label class="field">
          <span>办公室名称</span>
          <input id="office-name" type="text" value="${escapeHtml(office.officeName)}" />
        </label>
        <label class="field">
          <span>创作目标</span>
          <textarea id="office-objective" rows="3">${escapeHtml(office.objective)}</textarea>
        </label>
        <label class="field">
          <span>最大轮数</span>
          <input id="office-rounds" type="number" min="1" max="12" value="${office.maxRounds}" />
        </label>
      </div>

      <div class="sub-title">员工编排</div>
      <div class="members-list">${renderMembersEditor(office)}</div>

      <div class="sub-title">API Keys</div>
      <div class="stack">
        <label class="field"><span>OpenAI</span><input id="key-openai" type="password" value="${escapeHtml(state.apiKeys.openai)}" /></label>
        <label class="field"><span>Anthropic</span><input id="key-anthropic" type="password" value="${escapeHtml(state.apiKeys.anthropic)}" /></label>
        <label class="field"><span>Google</span><input id="key-google" type="password" value="${escapeHtml(state.apiKeys.google)}" /></label>
        <label class="field"><span>DeepSeek</span><input id="key-deepseek" type="password" value="${escapeHtml(state.apiKeys.deepseek)}" /></label>
      </div>

      <div class="sub-title">审查策略</div>
      <div class="stack">
        <label class="field">
          <span>启用审查</span>
          <select id="review-enabled">
            <option value="true" ${review.enabled ? "selected" : ""}>开启</option>
            <option value="false" ${!review.enabled ? "selected" : ""}>关闭</option>
          </select>
        </label>
        <label class="field"><span>Language</span><input id="review-language" type="text" value="${escapeHtml(review.language)}" /></label>
        <label class="field">
          <span>最低严重等级</span>
          <select id="review-severity">
            <option value="LOW" ${review.minSeverity === "LOW" ? "selected" : ""}>LOW</option>
            <option value="MEDIUM" ${review.minSeverity === "MEDIUM" ? "selected" : ""}>MEDIUM</option>
            <option value="HIGH" ${review.minSeverity === "HIGH" ? "selected" : ""}>HIGH</option>
            <option value="CRITICAL" ${review.minSeverity === "CRITICAL" ? "selected" : ""}>CRITICAL</option>
          </select>
        </label>
        <label class="field"><span>最大发现数</span><input id="review-max-findings" type="number" min="1" max="30" value="${review.maxFindings}" /></label>
        <label class="field">
          <span>证据要求</span>
          <select id="review-evidence">
            <option value="true" ${review.requireEvidence ? "selected" : ""}>要求证据</option>
            <option value="false" ${!review.requireEvidence ? "selected" : ""}>不要求</option>
          </select>
        </label>
        <label class="field"><span>分类（逗号分隔）</span><textarea id="review-categories" rows="2">${escapeHtml(review.categoriesText)}</textarea></label>
      </div>

      <div class="sub-title">算子链</div>
      <div class="operators-list">${renderOperatorsEditor(state.operators)}</div>
      <div class="actions compact">
        <button id="add-operator">新增算子</button>
      </div>

      <div class="sub-title">会议控制</div>
      <div class="actions">
        <button id="btn-set-keys">同步 Keys</button>
        <button id="btn-start-session" ${
          !state.orchestratorRunning || snapshot.status === "running" ? "disabled" : ""
        }>启动办公室辩论</button>
        <button id="btn-stop-session" ${state.sessionId === "-" ? "disabled" : ""}>停止会话</button>
        <button id="btn-refresh-session" ${state.sessionId === "-" ? "disabled" : ""}>查询会话状态</button>
      </div>

      <label class="field">
        <span>向当前会话发送消息</span>
        <textarea id="chat-message" rows="2" placeholder="给当前办公室追加限制、反馈或新想法"></textarea>
      </label>
      <div class="actions">
        <button id="btn-send-chat" ${state.sessionId === "-" ? "disabled" : ""}>发送消息</button>
      </div>
    </aside>
  `;
}

export function render(): void {
  const activeOffice = getActiveOffice();
  const activeMode = modeMeta[state.workspaceMode];

  app.innerHTML = `
    <div class="shell">
      <aside class="left-nav panel">
        <h2>模式切换</h2>
        ${renderModeButton("offices")}
        ${renderModeButton("creation")}
        ${renderModeButton("review")}

        <div class="divider"></div>

        <h2>办公室</h2>
        <div class="office-list">${renderOfficeList()}</div>
        <div class="actions compact">
          <button id="btn-add-office">新增办公室</button>
          <button id="btn-remove-office" class="danger" ${
            state.offices.length <= 1 ? "disabled" : ""
          }>删除当前</button>
        </div>
      </aside>

      <main class="center-workspace panel">
        <header class="top-status">
          <h1>Donkey Studio · 多办公室 AI 协作创作</h1>
          <div class="status-row">
            <span>当前模式：${escapeHtml(activeMode.title)}</span>
            <span>Orchestrator：${state.orchestratorRunning ? "在线" : "离线"}</span>
            <span>全局状态：${escapeHtml(state.runStatus)}</span>
            <span>活跃会话：${escapeHtml(state.sessionId)}</span>
          </div>
          <div class="actions compact">
            <button id="btn-start-orch" ${state.orchestratorRunning ? "disabled" : ""}>启动 Orchestrator</button>
            <button id="btn-ping" ${state.orchestratorRunning ? "" : "disabled"}>Ping</button>
            <button id="btn-stop-orch" class="danger" ${state.orchestratorRunning ? "" : "disabled"}>停止 Orchestrator</button>
          </div>
        </header>
        ${renderCenterWorkspace(activeOffice)}
      </main>

      ${renderRightPanel(activeOffice)}
    </div>
  `;

  bindEvents(activeOffice);
}

function bindModeButtons(): void {
  app.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode as WorkspaceMode | undefined;
      if (!mode) {
        return;
      }
      setMode(mode);
    });
  });
}

function bindOfficeSelection(): void {
  app.querySelectorAll<HTMLButtonElement>("[data-office-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const officeId = button.dataset.officeId;
      if (!officeId) {
        return;
      }
      setActiveOffice(officeId);
      render();
    });
  });
}

function bindOfficeBaseFields(office: OfficeDraft): void {
  const officeName = app.querySelector<HTMLInputElement>("#office-name");
  const officeObjective = app.querySelector<HTMLTextAreaElement>("#office-objective");
  const officeRounds = app.querySelector<HTMLInputElement>("#office-rounds");

  officeName?.addEventListener("input", () => {
    office.officeName = officeName.value;
    render();
  });

  officeObjective?.addEventListener("input", () => {
    office.objective = officeObjective.value;
  });

  officeRounds?.addEventListener("change", () => {
    const parsed = Number(officeRounds.value);
    if (Number.isFinite(parsed)) {
      office.maxRounds = Math.max(1, Math.min(12, Math.round(parsed)));
      render();
    }
  });
}

function bindMemberFields(office: OfficeDraft): void {
  const pick = (indexText: string | undefined): OfficeMember | undefined => {
    const index = Number(indexText);
    if (!Number.isInteger(index) || index < 0 || index >= office.members.length) {
      return undefined;
    }
    return office.members[index];
  };

  app.querySelectorAll<HTMLInputElement>(".member-enabled").forEach((input) => {
    input.addEventListener("change", () => {
      const member = pick(input.dataset.memberIndex);
      if (!member) {
        return;
      }
      member.enabled = input.checked;
      render();
    });
  });

  app.querySelectorAll<HTMLInputElement>(".member-id").forEach((input) => {
    input.addEventListener("input", () => {
      const member = pick(input.dataset.memberIndex);
      if (member) {
        member.participantId = input.value;
      }
    });
  });

  app.querySelectorAll<HTMLSelectElement>(".member-provider").forEach((select) => {
    select.addEventListener("change", () => {
      const member = pick(select.dataset.memberIndex);
      if (member) {
        member.provider = select.value as OfficeMember["provider"];
      }
    });
  });

  app.querySelectorAll<HTMLInputElement>(".member-model").forEach((input) => {
    input.addEventListener("input", () => {
      const member = pick(input.dataset.memberIndex);
      if (member) {
        member.modelId = input.value;
      }
    });
  });

  app.querySelectorAll<HTMLSelectElement>(".member-role").forEach((select) => {
    select.addEventListener("change", () => {
      const member = pick(select.dataset.memberIndex);
      if (member) {
        member.role = select.value as OfficeMember["role"];
      }
    });
  });
}

function bindKeyFields(): void {
  const entries: Array<keyof typeof state.apiKeys> = ["openai", "anthropic", "google", "deepseek"];
  for (const key of entries) {
    const field = app.querySelector<HTMLInputElement>(`#key-${key}`);
    field?.addEventListener("input", () => {
      state.apiKeys[key] = field.value;
    });
  }
}

function bindReviewFields(): void {
  const enabled = app.querySelector<HTMLSelectElement>("#review-enabled");
  const language = app.querySelector<HTMLInputElement>("#review-language");
  const severity = app.querySelector<HTMLSelectElement>("#review-severity");
  const maxFindings = app.querySelector<HTMLInputElement>("#review-max-findings");
  const evidence = app.querySelector<HTMLSelectElement>("#review-evidence");
  const categories = app.querySelector<HTMLTextAreaElement>("#review-categories");

  enabled?.addEventListener("change", () => {
    state.review.enabled = enabled.value === "true";
  });

  language?.addEventListener("input", () => {
    state.review.language = language.value;
  });

  severity?.addEventListener("change", () => {
    state.review.minSeverity = severity.value as ReviewDraft["minSeverity"];
  });

  maxFindings?.addEventListener("change", () => {
    const parsed = Number(maxFindings.value);
    if (Number.isFinite(parsed)) {
      state.review.maxFindings = Math.max(1, Math.min(30, Math.round(parsed)));
    }
  });

  evidence?.addEventListener("change", () => {
    state.review.requireEvidence = evidence.value === "true";
  });

  categories?.addEventListener("input", () => {
    state.review.categoriesText = categories.value;
  });
}

function bindOperatorFields(): void {
  const pick = (indexText: string | undefined): OperatorDraft | undefined => {
    const index = Number(indexText);
    if (!Number.isInteger(index) || index < 0 || index >= state.operators.length) {
      return undefined;
    }
    return state.operators[index];
  };

  app.querySelectorAll<HTMLInputElement>(".operator-enabled").forEach((input) => {
    input.addEventListener("change", () => {
      const operator = pick(input.dataset.operatorIndex);
      if (operator) {
        operator.enabled = input.checked;
      }
    });
  });

  app.querySelectorAll<HTMLInputElement>(".operator-name").forEach((input) => {
    input.addEventListener("input", () => {
      const operator = pick(input.dataset.operatorIndex);
      if (operator) {
        operator.name = input.value;
      }
    });
  });

  app.querySelectorAll<HTMLInputElement>(".operator-config").forEach((input) => {
    input.addEventListener("input", () => {
      const operator = pick(input.dataset.operatorIndex);
      if (operator) {
        operator.configText = input.value;
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>(".operator-remove").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.operatorIndex);
      if (!Number.isInteger(index) || index < 0 || index >= state.operators.length) {
        return;
      }
      state.operators.splice(index, 1);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>(".operator-move-up").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.operatorIndex);
      if (!Number.isInteger(index) || index <= 0 || index >= state.operators.length) {
        return;
      }
      const [item] = state.operators.splice(index, 1);
      state.operators.splice(index - 1, 0, item);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>(".operator-move-down").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.operatorIndex);
      if (!Number.isInteger(index) || index < 0 || index >= state.operators.length - 1) {
        return;
      }
      const [item] = state.operators.splice(index, 1);
      state.operators.splice(index + 1, 0, item);
      render();
    });
  });

  const add = app.querySelector<HTMLButtonElement>("#add-operator");
  add?.addEventListener("click", () => {
    state.operators.push({ name: "new_operator", enabled: true, configText: "null" });
    render();
  });
}

function bindGlobalActions(): void {
  const startOrch = app.querySelector<HTMLButtonElement>("#btn-start-orch");
  const ping = app.querySelector<HTMLButtonElement>("#btn-ping");
  const stopOrch = app.querySelector<HTMLButtonElement>("#btn-stop-orch");

  startOrch?.addEventListener("click", async () => {
    await startOrchestrator();
    await refreshOrchestratorStatus();
    render();
  });

  ping?.addEventListener("click", async () => {
    await pingEngine();
    render();
  });

  stopOrch?.addEventListener("click", async () => {
    await stopOrchestrator();
    await refreshOrchestratorStatus();
    render();
  });

  const addOfficeButton = app.querySelector<HTMLButtonElement>("#btn-add-office");
  const removeOfficeButton = app.querySelector<HTMLButtonElement>("#btn-remove-office");

  addOfficeButton?.addEventListener("click", () => {
    addOffice();
    render();
  });

  removeOfficeButton?.addEventListener("click", () => {
    removeOffice(state.activeOfficeId);
    render();
  });
}

function bindMeetingActions(): void {
  const setKeysButton = app.querySelector<HTMLButtonElement>("#btn-set-keys");
  const startSessionButton = app.querySelector<HTMLButtonElement>("#btn-start-session");
  const stopSessionButton = app.querySelector<HTMLButtonElement>("#btn-stop-session");
  const refreshSessionButton = app.querySelector<HTMLButtonElement>("#btn-refresh-session");
  const sendChatButton = app.querySelector<HTMLButtonElement>("#btn-send-chat");
  const chatMessage = app.querySelector<HTMLTextAreaElement>("#chat-message");

  setKeysButton?.addEventListener("click", async () => {
    await setKeys();
    render();
  });

  startSessionButton?.addEventListener("click", async () => {
    await startOfficeDebate();
    render();
  });

  stopSessionButton?.addEventListener("click", async () => {
    await stopOfficeDebate();
    render();
  });

  refreshSessionButton?.addEventListener("click", async () => {
    await querySessionState();
    render();
  });

  sendChatButton?.addEventListener("click", async () => {
    const message = chatMessage?.value ?? "";
    await sendOfficeChat(message);
    if (chatMessage) {
      chatMessage.value = "";
    }
    render();
  });
}

function bindEvents(activeOffice: OfficeDraft): void {
  bindModeButtons();
  bindOfficeSelection();
  bindOfficeBaseFields(activeOffice);
  bindMemberFields(activeOffice);
  bindKeyFields();
  bindReviewFields();
  bindOperatorFields();
  bindGlobalActions();
  bindMeetingActions();
}

export function mountStyles(): void {
  if (document.getElementById("donkey-studio-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "donkey-studio-style";
  style.textContent = `
    :root {
      color-scheme: dark;
      --bg: #0d1016;
      --panel: #131a24;
      --panel-2: #171f2d;
      --card: #1a2535;
      --stroke: #2d394d;
      --text: #e9eef7;
      --muted: #9eacc3;
      --blue: #4e78d6;
      --blue-soft: #6a93e7;
      --danger: #b06a6a;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100%;
      background: radial-gradient(circle at 12% -20%, #1d283a 0%, var(--bg) 45%, #090c11 100%);
      color: var(--text);
      font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
    }
    #app { min-height: 100vh; padding: 10px; }
    .shell {
      min-height: calc(100vh - 20px);
      display: grid;
      grid-template-columns: 300px minmax(760px, 1fr) 420px;
      gap: 10px;
    }
    .panel {
      border: 1px solid var(--stroke);
      border-radius: 10px;
      background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0)), var(--panel);
      padding: 12px;
      box-shadow: 0 10px 24px rgba(0,0,0,0.25);
    }
    .left-nav, .right-config {
      height: calc(100vh - 20px);
      overflow: auto;
    }
    .center-workspace {
      display: grid;
      grid-template-rows: auto 1fr;
      gap: 12px;
      overflow: hidden;
    }
    .workspace-panel {
      border: 1px solid var(--stroke);
      border-radius: 10px;
      background: var(--panel-2);
      padding: 12px;
      overflow: auto;
      min-height: 0;
    }
    h1, h2, h3 { margin: 0; }
    h2 { font-size: 16px; margin-bottom: 10px; }
    .top-status h1 { font-size: 22px; }
    .status-row {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      color: var(--muted);
      font-size: 13px;
    }
    .mode-btn {
      width: 100%;
      text-align: left;
      margin-bottom: 8px;
      border: 1px solid var(--stroke);
      background: #182234;
      color: var(--text);
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      transition: 120ms ease;
    }
    .mode-btn:hover { background: #1f2d44; }
    .mode-btn.active { border-color: var(--blue); background: #243553; }
    .mode-title { font-weight: 600; margin-bottom: 3px; }
    .mode-desc { color: var(--muted); font-size: 12px; }
    .divider { border-top: 1px dashed var(--stroke); margin: 12px 0; }
    .office-list { display: grid; gap: 8px; }
    .office-item {
      text-align: left;
      border: 1px solid var(--stroke);
      border-radius: 8px;
      padding: 9px;
      background: #182335;
      color: var(--text);
      cursor: pointer;
      transition: 120ms ease;
    }
    .office-item:hover { background: #1e2d46; }
    .office-item.active { border-color: var(--blue); background: #243555; }
    .office-name { font-weight: 600; font-size: 13px; }
    .office-meta { color: var(--muted); font-size: 12px; margin-top: 2px; }
    .office-sub { color: #b8c6df; font-size: 12px; margin-top: 3px; }
    .office-cards {
      margin-top: 12px;
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
    .office-card {
      border: 1px solid var(--stroke);
      border-radius: 10px;
      background: var(--card);
      padding: 10px;
      display: grid;
      gap: 8px;
      cursor: pointer;
      color: var(--text);
      text-align: left;
    }
    .office-card:hover { border-color: #446089; }
    .office-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .office-card h3 { font-size: 15px; }
    .office-card-objective {
      color: #c8d3e8;
      font-size: 13px;
      line-height: 1.45;
    }
    .office-card-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(120px, 1fr));
      gap: 8px;
    }
    .office-card-grid > div {
      border: 1px solid var(--stroke);
      border-radius: 8px;
      padding: 7px;
      background: #182335;
      display: grid;
      gap: 2px;
    }
    .office-card-grid span {
      font-size: 11px;
      color: var(--muted);
    }
    .office-card-grid b { font-size: 13px; }
    .office-card-session { color: #b8c6df; font-size: 12px; }
    .office-card-summary {
      border: 1px solid var(--stroke);
      border-radius: 8px;
      background: #152132;
      color: #d8e1f1;
      font-size: 12px;
      line-height: 1.45;
      padding: 8px;
      min-height: 56px;
    }
    .office-card-time { color: var(--muted); font-size: 12px; }
    .status-pill {
      border: 1px solid var(--stroke);
      border-radius: 999px;
      font-size: 11px;
      padding: 2px 8px;
      color: #d6e2fa;
      background: #1d2b44;
    }
    .status-pill.running { border-color: #4d79db; }
    .status-pill.completed {
      border-color: #4f8a6b;
      color: #cff0df;
      background: #21382d;
    }
    .status-pill.error {
      border-color: #975454;
      color: #ffd8d8;
      background: #3a2525;
    }
    .sub-title { color: var(--muted); font-size: 12px; margin: 12px 0 8px; }
    .stack { display: grid; gap: 8px; }
    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    .actions.compact { margin-top: 10px; }
    .split-vertical {
      margin-top: 10px;
      display: grid;
      gap: 10px;
      grid-template-rows: 1fr 1fr;
      min-height: 560px;
    }
    .sub-panel {
      border: 1px solid var(--stroke);
      border-radius: 8px;
      padding: 8px;
      overflow: auto;
      background: #162132;
      min-height: 0;
    }
    .sub-panel h3 { margin: 0 0 8px; font-size: 14px; color: #d6e0f3; }
    .metrics {
      margin-top: 10px;
      display: grid;
      grid-template-columns: repeat(6, minmax(120px, 1fr));
      gap: 8px;
    }
    .card {
      border: 1px solid var(--stroke);
      border-radius: 10px;
      padding: 9px;
      background: #172335;
    }
    .card div { color: var(--muted); font-size: 12px; }
    .card b {
      margin-top: 2px;
      display: block;
      font-size: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .members-list, .operators-list { display: grid; gap: 8px; }
    .member-row {
      display: grid;
      grid-template-columns: 24px minmax(100px, 1fr) 140px minmax(110px, 1fr) 120px;
      gap: 8px;
      align-items: center;
      border: 1px solid var(--stroke);
      border-radius: 8px;
      padding: 8px;
      background: #182335;
    }
    .operator-row {
      display: grid;
      grid-template-columns: 24px minmax(120px, 1fr) minmax(120px, 1.2fr) auto auto auto;
      gap: 8px;
      align-items: center;
      border: 1px solid var(--stroke);
      border-radius: 8px;
      padding: 8px;
      background: #182335;
    }
    button {
      border: 1px solid #3a4a66;
      background: #1e2d45;
      color: var(--text);
      border-radius: 8px;
      padding: 8px 10px;
      cursor: pointer;
      transition: 120ms ease;
      font-size: 13px;
    }
    button:hover { background: #28405f; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .danger {
      border-color: #6f4747;
      background: #3b2727;
      color: #f0dede;
    }
    .danger:hover { background: #513737; }
    input, textarea, select {
      background: #121a28;
      color: var(--text);
      border: 1px solid #374761;
      border-radius: 8px;
      padding: 8px;
      width: 100%;
      outline: none;
      font-size: 13px;
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--blue-soft);
      box-shadow: 0 0 0 2px rgba(106, 147, 231, 0.22);
    }
    .field { display: grid; gap: 4px; align-content: start; }
    .field span { color: var(--muted); font-size: 11px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td {
      text-align: left;
      border-bottom: 1px solid var(--stroke);
      padding: 6px;
      font-size: 13px;
    }
    .muted { color: var(--muted); font-size: 13px; }
    .log-item {
      border: 1px solid var(--stroke);
      border-radius: 8px;
      padding: 8px;
      margin-bottom: 8px;
      background: #162234;
    }
    .log-title {
      color: #a8b6cf;
      margin-bottom: 6px;
      font-size: 12px;
    }
    .log-item pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 12px;
      color: #d7e0f2;
    }
    .log-line {
      font-size: 12px;
      color: #c2cfeb;
      margin-bottom: 6px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    @media (max-width: 1680px) {
      .shell {
        grid-template-columns: 270px minmax(680px, 1fr) 380px;
      }
      .metrics {
        grid-template-columns: repeat(3, minmax(120px, 1fr));
      }
    }
    @media (max-width: 1360px) {
      .shell {
        grid-template-columns: 1fr;
      }
      .left-nav, .right-config {
        height: auto;
      }
    }
  `;
  document.head.appendChild(style);
}
