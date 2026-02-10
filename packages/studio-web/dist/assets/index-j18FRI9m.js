var lo=Object.defineProperty;var co=(e,t,r)=>t in e?lo(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var R=(e,t,r)=>co(e,typeof t!="symbol"?t+"":t,r);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))o(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const s of n.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function r(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(i){if(i.ep)return;i.ep=!0;const n=r(i);fetch(i.href,n)}})();function po(e,t,r,o){if(typeof t=="function"?e!==t||!o:!t.has(e))throw new TypeError("Cannot read private member from an object whose class did not declare it");return r==="m"?o:r==="a"?o.call(e):o?o.value:t.get(e)}function fo(e,t,r,o,i){if(typeof t=="function"?e!==t||!0:!t.has(e))throw new TypeError("Cannot write private member to an object whose class did not declare it");return t.set(e,r),r}var Ce;const ea="__TAURI_TO_IPC_KEY__";function uo(e,t=!1){return window.__TAURI_INTERNALS__.transformCallback(e,t)}async function ie(e,t={},r){return window.__TAURI_INTERNALS__.invoke(e,t,r)}class ta{get rid(){return po(this,Ce,"f")}constructor(t){Ce.set(this,void 0),fo(this,Ce,t)}async close(){return ie("plugin:resources|close",{rid:this.rid})}}Ce=new WeakMap;var Xt;(function(e){e.WINDOW_RESIZED="tauri://resize",e.WINDOW_MOVED="tauri://move",e.WINDOW_CLOSE_REQUESTED="tauri://close-requested",e.WINDOW_DESTROYED="tauri://destroyed",e.WINDOW_FOCUS="tauri://focus",e.WINDOW_BLUR="tauri://blur",e.WINDOW_SCALE_FACTOR_CHANGED="tauri://scale-change",e.WINDOW_THEME_CHANGED="tauri://theme-changed",e.WINDOW_CREATED="tauri://window-created",e.WEBVIEW_CREATED="tauri://webview-created",e.DRAG_ENTER="tauri://drag-enter",e.DRAG_OVER="tauri://drag-over",e.DRAG_DROP="tauri://drag-drop",e.DRAG_LEAVE="tauri://drag-leave"})(Xt||(Xt={}));async function yr(e,t){window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(e,t),await ie("plugin:event|unlisten",{event:e,eventId:t})}async function Te(e,t,r){var o;const i=typeof(r==null?void 0:r.target)=="string"?{kind:"AnyLabel",label:r.target}:(o=r==null?void 0:r.target)!==null&&o!==void 0?o:{kind:"Any"};return ie("plugin:event|listen",{event:e,target:i,handler:uo(t)}).then(n=>async()=>yr(e,n))}async function ra(e,t,r){return Te(e,o=>{yr(e,o.id),t(o)},r)}async function oa(e,t){await ie("plugin:event|emit",{event:e,payload:t})}async function ia(e,t,r){await ie("plugin:event|emit_to",{target:typeof e=="string"?{kind:"AnyLabel",label:e}:e,event:t,payload:r})}function Fe(e,t,r,o,i){return{participantId:`${e}-${t}`,provider:r,modelId:o,role:i,enabled:!0}}function go(e,t,r){return{officeId:e,officeName:t,objective:r,maxRounds:3,members:[Fe(e,"chatgpt","openai","gpt-4.1","proposer"),Fe(e,"gemini","google","gemini-1.5-pro","critic"),Fe(e,"claude","anthropic","claude-3-5-sonnet","synthesizer")]}}function Ke(e){return{officeId:e,status:"idle",sessionId:"-",turnIndex:0,agreementScore:0,totalTokens:0,totalCost:0,lastSummary:"暂无会议结论",lastUpdatedAt:new Date().toISOString()}}const $r=[],bo=Object.fromEntries($r.map(e=>[e.officeId,Ke(e.officeId)])),d={orchestratorRunning:!1,runStatus:"idle",busyAction:"none",workspaceMode:"offices",officeStatusFilter:"all",officeSortBy:"priority",officeSortDirection:"asc",activeOfficeId:"",offices:$r,officeSnapshots:bo,sessionOfficeMap:{},sessionId:"-",turnIndex:0,agreementScore:0,totalTokens:0,totalCost:0,participants:[],chunks:[],notifications:[],logs:[],humanDraftByOfficeId:{},toasts:[],apiKeys:{openai:"",openai_compatible:"",anthropic:"",google:"",deepseek:""},globalApis:[{name:"默认接口",duty:"developer",provider:"openai",modelId:"gpt-4.1",endpoint:"",apiKey:""}],dutyRolePolicy:{developer:["proposer","synthesizer","critic"],frontend:["proposer","synthesizer","critic"],tester:["verifier","critic","researcher"],product_manager:["proposer","synthesizer","arbiter"],mathematician:["verifier","researcher","critic"],researcher:["researcher","critic","verifier"],architect:["synthesizer","arbiter","proposer"],reviewer:["critic","verifier","arbiter"]},activeGlobalApiIndex:0,globalApiImportText:"",openaiCompatibleEndpoint:"",anthropicCompatibleEndpoint:"",review:{enabled:!0,language:"zh-CN",minSeverity:"MEDIUM",maxFindings:8,requireEvidence:!0,categoriesText:"correctness, security, performance, maintainability"},operators:[{name:"sanitize_input",enabled:!0,configText:"null"},{name:"context_window",enabled:!0,configText:"null"},{name:"participant_selector",enabled:!0,configText:"null"},{name:"role_response_format",enabled:!0,configText:"null"},{name:"review_instruction",enabled:!0,configText:"null"},{name:"review_findings",enabled:!0,configText:"null"},{name:"output_guard",enabled:!0,configText:"null"}],_subTab:"notifications"};let er=1;function j(e){d.busyAction=e}function mo(e,t){const r=er;return er+=1,d.toasts=[...d.toasts,{id:r,kind:e,message:t}].slice(-4),r}function ho(e){d.toasts=d.toasts.filter(t=>t.id!==e)}function W(){const e=d.offices.find(r=>r.officeId===d.activeOfficeId);if(e)return e;const t=d.offices[0];if(!t){d.activeOfficeId="";return}return d.activeOfficeId=t.officeId,t}function xo(e){d.offices.some(t=>t.officeId===e)&&(d.activeOfficeId=e)}function Ir(e){const t=d.sessionOfficeMap[e];if(t)return d.offices.find(r=>r.officeId===t)}function rt(e,t){!t||!d.offices.some(r=>r.officeId===t)||(d.sessionOfficeMap[e]=t,re(t,{sessionId:e}))}function re(e,t){const r=d.officeSnapshots[e]??Ke(e);d.officeSnapshots[e]={...r,...t,officeId:e,lastUpdatedAt:new Date().toISOString()}}function vo(){const e=new Set(d.offices.map(r=>r.officeId).map(r=>r.replace("office-","")).map(r=>Number(r)).filter(r=>Number.isFinite(r)&&r>0));let t=1;for(;e.has(t);)t+=1;return t}function wo(e){return e>=1&&e<=26?`办公室 ${String.fromCharCode(64+e)}`:`办公室 ${e}`}function ot(){const e=vo(),t=`office-${e}`,r=wo(e),o=go(t,r,"在这里定义该办公室本轮创作目标");d.offices.push(o),d.officeSnapshots[t]=Ke(t),d.activeOfficeId=t}function M(e){d.logs.unshift(`[${new Date().toISOString()}] ${e}`),d.logs.length>300&&(d.logs=d.logs.slice(0,300))}function Sr(e,t){d.notifications.unshift({time:new Date().toISOString(),method:e,payload:t}),d.notifications.length>200&&(d.notifications=d.notifications.slice(0,200))}let ko=1;const b={open:!1,phase:"greeting",messages:[],participantLabels:{},leaderParticipantId:"",secretaryCanFinalize:!1,userInput:"",confirmedGoal:"",selectedPlanId:"",officeName:"",maxRounds:3,aiThinking:!1,creating:!1,sessionId:""};function yo(){b.open=!0,b.phase="greeting",b.messages=[],b.participantLabels={},b.leaderParticipantId="",b.secretaryCanFinalize=!1,b.userInput="",b.confirmedGoal="",b.selectedPlanId="",b.officeName="",b.maxRounds=3,b.aiThinking=!1,b.creating=!1,b.sessionId="",B("ai",`总，今天想要干什么？

你可以直接说：‘我想仿照一个京东集团的商城项目。’

我会先召集你当前可用的 API 团队，给每个成员分配职责（工程师/前端/数学家/测试/产品经理），先共创项目企划与 workflow，再请你拍板是否创建办公室并开工。`,[])}function tr(){b.open=!1,b.aiThinking=!1,b.creating=!1}function B(e,t,r,o){const i={id:ko++,sender:e,text:t,timestamp:new Date().toISOString(),actions:r,participantId:o==null?void 0:o.participantId,authorLabel:o==null?void 0:o.authorLabel,streamKey:o==null?void 0:o.streamKey};return b.messages.push(i),i}function $o(e){b.phase=e}function Io(e){d.chunks.unshift(e),d.chunks.length>400&&(d.chunks=d.chunks.slice(0,400))}function So(e,t){const r=d.participants.find(o=>o.participantId===e);if(r){Object.assign(r,t);return}d.participants.push({participantId:e,role:t.role??"-",provider:t.provider??"-",modelId:t.modelId??"-",status:t.status??"pending",latencyMs:t.latencyMs})}const Le="beboss-settings",zo="donkey-studio-settings";function Ao(){try{const e={globalApis:d.globalApis,dutyRolePolicy:d.dutyRolePolicy,activeGlobalApiIndex:d.activeGlobalApiIndex,apiKeys:d.apiKeys,openaiCompatibleEndpoint:d.openaiCompatibleEndpoint,anthropicCompatibleEndpoint:d.anthropicCompatibleEndpoint,offices:d.offices};localStorage.setItem(Le,JSON.stringify(e))}catch{}}function _o(){try{const e=localStorage.getItem(Le)??localStorage.getItem(zo);if(!e)return;localStorage.getItem(Le)||localStorage.setItem(Le,e);const t=JSON.parse(e);if(Array.isArray(t.globalApis)&&t.globalApis.length>0&&(d.globalApis=t.globalApis.map(r=>({name:r&&typeof r=="object"&&"name"in r&&typeof r.name=="string"?r.name:"接口",duty:r&&typeof r=="object"&&"duty"in r&&(r.duty==="developer"||r.duty==="frontend"||r.duty==="tester"||r.duty==="product_manager"||r.duty==="mathematician"||r.duty==="researcher"||r.duty==="architect"||r.duty==="reviewer")?r.duty:"developer",provider:r&&typeof r=="object"&&"provider"in r?r.provider:"openai",modelId:r&&typeof r=="object"&&"modelId"in r&&typeof r.modelId=="string"?r.modelId:"",endpoint:r&&typeof r=="object"&&"endpoint"in r&&typeof r.endpoint=="string"?r.endpoint:"",apiKey:r&&typeof r=="object"&&"apiKey"in r&&typeof r.apiKey=="string"?r.apiKey:""}))),typeof t.activeGlobalApiIndex=="number"&&t.activeGlobalApiIndex>=0&&(d.activeGlobalApiIndex=Math.min(t.activeGlobalApiIndex,d.globalApis.length-1)),t.dutyRolePolicy&&typeof t.dutyRolePolicy=="object"){const r=t.dutyRolePolicy,o=(i,n)=>{if(!Array.isArray(i))return n;const s=i.filter(a=>a==="proposer"||a==="critic"||a==="synthesizer"||a==="arbiter"||a==="researcher"||a==="verifier");return s.length>0?s:n};d.dutyRolePolicy={developer:o(r.developer,d.dutyRolePolicy.developer),frontend:o(r.frontend,d.dutyRolePolicy.frontend),tester:o(r.tester,d.dutyRolePolicy.tester),product_manager:o(r.product_manager,d.dutyRolePolicy.product_manager),mathematician:o(r.mathematician,d.dutyRolePolicy.mathematician),researcher:o(r.researcher,d.dutyRolePolicy.researcher),architect:o(r.architect,d.dutyRolePolicy.architect),reviewer:o(r.reviewer,d.dutyRolePolicy.reviewer)}}if(t.apiKeys&&typeof t.apiKeys=="object"){const r=t.apiKeys;typeof r.openai=="string"&&(d.apiKeys.openai=r.openai),typeof r.openai_compatible=="string"&&(d.apiKeys.openai_compatible=r.openai_compatible),typeof r.anthropic=="string"&&(d.apiKeys.anthropic=r.anthropic),typeof r.google=="string"&&(d.apiKeys.google=r.google),typeof r.deepseek=="string"&&(d.apiKeys.deepseek=r.deepseek)}typeof t.openaiCompatibleEndpoint=="string"&&(d.openaiCompatibleEndpoint=t.openaiCompatibleEndpoint),typeof t.anthropicCompatibleEndpoint=="string"&&(d.anthropicCompatibleEndpoint=t.anthropicCompatibleEndpoint),Array.isArray(t.offices)&&t.offices.length>0&&(d.offices=t.offices,d.officeSnapshots=Object.fromEntries(t.offices.map(r=>[r.officeId,Ke(r.officeId)])),d.activeOfficeId=t.offices[0].officeId)}catch{}}function it(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var pe=it();function zr(e){pe=e}var Ie={exec:()=>null};function _(e,t=""){let r=typeof e=="string"?e:e.source,o={replace:(i,n)=>{let s=typeof n=="string"?n:n.source;return s=s.replace(G.caret,"$1"),r=r.replace(i,s),o},getRegex:()=>new RegExp(r,t)};return o}var Eo=(()=>{try{return!!new RegExp("(?<=1)(?<!1)")}catch{return!1}})(),G={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceTabs:/^\t+/,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] +\S/,listReplaceTask:/^\[[ xX]\] +/,listTaskCheckbox:/\[[ xX]\]/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,unescapeTest:/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:e=>new RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),hrRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),fencesBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}(?:\`\`\`|~~~)`),headingBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}#`),htmlBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}<(?:[a-z].*>|!--)`,"i")},Ro=/^(?:[ \t]*(?:\n|$))+/,Po=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,Co=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,Ae=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,To=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,nt=/(?:[*+-]|\d{1,9}[.)])/,Ar=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,_r=_(Ar).replace(/bull/g,nt).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),Lo=_(Ar).replace(/bull/g,nt).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),at=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,Oo=/^[^\n]+/,st=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,Mo=_(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",st).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),qo=_(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,nt).getRegex(),Ge="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",dt=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,No=_("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",dt).replace("tag",Ge).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),Er=_(at).replace("hr",Ae).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",Ge).getRegex(),Do=_(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",Er).getRegex(),lt={blockquote:Do,code:Po,def:Mo,fences:Co,heading:To,hr:Ae,html:No,lheading:_r,list:qo,newline:Ro,paragraph:Er,table:Ie,text:Oo},rr=_("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",Ae).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",Ge).getRegex(),jo={...lt,lheading:Lo,table:rr,paragraph:_(at).replace("hr",Ae).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",rr).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",Ge).getRegex()},Ko={...lt,html:_(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",dt).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:Ie,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:_(at).replace("hr",Ae).replace("heading",` *#{1,6} *[^
]`).replace("lheading",_r).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},Go=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,Bo=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,Rr=/^( {2,}|\\)\n(?!\s*$)/,Fo=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,Be=/[\p{P}\p{S}]/u,ct=/[\s\p{P}\p{S}]/u,Pr=/[^\s\p{P}\p{S}]/u,Wo=_(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,ct).getRegex(),Cr=/(?!~)[\p{P}\p{S}]/u,Uo=/(?!~)[\s\p{P}\p{S}]/u,Ho=/(?:[^\s\p{P}\p{S}]|~)/u,Zo=_(/link|precode-code|html/,"g").replace("link",/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-",Eo?"(?<!`)()":"(^^|[^`])").replace("code",/(?<b>`+)[^`]+\k<b>(?!`)/).replace("html",/<(?! )[^<>]*?>/).getRegex(),Tr=/^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/,Vo=_(Tr,"u").replace(/punct/g,Be).getRegex(),Qo=_(Tr,"u").replace(/punct/g,Cr).getRegex(),Lr="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",Yo=_(Lr,"gu").replace(/notPunctSpace/g,Pr).replace(/punctSpace/g,ct).replace(/punct/g,Be).getRegex(),Jo=_(Lr,"gu").replace(/notPunctSpace/g,Ho).replace(/punctSpace/g,Uo).replace(/punct/g,Cr).getRegex(),Xo=_("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,Pr).replace(/punctSpace/g,ct).replace(/punct/g,Be).getRegex(),ei=_(/\\(punct)/,"gu").replace(/punct/g,Be).getRegex(),ti=_(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),ri=_(dt).replace("(?:-->|$)","-->").getRegex(),oi=_("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",ri).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),qe=/(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/,ii=_(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label",qe).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),Or=_(/^!?\[(label)\]\[(ref)\]/).replace("label",qe).replace("ref",st).getRegex(),Mr=_(/^!?\[(ref)\](?:\[\])?/).replace("ref",st).getRegex(),ni=_("reflink|nolink(?!\\()","g").replace("reflink",Or).replace("nolink",Mr).getRegex(),or=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,pt={_backpedal:Ie,anyPunctuation:ei,autolink:ti,blockSkip:Zo,br:Rr,code:Bo,del:Ie,emStrongLDelim:Vo,emStrongRDelimAst:Yo,emStrongRDelimUnd:Xo,escape:Go,link:ii,nolink:Mr,punctuation:Wo,reflink:Or,reflinkSearch:ni,tag:oi,text:Fo,url:Ie},ai={...pt,link:_(/^!?\[(label)\]\((.*?)\)/).replace("label",qe).getRegex(),reflink:_(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",qe).getRegex()},Ve={...pt,emStrongRDelimAst:Jo,emStrongLDelim:Qo,url:_(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol",or).replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:_(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol",or).getRegex()},si={...Ve,br:_(Rr).replace("{2,}","*").getRegex(),text:_(Ve.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},Ee={normal:lt,gfm:jo,pedantic:Ko},we={normal:pt,gfm:Ve,breaks:si,pedantic:ai},di={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},ir=e=>di[e];function Q(e,t){if(t){if(G.escapeTest.test(e))return e.replace(G.escapeReplace,ir)}else if(G.escapeTestNoEncode.test(e))return e.replace(G.escapeReplaceNoEncode,ir);return e}function nr(e){try{e=encodeURI(e).replace(G.percentDecode,"%")}catch{return null}return e}function ar(e,t){var n;let r=e.replace(G.findPipe,(s,a,c)=>{let l=!1,f=a;for(;--f>=0&&c[f]==="\\";)l=!l;return l?"|":" |"}),o=r.split(G.splitPipe),i=0;if(o[0].trim()||o.shift(),o.length>0&&!((n=o.at(-1))!=null&&n.trim())&&o.pop(),t)if(o.length>t)o.splice(t);else for(;o.length<t;)o.push("");for(;i<o.length;i++)o[i]=o[i].trim().replace(G.slashPipe,"|");return o}function ke(e,t,r){let o=e.length;if(o===0)return"";let i=0;for(;i<o&&e.charAt(o-i-1)===t;)i++;return e.slice(0,o-i)}function li(e,t){if(e.indexOf(t[1])===-1)return-1;let r=0;for(let o=0;o<e.length;o++)if(e[o]==="\\")o++;else if(e[o]===t[0])r++;else if(e[o]===t[1]&&(r--,r<0))return o;return r>0?-2:-1}function sr(e,t,r,o,i){let n=t.href,s=t.title||null,a=e[1].replace(i.other.outputLinkReplace,"$1");o.state.inLink=!0;let c={type:e[0].charAt(0)==="!"?"image":"link",raw:r,href:n,title:s,text:a,tokens:o.inlineTokens(a)};return o.state.inLink=!1,c}function ci(e,t,r){let o=e.match(r.other.indentCodeCompensation);if(o===null)return t;let i=o[1];return t.split(`
`).map(n=>{let s=n.match(r.other.beginningSpace);if(s===null)return n;let[a]=s;return a.length>=i.length?n.slice(i.length):n}).join(`
`)}var Ne=class{constructor(e){R(this,"options");R(this,"rules");R(this,"lexer");this.options=e||pe}space(e){let t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return{type:"space",raw:t[0]}}code(e){let t=this.rules.block.code.exec(e);if(t){let r=t[0].replace(this.rules.other.codeRemoveIndent,"");return{type:"code",raw:t[0],codeBlockStyle:"indented",text:this.options.pedantic?r:ke(r,`
`)}}}fences(e){let t=this.rules.block.fences.exec(e);if(t){let r=t[0],o=ci(r,t[3]||"",this.rules);return{type:"code",raw:r,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):t[2],text:o}}}heading(e){let t=this.rules.block.heading.exec(e);if(t){let r=t[2].trim();if(this.rules.other.endingHash.test(r)){let o=ke(r,"#");(this.options.pedantic||!o||this.rules.other.endingSpaceChar.test(o))&&(r=o.trim())}return{type:"heading",raw:t[0],depth:t[1].length,text:r,tokens:this.lexer.inline(r)}}}hr(e){let t=this.rules.block.hr.exec(e);if(t)return{type:"hr",raw:ke(t[0],`
`)}}blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let r=ke(t[0],`
`).split(`
`),o="",i="",n=[];for(;r.length>0;){let s=!1,a=[],c;for(c=0;c<r.length;c++)if(this.rules.other.blockquoteStart.test(r[c]))a.push(r[c]),s=!0;else if(!s)a.push(r[c]);else break;r=r.slice(c);let l=a.join(`
`),f=l.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");o=o?`${o}
${l}`:l,i=i?`${i}
${f}`:f;let m=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(f,n,!0),this.lexer.state.top=m,r.length===0)break;let k=n.at(-1);if((k==null?void 0:k.type)==="code")break;if((k==null?void 0:k.type)==="blockquote"){let x=k,S=x.raw+`
`+r.join(`
`),$=this.blockquote(S);n[n.length-1]=$,o=o.substring(0,o.length-x.raw.length)+$.raw,i=i.substring(0,i.length-x.text.length)+$.text;break}else if((k==null?void 0:k.type)==="list"){let x=k,S=x.raw+`
`+r.join(`
`),$=this.list(S);n[n.length-1]=$,o=o.substring(0,o.length-k.raw.length)+$.raw,i=i.substring(0,i.length-x.raw.length)+$.raw,r=S.substring(n.at(-1).raw.length).split(`
`);continue}}return{type:"blockquote",raw:o,tokens:n,text:i}}}list(e){var r,o;let t=this.rules.block.list.exec(e);if(t){let i=t[1].trim(),n=i.length>1,s={type:"list",raw:"",ordered:n,start:n?+i.slice(0,-1):"",loose:!1,items:[]};i=n?`\\d{1,9}\\${i.slice(-1)}`:`\\${i}`,this.options.pedantic&&(i=n?i:"[*+-]");let a=this.rules.other.listItemRegex(i),c=!1;for(;e;){let f=!1,m="",k="";if(!(t=a.exec(e))||this.rules.block.hr.test(e))break;m=t[0],e=e.substring(m.length);let x=t[2].split(`
`,1)[0].replace(this.rules.other.listReplaceTabs,q=>" ".repeat(3*q.length)),S=e.split(`
`,1)[0],$=!x.trim(),P=0;if(this.options.pedantic?(P=2,k=x.trimStart()):$?P=t[1].length+1:(P=t[2].search(this.rules.other.nonSpaceChar),P=P>4?1:P,k=x.slice(P),P+=t[1].length),$&&this.rules.other.blankLine.test(S)&&(m+=S+`
`,e=e.substring(S.length+1),f=!0),!f){let q=this.rules.other.nextBulletRegex(P),U=this.rules.other.hrRegex(P),te=this.rules.other.fencesBeginRegex(P),ne=this.rules.other.headingBeginRegex(P),ue=this.rules.other.htmlBeginRegex(P);for(;e;){let C=e.split(`
`,1)[0],D;if(S=C,this.options.pedantic?(S=S.replace(this.rules.other.listReplaceNesting,"  "),D=S):D=S.replace(this.rules.other.tabCharGlobal,"    "),te.test(S)||ne.test(S)||ue.test(S)||q.test(S)||U.test(S))break;if(D.search(this.rules.other.nonSpaceChar)>=P||!S.trim())k+=`
`+D.slice(P);else{if($||x.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||te.test(x)||ne.test(x)||U.test(x))break;k+=`
`+S}!$&&!S.trim()&&($=!0),m+=C+`
`,e=e.substring(C.length+1),x=D.slice(P)}}s.loose||(c?s.loose=!0:this.rules.other.doubleBlankLine.test(m)&&(c=!0)),s.items.push({type:"list_item",raw:m,task:!!this.options.gfm&&this.rules.other.listIsTask.test(k),loose:!1,text:k,tokens:[]}),s.raw+=m}let l=s.items.at(-1);if(l)l.raw=l.raw.trimEnd(),l.text=l.text.trimEnd();else return;s.raw=s.raw.trimEnd();for(let f of s.items){if(this.lexer.state.top=!1,f.tokens=this.lexer.blockTokens(f.text,[]),f.task){if(f.text=f.text.replace(this.rules.other.listReplaceTask,""),((r=f.tokens[0])==null?void 0:r.type)==="text"||((o=f.tokens[0])==null?void 0:o.type)==="paragraph"){f.tokens[0].raw=f.tokens[0].raw.replace(this.rules.other.listReplaceTask,""),f.tokens[0].text=f.tokens[0].text.replace(this.rules.other.listReplaceTask,"");for(let k=this.lexer.inlineQueue.length-1;k>=0;k--)if(this.rules.other.listIsTask.test(this.lexer.inlineQueue[k].src)){this.lexer.inlineQueue[k].src=this.lexer.inlineQueue[k].src.replace(this.rules.other.listReplaceTask,"");break}}let m=this.rules.other.listTaskCheckbox.exec(f.raw);if(m){let k={type:"checkbox",raw:m[0]+" ",checked:m[0]!=="[ ]"};f.checked=k.checked,s.loose?f.tokens[0]&&["paragraph","text"].includes(f.tokens[0].type)&&"tokens"in f.tokens[0]&&f.tokens[0].tokens?(f.tokens[0].raw=k.raw+f.tokens[0].raw,f.tokens[0].text=k.raw+f.tokens[0].text,f.tokens[0].tokens.unshift(k)):f.tokens.unshift({type:"paragraph",raw:k.raw,text:k.raw,tokens:[k]}):f.tokens.unshift(k)}}if(!s.loose){let m=f.tokens.filter(x=>x.type==="space"),k=m.length>0&&m.some(x=>this.rules.other.anyLine.test(x.raw));s.loose=k}}if(s.loose)for(let f of s.items){f.loose=!0;for(let m of f.tokens)m.type==="text"&&(m.type="paragraph")}return s}}html(e){let t=this.rules.block.html.exec(e);if(t)return{type:"html",block:!0,raw:t[0],pre:t[1]==="pre"||t[1]==="script"||t[1]==="style",text:t[0]}}def(e){let t=this.rules.block.def.exec(e);if(t){let r=t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal," "),o=t[2]?t[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",i=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):t[3];return{type:"def",tag:r,raw:t[0],href:o,title:i}}}table(e){var s;let t=this.rules.block.table.exec(e);if(!t||!this.rules.other.tableDelimiter.test(t[2]))return;let r=ar(t[1]),o=t[2].replace(this.rules.other.tableAlignChars,"").split("|"),i=(s=t[3])!=null&&s.trim()?t[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],n={type:"table",raw:t[0],header:[],align:[],rows:[]};if(r.length===o.length){for(let a of o)this.rules.other.tableAlignRight.test(a)?n.align.push("right"):this.rules.other.tableAlignCenter.test(a)?n.align.push("center"):this.rules.other.tableAlignLeft.test(a)?n.align.push("left"):n.align.push(null);for(let a=0;a<r.length;a++)n.header.push({text:r[a],tokens:this.lexer.inline(r[a]),header:!0,align:n.align[a]});for(let a of i)n.rows.push(ar(a,n.header.length).map((c,l)=>({text:c,tokens:this.lexer.inline(c),header:!1,align:n.align[l]})));return n}}lheading(e){let t=this.rules.block.lheading.exec(e);if(t)return{type:"heading",raw:t[0],depth:t[2].charAt(0)==="="?1:2,text:t[1],tokens:this.lexer.inline(t[1])}}paragraph(e){let t=this.rules.block.paragraph.exec(e);if(t){let r=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return{type:"paragraph",raw:t[0],text:r,tokens:this.lexer.inline(r)}}}text(e){let t=this.rules.block.text.exec(e);if(t)return{type:"text",raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){let t=this.rules.inline.escape.exec(e);if(t)return{type:"escape",raw:t[0],text:t[1]}}tag(e){let t=this.rules.inline.tag.exec(e);if(t)return!this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:t[0]}}link(e){let t=this.rules.inline.link.exec(e);if(t){let r=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(r)){if(!this.rules.other.endAngleBracket.test(r))return;let n=ke(r.slice(0,-1),"\\");if((r.length-n.length)%2===0)return}else{let n=li(t[2],"()");if(n===-2)return;if(n>-1){let s=(t[0].indexOf("!")===0?5:4)+t[1].length+n;t[2]=t[2].substring(0,n),t[0]=t[0].substring(0,s).trim(),t[3]=""}}let o=t[2],i="";if(this.options.pedantic){let n=this.rules.other.pedanticHrefTitle.exec(o);n&&(o=n[1],i=n[3])}else i=t[3]?t[3].slice(1,-1):"";return o=o.trim(),this.rules.other.startAngleBracket.test(o)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(r)?o=o.slice(1):o=o.slice(1,-1)),sr(t,{href:o&&o.replace(this.rules.inline.anyPunctuation,"$1"),title:i&&i.replace(this.rules.inline.anyPunctuation,"$1")},t[0],this.lexer,this.rules)}}reflink(e,t){let r;if((r=this.rules.inline.reflink.exec(e))||(r=this.rules.inline.nolink.exec(e))){let o=(r[2]||r[1]).replace(this.rules.other.multipleSpaceGlobal," "),i=t[o.toLowerCase()];if(!i){let n=r[0].charAt(0);return{type:"text",raw:n,text:n}}return sr(r,i,r[0],this.lexer,this.rules)}}emStrong(e,t,r=""){let o=this.rules.inline.emStrongLDelim.exec(e);if(!(!o||o[3]&&r.match(this.rules.other.unicodeAlphaNumeric))&&(!(o[1]||o[2])||!r||this.rules.inline.punctuation.exec(r))){let i=[...o[0]].length-1,n,s,a=i,c=0,l=o[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(l.lastIndex=0,t=t.slice(-1*e.length+i);(o=l.exec(t))!=null;){if(n=o[1]||o[2]||o[3]||o[4]||o[5]||o[6],!n)continue;if(s=[...n].length,o[3]||o[4]){a+=s;continue}else if((o[5]||o[6])&&i%3&&!((i+s)%3)){c+=s;continue}if(a-=s,a>0)continue;s=Math.min(s,s+a+c);let f=[...o[0]][0].length,m=e.slice(0,i+o.index+f+s);if(Math.min(i,s)%2){let x=m.slice(1,-1);return{type:"em",raw:m,text:x,tokens:this.lexer.inlineTokens(x)}}let k=m.slice(2,-2);return{type:"strong",raw:m,text:k,tokens:this.lexer.inlineTokens(k)}}}}codespan(e){let t=this.rules.inline.code.exec(e);if(t){let r=t[2].replace(this.rules.other.newLineCharGlobal," "),o=this.rules.other.nonSpaceChar.test(r),i=this.rules.other.startingSpaceChar.test(r)&&this.rules.other.endingSpaceChar.test(r);return o&&i&&(r=r.substring(1,r.length-1)),{type:"codespan",raw:t[0],text:r}}}br(e){let t=this.rules.inline.br.exec(e);if(t)return{type:"br",raw:t[0]}}del(e){let t=this.rules.inline.del.exec(e);if(t)return{type:"del",raw:t[0],text:t[2],tokens:this.lexer.inlineTokens(t[2])}}autolink(e){let t=this.rules.inline.autolink.exec(e);if(t){let r,o;return t[2]==="@"?(r=t[1],o="mailto:"+r):(r=t[1],o=r),{type:"link",raw:t[0],text:r,href:o,tokens:[{type:"text",raw:r,text:r}]}}}url(e){var r;let t;if(t=this.rules.inline.url.exec(e)){let o,i;if(t[2]==="@")o=t[0],i="mailto:"+o;else{let n;do n=t[0],t[0]=((r=this.rules.inline._backpedal.exec(t[0]))==null?void 0:r[0])??"";while(n!==t[0]);o=t[0],t[1]==="www."?i="http://"+t[0]:i=t[0]}return{type:"link",raw:t[0],text:o,href:i,tokens:[{type:"text",raw:o,text:o}]}}}inlineText(e){let t=this.rules.inline.text.exec(e);if(t){let r=this.lexer.state.inRawBlock;return{type:"text",raw:t[0],text:t[0],escaped:r}}}},H=class Qe{constructor(t){R(this,"tokens");R(this,"options");R(this,"state");R(this,"inlineQueue");R(this,"tokenizer");this.tokens=[],this.tokens.links=Object.create(null),this.options=t||pe,this.options.tokenizer=this.options.tokenizer||new Ne,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};let r={other:G,block:Ee.normal,inline:we.normal};this.options.pedantic?(r.block=Ee.pedantic,r.inline=we.pedantic):this.options.gfm&&(r.block=Ee.gfm,this.options.breaks?r.inline=we.breaks:r.inline=we.gfm),this.tokenizer.rules=r}static get rules(){return{block:Ee,inline:we}}static lex(t,r){return new Qe(r).lex(t)}static lexInline(t,r){return new Qe(r).inlineTokens(t)}lex(t){t=t.replace(G.carriageReturn,`
`),this.blockTokens(t,this.tokens);for(let r=0;r<this.inlineQueue.length;r++){let o=this.inlineQueue[r];this.inlineTokens(o.src,o.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(t,r=[],o=!1){var i,n,s;for(this.options.pedantic&&(t=t.replace(G.tabCharGlobal,"    ").replace(G.spaceLine,""));t;){let a;if((n=(i=this.options.extensions)==null?void 0:i.block)!=null&&n.some(l=>(a=l.call({lexer:this},t,r))?(t=t.substring(a.raw.length),r.push(a),!0):!1))continue;if(a=this.tokenizer.space(t)){t=t.substring(a.raw.length);let l=r.at(-1);a.raw.length===1&&l!==void 0?l.raw+=`
`:r.push(a);continue}if(a=this.tokenizer.code(t)){t=t.substring(a.raw.length);let l=r.at(-1);(l==null?void 0:l.type)==="paragraph"||(l==null?void 0:l.type)==="text"?(l.raw+=(l.raw.endsWith(`
`)?"":`
`)+a.raw,l.text+=`
`+a.text,this.inlineQueue.at(-1).src=l.text):r.push(a);continue}if(a=this.tokenizer.fences(t)){t=t.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.heading(t)){t=t.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.hr(t)){t=t.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.blockquote(t)){t=t.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.list(t)){t=t.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.html(t)){t=t.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.def(t)){t=t.substring(a.raw.length);let l=r.at(-1);(l==null?void 0:l.type)==="paragraph"||(l==null?void 0:l.type)==="text"?(l.raw+=(l.raw.endsWith(`
`)?"":`
`)+a.raw,l.text+=`
`+a.raw,this.inlineQueue.at(-1).src=l.text):this.tokens.links[a.tag]||(this.tokens.links[a.tag]={href:a.href,title:a.title},r.push(a));continue}if(a=this.tokenizer.table(t)){t=t.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.lheading(t)){t=t.substring(a.raw.length),r.push(a);continue}let c=t;if((s=this.options.extensions)!=null&&s.startBlock){let l=1/0,f=t.slice(1),m;this.options.extensions.startBlock.forEach(k=>{m=k.call({lexer:this},f),typeof m=="number"&&m>=0&&(l=Math.min(l,m))}),l<1/0&&l>=0&&(c=t.substring(0,l+1))}if(this.state.top&&(a=this.tokenizer.paragraph(c))){let l=r.at(-1);o&&(l==null?void 0:l.type)==="paragraph"?(l.raw+=(l.raw.endsWith(`
`)?"":`
`)+a.raw,l.text+=`
`+a.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=l.text):r.push(a),o=c.length!==t.length,t=t.substring(a.raw.length);continue}if(a=this.tokenizer.text(t)){t=t.substring(a.raw.length);let l=r.at(-1);(l==null?void 0:l.type)==="text"?(l.raw+=(l.raw.endsWith(`
`)?"":`
`)+a.raw,l.text+=`
`+a.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=l.text):r.push(a);continue}if(t){let l="Infinite loop on byte: "+t.charCodeAt(0);if(this.options.silent){console.error(l);break}else throw new Error(l)}}return this.state.top=!0,r}inline(t,r=[]){return this.inlineQueue.push({src:t,tokens:r}),r}inlineTokens(t,r=[]){var c,l,f,m,k;let o=t,i=null;if(this.tokens.links){let x=Object.keys(this.tokens.links);if(x.length>0)for(;(i=this.tokenizer.rules.inline.reflinkSearch.exec(o))!=null;)x.includes(i[0].slice(i[0].lastIndexOf("[")+1,-1))&&(o=o.slice(0,i.index)+"["+"a".repeat(i[0].length-2)+"]"+o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;(i=this.tokenizer.rules.inline.anyPunctuation.exec(o))!=null;)o=o.slice(0,i.index)+"++"+o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);let n;for(;(i=this.tokenizer.rules.inline.blockSkip.exec(o))!=null;)n=i[2]?i[2].length:0,o=o.slice(0,i.index+n)+"["+"a".repeat(i[0].length-n-2)+"]"+o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);o=((l=(c=this.options.hooks)==null?void 0:c.emStrongMask)==null?void 0:l.call({lexer:this},o))??o;let s=!1,a="";for(;t;){s||(a=""),s=!1;let x;if((m=(f=this.options.extensions)==null?void 0:f.inline)!=null&&m.some($=>(x=$.call({lexer:this},t,r))?(t=t.substring(x.raw.length),r.push(x),!0):!1))continue;if(x=this.tokenizer.escape(t)){t=t.substring(x.raw.length),r.push(x);continue}if(x=this.tokenizer.tag(t)){t=t.substring(x.raw.length),r.push(x);continue}if(x=this.tokenizer.link(t)){t=t.substring(x.raw.length),r.push(x);continue}if(x=this.tokenizer.reflink(t,this.tokens.links)){t=t.substring(x.raw.length);let $=r.at(-1);x.type==="text"&&($==null?void 0:$.type)==="text"?($.raw+=x.raw,$.text+=x.text):r.push(x);continue}if(x=this.tokenizer.emStrong(t,o,a)){t=t.substring(x.raw.length),r.push(x);continue}if(x=this.tokenizer.codespan(t)){t=t.substring(x.raw.length),r.push(x);continue}if(x=this.tokenizer.br(t)){t=t.substring(x.raw.length),r.push(x);continue}if(x=this.tokenizer.del(t)){t=t.substring(x.raw.length),r.push(x);continue}if(x=this.tokenizer.autolink(t)){t=t.substring(x.raw.length),r.push(x);continue}if(!this.state.inLink&&(x=this.tokenizer.url(t))){t=t.substring(x.raw.length),r.push(x);continue}let S=t;if((k=this.options.extensions)!=null&&k.startInline){let $=1/0,P=t.slice(1),q;this.options.extensions.startInline.forEach(U=>{q=U.call({lexer:this},P),typeof q=="number"&&q>=0&&($=Math.min($,q))}),$<1/0&&$>=0&&(S=t.substring(0,$+1))}if(x=this.tokenizer.inlineText(S)){t=t.substring(x.raw.length),x.raw.slice(-1)!=="_"&&(a=x.raw.slice(-1)),s=!0;let $=r.at(-1);($==null?void 0:$.type)==="text"?($.raw+=x.raw,$.text+=x.text):r.push(x);continue}if(t){let $="Infinite loop on byte: "+t.charCodeAt(0);if(this.options.silent){console.error($);break}else throw new Error($)}}return r}},De=class{constructor(e){R(this,"options");R(this,"parser");this.options=e||pe}space(e){return""}code({text:e,lang:t,escaped:r}){var n;let o=(n=(t||"").match(G.notSpaceStart))==null?void 0:n[0],i=e.replace(G.endingNewline,"")+`
`;return o?'<pre><code class="language-'+Q(o)+'">'+(r?i:Q(i,!0))+`</code></pre>
`:"<pre><code>"+(r?i:Q(i,!0))+`</code></pre>
`}blockquote({tokens:e}){return`<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}def(e){return""}heading({tokens:e,depth:t}){return`<h${t}>${this.parser.parseInline(e)}</h${t}>
`}hr(e){return`<hr>
`}list(e){let t=e.ordered,r=e.start,o="";for(let s=0;s<e.items.length;s++){let a=e.items[s];o+=this.listitem(a)}let i=t?"ol":"ul",n=t&&r!==1?' start="'+r+'"':"";return"<"+i+n+`>
`+o+"</"+i+`>
`}listitem(e){return`<li>${this.parser.parse(e.tokens)}</li>
`}checkbox({checked:e}){return"<input "+(e?'checked="" ':"")+'disabled="" type="checkbox"> '}paragraph({tokens:e}){return`<p>${this.parser.parseInline(e)}</p>
`}table(e){let t="",r="";for(let i=0;i<e.header.length;i++)r+=this.tablecell(e.header[i]);t+=this.tablerow({text:r});let o="";for(let i=0;i<e.rows.length;i++){let n=e.rows[i];r="";for(let s=0;s<n.length;s++)r+=this.tablecell(n[s]);o+=this.tablerow({text:r})}return o&&(o=`<tbody>${o}</tbody>`),`<table>
<thead>
`+t+`</thead>
`+o+`</table>
`}tablerow({text:e}){return`<tr>
${e}</tr>
`}tablecell(e){let t=this.parser.parseInline(e.tokens),r=e.header?"th":"td";return(e.align?`<${r} align="${e.align}">`:`<${r}>`)+t+`</${r}>
`}strong({tokens:e}){return`<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return`<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return`<code>${Q(e,!0)}</code>`}br(e){return"<br>"}del({tokens:e}){return`<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,tokens:r}){let o=this.parser.parseInline(r),i=nr(e);if(i===null)return o;e=i;let n='<a href="'+e+'"';return t&&(n+=' title="'+Q(t)+'"'),n+=">"+o+"</a>",n}image({href:e,title:t,text:r,tokens:o}){o&&(r=this.parser.parseInline(o,this.parser.textRenderer));let i=nr(e);if(i===null)return Q(r);e=i;let n=`<img src="${e}" alt="${r}"`;return t&&(n+=` title="${Q(t)}"`),n+=">",n}text(e){return"tokens"in e&&e.tokens?this.parser.parseInline(e.tokens):"escaped"in e&&e.escaped?e.text:Q(e.text)}},ft=class{strong({text:e}){return e}em({text:e}){return e}codespan({text:e}){return e}del({text:e}){return e}html({text:e}){return e}text({text:e}){return e}link({text:e}){return""+e}image({text:e}){return""+e}br(){return""}checkbox({raw:e}){return e}},Z=class Ye{constructor(t){R(this,"options");R(this,"renderer");R(this,"textRenderer");this.options=t||pe,this.options.renderer=this.options.renderer||new De,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new ft}static parse(t,r){return new Ye(r).parse(t)}static parseInline(t,r){return new Ye(r).parseInline(t)}parse(t){var o,i;let r="";for(let n=0;n<t.length;n++){let s=t[n];if((i=(o=this.options.extensions)==null?void 0:o.renderers)!=null&&i[s.type]){let c=s,l=this.options.extensions.renderers[c.type].call({parser:this},c);if(l!==!1||!["space","hr","heading","code","table","blockquote","list","html","def","paragraph","text"].includes(c.type)){r+=l||"";continue}}let a=s;switch(a.type){case"space":{r+=this.renderer.space(a);break}case"hr":{r+=this.renderer.hr(a);break}case"heading":{r+=this.renderer.heading(a);break}case"code":{r+=this.renderer.code(a);break}case"table":{r+=this.renderer.table(a);break}case"blockquote":{r+=this.renderer.blockquote(a);break}case"list":{r+=this.renderer.list(a);break}case"checkbox":{r+=this.renderer.checkbox(a);break}case"html":{r+=this.renderer.html(a);break}case"def":{r+=this.renderer.def(a);break}case"paragraph":{r+=this.renderer.paragraph(a);break}case"text":{r+=this.renderer.text(a);break}default:{let c='Token with "'+a.type+'" type was not found.';if(this.options.silent)return console.error(c),"";throw new Error(c)}}}return r}parseInline(t,r=this.renderer){var i,n;let o="";for(let s=0;s<t.length;s++){let a=t[s];if((n=(i=this.options.extensions)==null?void 0:i.renderers)!=null&&n[a.type]){let l=this.options.extensions.renderers[a.type].call({parser:this},a);if(l!==!1||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(a.type)){o+=l||"";continue}}let c=a;switch(c.type){case"escape":{o+=r.text(c);break}case"html":{o+=r.html(c);break}case"link":{o+=r.link(c);break}case"image":{o+=r.image(c);break}case"checkbox":{o+=r.checkbox(c);break}case"strong":{o+=r.strong(c);break}case"em":{o+=r.em(c);break}case"codespan":{o+=r.codespan(c);break}case"br":{o+=r.br(c);break}case"del":{o+=r.del(c);break}case"text":{o+=r.text(c);break}default:{let l='Token with "'+c.type+'" type was not found.';if(this.options.silent)return console.error(l),"";throw new Error(l)}}}return o}},Pe,$e=(Pe=class{constructor(e){R(this,"options");R(this,"block");this.options=e||pe}preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}emStrongMask(e){return e}provideLexer(){return this.block?H.lex:H.lexInline}provideParser(){return this.block?Z.parse:Z.parseInline}},R(Pe,"passThroughHooks",new Set(["preprocess","postprocess","processAllTokens","emStrongMask"])),R(Pe,"passThroughHooksRespectAsync",new Set(["preprocess","postprocess","processAllTokens"])),Pe),pi=class{constructor(...e){R(this,"defaults",it());R(this,"options",this.setOptions);R(this,"parse",this.parseMarkdown(!0));R(this,"parseInline",this.parseMarkdown(!1));R(this,"Parser",Z);R(this,"Renderer",De);R(this,"TextRenderer",ft);R(this,"Lexer",H);R(this,"Tokenizer",Ne);R(this,"Hooks",$e);this.use(...e)}walkTokens(e,t){var o,i;let r=[];for(let n of e)switch(r=r.concat(t.call(this,n)),n.type){case"table":{let s=n;for(let a of s.header)r=r.concat(this.walkTokens(a.tokens,t));for(let a of s.rows)for(let c of a)r=r.concat(this.walkTokens(c.tokens,t));break}case"list":{let s=n;r=r.concat(this.walkTokens(s.items,t));break}default:{let s=n;(i=(o=this.defaults.extensions)==null?void 0:o.childTokens)!=null&&i[s.type]?this.defaults.extensions.childTokens[s.type].forEach(a=>{let c=s[a].flat(1/0);r=r.concat(this.walkTokens(c,t))}):s.tokens&&(r=r.concat(this.walkTokens(s.tokens,t)))}}return r}use(...e){let t=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach(r=>{let o={...r};if(o.async=this.defaults.async||o.async||!1,r.extensions&&(r.extensions.forEach(i=>{if(!i.name)throw new Error("extension name required");if("renderer"in i){let n=t.renderers[i.name];n?t.renderers[i.name]=function(...s){let a=i.renderer.apply(this,s);return a===!1&&(a=n.apply(this,s)),a}:t.renderers[i.name]=i.renderer}if("tokenizer"in i){if(!i.level||i.level!=="block"&&i.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let n=t[i.level];n?n.unshift(i.tokenizer):t[i.level]=[i.tokenizer],i.start&&(i.level==="block"?t.startBlock?t.startBlock.push(i.start):t.startBlock=[i.start]:i.level==="inline"&&(t.startInline?t.startInline.push(i.start):t.startInline=[i.start]))}"childTokens"in i&&i.childTokens&&(t.childTokens[i.name]=i.childTokens)}),o.extensions=t),r.renderer){let i=this.defaults.renderer||new De(this.defaults);for(let n in r.renderer){if(!(n in i))throw new Error(`renderer '${n}' does not exist`);if(["options","parser"].includes(n))continue;let s=n,a=r.renderer[s],c=i[s];i[s]=(...l)=>{let f=a.apply(i,l);return f===!1&&(f=c.apply(i,l)),f||""}}o.renderer=i}if(r.tokenizer){let i=this.defaults.tokenizer||new Ne(this.defaults);for(let n in r.tokenizer){if(!(n in i))throw new Error(`tokenizer '${n}' does not exist`);if(["options","rules","lexer"].includes(n))continue;let s=n,a=r.tokenizer[s],c=i[s];i[s]=(...l)=>{let f=a.apply(i,l);return f===!1&&(f=c.apply(i,l)),f}}o.tokenizer=i}if(r.hooks){let i=this.defaults.hooks||new $e;for(let n in r.hooks){if(!(n in i))throw new Error(`hook '${n}' does not exist`);if(["options","block"].includes(n))continue;let s=n,a=r.hooks[s],c=i[s];$e.passThroughHooks.has(n)?i[s]=l=>{if(this.defaults.async&&$e.passThroughHooksRespectAsync.has(n))return(async()=>{let m=await a.call(i,l);return c.call(i,m)})();let f=a.call(i,l);return c.call(i,f)}:i[s]=(...l)=>{if(this.defaults.async)return(async()=>{let m=await a.apply(i,l);return m===!1&&(m=await c.apply(i,l)),m})();let f=a.apply(i,l);return f===!1&&(f=c.apply(i,l)),f}}o.hooks=i}if(r.walkTokens){let i=this.defaults.walkTokens,n=r.walkTokens;o.walkTokens=function(s){let a=[];return a.push(n.call(this,s)),i&&(a=a.concat(i.call(this,s))),a}}this.defaults={...this.defaults,...o}}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return H.lex(e,t??this.defaults)}parser(e,t){return Z.parse(e,t??this.defaults)}parseMarkdown(e){return(t,r)=>{let o={...r},i={...this.defaults,...o},n=this.onError(!!i.silent,!!i.async);if(this.defaults.async===!0&&o.async===!1)return n(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof t>"u"||t===null)return n(new Error("marked(): input parameter is undefined or null"));if(typeof t!="string")return n(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(t)+", string expected"));if(i.hooks&&(i.hooks.options=i,i.hooks.block=e),i.async)return(async()=>{let s=i.hooks?await i.hooks.preprocess(t):t,a=await(i.hooks?await i.hooks.provideLexer():e?H.lex:H.lexInline)(s,i),c=i.hooks?await i.hooks.processAllTokens(a):a;i.walkTokens&&await Promise.all(this.walkTokens(c,i.walkTokens));let l=await(i.hooks?await i.hooks.provideParser():e?Z.parse:Z.parseInline)(c,i);return i.hooks?await i.hooks.postprocess(l):l})().catch(n);try{i.hooks&&(t=i.hooks.preprocess(t));let s=(i.hooks?i.hooks.provideLexer():e?H.lex:H.lexInline)(t,i);i.hooks&&(s=i.hooks.processAllTokens(s)),i.walkTokens&&this.walkTokens(s,i.walkTokens);let a=(i.hooks?i.hooks.provideParser():e?Z.parse:Z.parseInline)(s,i);return i.hooks&&(a=i.hooks.postprocess(a)),a}catch(s){return n(s)}}}onError(e,t){return r=>{if(r.message+=`
Please report this to https://github.com/markedjs/marked.`,e){let o="<p>An error occurred:</p><pre>"+Q(r.message+"",!0)+"</pre>";return t?Promise.resolve(o):o}if(t)return Promise.reject(r);throw r}}},ce=new pi;function E(e,t){return ce.parse(e,t)}E.options=E.setOptions=function(e){return ce.setOptions(e),E.defaults=ce.defaults,zr(E.defaults),E};E.getDefaults=it;E.defaults=pe;E.use=function(...e){return ce.use(...e),E.defaults=ce.defaults,zr(E.defaults),E};E.walkTokens=function(e,t){return ce.walkTokens(e,t)};E.parseInline=ce.parseInline;E.Parser=Z;E.parser=Z.parse;E.Renderer=De;E.TextRenderer=ft;E.Lexer=H;E.lexer=H.lex;E.Tokenizer=Ne;E.Hooks=$e;E.parse=E;E.options;E.setOptions;E.use;E.walkTokens;E.parseInline;Z.parse;H.lex;E.setOptions({gfm:!0,breaks:!0,async:!1});function ut(e){try{return E.parse(e)}catch{return h(e).replace(/\n/g,"<br>")}}function qr(e){try{return JSON.stringify(e,null,2)}catch{return String(e)}}function J(e){return e instanceof Error?e.message:String(e)}function Nr(e){if(e&&typeof e=="object"&&!Array.isArray(e))return e}function T(e){return typeof e=="string"?e:void 0}function K(e){if(typeof e=="number"&&Number.isFinite(e))return e;if(typeof e=="string"&&e.trim().length>0){const t=Number(e);if(Number.isFinite(t))return t}}function h(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function Dr(e){if(e==="idle"||e==="starting"||e==="running"||e==="completed"||e==="stopped"||e==="error")return e}function fi(e){switch(e.toLowerCase()){case"proposer":return"Proposer";case"critic":return"Critic";case"synthesizer":return"Synthesizer";case"arbiter":return"Arbiter";case"researcher":return"Researcher";case"verifier":return"Verifier";default:return e||"Member"}}function dr(e){switch(e.toLowerCase()){case"openai":return"OpenAI";case"openai_compatible":return"OpenAI Compatible";case"anthropic":return"Anthropic";case"google":return"Google";case"deepseek":return"DeepSeek";default:return e||"Provider"}}function ui(e){return e===b.leaderParticipantId?b.participantLabels[e]??"秘书（你的分身）":b.participantLabels[e]??`Member · ${e}`}function gi(e){if(!Array.isArray(e))return;const t=new Map(d.participants.map(o=>[o.participantId,o])),r=e.map(o=>Nr(o)).filter(o=>o!==void 0).map(o=>{const i=T(o.participant_id)??"unknown",n=t.get(i);return{participantId:i,role:T(o.role)??(n==null?void 0:n.role)??"-",provider:T(o.provider)??(n==null?void 0:n.provider)??"-",modelId:T(o.model_id)??(n==null?void 0:n.modelId)??"-",status:(n==null?void 0:n.status)??"pending",latencyMs:n==null?void 0:n.latencyMs}});d.participants=r;for(const o of r){const i=o.participantId===b.leaderParticipantId?`秘书（你的分身） · ${dr(o.provider)}/${o.modelId}`:`${fi(o.role)} · ${dr(o.provider)}/${o.modelId}`;b.participantLabels[o.participantId]=i}}function ae(e,t){const r=Ir(e);r&&re(r.officeId,t)}function lr(e){return!b.open||!e?!1:b.sessionId?b.sessionId===e:!b.aiThinking&&!b.creating||d.sessionOfficeMap[e]?!1:(b.sessionId=e,!0)}function bi(e,t){const r=Nr(t);if(!r)return;const o=T(r.session_id);if(o&&!(b.open&&(b.sessionId===o||!b.sessionId&&(b.aiThinking||b.creating)))&&(d.sessionId=o,!d.sessionOfficeMap[o])){const m=W();m&&rt(o,m.officeId)}const i=T(r.status),n=Dr(i);n&&(d.runStatus=n);const s=K(r.turn_index)??K(r.current_turn)??K(r.total_turns);s!==void 0&&(d.turnIndex=s);const a=K(r.total_tokens);a!==void 0&&(d.totalTokens=a);const c=K(r.total_cost);c!==void 0&&(d.totalCost=c);const l=K(r.agreement_score)??K(r.final_agreement);l!==void 0&&(d.agreementScore=l),o&&ae(o,{status:n,turnIndex:s,agreementScore:l,totalTokens:a,totalCost:c,lastSummary:typeof r.stop_reason=="string"?`会议结束：${r.stop_reason}`:i?`会话状态更新：${i}`:void 0})}function mi(e){const t=e.method;if(!t)return;const r=e.params??{};Sr(t,r);const o=T(r.session_id);if(t==="session/state"){const i=T(r.session_id),n=T(r.status),s=T(r.reason),a=Dr(n);i&&(d.sessionId=i),a&&(d.runStatus=a),i&&ae(i,{status:a,lastSummary:n?s?`状态：${n}，${s}`:`状态：${n}`:void 0})}if(t==="session/progress"){const i=K(r.turn_index),n=K(r.total_tokens),s=K(r.total_cost),a=K(r.agreement_score);i!==void 0&&(d.turnIndex=i),n!==void 0&&(d.totalTokens=n),s!==void 0&&(d.totalCost=s),a!==void 0&&(d.agreementScore=a),o&&ae(o,{status:"running",turnIndex:i,agreementScore:a,totalTokens:n,totalCost:s,lastSummary:a!==void 0?`第 ${i??0} 轮，共识 ${a.toFixed(3)}`:void 0})}if(t==="session/participants"&&gi(r.participants),t==="turn/complete"){const i=T(r.participant_id),n=T(r.status)??"unknown",s=lr(o);i&&So(i,{status:n,latencyMs:K(r.latency_ms)}),o&&i&&ae(o,{lastSummary:`${i} 已完成，状态：${n}`}),s&&(b.aiThinking=!1)}if(t==="turn/chunk"){const i=T(r.participant_id)??"unknown",n=T(r.session_id)??d.sessionId,s=K(r.turn_index)??d.turnIndex,a=T(r.delta)??"",c=lr(n);if(Io({time:new Date().toISOString(),sessionId:n,turnIndex:s,participantId:i,delta:a}),ae(n,{status:"running",turnIndex:s,lastSummary:`${i} 正在输出第 ${s} 轮内容`}),c&&a){const l=ui(i),f=`${n}:${s}:${i}`,m=[...b.messages].reverse().find(k=>(k==null?void 0:k.sender)==="ai"&&(k==null?void 0:k.streamKey)===f);m?m.text+=a:B("ai",a,void 0,{participantId:i,authorLabel:l,streamKey:f})}}if(t==="workflow/step"){const i=T(r.session_id)??d.sessionId,n=T(r.name)??"step",s=T(r.status)??"unknown",a=T(r.kind)??"workflow";i&&ae(i,{status:"running",lastSummary:`workflow ${a}/${n}: ${s}`})}if(t==="workflow/complete"){const i=T(r.session_id)??d.sessionId,n=T(r.status)??"completed",s=K(r.steps_total),a=K(r.steps_error);i&&ae(i,{status:n==="completed"?"running":"error",lastSummary:s!==void 0?`workflow 结束：${n}，步骤 ${s}，失败 ${a??0}`:`workflow 结束：${n}`})}}const hi={developer:["proposer","synthesizer","critic"],frontend:["proposer","synthesizer","critic"],tester:["verifier","critic","researcher"],product_manager:["proposer","synthesizer","arbiter"],mathematician:["verifier","researcher","critic"],researcher:["researcher","critic","verifier"],architect:["synthesizer","arbiter","proposer"],reviewer:["critic","verifier","arbiter"]},xi=["developer","frontend","tester","product_manager","mathematician"],vi=["critic","researcher","synthesizer","verifier","arbiter"];function wi(e){return e!==void 0}function ki(e){return e.split(/[\n,]+/).map(t=>t.trim()).filter(t=>t.length>0)}function yi(e,t){const r=e.trim();if(!r)return null;try{return JSON.parse(r)}catch{throw new Error(`绠楀瓙 ${t} 鐨?config 涓嶆槸鍚堟硶 JSON`)}}function jr(e){return e==="openai"?"OpenAI":e==="openai_compatible"?"OpenAI Compatible":e==="anthropic"?"Anthropic":e==="google"?"Google":"DeepSeek"}function $i(e){return e==="proposer"?"Proposer":e==="critic"?"Critic":e==="researcher"?"Researcher":e==="verifier"?"Verifier":e==="synthesizer"?"Synthesizer":"Arbiter"}function cr(e){return e==="developer"?"工程师":e==="frontend"?"前端工程师":e==="tester"?"测试工程师":e==="product_manager"?"产品经理":e==="mathematician"?"数学家":e==="researcher"?"研究员":e==="architect"?"架构师":"审查者"}function Ii(){const e=d.globalApis.map((n,s)=>{const a=n.modelId.trim(),c=n.apiKey.trim()||d.apiKeys[n.provider].trim();if(!(!a||!c))return{index:s,name:n.name.trim()||`API ${s+1}`,duty:Kr(n.duty),provider:n.provider,modelId:a}}).filter(n=>n!==void 0);if(e.length===0)return["[API Staffing Snapshot]","No ready API found (missing model id or key). Ask user to add API config first."].join(`
`);const t=new Set(e.map(n=>n.provider)),r=new Set(e.map(n=>n.duty)),o=xi.filter(n=>!r.has(n)),i=["[API Staffing Snapshot]",...e.map((n,s)=>`${s+1}. ${n.name} | duty=${cr(n.duty)} | provider=${jr(n.provider)} | model=${n.modelId}`),`ready_api_count=${e.length}`,`provider_count=${t.size}`,`missing_required_duties=${o.length>0?o.map(n=>cr(n)).join(", "):"none"}`];return t.size<=1&&e.length>=2&&i.push("provider_diversity_warning=all APIs are from one vendor; ask user whether to add cross-vendor APIs for independent thinking."),i.join(`
`)}function Si(e){const t=Ii();return["[Secretary Collaboration Mode]","The leader acts as the user's Chief of Staff (secretary), not a unilateral decision maker.","0) Start each new planning dialogue with: '总，今天想做什么？'.","1) Restate the goal and constraints, then assign each available API a concrete persona and responsibility.","2) Force multi-role collaboration: engineering, frontend, testing, math/algorithm, and product decision review.","3) Produce a concrete plan with sections: architecture(frontend/backend/info flow), milestones, workflow steps, risks, and acceptance criteria.","4) Do not jump to final answer immediately; require at least one visible cross-review round from other participants (feasibility/risk/missing details).","5) If staffing is insufficient (too few APIs, missing required duties, or poor provider diversity), explicitly ask user to add/reconfigure APIs before finalizing.","6) Prefer cross-vendor pairing for key roles to avoid tunnel vision (e.g., frontend/tester/math from different providers when possible).",e?"7) The secretary may finalize on behalf of the user only when explicit authorization is already provided in this session; if authorization is missing or ambiguous, ask for confirmation first.":"7) The secretary must not make final decisions; always hand over a clear confirmation checkpoint to the user before finalizing.","8) Before execution, ask user for final approval on workflow unless already authorized.","9) Always output 'Team Roster' and 'Execution Workflow' in a structured way.",t].join(`
`)}function Kr(e){return e&&(e==="developer"||e==="frontend"||e==="tester"||e==="product_manager"||e==="mathematician"||e==="researcher"||e==="architect"||e==="reviewer")?e:"developer"}function zi(e){const t=d.dutyRolePolicy[e];return Array.isArray(t)&&t.length>0?t:hi[e]??["proposer","critic","researcher"]}function Ai(e,t){const r=zi(e).filter(s=>s!=="proposer"),o=r.length>0?r:vi;let i=o[0]??"critic",n=Number.MAX_SAFE_INTEGER;for(const s of o){const a=t[s]??0;a<n&&(n=a,i=s)}return i}function _i(){if(d.globalApis.length===0)return M("[guide] buildGuideParticipantsFromGlobal: no global API config"),[];const e=[],t={};let r=!1;const o=d.activeGlobalApiIndex>=0&&d.activeGlobalApiIndex<d.globalApis.length?d.activeGlobalApiIndex:0;return d.globalApis.forEach((i,n)=>{const s=i.provider,a=i.modelId.trim();if(!a){M(`[guide] skip api index=${n}: no modelId for provider=${s}`);return}const c=i.endpoint.trim()||(s==="openai_compatible"?d.openaiCompatibleEndpoint.trim():s==="anthropic"?d.anthropicCompatibleEndpoint.trim():""),l=i.apiKey.trim()||d.apiKeys[s].trim(),f=Kr(i.duty),m=n===o?"proposer":Ai(f,t);if(!l){M(`[guide] skip api index=${n}: missing api key for provider=${s}`);return}e.push({participant_id:`guide-${m}-${n+1}`,role:m,provider:s,model_id:a,endpoint:c||void 0,api_key:l||void 0}),t[m]=(t[m]??0)+1;const k=`guide-${m}-${n+1}`;!r&&n===o?(b.leaderParticipantId=k,r=!0):!r&&m==="proposer"&&(b.leaderParticipantId=`guide-${m}-${n+1}`,r=!0);const x=jr(s),S=$i(m);b.participantLabels[k]=n===o?`秘书（你的分身） · ${x}/${a}`:`${i.name.trim()||S}（${S}） · ${x}/${a}`,M(`[guide] participant#${n+1}: role=${m}, provider=${s}, model=${a}, endpoint=${c||"(default)"}, hasKey=${l.length>0}`)}),e}function Ei(){return{chain:[{name:"sanitize_input",enabled:!0,config:null},{name:"context_window",enabled:!0,config:null},{name:"participant_selector",enabled:!0,config:{max_participants:5}},{name:"role_response_format",enabled:!0,config:{include_checklist:!1,json_mode:!1}},{name:"guide_collaboration",enabled:!0,config:{instruction:Si(b.secretaryCanFinalize),leader_participant_id:b.leaderParticipantId||null,require_visible_reasoning_path:!0}},{name:"review_instruction",enabled:!1,config:null},{name:"review_findings",enabled:!1,config:null},{name:"output_guard",enabled:!0,config:null}]}}function Ri(){return{enabled:!1,language:"zh-CN",min_severity:"MEDIUM",max_findings:6,require_evidence:!0,categories:["correctness","feasibility","risk"]}}async function Gr(){var e;try{const t=await ie("orchestrator_status");d.orchestratorRunning=!!((e=t.data)!=null&&e.running),!d.orchestratorRunning&&d.runStatus==="running"&&(d.runStatus="stopped")}catch(t){d.orchestratorRunning=!1,M(`orchestrator_status failed: ${J(t)}`)}}async function Pi(){d.runStatus="starting";try{const e=await ie("start_orchestrator");return d.orchestratorRunning=e.success,d.runStatus=e.success?"running":"error",M(`start_orchestrator: ${qr(e.data)}`),e.success?{ok:!0,message:"寮曟搸鍚姩鎴愬姛"}:{ok:!1,message:`寮曟搸鍚姩澶辫触${e.error?"锛?{result.error}":""}`}}catch(e){d.orchestratorRunning=!1,d.runStatus="error";const t="寮曟搸鍚姩澶辫触锛?{toErrorMessage(error)}";return M(`start_orchestrator failed: ${J(e)}`),{ok:!1,message:t}}}async function xe(e,t){if(!d.orchestratorRunning)throw new Error("orchestrator not running");const r=await ie("send_rpc",{method:e,params:t??null});return bi(e,r),M(`rpc ${e} -> ${qr(r)}`),r}async function Ci(){try{return await xe("config/setKeys",{openai:d.apiKeys.openai,openai_compatible:d.apiKeys.openai_compatible,anthropic:d.apiKeys.anthropic,google:d.apiKeys.google,deepseek:d.apiKeys.deepseek}),{ok:!0,message:"API keys synced"}}catch(e){const t=`Failed to sync API keys: ${J(e)}`;return M(`config/setKeys failed: ${J(e)}`),{ok:!1,message:t}}}async function Je(){const e=W();if(!e)return{ok:!1,message:"Please create an office first"};try{const t=ki(d.review.categoriesText),r=e.objective.trim(),o=d.operators.filter(c=>c.name.trim().length>0).map(c=>({name:c.name.trim(),enabled:c.enabled,config:yi(c.configText,c.name.trim())})),i=e.members.filter(c=>c.enabled).map(c=>{var l,f;return{participant_id:c.participantId,role:c.role,provider:c.provider,model_id:c.modelId,endpoint:((l=c.endpoint)==null?void 0:l.trim())||void 0,api_key:((f=c.apiKey)==null?void 0:f.trim())||void 0}});if(!r)throw new Error("Please fill in office objective first");if(!Number.isFinite(e.maxRounds)||e.maxRounds<1||e.maxRounds>20)throw new Error("杞闇€瑕佸湪 1 鍒?20 涔嬮棿");if(i.some(c=>!c.model_id.trim()))throw new Error("鍚敤鎴愬憳蹇呴』濉啓妯″瀷 ID");if(i.length<2)throw new Error("Enable at least 2 AI members to start discussion");if(t.length===0)throw new Error("review categories 涓嶈兘涓虹┖");if(o.filter(c=>c.enabled).length===0)throw new Error("Enable at least one operator");re(e.officeId,{status:"starting",turnIndex:0,lastSummary:"鍔炲叕瀹や細璁惎鍔ㄤ腑..."});const s=await xe("session/start",{task:r,participants:i,policy:{stop:{max_rounds:e.maxRounds}},review:{enabled:d.review.enabled,language:d.review.language,min_severity:d.review.minSeverity,max_findings:d.review.maxFindings,require_evidence:d.review.requireEvidence,categories:t},operators:{chain:o}}),a=typeof s.session_id=="string"?s.session_id:"";return a?(rt(a,e.officeId),re(e.officeId,{sessionId:a,status:"running"}),d.sessionId=a,{ok:!0,message:`Office started: ${a}`,sessionId:a}):(re(e.officeId,{status:"running",lastSummary:"session/start sent, waiting for session ID"}),{ok:!0,message:"Office debate started"})}catch(t){const r=J(t);return M(`startOfficeDebate failed: ${r}`),re(e.officeId,{status:"error",lastSummary:`Start failed: ${r}`}),d.runStatus="error",{ok:!1,message:`Start failed: ${r}`}}}async function Br(e){const t=e.trim();if(!t)return{ok:!1,message:"Please enter a message first"};try{const r={message:t};return d.sessionId!=="-"&&(r.session_id=d.sessionId),await xe("chat/send",r),{ok:!0,message:"Message sent"}}catch(r){const o=J(r);return M(`chat/send failed: ${o}`),{ok:!1,message:`Send failed: ${o}`}}}async function Ti(){if(d.sessionId==="-")return M("chat/stop skipped: no active session"),{ok:!1,message:"No active session to stop"};const e=d.sessionId;try{await xe("chat/stop",{session_id:e});const t=Ir(e);return t&&re(t.officeId,{status:"stopped",lastSummary:"Session stopped"}),{ok:!0,message:"Stop command sent"}}catch(t){const r=J(t);return M(`chat/stop failed: ${r}`),{ok:!1,message:`Stop failed: ${r}`}}}async function Li(e){const t=W();if(!t)return{ok:!1,message:"Please create an office first"};const r=e.trim();if(!r)return{ok:!1,message:"璇峰厛杈撳叆 workflow JSON"};let o;try{o=JSON.parse(r)}catch{return{ok:!1,message:"workflow JSON 瑙ｆ瀽澶辫触"}}const i={...o,session_id:d.sessionId!=="-"?d.sessionId:void 0,continue_chat:typeof o.continue_chat=="boolean"?o.continue_chat:!0,followup_prompt:typeof o.followup_prompt=="string"?o.followup_prompt:"I have executed the workflow steps. Continue the coding plan and propose the next actionable change."};try{const n=await xe("workflow/execute",i),s=typeof n.session_id=="string"?n.session_id:"";s&&(rt(s,t.officeId),re(t.officeId,{sessionId:s,status:"running",lastSummary:"Workflow executed and fed back into session"}),d.sessionId=s);const a=Number(n.steps_total??0),c=Number(n.steps_error??0);return{ok:!0,message:c>0?`Workflow done: ${a} steps, ${c} failed`:`Workflow done: ${a} steps`,sessionId:s||void 0}}catch(n){const s=J(n);return M(`workflow/execute failed: ${s}`),{ok:!1,message:`Workflow failed: ${s}`}}}async function Oi(e){if(!d.orchestratorRunning)return{ok:!1,message:"Engine is not running. Start the engine first."};const t=e.trim();if(!t)return{ok:!1,message:"Please enter a message first"};try{const r=_i(),o={message:t};if(r.length>0)o.participants=r,o.operators=Ei(),o.review=Ri();else{const c=W();if(c){const l=c.members.filter(f=>f.enabled).map(f=>{var m,k;return{participant_id:f.participantId,role:f.role,provider:f.provider,model_id:f.modelId,endpoint:((m=f.endpoint)==null?void 0:m.trim())||void 0,api_key:((k=f.apiKey)==null?void 0:k.trim())||void 0}});l.length>0&&(o.participants=l)}}b.sessionId&&(o.session_id=b.sessionId);const i=await xe("chat/send",o),n=typeof i.session_id=="string"?i.session_id:"";n&&!b.sessionId&&(b.sessionId=n);const a=(Array.isArray(i.outputs)?i.outputs:[]).map(c=>{const l=c,f=typeof l.participant_id=="string"?l.participant_id:"",m=typeof l.status=="string"?l.status:"unknown",k=typeof l.content=="string"?l.content:"",x=typeof l.latency_ms=="number"?l.latency_ms:void 0,S=l.error&&typeof l.error=="object"?l.error:void 0,$=S&&typeof S.code=="string"?S.code:void 0,P=S&&typeof S.message=="string"?S.message:void 0;if(f)return{participantId:f,status:m,content:k,latencyMs:x,errorCode:$,errorMessage:P}}).filter(wi);return{ok:!0,message:"Message sent",sessionId:n||void 0,outputs:a}}catch(r){const o=J(r);return M(`sendGuideChat failed: ${o}`),{ok:!1,message:`Send failed: ${o}`}}}const Mi="modulepreload",qi=function(e){return"/"+e},pr={},Ni=function(t,r,o){let i=Promise.resolve();if(r&&r.length>0){document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),a=(s==null?void 0:s.nonce)||(s==null?void 0:s.getAttribute("nonce"));i=Promise.allSettled(r.map(c=>{if(c=qi(c),c in pr)return;pr[c]=!0;const l=c.endsWith(".css"),f=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${f}`))return;const m=document.createElement("link");if(m.rel=l?"stylesheet":Mi,l||(m.as="script"),m.crossOrigin="",m.href=c,a&&m.setAttribute("nonce",a),document.head.appendChild(m),l)return new Promise((k,x)=>{m.addEventListener("load",k),m.addEventListener("error",()=>x(new Error(`Unable to preload CSS for ${c}`)))})}))}function n(s){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=s,window.dispatchEvent(a),!a.defaultPrevented)throw s}return i.then(s=>{for(const a of s||[])a.status==="rejected"&&n(a.reason);return t().catch(n)})};function Fr(e){return/^\[[^\]]+ thinking\.\.\.\]\s*$/.test(e.trim())}function me(e){return typeof e=="string"?e:""}const fr=["proposer","critic","researcher","verifier","synthesizer","arbiter"];let Oe={};function Di(e){const t=e.toLowerCase();if(t.includes("产品经理")||t.includes("product manager")||t.includes("pm"))return"product_manager";if(t.includes("前端")||t.includes("frontend"))return"frontend";if(t.includes("测试")||t.includes("qa")||t.includes("tester"))return"tester";if(t.includes("数学")||t.includes("mathematic"))return"mathematician";if(t.includes("研究")||t.includes("research"))return"researcher";if(t.includes("架构")||t.includes("architect"))return"architect";if(t.includes("审查")||t.includes("reviewer"))return"reviewer";if(t.includes("工程")||t.includes("developer")||t.includes("backend"))return"developer"}function ji(e){const t=e.toLowerCase();if(t.includes("proposer")||t.includes("提案"))return"proposer";if(t.includes("critic")||t.includes("质疑"))return"critic";if(t.includes("synthesizer")||t.includes("整合"))return"synthesizer";if(t.includes("arbiter")||t.includes("裁决"))return"arbiter";if(t.includes("researcher")||t.includes("调研"))return"researcher";if(t.includes("verifier")||t.includes("验证"))return"verifier"}function Ki(e){const t=e.toLowerCase();if(t.includes("openai compatible")||t.includes("openai_compatible")||t.includes("兼容"))return"openai_compatible";if(t.includes("anthropic")||t.includes("claude"))return"anthropic";if(t.includes("google")||t.includes("gemini"))return"google";if(t.includes("deepseek"))return"deepseek";if(t.includes("openai")||t.includes("gpt"))return"openai"}function Gi(e){const t=e.match(/(?:model(?:_id)?|模型)\s*[:=：]\s*([A-Za-z0-9._:-]+)/i);if(t&&t[1])return t[1].trim();const r=e.match(/\/(\s*[A-Za-z0-9._:-]{3,})\s*(?:$|\||,)/);if(r&&r[1])return r[1].trim()}function Bi(e){const t=e.match(/\bapi\s*[-_#]?\s*(\d{1,2})\b/i);if(t&&t[1]){const o=Number(t[1]);if(Number.isInteger(o)&&o>=1)return o-1}const r=e.match(/接口\s*(\d{1,2})/);if(r&&r[1]){const o=Number(r[1]);if(Number.isInteger(o)&&o>=1)return o-1}}function Fi(e){const t=_e(),r=t[0]??"openai";return e.map((i,n)=>{const s=Bi(i),a=s!==void 0&&s>=0&&s<d.globalApis.length?d.globalApis[s]:void 0,c=Di(i)??F(a==null?void 0:a.duty),l=ji(i)??(c?on(c):void 0)??fr[n%fr.length],f=Ki(i)??(a==null?void 0:a.provider)??kt(l,t,r),m=Gi(i)??(a==null?void 0:a.modelId.trim())??ze(f),k=(a==null?void 0:a.endpoint.trim())||(f==="openai_compatible"?d.openaiCompatibleEndpoint.trim():f==="anthropic"?d.anthropicCompatibleEndpoint.trim():"");return{participantId:`draft-${l}-${n+1}`,provider:f,modelId:m,endpoint:k,apiKey:(a==null?void 0:a.apiKey.trim())??"",role:l,enabled:!0}}).filter(i=>i.modelId.trim().length>0).slice(0,8)}function Wi(e,t){const r={proposer:0,critic:0,synthesizer:0,arbiter:0,researcher:0,verifier:0};return t.map(o=>(r[o.role]+=1,{...o,participantId:`${e}-${o.role}-${r[o.role]}`,enabled:!0}))}function Ui(e){const t=e.toLowerCase();return t.includes("team roster")||t.includes("团队分工")||t.includes("成员分工")||t.includes("分工表")}function Hi(e){const t=e.toLowerCase();return t.includes("execution workflow")||t.includes("workflow")||t.includes("执行流程")||t.includes("实施步骤")||t.includes("里程碑")}function Zi(e){return/^[-*•]\s+/.test(e)||/^\d+[.)、]\s+/.test(e)}function Vi(e){return e.replace(/^[-*•]\s+/,"").replace(/^\d+[.)、]\s+/,"").trim()}function Wr(e){const t={team:[],workflow:[]},r=e.split(/\r?\n/).map(i=>i.trim()).filter(i=>i.length>0);let o=null;for(const i of r){if(Ui(i)){o="team";continue}if(Hi(i)){o="workflow";continue}if(o){if(Zi(i)){const n=Vi(i);n&&t[o].push(n);continue}if(i.includes("|")&&!/^[-|:\s]+$/.test(i)){const n=i.replace(/\|/g," / ").replace(/\s+/g," ").trim();t[o].push(n);continue}if(i.length<=96&&/[:：]/.test(i)){t[o].push(i);continue}o=null}}return t.team=Array.from(new Set(t.team)).slice(0,12),t.workflow=Array.from(new Set(t.workflow)).slice(0,12),t}function Qi(e,t){const r=Wr(e);if(r.team.length===0&&r.workflow.length===0)return delete Oe[t],"";const o=Fi(r.team);o.length>=2?Oe[t]=o:delete Oe[t];const i=(n,s)=>s.length===0?"":`
      <div class="guide-structured-card">
        <div class="guide-structured-title">${h(n)}</div>
        <ul class="guide-structured-list">
          ${s.map(a=>`<li>${h(a)}</li>`).join("")}
        </ul>
      </div>
    `;return`
    <div class="guide-structured">
      ${i("Team Roster",r.team)}
      ${i("Execution Workflow",r.workflow)}
      ${o.length>=2?`<div class="guide-structured-actions">
            <button
              class="guide-msg-action guide-structured-apply"
              data-guide-action="apply-roster"
              data-guide-message-id="${t}"
            >一键套用到办公室成员</button>
          </div>`:""}
    </div>
  `}function Yi(){var o;const e=(o=[...b.messages].reverse().find(i=>(i==null?void 0:i.sender)==="user"))==null?void 0:o.text,t=me(e).toLowerCase();return t?["同意","批准","拍板","执行吧","开始执行","可以执行","同意执行","approved","approve","go ahead","ship it"].some(i=>t.includes(i)):!1}function ur(e){if(!e)return 0;const t=Date.parse(e);return Number.isFinite(t)?t:0}function Ji(e){const t=ur(e),r=d.chunks.filter(o=>b.sessionId&&o.sessionId===b.sessionId?!0:t<=0?!1:ur(o.time)>=t-1e3).slice(0,8).reverse();return r.length===0?"":r.map(o=>`
        <div class="guide-msg guide-msg-system guide-msg-chunk-fallback">
          <div class="guide-msg-role">🛰️ 实时片段 · ${h(o.participantId)} · 第${o.turnIndex}轮</div>
          <div class="guide-msg-text">${h(o.delta)}</div>
        </div>
      `).join("")}function Ur(e){const t=b.messages.findIndex(o=>(o==null?void 0:o.id)===e);return(t>=0?b.messages.slice(t+1):b.messages).some(o=>{const i=me(o==null?void 0:o.text);if(!o||o.sender!=="ai"||i.includes("⚠️ 本轮回复失败"))return!1;const n=i.trim();return n.length>0&&!Fr(n)})}function Xi(e,t){var o,i;if(!(e.length===0||Ur(t)))for(const n of e){if(Fr(n.content))continue;const s=n.participantId===b.leaderParticipantId?b.participantLabels[n.participantId]??"秘书（你的分身）":b.participantLabels[n.participantId]??`成员 · ${n.participantId}`;if(n.status==="success"&&n.content.trim())B("ai",n.content,void 0,{participantId:n.participantId,authorLabel:s});else{const a=(o=n.errorMessage)==null?void 0:o.trim(),c=(i=n.errorCode)==null?void 0:i.trim(),l=a&&c?`${c}: ${a}`:a||c||n.status;B("ai",`⚠️ 本轮回复失败（${l}）`,void 0,{participantId:n.participantId,authorLabel:s})}}}function Hr(){const e=window;return!!(e.__TAURI_INTERNALS__??e.__TAURI__)}async function We(e){if(Hr())try{const{getCurrentWindow:t}=await Ni(async()=>{const{getCurrentWindow:i}=await import("./window-C69C16OR.js");return{getCurrentWindow:i}},[]),r=t();if(e==="minimize"){await r.minimize();return}if(e==="close"){await r.close();return}await r.isMaximized()?await r.unmaximize():await r.maximize()}catch(t){console.error("window control failed",t),z("窗口操作失败，请重试","error")}}function en(){return Hr()?`
    <div class="window-controls" aria-label="window controls">
      <button class="window-control-btn" id="btn-window-minimize" title="最小化" aria-label="最小化">—</button>
      <button class="window-control-btn" id="btn-window-toggle-maximize" title="最大化/还原" aria-label="最大化或还原">□</button>
      <button class="window-control-btn close" id="btn-window-close" title="关闭" aria-label="关闭">✕</button>
    </div>
  `:""}const w=document.querySelector("#app");if(!w)throw new Error("#app not found");const ee=["openai","openai_compatible","anthropic","google","deepseek"],X={openai:"OpenAI",openai_compatible:"OpenAI Compatible",anthropic:"Anthropic",google:"Google",deepseek:"DeepSeek"},Zr=[{value:"developer",label:"开发者"},{value:"frontend",label:"前端工程师"},{value:"tester",label:"测试工程师"},{value:"product_manager",label:"产品经理"},{value:"mathematician",label:"数学家"},{value:"researcher",label:"研究员"},{value:"architect",label:"架构师"},{value:"reviewer",label:"审查者"}],Xe={developer:"开发者",frontend:"前端工程师",tester:"测试工程师",product_manager:"产品经理",mathematician:"数学家",researcher:"研究员",architect:"架构师",reviewer:"审查者"},be=["proposer","critic","synthesizer","arbiter","researcher","verifier"],tn={proposer:"提案",critic:"质疑",synthesizer:"整合",arbiter:"裁决",researcher:"调研",verifier:"验证"},Y={developer:["proposer","synthesizer","critic"],frontend:["proposer","synthesizer","critic"],tester:["verifier","critic","researcher"],product_manager:["proposer","synthesizer","arbiter"],mathematician:["verifier","researcher","critic"],researcher:["researcher","critic","verifier"],architect:["synthesizer","arbiter","proposer"],reviewer:["critic","verifier","arbiter"]},rn=["developer","frontend","tester","product_manager","mathematician"];function oe(e){const t=d.dutyRolePolicy[e];return Array.isArray(t)&&t.length>0?t:Y[e]??["proposer","critic","researcher"]}function on(e){return oe(e)[0]??"proposer"}function nn(e){const r=e.join(`
`).match(/(?:max[_\s-]?rounds|轮次|rounds?)\s*[:=：]?\s*(\d{1,2})/i);return r!=null&&r[1]?se(Number(r[1])):e.length>=8?6:e.length>=5?5:e.length>=3?4:3}function F(e){return e&&(e==="developer"||e==="frontend"||e==="tester"||e==="product_manager"||e==="mathematician"||e==="researcher"||e==="architect"||e==="reviewer")?e:"developer"}const gt=[{id:"openrouter",label:"OpenRouter",endpoint:"https://openrouter.ai/api/v1/chat/completions"},{id:"groq",label:"Groq",endpoint:"https://api.groq.com/openai/v1/chat/completions"},{id:"siliconflow",label:"SiliconFlow",endpoint:"https://api.siliconflow.cn/v1/chat/completions"},{id:"together",label:"Together AI",endpoint:"https://api.together.xyz/v1/chat/completions"},{id:"deepinfra",label:"DeepInfra",endpoint:"https://api.deepinfra.com/v1/openai/chat/completions"},{id:"fireworks",label:"Fireworks AI",endpoint:"https://api.fireworks.ai/inference/v1/chat/completions"},{id:"volcengine-ark",label:"Volcengine Ark",endpoint:"https://ark.cn-beijing.volces.com/api/v3/chat/completions"},{id:"dashscope-compatible",label:"DashScope Compatible",endpoint:"https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"},{id:"rightcode-openai",label:"RightCode (OpenAI)",endpoint:"https://right.codes/codex/v1/chat/completions"},{id:"custom",label:"自定义",endpoint:""}],bt=[{id:"anthropic-official",label:"Anthropic 官方",endpoint:"https://api.anthropic.com"},{id:"aws-bedrock-anthropic",label:"AWS Bedrock (Anthropic)",endpoint:"https://bedrock-runtime.us-east-1.amazonaws.com"},{id:"rightcode-anthropic",label:"RightCode (Claude)",endpoint:"https://www.right.codes/claude-aws"},{id:"custom",label:"自定义",endpoint:""}],mt=[{id:"quick",title:"方案 A · 快速对齐",summary:"快速澄清目标并产出最小可执行计划，适合先跑通。",rounds:2,roles:["proposer","critic","synthesizer"]},{id:"balanced",title:"方案 B · 平衡推进",summary:"提案 + 质疑 + 调研 + 整合，给出 2-3 版路线供你敲定。",rounds:3,roles:["proposer","critic","researcher","synthesizer"]},{id:"research",title:"方案 C · 研究优先",summary:"引入验证视角，降低事实风险与返工概率。",rounds:4,roles:["proposer","critic","researcher","verifier","synthesizer"]},{id:"review",title:"方案 D · 决策闭环",summary:"在多方案基础上加入裁决角色，强制收敛到单一结论。",rounds:4,roles:["proposer","critic","researcher","synthesizer","arbiter"]},{id:"strict",title:"方案 E · 深度审查",summary:"全角色办公室，强调证据、验证与最终裁决。",rounds:5,roles:["proposer","critic","researcher","verifier","synthesizer","arbiter"]}],y={open:!1,goal:"",officeName:"",planCount:3,selectedPlanId:"balanced",maxRounds:3,providerStrategy:"recommended",singleProvider:"openai",syncState:"idle",syncMessage:""};let de=!1;const an="当前用户",sn="Workspace Admin";let ht=!1,he=null,O=Vr(1);function Vr(e){return{name:`接口 ${e}`,duty:"developer",provider:"openai",modelId:"",endpoint:"",apiKey:""}}function gr(e){typeof e=="number"&&e>=0&&e<d.globalApis.length?(he=e,O={...d.globalApis[e]}):(he=null,O=Vr(d.globalApis.length+1)),ht=!0}function ye(){ht=!1,he=null}const fe={side:{initialized:!1,visibleProviders:[],expandedByProvider:{}},flow:{initialized:!1,visibleProviders:[],expandedByProvider:{}}};function Qr(e,t){return e==="flow"?`flow-key-${t}`:`key-${t}`}function Yr(e){return e==="flow"?"flow-openai-compatible-template":"openai-compatible-template"}function et(e){return e==="flow"?"flow-openai-compatible-endpoint":"openai-compatible-endpoint"}function Jr(e){return e==="flow"?"flow-anthropic-compatible-template":"anthropic-compatible-template"}function tt(e){return e==="flow"?"flow-anthropic-compatible-endpoint":"anthropic-compatible-endpoint"}function Xr(e){return d.apiKeys[e].trim().length>0||e==="openai_compatible"&&d.openaiCompatibleEndpoint.trim().length>0||e==="anthropic"&&d.anthropicCompatibleEndpoint.trim().length>0}function dn(e){const t=fe[e];if(t.initialized)return;const r=ee.filter(o=>Xr(o));r.length===0&&r.push("openai"),t.visibleProviders=r,t.expandedByProvider=Object.fromEntries(r.map(o=>[o,!0])),t.initialized=!0}function Se(e){dn(e);const t=fe[e];for(const r of ee)Xr(r)&&(t.visibleProviders.includes(r)||(t.visibleProviders.push(r),t.expandedByProvider[r]=!0));t.visibleProviders.length===0&&(t.visibleProviders.push("openai"),t.expandedByProvider.openai=!0)}function ln(e){Se(e);const t=fe[e];return ee.filter(r=>!t.visibleProviders.includes(r))}function eo(e,t){return Se(e),fe[e].expandedByProvider[t]!==!1}function cn(e,t){const r=fe[e];r.expandedByProvider[t]=!eo(e,t)}function pn(e,t){const r=fe[e];r.visibleProviders.includes(t)||r.visibleProviders.push(t),r.expandedByProvider[t]=!0}function br(e){if(e==="side"||e==="flow")return e}function Ue(e){if(!e)return;const t=e;if(ee.includes(t))return t}function fn(e,t){const r=Qr(e,t);return t==="openai_compatible"?`
      <label class="field"><span>OpenAI Compatible Key</span><input id="${r}" type="password" value="${h(d.apiKeys.openai_compatible)}" /></label>
      <label class="field"><span>OpenAI Compatible 模板</span><select id="${Yr(e)}">${wn(d.openaiCompatibleEndpoint)}</select></label>
      <label class="field"><span>OpenAI Compatible Base URL</span><input id="${et(e)}" value="${h(d.openaiCompatibleEndpoint)}" placeholder="例如：https://api.groq.com/openai/v1 或 .../v1/chat/completions" /></label>
    `:t==="anthropic"?`
      <label class="field"><span>Anthropic Key</span><input id="${r}" type="password" value="${h(d.apiKeys.anthropic)}" /></label>
      <label class="field"><span>Anthropic Compatible 模板</span><select id="${Jr(e)}">${$n(d.anthropicCompatibleEndpoint)}</select></label>
      <label class="field"><span>Anthropic Compatible Base URL</span><input id="${tt(e)}" value="${h(d.anthropicCompatibleEndpoint)}" placeholder="例如：https://api.anthropic.com" /></label>
    `:t==="openai"?`<label class="field"><span>OpenAI Key</span><input id="${r}" type="password" value="${h(d.apiKeys.openai)}" /></label>`:t==="google"?`<label class="field"><span>Google Key</span><input id="${r}" type="password" value="${h(d.apiKeys.google)}" /></label>`:`<label class="field"><span>DeepSeek Key</span><input id="${r}" type="password" value="${h(d.apiKeys.deepseek)}" /></label>`}function to(e){Se(e);const t=fe[e],r=ln(e),o=e,i=t.visibleProviders.map(s=>{const a=eo(e,s);return`
        <div class="provider-card">
          <button
            class="provider-card-head"
            data-api-provider-toggle="1"
            data-api-scope="${e}"
            data-api-provider="${s}"
          >
            <span>${h(X[s])}</span>
            <span>${a?"▾":"▸"}</span>
          </button>
          ${a?`<div class="provider-card-body">${fn(e,s)}</div>`:""}
        </div>
      `}).join(""),n=r.map(s=>`<option value="${s}">${h(X[s])}</option>`).join("");return`
    <div class="provider-manager">
      <div class="provider-toolbar">
        <span class="provider-toolbar-label">API 提供商</span>
        ${r.length>0?`
            <div class="provider-add-row">
              <select id="${o}-add-provider-select">${n}</select>
              <button id="${o}-add-provider-btn" data-api-provider-add="1" data-api-scope="${e}">＋</button>
            </div>
          `:'<span class="muted">已添加全部可选提供商</span>'}
      </div>
      <div class="provider-card-list">${i}</div>
    </div>
  `}function le(e){return d.officeSnapshots[e]??{officeId:e,status:"idle",sessionId:"-",turnIndex:0,agreementScore:0,totalTokens:0,totalCost:0,lastSummary:"暂无会议结论",lastUpdatedAt:new Date().toISOString()}}function xt(e){return{idle:"空闲",starting:"启动中",running:"运行中",completed:"已完成",stopped:"已停止",error:"异常"}[e]??e}function un(e){return{proposer:"提方案，推进第一版。",critic:"找风险，提反例和改进。",synthesizer:"整合观点，形成折中方案。",arbiter:"做裁决，给最终结论。",researcher:"补事实和证据。",verifier:"做验证，控一致性。"}[e.role]??"参与协作"}function gn(e){const t=Array.from(new Set(e.members.filter(r=>r.enabled).map(r=>r.provider)));return t.length>0?t.join(" / "):"未启用模型"}function bn(e){const t=e.members.find(r=>r.enabled&&(r.role==="arbiter"||r.role==="synthesizer"));return t?`${t.participantId}`:"未设置"}function z(e,t="info"){const r=mo(t,e);v(),window.setTimeout(()=>{ho(r),v()},3500)}function se(e){return Number.isFinite(e)?Math.max(1,Math.min(20,Math.trunc(e))):3}function mn(e){return be.map(t=>`<option value="${t}" ${t===e?"selected":""}>${h(t)}</option>`).join("")}function hn(){return`
    <section class="profile-duty-section">
      <div class="profile-api-head">
        <h3 class="profile-api-title">职务映射规则</h3>
        <button class="btn-sm" id="btn-duty-policy-reset" type="button">恢复默认</button>
      </div>
      <div class="duty-role-help">每个职务设置 3 个优先角色（第 1 个优先级最高）。</div>
      <div class="duty-role-grid">${Zr.map(t=>{const r=oe(t.value),o=[0,1,2].map(i=>{const n=r[i]??be[i]??"proposer",s=be.map(a=>`<option value="${a}" ${a===n?"selected":""}>${h(tn[a])}</option>`).join("");return`<select data-duty-role-duty="${t.value}" data-duty-role-rank="${i}">${s}</select>`}).join("");return`
      <div class="duty-role-row">
        <div class="duty-role-name">${h(t.label)}</div>
        <div class="duty-role-picks">${o}</div>
      </div>
    `}).join("")}</div>
    </section>
  `}function xn(e){return ee.map(t=>`<option value="${t}" ${t===e?"selected":""}>${h(X[t])}</option>`).join("")}function mr(e){return e.trim().replace(/\/+$/,"").toLowerCase()}function vn(e){const t=mr(e);if(!t)return"custom";for(const r of gt)if(r.endpoint&&mr(r.endpoint)===t)return r.id;return"custom"}function wn(e){const t=vn(e);return gt.map(r=>`<option value="${r.id}" ${r.id===t?"selected":""}>${h(r.label)}</option>`).join("")}function kn(e){const t=gt.find(r=>r.id===e);!t||!t.endpoint||(d.openaiCompatibleEndpoint=t.endpoint)}function hr(e){return e.trim().replace(/\/+$/,"").toLowerCase()}function yn(e){const t=hr(e);if(!t)return"custom";for(const r of bt)if(r.endpoint&&hr(r.endpoint)===t)return r.id;return"custom"}function $n(e){const t=yn(e);return bt.map(r=>`<option value="${r.id}" ${r.id===t?"selected":""}>${h(r.label)}</option>`).join("")}function In(e){const t=bt.find(r=>r.id===e);!t||!t.endpoint||(d.anthropicCompatibleEndpoint=t.endpoint)}function V(e){return d.apiKeys[e].trim().length>0}function vt(){for(const e of d.globalApis){const t=e.apiKey.trim();t&&(d.apiKeys[e.provider]=t);const r=e.endpoint.trim();e.provider==="openai_compatible"&&r&&(d.openaiCompatibleEndpoint=r),e.provider==="anthropic"&&r&&(d.anthropicCompatibleEndpoint=r)}}function _e(){const e=ee.filter(t=>V(t));for(const t of d.globalApis){const r=t.modelId.trim().length>0,o=t.apiKey.trim().length>0||V(t.provider);r&&o&&!e.includes(t.provider)&&e.push(t.provider)}return e}function je(){return _e().length>0}function ro(){const e=d.offices.length+1;return e>=1&&e<=26?`办公室 ${String.fromCharCode(64+e)}`:`办公室 ${e}`}function wt(){const e=Math.max(2,Math.min(5,y.planCount));return mt.slice(0,e)}function oo(){const e=wt();return e.find(r=>r.id===y.selectedPlanId)??e[0]??mt[0]}function ze(e){return{openai:"gpt-4.1",openai_compatible:"gpt-4o-mini",anthropic:"claude-3-5-sonnet",google:"gemini-1.5-pro",deepseek:"deepseek-chat"}[e]}function kt(e,t,r){const o={proposer:["openai","openai_compatible","deepseek","anthropic","google"],critic:["anthropic","openai","openai_compatible","google","deepseek"],synthesizer:["openai","openai_compatible","anthropic","google","deepseek"],arbiter:["anthropic","openai","openai_compatible","google","deepseek"],researcher:["google","deepseek","openai_compatible","openai","anthropic"],verifier:["google","openai","openai_compatible","anthropic","deepseek"]};for(const i of o[e])if(t.includes(i))return i;return t.length>0?t[0]:r}function io(e,t){const r=[...t];if(e.length===0)return r;const o=Math.max(t.length,e.length);let i=0;for(;r.length<o;){const n=e[i%e.length];i+=1;const s=oe(F(n.duty));let a=s[0]??"proposer",c=Number.MAX_SAFE_INTEGER;for(const l of s){const f=r.filter(m=>m===l).length;f<c&&(c=f,a=l)}r.push(a)}return r}function xr(e){const t=new Set(e.map(r=>F(r.duty)));return rn.filter(r=>!t.has(r))}function Sn(e){return new Set(e.map(r=>r.provider)).size>=2}function no(e,t){const r=d.globalApis.map((n,s)=>({api:n,index:s})).filter(({api:n})=>{const s=n.modelId.trim().length>0,a=n.apiKey.trim().length>0||V(n.provider);return s&&a});if(r.length===0)return;const o=r.filter(({index:n})=>!t.has(n)).sort((n,s)=>{const a=oe(F(n.api.duty)).indexOf(e),c=oe(F(s.api.duty)).indexOf(e),l=a>=0?a:99,f=c>=0?c:99;return l-f});return o.length>0?o[0]:r.sort((n,s)=>{const a=oe(F(n.api.duty)).indexOf(e),c=oe(F(s.api.duty)).indexOf(e),l=a>=0?a:99,f=c>=0?c:99;return l-f})[0]}function ao(e){const t=oo(),r=d.globalApis.filter(n=>{const s=n.modelId.trim().length>0,a=n.apiKey.trim().length>0||V(n.provider);return s&&a});if(r.length>0&&y.providerStrategy!=="single-provider"){const n=io(r,t.roles),s=new Set;return n.map((a,c)=>{const l=no(a,s)??{api:r[c%r.length],index:c};s.add(l.index);const f=l.api.provider,m=l.api.modelId.trim()||ze(f),k=l.api.endpoint.trim()||(f==="openai_compatible"?d.openaiCompatibleEndpoint.trim():f==="anthropic"?d.anthropicCompatibleEndpoint.trim():"");return{participantId:`${e}-${a}-${c+1}`,provider:f,modelId:m,endpoint:k,apiKey:l.api.apiKey.trim(),role:a,enabled:!0}})}const o=_e(),i=y.singleProvider;return t.roles.map((n,s)=>{const a=y.providerStrategy==="single-provider"?y.singleProvider:kt(n,o,i);return{participantId:`${e}-${n}-${s+1}`,provider:a,modelId:ze(a),endpoint:a==="openai_compatible"?d.openaiCompatibleEndpoint.trim():a==="anthropic"?d.anthropicCompatibleEndpoint.trim():"",role:n,enabled:!0}})}function zn(){return ao("preview").map(t=>`
        <div class="flow-preview-row">
          <span class="flow-preview-role">${h(t.role)}</span>
          <span class="flow-preview-provider">${h(X[t.provider])}</span>
          <span class="flow-preview-model">${h(t.modelId)}</span>
        </div>
      `).join("")}function An(){const t=_e()[0]??"openai";y.open=!0,y.goal="",y.officeName=ro(),y.planCount=3,y.selectedPlanId="balanced",y.maxRounds=3,y.providerStrategy="recommended",y.singleProvider=t,y.syncState="idle",y.syncMessage=""}function He(){y.open=!1,y.syncState="idle",y.syncMessage=""}function _n(e){var c;const t=Oe[e]??[];if(t.length<2)return z("该方案没有可用的成员分工草案","error"),!1;let r=W();if(r||(ot(),r=W()),!r)return z("创建办公室失败，请重试","error"),!1;const o=b.messages.find(l=>l.id===e),i=o?me(o.text):"",n=Wr(i);r.members=Wi(r.officeId,t),r.maxRounds=nn(n.workflow),r.officeName.trim()||(r.officeName=`秘书方案办公室 ${d.offices.length}`);const s=(c=[...b.messages].reverse().find(l=>(l==null?void 0:l.sender)==="user"))==null?void 0:c.text,a=me(s).trim();return r.objective.trim()||(r.objective=a||"根据秘书团队方案推进执行与交付。"),d.workspaceMode="offices",d.activeOfficeId=r.officeId,z(`已套用 ${t.length} 名成员到当前办公室`,"success"),!0}function En(e){const t=["proposer","critic","researcher","verifier","synthesizer","arbiter"],r=d.globalApis.filter(n=>{const s=n.modelId.trim().length>0,a=n.apiKey.trim().length>0||V(n.provider);return s&&a});if(r.length>0){const n=io(r,t),s=new Set;return n.map((a,c)=>{const l=no(a,s)??{api:r[c%r.length],index:c};s.add(l.index);const f=l.api.provider,m=l.api.modelId.trim()||ze(f),k=l.api.endpoint.trim()||(f==="openai_compatible"?d.openaiCompatibleEndpoint.trim():f==="anthropic"?d.anthropicCompatibleEndpoint.trim():"");return{participantId:`${e}-${a}-${c+1}`,provider:f,modelId:m,endpoint:k,apiKey:l.api.apiKey.trim(),role:a,enabled:!0}})}const o=_e(),i=o[0]??"openai";return t.map((n,s)=>{const a=kt(n,o,i);return{participantId:`${e}-${n}-${s+1}`,provider:a,modelId:ze(a),endpoint:a==="openai_compatible"?d.openaiCompatibleEndpoint.trim():a==="anthropic"?d.anthropicCompatibleEndpoint.trim():"",role:n,enabled:!0}})}async function Rn(e,t,r){vt(),ot();const o=W();if(!o)return z("创建办公室失败，请重试","error"),!1;o.officeName=(r==null?void 0:r.trim())||`Workerflow 讨论 ${d.offices.length}`,o.objective=(e==null?void 0:e.trim())||"你是我的 Workerflow 结对搭档。先向我提 3 个澄清问题，再给出一版最小可执行流程。",o.maxRounds=4,o.members=En(o.officeId),d.workspaceMode="offices",d.humanDraftByOfficeId[o.officeId]="",j("starting-office"),v();try{const i=await ge();if(!i.ok)return z(i.message,"error"),!1;const n=await Je();if(!n.ok)return z(`办公室已创建，但自动启动失败：${n.message}`,"error"),!1;const s=await Br((t==null?void 0:t.trim())||`我们现在进入办公室执行阶段。请先输出：
1) 成员分工表（工程/前端/数学/测试/产品）
2) 前后端与信息流架构
3) 里程碑计划与workflow步骤
4) 测试与回归策略
5) 需要我确认的最终决策点。`);return s.ok?(so(o.officeId),z("办公室已创建，AI 已开始和你讨论 Workerflow","success"),!0):(z(`办公室已启动，但首条引导消息发送失败：${s.message}`,"error"),!0)}finally{j("none"),v()}}function Pn(){const e=wt();if(!e.some(t=>t.id===y.selectedPlanId)){const t=e[0];t&&(y.selectedPlanId=t.id,y.maxRounds=t.rounds)}}function vr(e){const t=new Set(e.members.filter(r=>r.enabled).map(r=>r.provider));return Array.from(t).filter(r=>!V(r))}async function ge(){if(vt(),!je())return{ok:!1,message:"请至少配置一个全局 API Key"};if(!d.orchestratorRunning){const e=await Pi();if(await Gr(),!e.ok||!d.orchestratorRunning)return{ok:!1,message:e.message}}return Ci()}function Cn(){if(!y.open)return"";const e=wt(),t=oo(),r=je(),o=y.providerStrategy==="single-provider"&&!V(y.singleProvider),i=y.goal.trim().length>0&&r&&!o&&y.syncState!=="syncing",n=y.syncState==="syncing"?"同步中...":"保存并同步 Keys",s=y.syncState==="success"?"flow-sync-success":y.syncState==="error"?"flow-sync-error":"",a=ee.map(l=>{const f=V(l),m=f?"":"（未配置 Key）",k=f?"":"disabled";return`<option value="${l}" ${l===y.singleProvider?"selected":""} ${k}>${h(X[l])}${m}</option>`}).join(""),c=e.map(l=>{const f=l.id===t.id,m=l.roles.join(" · ");return`
        <button class="flow-plan-card ${f?"active":""}" data-flow-plan="${l.id}">
          <div class="flow-plan-title">${h(l.title)}</div>
          <div class="flow-plan-summary">${h(l.summary)}</div>
          <div class="flow-plan-meta">轮次 ${l.rounds} · 角色 ${h(m)}</div>
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
            <textarea id="flow-goal" rows="3" placeholder="例如：先给出 3 套可执行方案，再由我选择继续实现">${h(y.goal)}</textarea>
          </section>

          <section class="flow-section">
            <div class="flow-section-title">2) 选择候选 workflow（2-5 套）</div>
            <label class="field">
              <span>候选方案数量</span>
              <select id="flow-plan-count">
                <option value="2" ${y.planCount===2?"selected":""}>2</option>
                <option value="3" ${y.planCount===3?"selected":""}>3</option>
                <option value="4" ${y.planCount===4?"selected":""}>4</option>
                <option value="5" ${y.planCount===5?"selected":""}>5</option>
              </select>
            </label>
            <div class="flow-plan-grid">${c}</div>
          </section>

          <section class="flow-section">
            <div class="flow-section-title">3) 构建办公室</div>
            <label class="field">
              <span>办公室名称</span>
              <input id="flow-office-name" value="${h(y.officeName)}" placeholder="比如：方案评审办公室" />
            </label>
            <label class="field">
              <span>最大轮次（1~20）</span>
              <input id="flow-max-rounds" type="number" min="1" max="20" value="${y.maxRounds}" />
            </label>
            <label class="field">
              <span>模型分配策略</span>
              <select id="flow-provider-strategy">
                <option value="recommended" ${y.providerStrategy==="recommended"?"selected":""}>推荐分配（按角色自动分工）</option>
                <option value="single-provider" ${y.providerStrategy==="single-provider"?"selected":""}>单一厂商（全部角色同厂商）</option>
              </select>
            </label>

            ${y.providerStrategy==="single-provider"?`
                <label class="field">
                  <span>单一厂商</span>
                  <select id="flow-single-provider">${a}</select>
                </label>
              `:""}

            <div class="flow-preview-box">
              <div class="flow-preview-title">将要创建的成员</div>
              ${zn()}
            </div>

          </section>

          ${r?"":`
              <section class="flow-section flow-alert">
                <div class="flow-section-title">先配置全局 API Key</div>
                <div class="muted">至少配置一个厂商 Key 后，才能创建并启动办公室。</div>
                ${to("flow")}
                <button id="btn-flow-sync-keys" ${y.syncState==="syncing"?"disabled":""}>${n}</button>
                ${y.syncMessage?`<div class="flow-sync-msg ${s}">${h(y.syncMessage)}</div>`:""}
              </section>
            `}
        </div>

        <div class="flow-modal-foot">
          <button id="btn-flow-create" ${i?"":"disabled"}>创建办公室并进入讨论</button>
        </div>
      </div>
    </div>
  `}function Tn(){return d.toasts.length===0?"":`
    <div class="toast-stack">
      ${d.toasts.map(e=>`
            <div class="toast toast-${e.kind}">${h(e.message)}</div>
          `).join("")}
    </div>
  `}function Ln(){return`${d.offices.map(r=>{const o=le(r.officeId);return`
        <button class="office-card ${r.officeId===d.activeOfficeId?"active":""}" data-office-id="${r.officeId}">
          <div class="office-title">${h(r.officeName)}</div>
          <div class="office-line">任务：${h(r.objective||"未设置")}</div>
          <div class="office-line">裁决人：${h(bn(r))}</div>
          <div class="office-line">模型：${h(gn(r))}</div>
          <div class="office-meta">${xt(o.status)} · 第 ${o.turnIndex} 轮</div>
        </button>
      `}).join("")}
    <button class="office-card add" id="btn-add-office">
      <span class="office-add-icon">＋</span>
      <span class="office-add-title">新建办公室</span>
      <span class="office-add-sub">通过 AI 向导快速创建并开始讨论</span>
    </button>
  `}function Ze(e,t=2){return typeof e!="number"||Number.isNaN(e)?"-":e.toFixed(t)}function wr(e){return typeof e!="number"||Number.isNaN(e)?"0":String(Math.trunc(e))}function On(e){return typeof e!="number"||Number.isNaN(e)?0:e>1?Math.max(0,Math.min(1,e/100)):Math.max(0,Math.min(1,e))}function Mn(){const e=d.offices.map(s=>{const a=le(s.officeId),c=On(a.agreementScore);return`
        <tr>
          <td>${h(s.officeName)}</td>
          <td><span class="status-badge status-${a.status}">${xt(a.status)}</span></td>
          <td>${h(a.sessionId)}</td>
          <td>${a.turnIndex}</td>
          <td>${Ze(c*100,1)}%</td>
          <td>${wr(a.totalTokens)}</td>
          <td>$${Ze(a.totalCost,4)}</td>
          <td class="summary-cell">${h(a.lastSummary)}</td>
        </tr>
      `}).join(""),t=Object.values(d.officeSnapshots).reduce((s,a)=>s+(a.totalTokens||0),0),r=Object.values(d.officeSnapshots).reduce((s,a)=>s+(a.totalCost||0),0),o=Object.values(d.officeSnapshots).filter(s=>s.status==="running").length,i=d.participants.length>0?d.participants.map(s=>`
          <tr>
            <td>${h(s.participantId)}</td>
            <td>${h(s.role)}</td>
            <td>${h(s.provider)} / ${h(s.modelId)}</td>
            <td><span class="status-badge status-${s.status==="done"?"completed":s.status==="pending"?"idle":"running"}">${h(s.status)}</span></td>
            <td>${s.latencyMs!==void 0?`${s.latencyMs}ms`:"-"}</td>
          </tr>
        `).join(""):'<tr><td colspan="5" class="muted">暂无参与者数据</td></tr>',n=d.logs.slice(0,50).map(s=>`<div class="log-line">${h(s)}</div>`).join("");return`
    <div class="dashboard-view">
      <h2 class="view-title">Dashboard</h2>
      <p class="view-desc">全局概览：所有办公室状态、参与者、系统日志</p>

      <div class="dash-summary-grid">
        <div class="dash-card">
          <div class="dash-card-label">办公室总数</div>
          <div class="dash-card-value">${d.offices.length}</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-label">运行中</div>
          <div class="dash-card-value">${o}</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-label">总 Tokens</div>
          <div class="dash-card-value">${wr(t)}</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-label">总花费</div>
          <div class="dash-card-value">$${Ze(r,4)}</div>
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
            <tbody>${i}</tbody>
          </table>
        </div>
      </div>

      <div class="dash-section">
        <h3>系统日志 <span class="muted">(最近 50 条)</span></h3>
        <div class="log-box">${n||'<div class="muted">暂无日志</div>'}</div>
      </div>
    </div>
  `}function qn(){const e=d.notifications.length>0?d.notifications.slice(0,100).map(r=>`
          <div class="sub-event-item">
            <div class="sub-event-head">
              <span class="sub-event-method">${h(r.method)}</span>
              <span class="sub-event-time">${h(r.time)}</span>
            </div>
            <pre class="sub-event-body">${h(typeof r.payload=="string"?r.payload:JSON.stringify(r.payload,null,2))}</pre>
          </div>
        `).join(""):'<div class="muted">暂无事件通知。启动办公室讨论后，这里会实时显示引擎推送的事件流。</div>',t=d.chunks.length>0?d.chunks.slice(0,80).map(r=>`
          <div class="sub-chunk-item">
            <div class="sub-chunk-head">
              <span class="sub-chunk-participant">${h(r.participantId)}</span>
              <span class="sub-chunk-meta">session: ${h(r.sessionId)} · 第${r.turnIndex}轮 · ${h(r.time)}</span>
            </div>
            <div class="sub-chunk-body">${h(r.delta)}</div>
          </div>
        `).join(""):'<div class="muted">暂无消息流。</div>';return`
    <div class="subscription-view">
      <h2 class="view-title">订阅</h2>
      <p class="view-desc">实时事件流：引擎通知、消息 chunk、会话状态变更</p>

      <div class="sub-tabs">
        <button class="sub-tab ${d._subTab!=="chunks"?"active":""}" data-sub-tab="notifications">事件通知 (${d.notifications.length})</button>
        <button class="sub-tab ${d._subTab==="chunks"?"active":""}" data-sub-tab="chunks">消息流 (${d.chunks.length})</button>
      </div>

      <div class="sub-content">
        ${d._subTab==="chunks"?t:e}
      </div>
    </div>
  `}function Nn(e,t){const r=t===d.activeGlobalApiIndex,o=X[e.provider]??e.provider,i=e.modelId.trim()||"未填写 Model ID",n=e.apiKey.trim()?"已填写 Key":V(e.provider)?"使用全局 Key":"未配置 Key";return`
    <div class="profile-api-card ${r?"global-api-card-active":""}">
      <div class="profile-api-main">
        <div class="profile-api-name">${h(e.name.trim()||`接口 ${t+1}`)}</div>
        <div class="profile-api-meta">${h(Xe[F(e.duty)])} · ${h(o)} · ${h(i)} · ${h(n)}</div>
      </div>
      <div class="profile-api-actions">
        ${r?'<span class="badge badge-active">秘书分身</span>':`<button class="btn-sm profile-api-activate" data-index="${t}" type="button">设为我的分身（秘书）</button>`}
        <button class="btn-sm profile-api-edit" data-index="${t}" type="button">配置</button>
        <button class="btn-sm btn-danger profile-api-remove" data-index="${t}" type="button">删除</button>
      </div>
    </div>
  `}function Dn(){if(!de||!ht)return"";const e=ee.map(o=>`<option value="${o}" ${O.provider===o?"selected":""}>${h(X[o])}</option>`).join(""),t=Zr.map(o=>`<option value="${o.value}" ${F(O.duty)===o.value?"selected":""}>${h(o.label)}</option>`).join(""),r=he===null?"添加 API":"保存 API";return`
    <div class="flow-modal-mask profile-api-editor-mask" id="profile-api-editor-mask">
      <div class="flow-modal profile-api-editor-modal">
        <div class="flow-modal-head">
          <div>
            <div class="flow-modal-title">配置 API</div>
            <div class="flow-modal-sub">填写 Provider、Model、Endpoint 与 Key。</div>
          </div>
          <button id="btn-profile-api-editor-close" type="button">关闭</button>
        </div>

        <div class="flow-modal-body profile-api-editor-body">
          <label class="field">
            <span>名称</span>
            <input id="profile-api-editor-name" value="${h(O.name)}" placeholder="接口名称" />
          </label>
          <label class="field">
            <span>Provider</span>
            <select id="profile-api-editor-provider">${e}</select>
          </label>
          <label class="field">
            <span>职务</span>
            <select id="profile-api-editor-duty">${t}</select>
          </label>
          <label class="field">
            <span>Model ID</span>
            <input id="profile-api-editor-model" value="${h(O.modelId)}" placeholder="例如：gpt-4.1" />
          </label>
          <label class="field">
            <span>Endpoint（可选）</span>
            <input id="profile-api-editor-endpoint" value="${h(O.endpoint)}" placeholder="例如：https://api.openai.com/v1" />
          </label>
          <label class="field">
            <span>API Key（可选）</span>
            <input id="profile-api-editor-key" value="${h(O.apiKey)}" placeholder="sk-..." />
          </label>
        </div>

        <div class="flow-modal-foot">
          <button id="btn-profile-api-editor-cancel" type="button">取消</button>
          <button id="btn-profile-api-editor-save" type="button">${r}</button>
        </div>
      </div>
    </div>
  `}function jn(){if(!de)return"";const e=d.globalApis.length>0?`
        <div class="profile-api-list">
          ${d.globalApis.map((t,r)=>Nn(t,r)).join("")}
        </div>
      `:`
        <div class="profile-api-empty">
          <button class="profile-api-empty-add" id="btn-profile-api-add-empty" type="button">＋</button>
        </div>
      `;return`
    <div class="flow-modal-mask profile-settings-mask" id="profile-settings-mask">
      <div class="flow-modal profile-settings-modal">
        <div class="flow-modal-head">
          <div>
            <div class="flow-modal-title">用户中心</div>
          </div>
          <button id="btn-profile-settings-close" type="button">关闭</button>
        </div>

        <div class="flow-modal-body profile-settings-body">
          <section class="profile-user-card">
            <span class="profile-user-avatar">U</span>
            <div class="profile-user-name">${h(an)}</div>
            <div class="profile-user-role">${h(sn)}</div>
          </section>

          <section class="profile-api-section">
            <div class="profile-api-head">
              <h3 class="profile-api-title">我的 API</h3>
              <button class="profile-api-add-btn" id="btn-profile-api-add" type="button">＋</button>
            </div>
            ${e}
          </section>

          ${hn()}
        </div>
      </div>
    </div>
    ${Dn()}
  `}function Kn(){if(!b.open)return"";const e=b.messages.map(l=>{if(!l)return"";const f=me(l.text),m=l.sender==="ai"?"guide-msg-ai":l.sender==="user"?"guide-msg-user":"guide-msg-system",k=l.sender==="ai"?"🤖":l.sender==="user"?"👤":"⚙️",x=l.sender==="ai"?l.authorLabel??"AI":l.sender==="user"?"你":"系统",S=l.sender==="ai"?`<div class="guide-msg-text md-body">${ut(f)}</div>`:`<div class="guide-msg-text">${h(f)}</div>`,$=l.sender==="ai"?Qi(f,l.id):"",P=Array.isArray(l.actions)&&l.actions.length>0?`<div class="guide-msg-actions">${l.actions.map(q=>{const U=q.payload?` data-guide-payload="${h(q.payload)}"`:"";return`<button class="guide-msg-action" data-guide-action="${h(q.kind)}" data-guide-action-id="${h(q.id)}"${U}>${h(q.label)}</button>`}).join("")}</div>`:"";return`
        <div class="guide-msg ${m}">
          <div class="guide-msg-role">${k} ${h(x)}</div>
          ${S}
          ${$}
          ${P}
        </div>
      `}).join(""),t=[...b.messages].reverse().find(l=>(l==null?void 0:l.sender)==="user"),r=t?Ur(t.id):!1,o=b.aiThinking&&!r?Ji(t==null?void 0:t.timestamp):"",i=b.aiThinking?`<div class="guide-msg guide-msg-ai guide-thinking">
        <div class="guide-msg-role">🤖 AI 群聊（正在产出讨论路径）</div>
        <div class="guide-msg-text">
          <div class="thinking-indicator">
            <div class="thinking-dots">
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
            </div>
            <span class="thinking-label">AI 正在输出讨论过程，请看上方实时气泡…</span>
          </div>
        </div>
      </div>`:"",n=b.userInput.trim().length>0&&!b.aiThinking&&!b.creating,s=b.aiThinking?"AI 思考中...":"继续讨论",a=b.creating?"创建中...":"按这个想法创建办公室",c=b.secretaryCanFinalize?"已授权秘书代拍":"授权秘书代拍（需明确授权）";return`
    <div class="flow-modal-mask">
      <div class="flow-modal">
        <div class="flow-modal-head">
          <div>
            <div class="flow-modal-title">和 AI 共创 Workerflow</div>
            <div class="flow-modal-sub">先聊清楚目标，再一键创建办公室并开聊。</div>
          </div>
          <button id="btn-guide-cancel">取消</button>
        </div>

        <div class="flow-modal-body">
          <div class="guide-thread">${e}${o}${i}</div>

          <label class="field guide-secretary-toggle">
            <input id="guide-secretary-delegate" type="checkbox" ${b.secretaryCanFinalize?"checked":""} />
            <span>${c}</span>
          </label>

          <label class="field">
            <span>你的想法</span>
            <textarea id="guide-input" rows="3" placeholder="例如：我想先梳理需求，再评估技术方案和排期">${h(b.userInput)}</textarea>
          </label>
        </div>

        <div class="flow-modal-foot">
          <button id="btn-guide-send" ${n?"":"disabled"}>${s}</button>
          <button id="btn-guide-create" ${b.creating?"disabled":""}>${a}</button>
        </div>
      </div>
    </div>
  `}function Gn(e){return{offices:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',dashboard:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',subscription:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',settings:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',creation:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',review:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'}[e]??""}function Bn(e){return{offices:"蜂群办公室",dashboard:"数据看板",subscription:"事件订阅",settings:"系统设置",creation:"创作",review:"审查"}[e]??e}const Fn=["offices","dashboard","subscription"];function Wn(){switch(d.workspaceMode){case"dashboard":return Mn();case"subscription":return qn();case"offices":default:return`<div class="grid">${Ln()}</div>`}}function Un(){const e=W();if(!e)return`
      <div class="right-title">暂无办公室</div>
      <div class="right-sub">请先在中间区域点击“新建办公室”，再开始配置与讨论。</div>
      <div class="discussion-box">
        <div class="muted">当前还没有可编辑的办公室。创建后将显示目标、成员、会话和人类参与输入。</div>
      </div>
    `;const t=le(e.officeId),r=d.humanDraftByOfficeId[e.officeId]??"",o=d.busyAction,i=t.sessionId!=="-",n=o!=="none",s=t.status==="running"||t.status==="starting",a=e.objective.trim().length>0,c=!n&&!s&&a,l=!n&&i&&s,f=!n&&i,m=!n&&i,k=o==="syncing-keys"?"同步中...":"同步 Keys",x=o==="starting-office"?"启动中...":"启动该办公室讨论",S=o==="stopping-office"?"停止中...":"停止",$=o==="sending-human"?"发送中...":"发送到该办公室",P=o==="executing-workflow"?"执行中...":"执行落地脚本",q=d.humanDraftByOfficeId[`workflow:${e.officeId}`]??`{
  "stop_on_error": true,
  "continue_chat": true,
  "steps": [
    {
      "kind": "command",
      "name": "安装依赖",
      "command": "npm install",
      "cwd": ".",
      "timeout_ms": 120000
    },
    {
      "kind": "command",
      "name": "运行测试",
      "command": "npm test",
      "cwd": ".",
      "timeout_ms": 120000
    }
  ]
}`,U=e.members.map((C,D)=>`
        <div class="member-editor-row" data-member-row="${D}">
          <label class="check">
            <input type="checkbox" data-member-enabled="${D}" ${C.enabled?"checked":""} />
            启用
          </label>
          <input data-member-id="${D}" value="${h(C.participantId)}" placeholder="participant_id" />
          <select data-member-role="${D}">${mn(C.role)}</select>
          <select data-member-provider="${D}">${xn(C.provider)}</select>
          <input data-member-model="${D}" value="${h(C.modelId)}" placeholder="model_id" />
          <input data-member-endpoint="${D}" value="${h(C.endpoint??"")}" placeholder="endpoint（仅 OpenAI Compatible）" />
        </div>
      `).join(""),te=t.sessionId!=="-"?d.chunks.filter(C=>C.sessionId===t.sessionId).slice(0,80).reverse():[],ne=te.length===0?'<div class="muted">启动办公室后，这里会显示讨论消息流，你也可以作为人类参与发言。</div>':te.map(C=>`
              <div class="message-item">
                <div class="message-head">${h(C.participantId)} · 第${C.turnIndex}轮</div>
                <div class="message-body md-body">${ut(C.delta)}</div>
              </div>
            `).join(""),ue=e.members.map(C=>`
        <div class="member-row">
          <b>${h(C.participantId)}</b>
          <span>${h(C.role)} · ${h(C.modelId)}</span>
          <p>${h(un(C))}</p>
        </div>
      `).join("");return`
    <div class="right-title">${h(e.officeName)}</div>
    <div class="right-sub">状态：${xt(t.status)}｜session：${h(t.sessionId)}</div>

    <label class="field">
      <span>办公室名称</span>
      <input id="office-name" value="${h(e.officeName)}" placeholder="比如：前端评审组" />
    </label>
    <label class="field">
      <span>本轮目标</span>
      <textarea id="office-objective" rows="3" placeholder="明确本轮要达成的目标">${h(e.objective)}</textarea>
    </label>
    <label class="field">
      <span>最大轮次（1~20）</span>
      <input id="office-max-rounds" type="number" min="1" max="20" value="${e.maxRounds}" />
    </label>

    <div class="member-editor">
      <div class="member-editor-title">成员配置（启用成员会参与讨论）</div>
      ${U}
    </div>

    <div id="discussion-stream" class="discussion-box">${ne}</div>

    <label class="field">
      <span>人类参与输入</span>
      <textarea id="human-input" rows="3" placeholder="给这个办公室补充方向、约束或反馈">${h(r)}</textarea>
    </label>

    <label class="field">
      <span>落地 Workflow（JSON）</span>
      <textarea id="workflow-script" rows="10" placeholder='{"steps":[{"kind":"command","name":"run","command":"npm test"}] }'>${h(q)}</textarea>
    </label>

    <div class="actions">
      <button id="btn-send-human" ${f?"":"disabled"}>${$}</button>
      <button id="btn-execute-workflow" ${m?"":"disabled"}>${P}</button>
      <button id="btn-start-office" ${c?"":"disabled"}>${x}</button>
      <button id="btn-stop-office" ${l?"":"disabled"}>${S}</button>
    </div>

    <div class="right-divider"></div>

    ${to("side")}
    <button id="btn-set-keys" ${n?"disabled":""}>${k}</button>

    <div class="right-divider"></div>
    <div class="member-list">${ue}</div>
  `}function Hn(){if(d.workspaceMode!=="offices")return;const e=W();if(!e)return;const t=le(e.officeId),r=w.querySelector("#discussion-stream");if(!r)return;const o=t.sessionId!=="-"?d.chunks.filter(i=>i.sessionId===t.sessionId).slice(0,80).reverse():[];r.innerHTML=o.length===0?'<div class="muted">启动办公室后，这里会显示讨论消息流，你也可以作为人类参与发言。</div>':o.map(i=>`
              <div class="message-item">
                <div class="message-head">${h(i.participantId)} · 第${i.turnIndex}轮</div>
                <div class="message-body md-body">${ut(i.delta)}</div>
              </div>
            `).join("")}let Me="";function so(e){Me=e}function Zn(){if(!Me)return;const e=W();if(!e||e.officeId!==Me)return;const t=w.querySelector("#human-input");t&&(Me="",requestAnimationFrame(()=>{t.focus();const r=t.value.length;t.setSelectionRange(r,r)}))}let Re=null;function Vn(){Re!==null&&clearTimeout(Re),Re=setTimeout(()=>{Ao(),Re=null},500)}function v(){try{Vn();const e=W(),t=Fn.map(o=>`<button class="nav-item ${d.workspaceMode===o?"active":""}" data-nav-mode="${o}">
            <span class="nav-icon">${Gn(o)}</span>
            <span class="nav-text">${Bn(o)}</span>
          </button>`).join(""),r=d.workspaceMode==="offices";w.innerHTML=`
      <div class="frame">
        <header class="topbar" data-tauri-drag-region>
          <div class="brand">
            <span class="brand-mark" aria-hidden="true"></span>
            <div class="brand-copy">
              <span class="brand-text">BeBoss</span>
              <span class="brand-sub">AI Workerflow 协作平台</span>
            </div>
          </div>
          <div class="topbar-right">
            <div class="engine-status ${d.orchestratorRunning?"online":"offline"}">
              <span class="engine-dot"></span>
              引擎：${d.orchestratorRunning?"在线":"离线"}
            </div>
            ${en()}
          </div>
        </header>

        <div class="body ${r?"":"no-right-panel"}">
          <aside class="left-nav">
            <div class="nav-group">
              ${t}
            </div>
            <div class="nav-bottom">
              <div class="profile profile-trigger" id="btn-profile-settings" role="button" tabindex="0">
                <span class="profile-avatar">U</span>
                <div class="profile-copy">
                  <span class="profile-name">当前用户</span>
                  <span class="profile-role">Workspace Admin</span>
                </div>
              </div>
            </div>
          </aside>

          <main class="center">
            ${Wn()}
          </main>

          ${r?`<aside class="right-panel">${Un()}</aside>`:""}
        </div>
      </div>
      ${Cn()}
      ${jn()}
      ${Kn()}
      ${Tn()}
    `,Qn(e),Zn()}catch(e){const t=e instanceof Error?e.message:String(e);console.error("[ui] render crashed",e),w.innerHTML=`
      <div class="frame">
        <main class="center">
          <section class="card">
            <h3>界面渲染异常</h3>
            <p class="muted">${h(t)}</p>
            <p class="muted">请重试操作；若复现，请把日志面板最后几行发我。</p>
          </section>
        </main>
      </div>
    `}}function Qn(e){var l,f,m,k,x,S,$,P,q,U,te,ne,ue,C,D,yt,$t,It,St,zt,At,_t,Et,Rt,Pt,Ct,Tt,Lt,Ot,Mt,qt,Nt,Dt,jt,Kt,Gt,Bt,Ft,Wt,Ut,Ht,Zt,Vt,Qt,Yt,Jt;Se("side"),Se("flow"),w.querySelectorAll("[data-nav-mode]").forEach(p=>{p.addEventListener("click",()=>{const u=p.dataset.navMode;u&&u!==d.workspaceMode&&(d.workspaceMode=u,v())})});const t=w.querySelector("#btn-profile-settings");t==null||t.addEventListener("click",()=>{de=!0,v()}),t==null||t.addEventListener("keydown",p=>{p.key!=="Enter"&&p.key!==" "||(p.preventDefault(),de=!0,v())}),(l=w.querySelector("#btn-profile-settings-close"))==null||l.addEventListener("click",()=>{ye(),de=!1,v()}),(f=w.querySelector("#btn-window-minimize"))==null||f.addEventListener("click",()=>{We("minimize")}),(m=w.querySelector("#btn-window-toggle-maximize"))==null||m.addEventListener("click",()=>{We("toggle-maximize")}),(k=w.querySelector("#btn-window-close"))==null||k.addEventListener("click",()=>{We("close")}),(x=w.querySelector("#profile-settings-mask"))==null||x.addEventListener("click",p=>{p.target===p.currentTarget&&(ye(),de=!1,v())});const r=()=>{gr(),v()};(S=w.querySelector("#btn-profile-api-add"))==null||S.addEventListener("click",r),($=w.querySelector("#btn-profile-api-add-empty"))==null||$.addEventListener("click",r),w.querySelectorAll(".profile-api-edit").forEach(p=>{p.addEventListener("click",()=>{const u=Number(p.dataset.index);!Number.isInteger(u)||u<0||u>=d.globalApis.length||(gr(u),v())})}),w.querySelectorAll(".profile-api-activate").forEach(p=>{p.addEventListener("click",()=>{const u=Number(p.dataset.index);!Number.isInteger(u)||u<0||u>=d.globalApis.length||(d.activeGlobalApiIndex=u,z(`已将「${d.globalApis[u].name||`接口 ${u+1}`}」设为你的分身（秘书）`,"success"),v())})}),w.querySelectorAll(".profile-api-remove").forEach(p=>{p.addEventListener("click",()=>{const u=Number(p.dataset.index);!Number.isInteger(u)||u<0||u>=d.globalApis.length||(d.globalApis.splice(u,1),d.globalApis.length===0?d.activeGlobalApiIndex=0:d.activeGlobalApiIndex>=d.globalApis.length?d.activeGlobalApiIndex=d.globalApis.length-1:d.activeGlobalApiIndex>u&&(d.activeGlobalApiIndex-=1),z("接口已删除","success"),v())})}),(P=w.querySelector("#btn-profile-api-editor-close"))==null||P.addEventListener("click",()=>{ye(),v()}),(q=w.querySelector("#btn-profile-api-editor-cancel"))==null||q.addEventListener("click",()=>{ye(),v()}),(U=w.querySelector("#profile-api-editor-mask"))==null||U.addEventListener("click",p=>{p.target===p.currentTarget&&p.stopPropagation()}),(te=w.querySelector("#profile-api-editor-name"))==null||te.addEventListener("input",p=>{const u=p.currentTarget;O.name=u.value}),(ne=w.querySelector("#profile-api-editor-provider"))==null||ne.addEventListener("change",p=>{const u=p.currentTarget,g=Ue(u.value);g&&(O.provider=g)}),(ue=w.querySelector("#profile-api-editor-duty"))==null||ue.addEventListener("change",p=>{const u=p.currentTarget;O.duty=F(u.value)}),(C=w.querySelector("#profile-api-editor-model"))==null||C.addEventListener("input",p=>{const u=p.currentTarget;O.modelId=u.value}),(D=w.querySelector("#profile-api-editor-endpoint"))==null||D.addEventListener("input",p=>{const u=p.currentTarget;O.endpoint=u.value}),(yt=w.querySelector("#profile-api-editor-key"))==null||yt.addEventListener("input",p=>{const u=p.currentTarget;O.apiKey=u.value}),($t=w.querySelector("#btn-profile-api-editor-save"))==null||$t.addEventListener("click",()=>{const p={name:O.name.trim()||`接口 ${d.globalApis.length+1}`,duty:F(O.duty),provider:O.provider,modelId:O.modelId.trim(),endpoint:O.endpoint.trim(),apiKey:O.apiKey.trim()};if(!p.modelId){z("请先填写 Model ID","error");return}he===null?(d.globalApis.push(p),d.activeGlobalApiIndex=d.globalApis.length-1,z("已添加 API 配置","success")):(d.globalApis[he]=p,z("已保存 API 配置","success")),ye(),v()}),w.querySelectorAll("[data-duty-role-duty][data-duty-role-rank]").forEach(p=>{p.addEventListener("change",()=>{const u=F(p.dataset.dutyRoleDuty),g=Number(p.dataset.dutyRoleRank);if(!Number.isInteger(g)||g<0)return;const I=p.value;if(!be.includes(I))return;const L=[...oe(u)];for(;L.length<3;)L.push(be[L.length]??"proposer");L.splice(g,1),L.unshift(I);const A=[];for(const N of L)A.includes(N)||A.push(N);for(const N of be)A.includes(N)||A.push(N);d.dutyRolePolicy[u]=A.slice(0,3),v()})}),(It=w.querySelector("#btn-duty-policy-reset"))==null||It.addEventListener("click",()=>{d.dutyRolePolicy={developer:[...Y.developer],frontend:[...Y.frontend],tester:[...Y.tester],product_manager:[...Y.product_manager],mathematician:[...Y.mathematician],researcher:[...Y.researcher],architect:[...Y.architect],reviewer:[...Y.reviewer]},z("已恢复默认职务映射规则","success"),v()}),w.querySelectorAll("[data-sub-tab]").forEach(p=>{p.addEventListener("click",()=>{const u=p.dataset.subTab;d._subTab=u==="chunks"?"chunks":"notifications",v()})}),w.querySelectorAll("[data-office-id]").forEach(p=>{p.addEventListener("click",()=>{const u=p.dataset.officeId;if(!u)return;xo(u),d.workspaceMode="offices";const g=le(u);d.sessionId=g.sessionId,v()})}),(St=w.querySelector("#btn-add-office"))==null||St.addEventListener("click",async()=>{if(vt(),!je()){An(),z("请先点击左下角“当前用户”，在“系统设置”里配置全局 API（或先同步 Key）后再一键开聊。","info"),v();return}yo(),v()}),(zt=w.querySelector("#btn-guide-cancel"))==null||zt.addEventListener("click",()=>{tr(),v()}),(At=w.querySelector("#guide-input"))==null||At.addEventListener("input",p=>{const u=p.currentTarget;b.userInput=u.value;const g=b.userInput.trim().length>0&&!b.aiThinking&&!b.creating,I=w.querySelector("#btn-guide-send");I&&(I.disabled=!g)}),(_t=w.querySelector("#guide-secretary-delegate"))==null||_t.addEventListener("change",p=>{const u=p.currentTarget;b.secretaryCanFinalize=u.checked,v()});const o=async()=>{const p=b.userInput.trim();if(!p)return;const u=d.globalApis.filter(A=>{const N=A.modelId.trim().length>0,ve=A.apiKey.trim().length>0||V(A.provider);return N&&ve}),g=xr(u),I=Sn(u),L=B("user",p);if(u.length<3)B("ai",`我先盘了下当前可用成员：仅 ${u.length} 个可用 API。

