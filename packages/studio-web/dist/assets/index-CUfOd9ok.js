(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&n(l)}).observe(document,{childList:!0,subtree:!0});function r(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(o){if(o.ep)return;o.ep=!0;const s=r(o);fetch(o.href,s)}})();function W(e,t=!1){return window.__TAURI_INTERNALS__.transformCallback(e,t)}async function v(e,t={},r){return window.__TAURI_INTERNALS__.invoke(e,t,r)}var M;(function(e){e.WINDOW_RESIZED="tauri://resize",e.WINDOW_MOVED="tauri://move",e.WINDOW_CLOSE_REQUESTED="tauri://close-requested",e.WINDOW_DESTROYED="tauri://destroyed",e.WINDOW_FOCUS="tauri://focus",e.WINDOW_BLUR="tauri://blur",e.WINDOW_SCALE_FACTOR_CHANGED="tauri://scale-change",e.WINDOW_THEME_CHANGED="tauri://theme-changed",e.WINDOW_CREATED="tauri://window-created",e.WEBVIEW_CREATED="tauri://webview-created",e.DRAG_ENTER="tauri://drag-enter",e.DRAG_OVER="tauri://drag-over",e.DRAG_DROP="tauri://drag-drop",e.DRAG_LEAVE="tauri://drag-leave"})(M||(M={}));async function j(e,t){window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(e,t),await v("plugin:event|unlisten",{event:e,eventId:t})}async function k(e,t,r){var n;const o=(n=void 0)!==null&&n!==void 0?n:{kind:"Any"};return v("plugin:event|listen",{event:e,target:o,handler:W(t)}).then(s=>async()=>j(e,s))}function S(e,t,r,n,o){return{participantId:`${e}-${t}`,provider:r,modelId:n,role:o,enabled:!0}}function _(e,t,r){return{officeId:e,officeName:t,objective:r,maxRounds:3,members:[S(e,"chatgpt","openai","gpt-4.1","proposer"),S(e,"gemini","google","gemini-1.5-pro","critic"),S(e,"claude","anthropic","claude-3-5-sonnet","synthesizer")]}}function L(e){return{officeId:e,status:"idle",sessionId:"-",turnIndex:0,agreementScore:0,totalTokens:0,totalCost:0,lastSummary:"暂无会议结论",lastUpdatedAt:new Date().toISOString()}}const R=[_("office-1","办公室 A","设计并实现一个可复用的三模型协作创作流程"),_("office-2","办公室 B","围绕同一目标提出替代方案，并进行风险评审")],K=Object.fromEntries(R.map(e=>[e.officeId,L(e.officeId)])),i={orchestratorRunning:!1,runStatus:"idle",workspaceMode:"offices",activeOfficeId:"office-1",offices:R,officeSnapshots:K,sessionOfficeMap:{},sessionId:"-",turnIndex:0,agreementScore:0,totalTokens:0,totalCost:0,participants:[],chunks:[],notifications:[],logs:[],apiKeys:{openai:"",anthropic:"",google:"",deepseek:""},review:{enabled:!0,language:"zh-CN",minSeverity:"MEDIUM",maxFindings:8,requireEvidence:!0,categoriesText:"correctness, security, performance, maintainability"},operators:[{name:"sanitize_input",enabled:!0,configText:"null"},{name:"context_window",enabled:!0,configText:"null"},{name:"participant_selector",enabled:!0,configText:"null"},{name:"role_response_format",enabled:!0,configText:"null"},{name:"review_instruction",enabled:!0,configText:"null"},{name:"review_findings",enabled:!0,configText:"null"},{name:"output_guard",enabled:!0,configText:"null"}]};function q(){const e=i.offices.find(r=>r.officeId===i.activeOfficeId);if(e)return e;const t=i.offices[0];return i.activeOfficeId=t.officeId,t}function P(e){i.offices.some(t=>t.officeId===e)&&(i.activeOfficeId=e)}function U(e){const t=i.sessionOfficeMap[e];if(t)return i.offices.find(r=>r.officeId===t)}function N(e,t){i.sessionOfficeMap[e]=t,x(t,{sessionId:e})}function x(e,t){const r=i.officeSnapshots[e]??L(e);i.officeSnapshots[e]={...r,...t,officeId:e,lastUpdatedAt:new Date().toISOString()}}function G(){const e=new Set(i.offices.map(r=>r.officeId).map(r=>r.replace("office-","")).map(r=>Number(r)).filter(r=>Number.isFinite(r)&&r>0));let t=1;for(;e.has(t);)t+=1;return t}function H(e){return e>=1&&e<=26?`办公室 ${String.fromCharCode(64+e)}`:`办公室 ${e}`}function V(){const e=G(),t=`office-${e}`,r=H(e),n=_(t,r,"在这里定义该办公室本轮创作目标");i.offices.push(n),i.officeSnapshots[t]=L(t),i.activeOfficeId=t}function B(e){if(!(i.offices.length<=1)){i.offices=i.offices.filter(t=>t.officeId!==e),delete i.officeSnapshots[e];for(const[t,r]of Object.entries(i.sessionOfficeMap))r===e&&delete i.sessionOfficeMap[t];i.activeOfficeId===e&&(i.activeOfficeId=i.offices[0].officeId)}}function u(e){i.logs.unshift(`[${new Date().toISOString()}] ${e}`),i.logs.length>300&&(i.logs=i.logs.slice(0,300))}function C(e,t){i.notifications.unshift({time:new Date().toISOString(),method:e,payload:t}),i.notifications.length>200&&(i.notifications=i.notifications.slice(0,200))}function J(e){i.chunks.unshift(e),i.chunks.length>400&&(i.chunks=i.chunks.slice(0,400))}function Y(e,t){const r=i.participants.find(n=>n.participantId===e);if(r){Object.assign(r,t);return}i.participants.push({participantId:e,role:t.role??"-",provider:t.provider??"-",modelId:t.modelId??"-",status:t.status??"pending",latencyMs:t.latencyMs})}function y(e){try{return JSON.stringify(e,null,2)}catch{return String(e)}}function g(e){return e instanceof Error?e.message:String(e)}function D(e){if(e&&typeof e=="object"&&!Array.isArray(e))return e}function f(e){return typeof e=="string"?e:void 0}function m(e){if(typeof e=="number"&&Number.isFinite(e))return e;if(typeof e=="string"&&e.trim().length>0){const t=Number(e);if(Number.isFinite(t))return t}}function a(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function T(e){if(e==="idle"||e==="starting"||e==="running"||e==="completed"||e==="stopped"||e==="error")return e}function Q(e){if(!Array.isArray(e))return;const t=new Map(i.participants.map(n=>[n.participantId,n])),r=e.map(n=>D(n)).filter(n=>n!==void 0).map(n=>{const o=f(n.participant_id)??"unknown",s=t.get(o);return{participantId:o,role:f(n.role)??(s==null?void 0:s.role)??"-",provider:f(n.provider)??(s==null?void 0:s.provider)??"-",modelId:f(n.model_id)??(s==null?void 0:s.modelId)??"-",status:(s==null?void 0:s.status)??"pending",latencyMs:s==null?void 0:s.latencyMs}});i.participants=r}function h(e,t){const r=U(e);r&&x(r.officeId,t)}function Z(e,t){const r=D(t);if(!r)return;const n=f(r.session_id);n&&(i.sessionId=n,i.sessionOfficeMap[n]||N(n,i.activeOfficeId));const o=f(r.status),s=T(o);s&&(i.runStatus=s);const l=m(r.turn_index)??m(r.current_turn)??m(r.total_turns);l!==void 0&&(i.turnIndex=l);const d=m(r.total_tokens);d!==void 0&&(i.totalTokens=d);const $=m(r.total_cost);$!==void 0&&(i.totalCost=$);const I=m(r.agreement_score)??m(r.final_agreement);I!==void 0&&(i.agreementScore=I),n&&h(n,{status:s,turnIndex:l,agreementScore:I,totalTokens:d,totalCost:$,lastSummary:typeof r.stop_reason=="string"?`会议结束：${r.stop_reason}`:o?`会话状态更新：${o}`:void 0})}function X(e){const t=e.method;if(!t)return;const r=e.params??{};C(t,r);const n=f(r.session_id);if(n&&!i.sessionOfficeMap[n]&&N(n,i.activeOfficeId),t==="session/state"){const o=f(r.session_id),s=f(r.status),l=f(r.reason),d=T(s);o&&(i.sessionId=o),d&&(i.runStatus=d),o&&h(o,{status:d,lastSummary:s?l?`状态：${s}（${l}）`:`状态：${s}`:void 0})}if(t==="session/progress"){const o=m(r.turn_index),s=m(r.total_tokens),l=m(r.total_cost),d=m(r.agreement_score);o!==void 0&&(i.turnIndex=o),s!==void 0&&(i.totalTokens=s),l!==void 0&&(i.totalCost=l),d!==void 0&&(i.agreementScore=d),n&&h(n,{status:"running",turnIndex:o,agreementScore:d,totalTokens:s,totalCost:l,lastSummary:d!==void 0?`第 ${o??0} 轮，共识 ${d.toFixed(3)}`:void 0})}if(t==="session/participants"&&Q(r.participants),t==="turn/complete"){const o=f(r.participant_id),s=f(r.status)??"unknown";o&&Y(o,{status:s,latencyMs:m(r.latency_ms)}),n&&o&&h(n,{lastSummary:`${o} 已完成，状态：${s}`})}if(t==="turn/chunk"){const o=f(r.participant_id)??"unknown",s=f(r.session_id)??i.sessionId,l=m(r.turn_index)??i.turnIndex,d=f(r.delta)??"";J({time:new Date().toISOString(),sessionId:s,turnIndex:l,participantId:o,delta:d}),h(s,{status:"running",turnIndex:l,lastSummary:`${o} 正在输出第 ${l} 轮内容`})}}function ee(e){return e.split(/[\n,，]+/).map(t=>t.trim()).filter(t=>t.length>0)}function te(e,t){const r=e.trim();if(!r)return null;try{return JSON.parse(r)}catch{throw new Error(`算子 ${t} 的 config 不是合法 JSON`)}}async function O(){var e;try{const t=await v("orchestrator_status");i.orchestratorRunning=!!((e=t.data)!=null&&e.running),!i.orchestratorRunning&&i.runStatus==="running"&&(i.runStatus="stopped")}catch(t){i.orchestratorRunning=!1,u(`orchestrator_status failed: ${g(t)}`)}}async function re(){i.runStatus="starting";try{const e=await v("start_orchestrator");i.orchestratorRunning=e.success,i.runStatus=e.success?"running":"error",u(`start_orchestrator: ${y(e.data)}`)}catch(e){i.orchestratorRunning=!1,i.runStatus="error",u(`start_orchestrator failed: ${g(e)}`)}}async function ie(){try{const e=await v("stop_orchestrator");i.orchestratorRunning=!1,i.runStatus=e.success?"stopped":"error",u(`stop_orchestrator: ${y(e.data)}`)}catch(e){i.runStatus="error",u(`stop_orchestrator failed: ${g(e)}`)}}async function b(e,t){if(!i.orchestratorRunning)throw new Error("orchestrator not running");const r=await v("send_rpc",{method:e,params:t??null});return Z(e,r),u(`rpc ${e} -> ${y(r)}`),r}async function ne(){try{await b("ping")}catch(e){u(`ping failed: ${g(e)}`)}}async function oe(){try{await b("config/setKeys",{openai:i.apiKeys.openai,anthropic:i.apiKeys.anthropic,google:i.apiKeys.google,deepseek:i.apiKeys.deepseek})}catch(e){u(`config/setKeys failed: ${g(e)}`)}}async function se(){try{const e=q(),t=ee(i.review.categoriesText),r=i.operators.filter(d=>d.name.trim().length>0).map(d=>({name:d.name.trim(),enabled:d.enabled,config:te(d.configText,d.name.trim())})),n=e.members.filter(d=>d.enabled).map(d=>({participant_id:d.participantId,role:d.role,provider:d.provider,model_id:d.modelId}));if(n.length<2)throw new Error("至少启用两个 AI 员工，才能开始辩论");if(t.length===0)throw new Error("review categories 不能为空");if(r.filter(d=>d.enabled).length===0)throw new Error("operators 至少需要启用一个");x(e.officeId,{status:"running",turnIndex:0,lastSummary:"办公室会议已启动，等待员工开始发言..."});const s=await b("session/start",{task:e.objective,participants:n,policy:{stop:{max_rounds:e.maxRounds}},review:{enabled:i.review.enabled,language:i.review.language,min_severity:i.review.minSeverity,max_findings:i.review.maxFindings,require_evidence:i.review.requireEvidence,categories:t},operators:{chain:r}}),l=typeof s.session_id=="string"?s.session_id:"";l&&(N(l,e.officeId),x(e.officeId,{sessionId:l,status:"running"}),i.sessionId=l)}catch(e){u(`startOfficeDebate failed: ${g(e)}`),i.runStatus="error"}}async function ae(e){const t=e.trim();if(t)try{const r={message:t};i.sessionId!=="-"&&(r.session_id=i.sessionId),await b("chat/send",r)}catch(r){u(`chat/send failed: ${g(r)}`)}}async function ce(){if(i.sessionId==="-"){u("chat/stop skipped: no active session");return}try{await b("chat/stop",{session_id:i.sessionId})}catch(e){u(`chat/stop failed: ${g(e)}`)}}async function de(){if(i.sessionId==="-"){u("session/state skipped: no active session");return}try{await b("session/state",{session_id:i.sessionId})}catch(e){u(`session/state failed: ${g(e)}`)}}const c=document.querySelector("#app");if(!c)throw new Error("#app not found");const z={offices:{title:"办公室看板",desc:"查看多个办公室并行会议的状态"},creation:{title:"创作工作区",desc:"查看当前办公室的实时产出"},review:{title:"审查日志",desc:"查看通知流、RPC 和系统日志"}};function le(e){i.workspaceMode=e,p()}function w(e){return i.officeSnapshots[e]??{officeId:e,status:"idle",sessionId:"-",turnIndex:0,agreementScore:0,totalTokens:0,totalCost:0,lastSummary:"暂无会议结论",lastUpdatedAt:new Date().toISOString()}}function A(e){return{idle:"空闲",starting:"启动中",running:"运行中",completed:"已完成",stopped:"已停止",error:"异常"}[e]??e}function F(e){return Number.isFinite(e)?e.toFixed(4):"0.0000"}function pe(e){const t=new Date(e);return Number.isNaN(t.getTime())?"-":t.toLocaleString()}function E(e){const t=i.workspaceMode===e,r=z[e];return`
    <button class="mode-btn ${t?"active":""}" data-mode="${e}">
      <div class="mode-title">${a(r.title)}</div>
      <div class="mode-desc">${a(r.desc)}</div>
    </button>
  `}function ue(){return i.offices.map(e=>{const t=w(e.officeId),r=e.officeId===i.activeOfficeId,n=e.members.filter(o=>o.enabled).length;return`
        <button class="office-item ${r?"active":""}" data-office-id="${e.officeId}">
          <div class="office-name">${a(e.officeName)}</div>
          <div class="office-meta">${n} 名员工 · ${e.maxRounds} 轮 · ${A(t.status)}</div>
          <div class="office-sub">轮次 ${t.turnIndex} · 共识 ${t.agreementScore.toFixed(3)}</div>
        </button>
      `}).join("")}function fe(){return i.offices.map(e=>{const t=w(e.officeId);return`
        <button class="office-card" data-office-id="${e.officeId}">
          <div class="office-card-head">
            <h3>${a(e.officeName)}</h3>
            <span class="status-pill ${t.status}">${A(t.status)}</span>
          </div>
          <div class="office-card-objective">${a(e.objective||"未设置目标")}</div>
          <div class="office-card-grid">
            <div><span>轮次</span><b>${t.turnIndex}</b></div>
            <div><span>共识</span><b>${t.agreementScore.toFixed(3)}</b></div>
            <div><span>Tokens</span><b>${t.totalTokens}</b></div>
            <div><span>Cost</span><b>${F(t.totalCost)}</b></div>
          </div>
          <div class="office-card-session">Session: ${a(t.sessionId)}</div>
          <div class="office-card-summary">${a(t.lastSummary||"暂无摘要")}</div>
          <div class="office-card-time">更新时间：${a(pe(t.lastUpdatedAt))}</div>
        </button>
      `}).join("")}function me(){return i.participants.length===0?'<div class="muted">暂无参与者状态。</div>':`
    <table class="table">
      <thead>
        <tr><th>员工</th><th>角色</th><th>Provider</th><th>Model</th><th>状态</th><th>延迟(ms)</th></tr>
      </thead>
      <tbody>
        ${i.participants.map(e=>`
              <tr>
                <td>${a(e.participantId)}</td>
                <td>${a(e.role)}</td>
                <td>${a(e.provider)}</td>
                <td>${a(e.modelId)}</td>
                <td>${a(e.status)}</td>
                <td>${e.latencyMs??"-"}</td>
              </tr>
            `).join("")}
      </tbody>
    </table>
  `}function ge(){return i.chunks.length===0?'<div class="muted">暂无流式输出。</div>':i.chunks.slice(0,180).map(e=>`
        <div class="log-item">
          <div class="log-title">${a(e.time)} · 第 ${e.turnIndex} 轮 · ${a(e.participantId)}</div>
          <pre>${a(e.delta)}</pre>
        </div>
      `).join("")}function ve(){return i.notifications.length===0?'<div class="muted">暂无通知。</div>':i.notifications.slice(0,120).map(e=>`
        <div class="log-item">
          <div class="log-title">${a(e.time)} · ${a(e.method)}</div>
          <pre>${a(y(e.payload))}</pre>
        </div>
      `).join("")}function be(){return i.logs.length===0?'<div class="muted">暂无日志。</div>':i.logs.slice(0,220).map(e=>`<div class="log-line">${a(e)}</div>`).join("")}function he(e){return e.members.map((t,r)=>`
        <div class="member-row">
          <input class="member-enabled" type="checkbox" data-member-index="${r}" ${t.enabled?"checked":""} />
          <input class="member-id" type="text" data-member-index="${r}" value="${a(t.participantId)}" />
          <select class="member-provider" data-member-index="${r}">
            <option value="openai" ${t.provider==="openai"?"selected":""}>chatgpt / openai</option>
            <option value="google" ${t.provider==="google"?"selected":""}>gemini / google</option>
            <option value="anthropic" ${t.provider==="anthropic"?"selected":""}>claude / anthropic</option>
            <option value="deepseek" ${t.provider==="deepseek"?"selected":""}>deepseek</option>
          </select>
          <input class="member-model" type="text" data-member-index="${r}" value="${a(t.modelId)}" />
          <select class="member-role" data-member-index="${r}">
            <option value="proposer" ${t.role==="proposer"?"selected":""}>proposer</option>
            <option value="critic" ${t.role==="critic"?"selected":""}>critic</option>
            <option value="synthesizer" ${t.role==="synthesizer"?"selected":""}>synthesizer</option>
            <option value="arbiter" ${t.role==="arbiter"?"selected":""}>arbiter</option>
            <option value="researcher" ${t.role==="researcher"?"selected":""}>researcher</option>
            <option value="verifier" ${t.role==="verifier"?"selected":""}>verifier</option>
          </select>
        </div>
      `).join("")}function xe(e){return e.map((t,r)=>`
        <div class="operator-row">
          <input class="operator-enabled" type="checkbox" data-operator-index="${r}" ${t.enabled?"checked":""} />
          <input class="operator-name" type="text" data-operator-index="${r}" value="${a(t.name)}" />
          <input class="operator-config" type="text" data-operator-index="${r}" value="${a(t.configText)}" />
          <button class="operator-move-up" data-operator-index="${r}" ${r===0?"disabled":""}>上移</button>
          <button class="operator-move-down" data-operator-index="${r}" ${r===e.length-1?"disabled":""}>下移</button>
          <button class="operator-remove danger" data-operator-index="${r}">删除</button>
        </div>
      `).join("")}function ye(e){const t=w(e);return`
    <div class="metrics">
      <div class="card"><div>状态</div><b>${a(A(t.status))}</b></div>
      <div class="card"><div>轮次</div><b>${t.turnIndex}</b></div>
      <div class="card"><div>共识</div><b>${t.agreementScore.toFixed(3)}</b></div>
      <div class="card"><div>Tokens</div><b>${t.totalTokens}</b></div>
      <div class="card"><div>Cost</div><b>${F(t.totalCost)}</b></div>
      <div class="card"><div>Session</div><b>${a(t.sessionId)}</b></div>
    </div>
  `}function we(e){return i.workspaceMode==="offices"?`
      <section class="workspace-panel">
        <h2>办公室总览</h2>
        <div class="muted">每个办公室可以独立运行：ChatGPT、Gemini、Claude 协作并产出结果。</div>
        <div class="office-cards">${fe()}</div>
      </section>
    `:i.workspaceMode==="creation"?`
      <section class="workspace-panel">
        <h2>${a(e.officeName)} · 创作工作区</h2>
        <div class="muted">目标：${a(e.objective)}</div>
        ${ye(e.officeId)}
        <div class="split-vertical">
          <div class="sub-panel">
            <h3>实时输出流</h3>
            ${ge()}
          </div>
          <div class="sub-panel">
            <h3>参与者状态</h3>
            ${me()}
          </div>
        </div>
      </section>
    `:`
    <section class="workspace-panel">
      <h2>审查与日志</h2>
      <div class="split-vertical">
        <div class="sub-panel">
          <h3>通知流</h3>
          ${ve()}
        </div>
        <div class="sub-panel">
          <h3>系统日志</h3>
          ${be()}
        </div>
      </div>
    </section>
  `}function $e(e){const t=i.review,r=w(e.officeId);return`
    <aside class="right-config panel">
      <h2>参数控制</h2>

      <div class="sub-title">办公室配置</div>
      <div class="stack">
        <label class="field">
          <span>办公室名称</span>
          <input id="office-name" type="text" value="${a(e.officeName)}" />
        </label>
        <label class="field">
          <span>创作目标</span>
          <textarea id="office-objective" rows="3">${a(e.objective)}</textarea>
        </label>
        <label class="field">
          <span>最大轮数</span>
          <input id="office-rounds" type="number" min="1" max="12" value="${e.maxRounds}" />
        </label>
      </div>

      <div class="sub-title">员工编排</div>
      <div class="members-list">${he(e)}</div>

      <div class="sub-title">API Keys</div>
      <div class="stack">
        <label class="field"><span>OpenAI</span><input id="key-openai" type="password" value="${a(i.apiKeys.openai)}" /></label>
        <label class="field"><span>Anthropic</span><input id="key-anthropic" type="password" value="${a(i.apiKeys.anthropic)}" /></label>
        <label class="field"><span>Google</span><input id="key-google" type="password" value="${a(i.apiKeys.google)}" /></label>
        <label class="field"><span>DeepSeek</span><input id="key-deepseek" type="password" value="${a(i.apiKeys.deepseek)}" /></label>
      </div>

      <div class="sub-title">审查策略</div>
      <div class="stack">
        <label class="field">
          <span>启用审查</span>
          <select id="review-enabled">
            <option value="true" ${t.enabled?"selected":""}>开启</option>
            <option value="false" ${t.enabled?"":"selected"}>关闭</option>
          </select>
        </label>
        <label class="field"><span>Language</span><input id="review-language" type="text" value="${a(t.language)}" /></label>
        <label class="field">
          <span>最低严重等级</span>
          <select id="review-severity">
            <option value="LOW" ${t.minSeverity==="LOW"?"selected":""}>LOW</option>
            <option value="MEDIUM" ${t.minSeverity==="MEDIUM"?"selected":""}>MEDIUM</option>
            <option value="HIGH" ${t.minSeverity==="HIGH"?"selected":""}>HIGH</option>
            <option value="CRITICAL" ${t.minSeverity==="CRITICAL"?"selected":""}>CRITICAL</option>
          </select>
        </label>
        <label class="field"><span>最大发现数</span><input id="review-max-findings" type="number" min="1" max="30" value="${t.maxFindings}" /></label>
        <label class="field">
          <span>证据要求</span>
          <select id="review-evidence">
            <option value="true" ${t.requireEvidence?"selected":""}>要求证据</option>
            <option value="false" ${t.requireEvidence?"":"selected"}>不要求</option>
          </select>
        </label>
        <label class="field"><span>分类（逗号分隔）</span><textarea id="review-categories" rows="2">${a(t.categoriesText)}</textarea></label>
      </div>

      <div class="sub-title">算子链</div>
      <div class="operators-list">${xe(i.operators)}</div>
      <div class="actions compact">
        <button id="add-operator">新增算子</button>
      </div>

      <div class="sub-title">会议控制</div>
      <div class="actions">
        <button id="btn-set-keys">同步 Keys</button>
        <button id="btn-start-session" ${!i.orchestratorRunning||r.status==="running"?"disabled":""}>启动办公室辩论</button>
        <button id="btn-stop-session" ${i.sessionId==="-"?"disabled":""}>停止会话</button>
        <button id="btn-refresh-session" ${i.sessionId==="-"?"disabled":""}>查询会话状态</button>
      </div>

      <label class="field">
        <span>向当前会话发送消息</span>
        <textarea id="chat-message" rows="2" placeholder="给当前办公室追加限制、反馈或新想法"></textarea>
      </label>
      <div class="actions">
        <button id="btn-send-chat" ${i.sessionId==="-"?"disabled":""}>发送消息</button>
      </div>
    </aside>
  `}function p(){const e=q(),t=z[i.workspaceMode];c.innerHTML=`
    <div class="shell">
      <aside class="left-nav panel">
        <h2>模式切换</h2>
        ${E("offices")}
        ${E("creation")}
        ${E("review")}

        <div class="divider"></div>

        <h2>办公室</h2>
        <div class="office-list">${ue()}</div>
        <div class="actions compact">
          <button id="btn-add-office">新增办公室</button>
          <button id="btn-remove-office" class="danger" ${i.offices.length<=1?"disabled":""}>删除当前</button>
        </div>
      </aside>

      <main class="center-workspace panel">
        <header class="top-status">
          <h1>Donkey Studio · 多办公室 AI 协作创作</h1>
          <div class="status-row">
            <span>当前模式：${a(t.title)}</span>
            <span>Orchestrator：${i.orchestratorRunning?"在线":"离线"}</span>
            <span>全局状态：${a(i.runStatus)}</span>
            <span>活跃会话：${a(i.sessionId)}</span>
          </div>
          <div class="actions compact">
            <button id="btn-start-orch" ${i.orchestratorRunning?"disabled":""}>启动 Orchestrator</button>
            <button id="btn-ping" ${i.orchestratorRunning?"":"disabled"}>Ping</button>
            <button id="btn-stop-orch" class="danger" ${i.orchestratorRunning?"":"disabled"}>停止 Orchestrator</button>
          </div>
        </header>
        ${we(e)}
      </main>

      ${$e(e)}
    </div>
  `,Me(e)}function Ie(){c.querySelectorAll("[data-mode]").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.mode;t&&le(t)})})}function ke(){c.querySelectorAll("[data-office-id]").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.officeId;t&&(P(t),p())})})}function Se(e){const t=c.querySelector("#office-name"),r=c.querySelector("#office-objective"),n=c.querySelector("#office-rounds");t==null||t.addEventListener("input",()=>{e.officeName=t.value,p()}),r==null||r.addEventListener("input",()=>{e.objective=r.value}),n==null||n.addEventListener("change",()=>{const o=Number(n.value);Number.isFinite(o)&&(e.maxRounds=Math.max(1,Math.min(12,Math.round(o))),p())})}function Ee(e){const t=r=>{const n=Number(r);if(!(!Number.isInteger(n)||n<0||n>=e.members.length))return e.members[n]};c.querySelectorAll(".member-enabled").forEach(r=>{r.addEventListener("change",()=>{const n=t(r.dataset.memberIndex);n&&(n.enabled=r.checked,p())})}),c.querySelectorAll(".member-id").forEach(r=>{r.addEventListener("input",()=>{const n=t(r.dataset.memberIndex);n&&(n.participantId=r.value)})}),c.querySelectorAll(".member-provider").forEach(r=>{r.addEventListener("change",()=>{const n=t(r.dataset.memberIndex);n&&(n.provider=r.value)})}),c.querySelectorAll(".member-model").forEach(r=>{r.addEventListener("input",()=>{const n=t(r.dataset.memberIndex);n&&(n.modelId=r.value)})}),c.querySelectorAll(".member-role").forEach(r=>{r.addEventListener("change",()=>{const n=t(r.dataset.memberIndex);n&&(n.role=r.value)})})}function _e(){const e=["openai","anthropic","google","deepseek"];for(const t of e){const r=c.querySelector(`#key-${t}`);r==null||r.addEventListener("input",()=>{i.apiKeys[t]=r.value})}}function Oe(){const e=c.querySelector("#review-enabled"),t=c.querySelector("#review-language"),r=c.querySelector("#review-severity"),n=c.querySelector("#review-max-findings"),o=c.querySelector("#review-evidence"),s=c.querySelector("#review-categories");e==null||e.addEventListener("change",()=>{i.review.enabled=e.value==="true"}),t==null||t.addEventListener("input",()=>{i.review.language=t.value}),r==null||r.addEventListener("change",()=>{i.review.minSeverity=r.value}),n==null||n.addEventListener("change",()=>{const l=Number(n.value);Number.isFinite(l)&&(i.review.maxFindings=Math.max(1,Math.min(30,Math.round(l))))}),o==null||o.addEventListener("change",()=>{i.review.requireEvidence=o.value==="true"}),s==null||s.addEventListener("input",()=>{i.review.categoriesText=s.value})}function Le(){const e=r=>{const n=Number(r);if(!(!Number.isInteger(n)||n<0||n>=i.operators.length))return i.operators[n]};c.querySelectorAll(".operator-enabled").forEach(r=>{r.addEventListener("change",()=>{const n=e(r.dataset.operatorIndex);n&&(n.enabled=r.checked)})}),c.querySelectorAll(".operator-name").forEach(r=>{r.addEventListener("input",()=>{const n=e(r.dataset.operatorIndex);n&&(n.name=r.value)})}),c.querySelectorAll(".operator-config").forEach(r=>{r.addEventListener("input",()=>{const n=e(r.dataset.operatorIndex);n&&(n.configText=r.value)})}),c.querySelectorAll(".operator-remove").forEach(r=>{r.addEventListener("click",()=>{const n=Number(r.dataset.operatorIndex);!Number.isInteger(n)||n<0||n>=i.operators.length||(i.operators.splice(n,1),p())})}),c.querySelectorAll(".operator-move-up").forEach(r=>{r.addEventListener("click",()=>{const n=Number(r.dataset.operatorIndex);if(!Number.isInteger(n)||n<=0||n>=i.operators.length)return;const[o]=i.operators.splice(n,1);i.operators.splice(n-1,0,o),p()})}),c.querySelectorAll(".operator-move-down").forEach(r=>{r.addEventListener("click",()=>{const n=Number(r.dataset.operatorIndex);if(!Number.isInteger(n)||n<0||n>=i.operators.length-1)return;const[o]=i.operators.splice(n,1);i.operators.splice(n+1,0,o),p()})});const t=c.querySelector("#add-operator");t==null||t.addEventListener("click",()=>{i.operators.push({name:"new_operator",enabled:!0,configText:"null"}),p()})}function Ne(){const e=c.querySelector("#btn-start-orch"),t=c.querySelector("#btn-ping"),r=c.querySelector("#btn-stop-orch");e==null||e.addEventListener("click",async()=>{await re(),await O(),p()}),t==null||t.addEventListener("click",async()=>{await ne(),p()}),r==null||r.addEventListener("click",async()=>{await ie(),await O(),p()});const n=c.querySelector("#btn-add-office"),o=c.querySelector("#btn-remove-office");n==null||n.addEventListener("click",()=>{V(),p()}),o==null||o.addEventListener("click",()=>{B(i.activeOfficeId),p()})}function Ae(){const e=c.querySelector("#btn-set-keys"),t=c.querySelector("#btn-start-session"),r=c.querySelector("#btn-stop-session"),n=c.querySelector("#btn-refresh-session"),o=c.querySelector("#btn-send-chat"),s=c.querySelector("#chat-message");e==null||e.addEventListener("click",async()=>{await oe(),p()}),t==null||t.addEventListener("click",async()=>{await se(),p()}),r==null||r.addEventListener("click",async()=>{await ce(),p()}),n==null||n.addEventListener("click",async()=>{await de(),p()}),o==null||o.addEventListener("click",async()=>{const l=(s==null?void 0:s.value)??"";await ae(l),s&&(s.value=""),p()})}function Me(e){Ie(),ke(),Se(e),Ee(e),_e(),Oe(),Le(),Ne(),Ae()}function Re(){if(document.getElementById("donkey-studio-style"))return;const e=document.createElement("style");e.id="donkey-studio-style",e.textContent=`
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
  `,document.head.appendChild(e)}async function qe(){Re(),p(),await k("orchestrator-notification",e=>{if(e.payload.method){const t=e.payload.method;if(t==="turn/chunk"||t==="turn/complete"||t==="session/progress"||t==="session/state"||t==="session/participants"){X(e.payload),p();return}}C("unknown",e.payload),p()}),await k("orchestrator-log",e=>{u(`[orchestrator] ${e.payload}`),p()}),await k("orchestrator-exit",()=>{i.orchestratorRunning=!1,i.runStatus!=="error"&&(i.runStatus="stopped"),u("orchestrator process exited"),p()}),await O(),p()}qe();
