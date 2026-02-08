var pr=Object.defineProperty;var fr=(e,t,r)=>t in e?pr(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var R=(e,t,r)=>fr(e,typeof t!="symbol"?t+"":t,r);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function r(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function o(n){if(n.ep)return;n.ep=!0;const i=r(n);fetch(n.href,i)}})();function ur(e,t=!1){return window.__TAURI_INTERNALS__.transformCallback(e,t)}async function ge(e,t={},r){return window.__TAURI_INTERNALS__.invoke(e,t,r)}var xt;(function(e){e.WINDOW_RESIZED="tauri://resize",e.WINDOW_MOVED="tauri://move",e.WINDOW_CLOSE_REQUESTED="tauri://close-requested",e.WINDOW_DESTROYED="tauri://destroyed",e.WINDOW_FOCUS="tauri://focus",e.WINDOW_BLUR="tauri://blur",e.WINDOW_SCALE_FACTOR_CHANGED="tauri://scale-change",e.WINDOW_THEME_CHANGED="tauri://theme-changed",e.WINDOW_CREATED="tauri://window-created",e.WEBVIEW_CREATED="tauri://webview-created",e.DRAG_ENTER="tauri://drag-enter",e.DRAG_OVER="tauri://drag-over",e.DRAG_DROP="tauri://drag-drop",e.DRAG_LEAVE="tauri://drag-leave"})(xt||(xt={}));async function gr(e,t){window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(e,t),await ge("plugin:event|unlisten",{event:e,eventId:t})}async function _e(e,t,r){var o;const n=(o=void 0)!==null&&o!==void 0?o:{kind:"Any"};return ge("plugin:event|listen",{event:e,target:n,handler:ur(t)}).then(i=>async()=>gr(e,i))}function Re(e,t,r,o,n){return{participantId:`${e}-${t}`,provider:r,modelId:o,role:n,enabled:!0}}function br(e,t,r){return{officeId:e,officeName:t,objective:r,maxRounds:3,members:[Re(e,"chatgpt","openai","gpt-4.1","proposer"),Re(e,"gemini","google","gemini-1.5-pro","critic"),Re(e,"claude","anthropic","claude-3-5-sonnet","synthesizer")]}}function Ie(e){return{officeId:e,status:"idle",sessionId:"-",turnIndex:0,agreementScore:0,totalTokens:0,totalCost:0,lastSummary:"暂无会议结论",lastUpdatedAt:new Date().toISOString()}}const Pt=[],hr=Object.fromEntries(Pt.map(e=>[e.officeId,Ie(e.officeId)])),a={orchestratorRunning:!1,runStatus:"idle",busyAction:"none",workspaceMode:"offices",officeStatusFilter:"all",officeSortBy:"priority",officeSortDirection:"asc",activeOfficeId:"",offices:Pt,officeSnapshots:hr,sessionOfficeMap:{},sessionId:"-",turnIndex:0,agreementScore:0,totalTokens:0,totalCost:0,participants:[],chunks:[],notifications:[],logs:[],humanDraftByOfficeId:{},toasts:[],apiKeys:{openai:"",openai_compatible:"",anthropic:"",google:"",deepseek:""},globalApis:[{name:"默认接口",provider:"openai",modelId:"gpt-4.1",endpoint:"",apiKey:""}],activeGlobalApiIndex:0,globalApiImportText:"",openaiCompatibleEndpoint:"",anthropicCompatibleEndpoint:"",review:{enabled:!0,language:"zh-CN",minSeverity:"MEDIUM",maxFindings:8,requireEvidence:!0,categoriesText:"correctness, security, performance, maintainability"},operators:[{name:"sanitize_input",enabled:!0,configText:"null"},{name:"context_window",enabled:!0,configText:"null"},{name:"participant_selector",enabled:!0,configText:"null"},{name:"role_response_format",enabled:!0,configText:"null"},{name:"review_instruction",enabled:!0,configText:"null"},{name:"review_findings",enabled:!0,configText:"null"},{name:"output_guard",enabled:!0,configText:"null"}],_subTab:"notifications"};let vt=1;function P(e){a.busyAction=e}function mr(e,t){const r=vt;return vt+=1,a.toasts=[...a.toasts,{id:r,kind:e,message:t}].slice(-4),r}function xr(e){a.toasts=a.toasts.filter(t=>t.id!==e)}function W(){const e=a.offices.find(r=>r.officeId===a.activeOfficeId);if(e)return e;const t=a.offices[0];if(!t){a.activeOfficeId="";return}return a.activeOfficeId=t.officeId,t}function vr(e){a.offices.some(t=>t.officeId===e)&&(a.activeOfficeId=e)}function Lt(e){const t=a.sessionOfficeMap[e];if(t)return a.offices.find(r=>r.officeId===t)}function Se(e,t){!t||!a.offices.some(r=>r.officeId===t)||(a.sessionOfficeMap[e]=t,V(t,{sessionId:e}))}function V(e,t){const r=a.officeSnapshots[e]??Ie(e);a.officeSnapshots[e]={...r,...t,officeId:e,lastUpdatedAt:new Date().toISOString()}}function kr(){const e=new Set(a.offices.map(r=>r.officeId).map(r=>r.replace("office-","")).map(r=>Number(r)).filter(r=>Number.isFinite(r)&&r>0));let t=1;for(;e.has(t);)t+=1;return t}function wr(e){return e>=1&&e<=26?`办公室 ${String.fromCharCode(64+e)}`:`办公室 ${e}`}function qt(){const e=kr(),t=`office-${e}`,r=wr(e),o=br(t,r,"在这里定义该办公室本轮创作目标");a.offices.push(o),a.officeSnapshots[t]=Ie(t),a.activeOfficeId=t}function L(e){a.logs.unshift(`[${new Date().toISOString()}] ${e}`),a.logs.length>300&&(a.logs=a.logs.slice(0,300))}function Nt(e,t){a.notifications.unshift({time:new Date().toISOString(),method:e,payload:t}),a.notifications.length>200&&(a.notifications=a.notifications.slice(0,200))}let yr=1;const m={open:!1,phase:"greeting",messages:[],userInput:"",confirmedGoal:"",selectedPlanId:"",officeName:"",maxRounds:3,aiThinking:!1,creating:!1,sessionId:""};function $r(){m.open=!0,m.phase="greeting",m.messages=[],m.userInput="",m.confirmedGoal="",m.selectedPlanId="",m.officeName="",m.maxRounds=3,m.aiThinking=!1,m.creating=!1,m.sessionId="",Q("ai",`👋 你好！我是你的 Workerflow 助手。

告诉我你想让 AI 团队帮你完成什么任务？
比如：
• 帮我做一个技术方案评审
• 写一份产品需求文档
• 分析竞品并给出建议

请描述你的目标，我来帮你组建最合适的 AI 办公室 🏢`,[])}function kt(){m.open=!1,m.aiThinking=!1,m.creating=!1}function Q(e,t,r){const o={id:yr++,sender:e,text:t,timestamp:new Date().toISOString(),actions:r};return m.messages.push(o),o}function Ir(e){m.phase=e}function Sr(e){a.chunks.unshift(e),a.chunks.length>400&&(a.chunks=a.chunks.slice(0,400))}function Ar(e,t){const r=a.participants.find(o=>o.participantId===e);if(r){Object.assign(r,t);return}a.participants.push({participantId:e,role:t.role??"-",provider:t.provider??"-",modelId:t.modelId??"-",status:t.status??"pending",latencyMs:t.latencyMs})}const ve="beboss-settings",zr="donkey-studio-settings";function Er(){try{const e={globalApis:a.globalApis,activeGlobalApiIndex:a.activeGlobalApiIndex,apiKeys:a.apiKeys,openaiCompatibleEndpoint:a.openaiCompatibleEndpoint,anthropicCompatibleEndpoint:a.anthropicCompatibleEndpoint,offices:a.offices};localStorage.setItem(ve,JSON.stringify(e))}catch{}}function _r(){try{const e=localStorage.getItem(ve)??localStorage.getItem(zr);if(!e)return;localStorage.getItem(ve)||localStorage.setItem(ve,e);const t=JSON.parse(e);if(Array.isArray(t.globalApis)&&t.globalApis.length>0&&(a.globalApis=t.globalApis),typeof t.activeGlobalApiIndex=="number"&&t.activeGlobalApiIndex>=0&&(a.activeGlobalApiIndex=Math.min(t.activeGlobalApiIndex,a.globalApis.length-1)),t.apiKeys&&typeof t.apiKeys=="object"){const r=t.apiKeys;typeof r.openai=="string"&&(a.apiKeys.openai=r.openai),typeof r.openai_compatible=="string"&&(a.apiKeys.openai_compatible=r.openai_compatible),typeof r.anthropic=="string"&&(a.apiKeys.anthropic=r.anthropic),typeof r.google=="string"&&(a.apiKeys.google=r.google),typeof r.deepseek=="string"&&(a.apiKeys.deepseek=r.deepseek)}typeof t.openaiCompatibleEndpoint=="string"&&(a.openaiCompatibleEndpoint=t.openaiCompatibleEndpoint),typeof t.anthropicCompatibleEndpoint=="string"&&(a.anthropicCompatibleEndpoint=t.anthropicCompatibleEndpoint),Array.isArray(t.offices)&&t.offices.length>0&&(a.offices=t.offices,a.officeSnapshots=Object.fromEntries(t.offices.map(r=>[r.officeId,Ie(r.officeId)])),a.activeOfficeId=t.offices[0].officeId)}catch{}}function De(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var oe=De();function Mt(e){oe=e}var fe={exec:()=>null};function z(e,t=""){let r=typeof e=="string"?e:e.source,o={replace:(n,i)=>{let s=typeof i=="string"?i:i.source;return s=s.replace(M.caret,"$1"),r=r.replace(n,s),o},getRegex:()=>new RegExp(r,t)};return o}var Rr=(()=>{try{return!!new RegExp("(?<=1)(?<!1)")}catch{return!1}})(),M={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceTabs:/^\t+/,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] +\S/,listReplaceTask:/^\[[ xX]\] +/,listTaskCheckbox:/\[[ xX]\]/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,unescapeTest:/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:e=>new RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),hrRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),fencesBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}(?:\`\`\`|~~~)`),headingBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}#`),htmlBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}<(?:[a-z].*>|!--)`,"i")},Tr=/^(?:[ \t]*(?:\n|$))+/,Cr=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,Or=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,be=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,Pr=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,je=/(?:[*+-]|\d{1,9}[.)])/,Kt=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,Dt=z(Kt).replace(/bull/g,je).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),Lr=z(Kt).replace(/bull/g,je).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),Be=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,qr=/^[^\n]+/,Ge=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,Nr=z(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",Ge).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),Mr=z(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,je).getRegex(),Ae="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",We=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,Kr=z("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",We).replace("tag",Ae).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),jt=z(Be).replace("hr",be).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",Ae).getRegex(),Dr=z(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",jt).getRegex(),Fe={blockquote:Dr,code:Cr,def:Nr,fences:Or,heading:Pr,hr:be,html:Kr,lheading:Dt,list:Mr,newline:Tr,paragraph:jt,table:fe,text:qr},wt=z("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",be).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",Ae).getRegex(),jr={...Fe,lheading:Lr,table:wt,paragraph:z(Be).replace("hr",be).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",wt).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",Ae).getRegex()},Br={...Fe,html:z(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",We).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:fe,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:z(Be).replace("hr",be).replace("heading",` *#{1,6} *[^
]`).replace("lheading",Dt).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},Gr=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,Wr=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,Bt=/^( {2,}|\\)\n(?!\s*$)/,Fr=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,ze=/[\p{P}\p{S}]/u,He=/[\s\p{P}\p{S}]/u,Gt=/[^\s\p{P}\p{S}]/u,Hr=z(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,He).getRegex(),Wt=/(?!~)[\p{P}\p{S}]/u,Zr=/(?!~)[\s\p{P}\p{S}]/u,Jr=/(?:[^\s\p{P}\p{S}]|~)/u,Vr=z(/link|precode-code|html/,"g").replace("link",/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-",Rr?"(?<!`)()":"(^^|[^`])").replace("code",/(?<b>`+)[^`]+\k<b>(?!`)/).replace("html",/<(?! )[^<>]*?>/).getRegex(),Ft=/^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/,Qr=z(Ft,"u").replace(/punct/g,ze).getRegex(),Ur=z(Ft,"u").replace(/punct/g,Wt).getRegex(),Ht="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",Yr=z(Ht,"gu").replace(/notPunctSpace/g,Gt).replace(/punctSpace/g,He).replace(/punct/g,ze).getRegex(),Xr=z(Ht,"gu").replace(/notPunctSpace/g,Jr).replace(/punctSpace/g,Zr).replace(/punct/g,Wt).getRegex(),eo=z("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,Gt).replace(/punctSpace/g,He).replace(/punct/g,ze).getRegex(),to=z(/\\(punct)/,"gu").replace(/punct/g,ze).getRegex(),ro=z(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),oo=z(We).replace("(?:-->|$)","-->").getRegex(),no=z("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",oo).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),ke=/(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/,io=z(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label",ke).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),Zt=z(/^!?\[(label)\]\[(ref)\]/).replace("label",ke).replace("ref",Ge).getRegex(),Jt=z(/^!?\[(ref)\](?:\[\])?/).replace("ref",Ge).getRegex(),ao=z("reflink|nolink(?!\\()","g").replace("reflink",Zt).replace("nolink",Jt).getRegex(),yt=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,Ze={_backpedal:fe,anyPunctuation:to,autolink:ro,blockSkip:Vr,br:Bt,code:Wr,del:fe,emStrongLDelim:Qr,emStrongRDelimAst:Yr,emStrongRDelimUnd:eo,escape:Gr,link:io,nolink:Jt,punctuation:Hr,reflink:Zt,reflinkSearch:ao,tag:no,text:Fr,url:fe},so={...Ze,link:z(/^!?\[(label)\]\((.*?)\)/).replace("label",ke).getRegex(),reflink:z(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",ke).getRegex()},Oe={...Ze,emStrongRDelimAst:Xr,emStrongLDelim:Ur,url:z(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol",yt).replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:z(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol",yt).getRegex()},lo={...Oe,br:z(Bt).replace("{2,}","*").getRegex(),text:z(Oe.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},he={normal:Fe,gfm:jr,pedantic:Br},de={normal:Ze,gfm:Oe,breaks:lo,pedantic:so},co={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},$t=e=>co[e];function Z(e,t){if(t){if(M.escapeTest.test(e))return e.replace(M.escapeReplace,$t)}else if(M.escapeTestNoEncode.test(e))return e.replace(M.escapeReplaceNoEncode,$t);return e}function It(e){try{e=encodeURI(e).replace(M.percentDecode,"%")}catch{return null}return e}function St(e,t){var i;let r=e.replace(M.findPipe,(s,l,p)=>{let d=!1,g=l;for(;--g>=0&&p[g]==="\\";)d=!d;return d?"|":" |"}),o=r.split(M.splitPipe),n=0;if(o[0].trim()||o.shift(),o.length>0&&!((i=o.at(-1))!=null&&i.trim())&&o.pop(),t)if(o.length>t)o.splice(t);else for(;o.length<t;)o.push("");for(;n<o.length;n++)o[n]=o[n].trim().replace(M.slashPipe,"|");return o}function ce(e,t,r){let o=e.length;if(o===0)return"";let n=0;for(;n<o&&e.charAt(o-n-1)===t;)n++;return e.slice(0,o-n)}function po(e,t){if(e.indexOf(t[1])===-1)return-1;let r=0;for(let o=0;o<e.length;o++)if(e[o]==="\\")o++;else if(e[o]===t[0])r++;else if(e[o]===t[1]&&(r--,r<0))return o;return r>0?-2:-1}function At(e,t,r,o,n){let i=t.href,s=t.title||null,l=e[1].replace(n.other.outputLinkReplace,"$1");o.state.inLink=!0;let p={type:e[0].charAt(0)==="!"?"image":"link",raw:r,href:i,title:s,text:l,tokens:o.inlineTokens(l)};return o.state.inLink=!1,p}function fo(e,t,r){let o=e.match(r.other.indentCodeCompensation);if(o===null)return t;let n=o[1];return t.split(`
`).map(i=>{let s=i.match(r.other.beginningSpace);if(s===null)return i;let[l]=s;return l.length>=n.length?i.slice(n.length):i}).join(`
`)}var we=class{constructor(e){R(this,"options");R(this,"rules");R(this,"lexer");this.options=e||oe}space(e){let t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return{type:"space",raw:t[0]}}code(e){let t=this.rules.block.code.exec(e);if(t){let r=t[0].replace(this.rules.other.codeRemoveIndent,"");return{type:"code",raw:t[0],codeBlockStyle:"indented",text:this.options.pedantic?r:ce(r,`
`)}}}fences(e){let t=this.rules.block.fences.exec(e);if(t){let r=t[0],o=fo(r,t[3]||"",this.rules);return{type:"code",raw:r,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):t[2],text:o}}}heading(e){let t=this.rules.block.heading.exec(e);if(t){let r=t[2].trim();if(this.rules.other.endingHash.test(r)){let o=ce(r,"#");(this.options.pedantic||!o||this.rules.other.endingSpaceChar.test(o))&&(r=o.trim())}return{type:"heading",raw:t[0],depth:t[1].length,text:r,tokens:this.lexer.inline(r)}}}hr(e){let t=this.rules.block.hr.exec(e);if(t)return{type:"hr",raw:ce(t[0],`
`)}}blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let r=ce(t[0],`
`).split(`
`),o="",n="",i=[];for(;r.length>0;){let s=!1,l=[],p;for(p=0;p<r.length;p++)if(this.rules.other.blockquoteStart.test(r[p]))l.push(r[p]),s=!0;else if(!s)l.push(r[p]);else break;r=r.slice(p);let d=l.join(`
`),g=d.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");o=o?`${o}
${d}`:d,n=n?`${n}
${g}`:g;let y=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(g,i,!0),this.lexer.state.top=y,r.length===0)break;let $=i.at(-1);if(($==null?void 0:$.type)==="code")break;if(($==null?void 0:$.type)==="blockquote"){let b=$,A=b.raw+`
`+r.join(`
`),I=this.blockquote(A);i[i.length-1]=I,o=o.substring(0,o.length-b.raw.length)+I.raw,n=n.substring(0,n.length-b.text.length)+I.text;break}else if(($==null?void 0:$.type)==="list"){let b=$,A=b.raw+`
`+r.join(`
`),I=this.list(A);i[i.length-1]=I,o=o.substring(0,o.length-$.raw.length)+I.raw,n=n.substring(0,n.length-b.raw.length)+I.raw,r=A.substring(i.at(-1).raw.length).split(`
`);continue}}return{type:"blockquote",raw:o,tokens:i,text:n}}}list(e){var r,o;let t=this.rules.block.list.exec(e);if(t){let n=t[1].trim(),i=n.length>1,s={type:"list",raw:"",ordered:i,start:i?+n.slice(0,-1):"",loose:!1,items:[]};n=i?`\\d{1,9}\\${n.slice(-1)}`:`\\${n}`,this.options.pedantic&&(n=i?n:"[*+-]");let l=this.rules.other.listItemRegex(n),p=!1;for(;e;){let g=!1,y="",$="";if(!(t=l.exec(e))||this.rules.block.hr.test(e))break;y=t[0],e=e.substring(y.length);let b=t[2].split(`
`,1)[0].replace(this.rules.other.listReplaceTabs,K=>" ".repeat(3*K.length)),A=e.split(`
`,1)[0],I=!b.trim(),T=0;if(this.options.pedantic?(T=2,$=b.trimStart()):I?T=t[1].length+1:(T=t[2].search(this.rules.other.nonSpaceChar),T=T>4?1:T,$=b.slice(T),T+=t[1].length),I&&this.rules.other.blankLine.test(A)&&(y+=A+`
`,e=e.substring(A.length+1),g=!0),!g){let K=this.rules.other.nextBulletRegex(T),H=this.rules.other.hrRegex(T),J=this.rules.other.fencesBeginRegex(T),Y=this.rules.other.headingBeginRegex(T),ie=this.rules.other.htmlBeginRegex(T);for(;e;){let C=e.split(`
`,1)[0],q;if(A=C,this.options.pedantic?(A=A.replace(this.rules.other.listReplaceNesting,"  "),q=A):q=A.replace(this.rules.other.tabCharGlobal,"    "),J.test(A)||Y.test(A)||ie.test(A)||K.test(A)||H.test(A))break;if(q.search(this.rules.other.nonSpaceChar)>=T||!A.trim())$+=`
`+q.slice(T);else{if(I||b.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||J.test(b)||Y.test(b)||H.test(b))break;$+=`
`+A}!I&&!A.trim()&&(I=!0),y+=C+`
`,e=e.substring(C.length+1),b=q.slice(T)}}s.loose||(p?s.loose=!0:this.rules.other.doubleBlankLine.test(y)&&(p=!0)),s.items.push({type:"list_item",raw:y,task:!!this.options.gfm&&this.rules.other.listIsTask.test($),loose:!1,text:$,tokens:[]}),s.raw+=y}let d=s.items.at(-1);if(d)d.raw=d.raw.trimEnd(),d.text=d.text.trimEnd();else return;s.raw=s.raw.trimEnd();for(let g of s.items){if(this.lexer.state.top=!1,g.tokens=this.lexer.blockTokens(g.text,[]),g.task){if(g.text=g.text.replace(this.rules.other.listReplaceTask,""),((r=g.tokens[0])==null?void 0:r.type)==="text"||((o=g.tokens[0])==null?void 0:o.type)==="paragraph"){g.tokens[0].raw=g.tokens[0].raw.replace(this.rules.other.listReplaceTask,""),g.tokens[0].text=g.tokens[0].text.replace(this.rules.other.listReplaceTask,"");for(let $=this.lexer.inlineQueue.length-1;$>=0;$--)if(this.rules.other.listIsTask.test(this.lexer.inlineQueue[$].src)){this.lexer.inlineQueue[$].src=this.lexer.inlineQueue[$].src.replace(this.rules.other.listReplaceTask,"");break}}let y=this.rules.other.listTaskCheckbox.exec(g.raw);if(y){let $={type:"checkbox",raw:y[0]+" ",checked:y[0]!=="[ ]"};g.checked=$.checked,s.loose?g.tokens[0]&&["paragraph","text"].includes(g.tokens[0].type)&&"tokens"in g.tokens[0]&&g.tokens[0].tokens?(g.tokens[0].raw=$.raw+g.tokens[0].raw,g.tokens[0].text=$.raw+g.tokens[0].text,g.tokens[0].tokens.unshift($)):g.tokens.unshift({type:"paragraph",raw:$.raw,text:$.raw,tokens:[$]}):g.tokens.unshift($)}}if(!s.loose){let y=g.tokens.filter(b=>b.type==="space"),$=y.length>0&&y.some(b=>this.rules.other.anyLine.test(b.raw));s.loose=$}}if(s.loose)for(let g of s.items){g.loose=!0;for(let y of g.tokens)y.type==="text"&&(y.type="paragraph")}return s}}html(e){let t=this.rules.block.html.exec(e);if(t)return{type:"html",block:!0,raw:t[0],pre:t[1]==="pre"||t[1]==="script"||t[1]==="style",text:t[0]}}def(e){let t=this.rules.block.def.exec(e);if(t){let r=t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal," "),o=t[2]?t[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",n=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):t[3];return{type:"def",tag:r,raw:t[0],href:o,title:n}}}table(e){var s;let t=this.rules.block.table.exec(e);if(!t||!this.rules.other.tableDelimiter.test(t[2]))return;let r=St(t[1]),o=t[2].replace(this.rules.other.tableAlignChars,"").split("|"),n=(s=t[3])!=null&&s.trim()?t[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],i={type:"table",raw:t[0],header:[],align:[],rows:[]};if(r.length===o.length){for(let l of o)this.rules.other.tableAlignRight.test(l)?i.align.push("right"):this.rules.other.tableAlignCenter.test(l)?i.align.push("center"):this.rules.other.tableAlignLeft.test(l)?i.align.push("left"):i.align.push(null);for(let l=0;l<r.length;l++)i.header.push({text:r[l],tokens:this.lexer.inline(r[l]),header:!0,align:i.align[l]});for(let l of n)i.rows.push(St(l,i.header.length).map((p,d)=>({text:p,tokens:this.lexer.inline(p),header:!1,align:i.align[d]})));return i}}lheading(e){let t=this.rules.block.lheading.exec(e);if(t)return{type:"heading",raw:t[0],depth:t[2].charAt(0)==="="?1:2,text:t[1],tokens:this.lexer.inline(t[1])}}paragraph(e){let t=this.rules.block.paragraph.exec(e);if(t){let r=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return{type:"paragraph",raw:t[0],text:r,tokens:this.lexer.inline(r)}}}text(e){let t=this.rules.block.text.exec(e);if(t)return{type:"text",raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){let t=this.rules.inline.escape.exec(e);if(t)return{type:"escape",raw:t[0],text:t[1]}}tag(e){let t=this.rules.inline.tag.exec(e);if(t)return!this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:t[0]}}link(e){let t=this.rules.inline.link.exec(e);if(t){let r=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(r)){if(!this.rules.other.endAngleBracket.test(r))return;let i=ce(r.slice(0,-1),"\\");if((r.length-i.length)%2===0)return}else{let i=po(t[2],"()");if(i===-2)return;if(i>-1){let s=(t[0].indexOf("!")===0?5:4)+t[1].length+i;t[2]=t[2].substring(0,i),t[0]=t[0].substring(0,s).trim(),t[3]=""}}let o=t[2],n="";if(this.options.pedantic){let i=this.rules.other.pedanticHrefTitle.exec(o);i&&(o=i[1],n=i[3])}else n=t[3]?t[3].slice(1,-1):"";return o=o.trim(),this.rules.other.startAngleBracket.test(o)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(r)?o=o.slice(1):o=o.slice(1,-1)),At(t,{href:o&&o.replace(this.rules.inline.anyPunctuation,"$1"),title:n&&n.replace(this.rules.inline.anyPunctuation,"$1")},t[0],this.lexer,this.rules)}}reflink(e,t){let r;if((r=this.rules.inline.reflink.exec(e))||(r=this.rules.inline.nolink.exec(e))){let o=(r[2]||r[1]).replace(this.rules.other.multipleSpaceGlobal," "),n=t[o.toLowerCase()];if(!n){let i=r[0].charAt(0);return{type:"text",raw:i,text:i}}return At(r,n,r[0],this.lexer,this.rules)}}emStrong(e,t,r=""){let o=this.rules.inline.emStrongLDelim.exec(e);if(!(!o||o[3]&&r.match(this.rules.other.unicodeAlphaNumeric))&&(!(o[1]||o[2])||!r||this.rules.inline.punctuation.exec(r))){let n=[...o[0]].length-1,i,s,l=n,p=0,d=o[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(d.lastIndex=0,t=t.slice(-1*e.length+n);(o=d.exec(t))!=null;){if(i=o[1]||o[2]||o[3]||o[4]||o[5]||o[6],!i)continue;if(s=[...i].length,o[3]||o[4]){l+=s;continue}else if((o[5]||o[6])&&n%3&&!((n+s)%3)){p+=s;continue}if(l-=s,l>0)continue;s=Math.min(s,s+l+p);let g=[...o[0]][0].length,y=e.slice(0,n+o.index+g+s);if(Math.min(n,s)%2){let b=y.slice(1,-1);return{type:"em",raw:y,text:b,tokens:this.lexer.inlineTokens(b)}}let $=y.slice(2,-2);return{type:"strong",raw:y,text:$,tokens:this.lexer.inlineTokens($)}}}}codespan(e){let t=this.rules.inline.code.exec(e);if(t){let r=t[2].replace(this.rules.other.newLineCharGlobal," "),o=this.rules.other.nonSpaceChar.test(r),n=this.rules.other.startingSpaceChar.test(r)&&this.rules.other.endingSpaceChar.test(r);return o&&n&&(r=r.substring(1,r.length-1)),{type:"codespan",raw:t[0],text:r}}}br(e){let t=this.rules.inline.br.exec(e);if(t)return{type:"br",raw:t[0]}}del(e){let t=this.rules.inline.del.exec(e);if(t)return{type:"del",raw:t[0],text:t[2],tokens:this.lexer.inlineTokens(t[2])}}autolink(e){let t=this.rules.inline.autolink.exec(e);if(t){let r,o;return t[2]==="@"?(r=t[1],o="mailto:"+r):(r=t[1],o=r),{type:"link",raw:t[0],text:r,href:o,tokens:[{type:"text",raw:r,text:r}]}}}url(e){var r;let t;if(t=this.rules.inline.url.exec(e)){let o,n;if(t[2]==="@")o=t[0],n="mailto:"+o;else{let i;do i=t[0],t[0]=((r=this.rules.inline._backpedal.exec(t[0]))==null?void 0:r[0])??"";while(i!==t[0]);o=t[0],t[1]==="www."?n="http://"+t[0]:n=t[0]}return{type:"link",raw:t[0],text:o,href:n,tokens:[{type:"text",raw:o,text:o}]}}}inlineText(e){let t=this.rules.inline.text.exec(e);if(t){let r=this.lexer.state.inRawBlock;return{type:"text",raw:t[0],text:t[0],escaped:r}}}},j=class Pe{constructor(t){R(this,"tokens");R(this,"options");R(this,"state");R(this,"inlineQueue");R(this,"tokenizer");this.tokens=[],this.tokens.links=Object.create(null),this.options=t||oe,this.options.tokenizer=this.options.tokenizer||new we,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};let r={other:M,block:he.normal,inline:de.normal};this.options.pedantic?(r.block=he.pedantic,r.inline=de.pedantic):this.options.gfm&&(r.block=he.gfm,this.options.breaks?r.inline=de.breaks:r.inline=de.gfm),this.tokenizer.rules=r}static get rules(){return{block:he,inline:de}}static lex(t,r){return new Pe(r).lex(t)}static lexInline(t,r){return new Pe(r).inlineTokens(t)}lex(t){t=t.replace(M.carriageReturn,`
`),this.blockTokens(t,this.tokens);for(let r=0;r<this.inlineQueue.length;r++){let o=this.inlineQueue[r];this.inlineTokens(o.src,o.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(t,r=[],o=!1){var n,i,s;for(this.options.pedantic&&(t=t.replace(M.tabCharGlobal,"    ").replace(M.spaceLine,""));t;){let l;if((i=(n=this.options.extensions)==null?void 0:n.block)!=null&&i.some(d=>(l=d.call({lexer:this},t,r))?(t=t.substring(l.raw.length),r.push(l),!0):!1))continue;if(l=this.tokenizer.space(t)){t=t.substring(l.raw.length);let d=r.at(-1);l.raw.length===1&&d!==void 0?d.raw+=`
`:r.push(l);continue}if(l=this.tokenizer.code(t)){t=t.substring(l.raw.length);let d=r.at(-1);(d==null?void 0:d.type)==="paragraph"||(d==null?void 0:d.type)==="text"?(d.raw+=(d.raw.endsWith(`
`)?"":`
`)+l.raw,d.text+=`
`+l.text,this.inlineQueue.at(-1).src=d.text):r.push(l);continue}if(l=this.tokenizer.fences(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.heading(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.hr(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.blockquote(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.list(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.html(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.def(t)){t=t.substring(l.raw.length);let d=r.at(-1);(d==null?void 0:d.type)==="paragraph"||(d==null?void 0:d.type)==="text"?(d.raw+=(d.raw.endsWith(`
`)?"":`
`)+l.raw,d.text+=`
`+l.raw,this.inlineQueue.at(-1).src=d.text):this.tokens.links[l.tag]||(this.tokens.links[l.tag]={href:l.href,title:l.title},r.push(l));continue}if(l=this.tokenizer.table(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.lheading(t)){t=t.substring(l.raw.length),r.push(l);continue}let p=t;if((s=this.options.extensions)!=null&&s.startBlock){let d=1/0,g=t.slice(1),y;this.options.extensions.startBlock.forEach($=>{y=$.call({lexer:this},g),typeof y=="number"&&y>=0&&(d=Math.min(d,y))}),d<1/0&&d>=0&&(p=t.substring(0,d+1))}if(this.state.top&&(l=this.tokenizer.paragraph(p))){let d=r.at(-1);o&&(d==null?void 0:d.type)==="paragraph"?(d.raw+=(d.raw.endsWith(`
`)?"":`
`)+l.raw,d.text+=`
`+l.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=d.text):r.push(l),o=p.length!==t.length,t=t.substring(l.raw.length);continue}if(l=this.tokenizer.text(t)){t=t.substring(l.raw.length);let d=r.at(-1);(d==null?void 0:d.type)==="text"?(d.raw+=(d.raw.endsWith(`
`)?"":`
`)+l.raw,d.text+=`
`+l.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=d.text):r.push(l);continue}if(t){let d="Infinite loop on byte: "+t.charCodeAt(0);if(this.options.silent){console.error(d);break}else throw new Error(d)}}return this.state.top=!0,r}inline(t,r=[]){return this.inlineQueue.push({src:t,tokens:r}),r}inlineTokens(t,r=[]){var p,d,g,y,$;let o=t,n=null;if(this.tokens.links){let b=Object.keys(this.tokens.links);if(b.length>0)for(;(n=this.tokenizer.rules.inline.reflinkSearch.exec(o))!=null;)b.includes(n[0].slice(n[0].lastIndexOf("[")+1,-1))&&(o=o.slice(0,n.index)+"["+"a".repeat(n[0].length-2)+"]"+o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;(n=this.tokenizer.rules.inline.anyPunctuation.exec(o))!=null;)o=o.slice(0,n.index)+"++"+o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);let i;for(;(n=this.tokenizer.rules.inline.blockSkip.exec(o))!=null;)i=n[2]?n[2].length:0,o=o.slice(0,n.index+i)+"["+"a".repeat(n[0].length-i-2)+"]"+o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);o=((d=(p=this.options.hooks)==null?void 0:p.emStrongMask)==null?void 0:d.call({lexer:this},o))??o;let s=!1,l="";for(;t;){s||(l=""),s=!1;let b;if((y=(g=this.options.extensions)==null?void 0:g.inline)!=null&&y.some(I=>(b=I.call({lexer:this},t,r))?(t=t.substring(b.raw.length),r.push(b),!0):!1))continue;if(b=this.tokenizer.escape(t)){t=t.substring(b.raw.length),r.push(b);continue}if(b=this.tokenizer.tag(t)){t=t.substring(b.raw.length),r.push(b);continue}if(b=this.tokenizer.link(t)){t=t.substring(b.raw.length),r.push(b);continue}if(b=this.tokenizer.reflink(t,this.tokens.links)){t=t.substring(b.raw.length);let I=r.at(-1);b.type==="text"&&(I==null?void 0:I.type)==="text"?(I.raw+=b.raw,I.text+=b.text):r.push(b);continue}if(b=this.tokenizer.emStrong(t,o,l)){t=t.substring(b.raw.length),r.push(b);continue}if(b=this.tokenizer.codespan(t)){t=t.substring(b.raw.length),r.push(b);continue}if(b=this.tokenizer.br(t)){t=t.substring(b.raw.length),r.push(b);continue}if(b=this.tokenizer.del(t)){t=t.substring(b.raw.length),r.push(b);continue}if(b=this.tokenizer.autolink(t)){t=t.substring(b.raw.length),r.push(b);continue}if(!this.state.inLink&&(b=this.tokenizer.url(t))){t=t.substring(b.raw.length),r.push(b);continue}let A=t;if(($=this.options.extensions)!=null&&$.startInline){let I=1/0,T=t.slice(1),K;this.options.extensions.startInline.forEach(H=>{K=H.call({lexer:this},T),typeof K=="number"&&K>=0&&(I=Math.min(I,K))}),I<1/0&&I>=0&&(A=t.substring(0,I+1))}if(b=this.tokenizer.inlineText(A)){t=t.substring(b.raw.length),b.raw.slice(-1)!=="_"&&(l=b.raw.slice(-1)),s=!0;let I=r.at(-1);(I==null?void 0:I.type)==="text"?(I.raw+=b.raw,I.text+=b.text):r.push(b);continue}if(t){let I="Infinite loop on byte: "+t.charCodeAt(0);if(this.options.silent){console.error(I);break}else throw new Error(I)}}return r}},ye=class{constructor(e){R(this,"options");R(this,"parser");this.options=e||oe}space(e){return""}code({text:e,lang:t,escaped:r}){var i;let o=(i=(t||"").match(M.notSpaceStart))==null?void 0:i[0],n=e.replace(M.endingNewline,"")+`
`;return o?'<pre><code class="language-'+Z(o)+'">'+(r?n:Z(n,!0))+`</code></pre>
`:"<pre><code>"+(r?n:Z(n,!0))+`</code></pre>
`}blockquote({tokens:e}){return`<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}def(e){return""}heading({tokens:e,depth:t}){return`<h${t}>${this.parser.parseInline(e)}</h${t}>
`}hr(e){return`<hr>
`}list(e){let t=e.ordered,r=e.start,o="";for(let s=0;s<e.items.length;s++){let l=e.items[s];o+=this.listitem(l)}let n=t?"ol":"ul",i=t&&r!==1?' start="'+r+'"':"";return"<"+n+i+`>
`+o+"</"+n+`>
`}listitem(e){return`<li>${this.parser.parse(e.tokens)}</li>
`}checkbox({checked:e}){return"<input "+(e?'checked="" ':"")+'disabled="" type="checkbox"> '}paragraph({tokens:e}){return`<p>${this.parser.parseInline(e)}</p>
`}table(e){let t="",r="";for(let n=0;n<e.header.length;n++)r+=this.tablecell(e.header[n]);t+=this.tablerow({text:r});let o="";for(let n=0;n<e.rows.length;n++){let i=e.rows[n];r="";for(let s=0;s<i.length;s++)r+=this.tablecell(i[s]);o+=this.tablerow({text:r})}return o&&(o=`<tbody>${o}</tbody>`),`<table>
<thead>
`+t+`</thead>
`+o+`</table>
`}tablerow({text:e}){return`<tr>
${e}</tr>
`}tablecell(e){let t=this.parser.parseInline(e.tokens),r=e.header?"th":"td";return(e.align?`<${r} align="${e.align}">`:`<${r}>`)+t+`</${r}>
`}strong({tokens:e}){return`<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return`<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return`<code>${Z(e,!0)}</code>`}br(e){return"<br>"}del({tokens:e}){return`<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,tokens:r}){let o=this.parser.parseInline(r),n=It(e);if(n===null)return o;e=n;let i='<a href="'+e+'"';return t&&(i+=' title="'+Z(t)+'"'),i+=">"+o+"</a>",i}image({href:e,title:t,text:r,tokens:o}){o&&(r=this.parser.parseInline(o,this.parser.textRenderer));let n=It(e);if(n===null)return Z(r);e=n;let i=`<img src="${e}" alt="${r}"`;return t&&(i+=` title="${Z(t)}"`),i+=">",i}text(e){return"tokens"in e&&e.tokens?this.parser.parseInline(e.tokens):"escaped"in e&&e.escaped?e.text:Z(e.text)}},Je=class{strong({text:e}){return e}em({text:e}){return e}codespan({text:e}){return e}del({text:e}){return e}html({text:e}){return e}text({text:e}){return e}link({text:e}){return""+e}image({text:e}){return""+e}br(){return""}checkbox({raw:e}){return e}},B=class Le{constructor(t){R(this,"options");R(this,"renderer");R(this,"textRenderer");this.options=t||oe,this.options.renderer=this.options.renderer||new ye,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new Je}static parse(t,r){return new Le(r).parse(t)}static parseInline(t,r){return new Le(r).parseInline(t)}parse(t){var o,n;let r="";for(let i=0;i<t.length;i++){let s=t[i];if((n=(o=this.options.extensions)==null?void 0:o.renderers)!=null&&n[s.type]){let p=s,d=this.options.extensions.renderers[p.type].call({parser:this},p);if(d!==!1||!["space","hr","heading","code","table","blockquote","list","html","def","paragraph","text"].includes(p.type)){r+=d||"";continue}}let l=s;switch(l.type){case"space":{r+=this.renderer.space(l);break}case"hr":{r+=this.renderer.hr(l);break}case"heading":{r+=this.renderer.heading(l);break}case"code":{r+=this.renderer.code(l);break}case"table":{r+=this.renderer.table(l);break}case"blockquote":{r+=this.renderer.blockquote(l);break}case"list":{r+=this.renderer.list(l);break}case"checkbox":{r+=this.renderer.checkbox(l);break}case"html":{r+=this.renderer.html(l);break}case"def":{r+=this.renderer.def(l);break}case"paragraph":{r+=this.renderer.paragraph(l);break}case"text":{r+=this.renderer.text(l);break}default:{let p='Token with "'+l.type+'" type was not found.';if(this.options.silent)return console.error(p),"";throw new Error(p)}}}return r}parseInline(t,r=this.renderer){var n,i;let o="";for(let s=0;s<t.length;s++){let l=t[s];if((i=(n=this.options.extensions)==null?void 0:n.renderers)!=null&&i[l.type]){let d=this.options.extensions.renderers[l.type].call({parser:this},l);if(d!==!1||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(l.type)){o+=d||"";continue}}let p=l;switch(p.type){case"escape":{o+=r.text(p);break}case"html":{o+=r.html(p);break}case"link":{o+=r.link(p);break}case"image":{o+=r.image(p);break}case"checkbox":{o+=r.checkbox(p);break}case"strong":{o+=r.strong(p);break}case"em":{o+=r.em(p);break}case"codespan":{o+=r.codespan(p);break}case"br":{o+=r.br(p);break}case"del":{o+=r.del(p);break}case"text":{o+=r.text(p);break}default:{let d='Token with "'+p.type+'" type was not found.';if(this.options.silent)return console.error(d),"";throw new Error(d)}}}return o}},xe,pe=(xe=class{constructor(e){R(this,"options");R(this,"block");this.options=e||oe}preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}emStrongMask(e){return e}provideLexer(){return this.block?j.lex:j.lexInline}provideParser(){return this.block?B.parse:B.parseInline}},R(xe,"passThroughHooks",new Set(["preprocess","postprocess","processAllTokens","emStrongMask"])),R(xe,"passThroughHooksRespectAsync",new Set(["preprocess","postprocess","processAllTokens"])),xe),uo=class{constructor(...e){R(this,"defaults",De());R(this,"options",this.setOptions);R(this,"parse",this.parseMarkdown(!0));R(this,"parseInline",this.parseMarkdown(!1));R(this,"Parser",B);R(this,"Renderer",ye);R(this,"TextRenderer",Je);R(this,"Lexer",j);R(this,"Tokenizer",we);R(this,"Hooks",pe);this.use(...e)}walkTokens(e,t){var o,n;let r=[];for(let i of e)switch(r=r.concat(t.call(this,i)),i.type){case"table":{let s=i;for(let l of s.header)r=r.concat(this.walkTokens(l.tokens,t));for(let l of s.rows)for(let p of l)r=r.concat(this.walkTokens(p.tokens,t));break}case"list":{let s=i;r=r.concat(this.walkTokens(s.items,t));break}default:{let s=i;(n=(o=this.defaults.extensions)==null?void 0:o.childTokens)!=null&&n[s.type]?this.defaults.extensions.childTokens[s.type].forEach(l=>{let p=s[l].flat(1/0);r=r.concat(this.walkTokens(p,t))}):s.tokens&&(r=r.concat(this.walkTokens(s.tokens,t)))}}return r}use(...e){let t=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach(r=>{let o={...r};if(o.async=this.defaults.async||o.async||!1,r.extensions&&(r.extensions.forEach(n=>{if(!n.name)throw new Error("extension name required");if("renderer"in n){let i=t.renderers[n.name];i?t.renderers[n.name]=function(...s){let l=n.renderer.apply(this,s);return l===!1&&(l=i.apply(this,s)),l}:t.renderers[n.name]=n.renderer}if("tokenizer"in n){if(!n.level||n.level!=="block"&&n.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let i=t[n.level];i?i.unshift(n.tokenizer):t[n.level]=[n.tokenizer],n.start&&(n.level==="block"?t.startBlock?t.startBlock.push(n.start):t.startBlock=[n.start]:n.level==="inline"&&(t.startInline?t.startInline.push(n.start):t.startInline=[n.start]))}"childTokens"in n&&n.childTokens&&(t.childTokens[n.name]=n.childTokens)}),o.extensions=t),r.renderer){let n=this.defaults.renderer||new ye(this.defaults);for(let i in r.renderer){if(!(i in n))throw new Error(`renderer '${i}' does not exist`);if(["options","parser"].includes(i))continue;let s=i,l=r.renderer[s],p=n[s];n[s]=(...d)=>{let g=l.apply(n,d);return g===!1&&(g=p.apply(n,d)),g||""}}o.renderer=n}if(r.tokenizer){let n=this.defaults.tokenizer||new we(this.defaults);for(let i in r.tokenizer){if(!(i in n))throw new Error(`tokenizer '${i}' does not exist`);if(["options","rules","lexer"].includes(i))continue;let s=i,l=r.tokenizer[s],p=n[s];n[s]=(...d)=>{let g=l.apply(n,d);return g===!1&&(g=p.apply(n,d)),g}}o.tokenizer=n}if(r.hooks){let n=this.defaults.hooks||new pe;for(let i in r.hooks){if(!(i in n))throw new Error(`hook '${i}' does not exist`);if(["options","block"].includes(i))continue;let s=i,l=r.hooks[s],p=n[s];pe.passThroughHooks.has(i)?n[s]=d=>{if(this.defaults.async&&pe.passThroughHooksRespectAsync.has(i))return(async()=>{let y=await l.call(n,d);return p.call(n,y)})();let g=l.call(n,d);return p.call(n,g)}:n[s]=(...d)=>{if(this.defaults.async)return(async()=>{let y=await l.apply(n,d);return y===!1&&(y=await p.apply(n,d)),y})();let g=l.apply(n,d);return g===!1&&(g=p.apply(n,d)),g}}o.hooks=n}if(r.walkTokens){let n=this.defaults.walkTokens,i=r.walkTokens;o.walkTokens=function(s){let l=[];return l.push(i.call(this,s)),n&&(l=l.concat(n.call(this,s))),l}}this.defaults={...this.defaults,...o}}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return j.lex(e,t??this.defaults)}parser(e,t){return B.parse(e,t??this.defaults)}parseMarkdown(e){return(t,r)=>{let o={...r},n={...this.defaults,...o},i=this.onError(!!n.silent,!!n.async);if(this.defaults.async===!0&&o.async===!1)return i(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof t>"u"||t===null)return i(new Error("marked(): input parameter is undefined or null"));if(typeof t!="string")return i(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(t)+", string expected"));if(n.hooks&&(n.hooks.options=n,n.hooks.block=e),n.async)return(async()=>{let s=n.hooks?await n.hooks.preprocess(t):t,l=await(n.hooks?await n.hooks.provideLexer():e?j.lex:j.lexInline)(s,n),p=n.hooks?await n.hooks.processAllTokens(l):l;n.walkTokens&&await Promise.all(this.walkTokens(p,n.walkTokens));let d=await(n.hooks?await n.hooks.provideParser():e?B.parse:B.parseInline)(p,n);return n.hooks?await n.hooks.postprocess(d):d})().catch(i);try{n.hooks&&(t=n.hooks.preprocess(t));let s=(n.hooks?n.hooks.provideLexer():e?j.lex:j.lexInline)(t,n);n.hooks&&(s=n.hooks.processAllTokens(s)),n.walkTokens&&this.walkTokens(s,n.walkTokens);let l=(n.hooks?n.hooks.provideParser():e?B.parse:B.parseInline)(s,n);return n.hooks&&(l=n.hooks.postprocess(l)),l}catch(s){return i(s)}}}onError(e,t){return r=>{if(r.message+=`
Please report this to https://github.com/markedjs/marked.`,e){let o="<p>An error occurred:</p><pre>"+Z(r.message+"",!0)+"</pre>";return t?Promise.resolve(o):o}if(t)return Promise.reject(r);throw r}}},re=new uo;function E(e,t){return re.parse(e,t)}E.options=E.setOptions=function(e){return re.setOptions(e),E.defaults=re.defaults,Mt(E.defaults),E};E.getDefaults=De;E.defaults=oe;E.use=function(...e){return re.use(...e),E.defaults=re.defaults,Mt(E.defaults),E};E.walkTokens=function(e,t){return re.walkTokens(e,t)};E.parseInline=re.parseInline;E.Parser=B;E.parser=B.parse;E.Renderer=ye;E.TextRenderer=Je;E.Lexer=j;E.lexer=j.lex;E.Tokenizer=we;E.Hooks=pe;E.parse=E;E.options;E.setOptions;E.use;E.walkTokens;E.parseInline;B.parse;j.lex;E.setOptions({gfm:!0,breaks:!0,async:!1});function Ve(e){try{return E.parse(e)}catch{return h(e).replace(/\n/g,"<br>")}}function Vt(e){try{return JSON.stringify(e,null,2)}catch{return String(e)}}function F(e){return e instanceof Error?e.message:String(e)}function Qt(e){if(e&&typeof e=="object"&&!Array.isArray(e))return e}function O(e){return typeof e=="string"?e:void 0}function N(e){if(typeof e=="number"&&Number.isFinite(e))return e;if(typeof e=="string"&&e.trim().length>0){const t=Number(e);if(Number.isFinite(t))return t}}function h(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function Ut(e){if(e==="idle"||e==="starting"||e==="running"||e==="completed"||e==="stopped"||e==="error")return e}function go(e){if(!Array.isArray(e))return;const t=new Map(a.participants.map(o=>[o.participantId,o])),r=e.map(o=>Qt(o)).filter(o=>o!==void 0).map(o=>{const n=O(o.participant_id)??"unknown",i=t.get(n);return{participantId:n,role:O(o.role)??(i==null?void 0:i.role)??"-",provider:O(o.provider)??(i==null?void 0:i.provider)??"-",modelId:O(o.model_id)??(i==null?void 0:i.modelId)??"-",status:(i==null?void 0:i.status)??"pending",latencyMs:i==null?void 0:i.latencyMs}});a.participants=r}function X(e,t){const r=Lt(e);r&&V(r.officeId,t)}function zt(e){return!m.open||!e?!1:m.sessionId?m.sessionId===e:!m.aiThinking&&!m.creating||a.sessionOfficeMap[e]?!1:(m.sessionId=e,!0)}function bo(e,t){const r=Qt(t);if(!r)return;const o=O(r.session_id);if(o&&!(m.open&&(m.sessionId===o||!m.sessionId&&(m.aiThinking||m.creating)))&&(a.sessionId=o,!a.sessionOfficeMap[o])){const y=W();y&&Se(o,y.officeId)}const n=O(r.status),i=Ut(n);i&&(a.runStatus=i);const s=N(r.turn_index)??N(r.current_turn)??N(r.total_turns);s!==void 0&&(a.turnIndex=s);const l=N(r.total_tokens);l!==void 0&&(a.totalTokens=l);const p=N(r.total_cost);p!==void 0&&(a.totalCost=p);const d=N(r.agreement_score)??N(r.final_agreement);d!==void 0&&(a.agreementScore=d),o&&X(o,{status:i,turnIndex:s,agreementScore:d,totalTokens:l,totalCost:p,lastSummary:typeof r.stop_reason=="string"?`会议结束：${r.stop_reason}`:n?`会话状态更新：${n}`:void 0})}function ho(e){const t=e.method;if(!t)return;const r=e.params??{};Nt(t,r);const o=O(r.session_id),n=o&&m.open&&(m.sessionId===o||!m.sessionId&&(m.aiThinking||m.creating));if(o&&!n&&!a.sessionOfficeMap[o]){const i=W();i&&Se(o,i.officeId)}if(t==="session/state"){const i=O(r.session_id),s=O(r.status),l=O(r.reason),p=Ut(s);i&&(a.sessionId=i),p&&(a.runStatus=p),i&&X(i,{status:p,lastSummary:s?l?`状态：${s}，${l}`:`状态：${s}`:void 0})}if(t==="session/progress"){const i=N(r.turn_index),s=N(r.total_tokens),l=N(r.total_cost),p=N(r.agreement_score);i!==void 0&&(a.turnIndex=i),s!==void 0&&(a.totalTokens=s),l!==void 0&&(a.totalCost=l),p!==void 0&&(a.agreementScore=p),o&&X(o,{status:"running",turnIndex:i,agreementScore:p,totalTokens:s,totalCost:l,lastSummary:p!==void 0?`第${i??0}轮，共识 ${p.toFixed(3)}`:void 0})}if(t==="session/participants"&&go(r.participants),t==="turn/complete"){const i=O(r.participant_id),s=O(r.status)??"unknown",l=zt(o);i&&Ar(i,{status:s,latencyMs:N(r.latency_ms)}),o&&i&&X(o,{lastSummary:`${i} 已完成，状态：${s}`}),l&&(m.aiThinking=!1)}if(t==="turn/chunk"){const i=O(r.participant_id)??"unknown",s=O(r.session_id)??a.sessionId,l=N(r.turn_index)??a.turnIndex,p=O(r.delta)??"",d=zt(s);if(Sr({time:new Date().toISOString(),sessionId:s,turnIndex:l,participantId:i,delta:p}),X(s,{status:"running",turnIndex:l,lastSummary:`${i} 正在输出第${l}轮内容`}),d&&p){const g=`🤖 ${i}`,y=[...m.messages].reverse().find($=>$.sender==="ai"&&$.text.startsWith(g));y?y.text+=p:Q("ai",`${g}
${p}`)}}if(t==="workflow/step"){const i=O(r.session_id)??a.sessionId,s=O(r.name)??"step",l=O(r.status)??"unknown",p=O(r.kind)??"workflow";i&&X(i,{status:"running",lastSummary:`workflow ${p}/${s}: ${l}`})}if(t==="workflow/complete"){const i=O(r.session_id)??a.sessionId,s=O(r.status)??"completed",l=N(r.steps_total),p=N(r.steps_error);i&&X(i,{status:s==="completed"?"running":"error",lastSummary:l!==void 0?`workflow结束：${s}，步骤 ${l}，失败 ${p??0}`:`workflow结束：${s}`})}}function mo(e){return e.split(/[\n,]+/).map(t=>t.trim()).filter(t=>t.length>0)}function xo(e,t){const r=e.trim();if(!r)return null;try{return JSON.parse(r)}catch{throw new Error(`算子 ${t} 的 config 不是合法 JSON`)}}function vo(){return a.globalApis[a.activeGlobalApiIndex]??a.globalApis[0]}function ko(){const e=vo();if(!e)return L("[guide] buildGuideParticipantsFromGlobal: no active global API config"),[];const t=e.provider,r=e.modelId.trim(),o=e.endpoint.trim()||(t==="openai_compatible"?a.openaiCompatibleEndpoint.trim():t==="anthropic"?a.anthropicCompatibleEndpoint.trim():""),n=e.apiKey.trim()||a.apiKeys[t].trim();return r?(L(`[guide] buildGuideParticipantsFromGlobal: provider=${t}, model=${r}, endpoint=${o||"(default)"}, hasKey=${n.length>0}`),[{participant_id:"guide-proposer-1",role:"proposer",provider:t,model_id:r,endpoint:o||void 0,api_key:n||void 0}]):(L(`[guide] buildGuideParticipantsFromGlobal: no modelId for provider=${t}`),[])}async function Yt(){var e;try{const t=await ge("orchestrator_status");a.orchestratorRunning=!!((e=t.data)!=null&&e.running),!a.orchestratorRunning&&a.runStatus==="running"&&(a.runStatus="stopped")}catch(t){a.orchestratorRunning=!1,L(`orchestrator_status failed: ${F(t)}`)}}async function wo(){a.runStatus="starting";try{const e=await ge("start_orchestrator");return a.orchestratorRunning=e.success,a.runStatus=e.success?"running":"error",L(`start_orchestrator: ${Vt(e.data)}`),e.success?{ok:!0,message:"引擎启动成功"}:{ok:!1,message:`引擎启动失败${e.error?`：${e.error}`:""}`}}catch(e){a.orchestratorRunning=!1,a.runStatus="error";const t=`引擎启动失败：${F(e)}`;return L(`start_orchestrator failed: ${F(e)}`),{ok:!1,message:t}}}async function le(e,t){if(!a.orchestratorRunning)throw new Error("orchestrator not running");const r=await ge("send_rpc",{method:e,params:t??null});return bo(e,r),L(`rpc ${e} -> ${Vt(r)}`),r}async function yo(){try{return await le("config/setKeys",{openai:a.apiKeys.openai,openai_compatible:a.apiKeys.openai_compatible,anthropic:a.apiKeys.anthropic,google:a.apiKeys.google,deepseek:a.apiKeys.deepseek}),{ok:!0,message:"API Keys 已同步"}}catch(e){const t=`同步 Keys 失败：${F(e)}`;return L(`config/setKeys failed: ${F(e)}`),{ok:!1,message:t}}}async function qe(){const e=W();if(!e)return{ok:!1,message:"请先新建办公室"};try{const t=mo(a.review.categoriesText),r=e.objective.trim(),o=a.operators.filter(p=>p.name.trim().length>0).map(p=>({name:p.name.trim(),enabled:p.enabled,config:xo(p.configText,p.name.trim())})),n=e.members.filter(p=>p.enabled).map(p=>{var d,g;return{participant_id:p.participantId,role:p.role,provider:p.provider,model_id:p.modelId,endpoint:((d=p.endpoint)==null?void 0:d.trim())||void 0,api_key:((g=p.apiKey)==null?void 0:g.trim())||void 0}});if(!r)throw new Error("请先填写办公室目标");if(!Number.isFinite(e.maxRounds)||e.maxRounds<1||e.maxRounds>20)throw new Error("轮次需要在 1 到 20 之间");if(n.some(p=>!p.model_id.trim()))throw new Error("启用成员必须填写模型 ID");if(n.length<2)throw new Error("至少启用两个 AI 成员，才能开始讨论");if(t.length===0)throw new Error("review categories 不能为空");if(o.filter(p=>p.enabled).length===0)throw new Error("operators 至少需要启用一个");V(e.officeId,{status:"starting",turnIndex:0,lastSummary:"办公室会议启动中..."});const s=await le("session/start",{task:r,participants:n,policy:{stop:{max_rounds:e.maxRounds}},review:{enabled:a.review.enabled,language:a.review.language,min_severity:a.review.minSeverity,max_findings:a.review.maxFindings,require_evidence:a.review.requireEvidence,categories:t},operators:{chain:o}}),l=typeof s.session_id=="string"?s.session_id:"";return l?(Se(l,e.officeId),V(e.officeId,{sessionId:l,status:"running"}),a.sessionId=l,{ok:!0,message:`办公室已启动：${l}`,sessionId:l}):(V(e.officeId,{status:"running",lastSummary:"已发起 session/start，等待会话 ID 回传"}),{ok:!0,message:"已发起办公室讨论"})}catch(t){const r=F(t);return L(`startOfficeDebate failed: ${r}`),V(e.officeId,{status:"error",lastSummary:`启动失败：${r}`}),a.runStatus="error",{ok:!1,message:`启动失败：${r}`}}}async function Xt(e){const t=e.trim();if(!t)return{ok:!1,message:"请输入消息后再发送"};try{const r={message:t};return a.sessionId!=="-"&&(r.session_id=a.sessionId),await le("chat/send",r),{ok:!0,message:"消息已发送"}}catch(r){const o=F(r);return L(`chat/send failed: ${o}`),{ok:!1,message:`发送失败：${o}`}}}async function $o(){if(a.sessionId==="-")return L("chat/stop skipped: no active session"),{ok:!1,message:"当前没有可停止的会话"};const e=a.sessionId;try{await le("chat/stop",{session_id:e});const t=Lt(e);return t&&V(t.officeId,{status:"stopped",lastSummary:"会话已停止"}),{ok:!0,message:"已发送停止指令"}}catch(t){const r=F(t);return L(`chat/stop failed: ${r}`),{ok:!1,message:`停止失败：${r}`}}}async function Io(e){const t=W();if(!t)return{ok:!1,message:"请先创建办公室"};const r=e.trim();if(!r)return{ok:!1,message:"请先输入 workflow JSON"};let o;try{o=JSON.parse(r)}catch{return{ok:!1,message:"workflow JSON 解析失败"}}const n={...o,session_id:a.sessionId!=="-"?a.sessionId:void 0,continue_chat:typeof o.continue_chat=="boolean"?o.continue_chat:!0,followup_prompt:typeof o.followup_prompt=="string"?o.followup_prompt:"我已经执行了落地步骤，请基于结果继续推进 coding，并给出下一步可执行改动。"};try{const i=await le("workflow/execute",n),s=typeof i.session_id=="string"?i.session_id:"";s&&(Se(s,t.officeId),V(t.officeId,{sessionId:s,status:"running",lastSummary:"工作流已执行，已回灌到会话"}),a.sessionId=s);const l=Number(i.steps_total??0),p=Number(i.steps_error??0);return{ok:!0,message:p>0?`工作流执行完成：${l} 步，失败 ${p}`:`工作流执行完成：${l} 步`,sessionId:s||void 0}}catch(i){const s=F(i);return L(`workflow/execute failed: ${s}`),{ok:!1,message:`workflow 执行失败：${s}`}}}async function So(e){if(!a.orchestratorRunning)return{ok:!1,message:"引擎尚未启动，请先在顶部点击「启动引擎」"};const t=e.trim();if(!t)return{ok:!1,message:"请输入消息后再发送"};try{const r=W(),o={message:t};if(r){const p=r.members.filter(d=>d.enabled).map(d=>{var g,y;return{participant_id:d.participantId,role:d.role,provider:d.provider,model_id:d.modelId,endpoint:((g=d.endpoint)==null?void 0:g.trim())||void 0,api_key:((y=d.apiKey)==null?void 0:y.trim())||void 0}});p.length>0&&(o.participants=p)}else{const p=ko();p.length>0&&(o.participants=p)}m.sessionId&&(o.session_id=m.sessionId);const n=await le("chat/send",o),i=typeof n.session_id=="string"?n.session_id:"";i&&!m.sessionId&&(m.sessionId=i);const l=(Array.isArray(n.outputs)?n.outputs:[]).map(p=>{const d=p,g=typeof d.participant_id=="string"?d.participant_id:"",y=typeof d.status=="string"?d.status:"unknown",$=typeof d.content=="string"?d.content:"",b=typeof d.latency_ms=="number"?d.latency_ms:void 0,A=d.error&&typeof d.error=="object"?d.error:void 0,I=A&&typeof A.code=="string"?A.code:void 0,T=A&&typeof A.message=="string"?A.message:void 0;if(g)return{participantId:g,status:y,content:$,latencyMs:b,errorCode:I,errorMessage:T}}).filter(p=>!!p);return{ok:!0,message:"消息已发送",sessionId:i||void 0,outputs:l}}catch(r){const o=F(r);return L(`sendGuideChat failed: ${o}`),{ok:!1,message:`发送失败：${o}`}}}function Ao(e){return/^\[[^\]]+ thinking\.\.\.\]\s*$/.test(e.trim())}function zo(e){const t=m.messages.findIndex(o=>o.id===e);return(t>=0?m.messages.slice(t+1):m.messages).some(o=>{if(o.sender!=="ai"||o.text.includes("⚠️ 本轮回复失败"))return!1;const[,...n]=o.text.split(`
`),i=n.join(`
`).trim();return i.length>0&&!Ao(i)})}function Eo(e,t){var o,n;if(!(e.length===0||zo(t)))for(const i of e){const s=`🤖 ${i.participantId}`;if(i.status==="success"&&i.content.trim())Q("ai",`${s}
${i.content}`);else{const l=(o=i.errorMessage)==null?void 0:o.trim(),p=(n=i.errorCode)==null?void 0:n.trim(),d=l&&p?`${p}: ${l}`:l||p||i.status;Q("ai",`${s}
⚠️ 本轮回复失败（${d}）`)}}}const v=document.querySelector("#app");if(!v)throw new Error("#app not found");const G=["openai","openai_compatible","anthropic","google","deepseek"],U={openai:"OpenAI",openai_compatible:"OpenAI Compatible",anthropic:"Anthropic",google:"Google",deepseek:"DeepSeek"},Qe=[{id:"openrouter",label:"OpenRouter",endpoint:"https://openrouter.ai/api/v1/chat/completions"},{id:"groq",label:"Groq",endpoint:"https://api.groq.com/openai/v1/chat/completions"},{id:"siliconflow",label:"SiliconFlow",endpoint:"https://api.siliconflow.cn/v1/chat/completions"},{id:"together",label:"Together AI",endpoint:"https://api.together.xyz/v1/chat/completions"},{id:"deepinfra",label:"DeepInfra",endpoint:"https://api.deepinfra.com/v1/openai/chat/completions"},{id:"fireworks",label:"Fireworks AI",endpoint:"https://api.fireworks.ai/inference/v1/chat/completions"},{id:"volcengine-ark",label:"Volcengine Ark",endpoint:"https://ark.cn-beijing.volces.com/api/v3/chat/completions"},{id:"dashscope-compatible",label:"DashScope Compatible",endpoint:"https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"},{id:"rightcode-openai",label:"RightCode (OpenAI)",endpoint:"https://right.codes/codex/v1/chat/completions"},{id:"custom",label:"自定义",endpoint:""}],Ue=[{id:"anthropic-official",label:"Anthropic 官方",endpoint:"https://api.anthropic.com"},{id:"aws-bedrock-anthropic",label:"AWS Bedrock (Anthropic)",endpoint:"https://bedrock-runtime.us-east-1.amazonaws.com"},{id:"rightcode-anthropic",label:"RightCode (Claude)",endpoint:"https://www.right.codes/claude-aws"},{id:"custom",label:"自定义",endpoint:""}],Ye=[{id:"quick",title:"方案 A · 快速对齐",summary:"快速澄清目标并产出最小可执行计划，适合先跑通。",rounds:2,roles:["proposer","critic","synthesizer"]},{id:"balanced",title:"方案 B · 平衡推进",summary:"提案 + 质疑 + 调研 + 整合，给出 2-3 版路线供你敲定。",rounds:3,roles:["proposer","critic","researcher","synthesizer"]},{id:"research",title:"方案 C · 研究优先",summary:"引入验证视角，降低事实风险与返工概率。",rounds:4,roles:["proposer","critic","researcher","verifier","synthesizer"]},{id:"review",title:"方案 D · 决策闭环",summary:"在多方案基础上加入裁决角色，强制收敛到单一结论。",rounds:4,roles:["proposer","critic","researcher","synthesizer","arbiter"]},{id:"strict",title:"方案 E · 深度审查",summary:"全角色办公室，强调证据、验证与最终裁决。",rounds:5,roles:["proposer","critic","researcher","verifier","synthesizer","arbiter"]}],w={open:!1,goal:"",officeName:"",planCount:3,selectedPlanId:"balanced",maxRounds:3,providerStrategy:"recommended",singleProvider:"openai",syncState:"idle",syncMessage:""},ne={side:{initialized:!1,visibleProviders:[],expandedByProvider:{}},flow:{initialized:!1,visibleProviders:[],expandedByProvider:{}}};function er(e,t){return e==="flow"?`flow-key-${t}`:`key-${t}`}function tr(e){return e==="flow"?"flow-openai-compatible-template":"openai-compatible-template"}function Ne(e){return e==="flow"?"flow-openai-compatible-endpoint":"openai-compatible-endpoint"}function rr(e){return e==="flow"?"flow-anthropic-compatible-template":"anthropic-compatible-template"}function Me(e){return e==="flow"?"flow-anthropic-compatible-endpoint":"anthropic-compatible-endpoint"}function or(e){return a.apiKeys[e].trim().length>0||e==="openai_compatible"&&a.openaiCompatibleEndpoint.trim().length>0||e==="anthropic"&&a.anthropicCompatibleEndpoint.trim().length>0}function _o(e){const t=ne[e];if(t.initialized)return;const r=G.filter(o=>or(o));r.length===0&&r.push("openai"),t.visibleProviders=r,t.expandedByProvider=Object.fromEntries(r.map(o=>[o,!0])),t.initialized=!0}function ue(e){_o(e);const t=ne[e];for(const r of G)or(r)&&(t.visibleProviders.includes(r)||(t.visibleProviders.push(r),t.expandedByProvider[r]=!0));t.visibleProviders.length===0&&(t.visibleProviders.push("openai"),t.expandedByProvider.openai=!0)}function Ro(e){ue(e);const t=ne[e];return G.filter(r=>!t.visibleProviders.includes(r))}function nr(e,t){return ue(e),ne[e].expandedByProvider[t]!==!1}function To(e,t){const r=ne[e];r.expandedByProvider[t]=!nr(e,t)}function Co(e,t){const r=ne[e];r.visibleProviders.includes(t)||r.visibleProviders.push(t),r.expandedByProvider[t]=!0}function Et(e){if(e==="side"||e==="flow")return e}function _t(e){if(!e)return;const t=e;if(G.includes(t))return t}function Oo(e,t){const r=er(e,t);return t==="openai_compatible"?`
      <label class="field"><span>OpenAI Compatible Key</span><input id="${r}" type="password" value="${h(a.apiKeys.openai_compatible)}" /></label>
      <label class="field"><span>OpenAI Compatible 模板</span><select id="${tr(e)}">${Do(a.openaiCompatibleEndpoint)}</select></label>
      <label class="field"><span>OpenAI Compatible Base URL</span><input id="${Ne(e)}" value="${h(a.openaiCompatibleEndpoint)}" placeholder="例如：https://api.groq.com/openai/v1 或 .../v1/chat/completions" /></label>
    `:t==="anthropic"?`
      <label class="field"><span>Anthropic Key</span><input id="${r}" type="password" value="${h(a.apiKeys.anthropic)}" /></label>
      <label class="field"><span>Anthropic Compatible 模板</span><select id="${rr(e)}">${Go(a.anthropicCompatibleEndpoint)}</select></label>
      <label class="field"><span>Anthropic Compatible Base URL</span><input id="${Me(e)}" value="${h(a.anthropicCompatibleEndpoint)}" placeholder="例如：https://api.anthropic.com" /></label>
    `:t==="openai"?`<label class="field"><span>OpenAI Key</span><input id="${r}" type="password" value="${h(a.apiKeys.openai)}" /></label>`:t==="google"?`<label class="field"><span>Google Key</span><input id="${r}" type="password" value="${h(a.apiKeys.google)}" /></label>`:`<label class="field"><span>DeepSeek Key</span><input id="${r}" type="password" value="${h(a.apiKeys.deepseek)}" /></label>`}function ir(e){ue(e);const t=ne[e],r=Ro(e),o=e,n=t.visibleProviders.map(s=>{const l=nr(e,s);return`
        <div class="provider-card">
          <button
            class="provider-card-head"
            data-api-provider-toggle="1"
            data-api-scope="${e}"
            data-api-provider="${s}"
          >
            <span>${h(U[s])}</span>
            <span>${l?"▾":"▸"}</span>
          </button>
          ${l?`<div class="provider-card-body">${Oo(e,s)}</div>`:""}
        </div>
      `}).join(""),i=r.map(s=>`<option value="${s}">${h(U[s])}</option>`).join("");return`
    <div class="provider-manager">
      <div class="provider-toolbar">
        <span class="provider-toolbar-label">API 提供商</span>
        ${r.length>0?`
            <div class="provider-add-row">
              <select id="${o}-add-provider-select">${i}</select>
              <button id="${o}-add-provider-btn" data-api-provider-add="1" data-api-scope="${e}">＋</button>
            </div>
          `:'<span class="muted">已添加全部可选提供商</span>'}
      </div>
      <div class="provider-card-list">${n}</div>
    </div>
  `}function te(e){return a.officeSnapshots[e]??{officeId:e,status:"idle",sessionId:"-",turnIndex:0,agreementScore:0,totalTokens:0,totalCost:0,lastSummary:"暂无会议结论",lastUpdatedAt:new Date().toISOString()}}function Xe(e){return{idle:"空闲",starting:"启动中",running:"运行中",completed:"已完成",stopped:"已停止",error:"异常"}[e]??e}function Po(e){return{proposer:"提方案，推进第一版。",critic:"找风险，提反例和改进。",synthesizer:"整合观点，形成折中方案。",arbiter:"做裁决，给最终结论。",researcher:"补事实和证据。",verifier:"做验证，控一致性。"}[e.role]??"参与协作"}function Lo(e){const t=Array.from(new Set(e.members.filter(r=>r.enabled).map(r=>r.provider)));return t.length>0?t.join(" / "):"未启用模型"}function qo(e){const t=e.members.find(r=>r.enabled&&(r.role==="arbiter"||r.role==="synthesizer"));return t?`${t.participantId}`:"未设置"}function S(e,t="info"){const r=mr(t,e);x(),window.setTimeout(()=>{xr(r),x()},3500)}function ae(e){return Number.isFinite(e)?Math.max(1,Math.min(20,Math.trunc(e))):3}function No(e){return["proposer","critic","synthesizer","arbiter","researcher","verifier"].map(r=>`<option value="${r}" ${r===e?"selected":""}>${h(r)}</option>`).join("")}function Mo(e){return G.map(t=>`<option value="${t}" ${t===e?"selected":""}>${h(U[t])}</option>`).join("")}function Rt(e){return e.trim().replace(/\/+$/,"").toLowerCase()}function Ko(e){const t=Rt(e);if(!t)return"custom";for(const r of Qe)if(r.endpoint&&Rt(r.endpoint)===t)return r.id;return"custom"}function Do(e){const t=Ko(e);return Qe.map(r=>`<option value="${r.id}" ${r.id===t?"selected":""}>${h(r.label)}</option>`).join("")}function jo(e){const t=Qe.find(r=>r.id===e);!t||!t.endpoint||(a.openaiCompatibleEndpoint=t.endpoint)}function Tt(e){return e.trim().replace(/\/+$/,"").toLowerCase()}function Bo(e){const t=Tt(e);if(!t)return"custom";for(const r of Ue)if(r.endpoint&&Tt(r.endpoint)===t)return r.id;return"custom"}function Go(e){const t=Bo(e);return Ue.map(r=>`<option value="${r.id}" ${r.id===t?"selected":""}>${h(r.label)}</option>`).join("")}function Wo(e){const t=Ue.find(r=>r.id===e);!t||!t.endpoint||(a.anthropicCompatibleEndpoint=t.endpoint)}function se(e){return a.apiKeys[e].trim().length>0}function et(){return a.globalApis[a.activeGlobalApiIndex]??a.globalApis[0]}function Fo(){const e=et();if(!e)return!1;const t=e.modelId.trim().length>0,r=e.apiKey.trim().length>0||se(e.provider);return t&&r}function tt(){for(const e of a.globalApis){const t=e.apiKey.trim();t&&(a.apiKeys[e.provider]=t);const r=e.endpoint.trim();e.provider==="openai_compatible"&&r&&(a.openaiCompatibleEndpoint=r),e.provider==="anthropic"&&r&&(a.anthropicCompatibleEndpoint=r)}}function Ee(){const e=G.filter(t=>se(t));for(const t of a.globalApis){const r=t.modelId.trim().length>0,o=t.apiKey.trim().length>0||se(t.provider);r&&o&&!e.includes(t.provider)&&e.push(t.provider)}return e}function $e(){return Ee().length>0}function ar(){const e=a.offices.length+1;return e>=1&&e<=26?`办公室 ${String.fromCharCode(64+e)}`:`办公室 ${e}`}function rt(){const e=Math.max(2,Math.min(5,w.planCount));return Ye.slice(0,e)}function sr(){const e=rt();return e.find(r=>r.id===w.selectedPlanId)??e[0]??Ye[0]}function Ke(e){return{openai:"gpt-4.1",openai_compatible:"gpt-4o-mini",anthropic:"claude-3-5-sonnet",google:"gemini-1.5-pro",deepseek:"deepseek-chat"}[e]}function lr(e,t,r){const o={proposer:["openai","openai_compatible","deepseek","anthropic","google"],critic:["anthropic","openai","openai_compatible","google","deepseek"],synthesizer:["openai","openai_compatible","anthropic","google","deepseek"],arbiter:["anthropic","openai","openai_compatible","google","deepseek"],researcher:["google","deepseek","openai_compatible","openai","anthropic"],verifier:["google","openai","openai_compatible","anthropic","deepseek"]};for(const n of o[e])if(t.includes(n))return n;return t.length>0?t[0]:r}function dr(e){const t=sr(),r=Ee(),o=w.singleProvider;return t.roles.map((n,i)=>{const s=w.providerStrategy==="single-provider"?w.singleProvider:lr(n,r,o);return{participantId:`${e}-${n}-${i+1}`,provider:s,modelId:Ke(s),endpoint:s==="openai_compatible"?a.openaiCompatibleEndpoint.trim():s==="anthropic"?a.anthropicCompatibleEndpoint.trim():"",role:n,enabled:!0}})}function Ho(){return dr("preview").map(t=>`
        <div class="flow-preview-row">
          <span class="flow-preview-role">${h(t.role)}</span>
          <span class="flow-preview-provider">${h(U[t.provider])}</span>
          <span class="flow-preview-model">${h(t.modelId)}</span>
        </div>
      `).join("")}function Zo(){const t=Ee()[0]??"openai";w.open=!0,w.goal="",w.officeName=ar(),w.planCount=3,w.selectedPlanId="balanced",w.maxRounds=3,w.providerStrategy="recommended",w.singleProvider=t,w.syncState="idle",w.syncMessage=""}function Te(){w.open=!1,w.syncState="idle",w.syncMessage=""}function Jo(e){const t=["proposer","critic","synthesizer"];if(Fo()){const n=et(),i=n.provider,s=n.modelId.trim()||Ke(i),l=n.endpoint.trim()||(i==="openai_compatible"?a.openaiCompatibleEndpoint.trim():i==="anthropic"?a.anthropicCompatibleEndpoint.trim():""),p=n.apiKey.trim();return t.map((d,g)=>({participantId:`${e}-${d}-${g+1}`,provider:i,modelId:s,endpoint:l,apiKey:p,role:d,enabled:!0}))}const r=Ee(),o=r[0]??"openai";return t.map((n,i)=>{const s=lr(n,r,o);return{participantId:`${e}-${n}-${i+1}`,provider:s,modelId:Ke(s),endpoint:s==="openai_compatible"?a.openaiCompatibleEndpoint.trim():s==="anthropic"?a.anthropicCompatibleEndpoint.trim():"",role:n,enabled:!0}})}async function Vo(e,t,r){tt(),qt();const o=W();if(!o)return S("创建办公室失败，请重试","error"),!1;o.officeName=(r==null?void 0:r.trim())||`Workerflow 讨论 ${a.offices.length}`,o.objective=(e==null?void 0:e.trim())||"你是我的 Workerflow 结对搭档。先向我提 3 个澄清问题，再给出一版最小可执行流程。",o.maxRounds=1,o.members=Jo(o.officeId),a.workspaceMode="offices",a.humanDraftByOfficeId[o.officeId]="",P("starting-office"),x();try{const n=await ee();if(!n.ok)return S(n.message,"error"),!1;const i=await qe();if(!i.ok)return S(`办公室已创建，但自动启动失败：${i.message}`,"error"),!1;const s=await Xt((t==null?void 0:t.trim())||"我们现在开始讨论 Workerflow。请先问我 3 个关键问题，然后给出第一步实施建议。");return s.ok?(S("办公室已创建，AI 已开始和你讨论 Workerflow","success"),!0):(S(`办公室已启动，但首条引导消息发送失败：${s.message}`,"error"),!0)}finally{P("none"),x()}}function Qo(){const e=rt();if(!e.some(t=>t.id===w.selectedPlanId)){const t=e[0];t&&(w.selectedPlanId=t.id,w.maxRounds=t.rounds)}}function Ct(e){const t=new Set(e.members.filter(r=>r.enabled).map(r=>r.provider));return Array.from(t).filter(r=>!se(r))}async function ee(){if(tt(),!$e())return{ok:!1,message:"请至少配置一个全局 API Key"};if(!a.orchestratorRunning){const e=await wo();if(await Yt(),!e.ok||!a.orchestratorRunning)return{ok:!1,message:e.message}}return yo()}function Uo(){if(!w.open)return"";const e=rt(),t=sr(),r=$e(),o=w.providerStrategy==="single-provider"&&!se(w.singleProvider),n=w.goal.trim().length>0&&r&&!o&&w.syncState!=="syncing",i=w.syncState==="syncing"?"同步中...":"保存并同步 Keys",s=w.syncState==="success"?"flow-sync-success":w.syncState==="error"?"flow-sync-error":"",l=G.map(d=>{const g=se(d),y=g?"":"（未配置 Key）",$=g?"":"disabled";return`<option value="${d}" ${d===w.singleProvider?"selected":""} ${$}>${h(U[d])}${y}</option>`}).join(""),p=e.map(d=>{const g=d.id===t.id,y=d.roles.join(" · ");return`
        <button class="flow-plan-card ${g?"active":""}" data-flow-plan="${d.id}">
          <div class="flow-plan-title">${h(d.title)}</div>
          <div class="flow-plan-summary">${h(d.summary)}</div>
          <div class="flow-plan-meta">轮次 ${d.rounds} · 角色 ${h(y)}</div>
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
            <textarea id="flow-goal" rows="3" placeholder="例如：先给出 3 套可执行方案，再由我选择继续实现">${h(w.goal)}</textarea>
          </section>

          <section class="flow-section">
            <div class="flow-section-title">2) 选择候选 workflow（2-5 套）</div>
            <label class="field">
              <span>候选方案数量</span>
              <select id="flow-plan-count">
                <option value="2" ${w.planCount===2?"selected":""}>2</option>
                <option value="3" ${w.planCount===3?"selected":""}>3</option>
                <option value="4" ${w.planCount===4?"selected":""}>4</option>
                <option value="5" ${w.planCount===5?"selected":""}>5</option>
              </select>
            </label>
            <div class="flow-plan-grid">${p}</div>
          </section>

          <section class="flow-section">
            <div class="flow-section-title">3) 构建办公室</div>
            <label class="field">
              <span>办公室名称</span>
              <input id="flow-office-name" value="${h(w.officeName)}" placeholder="比如：方案评审办公室" />
            </label>
            <label class="field">
              <span>最大轮次（1~20）</span>
              <input id="flow-max-rounds" type="number" min="1" max="20" value="${w.maxRounds}" />
            </label>
            <label class="field">
              <span>模型分配策略</span>
              <select id="flow-provider-strategy">
                <option value="recommended" ${w.providerStrategy==="recommended"?"selected":""}>推荐分配（按角色自动分工）</option>
                <option value="single-provider" ${w.providerStrategy==="single-provider"?"selected":""}>单一厂商（全部角色同厂商）</option>
              </select>
            </label>

            ${w.providerStrategy==="single-provider"?`
                <label class="field">
                  <span>单一厂商</span>
                  <select id="flow-single-provider">${l}</select>
                </label>
              `:""}

            <div class="flow-preview-box">
              <div class="flow-preview-title">将要创建的成员</div>
              ${Ho()}
            </div>

          </section>

          ${r?"":`
              <section class="flow-section flow-alert">
                <div class="flow-section-title">先配置全局 API Key</div>
                <div class="muted">至少配置一个厂商 Key 后，才能创建并启动办公室。</div>
                ${ir("flow")}
                <button id="btn-flow-sync-keys" ${w.syncState==="syncing"?"disabled":""}>${i}</button>
                ${w.syncMessage?`<div class="flow-sync-msg ${s}">${h(w.syncMessage)}</div>`:""}
              </section>
            `}
        </div>

        <div class="flow-modal-foot">
          <button id="btn-flow-create" ${n?"":"disabled"}>创建办公室并进入讨论</button>
        </div>
      </div>
    </div>
  `}function Yo(){return a.toasts.length===0?"":`
    <div class="toast-stack">
      ${a.toasts.map(e=>`
            <div class="toast toast-${e.kind}">${h(e.message)}</div>
          `).join("")}
    </div>
  `}function Xo(){return`${a.offices.map(r=>{const o=te(r.officeId);return`
        <button class="office-card ${r.officeId===a.activeOfficeId?"active":""}" data-office-id="${r.officeId}">
          <div class="office-title">${h(r.officeName)}</div>
          <div class="office-line">任务：${h(r.objective||"未设置")}</div>
          <div class="office-line">裁决人：${h(qo(r))}</div>
          <div class="office-line">模型：${h(Lo(r))}</div>
          <div class="office-meta">${Xe(o.status)} · 第 ${o.turnIndex} 轮</div>
        </button>
      `}).join("")}
    <button class="office-card add" id="btn-add-office">
      <span class="office-add-icon">＋</span>
      <span class="office-add-title">新建办公室</span>
      <span class="office-add-sub">通过 AI 向导快速创建并开始讨论</span>
    </button>
  `}function Ce(e,t=2){return typeof e!="number"||Number.isNaN(e)?"-":e.toFixed(t)}function Ot(e){return typeof e!="number"||Number.isNaN(e)?"0":String(Math.trunc(e))}function en(e){return typeof e!="number"||Number.isNaN(e)?0:e>1?Math.max(0,Math.min(1,e/100)):Math.max(0,Math.min(1,e))}function tn(){const e=a.offices.map(s=>{const l=te(s.officeId),p=en(l.agreementScore);return`
        <tr>
          <td>${h(s.officeName)}</td>
          <td><span class="status-badge status-${l.status}">${Xe(l.status)}</span></td>
          <td>${h(l.sessionId)}</td>
          <td>${l.turnIndex}</td>
          <td>${Ce(p*100,1)}%</td>
          <td>${Ot(l.totalTokens)}</td>
          <td>$${Ce(l.totalCost,4)}</td>
          <td class="summary-cell">${h(l.lastSummary)}</td>
        </tr>
      `}).join(""),t=Object.values(a.officeSnapshots).reduce((s,l)=>s+(l.totalTokens||0),0),r=Object.values(a.officeSnapshots).reduce((s,l)=>s+(l.totalCost||0),0),o=Object.values(a.officeSnapshots).filter(s=>s.status==="running").length,n=a.participants.length>0?a.participants.map(s=>`
          <tr>
            <td>${h(s.participantId)}</td>
            <td>${h(s.role)}</td>
            <td>${h(s.provider)} / ${h(s.modelId)}</td>
            <td><span class="status-badge status-${s.status==="done"?"completed":s.status==="pending"?"idle":"running"}">${h(s.status)}</span></td>
            <td>${s.latencyMs!==void 0?`${s.latencyMs}ms`:"-"}</td>
          </tr>
        `).join(""):'<tr><td colspan="5" class="muted">暂无参与者数据</td></tr>',i=a.logs.slice(0,50).map(s=>`<div class="log-line">${h(s)}</div>`).join("");return`
    <div class="dashboard-view">
      <h2 class="view-title">Dashboard</h2>
      <p class="view-desc">全局概览：所有办公室状态、参与者、系统日志</p>

      <div class="dash-summary-grid">
        <div class="dash-card">
          <div class="dash-card-label">办公室总数</div>
          <div class="dash-card-value">${a.offices.length}</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-label">运行中</div>
          <div class="dash-card-value">${o}</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-label">总 Tokens</div>
          <div class="dash-card-value">${Ot(t)}</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-label">总花费</div>
          <div class="dash-card-value">$${Ce(r,4)}</div>
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
            <tbody>${n}</tbody>
          </table>
        </div>
      </div>

      <div class="dash-section">
        <h3>系统日志 <span class="muted">(最近 50 条)</span></h3>
        <div class="log-box">${i||'<div class="muted">暂无日志</div>'}</div>
      </div>
    </div>
  `}function rn(){const e=a.notifications.length>0?a.notifications.slice(0,100).map(r=>`
          <div class="sub-event-item">
            <div class="sub-event-head">
              <span class="sub-event-method">${h(r.method)}</span>
              <span class="sub-event-time">${h(r.time)}</span>
            </div>
            <pre class="sub-event-body">${h(typeof r.payload=="string"?r.payload:JSON.stringify(r.payload,null,2))}</pre>
          </div>
        `).join(""):'<div class="muted">暂无事件通知。启动办公室讨论后，这里会实时显示引擎推送的事件流。</div>',t=a.chunks.length>0?a.chunks.slice(0,80).map(r=>`
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
        <button class="sub-tab ${a._subTab!=="chunks"?"active":""}" data-sub-tab="notifications">事件通知 (${a.notifications.length})</button>
        <button class="sub-tab ${a._subTab==="chunks"?"active":""}" data-sub-tab="chunks">消息流 (${a.chunks.length})</button>
      </div>

      <div class="sub-content">
        ${a._subTab==="chunks"?t:e}
      </div>
    </div>
  `}function on(e,t){const r=t===a.activeGlobalApiIndex,o=G.map(n=>`<option value="${n}" ${e.provider===n?"selected":""}>${h(U[n])}</option>`).join("");return`
    <div class="dash-section global-api-card ${r?"global-api-card-active":""}" data-global-api-index="${t}">
      <div class="global-api-card-header">
        <label class="field" style="flex:1;margin-bottom:0">
          <span>名称</span>
          <input class="global-api-name" data-index="${t}" value="${h(e.name)}" placeholder="接口名称" />
        </label>
        <div class="global-api-card-actions">
          ${r?'<span class="badge badge-active">当前使用</span>':`<button class="btn-sm global-api-activate" data-index="${t}">设为当前</button>`}
          <button class="btn-sm btn-danger global-api-remove" data-index="${t}" ${a.globalApis.length<=1?"disabled":""}>删除</button>
        </div>
      </div>
      <label class="field">
        <span>Provider</span>
        <select class="global-api-provider" data-index="${t}">${o}</select>
      </label>
      <label class="field">
        <span>Model ID</span>
        <input class="global-api-model" data-index="${t}" value="${h(e.modelId)}" placeholder="例如：gpt-4.1" />
      </label>
      <label class="field">
        <span>Endpoint（可选）</span>
        <input class="global-api-endpoint" data-index="${t}" value="${h(e.endpoint)}" placeholder="例如：https://api.openai.com/v1 或 .../v1/chat/completions" />
      </label>
      <label class="field">
        <span>API Key（可选）</span>
        <input class="global-api-key" data-index="${t}" value="${h(e.apiKey)}" placeholder="sk-..." />
      </label>
    </div>
  `}function nn(){return`
    <div class="subscription-view">
      <h2 class="view-title">设置</h2>
      <p class="view-desc">全局 API 接口配置：可配置多个接口，统一维护并导入到办公室成员</p>

      <div class="global-api-list">
        ${a.globalApis.map((t,r)=>on(t,r)).join("")}
      </div>

      <div class="actions" style="margin-bottom:16px">
        <button id="btn-settings-add-global">＋ 添加接口</button>
      </div>

      <div class="dash-section">
        <h3>JSON 导入</h3>
        <label class="field">
          <span>粘贴 JSON（单个或数组）</span>
          <textarea id="settings-global-import" rows="6" placeholder='{"name":"我的接口","provider":"openai","modelId":"gpt-4.1","endpoint":"","apiKey":""}&#10;或 [{"name":"接口1",...},{"name":"接口2",...}]'>${h(a.globalApiImportText)}</textarea>
        </label>
        <div class="actions">
          <button id="btn-settings-import-global">从 JSON 导入</button>
          <button id="btn-settings-apply-global-office">导入当前接口到办公室成员</button>
          <button id="btn-settings-sync-global">同步全局 Keys 到引擎</button>
        </div>
      </div>
    </div>
  `}function an(){if(!m.open)return"";const e=m.messages.map(i=>{const s=i.sender==="ai"?"guide-msg-ai":i.sender==="user"?"guide-msg-user":"guide-msg-system",l=i.sender==="ai"?"🤖":i.sender==="user"?"👤":"⚙️",p=i.sender==="ai"?"AI":i.sender==="user"?"你":"系统",d=i.sender==="ai"?`<div class="guide-msg-text md-body">${Ve(i.text)}</div>`:`<div class="guide-msg-text">${h(i.text)}</div>`;return`
        <div class="guide-msg ${s}">
          <div class="guide-msg-role">${l} ${h(p)}</div>
          ${d}
        </div>
      `}).join(""),t=m.aiThinking?`<div class="guide-msg guide-msg-ai guide-thinking">
        <div class="guide-msg-role">🤖 AI</div>
        <div class="guide-msg-text">
          <div class="thinking-indicator">
            <div class="thinking-dots">
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
            </div>
            <span class="thinking-label">AI 正在思考...</span>
          </div>
        </div>
      </div>`:"",r=m.userInput.trim().length>0&&!m.aiThinking&&!m.creating,o=m.aiThinking?"AI 思考中...":"继续讨论",n=m.creating?"创建中...":"按这个想法创建办公室";return`
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
          <div class="guide-thread">${e}${t}</div>

          <label class="field">
            <span>你的想法</span>
            <textarea id="guide-input" rows="3" placeholder="例如：我想先梳理需求，再评估技术方案和排期">${h(m.userInput)}</textarea>
          </label>
        </div>

        <div class="flow-modal-foot">
          <button id="btn-guide-send" ${r?"":"disabled"}>${o}</button>
          <button id="btn-guide-create" ${m.creating?"disabled":""}>${n}</button>
        </div>
      </div>
    </div>
  `}function sn(e){return{offices:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',dashboard:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',subscription:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',settings:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',creation:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',review:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'}[e]??""}function ln(e){return{offices:"蜂群办公室",dashboard:"数据看板",subscription:"事件订阅",settings:"系统设置",creation:"创作",review:"审查"}[e]??e}const dn=["offices","dashboard","subscription","settings"];function cn(){switch(a.workspaceMode){case"dashboard":return tn();case"subscription":return rn();case"settings":return nn();case"offices":default:return`<div class="grid">${Xo()}</div>`}}function pn(){const e=W();if(!e)return`
      <div class="right-title">暂无办公室</div>
      <div class="right-sub">请先在中间区域点击“新建办公室”，再开始配置与讨论。</div>
      <div class="discussion-box">
        <div class="muted">当前还没有可编辑的办公室。创建后将显示目标、成员、会话和人类参与输入。</div>
      </div>
    `;const t=te(e.officeId),r=a.humanDraftByOfficeId[e.officeId]??"",o=a.busyAction,n=t.sessionId!=="-",i=o!=="none",s=t.status==="running"||t.status==="starting",l=e.objective.trim().length>0,p=!i&&!s&&l,d=!i&&n&&s,g=!i&&n,y=!i&&n,$=o==="syncing-keys"?"同步中...":"同步 Keys",b=o==="starting-office"?"启动中...":"启动该办公室讨论",A=o==="stopping-office"?"停止中...":"停止",I=o==="sending-human"?"发送中...":"发送到该办公室",T=o==="executing-workflow"?"执行中...":"执行落地脚本",K=a.humanDraftByOfficeId[`workflow:${e.officeId}`]??`{
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
}`,H=e.members.map((C,q)=>`
        <div class="member-editor-row" data-member-row="${q}">
          <label class="check">
            <input type="checkbox" data-member-enabled="${q}" ${C.enabled?"checked":""} />
            启用
          </label>
          <input data-member-id="${q}" value="${h(C.participantId)}" placeholder="participant_id" />
          <select data-member-role="${q}">${No(C.role)}</select>
          <select data-member-provider="${q}">${Mo(C.provider)}</select>
          <input data-member-model="${q}" value="${h(C.modelId)}" placeholder="model_id" />
          <input data-member-endpoint="${q}" value="${h(C.endpoint??"")}" placeholder="endpoint（仅 OpenAI Compatible）" />
        </div>
      `).join(""),J=t.sessionId!=="-"?a.chunks.filter(C=>C.sessionId===t.sessionId).slice(0,80).reverse():[],Y=J.length===0?'<div class="muted">启动办公室后，这里会显示讨论消息流，你也可以作为人类参与发言。</div>':J.map(C=>`
              <div class="message-item">
                <div class="message-head">${h(C.participantId)} · 第${C.turnIndex}轮</div>
                <div class="message-body md-body">${Ve(C.delta)}</div>
              </div>
            `).join(""),ie=e.members.map(C=>`
        <div class="member-row">
          <b>${h(C.participantId)}</b>
          <span>${h(C.role)} · ${h(C.modelId)}</span>
          <p>${h(Po(C))}</p>
        </div>
      `).join("");return`
    <div class="right-title">${h(e.officeName)}</div>
    <div class="right-sub">状态：${Xe(t.status)}｜session：${h(t.sessionId)}</div>

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
      ${H}
    </div>

    <div id="discussion-stream" class="discussion-box">${Y}</div>

    <label class="field">
      <span>人类参与输入</span>
      <textarea id="human-input" rows="3" placeholder="给这个办公室补充方向、约束或反馈">${h(r)}</textarea>
    </label>

    <label class="field">
      <span>落地 Workflow（JSON）</span>
      <textarea id="workflow-script" rows="10" placeholder='{"steps":[{"kind":"command","name":"run","command":"npm test"}] }'>${h(K)}</textarea>
    </label>

    <div class="actions">
      <button id="btn-send-human" ${g?"":"disabled"}>${I}</button>
      <button id="btn-execute-workflow" ${y?"":"disabled"}>${T}</button>
      <button id="btn-start-office" ${p?"":"disabled"}>${b}</button>
      <button id="btn-stop-office" ${d?"":"disabled"}>${A}</button>
    </div>

    <div class="right-divider"></div>

    ${ir("side")}
    <button id="btn-set-keys" ${i?"disabled":""}>${$}</button>

    <div class="right-divider"></div>
    <div class="member-list">${ie}</div>
  `}function fn(){if(a.workspaceMode!=="offices")return;const e=W();if(!e)return;const t=te(e.officeId),r=v.querySelector("#discussion-stream");if(!r)return;const o=t.sessionId!=="-"?a.chunks.filter(n=>n.sessionId===t.sessionId).slice(0,80).reverse():[];r.innerHTML=o.length===0?'<div class="muted">启动办公室后，这里会显示讨论消息流，你也可以作为人类参与发言。</div>':o.map(n=>`
              <div class="message-item">
                <div class="message-head">${h(n.participantId)} · 第${n.turnIndex}轮</div>
                <div class="message-body md-body">${Ve(n.delta)}</div>
              </div>
            `).join("")}let me=null;function un(){me!==null&&clearTimeout(me),me=setTimeout(()=>{Er(),me=null},500)}function x(){un();const e=W(),t=dn.map(o=>`<button class="nav-item ${a.workspaceMode===o?"active":""}" data-nav-mode="${o}">
          <span class="nav-icon">${sn(o)}</span>
          <span class="nav-text">${ln(o)}</span>
        </button>`).join(""),r=a.workspaceMode==="offices";v.innerHTML=`
    <div class="frame">
      <header class="topbar">
        <div class="brand">
          <span class="brand-icon">🫏</span>
          <div class="brand-copy">
            <span class="brand-text">BeBoss</span>
            <span class="brand-sub">AI Workerflow 协作平台</span>
          </div>
        </div>
        <div class="topbar-right">
          <div class="engine-status ${a.orchestratorRunning?"online":"offline"}">
            <span class="engine-dot"></span>
            引擎：${a.orchestratorRunning?"在线":"离线"}
          </div>
        </div>
      </header>

      <div class="body ${r?"":"no-right-panel"}">
        <aside class="left-nav">
          <div class="nav-group">
            ${t}
          </div>
          <div class="nav-bottom">
            <div class="profile">
              <span class="profile-avatar">U</span>
              <div class="profile-copy">
                <span class="profile-name">当前用户</span>
                <span class="profile-role">Workspace Admin</span>
              </div>
            </div>
          </div>
        </aside>

        <main class="center">
          ${cn()}
        </main>

        ${r?`<aside class="right-panel">${pn()}</aside>`:""}
      </div>
    </div>
    ${Uo()}
    ${an()}
    ${Yo()}
  `,gn(e)}function gn(e){var l,p,d,g,y,$,b,A,I,T,K,H,J,Y,ie,C,q,ot,nt,it,at,st,lt,dt,ct,pt,ft,ut,gt,bt,ht,mt;ue("side"),ue("flow"),v.querySelectorAll("[data-nav-mode]").forEach(c=>{c.addEventListener("click",()=>{const u=c.dataset.navMode;u&&u!==a.workspaceMode&&(a.workspaceMode=u,x())})}),v.querySelectorAll("[data-sub-tab]").forEach(c=>{c.addEventListener("click",()=>{const u=c.dataset.subTab;a._subTab=u==="chunks"?"chunks":"notifications",x()})}),v.querySelectorAll("[data-office-id]").forEach(c=>{c.addEventListener("click",()=>{const u=c.dataset.officeId;if(!u)return;vr(u);const f=te(u);a.sessionId=f.sessionId,x()})}),(l=v.querySelector("#btn-add-office"))==null||l.addEventListener("click",async()=>{if(tt(),!$e()){Zo(),S("请先在“设置”里配置全局 API（或先同步 Key）后再一键开聊。","info"),x();return}$r(),x()}),(p=v.querySelector("#btn-guide-cancel"))==null||p.addEventListener("click",()=>{kt(),x()}),(d=v.querySelector("#guide-input"))==null||d.addEventListener("input",c=>{const u=c.currentTarget;m.userInput=u.value;const f=m.userInput.trim().length>0&&!m.aiThinking&&!m.creating,k=v.querySelector("#btn-guide-send");k&&(k.disabled=!f)});const t=async()=>{const c=m.userInput.trim();if(!c)return;const u=Q("user",c);m.userInput="",m.aiThinking=!0,x();try{const f=await ee();if(!f.ok){m.aiThinking=!1,Q("ai",`⚠️ 发送前同步 Key 失败：${f.message}`),x();return}const k=await So(c);k.ok?(k.sessionId&&(m.sessionId=k.sessionId),await new Promise(_=>setTimeout(_,200)),Eo(k.outputs??[],u.id),m.aiThinking=!1,Ir("plan-suggest")):(m.aiThinking=!1,Q("ai",`⚠️ AI 回复失败：${k.message}

