(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const f of a.addedNodes)f.tagName==="LINK"&&f.rel==="modulepreload"&&i(f)}).observe(document,{childList:!0,subtree:!0});function s(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(o){if(o.ep)return;o.ep=!0;const a=s(o);fetch(o.href,a)}})();function ke(e,t=!1){return window.__TAURI_INTERNALS__.transformCallback(e,t)}async function D(e,t={},s){return window.__TAURI_INTERNALS__.invoke(e,t,s)}var ae;(function(e){e.WINDOW_RESIZED="tauri://resize",e.WINDOW_MOVED="tauri://move",e.WINDOW_CLOSE_REQUESTED="tauri://close-requested",e.WINDOW_DESTROYED="tauri://destroyed",e.WINDOW_FOCUS="tauri://focus",e.WINDOW_BLUR="tauri://blur",e.WINDOW_SCALE_FACTOR_CHANGED="tauri://scale-change",e.WINDOW_THEME_CHANGED="tauri://theme-changed",e.WINDOW_CREATED="tauri://window-created",e.WEBVIEW_CREATED="tauri://webview-created",e.DRAG_ENTER="tauri://drag-enter",e.DRAG_OVER="tauri://drag-over",e.DRAG_DROP="tauri://drag-drop",e.DRAG_LEAVE="tauri://drag-leave"})(ae||(ae={}));async function $e(e,t){window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(e,t),await D("plugin:event|unlisten",{event:e,eventId:t})}async function J(e,t,s){var i;const o=(i=void 0)!==null&&i!==void 0?i:{kind:"Any"};return D("plugin:event|listen",{event:e,target:o,handler:ke(t)}).then(a=>async()=>$e(e,a))}function Y(e,t,s,i,o){return{participantId:`${e}-${t}`,provider:s,modelId:i,role:o,enabled:!0}}function Se(e,t,s){return{officeId:e,officeName:t,objective:s,maxRounds:3,members:[Y(e,"chatgpt","openai","gpt-4.1","proposer"),Y(e,"gemini","google","gemini-1.5-pro","critic"),Y(e,"claude","anthropic","claude-3-5-sonnet","synthesizer")]}}function X(e){return{officeId:e,status:"idle",sessionId:"-",turnIndex:0,agreementScore:0,totalTokens:0,totalCost:0,lastSummary:"暂无会议结论",lastUpdatedAt:new Date().toISOString()}}const pe=[],Ie=Object.fromEntries(pe.map(e=>[e.officeId,X(e.officeId)])),r={orchestratorRunning:!1,runStatus:"idle",busyAction:"none",workspaceMode:"offices",officeStatusFilter:"all",officeSortBy:"priority",officeSortDirection:"asc",activeOfficeId:"",offices:pe,officeSnapshots:Ie,sessionOfficeMap:{},sessionId:"-",turnIndex:0,agreementScore:0,totalTokens:0,totalCost:0,participants:[],chunks:[],notifications:[],logs:[],humanDraftByOfficeId:{},toasts:[],apiKeys:{openai:"",anthropic:"",google:"",deepseek:""},review:{enabled:!0,language:"zh-CN",minSeverity:"MEDIUM",maxFindings:8,requireEvidence:!0,categoriesText:"correctness, security, performance, maintainability"},operators:[{name:"sanitize_input",enabled:!0,configText:"null"},{name:"context_window",enabled:!0,configText:"null"},{name:"participant_selector",enabled:!0,configText:"null"},{name:"role_response_format",enabled:!0,configText:"null"},{name:"review_instruction",enabled:!0,configText:"null"},{name:"review_findings",enabled:!0,configText:"null"},{name:"output_guard",enabled:!0,configText:"null"}],_subTab:"notifications"};let de=1;function $(e){r.busyAction=e}function _e(e,t){const s=de;return de+=1,r.toasts=[...r.toasts,{id:s,kind:e,message:t}].slice(-4),s}function Oe(e){r.toasts=r.toasts.filter(t=>t.id!==e)}function R(){const e=r.offices.find(s=>s.officeId===r.activeOfficeId);if(e)return e;const t=r.offices[0];if(!t){r.activeOfficeId="";return}return r.activeOfficeId=t.officeId,t}function Ee(e){r.offices.some(t=>t.officeId===e)&&(r.activeOfficeId=e)}function ue(e){const t=r.sessionOfficeMap[e];if(t)return r.offices.find(s=>s.officeId===t)}function ee(e,t){!t||!r.offices.some(s=>s.officeId===t)||(r.sessionOfficeMap[e]=t,N(t,{sessionId:e}))}function N(e,t){const s=r.officeSnapshots[e]??X(e);r.officeSnapshots[e]={...s,...t,officeId:e,lastUpdatedAt:new Date().toISOString()}}function Ne(){const e=new Set(r.offices.map(s=>s.officeId).map(s=>s.replace("office-","")).map(s=>Number(s)).filter(s=>Number.isFinite(s)&&s>0));let t=1;for(;e.has(t);)t+=1;return t}function Re(e){return e>=1&&e<=26?`办公室 ${String.fromCharCode(64+e)}`:`办公室 ${e}`}function Ae(){const e=Ne(),t=`office-${e}`,s=Re(e),i=Se(t,s,"在这里定义该办公室本轮创作目标");r.offices.push(i),r.officeSnapshots[t]=X(t),r.activeOfficeId=t}function S(e){r.logs.unshift(`[${new Date().toISOString()}] ${e}`),r.logs.length>300&&(r.logs=r.logs.slice(0,300))}function me(e,t){r.notifications.unshift({time:new Date().toISOString(),method:e,payload:t}),r.notifications.length>200&&(r.notifications=r.notifications.slice(0,200))}function ze(e){r.chunks.unshift(e),r.chunks.length>400&&(r.chunks=r.chunks.slice(0,400))}function Le(e,t){const s=r.participants.find(i=>i.participantId===e);if(s){Object.assign(s,t);return}r.participants.push({participantId:e,role:t.role??"-",provider:t.provider??"-",modelId:t.modelId??"-",status:t.status??"pending",latencyMs:t.latencyMs})}function ge(e){try{return JSON.stringify(e,null,2)}catch{return String(e)}}function E(e){return e instanceof Error?e.message:String(e)}function be(e){if(e&&typeof e=="object"&&!Array.isArray(e))return e}function x(e){return typeof e=="string"?e:void 0}function w(e){if(typeof e=="number"&&Number.isFinite(e))return e;if(typeof e=="string"&&e.trim().length>0){const t=Number(e);if(Number.isFinite(t))return t}}function l(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function ve(e){if(e==="idle"||e==="starting"||e==="running"||e==="completed"||e==="stopped"||e==="error")return e}function Me(e){if(!Array.isArray(e))return;const t=new Map(r.participants.map(i=>[i.participantId,i])),s=e.map(i=>be(i)).filter(i=>i!==void 0).map(i=>{const o=x(i.participant_id)??"unknown",a=t.get(o);return{participantId:o,role:x(i.role)??(a==null?void 0:a.role)??"-",provider:x(i.provider)??(a==null?void 0:a.provider)??"-",modelId:x(i.model_id)??(a==null?void 0:a.modelId)??"-",status:(a==null?void 0:a.status)??"pending",latencyMs:a==null?void 0:a.latencyMs}});r.participants=s}function C(e,t){const s=ue(e);s&&N(s.officeId,t)}function Ce(e,t){const s=be(t);if(!s)return;const i=x(s.session_id);if(i&&(r.sessionId=i,!r.sessionOfficeMap[i])){const k=R();k&&ee(i,k.officeId)}const o=x(s.status),a=ve(o);a&&(r.runStatus=a);const f=w(s.turn_index)??w(s.current_turn)??w(s.total_turns);f!==void 0&&(r.turnIndex=f);const u=w(s.total_tokens);u!==void 0&&(r.totalTokens=u);const b=w(s.total_cost);b!==void 0&&(r.totalCost=b);const v=w(s.agreement_score)??w(s.final_agreement);v!==void 0&&(r.agreementScore=v),i&&C(i,{status:a,turnIndex:f,agreementScore:v,totalTokens:u,totalCost:b,lastSummary:typeof s.stop_reason=="string"?`会议结束：${s.stop_reason}`:o?`会话状态更新：${o}`:void 0})}function De(e){const t=e.method;if(!t)return;const s=e.params??{};me(t,s);const i=x(s.session_id);if(i&&!r.sessionOfficeMap[i]){const o=R();o&&ee(i,o.officeId)}if(t==="session/state"){const o=x(s.session_id),a=x(s.status),f=x(s.reason),u=ve(a);o&&(r.sessionId=o),u&&(r.runStatus=u),o&&C(o,{status:u,lastSummary:a?f?`状态：${a}（${f}）`:`状态：${a}`:void 0})}if(t==="session/progress"){const o=w(s.turn_index),a=w(s.total_tokens),f=w(s.total_cost),u=w(s.agreement_score);o!==void 0&&(r.turnIndex=o),a!==void 0&&(r.totalTokens=a),f!==void 0&&(r.totalCost=f),u!==void 0&&(r.agreementScore=u),i&&C(i,{status:"running",turnIndex:o,agreementScore:u,totalTokens:a,totalCost:f,lastSummary:u!==void 0?`第 ${o??0} 轮，共识 ${u.toFixed(3)}`:void 0})}if(t==="session/participants"&&Me(s.participants),t==="turn/complete"){const o=x(s.participant_id),a=x(s.status)??"unknown";o&&Le(o,{status:a,latencyMs:w(s.latency_ms)}),i&&o&&C(i,{lastSummary:`${o} 已完成，状态：${a}`})}if(t==="turn/chunk"){const o=x(s.participant_id)??"unknown",a=x(s.session_id)??r.sessionId,f=w(s.turn_index)??r.turnIndex,u=x(s.delta)??"";ze({time:new Date().toISOString(),sessionId:a,turnIndex:f,participantId:o,delta:u}),C(a,{status:"running",turnIndex:f,lastSummary:`${o} 正在输出第 ${f} 轮内容`})}}function Ke(e){return e.split(/[\n,，]+/).map(t=>t.trim()).filter(t=>t.length>0)}function Pe(e,t){const s=e.trim();if(!s)return null;try{return JSON.parse(s)}catch{throw new Error(`算子 ${t} 的 config 不是合法 JSON`)}}async function he(){var e;try{const t=await D("orchestrator_status");r.orchestratorRunning=!!((e=t.data)!=null&&e.running),!r.orchestratorRunning&&r.runStatus==="running"&&(r.runStatus="stopped")}catch(t){r.orchestratorRunning=!1,S(`orchestrator_status failed: ${E(t)}`)}}async function Te(){r.runStatus="starting";try{const e=await D("start_orchestrator");return r.orchestratorRunning=e.success,r.runStatus=e.success?"running":"error",S(`start_orchestrator: ${ge(e.data)}`),e.success?{ok:!0,message:"引擎启动成功"}:{ok:!1,message:`引擎启动失败${e.error?`：${e.error}`:""}`}}catch(e){r.orchestratorRunning=!1,r.runStatus="error";const t=`引擎启动失败：${E(e)}`;return S(`start_orchestrator failed: ${E(e)}`),{ok:!1,message:t}}}async function G(e,t){if(!r.orchestratorRunning)throw new Error("orchestrator not running");const s=await D("send_rpc",{method:e,params:t??null});return Ce(e,s),S(`rpc ${e} -> ${ge(s)}`),s}async function je(){try{return await G("config/setKeys",{openai:r.apiKeys.openai,anthropic:r.apiKeys.anthropic,google:r.apiKeys.google,deepseek:r.apiKeys.deepseek}),{ok:!0,message:"API Keys 已同步"}}catch(e){const t=`同步 Keys 失败：${E(e)}`;return S(`config/setKeys failed: ${E(e)}`),{ok:!1,message:t}}}async function ce(){const e=R();if(!e)return{ok:!1,message:"请先新建办公室"};try{const t=Ke(r.review.categoriesText),s=e.objective.trim(),i=r.operators.filter(b=>b.name.trim().length>0).map(b=>({name:b.name.trim(),enabled:b.enabled,config:Pe(b.configText,b.name.trim())})),o=e.members.filter(b=>b.enabled).map(b=>({participant_id:b.participantId,role:b.role,provider:b.provider,model_id:b.modelId}));if(!s)throw new Error("请先填写办公室目标");if(!Number.isFinite(e.maxRounds)||e.maxRounds<1||e.maxRounds>20)throw new Error("轮次需在 1 到 20 之间");if(o.some(b=>!b.model_id.trim()))throw new Error("启用成员必须填写模型 ID");if(o.length<2)throw new Error("至少启用两个 AI 员工，才能开始辩论");if(t.length===0)throw new Error("review categories 不能为空");if(i.filter(b=>b.enabled).length===0)throw new Error("operators 至少需要启用一个");N(e.officeId,{status:"starting",turnIndex:0,lastSummary:"办公室会议启动中..."});const f=await G("session/start",{task:s,participants:o,policy:{stop:{max_rounds:e.maxRounds}},review:{enabled:r.review.enabled,language:r.review.language,min_severity:r.review.minSeverity,max_findings:r.review.maxFindings,require_evidence:r.review.requireEvidence,categories:t},operators:{chain:i}}),u=typeof f.session_id=="string"?f.session_id:"";return u?(ee(u,e.officeId),N(e.officeId,{sessionId:u,status:"running"}),r.sessionId=u,{ok:!0,message:`办公室已启动（${u}）`,sessionId:u}):(N(e.officeId,{status:"running",lastSummary:"已发起 session/start，等待会话 ID 回传"}),{ok:!0,message:"已发起办公室讨论"})}catch(t){const s=E(t);return S(`startOfficeDebate failed: ${s}`),N(e.officeId,{status:"error",lastSummary:`启动失败：${s}`}),r.runStatus="error",{ok:!1,message:`启动失败：${s}`}}}async function qe(e){const t=e.trim();if(!t)return{ok:!1,message:"请输入消息后再发送"};try{const s={message:t};return r.sessionId!=="-"&&(s.session_id=r.sessionId),await G("chat/send",s),{ok:!0,message:"消息已发送"}}catch(s){const i=E(s);return S(`chat/send failed: ${i}`),{ok:!1,message:`发送失败：${i}`}}}async function We(){if(r.sessionId==="-")return S("chat/stop skipped: no active session"),{ok:!1,message:"当前没有可停止的会话"};const e=r.sessionId;try{await G("chat/stop",{session_id:e});const t=ue(e);return t&&N(t.officeId,{status:"stopped",lastSummary:"会话已停止"}),{ok:!0,message:"已发送停止指令"}}catch(t){const s=E(t);return S(`chat/stop failed: ${s}`),{ok:!1,message:`停止失败：${s}`}}}const g=document.querySelector("#app");if(!g)throw new Error("#app not found");const H=["openai","anthropic","google","deepseek"],U={openai:"OpenAI",anthropic:"Anthropic",google:"Google",deepseek:"DeepSeek"},te=[{id:"quick",title:"方案 A · 快速对齐",summary:"快速澄清目标并产出最小可执行计划，适合先跑通。",rounds:2,roles:["proposer","critic","synthesizer"]},{id:"balanced",title:"方案 B · 平衡推进",summary:"提案 + 质疑 + 调研 + 整合，给出 2-3 版路线供你敲定。",rounds:3,roles:["proposer","critic","researcher","synthesizer"]},{id:"research",title:"方案 C · 研究优先",summary:"引入验证视角，降低事实风险与返工概率。",rounds:4,roles:["proposer","critic","researcher","verifier","synthesizer"]},{id:"review",title:"方案 D · 决策闭环",summary:"在多方案基础上加入裁决角色，强制收敛到单一结论。",rounds:4,roles:["proposer","critic","researcher","synthesizer","arbiter"]},{id:"strict",title:"方案 E · 深度审查",summary:"全角色办公室，强调证据、验证与最终裁决。",rounds:5,roles:["proposer","critic","researcher","verifier","synthesizer","arbiter"]}],d={open:!1,goal:"",officeName:"",planCount:3,selectedPlanId:"balanced",maxRounds:3,providerStrategy:"recommended",singleProvider:"openai",syncState:"idle",syncMessage:""};function L(e){return r.officeSnapshots[e]??{officeId:e,status:"idle",sessionId:"-",turnIndex:0,agreementScore:0,totalTokens:0,totalCost:0,lastSummary:"暂无会议结论",lastUpdatedAt:new Date().toISOString()}}function se(e){return{idle:"空闲",starting:"启动中",running:"运行中",completed:"已完成",stopped:"已停止",error:"异常"}[e]??e}function Fe(e){return{proposer:"提方案，推进第一版。",critic:"找风险，提反例和改进。",synthesizer:"整合观点，形成折中方案。",arbiter:"做裁决，给最终结论。",researcher:"补事实和证据。",verifier:"做验证，控一致性。"}[e.role]??"参与协作"}function Be(e){const t=Array.from(new Set(e.members.filter(s=>s.enabled).map(s=>s.provider)));return t.length>0?t.join(" / "):"未启用模型"}function Ue(e){const t=e.members.find(s=>s.enabled&&(s.role==="arbiter"||s.role==="synthesizer"));return t?`${t.participantId}`:"未设置"}function y(e,t="info"){const s=_e(t,e);m(),window.setTimeout(()=>{Oe(s),m()},3500)}function z(e){return Number.isFinite(e)?Math.max(1,Math.min(20,Math.trunc(e))):3}function Ve(e){return["proposer","critic","synthesizer","arbiter","researcher","verifier"].map(s=>`<option value="${s}" ${s===e?"selected":""}>${l(s)}</option>`).join("")}function Ge(e){return H.map(t=>`<option value="${t}" ${t===e?"selected":""}>${l(t)}</option>`).join("")}function V(e){return r.apiKeys[e].trim().length>0}function re(){return H.filter(e=>V(e))}function oe(){return re().length>0}function ye(){const e=r.offices.length+1;return e>=1&&e<=26?`办公室 ${String.fromCharCode(64+e)}`:`办公室 ${e}`}function ne(){const e=Math.max(2,Math.min(5,d.planCount));return te.slice(0,e)}function xe(){const e=ne();return e.find(s=>s.id===d.selectedPlanId)??e[0]??te[0]}function He(e){return{openai:"gpt-4.1",anthropic:"claude-3-5-sonnet",google:"gemini-1.5-pro",deepseek:"deepseek-chat"}[e]}function Je(e,t,s){const i={proposer:["openai","deepseek","anthropic","google"],critic:["anthropic","openai","google","deepseek"],synthesizer:["openai","anthropic","google","deepseek"],arbiter:["anthropic","openai","google","deepseek"],researcher:["google","deepseek","openai","anthropic"],verifier:["google","openai","anthropic","deepseek"]};for(const o of i[e])if(t.includes(o))return o;return t.length>0?t[0]:s}function we(e){const t=xe(),s=re(),i=d.singleProvider;return t.roles.map((o,a)=>{const f=d.providerStrategy==="single-provider"?d.singleProvider:Je(o,s,i);return{participantId:`${e}-${o}-${a+1}`,provider:f,modelId:He(f),role:o,enabled:!0}})}function Ye(){return we("preview").map(t=>`
        <div class="flow-preview-row">
          <span class="flow-preview-role">${l(t.role)}</span>
          <span class="flow-preview-provider">${l(U[t.provider])}</span>
          <span class="flow-preview-model">${l(t.modelId)}</span>
        </div>
      `).join("")}function Qe(){const t=re()[0]??"openai";d.open=!0,d.goal="",d.officeName=ye(),d.planCount=3,d.selectedPlanId="balanced",d.maxRounds=3,d.providerStrategy="recommended",d.singleProvider=t,d.syncState="idle",d.syncMessage=""}function Q(){d.open=!1,d.syncState="idle",d.syncMessage=""}function Ze(){const e=ne();if(!e.some(t=>t.id===d.selectedPlanId)){const t=e[0];t&&(d.selectedPlanId=t.id,d.maxRounds=t.rounds)}}function le(e){const t=new Set(e.members.filter(s=>s.enabled).map(s=>s.provider));return Array.from(t).filter(s=>!V(s))}async function B(){if(!oe())return{ok:!1,message:"请至少配置一个全局 API Key"};if(!r.orchestratorRunning){const e=await Te();if(await he(),!e.ok||!r.orchestratorRunning)return{ok:!1,message:e.message}}return je()}function Xe(){if(!d.open)return"";const e=ne(),t=xe(),s=oe(),i=d.providerStrategy==="single-provider"&&!V(d.singleProvider),o=d.goal.trim().length>0&&s&&!i&&d.syncState!=="syncing",a=d.syncState==="syncing"?"同步中...":"保存并同步 Keys",f=d.syncState==="success"?"flow-sync-success":d.syncState==="error"?"flow-sync-error":"",u=H.map(v=>{const k=V(v),_=k?"":"（未配置 Key）",A=k?"":"disabled";return`<option value="${v}" ${v===d.singleProvider?"selected":""} ${A}>${l(U[v])}${_}</option>`}).join(""),b=e.map(v=>{const k=v.id===t.id,_=v.roles.join(" · ");return`
        <button class="flow-plan-card ${k?"active":""}" data-flow-plan="${v.id}">
          <div class="flow-plan-title">${l(v.title)}</div>
          <div class="flow-plan-summary">${l(v.summary)}</div>
          <div class="flow-plan-meta">轮次 ${v.rounds} · 角色 ${l(_)}</div>
        </button>
      `}).join("");return`
    <div class="flow-modal-mask">
      <div class="flow-modal">
        <div class="flow-modal-head">
          <div>
            <div class="flow-modal-title">开始 Workerflow</div>
            <div class="flow-modal-sub">先明确目标，再从 2-5 套候选 workflow 中选择并创建办公室。</div>
          </div>
          <button id="btn-flow-cancel">取消</button>
        </div>

        <div class="flow-modal-body">
          <section class="flow-section">
            <div class="flow-section-title">1) 你想让 AI 完成什么</div>
            <textarea id="flow-goal" rows="3" placeholder="例如：先给出 3 套可执行方案，再由我选择继续实现">${l(d.goal)}</textarea>
          </section>

          <section class="flow-section">
            <div class="flow-section-title">2) 选择候选 workflow（2-5 套）</div>
            <label class="field">
              <span>候选方案数量</span>
              <select id="flow-plan-count">
                <option value="2" ${d.planCount===2?"selected":""}>2</option>
                <option value="3" ${d.planCount===3?"selected":""}>3</option>
                <option value="4" ${d.planCount===4?"selected":""}>4</option>
                <option value="5" ${d.planCount===5?"selected":""}>5</option>
              </select>
            </label>
            <div class="flow-plan-grid">${b}</div>
          </section>

          <section class="flow-section">
            <div class="flow-section-title">3) 构建办公室</div>
            <label class="field">
              <span>办公室名称</span>
              <input id="flow-office-name" value="${l(d.officeName)}" placeholder="比如：方案评审办公室" />
            </label>
            <label class="field">
              <span>最大轮次（1~20）</span>
              <input id="flow-max-rounds" type="number" min="1" max="20" value="${d.maxRounds}" />
            </label>
            <label class="field">
              <span>模型分配策略</span>
              <select id="flow-provider-strategy">
                <option value="recommended" ${d.providerStrategy==="recommended"?"selected":""}>推荐分配（按角色自动分工）</option>
                <option value="single-provider" ${d.providerStrategy==="single-provider"?"selected":""}>单一厂商（全部角色同厂商）</option>
              </select>
            </label>

            ${d.providerStrategy==="single-provider"?`
                <label class="field">
                  <span>单一厂商</span>
                  <select id="flow-single-provider">${u}</select>
                </label>
              `:""}

            <div class="flow-preview-box">
              <div class="flow-preview-title">将要创建的成员</div>
              ${Ye()}
            </div>
          </section>

          ${s?"":`
              <section class="flow-section flow-alert">
                <div class="flow-section-title">先配置全局 API Key</div>
                <div class="muted">至少配置一个厂商 Key 后，才能创建并启动办公室。</div>
                <label class="field"><span>OpenAI Key</span><input id="flow-key-openai" type="password" value="${l(r.apiKeys.openai)}" /></label>
                <label class="field"><span>Anthropic Key</span><input id="flow-key-anthropic" type="password" value="${l(r.apiKeys.anthropic)}" /></label>
                <label class="field"><span>Google Key</span><input id="flow-key-google" type="password" value="${l(r.apiKeys.google)}" /></label>
                <label class="field"><span>DeepSeek Key</span><input id="flow-key-deepseek" type="password" value="${l(r.apiKeys.deepseek)}" /></label>
                <button id="btn-flow-sync-keys" ${d.syncState==="syncing"?"disabled":""}>${a}</button>
                ${d.syncMessage?`<div class="flow-sync-msg ${f}">${l(d.syncMessage)}</div>`:""}
              </section>
            `}
        </div>

        <div class="flow-modal-foot">
          <button id="btn-flow-create" ${o?"":"disabled"}>创建办公室并进入讨论</button>
        </div>
      </div>
    </div>
  `}function et(){return r.toasts.length===0?"":`
    <div class="toast-stack">
      ${r.toasts.map(e=>`
            <div class="toast toast-${e.kind}">${l(e.message)}</div>
          `).join("")}
    </div>
  `}function tt(){return`${r.offices.map(s=>{const i=L(s.officeId);return`
        <button class="office-card ${s.officeId===r.activeOfficeId?"active":""}" data-office-id="${s.officeId}">
          <div class="office-title">${l(s.officeName)}</div>
          <div class="office-line">任务：${l(s.objective||"未设置")}</div>
          <div class="office-line">裁决人：${l(Ue(s))}</div>
          <div class="office-line">模型：${l(Be(s))}</div>
          <div class="office-meta">${se(i.status)} · 第 ${i.turnIndex} 轮</div>
        </button>
      `}).join("")}<button class="office-card add" id="btn-add-office">新建办公室</button>`}function Z(e,t=2){return typeof e!="number"||Number.isNaN(e)?"-":e.toFixed(t)}function fe(e){return typeof e!="number"||Number.isNaN(e)?"0":String(Math.trunc(e))}function st(e){return typeof e!="number"||Number.isNaN(e)?0:e>1?Math.max(0,Math.min(1,e/100)):Math.max(0,Math.min(1,e))}function rt(){const e=r.offices.map(f=>{const u=L(f.officeId),b=st(u.agreementScore);return`
        <tr>
          <td>${l(f.officeName)}</td>
          <td><span class="status-badge status-${u.status}">${se(u.status)}</span></td>
          <td>${l(u.sessionId)}</td>
          <td>${u.turnIndex}</td>
          <td>${Z(b*100,1)}%</td>
          <td>${fe(u.totalTokens)}</td>
          <td>$${Z(u.totalCost,4)}</td>
          <td class="summary-cell">${l(u.lastSummary)}</td>
        </tr>
      `}).join(""),t=Object.values(r.officeSnapshots).reduce((f,u)=>f+(u.totalTokens||0),0),s=Object.values(r.officeSnapshots).reduce((f,u)=>f+(u.totalCost||0),0),i=Object.values(r.officeSnapshots).filter(f=>f.status==="running").length,o=r.participants.length>0?r.participants.map(f=>`
          <tr>
            <td>${l(f.participantId)}</td>
            <td>${l(f.role)}</td>
            <td>${l(f.provider)} / ${l(f.modelId)}</td>
            <td><span class="status-badge status-${f.status==="done"?"completed":f.status==="pending"?"idle":"running"}">${l(f.status)}</span></td>
            <td>${f.latencyMs!==void 0?`${f.latencyMs}ms`:"-"}</td>
          </tr>
        `).join(""):'<tr><td colspan="5" class="muted">暂无参与者数据</td></tr>',a=r.logs.slice(0,50).map(f=>`<div class="log-line">${l(f)}</div>`).join("");return`
    <div class="dashboard-view">
      <h2 class="view-title">Dashboard</h2>
      <p class="view-desc">全局概览：所有办公室状态、参与者、系统日志</p>

      <div class="dash-summary-grid">
        <div class="dash-card">
          <div class="dash-card-label">办公室总数</div>
          <div class="dash-card-value">${r.offices.length}</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-label">运行中</div>
          <div class="dash-card-value">${i}</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-label">总 Tokens</div>
          <div class="dash-card-value">${fe(t)}</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-label">总花费</div>
          <div class="dash-card-value">$${Z(s,4)}</div>
        </div>
      </div>

      <div class="dash-section">
        <h3>办公室状态</h3>
        <div class="dash-table-wrap">
          <table class="dash-table">
            <thead>
              <tr>
                <th>办公室</th>
                <th>状态</th>
                <th>Session</th>
                <th>轮次</th>
                <th>共识</th>
                <th>Tokens</th>
                <th>花费</th>
                <th>最新摘要</th>
              </tr>
            </thead>
            <tbody>${e}</tbody>
          </table>
        </div>
      </div>

      <div class="dash-section">
        <h3>参与者</h3>
        <div class="dash-table-wrap">
          <table class="dash-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>角色</th>
                <th>Provider / Model</th>
                <th>状态</th>
                <th>延迟</th>
              </tr>
            </thead>
            <tbody>${o}</tbody>
          </table>
        </div>
      </div>

      <div class="dash-section">
        <h3>系统日志 <span class="muted">(最近 50 条)</span></h3>
        <div class="log-box">${a||'<div class="muted">暂无日志</div>'}</div>
      </div>
    </div>
  `}function ot(){const e=r.notifications.length>0?r.notifications.slice(0,100).map(s=>`
          <div class="sub-event-item">
            <div class="sub-event-head">
              <span class="sub-event-method">${l(s.method)}</span>
              <span class="sub-event-time">${l(s.time)}</span>
            </div>
            <pre class="sub-event-body">${l(typeof s.payload=="string"?s.payload:JSON.stringify(s.payload,null,2))}</pre>
          </div>
        `).join(""):'<div class="muted">暂无事件通知。启动办公室讨论后，这里会实时显示引擎推送的事件流。</div>',t=r.chunks.length>0?r.chunks.slice(0,80).map(s=>`
          <div class="sub-chunk-item">
            <div class="sub-chunk-head">
              <span class="sub-chunk-participant">${l(s.participantId)}</span>
              <span class="sub-chunk-meta">session: ${l(s.sessionId)} · 第${s.turnIndex}轮 · ${l(s.time)}</span>
            </div>
            <div class="sub-chunk-body">${l(s.delta)}</div>
          </div>
        `).join(""):'<div class="muted">暂无消息流。</div>';return`
    <div class="subscription-view">
      <h2 class="view-title">订阅</h2>
      <p class="view-desc">实时事件流：引擎通知、消息 chunk、会话状态变更</p>

      <div class="sub-tabs">
        <button class="sub-tab ${r._subTab!=="chunks"?"active":""}" data-sub-tab="notifications">事件通知 (${r.notifications.length})</button>
        <button class="sub-tab ${r._subTab==="chunks"?"active":""}" data-sub-tab="chunks">消息流 (${r.chunks.length})</button>
      </div>

      <div class="sub-content">
        ${r._subTab==="chunks"?t:e}
      </div>
    </div>
  `}function nt(e){return{offices:"蜂群办公室",dashboard:"Dashboard",subscription:"订阅",creation:"创作",review:"审查"}[e]??e}const it=["offices","dashboard","subscription"];function at(){switch(r.workspaceMode){case"dashboard":return rt();case"subscription":return ot();case"offices":default:return`<div class="grid">${tt()}</div>`}}function dt(){const e=R();if(!e)return`
      <div class="right-title">暂无办公室</div>
      <div class="right-sub">请先在中间区域点击“新建办公室”，再开始配置与讨论。</div>
      <div class="discussion-box">
        <div class="muted">当前还没有可编辑的办公室。创建后将显示目标、成员、会话和人类参与输入。</div>
      </div>
    `;const t=L(e.officeId),s=r.humanDraftByOfficeId[e.officeId]??"",i=r.busyAction,o=t.sessionId!=="-",a=i!=="none",f=t.status==="running"||t.status==="starting",u=e.objective.trim().length>0,b=!a&&!f&&u,v=!a&&o&&f,k=!a&&o,_=i==="syncing-keys"?"同步中...":"同步 Keys",A=i==="starting-office"?"启动中...":"启动该办公室讨论",K=i==="stopping-office"?"停止中...":"停止",P=i==="sending-human"?"发送中...":"发送到该办公室",T=e.members.map((h,I)=>`
        <div class="member-editor-row" data-member-row="${I}">
          <label class="check">
            <input type="checkbox" data-member-enabled="${I}" ${h.enabled?"checked":""} />
            启用
          </label>
          <input data-member-id="${I}" value="${l(h.participantId)}" placeholder="participant_id" />
          <select data-member-role="${I}">${Ve(h.role)}</select>
          <select data-member-provider="${I}">${Ge(h.provider)}</select>
          <input data-member-model="${I}" value="${l(h.modelId)}" placeholder="model_id" />
        </div>
      `).join(""),M=t.sessionId!=="-"?r.chunks.filter(h=>h.sessionId===t.sessionId).slice(0,80).reverse():[],j=M.length===0?'<div class="muted">启动办公室后，这里会显示讨论消息流，你也可以作为人类参与发言。</div>':M.map(h=>`
              <div class="message-item">
                <div class="message-head">${l(h.participantId)} · 第${h.turnIndex}轮</div>
                <div class="message-body">${l(h.delta)}</div>
              </div>
            `).join(""),q=e.members.map(h=>`
        <div class="member-row">
          <b>${l(h.participantId)}</b>
          <span>${l(h.role)} · ${l(h.modelId)}</span>
          <p>${l(Fe(h))}</p>
        </div>
      `).join("");return`
    <div class="right-title">${l(e.officeName)}</div>
    <div class="right-sub">状态：${se(t.status)}｜session：${l(t.sessionId)}</div>

    <label class="field">
      <span>办公室名称</span>
      <input id="office-name" value="${l(e.officeName)}" placeholder="比如：前端评审组" />
    </label>
    <label class="field">
      <span>本轮目标</span>
      <textarea id="office-objective" rows="3" placeholder="明确本轮要达成的目标">${l(e.objective)}</textarea>
    </label>
    <label class="field">
      <span>最大轮次（1~20）</span>
      <input id="office-max-rounds" type="number" min="1" max="20" value="${e.maxRounds}" />
    </label>

    <div class="member-editor">
      <div class="member-editor-title">成员配置（启用成员会参与讨论）</div>
      ${T}
    </div>

    <div id="discussion-stream" class="discussion-box">${j}</div>

    <label class="field">
      <span>人类参与输入</span>
      <textarea id="human-input" rows="3" placeholder="给这个办公室补充方向、约束或反馈">${l(s)}</textarea>
    </label>

    <div class="actions">
      <button id="btn-send-human" ${k?"":"disabled"}>${P}</button>
      <button id="btn-start-office" ${b?"":"disabled"}>${A}</button>
      <button id="btn-stop-office" ${v?"":"disabled"}>${K}</button>
    </div>

    <div class="right-divider"></div>

    <label class="field"><span>OpenAI Key</span><input id="key-openai" type="password" value="${l(r.apiKeys.openai)}" /></label>
    <label class="field"><span>Anthropic Key</span><input id="key-anthropic" type="password" value="${l(r.apiKeys.anthropic)}" /></label>
    <label class="field"><span>Google Key</span><input id="key-google" type="password" value="${l(r.apiKeys.google)}" /></label>
    <label class="field"><span>DeepSeek Key</span><input id="key-deepseek" type="password" value="${l(r.apiKeys.deepseek)}" /></label>
    <button id="btn-set-keys" ${a?"disabled":""}>${_}</button>

    <div class="right-divider"></div>
    <div class="member-list">${q}</div>
  `}function ct(){if(r.workspaceMode!=="offices")return;const e=R();if(!e)return;const t=L(e.officeId),s=g.querySelector("#discussion-stream");if(!s)return;const i=t.sessionId!=="-"?r.chunks.filter(o=>o.sessionId===t.sessionId).slice(0,80).reverse():[];s.innerHTML=i.length===0?'<div class="muted">启动办公室后，这里会显示讨论消息流，你也可以作为人类参与发言。</div>':i.map(o=>`
              <div class="message-item">
                <div class="message-head">${l(o.participantId)} · 第${o.turnIndex}轮</div>
                <div class="message-body">${l(o.delta)}</div>
              </div>
            `).join("")}function m(){const e=R(),t=it.map(i=>`<button class="nav-item ${r.workspaceMode===i?"active":""}" data-nav-mode="${i}">${nt(i)}</button>`).join(""),s=r.workspaceMode==="offices";g.innerHTML=`
    <div class="frame">
      <header class="topbar">
        <div class="brand">Donkey<br/>Studio</div>
        <div class="engine-status ${r.orchestratorRunning?"online":"offline"}">
          引擎：${r.orchestratorRunning?"在线":"离线"}
        </div>
      </header>

      <div class="body ${s?"":"no-right-panel"}">
        <aside class="left-nav">
          ${t}
          <div class="nav-spacer"></div>
          <div class="profile">当前用户</div>
        </aside>

        <main class="center">
          ${at()}
        </main>

        ${s?`<aside class="right-panel">${dt()}</aside>`:""}
      </div>
    </div>
    ${Xe()}
    ${et()}
  `,lt(e)}function lt(e){var u,b,v,k,_,A,K,P,T,M,j,q,h,I,ie;g.querySelectorAll("[data-nav-mode]").forEach(n=>{n.addEventListener("click",()=>{const c=n.dataset.navMode;c&&c!==r.workspaceMode&&(r.workspaceMode=c,m())})}),g.querySelectorAll("[data-sub-tab]").forEach(n=>{n.addEventListener("click",()=>{const c=n.dataset.subTab;r._subTab=c==="chunks"?"chunks":"notifications",m()})}),g.querySelectorAll("[data-office-id]").forEach(n=>{n.addEventListener("click",()=>{const c=n.dataset.officeId;if(!c)return;Ee(c);const p=L(c);r.sessionId=p.sessionId,m()})}),(u=g.querySelector("#btn-add-office"))==null||u.addEventListener("click",()=>{Qe(),m()}),(b=g.querySelector("#btn-flow-cancel"))==null||b.addEventListener("click",()=>{Q(),m()}),(v=g.querySelector("#flow-goal"))==null||v.addEventListener("input",n=>{const c=n.currentTarget;d.goal=c.value}),(k=g.querySelector("#flow-office-name"))==null||k.addEventListener("input",n=>{const c=n.currentTarget;d.officeName=c.value}),(_=g.querySelector("#flow-max-rounds"))==null||_.addEventListener("input",n=>{const c=n.currentTarget;d.maxRounds=z(Number(c.value))}),(A=g.querySelector("#flow-max-rounds"))==null||A.addEventListener("blur",()=>{d.maxRounds=z(d.maxRounds),m()}),(K=g.querySelector("#flow-plan-count"))==null||K.addEventListener("change",n=>{const c=n.currentTarget;d.planCount=Math.max(2,Math.min(5,Number(c.value)||3)),Ze(),m()}),g.querySelectorAll("[data-flow-plan]").forEach(n=>{n.addEventListener("click",()=>{const c=n.dataset.flowPlan,p=te.find(O=>O.id===c);p&&(d.selectedPlanId=p.id,d.maxRounds=z(p.rounds),m())})}),(P=g.querySelector("#flow-provider-strategy"))==null||P.addEventListener("change",n=>{const p=n.currentTarget.value==="single-provider"?"single-provider":"recommended";d.providerStrategy=p,m()}),(T=g.querySelector("#flow-single-provider"))==null||T.addEventListener("change",n=>{const p=n.currentTarget.value;H.includes(p)&&(d.singleProvider=p,m())});const t=["openai","anthropic","google","deepseek"];for(const n of t){const c=g.querySelector(`#flow-key-${n}`);c==null||c.addEventListener("input",()=>{r.apiKeys[n]=c.value})}(M=g.querySelector("#btn-flow-sync-keys"))==null||M.addEventListener("click",async()=>{d.syncState="syncing",d.syncMessage="正在同步 Key 到引擎...",m();const n=await B();d.syncState=n.ok?"success":"error",d.syncMessage=n.message,n.ok?y("全局 Keys 已同步","success"):y(n.message,"error"),m()}),(j=g.querySelector("#btn-flow-create"))==null||j.addEventListener("click",async()=>{const n=d.goal.trim(),c=d.officeName.trim();if(!n){y("请先输入本次 Workerflow 目标","error");return}if(!oe()){d.syncState="error",d.syncMessage="请先配置并同步至少一个 API Key",m();return}Ae();const p=R();if(!p){y("创建办公室失败，请重试","error");return}p.officeName=c||ye(),p.objective=n,p.maxRounds=z(d.maxRounds),p.members=we(p.officeId),r.workspaceMode="offices";const O=le(p);if(O.length>0){const W=O.map(F=>U[F]).join("、");Q(),y(`办公室已创建，但缺少 ${W} 的 Key，请先补充后再启动`,"error"),m();return}$("syncing-keys"),m();try{const W=await B();if(!W.ok){y(W.message,"error");return}Q(),$("starting-office"),m();const F=await ce();F.ok?y("办公室已创建并自动开始讨论","success"):y(`办公室已创建，但自动启动失败：${F.message}`,"error")}finally{$("none"),m()}});const s=g.querySelector("#office-name");s==null||s.addEventListener("input",()=>{e&&(e.officeName=s.value,m())});const i=g.querySelector("#office-objective");i==null||i.addEventListener("input",()=>{e&&(e.objective=i.value,m())});const o=g.querySelector("#office-max-rounds");o==null||o.addEventListener("input",()=>{e&&(e.maxRounds=z(Number(o.value)))}),o==null||o.addEventListener("blur",()=>{e&&(e.maxRounds=z(Number(o.value)),m())}),g.querySelectorAll("[data-member-enabled]").forEach(n=>{n.addEventListener("change",()=>{const c=Number(n.dataset.memberEnabled);if(!e)return;const p=e.members[c];p&&(p.enabled=n.checked,m())})}),g.querySelectorAll("[data-member-id]").forEach(n=>{n.addEventListener("input",()=>{const c=Number(n.dataset.memberId);if(!e)return;const p=e.members[c];p&&(p.participantId=n.value)}),n.addEventListener("blur",()=>{const c=Number(n.dataset.memberId);if(!e)return;const p=e.members[c];p&&(p.participantId=p.participantId.trim()||`${e.officeId}-member-${c+1}`,m())})}),g.querySelectorAll("[data-member-role]").forEach(n=>{n.addEventListener("change",()=>{const c=Number(n.dataset.memberRole);if(!e)return;const p=e.members[c];p&&(p.role=n.value,m())})}),g.querySelectorAll("[data-member-provider]").forEach(n=>{n.addEventListener("change",()=>{const c=Number(n.dataset.memberProvider);if(!e)return;const p=e.members[c];p&&(p.provider=n.value,m())})}),g.querySelectorAll("[data-member-model]").forEach(n=>{n.addEventListener("input",()=>{const c=Number(n.dataset.memberModel);if(!e)return;const p=e.members[c];p&&(p.modelId=n.value)}),n.addEventListener("blur",()=>{const c=Number(n.dataset.memberModel);if(!e)return;const p=e.members[c];p&&(p.modelId=p.modelId.trim(),m())})});const a=["openai","anthropic","google","deepseek"];for(const n of a){const c=g.querySelector(`#key-${n}`);c==null||c.addEventListener("input",()=>{r.apiKeys[n]=c.value})}const f=g.querySelector("#human-input");f==null||f.addEventListener("input",()=>{e&&(r.humanDraftByOfficeId[e.officeId]=f.value)}),(q=g.querySelector("#btn-set-keys"))==null||q.addEventListener("click",async()=>{$("syncing-keys"),m();try{const n=await B();y(n.message,n.ok?"success":"error")}finally{$("none"),m()}}),(h=g.querySelector("#btn-start-office"))==null||h.addEventListener("click",async()=>{if(!e){y("请先新建办公室","error");return}if(!e.objective.trim()){y("请先填写办公室目标","error");return}const n=le(e);if(n.length>0){const c=n.map(p=>U[p]).join("、");y(`缺少 ${c} 的 API Key，请先在右侧同步 Keys`,"error");return}$("starting-office"),m();try{const c=await B();if(!c.ok){y(c.message,"error");return}const p=await ce();y(p.message,p.ok?"success":"error")}finally{$("none"),m()}}),(I=g.querySelector("#btn-stop-office"))==null||I.addEventListener("click",async()=>{$("stopping-office"),m();try{const n=await We();y(n.message,n.ok?"success":"error")}finally{$("none"),m()}}),(ie=g.querySelector("#btn-send-human"))==null||ie.addEventListener("click",async()=>{if(!e){y("请先新建办公室","error");return}const n=g.querySelector("#human-input"),c=(n==null?void 0:n.value)??"";if(!c.trim())return;const p=L(e.officeId);r.sessionId=p.sessionId,$("sending-human"),m();try{const O=await qe(c);y(O.message,O.ok?"success":"error"),O.ok&&(r.humanDraftByOfficeId[e.officeId]="",n&&(n.value=""))}finally{$("none"),m()}})}function ft(){if(document.getElementById("donkey-studio-style"))return;const e=document.createElement("style");e.id="donkey-studio-style",e.textContent=`
    :root {
      color-scheme: light;
      --bg: #f3f5f8;
      --panel: #ffffff;
      --line: #d6deea;
      --text: #1f2937;
      --muted: #6f7d92;
      --card: #f7f9fc;
      --accent: #2f6fed;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      background: radial-gradient(circle at 20% -20%, #e8eef9 0%, var(--bg) 42%, #eff2f7 100%);
      color: var(--text);
      font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    }
    #app { padding: 12px; }
    .frame {
      border: 1px solid var(--line);
      border-radius: 10px;
      min-height: calc(100vh - 24px);
      background: var(--panel);
      overflow: hidden;
    }
    .topbar {
      height: 72px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px;
      background: #f8fafd;
    }
    .brand {
      font-size: 20px;
      font-weight: 700;
      line-height: 1.05;
    }
    .engine-status {
      font-size: 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 6px 10px;
      color: var(--muted);
      background: #f4f7fd;
    }
    .engine-status.online {
      color: #235ac7;
      border-color: #8eaee9;
    }
    .engine-status.offline {
      color: #6b7280;
      border-color: #c0c8d6;
    }
    .body {
      display: grid;
      grid-template-columns: 220px 1fr 360px;
      min-height: calc(100vh - 96px);
    }
    .left-nav {
      border-right: 1px solid var(--line);
      display: grid;
      grid-template-rows: repeat(3, 56px) 1fr auto;
      background: #f5f7fb;
    }
    .nav-item {
      border: 0;
      border-bottom: 1px solid var(--line);
      background: transparent;
      color: var(--text);
      font-size: 15px;
      text-align: left;
      padding: 0 14px;
      cursor: pointer;
    }
    .nav-item.active {
      font-weight: 700;
      background: #e8f0ff;
    }
    .nav-spacer { border-bottom: 1px solid var(--line); }
    .profile {
      font-size: 14px;
      padding: 14px;
      color: var(--muted);
      border-top: 1px solid var(--line);
    }
    .center {
      border-right: 1px solid var(--line);
      padding: 16px;
      overflow: auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(180px, 1fr));
      gap: 14px;
    }
    .office-card {
      min-height: 156px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--card);
      color: var(--text);
      text-align: left;
      padding: 12px;
      cursor: pointer;
      display: grid;
      align-content: start;
      gap: 6px;
      transition: border-color 120ms ease, transform 120ms ease;
    }
    .office-card:hover {
      border-color: var(--accent);
      transform: translateY(-1px);
    }
    .office-card.active {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px rgba(47, 111, 237, 0.25) inset;
    }
    .office-card.add {
      place-items: center;
      display: grid;
      text-align: center;
      font-size: 20px;
      color: #2f6fed;
      border-style: dashed;
      background: #f3f7ff;
    }
    .office-title { font-size: 16px; font-weight: 700; }
    .office-line {
      color: #4a5c75;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .office-meta { color: var(--muted); font-size: 12px; margin-top: auto; }
    .right-panel {
      padding: 14px;
      overflow: auto;
      background: #f8fafd;
    }
    .right-title { font-size: 18px; font-weight: 700; }
    .right-sub { color: var(--muted); font-size: 12px; margin-top: 4px; }
    .discussion-box {
      margin-top: 12px;
      border: 1px solid var(--line);
      border-radius: 10px;
      min-height: 220px;
      max-height: 320px;
      overflow: auto;
      padding: 10px;
      background: #ffffff;
    }
    .message-item {
      margin-bottom: 8px;
      border: 1px solid #d6deea;
      border-radius: 8px;
      padding: 8px;
      background: #f2f6ff;
    }
    .message-head { font-size: 12px; color: #2f6fed; margin-bottom: 4px; }
    .message-body { font-size: 12px; white-space: pre-wrap; word-break: break-word; }
    .field { display: grid; gap: 4px; margin-top: 10px; }
    .field span { color: var(--muted); font-size: 12px; }
    input, textarea, select {
      width: 100%;
      background: #ffffff;
      color: var(--text);
      border: 1px solid #c8d4e8;
      border-radius: 8px;
      padding: 8px;
      font-size: 13px;
    }
    input, textarea, select, button {
      outline: none;
    }
    input:focus-visible, textarea:focus-visible, select:focus-visible, button:focus-visible {
      box-shadow: 0 0 0 2px rgba(47, 111, 237, 0.22);
      border-color: #5d8cef;
    }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    button {
      border: 1px solid #95b2e9;
      background: #edf3ff;
      color: #1f3f7f;
      border-radius: 8px;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 13px;
    }
    button:hover { background: #dbe8ff; }
    button:disabled { opacity: 0.45; cursor: not-allowed; }
    .danger { border-color: #d6a0a0; background: #fff2f2; color: #7a2f2f; }
    .danger:hover { background: #ffe5e5; }
    .right-divider { border-top: 1px dashed #c4d2e8; margin: 14px 0; }
    .member-list { display: grid; gap: 8px; }
    .member-row { border: 1px solid #d6deea; border-radius: 8px; padding: 8px; background: #ffffff; }
    .member-row b { display: block; font-size: 13px; }
    .member-row span { color: #2f6fed; font-size: 12px; }
    .member-row p { margin: 4px 0 0; color: #4a5c75; font-size: 12px; }
    .member-editor {
      margin-top: 12px;
      border: 1px solid #d6deea;
      border-radius: 10px;
      background: #ffffff;
      padding: 10px;
      display: grid;
      gap: 8px;
    }
    .member-editor-title {
      font-size: 12px;
      font-weight: 600;
      color: #3b4f73;
    }
    .member-editor-row {
      display: grid;
      grid-template-columns: 56px 1fr 104px 104px 1fr;
      gap: 6px;
      align-items: center;
    }
    .check {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #4a5c75;
    }
    .check input {
      width: 14px;
      height: 14px;
      margin: 0;
      padding: 0;
    }
    .toast-stack {
      position: fixed;
      right: 20px;
      bottom: 20px;
      display: grid;
      gap: 8px;
      z-index: 999;
      max-width: 360px;
    }
    .toast {
      border-radius: 10px;
      border: 1px solid #d6deea;
      background: #ffffff;
      padding: 10px 12px;
      font-size: 12px;
      color: #1f2937;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
    }
    .toast-success {
      border-color: #8bd0a3;
      background: #edfbf2;
      color: #14532d;
    }
    .toast-error {
      border-color: #efb4b4;
      background: #fff2f2;
      color: #7f1d1d;
    }
    .toast-info {
      border-color: #b8c7e7;
      background: #f3f7ff;
      color: #1e3a8a;
    }

    /* Create flow modal */
    .flow-modal-mask {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      display: grid;
      place-items: center;
      z-index: 800;
      padding: 24px;
    }
    .flow-modal {
      width: min(980px, calc(100vw - 32px));
      max-height: calc(100vh - 32px);
      overflow: auto;
      border: 1px solid #c6d4eb;
      border-radius: 14px;
      background: #ffffff;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
      display: grid;
      grid-template-rows: auto 1fr auto;
    }
    .flow-modal-head {
      border-bottom: 1px solid #d6deea;
      padding: 12px 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      position: sticky;
      top: 0;
      background: #ffffff;
      z-index: 1;
    }
    .flow-modal-title {
      font-size: 18px;
      font-weight: 700;
    }
    .flow-modal-sub {
      margin-top: 4px;
      font-size: 12px;
      color: #66768f;
    }
    .flow-modal-body {
      padding: 14px;
      display: grid;
      gap: 12px;
    }
    .flow-section {
      border: 1px solid #d6deea;
      border-radius: 10px;
      padding: 10px;
      background: #f9fbff;
    }
    .flow-alert {
      border-color: #f0b8b8;
      background: #fff6f6;
    }
    .flow-section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1f3f7f;
      margin-bottom: 8px;
    }
    .flow-plan-grid {
      margin-top: 8px;
      display: grid;
      grid-template-columns: repeat(2, minmax(220px, 1fr));
      gap: 8px;
    }
    .flow-plan-card {
      border: 1px solid #c8d4e8;
      border-radius: 10px;
      background: #ffffff;
      text-align: left;
      padding: 10px;
      display: grid;
      gap: 6px;
      cursor: pointer;
    }
    .flow-plan-card.active {
      border-color: #2f6fed;
      box-shadow: 0 0 0 1px rgba(47, 111, 237, 0.2) inset;
      background: #eef4ff;
    }
    .flow-plan-title {
      font-size: 13px;
      font-weight: 700;
      color: #1f3f7f;
    }
    .flow-plan-summary {
      font-size: 12px;
      color: #4a5c75;
      line-height: 1.45;
    }
    .flow-plan-meta {
      font-size: 11px;
      color: #5d6f8f;
    }
    .flow-preview-box {
      margin-top: 10px;
      border: 1px dashed #c4d2e8;
      border-radius: 10px;
      background: #ffffff;
      padding: 8px;
      display: grid;
      gap: 6px;
    }
    .flow-preview-title {
      font-size: 12px;
      font-weight: 700;
      color: #3b4f73;
    }
    .flow-preview-row {
      display: grid;
      grid-template-columns: 110px 120px 1fr;
      gap: 8px;
      font-size: 12px;
      color: #334155;
      align-items: center;
    }
    .flow-preview-role {
      font-weight: 600;
      color: #1f3f7f;
    }
    .flow-preview-provider {
      color: #2f6fed;
    }
    .flow-preview-model {
      color: #475569;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .flow-sync-msg {
      margin-top: 8px;
      font-size: 12px;
      color: #475569;
    }
    .flow-sync-success {
      color: #166534;
    }
    .flow-sync-error {
      color: #b91c1c;
    }
    .flow-modal-foot {
      border-top: 1px solid #d6deea;
      padding: 12px 14px;
      display: flex;
      justify-content: flex-end;
      background: #ffffff;
      position: sticky;
      bottom: 0;
    }
    .muted { color: var(--muted); font-size: 12px; }

    /* no-right-panel 布局 */
    .body.no-right-panel {
      grid-template-columns: 220px 1fr;
    }

    /* Dashboard 视图 */
    .dashboard-view, .subscription-view {
      padding: 4px 0;
    }
    .view-title {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }
    .view-desc {
      color: var(--muted);
      font-size: 13px;
      margin: 0 0 16px 0;
    }
    .dash-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .dash-card {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 14px;
      background: var(--card);
    }
    .dash-card-label {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .dash-card-value {
      font-size: 22px;
      font-weight: 700;
    }
    .dash-section {
      margin-bottom: 20px;
    }
    .dash-section h3 {
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 10px 0;
    }
    .dash-table-wrap {
      overflow-x: auto;
    }
    .dash-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .dash-table th, .dash-table td {
      border-bottom: 1px solid var(--line);
      padding: 8px 10px;
      text-align: left;
    }
    .dash-table th {
      color: var(--muted);
      font-weight: 500;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-cell {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
    }
    .status-idle { background: #eef3fb; color: #64748b; }
    .status-starting { background: #fff7e6; color: #b7791f; }
    .status-running { background: #eaf8f0; color: #2f855a; }
    .status-completed { background: #e7f0ff; color: #2b6cb0; }
    .status-stopped { background: #f3f4f6; color: #6b7280; }
    .status-error { background: #fdecec; color: #c53030; }
    .log-box {
      border: 1px solid var(--line);
      border-radius: 10px;
      max-height: 300px;
      overflow: auto;
      padding: 10px;
      background: #ffffff;
      font-family: "Cascadia Code", "Fira Code", monospace;
    }
    .log-line {
      font-size: 11px;
      color: #4a5c75;
      padding: 2px 0;
      border-bottom: 1px solid #e5ebf5;
      word-break: break-all;
    }

    /* 订阅视图 */
    .sub-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    .sub-tab {
      border: 1px solid var(--line);
      background: transparent;
      color: var(--muted);
      border-radius: 8px;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 13px;
    }
    .sub-tab.active {
      background: #e8f0ff;
      color: #1f3f7f;
      border-color: var(--accent);
      font-weight: 600;
    }
    .sub-content {
      max-height: calc(100vh - 280px);
      overflow: auto;
    }
    .sub-event-item {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 8px;
      background: var(--card);
    }
    .sub-event-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .sub-event-method {
      font-size: 13px;
      font-weight: 600;
      color: var(--accent);
    }
    .sub-event-time {
      font-size: 11px;
      color: var(--muted);
    }
    .sub-event-body {
      font-size: 11px;
      color: #4a5c75;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
      max-height: 120px;
      overflow: auto;
      background: #f8fafd;
      border-radius: 6px;
      padding: 6px;
    }
    .sub-chunk-item {
      border: 1px solid #d6deea;
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 8px;
      background: #f2f6ff;
    }
    .sub-chunk-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .sub-chunk-participant {
      font-size: 13px;
      font-weight: 600;
      color: #2f6fed;
    }
    .sub-chunk-meta {
      font-size: 11px;
      color: var(--muted);
    }
    .sub-chunk-body {
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    @media (max-width: 1600px) {
      .body { grid-template-columns: 180px 1fr 320px; }
      .body.no-right-panel { grid-template-columns: 180px 1fr; }
      .grid { grid-template-columns: repeat(2, minmax(180px, 1fr)); }
      .dash-summary-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 1200px) {
      .body { grid-template-columns: 1fr; }
      .body.no-right-panel { grid-template-columns: 1fr; }
      .left-nav, .right-panel { border-right: 0; border-top: 1px solid var(--line); }
      .left-nav { grid-template-rows: repeat(3, 48px) auto; }
      .dash-summary-grid { grid-template-columns: 1fr 1fr; }
      .member-editor-row { grid-template-columns: 56px 1fr; }
      .flow-plan-grid { grid-template-columns: 1fr; }
      .flow-preview-row { grid-template-columns: 1fr; }
    }
  `,document.head.appendChild(e)}async function pt(){ft(),m(),await J("orchestrator-notification",e=>{if(e.payload.method){const t=e.payload.method;if(t==="turn/chunk"||t==="turn/complete"||t==="session/progress"||t==="session/state"||t==="session/participants"){De(e.payload),t==="turn/chunk"&&r.workspaceMode==="offices"?ct():m();return}}me("unknown",e.payload),m()}),await J("orchestrator-log",e=>{S(`[orchestrator] ${e.payload}`),m()}),await J("orchestrator-exit",()=>{r.orchestratorRunning=!1,r.runStatus!=="error"&&(r.runStatus="stopped"),S("orchestrator process exited"),m()}),await he(),m()}pt();
