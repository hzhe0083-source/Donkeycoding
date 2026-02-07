(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const d of document.querySelectorAll('link[rel="modulepreload"]'))l(d);new MutationObserver(d=>{for(const i of d)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&l(c)}).observe(document,{childList:!0,subtree:!0});function a(d){const i={};return d.integrity&&(i.integrity=d.integrity),d.referrerPolicy&&(i.referrerPolicy=d.referrerPolicy),d.crossOrigin==="use-credentials"?i.credentials="include":d.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function l(d){if(d.ep)return;d.ep=!0;const i=a(d);fetch(d.href,i)}})();const p={},b="0.1.0",I=((p==null?void 0:p.VITE_UPDATE_MANIFEST_URL)||"").trim()||"/release-manifest.json",B=((p==null?void 0:p.VITE_UPDATE_AUTO_CHECK)||"true").trim().toLowerCase()!=="false",q=(()=>{const e=((p==null?void 0:p.VITE_UPDATE_AUTO_CHECK_DELAY_MS)||"").trim();if(!e)return 3e3;const t=Number(e);return!Number.isFinite(t)||t<0?3e3:Math.trunc(t)})(),S=document.querySelector("#app");if(!S)throw new Error("#app not found");const s={sessions:[],activeId:"",latestUpdate:"尚未检查更新",updateDownloadUrl:null,updateToastVisible:!1,updateToastText:"",updateUnread:!1};let g=null;function A(){g!==null&&(window.clearTimeout(g),g=null)}function V(e){A(),s.updateToastVisible=!0,s.updateToastText=e,s.updateUnread=!0,g=window.setTimeout(()=>{s.updateToastVisible=!1,s.updateToastText="",g=null,n()},8e3)}function $(){A(),s.updateToastVisible=!1,s.updateToastText="",s.updateUnread=!1}function E(e){if(window.open(e,"_blank","noopener,noreferrer"))return;const a=document.createElement("a");a.href=e,a.target="_blank",a.rel="noopener noreferrer",a.click()}function f(){return new Date().toISOString()}function T(e){return{id:`sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,title:e,status:"idle",target:"local",progress:0,elapsedSec:0,budgetUsd:0,updatedAt:f(),messages:[],tests:[],artifacts:[]}}function L(){const e=s.sessions.find(a=>a.id===s.activeId);if(e)return e;const t=T(`Workspace ${s.sessions.length+1}`);return s.sessions.unshift(t),s.activeId=t.id,t}function m(e,t,a){e.messages.push({role:t,text:a,time:f()}),e.updatedAt=f()}function C(e,t){e.status="running",e.progress=Math.min(95,e.progress+15),e.target==="cloud"&&(e.budgetUsd+=.02),e.elapsedSec+=2;const a=t.length>90?`${t.slice(0,90)}...`:t;m(e,"assistant",`已收到任务：${a}

下一步建议：
1) 先拆分验收标准
2) 先跑 local smoke test
3) 需要时切到 cloud 做大规模测试`),e.status="idle",e.progress=100}function O(e,t){const a=e.split(".").map(i=>Number(i)),l=t.split(".").map(i=>Number(i)),d=Math.max(a.length,l.length);for(let i=0;i<d;i+=1){const c=a[i]??0,u=l[i]??0;if(c>u)return 1;if(c<u)return-1}return 0}function r(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}async function D(){const e=document.querySelector("#checkUpdateBtn");e&&(e.disabled=!0,e.textContent="检查中...");try{const t=await fetch(I,{cache:"no-store"});if(!t.ok)throw new Error(`HTTP ${t.status}`);const a=await t.json();if(!a.version)throw new Error("manifest 缺少 version 字段");O(a.version,b)>0?(s.updateDownloadUrl=a.download_url??null,s.updateDownloadUrl?(s.latestUpdate=`发现新版本 ${a.version}（当前 ${b}）`,V(`发现新版本 ${a.version}`)):(s.latestUpdate=`发现新版本 ${a.version}，但未提供下载地址`,s.updateToastVisible=!1,s.updateToastText="",s.updateUnread=!1)):(s.updateDownloadUrl=null,s.latestUpdate=`当前已是最新版本（${b}）`,s.updateToastVisible=!1,s.updateToastText="",s.updateUnread=!1)}catch(t){s.updateDownloadUrl=null,s.updateToastVisible=!1,s.updateToastText="",s.updateUnread=!1;const a=t instanceof Error?t.message:String(t);s.latestUpdate=`检查更新失败：${a}`}finally{n();const t=document.querySelector("#latestUpdate");t==null||t.scrollIntoView({behavior:"smooth",block:"nearest"})}}function n(){const e=L();S.innerHTML=`
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

  ${s.updateToastVisible?`<div id="updateToast" class="toast"><span class="toastText">${r(s.updateToastText)}</span><button id="toastDownloadBtn" class="btn primary">Download Update</button><button id="toastCloseBtn" class="btn">关闭</button></div>`:""}

  <div class="layout">
    <aside class="left">
      <h3 class="title">Workspaces</h3>
      <div class="muted">独立前端原型（可后续打包成 Windows 客户端）</div>
      <button id="newWorkspaceBtn" class="btn" style="width:100%;margin-top:8px;">+ New Workspace</button>
      ${s.sessions.map(t=>{var a;return`
            <div class="session ${t.id===s.activeId?"active":""}" data-session-id="${t.id}">
              <div><strong>${r(t.title)}</strong></div>
              <div class="muted">${r(t.status)} · ${r(t.updatedAt)}</div>
              <div class="muted">${r(((a=t.messages.at(-1))==null?void 0:a.text.slice(0,32))??"暂无消息")}</div>
            </div>
          `}).join("")}
    </aside>

    <main class="center">
      <div class="header">
        <div class="headerTop">
          <div>
            <div class="title">${r(e.title)}</div>
            <div class="muted">状态：${r(e.status)}（v${b}）</div>
          </div>
          <div class="switch">
            <button id="targetLocalBtn" class="${e.target==="local"?"active":""}">Local</button>
            <button id="targetCloudBtn" class="${e.target==="cloud"?"active":""}">Cloud</button>
          </div>
        </div>
        <div class="kpis">
          <div class="kpi"><div class="kpiLabel">Target</div><div class="kpiValue">${e.target.toUpperCase()}</div></div>
          <div class="kpi"><div class="kpiLabel">Elapsed</div><div class="kpiValue">${e.elapsedSec}s</div></div>
          <div class="kpi"><div class="kpiLabel">Budget</div><div class="kpiValue">$${e.budgetUsd.toFixed(2)}</div></div>
          <div class="kpi"><div class="kpiLabel">Progress</div><div class="kpiValue">${e.progress}%</div></div>
        </div>
      </div>

      <div class="messages">
        ${e.messages.length===0?'<div class="muted">输入需求后点击 Send 开始。</div>':e.messages.map(t=>`
                    <div class="msg ${t.role}">
                      <div class="muted">${r(t.time)} · ${r(t.role)}</div>
                      <div>${r(t.text)}</div>
                    </div>
                  `).join("")}
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
        <div class="updateBtnWrap"><button id="checkUpdateBtn" class="btn">检查更新</button>${s.updateUnread?'<span class="updateBadge"></span>':""}</div>
        ${s.updateDownloadUrl?'<button id="downloadUpdateBtn" class="btn primary">Download Update</button>':""}
        <pre id="latestUpdate">${r(s.latestUpdate)}</pre>
      </section>

      <section style="display:grid;grid-template-rows:auto 1fr;min-height:0;">
        <div class="panelHead">Artifacts</div>
        <ul class="list">${e.artifacts.length===0?'<li class="muted">暂无产物</li>':e.artifacts.map(t=>`<li>${r(t)}</li>`).join("")}</ul>
      </section>

      <section style="display:grid;grid-template-rows:auto 1fr;min-height:0;">
        <div class="panelHead">Test Runs</div>
        <ul class="list">${e.tests.length===0?'<li class="muted">暂无测试记录</li>':e.tests.map(t=>`<li>${r(t)}</li>`).join("")}</ul>
      </section>
    </aside>
  </div>
  `,M()}function M(){const e=L(),t=document.querySelector("#newWorkspaceBtn");t==null||t.addEventListener("click",()=>{const o=T(`Workspace ${s.sessions.length+1}`);s.sessions.unshift(o),s.activeId=o.id,n()});for(const o of document.querySelectorAll(".session[data-session-id]")){const U=o.dataset.sessionId;o.addEventListener("click",()=>{U&&(s.activeId=U,n())})}const a=document.querySelector("#targetLocalBtn");a==null||a.addEventListener("click",()=>{e.target="local",e.updatedAt=f(),n()});const l=document.querySelector("#targetCloudBtn");l==null||l.addEventListener("click",()=>{e.target="cloud",e.updatedAt=f(),n()});const d=document.querySelector("#sendBtn"),i=document.querySelector("#input"),c=()=>{if(!i)return;const o=i.value.trim();o&&(m(e,"user",o),C(e,o),i.value="",n())};d==null||d.addEventListener("click",c),i==null||i.addEventListener("keydown",o=>{o.key==="Enter"&&!o.shiftKey&&(o.preventDefault(),c())});const u=document.querySelector("#runTestsBtn");u==null||u.addEventListener("click",()=>{e.tests.unshift(`${e.target.toUpperCase()} test run @ ${new Date().toLocaleTimeString()}`),e.tests=e.tests.slice(0,10),m(e,"system",`已触发 ${e.target} 测试。`),n()});const v=document.querySelector("#genArtifactBtn");v==null||v.addEventListener("click",()=>{e.artifacts.unshift(`delivery-${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.zip`),e.artifacts=e.artifacts.slice(0,10),m(e,"system","已生成产物。可接入真实下载服务。"),n()});const x=document.querySelector("#clearBtn");x==null||x.addEventListener("click",()=>{e.messages=[],e.progress=0,e.status="idle",e.updatedAt=f(),n()});const h=document.querySelector("#checkUpdateBtn");h==null||h.addEventListener("click",()=>{s.updateUnread=!1,D()});const w=document.querySelector("#downloadUpdateBtn");w==null||w.addEventListener("click",()=>{s.updateDownloadUrl&&($(),n(),E(s.updateDownloadUrl))});const y=document.querySelector("#toastDownloadBtn");y==null||y.addEventListener("click",()=>{s.updateDownloadUrl&&E(s.updateDownloadUrl)});const k=document.querySelector("#toastCloseBtn");k==null||k.addEventListener("click",()=>{$(),n()})}s.sessions=[T("Workspace 1")];s.activeId=s.sessions[0].id;n();B&&window.setTimeout(()=>{D()},q);