请检查：
1. 引擎是否已启动
2. API Key 是否已配置
3. 网络是否正常`))}catch(f){m.aiThinking=!1,Q("ai",`⚠️ 发生错误：${f instanceof Error?f.message:String(f)}`)}x()};(g=v.querySelector("#btn-guide-send"))==null||g.addEventListener("click",()=>{t()}),(y=v.querySelector("#guide-input"))==null||y.addEventListener("keydown",c=>{c.key!=="Enter"||c.shiftKey||c.isComposing||(c.preventDefault(),t())}),($=v.querySelector("#btn-guide-create"))==null||$.addEventListener("click",async()=>{var f;const c=(f=[...m.messages].reverse().find(k=>k.sender==="user"))==null?void 0:f.text,u=(c==null?void 0:c.trim())||"一起讨论 Workerflow 的初步构想并形成执行计划";m.creating=!0,x();try{await Vo(u,`我们开始围绕这个目标讨论：${u}
请先输出 3 个澄清问题，再给出第一步落地建议。`,"Workerflow 共创办公室")&&kt()}finally{m.creating=!1,x()}}),(b=v.querySelector("#btn-flow-cancel"))==null||b.addEventListener("click",()=>{Te(),x()}),v.querySelectorAll(".global-api-name").forEach(c=>{c.addEventListener("input",u=>{const f=u.currentTarget,k=Number(f.dataset.index);a.globalApis[k]&&(a.globalApis[k].name=f.value)})}),v.querySelectorAll(".global-api-provider").forEach(c=>{c.addEventListener("change",u=>{const f=u.currentTarget,k=Number(f.dataset.index),_=f.value;a.globalApis[k]&&G.includes(_)&&(a.globalApis[k].provider=_)})}),v.querySelectorAll(".global-api-model").forEach(c=>{c.addEventListener("input",u=>{const f=u.currentTarget,k=Number(f.dataset.index);a.globalApis[k]&&(a.globalApis[k].modelId=f.value)})}),v.querySelectorAll(".global-api-endpoint").forEach(c=>{c.addEventListener("input",u=>{const f=u.currentTarget,k=Number(f.dataset.index);a.globalApis[k]&&(a.globalApis[k].endpoint=f.value)})}),v.querySelectorAll(".global-api-key").forEach(c=>{c.addEventListener("input",u=>{const f=u.currentTarget,k=Number(f.dataset.index);a.globalApis[k]&&(a.globalApis[k].apiKey=f.value)})}),v.querySelectorAll(".global-api-activate").forEach(c=>{c.addEventListener("click",()=>{const u=Number(c.dataset.index);u>=0&&u<a.globalApis.length&&(a.activeGlobalApiIndex=u,S(`已切换到「${a.globalApis[u].name||"接口 "+(u+1)}」`,"success"),x())})}),v.querySelectorAll(".global-api-remove").forEach(c=>{c.addEventListener("click",()=>{const u=Number(c.dataset.index);if(a.globalApis.length<=1){S("至少保留一个接口配置","error");return}a.globalApis.splice(u,1),a.activeGlobalApiIndex>=a.globalApis.length?a.activeGlobalApiIndex=a.globalApis.length-1:a.activeGlobalApiIndex>u&&(a.activeGlobalApiIndex-=1),S("接口已删除","success"),x()})}),(A=v.querySelector("#btn-settings-add-global"))==null||A.addEventListener("click",()=>{const c=a.globalApis.length+1;a.globalApis.push({name:`接口 ${c}`,provider:"openai",modelId:"",endpoint:"",apiKey:""}),S("已添加新接口配置","success"),x()}),(I=v.querySelector("#settings-global-import"))==null||I.addEventListener("input",c=>{const u=c.currentTarget;a.globalApiImportText=u.value}),(T=v.querySelector("#btn-settings-import-global"))==null||T.addEventListener("click",()=>{const c=a.globalApiImportText.trim();if(!c){S("请先粘贴 JSON","error");return}try{const u=JSON.parse(c),f=Array.isArray(u)?u:[u];let k=0;for(const _ of f){const D=_.provider&&G.includes(_.provider)?_.provider:"openai",cr={name:typeof _.name=="string"?_.name:`导入接口 ${a.globalApis.length+1}`,provider:D,modelId:typeof _.modelId=="string"?_.modelId:"",endpoint:typeof _.endpoint=="string"?_.endpoint:"",apiKey:typeof _.apiKey=="string"?_.apiKey:""};a.globalApis.push(cr),k+=1}S(`已导入 ${k} 个接口配置`,"success"),x()}catch{S("JSON 解析失败","error")}}),(K=v.querySelector("#btn-settings-apply-global-office"))==null||K.addEventListener("click",()=>{const c=W();if(!c){S("当前没有可导入的办公室","error");return}const u=et();if(!u){S("没有可用的全局接口配置","error");return}const f=u.modelId.trim();if(!f){S("请先填写当前接口的 Model ID","error");return}const k=u.endpoint.trim(),_=u.apiKey.trim();c.members.forEach(D=>{D.provider=u.provider,D.modelId=f,D.endpoint=k,D.apiKey=_}),_&&(a.apiKeys[u.provider]=_),S(`已将「${u.name}」导入到当前办公室成员`,"success"),x()}),(H=v.querySelector("#btn-settings-sync-global"))==null||H.addEventListener("click",async()=>{for(const c of a.globalApis){const u=c.apiKey.trim();u&&(a.apiKeys[c.provider]=u)}P("syncing-keys"),x();try{const c=await ee();S(c.message,c.ok?"success":"error")}finally{P("none"),x()}}),v.querySelectorAll("[data-api-provider-add]").forEach(c=>{c.addEventListener("click",()=>{const u=Et(c.dataset.apiScope);if(!u)return;const f=v.querySelector(`#${u}-add-provider-select`),k=_t(f==null?void 0:f.value);k&&(Co(u,k),x())})}),v.querySelectorAll("[data-api-provider-toggle]").forEach(c=>{c.addEventListener("click",()=>{const u=Et(c.dataset.apiScope),f=_t(c.dataset.apiProvider);!u||!f||(To(u,f),x())})}),(J=v.querySelector("#flow-goal"))==null||J.addEventListener("input",c=>{const u=c.currentTarget;w.goal=u.value}),(Y=v.querySelector("#flow-office-name"))==null||Y.addEventListener("input",c=>{const u=c.currentTarget;w.officeName=u.value}),(ie=v.querySelector("#flow-max-rounds"))==null||ie.addEventListener("input",c=>{const u=c.currentTarget;w.maxRounds=ae(Number(u.value))}),(C=v.querySelector("#flow-max-rounds"))==null||C.addEventListener("blur",()=>{w.maxRounds=ae(w.maxRounds),x()}),(q=v.querySelector("#flow-plan-count"))==null||q.addEventListener("change",c=>{const u=c.currentTarget;w.planCount=Math.max(2,Math.min(5,Number(u.value)||3)),Qo(),x()}),v.querySelectorAll("[data-flow-plan]").forEach(c=>{c.addEventListener("click",()=>{const u=c.dataset.flowPlan,f=Ye.find(k=>k.id===u);f&&(w.selectedPlanId=f.id,w.maxRounds=ae(f.rounds),x())})}),(ot=v.querySelector("#flow-provider-strategy"))==null||ot.addEventListener("change",c=>{const f=c.currentTarget.value==="single-provider"?"single-provider":"recommended";w.providerStrategy=f,x()}),(nt=v.querySelector("#flow-single-provider"))==null||nt.addEventListener("change",c=>{const f=c.currentTarget.value;G.includes(f)&&(w.singleProvider=f,x())});for(const c of["flow","side"]){const u=["openai","openai_compatible","anthropic","google","deepseek"];for(const f of u){const k=v.querySelector(`#${er(c,f)}`);k==null||k.addEventListener("input",()=>{a.apiKeys[f]=k.value})}(it=v.querySelector(`#${Ne(c)}`))==null||it.addEventListener("input",f=>{const k=f.currentTarget;a.openaiCompatibleEndpoint=k.value}),(at=v.querySelector(`#${Ne(c)}`))==null||at.addEventListener("blur",()=>{a.openaiCompatibleEndpoint=a.openaiCompatibleEndpoint.trim(),x()}),(st=v.querySelector(`#${tr(c)}`))==null||st.addEventListener("change",f=>{const k=f.currentTarget;jo(k.value),x()}),(lt=v.querySelector(`#${Me(c)}`))==null||lt.addEventListener("input",f=>{const k=f.currentTarget;a.anthropicCompatibleEndpoint=k.value}),(dt=v.querySelector(`#${Me(c)}`))==null||dt.addEventListener("blur",()=>{a.anthropicCompatibleEndpoint=a.anthropicCompatibleEndpoint.trim(),x()}),(ct=v.querySelector(`#${rr(c)}`))==null||ct.addEventListener("change",f=>{const k=f.currentTarget;Wo(k.value),x()})}(pt=v.querySelector("#btn-flow-sync-keys"))==null||pt.addEventListener("click",async()=>{w.syncState="syncing",w.syncMessage="正在同步 Key 到引擎...",x();const c=await ee();w.syncState=c.ok?"success":"error",w.syncMessage=c.message,c.ok?S("全局 Keys 已同步","success"):S(c.message,"error"),x()}),(ft=v.querySelector("#btn-flow-create"))==null||ft.addEventListener("click",async()=>{const c=w.goal.trim(),u=w.officeName.trim();if(!c){S("请先输入本次 Workerflow 目标","error");return}if(!$e()){w.syncState="error",w.syncMessage="请先配置并同步至少一个 API Key",x();return}qt();const f=W();if(!f){S("创建办公室失败，请重试","error");return}f.officeName=u||ar(),f.objective=c,f.maxRounds=ae(w.maxRounds),f.members=dr(f.officeId),a.workspaceMode="offices";const k=Ct(f);if(k.length>0){const _=k.map(D=>U[D]).join("、");Te(),S(`办公室已创建，但缺少 ${_} 的 Key，请先补充后再启动`,"error"),x();return}P("syncing-keys"),x();try{const _=await ee();if(!_.ok){S(_.message,"error");return}Te(),P("starting-office"),x();const D=await qe();D.ok?S("办公室已创建并自动开始讨论","success"):S(`办公室已创建，但自动启动失败：${D.message}`,"error")}finally{P("none"),x()}});const r=v.querySelector("#office-name");r==null||r.addEventListener("input",()=>{e&&(e.officeName=r.value,x())});const o=v.querySelector("#office-objective");o==null||o.addEventListener("input",()=>{e&&(e.objective=o.value,x())});const n=v.querySelector("#office-max-rounds");n==null||n.addEventListener("input",()=>{e&&(e.maxRounds=ae(Number(n.value)))}),n==null||n.addEventListener("blur",()=>{e&&(e.maxRounds=ae(Number(n.value)),x())}),v.querySelectorAll("[data-member-enabled]").forEach(c=>{c.addEventListener("change",()=>{const u=Number(c.dataset.memberEnabled);if(!e)return;const f=e.members[u];f&&(f.enabled=c.checked,x())})}),v.querySelectorAll("[data-member-id]").forEach(c=>{c.addEventListener("input",()=>{const u=Number(c.dataset.memberId);if(!e)return;const f=e.members[u];f&&(f.participantId=c.value)}),c.addEventListener("blur",()=>{const u=Number(c.dataset.memberId);if(!e)return;const f=e.members[u];f&&(f.participantId=f.participantId.trim()||`${e.officeId}-member-${u+1}`,x())})}),v.querySelectorAll("[data-member-role]").forEach(c=>{c.addEventListener("change",()=>{const u=Number(c.dataset.memberRole);if(!e)return;const f=e.members[u];f&&(f.role=c.value,x())})}),v.querySelectorAll("[data-member-provider]").forEach(c=>{c.addEventListener("change",()=>{var k,_;const u=Number(c.dataset.memberProvider);if(!e)return;const f=e.members[u];f&&(f.provider=c.value,f.provider==="openai_compatible"?f.endpoint=((k=f.endpoint)==null?void 0:k.trim())||a.openaiCompatibleEndpoint.trim():f.provider==="anthropic"?f.endpoint=((_=f.endpoint)==null?void 0:_.trim())||a.anthropicCompatibleEndpoint.trim():f.endpoint="",x())})}),v.querySelectorAll("[data-member-endpoint]").forEach(c=>{c.addEventListener("input",()=>{const u=Number(c.dataset.memberEndpoint);if(!e)return;const f=e.members[u];f&&(f.endpoint=c.value)}),c.addEventListener("blur",()=>{var k;const u=Number(c.dataset.memberEndpoint);if(!e)return;const f=e.members[u];f&&(f.endpoint=((k=f.endpoint)==null?void 0:k.trim())||"",x())})}),v.querySelectorAll("[data-member-model]").forEach(c=>{c.addEventListener("input",()=>{const u=Number(c.dataset.memberModel);if(!e)return;const f=e.members[u];f&&(f.modelId=c.value)}),c.addEventListener("blur",()=>{const u=Number(c.dataset.memberModel);if(!e)return;const f=e.members[u];f&&(f.modelId=f.modelId.trim(),x())})});const i=v.querySelector("#human-input");i==null||i.addEventListener("input",()=>{e&&(a.humanDraftByOfficeId[e.officeId]=i.value)});const s=v.querySelector("#workflow-script");s==null||s.addEventListener("input",()=>{e&&(a.humanDraftByOfficeId[`workflow:${e.officeId}`]=s.value)}),(ut=v.querySelector("#btn-set-keys"))==null||ut.addEventListener("click",async()=>{P("syncing-keys"),x();try{const c=await ee();S(c.message,c.ok?"success":"error")}finally{P("none"),x()}}),(gt=v.querySelector("#btn-start-office"))==null||gt.addEventListener("click",async()=>{if(!e){S("请先新建办公室","error");return}if(!e.objective.trim()){S("请先填写办公室目标","error");return}const c=Ct(e);if(c.length>0){const u=c.map(f=>U[f]).join("、");S(`缺少 ${u} 的 API Key，请先在右侧同步 Keys`,"error");return}P("starting-office"),x();try{const u=await ee();if(!u.ok){S(u.message,"error");return}const f=await qe();S(f.message,f.ok?"success":"error")}finally{P("none"),x()}}),(bt=v.querySelector("#btn-stop-office"))==null||bt.addEventListener("click",async()=>{P("stopping-office"),x();try{const c=await $o();S(c.message,c.ok?"success":"error")}finally{P("none"),x()}}),(ht=v.querySelector("#btn-send-human"))==null||ht.addEventListener("click",async()=>{if(!e){S("请先新建办公室","error");return}const c=v.querySelector("#human-input"),u=(c==null?void 0:c.value)??"";if(!u.trim())return;const f=te(e.officeId);a.sessionId=f.sessionId,P("sending-human"),x();try{const k=await Xt(u);S(k.message,k.ok?"success":"error"),k.ok&&(a.humanDraftByOfficeId[e.officeId]="",c&&(c.value=""))}finally{P("none"),x()}}),(mt=v.querySelector("#btn-execute-workflow"))==null||mt.addEventListener("click",async()=>{if(!e){S("请先新建办公室","error");return}const c=(s==null?void 0:s.value)??"";if(!c.trim()){S("请先输入 workflow JSON","error");return}const u=te(e.officeId);a.sessionId=u.sessionId,P("executing-workflow"),x();try{const f=await Io(c);S(f.message,f.ok?"success":"error")}finally{P("none"),x()}})}function bn(){if(document.getElementById("donkey-studio-style"))return;const e=document.createElement("style");e.id="donkey-studio-style",e.textContent=`
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
      --shadow-sm: 0 4px 14px rgba(15, 23, 42, 0.06);
      --shadow-md: 0 18px 38px rgba(15, 23, 42, 0.18);
    }
    html, body {
      background: linear-gradient(180deg, #f5f7fb 0%, #f1f4f8 100%);
      color: var(--text);
    }
    #app {
      padding: 14px;
    }
    .frame {
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: var(--panel);
      box-shadow: var(--shadow-sm);
      min-height: calc(100vh - 28px);
    }
    .topbar {
      height: 68px;
      padding: 0 16px;
      border-bottom: 1px solid var(--line);
      background: #ffffff;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
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
      gap: 2px;
      line-height: 1;
    }
    .brand-text {
      font-size: 26px;
      font-weight: 800;
      color: #111827;
      letter-spacing: 0;
    }
    .brand-sub {
      font-size: 11px;
      color: var(--muted);
    }
    .engine-status {
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: #f8fafc;
      color: #475569;
      padding: 6px 11px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 8px;
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
      padding: 12px 10px;
      gap: 10px;
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
      padding: 10px 12px;
      font-size: 14px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 10px;
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
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
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
      font-size: 13px;
      font-weight: 700;
    }
    .profile-role {
      color: var(--muted);
      font-size: 11px;
    }

    .center {
      border-right: 1px solid var(--line);
      background: #f5f7fb;
      padding: 16px;
    }
    .right-panel {
      background: var(--panel-soft);
      padding: 14px;
    }
    .right-title {
      font-size: 24px;
      line-height: 1.2;
      font-weight: 800;
      color: #111827;
      margin-top: 0;
    }
    .right-sub {
      font-size: 12px;
      color: var(--muted);
      margin-top: 4px;
    }

    .grid {
      grid-template-columns: repeat(3, minmax(210px, 1fr));
      gap: 12px;
    }
    .office-card {
      min-height: 156px;
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      padding: 12px;
      gap: 6px;
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
      font-size: 12px;
    }
    .office-meta {
      color: #64748b;
      font-size: 12px;
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
      gap: 6px;
      margin-top: 10px;
    }
    .field span {
      color: #475569;
      font-size: 12px;
      font-weight: 600;
    }
    input, textarea, select {
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      background: #ffffff;
      color: var(--text);
      padding: 8px 10px;
      font-size: 13px;
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
      font-size: 13px;
      font-weight: 600;
      padding: 8px 11px;
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
    .guide-thread,
    .guide-msg,
    .flow-section,
    .flow-plan-card,
    .flow-preview-box,
    .log-box {
      border-color: var(--line);
      background: #ffffff;
    }
    .message-item {
      border-color: var(--line);
      background: #f8fafc;
      border-radius: 8px;
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

    .view-title {
      font-size: 28px;
      color: #111827;
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
    .dash-section {
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 14px;
    }
    .dash-section h3 {
      color: #111827;
      font-size: 14px;
      font-weight: 700;
    }
    .dash-card {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #ffffff;
      box-shadow: none;
      padding: 12px;
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
    .dash-card-value {
      font-size: 22px;
      color: #111827;
    }
    .dash-table-wrap {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #ffffff;
    }
    .dash-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
    }
    .dash-table th,
    .dash-table td {
      border-bottom: 1px solid #e5eaf1;
      padding: 8px 10px;
    }

    .status-idle { background: #edf2f7; color: #475569; }
    .status-starting { background: #fffbeb; color: #b45309; }
    .status-running { background: #ecfdf3; color: #15803d; }
    .status-completed { background: #eff6ff; color: #1d4ed8; }
    .status-stopped { background: #f1f5f9; color: #64748b; }
    .status-error { background: #fef2f2; color: #b91c1c; }

    .sub-tab {
      border-radius: 8px;
      border-color: var(--line-strong);
      background: #ffffff;
      color: #475569;
    }
    .sub-tab.active {
      border-color: #f2c572;
      background: #fffaf0;
      color: #92400e;
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
    }
  `,document.head.appendChild(e)}async function hn(){_r(),bn(),x(),await _e("orchestrator-notification",e=>{if(e.payload.method&&L(`[notify] ${String(e.payload.method)}`),e.payload.method){const t=e.payload.method;if(t==="turn/chunk"||t==="turn/complete"||t==="session/progress"||t==="session/state"||t==="session/participants"||t==="workflow/step"||t==="workflow/complete"){ho(e.payload),t==="turn/chunk"&&a.workspaceMode==="offices"&&!m.open?fn():x();return}}Nt("unknown",e.payload),x()}),await _e("orchestrator-log",e=>{L(`[orchestrator] ${e.payload}`),x()}),await _e("orchestrator-exit",()=>{a.orchestratorRunning=!1,a.runStatus!=="error"&&(a.runStatus="stopped"),L("orchestrator process exited"),x()}),await Yt(),x()}hn();