建议先补充到至少 3 个（最好 5 个），再做“工程师/前端/数学家/测试/产品经理”分工。
请先去左下角「当前用户」补充 API 后再继续。`,[{id:"guide-open-profile-api-shortage",label:"去补 API",kind:"edit",payload:"open-profile-settings"}]);else if(g.length>0){const A=g.map(N=>Xe[N]).filter(Boolean).join("、");B("ai",`当前 API 职务还不完整，缺少：${A}。

为了让秘书能完整编制“技术-前端-数学-测试-产品”协同链路，建议先补齐这些职务配置。`,[{id:"guide-open-profile-api-duty-gap",label:"去补职务",kind:"edit",payload:"open-profile-settings"}])}else I||B("ai",`注意：目前 API 都来自同一厂商，容易出现思路同质化。
建议至少接入 2 家厂商后再进入最终 workflow 拍板。`,[{id:"guide-open-profile-api-diversity",label:"去补厂商",kind:"edit",payload:"open-profile-settings"}]);b.userInput="",b.aiThinking=!0,v();try{const A=await ge();if(!A.ok){b.aiThinking=!1,B("ai",`⚠️ 发送前同步 Key 失败：${A.message}`),v();return}const N=await Oi(p);N.ok?(N.sessionId&&(b.sessionId=N.sessionId),await new Promise(ve=>setTimeout(ve,200)),Xi(N.outputs??[],L.id),b.aiThinking=!1,$o("plan-suggest")):(b.aiThinking=!1,B("ai",`⚠️ AI 回复失败：${N.message}

