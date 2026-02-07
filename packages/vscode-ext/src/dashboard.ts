import * as vscode from "vscode";

export type DashboardEvent = {
  time: string;
  source: "extension" | "engine";
  type: string;
  payload?: unknown;
};

export type DashboardStateSnapshot = {
  sessionId: string;
  status: string;
  turnIndex: number;
  agreementScore: number;
  totalTokens: number;
  totalCost: number;
  participants: Array<{
    participant_id: string;
    role?: string;
    provider?: string;
    model_id?: string;
    status?: string;
    latency_ms?: number;
  }>;
};

export class DashboardPanel {
  private static current: DashboardPanel | undefined;

  public static createOrShow(context: vscode.ExtensionContext): DashboardPanel {
    if (DashboardPanel.current) {
      DashboardPanel.current.panel.reveal(vscode.ViewColumn.Two);
      return DashboardPanel.current;
    }

    const panel = vscode.window.createWebviewPanel(
      "workerflowDashboard",
      "Workerflow Dashboard",
      vscode.ViewColumn.Two,
      { enableScripts: true },
    );

    DashboardPanel.current = new DashboardPanel(panel, context);
    return DashboardPanel.current;
  }

  public static getCurrent(): DashboardPanel | undefined {
    return DashboardPanel.current;
  }

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private events: DashboardEvent[] = [];

  private constructor(panel: vscode.WebviewPanel, _context: vscode.ExtensionContext) {
    this.panel = panel;
    this.panel.webview.html = this.renderHtml();

    this.panel.onDidDispose(() => {
      this.dispose();
    }, null, this.disposables);

    this.panel.webview.onDidReceiveMessage((message: { type?: string }) => {
      if (message.type === "clear") {
        this.events = [];
        void this.panel.webview.postMessage({ type: "reset" });
      }
    }, null, this.disposables);
  }

  public append(event: DashboardEvent): void {
    this.events.push(event);
    if (this.events.length > 300) {
      this.events = this.events.slice(-300);
    }

    void this.panel.webview.postMessage({
      type: "event",
      event,
    });
  }

  public updateState(state: DashboardStateSnapshot): void {
    void this.panel.webview.postMessage({
      type: "state",
      state,
    });
  }

  public reveal(): void {
    this.panel.reveal(vscode.ViewColumn.Two);
  }

  public dispose(): void {
    while (this.disposables.length > 0) {
      const disposable = this.disposables.pop();
      disposable?.dispose();
    }
    DashboardPanel.current = undefined;
  }