请检查：
1. 引擎是否已启动
2. API Key 是否已配置
3. 网络是否正常`))}catch(A){b.aiThinking=!1,B("ai",`⚠️ 发生错误：${A instanceof Error?A.message:String(A)}`)}v()};(Et=w.querySelector("#btn-guide-send"))==null||Et.addEventListener("click",()=>{o()}),w.querySelectorAll("[data-guide-action]").forEach(p=>{p.addEventListener("click",()=>{const u=p.dataset.guideAction,g=Number(p.dataset.guideMessageId??"");if(u==="apply-roster"){if(!Number.isInteger(g)){z("方案来源无效，无法套用","error");return}_n(g)&&v();return}p.dataset.guidePayload==="open-profile-settings"&&(de=!0,v())})}),(Rt=w.querySelector("#guide-input"))==null||Rt.addEventListener("keydown",p=>{p.key!=="Enter"||p.shiftKey||p.isComposing||(p.preventDefault(),o())}),(Pt=w.querySelector("#btn-guide-create"))==null||Pt.addEventListener("click",async()=>{var L;const p=d.globalApis.filter(A=>{const N=A.modelId.trim().length>0,ve=A.apiKey.trim().length>0||V(A.provider);return N&&ve}),u=xr(p);if(p.length<3){B("ai",`我这边评估人手不足（仅 ${p.length} 个可用 API），暂不建议创建办公室。
请先补充 API（建议至少 5 个），我再继续组织协作。`),v();return}if(u.length>0){B("ai",`创建前提醒：你还没补齐这些关键职务：${u.map(A=>Xe[A]).join("、")}。
请先补齐，避免 workflow 落地时出现断层。`),v();return}if(!b.secretaryCanFinalize&&!Yi()){B("ai",`当前还没有看到你对 workflow 的明确拍板。
请先回复“同意执行”或勾选“授权秘书代拍”，我再创建办公室并开工。`),v();return}const g=(L=[...b.messages].reverse().find(A=>(A==null?void 0:A.sender)==="user"))==null?void 0:L.text,I=me(g).trim()||"一起讨论 Workerflow 的初步构想并形成执行计划";b.creating=!0,v();try{await Rn(I,`我们开始围绕这个目标讨论：${I}
请先输出 3 个澄清问题，再给出第一步落地建议。`,"Workerflow 共创办公室")&&tr()}finally{b.creating=!1,v()}}),(Ct=w.querySelector("#btn-flow-cancel"))==null||Ct.addEventListener("click",()=>{He(),v()}),w.querySelectorAll("[data-api-provider-add]").forEach(p=>{p.addEventListener("click",()=>{const u=br(p.dataset.apiScope);if(!u)return;const g=w.querySelector(`#${u}-add-provider-select`),I=Ue(g==null?void 0:g.value);I&&(pn(u,I),v())})}),w.querySelectorAll("[data-api-provider-toggle]").forEach(p=>{p.addEventListener("click",()=>{const u=br(p.dataset.apiScope),g=Ue(p.dataset.apiProvider);!u||!g||(cn(u,g),v())})}),(Tt=w.querySelector("#flow-goal"))==null||Tt.addEventListener("input",p=>{const u=p.currentTarget;y.goal=u.value}),(Lt=w.querySelector("#flow-office-name"))==null||Lt.addEventListener("input",p=>{const u=p.currentTarget;y.officeName=u.value}),(Ot=w.querySelector("#flow-max-rounds"))==null||Ot.addEventListener("input",p=>{const u=p.currentTarget;y.maxRounds=se(Number(u.value))}),(Mt=w.querySelector("#flow-max-rounds"))==null||Mt.addEventListener("blur",()=>{y.maxRounds=se(y.maxRounds),v()}),(qt=w.querySelector("#flow-plan-count"))==null||qt.addEventListener("change",p=>{const u=p.currentTarget;y.planCount=Math.max(2,Math.min(5,Number(u.value)||3)),Pn(),v()}),w.querySelectorAll("[data-flow-plan]").forEach(p=>{p.addEventListener("click",()=>{const u=p.dataset.flowPlan,g=mt.find(I=>I.id===u);g&&(y.selectedPlanId=g.id,y.maxRounds=se(g.rounds),v())})}),(Nt=w.querySelector("#flow-provider-strategy"))==null||Nt.addEventListener("change",p=>{const g=p.currentTarget.value==="single-provider"?"single-provider":"recommended";y.providerStrategy=g,v()}),(Dt=w.querySelector("#flow-single-provider"))==null||Dt.addEventListener("change",p=>{const g=p.currentTarget.value;ee.includes(g)&&(y.singleProvider=g,v())});for(const p of["flow","side"]){const u=["openai","openai_compatible","anthropic","google","deepseek"];for(const g of u){const I=w.querySelector(`#${Qr(p,g)}`);I==null||I.addEventListener("input",()=>{d.apiKeys[g]=I.value})}(jt=w.querySelector(`#${et(p)}`))==null||jt.addEventListener("input",g=>{const I=g.currentTarget;d.openaiCompatibleEndpoint=I.value}),(Kt=w.querySelector(`#${et(p)}`))==null||Kt.addEventListener("blur",()=>{d.openaiCompatibleEndpoint=d.openaiCompatibleEndpoint.trim(),v()}),(Gt=w.querySelector(`#${Yr(p)}`))==null||Gt.addEventListener("change",g=>{const I=g.currentTarget;kn(I.value),v()}),(Bt=w.querySelector(`#${tt(p)}`))==null||Bt.addEventListener("input",g=>{const I=g.currentTarget;d.anthropicCompatibleEndpoint=I.value}),(Ft=w.querySelector(`#${tt(p)}`))==null||Ft.addEventListener("blur",()=>{d.anthropicCompatibleEndpoint=d.anthropicCompatibleEndpoint.trim(),v()}),(Wt=w.querySelector(`#${Jr(p)}`))==null||Wt.addEventListener("change",g=>{const I=g.currentTarget;In(I.value),v()})}(Ut=w.querySelector("#btn-flow-sync-keys"))==null||Ut.addEventListener("click",async()=>{y.syncState="syncing",y.syncMessage="正在同步 Key 到引擎...",v();const p=await ge();y.syncState=p.ok?"success":"error",y.syncMessage=p.message,p.ok?z("全局 Keys 已同步","success"):z(p.message,"error"),v()}),(Ht=w.querySelector("#btn-flow-create"))==null||Ht.addEventListener("click",async()=>{const p=y.goal.trim(),u=y.officeName.trim();if(!p){z("请先输入本次 Workerflow 目标","error");return}if(!je()){y.syncState="error",y.syncMessage="请先配置并同步至少一个 API Key",v();return}ot();const g=W();if(!g){z("创建办公室失败，请重试","error");return}g.officeName=u||ro(),g.objective=p,g.maxRounds=se(y.maxRounds),g.members=ao(g.officeId),d.workspaceMode="offices";const I=vr(g);if(I.length>0){const L=I.map(A=>X[A]).join("、");He(),z(`办公室已创建，但缺少 ${L} 的 Key，请先补充后再启动`,"error"),v();return}j("syncing-keys"),v();try{const L=await ge();if(!L.ok){z(L.message,"error");return}He(),j("starting-office"),v();const A=await Je();A.ok?(so(g.officeId),z("办公室已创建并自动开始讨论","success")):z(`办公室已创建，但自动启动失败：${A.message}`,"error")}finally{j("none"),v()}});const i=w.querySelector("#office-name");i==null||i.addEventListener("input",()=>{e&&(e.officeName=i.value,v())});const n=w.querySelector("#office-objective");n==null||n.addEventListener("input",()=>{e&&(e.objective=n.value,v())});const s=w.querySelector("#office-max-rounds");s==null||s.addEventListener("input",()=>{e&&(e.maxRounds=se(Number(s.value)))}),s==null||s.addEventListener("blur",()=>{e&&(e.maxRounds=se(Number(s.value)),v())}),w.querySelectorAll("[data-member-enabled]").forEach(p=>{p.addEventListener("change",()=>{const u=Number(p.dataset.memberEnabled);if(!e)return;const g=e.members[u];g&&(g.enabled=p.checked,v())})}),w.querySelectorAll("[data-member-id]").forEach(p=>{p.addEventListener("input",()=>{const u=Number(p.dataset.memberId);if(!e)return;const g=e.members[u];g&&(g.participantId=p.value)}),p.addEventListener("blur",()=>{const u=Number(p.dataset.memberId);if(!e)return;const g=e.members[u];g&&(g.participantId=g.participantId.trim()||`${e.officeId}-member-${u+1}`,v())})}),w.querySelectorAll("[data-member-role]").forEach(p=>{p.addEventListener("change",()=>{const u=Number(p.dataset.memberRole);if(!e)return;const g=e.members[u];g&&(g.role=p.value,v())})}),w.querySelectorAll("[data-member-provider]").forEach(p=>{p.addEventListener("change",()=>{var I,L;const u=Number(p.dataset.memberProvider);if(!e)return;const g=e.members[u];g&&(g.provider=p.value,g.provider==="openai_compatible"?g.endpoint=((I=g.endpoint)==null?void 0:I.trim())||d.openaiCompatibleEndpoint.trim():g.provider==="anthropic"?g.endpoint=((L=g.endpoint)==null?void 0:L.trim())||d.anthropicCompatibleEndpoint.trim():g.endpoint="",v())})}),w.querySelectorAll("[data-member-endpoint]").forEach(p=>{p.addEventListener("input",()=>{const u=Number(p.dataset.memberEndpoint);if(!e)return;const g=e.members[u];g&&(g.endpoint=p.value)}),p.addEventListener("blur",()=>{var I;const u=Number(p.dataset.memberEndpoint);if(!e)return;const g=e.members[u];g&&(g.endpoint=((I=g.endpoint)==null?void 0:I.trim())||"",v())})}),w.querySelectorAll("[data-member-model]").forEach(p=>{p.addEventListener("input",()=>{const u=Number(p.dataset.memberModel);if(!e)return;const g=e.members[u];g&&(g.modelId=p.value)}),p.addEventListener("blur",()=>{const u=Number(p.dataset.memberModel);if(!e)return;const g=e.members[u];g&&(g.modelId=g.modelId.trim(),v())})});const a=w.querySelector("#human-input");a==null||a.addEventListener("input",()=>{e&&(d.humanDraftByOfficeId[e.officeId]=a.value)});const c=w.querySelector("#workflow-script");c==null||c.addEventListener("input",()=>{e&&(d.humanDraftByOfficeId[`workflow:${e.officeId}`]=c.value)}),(Zt=w.querySelector("#btn-set-keys"))==null||Zt.addEventListener("click",async()=>{j("syncing-keys"),v();try{const p=await ge();z(p.message,p.ok?"success":"error")}finally{j("none"),v()}}),(Vt=w.querySelector("#btn-start-office"))==null||Vt.addEventListener("click",async()=>{if(!e){z("请先新建办公室","error");return}if(!e.objective.trim()){z("请先填写办公室目标","error");return}const p=vr(e);if(p.length>0){const u=p.map(g=>X[g]).join("、");z(`缺少 ${u} 的 API Key，请先在右侧同步 Keys`,"error");return}j("starting-office"),v();try{const u=await ge();if(!u.ok){z(u.message,"error");return}const g=await Je();z(g.message,g.ok?"success":"error")}finally{j("none"),v()}}),(Qt=w.querySelector("#btn-stop-office"))==null||Qt.addEventListener("click",async()=>{j("stopping-office"),v();try{const p=await Ti();z(p.message,p.ok?"success":"error")}finally{j("none"),v()}}),(Yt=w.querySelector("#btn-send-human"))==null||Yt.addEventListener("click",async()=>{if(!e){z("请先新建办公室","error");return}const p=w.querySelector("#human-input"),u=(p==null?void 0:p.value)??"";if(!u.trim())return;const g=le(e.officeId);d.sessionId=g.sessionId,j("sending-human"),v();try{const I=await Br(u);z(I.message,I.ok?"success":"error"),I.ok&&(d.humanDraftByOfficeId[e.officeId]="",p&&(p.value=""))}finally{j("none"),v()}}),(Jt=w.querySelector("#btn-execute-workflow"))==null||Jt.addEventListener("click",async()=>{if(!e){z("请先新建办公室","error");return}const p=(c==null?void 0:c.value)??"";if(!p.trim()){z("请先输入 workflow JSON","error");return}const u=le(e.officeId);d.sessionId=u.sessionId,j("executing-workflow"),v();try{const g=await Li(p);z(g.message,g.ok?"success":"error")}finally{j("none"),v()}})}function Yn(){if(document.getElementById("donkey-studio-style"))return;const e=document.createElement("style");e.id="donkey-studio-style",e.textContent=`
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
      grid-template-columns: 56px 1fr 104px 124px 1fr 1.25fr;
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
      gap: 8px;
      background: #ffffff;
      position: sticky;
      bottom: 0;
    }
    .guide-thread {
      border: 1px solid #d6deea;
      border-radius: 10px;
      padding: 10px;
      background: #f8fafd;
      max-height: 320px;
      overflow: auto;
      display: grid;
      gap: 8px;
    }
    .guide-secretary-toggle {
      margin-top: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #3b4f73;
    }
    .guide-secretary-toggle input {
      width: 14px;
      height: 14px;
    }
    .guide-msg {
      border-radius: 10px;
      padding: 8px 10px;
      border: 1px solid #d6deea;
      background: #ffffff;
    }
    .guide-msg-ai {
      border-color: #c8d8ff;
      background: #eef4ff;
    }
    .guide-msg-user {
      border-color: #cde7d7;
      background: #effaf3;
    }
    .guide-msg-system {
      border-color: #e4d5ff;
      background: #f6f1ff;
    }
    .guide-msg-chunk-fallback {
      border-style: dashed;
      border-color: #c7d2fe;
      background: #f5f7ff;
    }
    .guide-msg-role {
      font-size: 11px;
      font-weight: 700;
      color: #3b4f73;
      margin-bottom: 4px;
    }
    .guide-msg-text {
      font-size: 13px;
      color: #24344d;
      line-height: 1.5;
    }
    .guide-msg-text:not(.md-body) {
      white-space: pre-wrap;
    }

    /* ─── Markdown 渲染样式 ─── */
    .md-body {
      font-size: 13px;
      line-height: 1.6;
      word-break: break-word;
    }
    .md-body p {
      margin: 0 0 8px 0;
    }
    .md-body p:last-child {
      margin-bottom: 0;
    }
    .md-body h1, .md-body h2, .md-body h3, .md-body h4, .md-body h5, .md-body h6 {
      margin: 12px 0 6px 0;
      font-weight: 700;
      line-height: 1.3;
    }
    .md-body h1 { font-size: 18px; }
    .md-body h2 { font-size: 16px; }
    .md-body h3 { font-size: 14px; }
    .md-body h4, .md-body h5, .md-body h6 { font-size: 13px; }
    .md-body strong { font-weight: 700; }
    .md-body em { font-style: italic; }
    .md-body ul, .md-body ol {
      margin: 4px 0 8px 0;
      padding-left: 20px;
    }
    .md-body li {
      margin-bottom: 2px;
    }
    .md-body li > p {
      margin: 0;
    }
    .md-body code {
      background: rgba(47, 111, 237, 0.08);
      border: 1px solid rgba(47, 111, 237, 0.15);
      border-radius: 4px;
      padding: 1px 4px;
      font-size: 12px;
      font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
    }
    .md-body pre {
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      overflow-x: auto;
      margin: 8px 0;
      font-size: 12px;
      line-height: 1.5;
    }
    .md-body pre code {
      background: transparent;
      border: none;
      padding: 0;
      color: inherit;
      font-size: inherit;
    }
    .md-body blockquote {
      border-left: 3px solid #2f6fed;
      margin: 8px 0;
      padding: 4px 12px;
      color: #4a5c75;
      background: rgba(47, 111, 237, 0.04);
      border-radius: 0 6px 6px 0;
    }
    .md-body blockquote p {
      margin: 0;
    }
    .md-body table {
      border-collapse: collapse;
      width: 100%;
      margin: 8px 0;
      font-size: 12px;
    }
    .md-body th, .md-body td {
      border: 1px solid #d6deea;
      padding: 6px 10px;
      text-align: left;
    }
    .md-body th {
      background: #f0f4fa;
      font-weight: 700;
    }
    .md-body tr:nth-child(even) {
      background: #f8fafd;
    }
    .md-body hr {
      border: none;
      border-top: 1px solid #d6deea;
      margin: 12px 0;
    }
    .md-body a {
      color: #2f6fed;
      text-decoration: none;
    }
    .md-body a:hover {
      text-decoration: underline;
    }
    .md-body img {
      max-width: 100%;
      border-radius: 6px;
    }
    .md-body del {
      text-decoration: line-through;
      color: #6f7d92;
    }

    /* ─── AI 思考动画 ─── */
    .guide-thinking {
      animation: thinking-pulse 2s ease-in-out infinite;
    }
    @keyframes thinking-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .thinking-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }
    .thinking-dots {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .thinking-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #2f6fed;
      animation: thinking-bounce 1.4s ease-in-out infinite;
    }
    .thinking-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    .thinking-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes thinking-bounce {
      0%, 80%, 100% {
        transform: scale(0.6);
        opacity: 0.4;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
    .thinking-label {
      font-size: 12px;
      color: #2f6fed;
      font-weight: 500;
    }

    .provider-manager {
      margin-top: 8px;
      display: grid;
      gap: 8px;
    }
    .provider-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .provider-toolbar-label {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
    }
    .provider-add-row {
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }
    .provider-add-row select {
      min-width: 180px;
      max-width: 260px;
    }
    .provider-card-list {
      display: grid;
      gap: 8px;
    }
    .provider-card {
      border: 1px solid #d6deea;
      border-radius: 10px;
      overflow: hidden;
      background: #ffffff;
    }
    .provider-card-head {
      width: 100%;
      border: 0;
      background: #f8fafd;
      border-bottom: 1px solid #e4ecf8;
      color: #1e3a8a;
      padding: 8px 10px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .provider-card-head:hover {
      background: #eef4ff;
    }
    .provider-card-body {
      padding: 8px;
      display: grid;
      gap: 6px;
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

    /* 全局 API 多接口卡片 */
    .global-api-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 8px;
    }
    .global-api-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      transition: border-color 0.15s;
    }
    .global-api-card-active {
      border-color: var(--accent, #3b82f6);
      box-shadow: 0 0 0 1px var(--accent, #3b82f6);
    }
    .global-api-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .global-api-card-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-shrink: 0;
    }
    .btn-sm {
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid var(--line);
      background: var(--bg);
      color: var(--fg);
    }
    .btn-sm:hover {
      background: var(--hover, #f0f0f0);
    }
    .btn-sm.btn-danger {
      color: #dc2626;
      border-color: #fca5a5;
    }
    .btn-sm.btn-danger:hover {
      background: #fef2f2;
    }
    .btn-sm:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 500;
    }
    .badge-active {
      background: #dbeafe;
      color: #1d4ed8;
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

    /* Refined warm theme */
    :root {
      --bg: #f5efe4;
      --panel: #f6efe3;
      --panel-soft: #fbf7f0;
      --panel-strong: #efe5d6;
      --line: #dccfb9;
      --line-strong: #ccb89a;
      --text: #2f2a22;
      --muted: #8a7c6a;
      --card: #f8f1e6;
      --accent: #c78133;
      --accent-strong: #a6631d;
      --accent-soft: #f2e2c8;
      --success: #2f7a45;
      --danger: #b54a3a;
      --radius-lg: 16px;
      --radius-md: 12px;
      --shadow-sm: 0 6px 16px rgba(71, 53, 25, 0.08);
      --shadow-md: 0 16px 32px rgba(71, 53, 25, 0.12);
    }
    html, body {
      background:
        radial-gradient(circle at -10% -20%, #fdfaf2 0%, rgba(253, 250, 242, 0) 55%),
        linear-gradient(180deg, #f6f1e8 0%, #f3eee5 100%);
      color: var(--text);
    }
    #app {
      padding: 16px;
    }
    .frame {
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: var(--panel-soft);
      box-shadow: var(--shadow-sm);
      min-height: calc(100vh - 32px);
    }
    .topbar {
      height: 88px;
      padding: 0 18px;
      border-bottom: 1px solid var(--line);
      background: linear-gradient(180deg, #fffdf8 0%, #f7f1e6 100%);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: inline-grid;
      place-items: center;
      background: var(--accent-soft);
      border: 1px solid #e6ccaa;
      font-size: 20px;
    }
    .brand-copy {
      display: grid;
      gap: 2px;
    }
    .brand-text {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 0.2px;
      color: #2e271f;
      line-height: 1;
    }
    .brand-sub {
      font-size: 12px;
      color: var(--muted);
      line-height: 1;
    }
    .topbar-right {
      display: inline-flex;
      align-items: center;
    }
    .engine-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: #fff8ee;
      color: #8a7462;
      font-weight: 600;
      letter-spacing: 0.1px;
    }
    .engine-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #ada395;
      box-shadow: 0 0 0 2px rgba(173, 163, 149, 0.28);
      flex-shrink: 0;
    }
    .engine-status.online {
      color: #7d541f;
      border-color: #dbb786;
      background: #fff2e0;
    }
    .engine-status.online .engine-dot {
      background: var(--accent);
      box-shadow: 0 0 0 2px rgba(199, 129, 51, 0.26);
    }
    .engine-status.offline {
      color: #8a7c6a;
      border-color: var(--line-strong);
      background: #f7f0e4;
    }

    .body {
      grid-template-columns: 248px 1fr 368px;
      min-height: calc(100vh - 120px);
      background: var(--panel-soft);
    }
    .body.no-right-panel {
      grid-template-columns: 248px 1fr;
    }
    .left-nav {
      display: flex;
      flex-direction: column;
      padding: 14px 12px;
      border-right: 1px solid var(--line);
      background: linear-gradient(180deg, #f2ebdf 0%, #efe7d8 100%);
      gap: 12px;
    }
    .nav-group {
      display: grid;
      gap: 8px;
    }
    .nav-item {
      border: 1px solid transparent;
      border-radius: 12px;
      background: transparent;
      color: #514537;
      padding: 10px 12px;
      font-size: 15px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-align: left;
      transition: all 140ms ease;
    }
    .nav-item:hover {
      border-color: #dfcdb4;
      background: #f8f0e2;
      color: #3f3428;
    }
    .nav-item.active {
      border-color: #d9b483;
      background: linear-gradient(180deg, #f6e8d2 0%, #f2dfc2 100%);
      color: #7e4f1d;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }
    .nav-icon {
      width: 18px;
      height: 18px;
      display: inline-grid;
      place-items: center;
      flex-shrink: 0;
    }
    .nav-text {
      line-height: 1;
    }
    .nav-bottom {
      margin-top: auto;
    }
    .profile {
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid #ddcfb8;
      border-radius: 12px;
      background: #f8f2e7;
      padding: 10px;
    }
    .profile-avatar {
      width: 30px;
      height: 30px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: var(--accent-soft);
      color: var(--accent-strong);
      font-weight: 700;
      border: 1px solid #e6ccaa;
      flex-shrink: 0;
    }
    .profile-copy {
      display: grid;
      gap: 2px;
      line-height: 1.1;
    }
    .profile-name {
      color: #4a3d30;
      font-size: 13px;
      font-weight: 700;
    }
    .profile-role {
      color: var(--muted);
      font-size: 11px;
    }

    .center {
      padding: 18px;
      border-right: 1px solid var(--line);
      background: var(--panel-soft);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(220px, 1fr));
      gap: 14px;
    }
    .office-card {
      min-height: 164px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: linear-gradient(180deg, #fffdf8 0%, #faf3e8 100%);
      box-shadow: 0 4px 12px rgba(65, 48, 24, 0.07);
      color: var(--text);
      text-align: left;
      padding: 14px;
      display: grid;
      gap: 7px;
      align-content: start;
      transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
    }
    .office-card:hover {
      border-color: #d6b183;
      box-shadow: 0 10px 18px rgba(65, 48, 24, 0.12);
      transform: translateY(-1px);
    }
    .office-card.active {
      border-color: var(--accent);
      background: linear-gradient(180deg, #fff8ee 0%, #f7ead7 100%);
      box-shadow: 0 0 0 1px rgba(199, 129, 51, 0.24) inset;
    }
    .office-card.add {
      place-items: center;
      text-align: center;
      border-style: dashed;
      border-color: #d6bb96;
      background: linear-gradient(180deg, #f9f1e4 0%, #f3e5cf 100%);
      color: #93602a;
      gap: 4px;
    }
    .office-add-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: inline-grid;
      place-items: center;
      background: #f2dfc2;
      border: 1px solid #e0be8f;
      font-size: 24px;
      line-height: 1;
      font-weight: 500;
    }
    .office-add-title {
      font-size: 22px;
      font-weight: 700;
      color: #7f4f1f;
      line-height: 1.2;
    }
    .office-add-sub {
      font-size: 12px;
      color: #8f7b63;
      max-width: 220px;
      line-height: 1.4;
    }
    .office-title {
      font-size: 18px;
      font-weight: 800;
      color: #3a3127;
    }
    .office-line {
      color: #675949;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .office-meta {
      margin-top: auto;
      font-size: 12px;
      color: var(--muted);
    }

    .right-panel {
      padding: 16px;
      overflow: auto;
      background: linear-gradient(180deg, #f1eadf 0%, #eee5d7 100%);
    }
    .right-title {
      font-size: 30px;
      line-height: 1.1;
      font-weight: 800;
      color: #2f281f;
      margin-top: 2px;
    }
    .right-sub {
      margin-top: 6px;
      margin-bottom: 2px;
      font-size: 12px;
      color: #857666;
    }
    .discussion-box {
      margin-top: 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      min-height: 220px;
      max-height: 320px;
      padding: 10px;
      overflow: auto;
      background: #fffcf6;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }
    .message-item {
      margin-bottom: 8px;
      border: 1px solid #e2d5c2;
      border-radius: 10px;
      padding: 9px;
      background: #f9f2e6;
    }
    .message-head {
      color: #8f5a20;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .message-body {
      color: #4d4336;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .field {
      display: grid;
      gap: 6px;
      margin-top: 11px;
    }
    .field span {
      color: #77695b;
      font-size: 12px;
      font-weight: 600;
    }
    input, textarea, select {
      width: 100%;
      border: 1px solid #d8c9b2;
      border-radius: 10px;
      background: #fffaf2;
      color: var(--text);
      padding: 9px 10px;
      font-size: 13px;
      transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
    }
    textarea {
      resize: vertical;
      line-height: 1.45;
    }
    #workflow-script,
    #settings-global-import {
      font-family: "Cascadia Code", "Fira Code", monospace;
      font-size: 12px;
      line-height: 1.5;
    }
    input, textarea, select, button {
      outline: none;
    }
    input:focus-visible, textarea:focus-visible, select:focus-visible, button:focus-visible {
      border-color: #d39a58;
      box-shadow: 0 0 0 3px rgba(199, 129, 51, 0.2);
      background: #fffdf9;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    button {
      border: 1px solid #d3bf9e;
      border-radius: 10px;
      background: #f8f0e2;
      color: #6d4b23;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.1px;
      padding: 8px 12px;
      cursor: pointer;
      transition: transform 110ms ease, background-color 110ms ease, border-color 110ms ease;
    }
    button:hover {
      background: #f4e4cb;
      border-color: #d0aa76;
    }
    button:active {
      transform: translateY(1px);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    #btn-start-office,
    #btn-send-human,
    #btn-set-keys,
    #btn-flow-create,
    #btn-guide-send,
    #btn-guide-create,
    #btn-flow-sync-keys,
    #btn-settings-sync-global,
    #btn-settings-import-global {
      background: linear-gradient(180deg, #cf8c3f 0%, #c07a2f 100%);
      border-color: #c07a2f;
      color: #fffaf1;
      box-shadow: 0 4px 10px rgba(166, 99, 29, 0.22);
    }
    #btn-start-office:hover,
    #btn-send-human:hover,
    #btn-set-keys:hover,
    #btn-flow-create:hover,
    #btn-guide-send:hover,
    #btn-guide-create:hover,
    #btn-flow-sync-keys:hover,
    #btn-settings-sync-global:hover,
    #btn-settings-import-global:hover {
      background: linear-gradient(180deg, #d5954c 0%, #c88439 100%);
      border-color: #bf7b31;
    }
    #btn-stop-office {
      background: #fff1ee;
      border-color: #e5b7af;
      color: #a14537;
    }
    #btn-stop-office:hover {
      background: #ffe6e2;
      border-color: #dca59b;
    }
    #btn-flow-cancel,
    #btn-guide-cancel {
      background: #f7f0e3;
      color: #67523a;
      border-color: #d6c4aa;
    }
    .danger {
      border-color: #e1aea5;
      background: #fff2f0;
      color: #a84336;
    }
    .danger:hover {
      background: #ffe7e3;
    }

    .right-divider {
      border-top: 1px dashed #d5c6af;
      margin: 14px 0;
    }
    .member-list {
      display: grid;
      gap: 8px;
    }
    .member-row {
      border: 1px solid #ddceb7;
      border-radius: 10px;
      padding: 9px;
      background: #fffaf2;
    }
    .member-row b {
      display: block;
      font-size: 13px;
      color: #3f3429;
    }
    .member-row span {
      color: #8f5a20;
      font-size: 12px;
      font-weight: 600;
    }
    .member-row p {
      margin: 4px 0 0;
      color: #6f6356;
      font-size: 12px;
      line-height: 1.45;
    }

    .member-editor {
      margin-top: 12px;
      border: 1px solid #ddceb7;
      border-radius: 12px;
      padding: 10px;
      background: #fff9f0;
      display: grid;
      gap: 8px;
    }
    .member-editor-title {
      font-size: 12px;
      font-weight: 700;
      color: #5f4a31;
    }
    .member-editor-row {
      display: grid;
      grid-template-columns: 56px 1fr 104px 124px 1fr 1.25fr;
      gap: 6px;
      align-items: center;
    }
    .check {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #6f6356;
      font-weight: 600;
    }
    .check input {
      width: 14px;
      height: 14px;
      margin: 0;
      padding: 0;
    }

    .provider-manager {
      margin-top: 8px;
      display: grid;
      gap: 8px;
    }
    .provider-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .provider-toolbar-label {
      color: #5b4730;
      font-size: 12px;
      font-weight: 700;
    }
    .provider-add-row {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .provider-add-row select {
      min-width: 180px;
      max-width: 260px;
    }
    .provider-card-list {
      display: grid;
      gap: 8px;
    }
    .provider-card {
      border: 1px solid #ddceb7;
      border-radius: 10px;
      background: #fffaf2;
      overflow: hidden;
    }
    .provider-card-head {
      width: 100%;
      border: 0;
      border-bottom: 1px solid #e8dcca;
      border-radius: 0;
      background: #f7eddc;
      color: #6f4822;
      padding: 9px 10px;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .provider-card-head:hover {
      background: #f3e4cd;
      border-color: #cfb188;
    }
    .provider-card-body {
      display: grid;
      gap: 6px;
      padding: 8px;
    }

    .toast-stack {
      right: 20px;
      bottom: 20px;
      max-width: 360px;
    }
    .toast {
      border-radius: 12px;
      border: 1px solid #ddceb7;
      background: #fff9f0;
      color: #4f4134;
      padding: 10px 12px;
      font-size: 12px;
      box-shadow: var(--shadow-sm);
    }
    .toast-success {
      border-color: #bdd9c5;
      background: #f0fbf3;
      color: #235f35;
    }
    .toast-error {
      border-color: #e8b7b0;
      background: #fff3f1;
      color: #9d3e32;
    }
    .toast-info {
      border-color: #d9c7ad;
      background: #faf3e7;
      color: #78572f;
    }

    .flow-modal-mask {
      background: rgba(45, 33, 18, 0.32);
      backdrop-filter: blur(2px);
      padding: 22px;
    }
    .flow-modal {
      border: 1px solid #dccfb9;
      border-radius: 14px;
      background: #fffaf2;
      box-shadow: var(--shadow-md);
    }
    .flow-modal-head {
      border-bottom: 1px solid #e5d7c3;
      padding: 12px 14px;
      background: linear-gradient(180deg, #fdf8ef 0%, #f7efdf 100%);
    }
    .flow-modal-title {
      color: #3b3023;
      font-size: 20px;
      font-weight: 800;
    }
    .flow-modal-sub {
      color: #867868;
      font-size: 12px;
    }
    .flow-modal-body {
      display: grid;
      gap: 12px;
      padding: 14px;
    }
    .flow-section {
      border: 1px solid #dfd1bb;
      border-radius: 12px;
      background: #fff7eb;
      padding: 10px;
    }
    .flow-alert {
      border-color: #e9beb7;
      background: #fff2f0;
    }
    .flow-section-title {
      margin-bottom: 8px;
      color: #6f4a24;
      font-size: 13px;
      font-weight: 800;
    }
    .flow-plan-grid {
      margin-top: 8px;
      display: grid;
      grid-template-columns: repeat(2, minmax(220px, 1fr));
      gap: 8px;
    }
    .flow-plan-card {
      border: 1px solid #dfceb5;
      border-radius: 10px;
      background: #fffaf2;
      text-align: left;
      padding: 10px;
      display: grid;
      gap: 6px;
      cursor: pointer;
    }
    .flow-plan-card.active {
      border-color: #d39a58;
      box-shadow: 0 0 0 1px rgba(199, 129, 51, 0.2) inset;
      background: #fff1dd;
    }
    .flow-plan-title {
      color: #5a3f20;
      font-size: 13px;
      font-weight: 800;
    }
    .flow-plan-summary {
      color: #665a4c;
      font-size: 12px;
      line-height: 1.45;
    }
    .flow-plan-meta {
      color: #8c7d6c;
      font-size: 11px;
    }
    .flow-preview-box {
      margin-top: 10px;
      border: 1px dashed #d5c1a4;
      border-radius: 10px;
      background: #fffaf2;
      padding: 8px;
      display: grid;
      gap: 6px;
    }
    .flow-preview-title {
      color: #6a4a25;
      font-size: 12px;
      font-weight: 700;
    }
    .flow-preview-row {
      display: grid;
      grid-template-columns: 110px 120px 1fr;
      gap: 8px;
      align-items: center;
      color: #5e5447;
      font-size: 12px;
    }
    .flow-preview-role {
      color: #5d4020;
      font-weight: 700;
    }
    .flow-preview-provider {
      color: #a0601d;
      font-weight: 600;
    }
    .flow-preview-model {
      color: #72685d;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .flow-sync-msg {
      margin-top: 8px;
      font-size: 12px;
      color: #72685d;
    }
    .flow-sync-success {
      color: #22603a;
    }
    .flow-sync-error {
      color: #a64537;
    }
    .flow-modal-foot {
      border-top: 1px solid #e5d7c3;
      padding: 12px 14px;
      background: #fbf4e7;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .guide-thread {
      border: 1px solid #ddceb7;
      border-radius: 12px;
      background: #fffaf2;
      max-height: 320px;
      overflow: auto;
      padding: 10px;
      display: grid;
      gap: 8px;
    }
    .guide-secretary-toggle {
      margin-top: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #6b4a27;
    }
    .guide-secretary-toggle input {
      width: 14px;
      height: 14px;
    }
    .guide-msg {
      border: 1px solid #e0d2bc;
      border-radius: 10px;
      padding: 8px 10px;
      background: #fffefb;
    }
    .guide-msg-ai {
      border-color: #e3cfb0;
      background: #fff4e5;
    }
    .guide-msg-user {
      border-color: #d6ddc6;
      background: #f4f8ea;
    }
    .guide-msg-system {
      border-color: #d9d2ea;
      background: #f5f2fc;
    }
    .guide-msg-role {
      margin-bottom: 4px;
      color: #6b4a27;
      font-size: 11px;
      font-weight: 800;
    }
    .guide-msg-text {
      color: #43392d;
      font-size: 13px;
      line-height: 1.5;
    }
    .guide-msg-text:not(.md-body) {
      white-space: pre-wrap;
    }

    /* ─── 暗色主题 Markdown 覆盖 ─── */
    .md-body code {
      background: rgba(160, 96, 29, 0.1);
      border-color: rgba(160, 96, 29, 0.2);
    }
    .md-body pre {
      background: #2c2418;
      color: #e8ddd0;
    }
    .md-body blockquote {
      border-left-color: #a0601d;
      background: rgba(160, 96, 29, 0.06);
      color: #72685d;
    }
    .md-body th {
      background: #f0e8d8;
    }
    .md-body th, .md-body td {
      border-color: #ddceb7;
    }
    .md-body tr:nth-child(even) {
      background: #faf3e6;
    }
    .md-body hr {
      border-top-color: #ddceb7;
    }
    .md-body a {
      color: #a0601d;
    }
    .thinking-dot {
      background: #a0601d;
    }
    .thinking-label {
      color: #a0601d;
    }

    .dashboard-view, .subscription-view {
      padding: 4px 0;
    }
    .view-title {
      margin: 0 0 4px 0;
      font-size: 32px;
      font-weight: 800;
      color: #352c22;
      line-height: 1.12;
    }
    .view-desc {
      margin: 0 0 16px 0;
      color: #857868;
      font-size: 13px;
    }
    .dash-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .dash-card {
      border: 1px solid #decfb8;
      border-radius: 12px;
      background: #fff8ee;
      padding: 14px;
      box-shadow: 0 3px 8px rgba(66, 48, 24, 0.06);
    }
    .dash-card-label {
      margin-bottom: 6px;
      color: #8a7c6a;
      font-size: 12px;
      font-weight: 600;
    }
    .dash-card-value {
      font-size: 24px;
      font-weight: 800;
      color: #3b3023;
    }
    .dash-section {
      margin-bottom: 18px;
      border: 1px solid #deceb6;
      border-radius: 12px;
      background: #fff9f0;
      padding: 12px;
    }
    .dash-section h3 {
      margin: 0 0 10px 0;
      color: #5d452a;
      font-size: 15px;
      font-weight: 800;
    }
    .dash-table-wrap {
      overflow-x: auto;
      border: 1px solid #e6d9c6;
      border-radius: 10px;
      background: #fffdf9;
    }
    .dash-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .dash-table th,
    .dash-table td {
      border-bottom: 1px solid #eee1cf;
      padding: 9px 10px;
      text-align: left;
      vertical-align: top;
    }
    .dash-table th {
      color: #8f7f6a;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      background: #f8f0e3;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .summary-cell {
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
    }
    .status-idle { background: #ece3d5; color: #756858; }
    .status-starting { background: #fae8cf; color: #9a651f; }
    .status-running { background: #e9f2de; color: #3d6f32; }
    .status-completed { background: #e4ecf9; color: #345980; }
    .status-stopped { background: #ece6dc; color: #766b5f; }
    .status-error { background: #fbe4e1; color: #a4473a; }

    .log-box {
      border: 1px solid #e3d6c2;
      border-radius: 10px;
      background: #fffdf9;
      max-height: 300px;
      overflow: auto;
      padding: 10px;
      font-family: "Cascadia Code", "Fira Code", monospace;
    }
    .log-line {
      font-size: 11px;
      color: #625647;
      border-bottom: 1px solid #eee2d1;
      padding: 3px 0;
      word-break: break-all;
    }

    .sub-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    .sub-tab {
      border: 1px solid #d8c6a9;
      border-radius: 10px;
      background: #f9f0e1;
      color: #7b6243;
      font-size: 13px;
      font-weight: 600;
      padding: 7px 14px;
      cursor: pointer;
    }
    .sub-tab:hover {
      background: #f4e2c8;
      border-color: #d0aa76;
    }
    .sub-tab.active {
      border-color: #d39a58;
      background: #f3dfbf;
      color: #744418;
      font-weight: 700;
    }
    .sub-content {
      max-height: calc(100vh - 290px);
      overflow: auto;
    }
    .sub-event-item {
      border: 1px solid #decfb8;
      border-radius: 10px;
      background: #fff8ef;
      padding: 10px;
      margin-bottom: 8px;
    }
    .sub-event-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .sub-event-method {
      color: #8f5a20;
      font-size: 13px;
      font-weight: 700;
    }
    .sub-event-time {
      color: #8a7c6a;
      font-size: 11px;
    }
    .sub-event-body {
      margin: 0;
      border-radius: 8px;
      background: #f9f0e2;
      color: #5d5247;
      font-size: 11px;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 120px;
      overflow: auto;
      padding: 7px;
    }
    .sub-chunk-item {
      border: 1px solid #dcc9ad;
      border-radius: 10px;
      background: #fff3e1;
      padding: 10px;
      margin-bottom: 8px;
    }
    .sub-chunk-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .sub-chunk-participant {
      color: #8f5a20;
      font-size: 13px;
      font-weight: 700;
    }
    .sub-chunk-meta {
      color: #8a7c6a;
      font-size: 11px;
    }
    .sub-chunk-body {
      color: #4f4538;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .global-api-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 8px;
    }
    .global-api-card {
      margin-bottom: 0;
      border: 1px solid #ddceb7;
      border-radius: 12px;
      padding: 14px;
      background: #fff9f0;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .global-api-card-active {
      border-color: #d39a58;
      box-shadow: 0 0 0 1px rgba(199, 129, 51, 0.22);
    }
    .global-api-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .global-api-card-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .btn-sm {
      border: 1px solid #d3bf9e;
      border-radius: 8px;
      background: #f8f0e2;
      color: #6d4b23;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      cursor: pointer;
    }
    .btn-sm:hover {
      background: #f4e4cb;
      border-color: #d0aa76;
    }
    .btn-sm.btn-danger {
      color: #a74437;
      border-color: #dfb0aa;
      background: #fff1ee;
    }
    .btn-sm.btn-danger:hover {
      background: #ffe7e3;
      border-color: #dca59b;
    }
    .btn-sm:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .badge {
      display: inline-block;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
    }
    .badge-active {
      background: #f3dfbf;
      color: #744418;
    }
    .muted {
      color: #8a7c6a;
      font-size: 12px;
      line-height: 1.45;
    }

    @media (max-width: 1600px) {
      .body { grid-template-columns: 220px 1fr 340px; }
      .body.no-right-panel { grid-template-columns: 220px 1fr; }
      .grid { grid-template-columns: repeat(2, minmax(220px, 1fr)); }
      .dash-summary-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 1200px) {
      .body,
      .body.no-right-panel {
        grid-template-columns: 1fr;
      }
      .left-nav {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .nav-group {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .nav-item {
        justify-content: center;
        padding: 10px 8px;
      }
      .nav-text {
        font-size: 13px;
      }
      .center {
        border-right: 0;
      }
      .right-panel {
        border-top: 1px solid var(--line);
      }
      .member-editor-row {
        grid-template-columns: 56px 1fr;
      }
      .flow-plan-grid {
        grid-template-columns: 1fr;
      }
      .flow-preview-row {
        grid-template-columns: 1fr;
      }
      .dash-summary-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 760px) {
      #app {
        padding: 10px;
      }
      .frame {
        border-radius: 12px;
        min-height: calc(100vh - 20px);
      }
      .topbar {
        height: auto;
        padding: 12px;
        gap: 10px;
        align-items: flex-start;
        flex-direction: column;
      }
      .brand-text {
        font-size: 28px;
      }
      .brand-sub {
        font-size: 11px;
      }
      .nav-group {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .grid {
        grid-template-columns: 1fr;
      }
      .dash-summary-grid {
        grid-template-columns: 1fr;
      }
      .view-title {
        font-size: 26px;
      }
      .global-api-card-header {
        flex-wrap: wrap;
      }
      .sub-event-head,
      .sub-chunk-head {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    /* Crisp modern override */
    :root {
      --bg: #f3f5f8;
      --panel: #ffffff;
      --panel-soft: #f8fafc;
      --panel-strong: #eef2f6;
      --line: #d9e0ea;
      --line-strong: #c7d2e0;
      --text: #0f172a;
      --muted: #64748b;
      --card: #ffffff;
      --accent: #f59e0b;
      --accent-strong: #d97706;
      --accent-soft: #fff7e6;
      --danger: #dc2626;
      --radius-lg: 12px;
      --radius-md: 10px;
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 10px;
      --space-4: 12px;
      --space-5: 14px;
      --space-6: 16px;
      --space-7: 18px;
      --space-8: 20px;
      --space-9: 24px;
      --font-xs: 11px;
      --font-sm: 12px;
      --font-md: 13px;
      --font-lg: 14px;
      --font-xl: 18px;
      --font-2xl: 22px;
      --font-3xl: 24px;
      --font-display: 30px;
      --lh-tight: 1.2;
      --lh-normal: 1.5;
      --lh-relaxed: 1.6;
      --shadow-sm: 0 4px 14px rgba(15, 23, 42, 0.06);
      --shadow-md: 0 18px 38px rgba(15, 23, 42, 0.18);
    }
    html, body {
      background: linear-gradient(180deg, #f5f7fb 0%, #f1f4f8 100%);
      color: var(--text);
    }
    #app {
      padding: var(--space-5);
    }
    .frame {
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: var(--panel);
      box-shadow: var(--shadow-sm);
      min-height: calc(100vh - (var(--space-5) * 2));
    }
    .topbar {
      height: 68px;
      padding: 0 var(--space-6);
      border-bottom: 1px solid var(--line);
      background: #ffffff;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
    }
    .brand-icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: inline-grid;
      place-items: center;
      border: 1px solid #ffe8ba;
      background: var(--accent-soft);
      font-size: 17px;
    }
    .brand-copy {
      display: grid;
      gap: var(--space-1);
      line-height: 1;
    }
    .brand-text {
      font-size: 26px;
      font-weight: 800;
      color: #111827;
      letter-spacing: 0;
    }
    .brand-sub {
      font-size: var(--font-xs);
      color: var(--muted);
    }
    .engine-status {
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: #f8fafc;
      color: #475569;
      padding: calc(var(--space-1) + 2px) calc(var(--space-2) + 3px);
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }
    .engine-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #94a3b8;
      box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.26);
      flex-shrink: 0;
    }
    .engine-status.online {
      border-color: #f0c36b;
      color: #b45309;
      background: #fffbf0;
    }
    .engine-status.online .engine-dot {
      background: var(--accent);
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.24);
    }

    .body {
      grid-template-columns: 224px 1fr 352px;
      min-height: calc(100vh - 82px);
      background: #ffffff;
    }
    .body.no-right-panel {
      grid-template-columns: 224px 1fr;
    }
    .left-nav {
      background: var(--panel-soft);
      border-right: 1px solid var(--line);
      padding: var(--space-4) var(--space-3);
      gap: var(--space-3);
    }
    .nav-group {
      display: grid;
      gap: 6px;
    }
    .nav-item {
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      background: transparent;
      color: #334155;
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-lg);
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
      text-align: left;
      transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
    }
    .nav-item:hover {
      border-color: var(--line);
      background: #ffffff;
      color: #0f172a;
    }
    .nav-item.active {
      border-color: var(--line-strong);
      background: #ffffff;
      color: #0f172a;
      box-shadow: inset 3px 0 0 var(--accent);
    }
    .nav-icon {
      width: 18px;
      height: 18px;
      color: #64748b;
    }
    .nav-item.active .nav-icon {
      color: #b45309;
    }
    .profile {
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      background: #ffffff;
      padding: var(--space-3);
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    .profile-avatar {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      background: #eef2f7;
      border: 1px solid var(--line);
      color: #334155;
      font-size: 12px;
      font-weight: 700;
      display: grid;
      place-items: center;
    }
    .profile-name {
      color: #0f172a;
      font-size: var(--font-md);
      font-weight: 700;
    }
    .profile-role {
      color: var(--muted);
      font-size: var(--font-xs);
    }

    .center {
      border-right: 1px solid var(--line);
      background: #f5f7fb;
      padding: var(--space-6);
    }
    .right-panel {
      background: var(--panel-soft);
      padding: var(--space-5);
    }
    .right-title {
      font-size: 24px;
      line-height: 1.2;
      font-weight: 800;
      color: #111827;
      margin-top: 0;
    }
    .right-sub {
      font-size: var(--font-sm);
      color: var(--muted);
      margin-top: var(--space-1);
    }

    .grid {
      grid-template-columns: repeat(3, minmax(210px, 1fr));
      gap: var(--space-4);
    }
    .office-card {
      min-height: 156px;
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      padding: var(--space-4);
      gap: var(--space-2);
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }
    .office-card:hover {
      border-color: #f2c572;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
      transform: none;
    }
    .office-card.active {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2);
      background: #fffdfa;
    }
    .office-title {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
    }
    .office-line {
      color: #475569;
      font-size: var(--font-sm);
    }
    .office-meta {
      color: #64748b;
      font-size: var(--font-sm);
    }
    .office-card.add {
      border-style: dashed;
      border-color: #f2c572;
      background: #fffdf8;
      color: #92400e;
      gap: 5px;
    }
    .office-add-icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: var(--accent-soft);
      border: 1px solid #f6d79a;
      font-size: 20px;
      display: inline-grid;
      place-items: center;
    }
    .office-add-title {
      font-size: 18px;
      font-weight: 700;
      color: #92400e;
    }
    .office-add-sub {
      font-size: 12px;
      color: #64748b;
      max-width: 220px;
    }

    .field {
      gap: var(--space-2);
      margin-top: var(--space-3);
    }
    .field span {
      color: #475569;
      font-size: var(--font-sm);
      font-weight: 600;
    }
    input, textarea, select {
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      background: #ffffff;
      color: var(--text);
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-md);
    }
    input:focus-visible, textarea:focus-visible, select:focus-visible, button:focus-visible {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
    }

    button {
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      background: #ffffff;
      color: #334155;
      font-size: var(--font-md);
      font-weight: 600;
      padding: var(--space-2) calc(var(--space-2) + 3px);
      transition: border-color 120ms ease, background-color 120ms ease;
    }
    button:hover {
      border-color: #f2c572;
      background: #fffaf0;
    }
    #btn-start-office,
    #btn-send-human,
    #btn-set-keys,
    #btn-flow-create,
    #btn-guide-send,
    #btn-guide-create,
    #btn-flow-sync-keys,
    #btn-settings-sync-global,
    #btn-settings-import-global {
      border-color: var(--accent-strong);
      background: var(--accent);
      color: #ffffff;
      box-shadow: none;
    }
    #btn-start-office:hover,
    #btn-send-human:hover,
    #btn-set-keys:hover,
    #btn-flow-create:hover,
    #btn-guide-send:hover,
    #btn-guide-create:hover,
    #btn-flow-sync-keys:hover,
    #btn-settings-sync-global:hover,
    #btn-settings-import-global:hover {
      border-color: #b45309;
      background: #d97706;
    }
    #btn-stop-office {
      border-color: #fecaca;
      background: #fef2f2;
      color: #b91c1c;
    }
    #btn-stop-office:hover {
      border-color: #fca5a5;
      background: #fee2e2;
    }

    .discussion-box,
    .member-editor,
    .member-row,
    .provider-card,
    .dash-section,
    .global-api-card,
    .sub-event-item,
    .sub-chunk-item,
    .flow-section,
    .flow-plan-card,
    .flow-preview-box,
    .log-box {
      border-color: var(--line);
      background: #ffffff;
    }
    .flow-modal-mask {
      background: rgba(15, 23, 42, 0.42);
      backdrop-filter: blur(8px);
    }
    .flow-modal {
      border-color: #e7d7bf;
      border-radius: 16px;
      box-shadow: 0 18px 42px rgba(15, 23, 42, 0.24);
      background: linear-gradient(180deg, #fffdf9 0%, #fff8ed 100%);
    }
    .flow-modal-head {
      border-bottom: 1px solid #eadcc7;
      background: linear-gradient(180deg, #fffaf2 0%, #fff3e3 100%);
    }
    .flow-modal-foot {
      border-top: 1px solid #eadcc7;
      background: #fff7ea;
      position: sticky;
      bottom: 0;
      z-index: 2;
    }
    .guide-thread {
      border: 1px solid #eadac2;
      border-radius: 14px;
      background: linear-gradient(180deg, #fffaf2 0%, #fffdf9 100%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
      max-height: 360px;
      padding: 12px;
      gap: 10px;
    }
    .guide-msg {
      border: 1px solid #e8d8c2;
      border-radius: 12px;
      padding: 10px 12px;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
    }
    .guide-msg-ai {
      border-left: 4px solid #d39a58;
      background: #fff5e7;
    }
    .guide-msg-user {
      border-left: 4px solid #78a35f;
      background: #f4f9ee;
    }
    .guide-msg-system {
      border-left: 4px solid #8f78c8;
      background: #f7f3ff;
    }
    .guide-msg-chunk-fallback {
      border-style: dashed;
      border-left-width: 4px;
      border-color: #d8c8f6;
      background: #f7f4ff;
    }
    .guide-msg-role {
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 6px;
      color: #5f4325;
    }
    .guide-msg-text {
      font-size: 13px;
      line-height: 1.6;
      color: #43392d;
    }
    .guide-thinking {
      border-style: dashed;
      border-color: #ebd6bb;
      background: #fff7ea;
    }
    .thinking-indicator {
      gap: 10px;
    }
    .thinking-label {
      font-size: 12px;
      font-weight: 600;
      color: #9a6228;
    }
    #guide-input {
      min-height: 96px;
      border-radius: 10px;
      background: #fffdf9;
    }
    .body {
      background: linear-gradient(180deg, #f8fafd 0%, #f4f7fb 100%);
    }
    .left-nav {
      background: linear-gradient(180deg, #ffffff 0%, #f8fafd 100%);
      border-right: 1px solid #e2e8f0;
      padding: 14px 12px;
      gap: 12px;
      box-shadow: inset -1px 0 0 rgba(148, 163, 184, 0.08);
    }
    .nav-item {
      border-color: #e8eef6;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .nav-item:hover {
      border-color: #f2c572;
      background: #fffdf7;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    }
    .nav-item.active {
      border-color: #f2c572;
      background: #fffaf0;
      box-shadow: inset 4px 0 0 var(--accent), 0 6px 14px rgba(245, 158, 11, 0.12);
    }
    .profile {
      border-color: #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .center {
      background: linear-gradient(180deg, #f9fbff 0%, #f5f8fc 100%);
      padding: 18px;
    }
    .right-panel {
      border-left: 1px solid #e2e8f0;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafd 100%);
      padding: var(--space-6);
      display: grid;
      align-content: start;
      gap: var(--space-3);
    }
    .right-title {
      margin: 0;
      font-size: 22px;
      line-height: 1.2;
      font-weight: 800;
      color: #0f172a;
    }
    .right-sub {
      margin: 0 0 8px 0;
      font-size: var(--font-sm);
      color: #64748b;
    }
    .grid {
      gap: var(--space-5);
    }
    .office-card {
      min-height: 164px;
      border-radius: 12px;
      box-shadow: 0 3px 10px rgba(15, 23, 42, 0.06);
      gap: 8px;
    }
    .office-card.active {
      border-color: #f2c572;
      box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.22), 0 8px 18px rgba(245, 158, 11, 0.14);
      background: #fffdf7;
    }
    .discussion-box {
      margin-top: 4px;
      min-height: 260px;
      max-height: 380px;
      border: 1px solid #dfe7f2;
      border-radius: 12px;
      padding: var(--space-4);
      background: #ffffff;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
      display: grid;
      gap: var(--space-3);
    }
    .message-item {
      margin-bottom: 0;
      border: 1px solid #e3eaf4;
      border-left: 4px solid #f2c572;
      background: #f8fbff;
      border-radius: 10px;
      padding: 10px;
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
    }
    .message-head {
      color: #7c4a15;
      font-size: var(--font-sm);
      font-weight: 700;
      margin-bottom: var(--space-2);
    }
    .message-body {
      color: #334155;
      font-size: var(--font-md);
      line-height: var(--lh-relaxed);
      word-break: break-word;
      white-space: pre-wrap;
    }
    .actions {
      margin-top: 6px;
      gap: var(--space-3);
    }
    .right-divider {
      border-top: 1px dashed #d9e2ee;
      margin: 16px 0;
    }
    .member-editor {
      margin-top: 4px;
      border: 1px solid #dfe7f2;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      padding: var(--space-4);
      gap: var(--space-3);
    }
    .member-editor-title {
      color: #1f2937;
      font-size: 13px;
      font-weight: 700;
    }
    .member-editor-row {
      border: 1px dashed #d8e2ef;
      border-radius: 10px;
      padding: var(--space-2);
      background: #fcfdff;
    }
    .member-list {
      display: grid;
      gap: 10px;
    }
    .member-row {
      border: 1px solid #dfe7f2;
      border-radius: 10px;
      padding: var(--space-3);
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .member-row b {
      display: block;
      font-size: 13px;
      color: #111827;
      margin-bottom: 4px;
    }
    .member-row span {
      color: #b45309;
      font-size: var(--font-sm);
      font-weight: 600;
    }
    .member-row p {
      margin: 6px 0 0;
      color: #64748b;
      font-size: var(--font-sm);
      line-height: 1.45;
    }
    #human-input {
      min-height: 92px;
      border-radius: 10px;
      background: #ffffff;
    }
    #workflow-script {
      border-radius: 10px;
      background: #ffffff;
      font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
      font-size: var(--font-sm);
    }
    .message-head,
    .sub-event-method,
    .sub-chunk-participant,
    .flow-section-title,
    .flow-preview-role,
    .provider-card-head {
      color: #1f2937;
    }
    .provider-card-head {
      background: #f8fafc;
      border-bottom: 1px solid var(--line);
    }

    .dashboard-view,
    .subscription-view {
      padding: 4px 0;
      display: grid;
      gap: var(--space-5);
    }
    .view-title {
      margin: 0;
      font-size: 30px;
      line-height: 1.12;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    .view-desc,
    .muted,
    .sub-event-time,
    .sub-chunk-meta,
    .flow-modal-sub,
    .flow-plan-meta,
    .office-add-sub {
      color: #64748b;
    }
    .view-desc {
      margin: 0;
      font-size: var(--font-md);
    }
    .dash-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(140px, 1fr));
      gap: var(--space-4);
    }
    .dash-card {
      border: 1px solid #dfe7f2;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
      padding: var(--space-5);
      position: relative;
      overflow: hidden;
    }
    .dash-card::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
    }
    .dash-card-label {
      margin-bottom: 8px;
      color: #64748b;
      font-size: var(--font-sm);
      font-weight: 600;
    }
    .dash-card-value {
      font-size: 24px;
      font-weight: 800;
      line-height: 1.15;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    .dash-section {
      border: 1px solid #dfe7f2;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
      padding: var(--space-4);
      margin-bottom: 0;
    }
    .dash-section h3 {
      margin: 0 0 10px 0;
      color: #0f172a;
      font-size: 14px;
      font-weight: 700;
    }
    .dash-table-wrap {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #ffffff;
      overflow-x: auto;
    }
    .dash-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-sm);
    }
    .dash-table th {
      background: #f8fafc;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .dash-table th,
    .dash-table td {
      border-bottom: 1px solid #e7edf5;
      padding: calc(var(--space-2) + 1px) var(--space-3);
      text-align: left;
      vertical-align: top;
    }
    .dash-table tbody tr:hover {
      background: #f8fbff;
    }
    .summary-cell {
      max-width: 260px;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .status-badge {
      display: inline-block;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
      line-height: 1.5;
    }
    .status-idle { background: #edf2f7; color: #475569; }
    .status-starting { background: #fffbeb; color: #b45309; }
    .status-running { background: #ecfdf3; color: #15803d; }
    .status-completed { background: #eff6ff; color: #1d4ed8; }
    .status-stopped { background: #f1f5f9; color: #64748b; }
    .status-error { background: #fef2f2; color: #b91c1c; }

    .log-box {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      max-height: 320px;
      overflow: auto;
      padding: var(--space-3);
      font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
    }
    .log-line {
      font-size: 11px;
      line-height: 1.5;
      color: #334155;
      border-bottom: 1px dashed #d8e2ef;
      padding: 4px 0;
      word-break: break-all;
    }

    .sub-tabs {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: calc(var(--space-1) + 2px);
      border: 1px solid #dfe7f2;
      border-radius: 12px;
      background: #ffffff;
      width: fit-content;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .sub-tab {
      border-radius: 9px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #475569;
      padding: var(--space-2) var(--space-4);
      font-size: var(--font-sm);
      font-weight: 600;
    }
    .sub-tab:hover {
      border-color: #f2c572;
      background: #fffaf2;
      color: #92400e;
    }
    .sub-tab.active {
      border-color: #f2c572;
      background: #fff4df;
      color: #92400e;
      box-shadow: 0 1px 3px rgba(245, 158, 11, 0.18);
    }
    .sub-content {
      border: 1px solid #dfe7f2;
      border-radius: 12px;
      background: #ffffff;
      padding: var(--space-4);
      max-height: 480px;
      overflow: auto;
      display: grid;
      gap: var(--space-3);
    }
    .sub-event-item,
    .sub-chunk-item {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fbff;
      padding: var(--space-3);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
    }
    .sub-event-head,
    .sub-chunk-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .sub-event-method,
    .sub-chunk-participant {
      color: #0f172a;
      font-size: 12px;
      font-weight: 700;
    }
    .sub-event-body {
      margin: 0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
      color: #334155;
      padding: var(--space-3);
      font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
      font-size: 11px;
      line-height: 1.5;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .sub-chunk-body {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
      padding: var(--space-3);
      color: #334155;
      font-size: var(--font-sm);
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .badge-active {
      background: #fff7e6;
      color: #92400e;
    }

    .flow-modal-mask {
      background: rgba(15, 23, 42, 0.45);
    }
    .flow-modal {
      border-color: var(--line);
      border-radius: 12px;
      background: #ffffff;
      box-shadow: var(--shadow-md);
    }
    .flow-modal-head,
    .flow-modal-foot {
      border-color: var(--line);
      background: #ffffff;
    }
    .flow-modal-title {
      color: #111827;
      font-size: 20px;
    }
    .profile-trigger {
      width: 100%;
      text-align: left;
      cursor: pointer;
    }
    .profile-settings-mask {
      z-index: 900;
    }
    .profile-settings-modal {
      width: min(920px, calc(100vw - 32px));
    }
    .profile-settings-body {
      display: grid;
      gap: 14px;
      max-height: calc(100vh - 190px);
      overflow: auto;
    }
    .profile-user-card {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #ffffff;
      padding: 20px 16px;
      display: grid;
      justify-items: center;
      gap: 8px;
      text-align: center;
    }
    .profile-user-avatar {
      width: 72px;
      height: 72px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: #fff7e6;
      color: #92400e;
      border: 1px solid #f2c572;
      font-size: 28px;
      font-weight: 700;
    }
    .profile-user-name {
      font-size: 18px;
      color: #111827;
      font-weight: 700;
    }
    .profile-user-role {
      color: #64748b;
      font-size: 12px;
    }
    .profile-api-section {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #ffffff;
      padding: 12px;
      display: grid;
      gap: 10px;
    }
    .profile-duty-section {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #ffffff;
      padding: 12px;
      display: grid;
      gap: 10px;
    }
    .duty-role-help {
      color: #64748b;
      font-size: 12px;
    }
    .duty-role-grid {
      display: grid;
      gap: 8px;
    }
    .duty-role-row {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px;
      display: grid;
      gap: 8px;
    }
    .duty-role-name {
      color: #0f172a;
      font-size: 13px;
      font-weight: 700;
    }
    .duty-role-picks {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .duty-role-picks select {
      width: 100%;
      font-size: 12px;
      border-radius: 8px;
      padding: 6px 8px;
    }
    .profile-api-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .profile-api-title {
      margin: 0;
      color: #0f172a;
      font-size: 16px;
      font-weight: 700;
    }
    .profile-api-add-btn,
    .profile-api-empty-add {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      padding: 0;
      font-size: 22px;
      line-height: 1;
      border-color: var(--accent-strong);
      background: var(--accent);
      color: #ffffff;
      display: inline-grid;
      place-items: center;
    }
    .profile-api-add-btn:hover,
    .profile-api-empty-add:hover {
      border-color: #b45309;
      background: #d97706;
    }
    .profile-api-list {
      display: grid;
      gap: 8px;
    }
    .profile-api-card {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #ffffff;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .profile-api-main {
      min-width: 0;
      display: grid;
      gap: 4px;
    }
    .profile-api-name {
      color: #0f172a;
      font-size: 14px;
      font-weight: 700;
    }
    .profile-api-meta {
      color: #64748b;
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 560px;
    }
    .profile-api-actions {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .profile-api-empty {
      border: 1px dashed var(--line-strong);
      border-radius: 12px;
      background: #fffdfa;
      min-height: 84px;
      display: grid;
      place-items: center;
      padding: 12px;
      text-align: center;
    }
    .profile-api-editor-mask {
      z-index: 920;
      background: rgba(15, 23, 42, 0.5);
    }
    .profile-api-editor-modal {
      width: min(620px, calc(100vw - 32px));
    }
    .profile-api-editor-body {
      max-height: calc(100vh - 210px);
      overflow: auto;
    }

    .global-api-card-active {
      border-color: #f2c572;
      box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.22);
    }
    .btn-sm {
      border-radius: 8px;
      border-color: var(--line-strong);
      background: #ffffff;
      color: #334155;
    }
    .btn-sm:hover {
      border-color: #f2c572;
      background: #fffaf0;
    }
    .btn-sm.btn-danger {
      border-color: #fecaca;
      background: #fff5f5;
      color: #b91c1c;
    }
    .btn-sm.btn-danger:hover {
      border-color: #fca5a5;
      background: #fee2e2;
    }

    @media (max-width: 1600px) {
      .body { grid-template-columns: 210px 1fr 320px; }
      .body.no-right-panel { grid-template-columns: 210px 1fr; }
      .grid { grid-template-columns: repeat(2, minmax(200px, 1fr)); }
      .dash-summary-grid { grid-template-columns: repeat(2, minmax(120px, 1fr)); }
    }
    @media (max-width: 1200px) {
      .body,
      .body.no-right-panel {
        grid-template-columns: 1fr;
      }
      .left-nav {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .nav-group {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .center {
        border-right: 0;
      }
      .right-panel {
        border-top: 1px solid var(--line);
      }
      .member-editor-row {
        grid-template-columns: 56px 1fr;
      }
      .flow-plan-grid {
        grid-template-columns: 1fr;
      }
      .flow-preview-row {
        grid-template-columns: 1fr;
      }
      .dash-summary-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 760px) {
      #app {
        padding: 10px;
      }
      .frame {
        border-radius: 10px;
        min-height: calc(100vh - 20px);
      }
      .topbar {
        height: auto;
        padding: 12px;
        gap: 10px;
        align-items: flex-start;
        flex-direction: column;
      }
      .brand-text {
        font-size: 22px;
      }
      .nav-group {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .grid,
      .dash-summary-grid {
        grid-template-columns: 1fr;
      }
      .view-title {
        font-size: 24px;
      }
      .global-api-card-header {
        flex-wrap: wrap;
      }
      .sub-event-head,
      .sub-chunk-head {
        flex-direction: column;
        align-items: flex-start;
      }
      .profile-api-card {
        flex-direction: column;
        align-items: flex-start;
      }
      .profile-api-actions {
        width: 100%;
        justify-content: flex-start;
      }
      .duty-role-picks {
        grid-template-columns: 1fr;
      }
    }

    :root {
      color-scheme: dark;
      --bg: #1e1e1e;
      --panel: #252526;
      --panel-soft: #2d2d30;
      --line: #3c3c3c;
      --line-strong: #464647;
      --text: #cccccc;
      --muted: #9da1a6;
      --card: #2d2d30;
      --accent: #0e639c;
      --accent-strong: #1177bb;
      --accent-soft: #094771;
    }

    html,
    body {
      background: var(--bg) !important;
      color: var(--text) !important;
    }

    #app,
    .frame,
    .body,
    .center,
    .left-nav,
    .right-panel,
    .topbar {
      background: var(--panel) !important;
      color: var(--text) !important;
      border-color: var(--line) !important;
    }

    .frame {
      border-color: var(--line-strong) !important;
      border-radius: 0 !important;
      min-height: 100vh !important;
    }

    #app {
      padding: 0 !important;
      margin: 0 !important;
    }

    body {
      min-height: 100vh !important;
      overflow: hidden !important;
    }

    .topbar {
      border-bottom: 1px solid var(--line-strong) !important;
      height: 48px !important;
      min-height: 48px !important;
      padding: 0 12px 0 14px !important;
    }

    .brand {
      gap: 8px !important;
    }

    .brand-mark {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      border: 1px solid #2f88c8;
      background: linear-gradient(135deg, #3794ff 0%, #0e639c 100%);
      box-shadow: 0 0 0 1px rgba(13, 98, 156, 0.25);
      flex-shrink: 0;
    }

    .brand-copy {
      gap: 1px !important;
    }

    .brand-text {
      font-size: 17px !important;
      font-weight: 700 !important;
      line-height: 1.05;
      letter-spacing: 0.1px;
    }

    .brand-sub {
      font-size: 10px !important;
      letter-spacing: 0.2px;
    }

    .topbar,
    .topbar * {
      -webkit-app-region: drag;
    }

    .topbar-right {
      display: inline-flex !important;
      align-items: center !important;
      gap: 8px !important;
    }

    .body {
      grid-template-columns: 212px minmax(0, 1fr) minmax(430px, 36vw) !important;
    }

    .body.no-right-panel {
      grid-template-columns: 212px minmax(0, 1fr) !important;
    }

    .left-nav {
      background: #1b1d23 !important;
      border-right: 1px solid #30343a !important;
      padding: 10px 8px !important;
    }

    .center {
      min-width: 0 !important;
      overflow: auto !important;
    }

    .right-panel {
      width: 100% !important;
      min-width: 380px !important;
      padding: 14px !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    }

    .window-controls {
      display: inline-flex !important;
      align-items: center;
      gap: 6px;
    }

    .window-control-btn {
      width: 28px;
      height: 28px;
      border: 1px solid var(--line-strong) !important;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      padding: 0;
      background: #2f2f34 !important;
      color: #d4d4d4 !important;
      box-shadow: none !important;
      cursor: pointer;
      transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
    }

    .window-control-btn:hover {
      background: #3b3b41 !important;
      border-color: #4a4a50 !important;
      color: #ffffff !important;
    }

    .window-control-btn.close:hover {
      background: #c42b1c !important;
      border-color: #d83b2c !important;
      color: #ffffff !important;
    }

    button,
    input,
    textarea,
    select,
    a,
    .profile-trigger,
    .nav-item,
    .office-card,
    .flow-plan-card,
    .provider-card-head,
    .guide-msg,
    .message-item,
    [role="button"] {
      -webkit-app-region: no-drag;
    }

    .brand-text,
    .right-title,
    .view-title,
    .office-title,
    .dash-card-value {
      color: #ffffff !important;
    }

    .brand-sub,
    .right-sub,
    .muted,
    .office-meta,
    .sub-event-meta,
    .sub-chunk-meta,
    .dash-card-label,
    .profile-role,
    .message-head {
      color: var(--muted) !important;
    }

    .nav-group {
      gap: 2px !important;
    }

    .nav-item {
      position: relative;
      color: #aeb3b9 !important;
      border: 1px solid transparent !important;
      border-radius: 6px !important;
      background: transparent !important;
      box-shadow: none !important;
      padding: 9px 10px 9px 18px !important;
      font-size: 12.5px !important;
      font-weight: 500 !important;
      transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
    }

    .nav-item::before {
      content: "";
      position: absolute;
      left: 0;
      top: 5px;
      bottom: 5px;
      width: 3px;
      border-radius: 2px;
      background: transparent;
      transition: background-color 120ms ease;
    }

    .nav-item:hover {
      background: #2a2d2f !important;
      border-color: transparent !important;
      color: #d6d9de !important;
    }

    .nav-item.active {
      background: #31343a !important;
      border-color: transparent !important;
      color: #ffffff !important;
      box-shadow: none !important;
    }

    .nav-item.active::before {
      background: #3794ff;
    }

    .nav-icon {
      color: #878d94 !important;
      width: 16px !important;
      height: 16px !important;
    }

    .nav-item:hover .nav-icon {
      color: #d0d4d9 !important;
    }

    .nav-item.active .nav-icon {
      color: #4fc1ff !important;
    }

    .nav-text {
      letter-spacing: 0.1px;
      line-height: 1.1;
    }

    .nav-bottom {
      border-top: 1px solid #30343a;
      padding-top: 10px;
    }

    .profile {
      border: 1px solid #34373d !important;
      border-radius: 8px !important;
      background: #25282f !important;
      box-shadow: none !important;
    }

    .profile-avatar {
      width: 24px !important;
      height: 24px !important;
      border-radius: 6px !important;
      border: 1px solid #3f454e !important;
      background: #1f2228 !important;
      color: #d0d6de !important;
    }

    .engine-status {
      display: inline-flex !important;
      align-items: center !important;
      gap: 7px !important;
      height: 26px !important;
      padding: 0 10px !important;
      border: 1px solid #3f4650 !important;
      border-radius: 4px !important;
      background: #2f343d !important;
      color: #cfd5dd !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      letter-spacing: 0.15px;
      box-shadow: none !important;
      line-height: 1;
    }

    .engine-dot {
      width: 7px !important;
      height: 7px !important;
      border-radius: 999px !important;
      background: #7f8691 !important;
      box-shadow: 0 0 0 1px rgba(127, 134, 145, 0.3) !important;
      flex-shrink: 0;
    }

    .engine-status.online {
      color: #ffffff !important;
      border-color: #007acc !important;
      background: #007acc !important;
    }

    .engine-status.online .engine-dot {
      background: #ffffff !important;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.35) !important;
    }

    .engine-status.offline {
      color: #c2c8cf !important;
      border-color: #434a54 !important;
      background: #323841 !important;
    }

    .card,
    .discussion-box,
    .message-item,
    .member-editor,
    .member-row,
    .provider-card,
    .dash-section,
    .dash-card,
    .global-api-card,
    .sub-event-item,
    .sub-chunk-item,
    .flow-section,
    .flow-plan-card,
    .profile-user-card,
    .profile-api-card,
    .profile-settings-body,
    .profile-api-editor-body,
    .guide-msg {
      background: var(--panel-soft) !important;
      color: var(--text) !important;
      border-color: var(--line) !important;
      box-shadow: none !important;
      border-radius: 8px !important;
    }

    .office-card,
    .office-card.add,
    .member-editor-row,
    .provider-card-head,
    .flow-modal,
    .guide-modal,
    .profile-settings-modal,
    .profile-api-editor-modal {
      border-radius: 8px !important;
    }

    .guide-structured {
      margin-top: 8px;
      display: grid;
      gap: 8px;
    }

    .guide-structured-card {
      border: 1px solid #3b4149;
      border-radius: 8px;
      background: #242830;
      padding: 8px 10px;
    }

    .guide-structured-title {
      font-size: 12px;
      font-weight: 700;
      color: #dbe8ff;
      margin-bottom: 6px;
      letter-spacing: 0.15px;
      text-transform: uppercase;
    }

    .guide-structured-list {
      margin: 0;
      padding-left: 16px;
      display: grid;
      gap: 4px;
      font-size: 12px;
      line-height: 1.5;
      color: #c8d0da;
    }

    .guide-msg-actions {
      margin-top: 8px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .guide-msg-action {
      border: 1px solid #4a525c !important;
      border-radius: 6px !important;
      background: #313844 !important;
      color: #d7e2ef !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      padding: 6px 10px !important;
      box-shadow: none !important;
    }

    .guide-msg-action:hover {
      border-color: #007acc !important;
      background: #1f334a !important;
      color: #ffffff !important;
    }

    .guide-msg-role,
    .flow-section-title,
    .flow-plan-title,
    .flow-plan-summary,
    .flow-preview-role,
    .flow-preview-provider,
    .flow-preview-model,
    .sub-event-method,
    .sub-chunk-participant {
      color: #d7dde6 !important;
    }

    .flow-plan-meta,
    .sub-event-time,
    .sub-chunk-meta {
      color: #a8adb4 !important;
    }

    .sub-tabs {
      border-color: var(--line) !important;
      background: #252526 !important;
      box-shadow: none !important;
    }

    .sub-tab {
      border-color: #3a3d41 !important;
      background: #2d2d30 !important;
      color: #b9bdc3 !important;
      box-shadow: none !important;
    }

    .sub-tab:hover {
      border-color: #4b4f55 !important;
      background: #35363b !important;
      color: #ffffff !important;
    }

    .sub-tab.active {
      border-color: #007acc !important;
      background: #1f3348 !important;
      color: #eaf4ff !important;
      box-shadow: none !important;
    }

    .dash-card::before {
      background: linear-gradient(90deg, #0e639c 0%, #3794ff 100%) !important;
      opacity: 0.9;
    }

    .guide-structured-actions {
      margin-top: 4px;
      display: flex;
      justify-content: flex-start;
    }

    .guide-structured-apply {
      border-color: #007acc !important;
      background: #0e639c !important;
      color: #ffffff !important;
    }

    .guide-structured-apply:hover {
      border-color: #3794ff !important;
      background: #1177bb !important;
    }

    .member-list,
    .member-row,
    .member-editor,
    .member-editor-title,
    .member-editor-row,
    .member-editor-row label,
    .member-editor-row b,
    .member-editor-row span,
    .member-editor-row p,
    .member-row b,
    .member-row span,
    .member-row p {
      background: var(--panel-soft) !important;
      color: var(--text) !important;
      border-color: var(--line) !important;
    }

    .member-editor {
      min-width: 0 !important;
      overflow: hidden !important;
    }

    .member-editor-row {
      display: grid !important;
      grid-template-columns: 78px minmax(0, 1.1fr) minmax(115px, 0.9fr) minmax(138px, 1fr) minmax(145px, 1fr) minmax(175px, 1.2fr) !important;
      gap: 8px !important;
      align-items: center !important;
      min-width: 0 !important;
      width: 100% !important;
    }

    .member-editor-row .check {
      display: inline-flex !important;
      width: 100% !important;
      min-width: 0 !important;
      white-space: nowrap;
    }

    .member-editor-row > input,
    .member-editor-row > select {
      min-width: 0 !important;
      width: 100% !important;
    }

    @media (max-width: 1520px) {
      .body {
        grid-template-columns: 206px minmax(0, 1fr) minmax(360px, 34vw) !important;
      }

      .member-editor-row {
        grid-template-columns: 78px minmax(0, 1fr) minmax(100px, 0.9fr) minmax(120px, 0.95fr) minmax(130px, 1fr) minmax(145px, 1.05fr) !important;
      }
    }

    @media (max-width: 1280px) {
      .body,
      .body.no-right-panel {
        grid-template-columns: 1fr !important;
      }

      .right-panel {
        min-width: 0 !important;
      }

      .member-editor-row {
        grid-template-columns: 82px minmax(0, 1fr) !important;
      }
    }

    .member-row span,
    .member-editor-title,
    .profile-api-title,
    .profile-user-name {
      color: #d7e9ff !important;
    }

    .flow-modal,
    .flow-modal-head,
    .flow-modal-foot,
    .profile-settings-modal,
    .profile-settings-mask,
    .profile-api-editor-mask,
    .profile-api-editor-modal,
    .guide-modal,
    .guide-mask {
      background: var(--panel) !important;
      color: var(--text) !important;
      border-color: var(--line) !important;
    }

    .flow-modal-mask,
    .profile-settings-mask,
    .profile-api-editor-mask,
    .guide-mask {
      background: rgba(0, 0, 0, 0.55) !important;
    }

    .profile-api-empty,
    .profile-api-empty-add,
    .profile-api-add-btn,
    .profile-api-activate,
    .profile-api-edit,
    .profile-api-remove,
    .sub-event-item,
    .sub-chunk-item,
    .sub-event-body,
    .sub-chunk-body,
    .dash-table,
    .dash-table thead,
    .dash-table tbody,
    .dash-table tr,
    .dash-table td,
    .dash-table th {
      background: var(--panel-soft) !important;
      color: var(--text) !important;
      border-color: var(--line) !important;
    }

    .dash-table tbody tr:hover,
    .sub-event-item:hover,
    .sub-chunk-item:hover {
      background: #35353a !important;
    }

    .toast,
    .toast-info,
    .toast-success,
    .toast-error {
      background: #2f2f34 !important;
      color: var(--text) !important;
      border-color: var(--line-strong) !important;
    }

    .office-card {
      background: var(--panel-soft) !important;
      border-color: var(--line) !important;
      color: var(--text) !important;
    }

    .office-card:hover {
      border-color: var(--accent) !important;
      background: #333337 !important;
    }

    .office-card.active {
      border-color: var(--accent) !important;
      background: #1f2b34 !important;
    }

    .office-card.add {
      background: #1f2b34 !important;
      border-color: #2f6f95 !important;
      color: #4fc1ff !important;
    }

    .provider-card-head,
    .flow-plan-card {
      background: var(--panel-soft) !important;
      border-color: var(--line) !important;
      color: var(--text) !important;
    }

    .flow-plan-card.active,
    .global-api-card-active {
      background: #1f2b34 !important;
      border-color: var(--accent) !important;
    }

    input,
    textarea,
    select,
    #guide-input,
    #human-input,
    #workflow-script {
      background: #1e1e1e !important;
      color: var(--text) !important;
      border-color: var(--line-strong) !important;
    }

    input::placeholder,
    textarea::placeholder {
      color: #808080 !important;
    }

    input:focus-visible,
    textarea:focus-visible,
    select:focus-visible,
    button:focus-visible {
      border-color: #3794ff !important;
      outline: 1px solid #3794ff !important;
      outline-offset: 0;
    }

    button {
      background: #3c3c3c !important;
      color: var(--text) !important;
      border-color: var(--line-strong) !important;
    }

    button:hover {
      background: #4a4a4a !important;
      border-color: #5a5a5a !important;
    }

    #btn-start-office,
    #btn-send-human,
    #btn-set-keys,
    #btn-flow-create,
    #btn-guide-send,
    #btn-guide-create,
    #btn-flow-sync-keys,
    #btn-settings-sync-global,
    #btn-settings-import-global,
    .btn-sm.primary {
      background: var(--accent) !important;
      border-color: var(--accent) !important;
      color: #ffffff !important;
      box-shadow: none !important;
    }

    #btn-start-office:hover,
    #btn-send-human:hover,
    #btn-set-keys:hover,
    #btn-flow-create:hover,
    #btn-guide-send:hover,
    #btn-guide-create:hover,
    #btn-flow-sync-keys:hover,
    #btn-settings-sync-global:hover,
    #btn-settings-import-global:hover,
    .btn-sm.primary:hover {
      background: #1177bb !important;
      border-color: #1177bb !important;
    }

    #btn-stop-office,
    .danger,
    .btn-sm.btn-danger {
      background: #5a1d1d !important;
      border-color: #8b2d2d !important;
      color: #f48771 !important;
    }

    #btn-stop-office:hover,
    .btn-sm.btn-danger:hover {
      background: #733030 !important;
      border-color: #a33f3f !important;
    }

    .status-idle {
      background: #3c3c3c !important;
      color: #d4d4d4 !important;
    }

    .status-starting {
      background: #2f3d4d !important;
      color: #b9d9ff !important;
    }

    .status-running {
      background: #1f4b3a !important;
      color: #89d185 !important;
    }

    .status-completed {
      background: #1f3f5b !important;
      color: #75beff !important;
    }

    .status-stopped {
      background: #3b3b3b !important;
      color: #a6a6a6 !important;
    }

    .status-error {
      background: #5a1d1d !important;
      color: #f48771 !important;
    }

    .md-body code,
    .md-body pre {
      background: #1e1e1e !important;
      color: #d4d4d4 !important;
      border-color: var(--line) !important;
    }

    .md-body a {
      color: #4fc1ff !important;
    }
  `,document.head.appendChild(e)}function kr(e){if(e instanceof Error)return`${e.name}: ${e.message}`;if(typeof e=="string")return e;try{return JSON.stringify(e)}catch{return String(e)}}async function Jn(){window.addEventListener("error",e=>{const t=e.error??e.message;M(`[window.error] ${kr(t)}`),v()}),window.addEventListener("unhandledrejection",e=>{M(`[unhandledrejection] ${kr(e.reason)}`),v()}),_o(),Yn(),v(),await Te("orchestrator-notification",e=>{if(e.payload.method&&M(`[notify] ${String(e.payload.method)}`),e.payload.method){const t=e.payload.method;if(t==="turn/chunk"||t==="turn/complete"||t==="session/progress"||t==="session/state"||t==="session/participants"||t==="workflow/step"||t==="workflow/complete"){mi(e.payload),t==="turn/chunk"&&d.workspaceMode==="offices"&&!b.open?Hn():v();return}}Sr("unknown",e.payload),v()}),await Te("orchestrator-log",e=>{M(`[orchestrator] ${e.payload}`),v()}),await Te("orchestrator-exit",()=>{d.orchestratorRunning=!1,d.runStatus!=="error"&&(d.runStatus="stopped"),M("orchestrator process exited"),v()}),await Gr(),v()}Jn();export{ta as R,ea as S,Xt as T,ia as a,oa as e,ie as i,Te as l,ra as o};