  private renderHtml(): string {
    const bootEvents = JSON.stringify(this.events);

    return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Workerflow Dashboard</title>
    <style>
      body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 12px; }
      .toolbar { display: flex; gap: 8px; margin-bottom: 10px; }
      button { border: 1px solid var(--vscode-button-border, transparent); background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 4px 10px; border-radius: 4px; cursor: pointer; }
      button:hover { background: var(--vscode-button-hoverBackground); }
      .hint { color: var(--vscode-descriptionForeground); margin-bottom: 10px; }
      .grid { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 8px; margin-bottom: 12px; }
      .card { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 8px; }
      .card .k { font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; }
      .card .v { font-size: 16px; font-weight: 600; }
      .agreementCard { grid-column: span 2; }
      .agreementWrap { display: flex; align-items: center; gap: 10px; }
      .ringBox { position: relative; width: 52px; height: 52px; flex: 0 0 auto; }
      .ringSvg { width: 52px; height: 52px; transform: rotate(-90deg); }
      .ringTrack { fill: none; stroke: var(--vscode-panel-border); stroke-width: 6; }
      .ringProgress { fill: none; stroke: var(--vscode-progressBar-background, #0e70c0); stroke-width: 6; stroke-linecap: round; transition: stroke-dashoffset 180ms ease, stroke 180ms ease; }
      .ringCenter { position: absolute; inset: 0; display: grid; place-items: center; font-size: 11px; color: var(--vscode-descriptionForeground); font-weight: 600; }
      .agreementValues { display: grid; gap: 2px; }
      .agreementValues .v { line-height: 1.1; }
      .agreementSub { font-size: 11px; color: var(--vscode-descriptionForeground); }
      .section { margin-bottom: 12px; }
      .section h3 { margin: 0 0 6px 0; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid var(--vscode-panel-border); padding: 6px; text-align: left; font-size: 12px; }
      th { color: var(--vscode-descriptionForeground); font-weight: 500; }
      #events { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
      .item { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 8px; }
      .meta { font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; }
      pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
      .empty { color: var(--vscode-descriptionForeground); }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <button id="clearBtn">清空事件</button>
    </div>
    <div class="hint">用于观察请求、通知、stderr 和状态变更，适合本地部署测试。</div>

    <div class="section">
      <h3>会话状态</h3>
      <div class="grid">
        <div class="card"><div class="k">Session</div><div class="v" id="sessionId">-</div></div>
        <div class="card"><div class="k">Status</div><div class="v" id="sessionStatus">-</div></div>
        <div class="card"><div class="k">Turn</div><div class="v" id="turnIndex">0</div></div>
        <div class="card agreementCard">
          <div class="k">Agreement</div>
          <div class="agreementWrap">
            <div class="ringBox">
              <svg class="ringSvg" viewBox="0 0 52 52" aria-hidden="true">
                <circle class="ringTrack" cx="26" cy="26" r="21"></circle>
                <circle class="ringProgress" id="agreementRing" cx="26" cy="26" r="21"></circle>
              </svg>
              <div class="ringCenter" id="agreementPercent">0%</div>
            </div>
            <div class="agreementValues">
              <div class="v" id="agreement">0.00</div>
              <div class="agreementSub">score (0-1)</div>
            </div>
          </div>
        </div>
        <div class="card"><div class="k">Total Tokens</div><div class="v" id="totalTokens">0</div></div>
        <div class="card"><div class="k">Total Cost</div><div class="v" id="totalCost">$0.0000</div></div>
      </div>
    </div>

    <div class="section">
      <h3>参与者</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Role</th>
            <th>Provider/Model</th>
            <th>Status</th>
            <th>Latency(ms)</th>
          </tr>
        </thead>
        <tbody id="participantsBody"></tbody>
      </table>
    </div>

    <ul id="events"></ul>
    <div id="empty" class="empty">暂无事件，先执行 Workerflow 命令试试。</div>
    <script>
      const vscode = acquireVsCodeApi();
      const eventsEl = document.getElementById('events');
      const emptyEl = document.getElementById('empty');
      const clearBtn = document.getElementById('clearBtn');
      const sessionIdEl = document.getElementById('sessionId');
      const sessionStatusEl = document.getElementById('sessionStatus');
      const turnIndexEl = document.getElementById('turnIndex');
      const agreementEl = document.getElementById('agreement');
      const agreementRingEl = document.getElementById('agreementRing');
      const agreementPercentEl = document.getElementById('agreementPercent');
      const totalTokensEl = document.getElementById('totalTokens');
      const totalCostEl = document.getElementById('totalCost');
      const participantsBodyEl = document.getElementById('participantsBody');
      const ringRadius = 21;
      const ringCircumference = 2 * Math.PI * ringRadius;

      if (agreementRingEl) {
        agreementRingEl.style.strokeDasharray = String(ringCircumference);
        agreementRingEl.style.strokeDashoffset = String(ringCircumference);
      }

      function pretty(payload) {
        if (payload === undefined || payload === null) {
          return '';
        }
        try {
          return JSON.stringify(payload, null, 2);
        } catch {
          return String(payload);
        }
      }

      function renderEvent(evt) {
        const item = document.createElement('li');
        item.className = 'item';

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = '[' + evt.time + '] [' + evt.source + '] ' + evt.type;

        const pre = document.createElement('pre');
        pre.textContent = pretty(evt.payload);

        item.appendChild(meta);
        item.appendChild(pre);
        eventsEl.prepend(item);
        emptyEl.style.display = 'none';
      }

      function clearEvents() {
        eventsEl.innerHTML = '';
        emptyEl.style.display = 'block';
      }

      function fmtNumber(n, digits = 2) {
        if (typeof n !== 'number' || Number.isNaN(n)) {
          return '-';
        }
        return n.toFixed(digits);
      }

      function fmtInt(n) {
        if (typeof n !== 'number' || Number.isNaN(n)) {
          return '0';
        }
        return String(Math.trunc(n));
      }

      function normalizeAgreement(score) {
        if (typeof score !== 'number' || Number.isNaN(score)) {
          return 0;
        }
        if (score > 1) {
          return Math.max(0, Math.min(1, score / 100));
        }
        return Math.max(0, Math.min(1, score));
      }

      function getAgreementColor(normalized) {
        if (normalized >= 0.8) {
          return 'var(--vscode-testing-iconPassed, #73c991)';
        }
        if (normalized >= 0.5) {
          return 'var(--vscode-charts-yellow, #cca700)';
        }
        return 'var(--vscode-testing-iconFailed, #f14c4c)';
      }

      function updateAgreementRing(score) {
        const normalized = normalizeAgreement(score);
        const offset = ringCircumference * (1 - normalized);

        if (agreementRingEl) {
          agreementRingEl.style.strokeDashoffset = String(offset);
          agreementRingEl.style.stroke = getAgreementColor(normalized);
        }

        if (agreementPercentEl) {
          agreementPercentEl.textContent = String(Math.round(normalized * 100)) + '%';
        }
      }

      function updateState(state) {
        sessionIdEl.textContent = state.sessionId || '-';
        sessionStatusEl.textContent = state.status || '-';
        turnIndexEl.textContent = fmtInt(state.turnIndex);
        agreementEl.textContent = fmtNumber(state.agreementScore, 2);
        updateAgreementRing(state.agreementScore);
        totalTokensEl.textContent = fmtInt(state.totalTokens);
        const cost = typeof state.totalCost === 'number' ? state.totalCost : 0;
        totalCostEl.textContent = '$' + cost.toFixed(4);

        participantsBodyEl.innerHTML = '';
        const participants = Array.isArray(state.participants) ? state.participants : [];
        for (const participant of participants) {
          const row = document.createElement('tr');

          const idCell = document.createElement('td');
          idCell.textContent = participant.participant_id || '-';

          const roleCell = document.createElement('td');
          roleCell.textContent = participant.role || '-';

          const modelCell = document.createElement('td');
          modelCell.textContent = (participant.provider || '-') + ' / ' + (participant.model_id || '-');

          const statusCell = document.createElement('td');
          statusCell.textContent = participant.status || '-';

          const latencyCell = document.createElement('td');
          latencyCell.textContent = participant.latency_ms ? String(participant.latency_ms) : '-';

          row.appendChild(idCell);
          row.appendChild(roleCell);
          row.appendChild(modelCell);
          row.appendChild(statusCell);
          row.appendChild(latencyCell);
          participantsBodyEl.appendChild(row);
        }
      }

      clearBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'clear' });
      });

      window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'event') {
          renderEvent(message.event);
        }
        if (message.type === 'reset') {
          clearEvents();
        }
        if (message.type === 'state') {
          updateState(message.state || {});
        }
      });

      const boot = ${bootEvents};
      if (Array.isArray(boot)) {
        for (const evt of boot) {
          renderEvent(evt);
        }
      }
    </script>
  </body>
</html>`;
  }
}
