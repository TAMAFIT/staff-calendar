var En="tamafit_staff_calendar_local_first_v1:coverage";function Tt(e){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(e||"")))return null;let t=new Date(`${e}T00:00:00Z`);return Number.isNaN(t.getTime())?null:t}function it(e){return e.toISOString().slice(0,10)}function _n(e,t){let n=Tt(e),r=Tt(t);return!n||!r?1/0:Math.round((r.getTime()-n.getTime())/864e5)+1}function An(e,t={}){if(String(t?.method||e?.method||"GET").toUpperCase()!=="GET")return null;let r;try{r=new URL(typeof e=="string"||e instanceof URL?String(e):e?.url||"")}catch{return null}if(r.hostname!=="script.google.com"||r.searchParams.get("action")!=="staffCalendarList")return null;let s=r.searchParams.get("startDate")||"",i=r.searchParams.get("endDate")||"",o=_n(s,i);return!Number.isFinite(o)||o<1||o>70?null:{startDate:s,endDate:i}}function kn(e){let t=String(e||""),n=t.match(/^#\/month\/(\d{4})-(\d{2})/);if(n)return`${n[1]}-${n[2]}-01`;let r=t.match(/^#\/(?:week|day)\/(\d{4}-\d{2}-\d{2})/);return r?r[1]:""}function fe(e){let t=String(e||""),n=t.match(/^#\/month\/(\d{4})-(\d{2})/);if(n){let i=new Date(Date.UTC(Number(n[1]),Number(n[2])-1,1)),o=new Date(Date.UTC(Number(n[1]),Number(n[2]),0));return{startDate:it(i),endDate:it(o)}}let r=t.match(/^#\/week\/(\d{4}-\d{2}-\d{2})/);if(r){let i=Tt(r[1]);if(!i)return null;let o=new Date(i.getTime()-i.getUTCDay()*864e5),a=new Date(o.getTime()+6*864e5);return{startDate:it(o),endDate:it(a)}}let s=t.match(/^#\/day\/(\d{4}-\d{2}-\d{2})/);return s?{startDate:s[1],endDate:s[1]}:null}function xn(e){let t=String(e||""),n=t.match(/^#\/month\/(\d{4})-(\d{2})/);return n?`${Number(n[2])}\u6708`:/^#\/week\//.test(t)?"\u3053\u306E\u9031":/^#\/day\//.test(t)?"\u3053\u306E\u65E5":"\u4E88\u5B9A"}function $n(e,t){let n=fe(t);return!n||!e?.startDate||!e?.endDate?!1:e.startDate<=n.startDate&&e.endDate>=n.endDate}function Tn(e){try{let t=JSON.parse(e?.getItem(En)||"[]");return Array.isArray(t)?t:[]}catch{return[]}}function he(e,t){let n=fe(t);return n?Tn(e).some(r=>r?.startDate<=n.startDate&&r?.endDate>=n.endDate&&Number(r?.fetchedAt||0)>0):!1}function Dn(e){if(e.getElementById("calendarFetchStatusStyles"))return;let t=e.createElement("style");t.id="calendarFetchStatusStyles",t.textContent=`
    .calendar-fetch-status {
      position: fixed;
      z-index: 95;
      opacity: 0;
      pointer-events: none;
      transition: opacity 160ms ease, transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .calendar-fetch-status.is-visible {
      opacity: 1;
    }

    .calendar-fetch-status.is-large {
      top: calc(var(--safe-top, 0px) + 190px);
      left: 50%;
      display: flex;
      width: min(82vw, 370px);
      min-height: 176px;
      align-items: center;
      justify-content: center;
      padding: 24px 22px;
      border: 1px solid rgba(13, 143, 77, 0.16);
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.94);
      color: var(--green-950, #084d2d);
      box-shadow: 0 14px 38px rgba(20, 64, 38, 0.18);
      backdrop-filter: blur(10px);
      flex-direction: column;
      text-align: center;
      transform: translate(-50%, -8px) scale(0.985);
    }

    .calendar-fetch-status.is-large.is-visible {
      transform: translate(-50%, 0) scale(1);
    }

    .calendar-fetch-status.is-compact {
      top: calc(var(--safe-top, 0px) + 76px);
      right: 14px;
      display: inline-flex;
      min-height: 34px;
      align-items: center;
      padding: 7px 11px;
      gap: 8px;
      border: 1px solid rgba(13, 143, 77, 0.14);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.96);
      color: var(--green-900, #0d6338);
      box-shadow: 0 5px 16px rgba(20, 64, 38, 0.14);
      font-size: 11px;
      font-weight: 900;
      transform: translateY(-5px);
      white-space: nowrap;
    }

    .calendar-fetch-status.is-compact.is-visible {
      transform: translateY(0);
    }

    .calendar-fetch-status__spinner {
      flex: 0 0 auto;
      border: 3px solid var(--green-100, #d9f0e3);
      border-top-color: var(--green-700, #0d8f4d);
      border-radius: 50%;
      animation: calendar-fetch-spin 0.72s linear infinite;
    }

    .calendar-fetch-status.is-large .calendar-fetch-status__spinner {
      width: 44px;
      height: 44px;
      margin-bottom: 17px;
      border-width: 4px;
    }

    .calendar-fetch-status.is-compact .calendar-fetch-status__spinner {
      width: 14px;
      height: 14px;
    }

    .calendar-fetch-status__copy {
      display: flex;
      flex-direction: column;
    }

    .calendar-fetch-status.is-large .calendar-fetch-status__title {
      font-size: 19px;
      font-weight: 900;
      letter-spacing: -0.02em;
      line-height: 1.35;
    }

    .calendar-fetch-status.is-large .calendar-fetch-status__detail {
      margin-top: 7px;
      color: var(--ink-soft, #627067);
      font-size: 13px;
      font-weight: 700;
      line-height: 1.5;
    }

    .calendar-fetch-status.is-compact .calendar-fetch-status__title {
      font-size: 11px;
      font-weight: 900;
    }

    .calendar-fetch-status.is-compact .calendar-fetch-status__detail {
      display: none;
    }

    @keyframes calendar-fetch-spin {
      to { transform: rotate(360deg); }
    }

    @media (max-height: 650px) {
      .calendar-fetch-status.is-large {
        top: calc(var(--safe-top, 0px) + 150px);
        min-height: 154px;
      }
    }
  `,e.head.appendChild(t)}function Hn(e){let t=e.getElementById("calendarFetchStatus");return t||(Dn(e),t=e.createElement("div"),t.id="calendarFetchStatus",t.className="calendar-fetch-status",t.setAttribute("role","status"),t.setAttribute("aria-live","polite"),t.innerHTML=`
    <span class="calendar-fetch-status__spinner" aria-hidden="true"></span>
    <span class="calendar-fetch-status__copy">
      <strong class="calendar-fetch-status__title"></strong>
      <span class="calendar-fetch-status__detail"></span>
    </span>
  `,e.body.appendChild(t),t)}function Mn({globalRef:e=globalThis,documentRef:t=globalThis.document,locationRef:n=globalThis.location,storageRef:r=globalThis.localStorage}={}){if(!e?.fetch||!t||!n)return()=>{};if(e.__tamafitCalendarFetchStatusInstalled)return()=>{};e.__tamafitCalendarFetchStatusInstalled=!0;let s=e.fetch.bind(e),i=Hn(t),o=new Map,a=0,c=null,d=null,l=i.querySelector(".calendar-fetch-status__title"),h=i.querySelector(".calendar-fetch-status__detail"),S=()=>{clearTimeout(c),clearTimeout(d),c=null,d=null},g=()=>{S(),i.classList.remove("is-visible","is-large","is-compact")},E=()=>[...o.values()].some(D=>$n(D,n.hash)),G=D=>{let N=xn(n.hash);i.classList.remove("is-large","is-compact"),i.classList.add(D==="initial"?"is-large":"is-compact"),D==="initial"?(l.textContent=`${N}\u306E\u4E88\u5B9A\u3092\u8AAD\u307F\u8FBC\u3093\u3067\u3044\u307E\u3059`,h.textContent="\u30AB\u30EC\u30F3\u30C0\u30FC\u306F\u79FB\u52D5\u6E08\u307F\u3067\u3059\u3002\u305D\u306E\u307E\u307E\u304A\u5F85\u3061\u304F\u3060\u3055\u3044",d=setTimeout(()=>{!i.classList.contains("is-visible")||!E()||(l.textContent="\u4E88\u5B9A\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u6642\u9593\u304C\u304B\u304B\u3063\u3066\u3044\u307E\u3059",h.textContent="\u901A\u4FE1\u72B6\u6CC1\u306B\u3088\u3063\u3066\u6642\u9593\u304C\u304B\u304B\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059")},8e3)):(l.textContent="\u6700\u65B0\u306E\u4E88\u5B9A\u3092\u78BA\u8A8D\u4E2D",h.textContent=""),i.classList.add("is-visible")},C=()=>{if(!kn(n.hash)||!E()){g();return}let N=!he(r,n.hash),st=N?"is-large":"is-compact";i.classList.contains("is-visible")&&i.classList.contains(st)||(S(),i.classList.remove("is-visible","is-large","is-compact"),c=setTimeout(()=>{if(c=null,!E())return;let q=!he(r,n.hash);G(q?"initial":"refresh")},N?80:350))},Sn=(D,N)=>{let st=An(D,N);if(!st)return s(D,N);let q=++a;o.set(q,st),C();let ue;try{ue=s(D,N)}catch(In){throw o.delete(q),C(),In}return Promise.resolve(ue).finally(()=>{o.delete(q),C()})};return e.fetch=Sn,e.addEventListener?.("hashchange",C),()=>{g(),o.clear(),e.fetch=s,e.removeEventListener?.("hashchange",C),delete e.__tamafitCalendarFetchStatusInstalled}}typeof window<"u"&&Mn();var ye="tamafit_staff_calendar_local_first_v1",me=`${ye}:history`,pe=`${ye}:history-hidden-ids`,Cn="Google\u30AB\u30EC\u30F3\u30C0\u30FC\u76F4\u63A5\u64CD\u4F5C";function ge(e,t,n){try{return JSON.parse(e?.getItem(t)||"null")??n}catch{return n}}function be(e){let t=String(e||"").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);if(!t)return null;let[,n,r,s,i,o]=t;return{dayNumber:Math.floor(Date.UTC(Number(n),Number(r)-1,Number(s))/864e5),time:`${i}:${o}`}}function Nn(e){return String(e||"").slice(0,16)}function On(e){return e?.source===Cn&&e?.action==="\u5909\u66F4"&&e?.historyId&&e?.id&&be(e.startAt)}function Ln(e){if(e.length<3)return!1;let t=e.map(s=>be(s.startAt));if(t.some(s=>!s)||new Set(t.map(s=>s.time)).size!==1)return!1;let r=[...new Set(t.map(s=>s.dayNumber))].sort((s,i)=>s-i);return r.length<3?!1:r.every(s=>(s-r[0])%7===0)}function Rn(e){let t=new Map;(Array.isArray(e)?e:[]).forEach(r=>{if(!On(r))return;let s=[r.id,r.customerName||"",Nn(r.timestamp)].join("|");t.has(s)||t.set(s,[]),t.get(s).push(r)});let n=new Set;return t.forEach(r=>{Ln(r)&&r.forEach(s=>n.add(String(s.historyId)))}),[...n]}function Bn(e=globalThis.localStorage){if(!e)return[];let t=ge(e,me,[]),n=Rn(t);if(!n.length)return[];let r=new Set(n),s=new Set(ge(e,pe,[]).map(String));n.forEach(i=>s.add(i));try{e.setItem(me,JSON.stringify(t.filter(i=>!r.has(String(i?.historyId||""))))),e.setItem(pe,JSON.stringify([...s]))}catch{return[]}return n}typeof window<"u"&&Bn(window.localStorage);var Ht="cubic-bezier(0.22, 1, 0.36, 1)",Y=".month-calendar, .week-list",ot=0;function Dt(e){return String(e).padStart(2,"0")}function Pn(e){return`${e.getFullYear()}-${Dt(e.getMonth()+1)}-${Dt(e.getDate())}`}function Fn(e,t){let n=t>=0?1:-1,r=String(e||"").match(/^#\/month\/(\d{4})-(\d{2})/);if(r){let i=new Date(Number(r[1]),Number(r[2])-1+n,1);return`#/month/${i.getFullYear()}-${Dt(i.getMonth()+1)}`}let s=String(e||"").match(/^#\/week\/(\d{4})-(\d{2})-(\d{2})/);if(s){let i=new Date(Number(s[1]),Number(s[2])-1,Number(s[3]));return i.setDate(i.getDate()+n*7),`#/week/${Pn(i)}`}return null}function Kn({distance:e,width:t,velocity:n=0}){let r=Math.abs(Number(e)||0),s=Math.max(1,Number(t)||1),i=Math.abs(Number(n)||0),o=Math.max(92,s*.28),a=Math.max(60,s*.16);return r>=o||r>=a&&i>=.85}function Wn(){if(document.getElementById("calendarSwipeStyles"))return;let e=document.createElement("style");e.id="calendarSwipeStyles",e.textContent=`
    ${Y} {
      touch-action: pan-y;
      overscroll-behavior-x: contain;
      transform: translate3d(0, 0, 0);
    }
    ${Y}.is-calendar-swiping {
      will-change: transform;
    }
  `,document.head.appendChild(e)}function Mt(e){e?.isConnected&&(e.classList.remove("is-calendar-swiping"),e.style.transition="",e.style.transform="",e.style.pointerEvents="")}function ve(e){e?.isConnected&&(e.style.transition=`transform 230ms ${Ht}`,e.style.transform="translate3d(0, 0, 0)",setTimeout(()=>Mt(e),260))}function we(e,t){let n=()=>e.querySelector?.(Y),r=n();if(!r){requestAnimationFrame(()=>{n()&&we(e,t)});return}let s=Math.max(1,r.clientWidth||window.innerWidth||1),i=t>0?s:-s;r.classList.add("is-calendar-swiping"),r.style.transition="none",r.style.transform=`translate3d(${i}px, 0, 0)`,r.style.pointerEvents="none",requestAnimationFrame(()=>{requestAnimationFrame(()=>{r.isConnected&&(r.style.transition=`transform 240ms ${Ht}`,r.style.transform="translate3d(0, 0, 0)",setTimeout(()=>Mt(r),270))})})}function Gn({root:e=document}={}){Wn();let t=null,n=0;e.addEventListener("pointerdown",s=>{if(!s.isPrimary||s.pointerType==="mouse")return;let i=s.target.closest?.(Y);if(!i)return;let o=performance.now();t={pointerId:s.pointerId,surface:i,startX:s.clientX,startY:s.clientY,lastX:s.clientX,lastTime:o,velocityX:0,horizontal:!1,cancelled:!1}}),e.addEventListener("pointermove",s=>{if(!t||s.pointerId!==t.pointerId||t.cancelled)return;let i=s.clientX-t.startX,o=s.clientY-t.startY,a=Math.abs(i),c=Math.abs(o);if(!t.horizontal){if(a<8&&c<8)return;if(c>=a){t.cancelled=!0;return}t.horizontal=!0,t.surface.classList.add("is-calendar-swiping"),t.surface.setPointerCapture?.(s.pointerId)}s.preventDefault();let d=performance.now(),l=Math.max(1,d-t.lastTime),h=(s.clientX-t.lastX)/l;t.velocityX=t.velocityX*.55+h*.45,t.lastX=s.clientX,t.lastTime=d;let g=Math.max(1,t.surface.clientWidth||window.innerWidth||1)*.96,E=Math.abs(i),G=E<=g?i:Math.sign(i)*(g+(E-g)*.18);t.surface.style.transition="none",t.surface.style.transform=`translate3d(${G}px, 0, 0)`},{passive:!1});function r(s,i=!1){if(!t||s.pointerId!==t.pointerId)return;let o=t;if(t=null,i||o.cancelled||!o.horizontal){Mt(o.surface);return}let a=s.clientX-o.startX,d=performance.now()-o.lastTime>90?0:o.velocityX,l=Math.max(1,o.surface.clientWidth||window.innerWidth||1),h=Kn({distance:a,width:l,velocity:d});if(n=performance.now()+450,!h){ve(o.surface);return}let S=a<0?1:-1,g=Fn(window.location.hash,S);if(!g){ve(o.surface);return}let E=S>0?-l:l,G=Math.max(0,Math.min(1,(l-Math.min(l,Math.abs(a)))/l)),C=Math.round(140+G*90);o.surface.style.pointerEvents="none",o.surface.style.transition=`transform ${C}ms ${Ht}`,o.surface.style.transform=`translate3d(${E}px, 0, 0)`,ot=S,setTimeout(()=>{window.location.hash=g},C)}e.addEventListener("pointerup",s=>r(s)),e.addEventListener("pointercancel",s=>r(s,!0)),e.addEventListener("click",s=>{performance.now()>=n||s.target.closest?.(Y)&&(s.preventDefault(),s.stopPropagation())},!0),window.addEventListener("hashchange",()=>{if(!ot)return;let s=ot;ot=0,queueMicrotask(()=>we(e,s))})}typeof document<"u"&&Gn();var qn="tamafit_staff_calendar_last_view",Se="tamafit_staff_calendar_operator_v1",U=[{id:"tamai",name:"\u7389\u4E95",trainerId:"tamai"},{id:"obayashi",name:"\u5927\u6797",trainerId:"obayashi"},{id:"store",name:"\u5E97\u8217\u7528\u7AEF\u672B",trainerId:""}];function V(){try{let e=globalThis.localStorage?.getItem(Se)||"";return U.some(t=>t.id===e)?e:""}catch{return""}}function _(){let e=V();return U.find(t=>t.id===e)||null}function Ie(e){if(!U.some(t=>t.id===e))return!1;try{return globalThis.localStorage?.setItem(Se,e),!0}catch{return!1}}function Ee(e){if(!(e!=="month"&&e!=="week"))try{localStorage.setItem(qn,e)}catch{}}var k={route:null,isLoading:!1,installPrompt:null,isInstalled:!1};var Yn=60,Un="blocked",Vn="\u30AF\u30A4\u30C3\u30AF\u4E88\u7D04",_e="\u5E97\u8217\u5171\u7528";function Ae(e){let t=String(e||"");return/^#\/booking\/new\?/.test(t)&&/(?:^|[?&])quick=1(?:&|$)/.test(t)}function zn(e){let t=String(e||"");return/^\d{4}-\d{2}-\d{2}$/.test(t)?`#/booking/new?date=${t}&quick=1`:""}function jn(e){let t=String(e?.trainerId||"");return{customerName:t?Vn:_e,trainerId:t,duration:Yn,type:Un,notes:"",operatorLabel:t?String(e?.name||"\u62C5\u5F53\u30C8\u30EC\u30FC\u30CA\u30FC"):_e}}function Xn(e){e?.closest?.(".field")?.setAttribute("hidden","")}function Jn({documentRef:e=globalThis.document,locationRef:t=globalThis.location,operator:n=_()}={}){if(!e||!t||!Ae(t.hash))return!1;let r=e.getElementById("bookingForm");if(!r)return!1;let s=e.getElementById("customerName"),i=e.getElementById("trainerId"),o=e.getElementById("duration"),a=e.getElementById("bookingType"),c=e.getElementById("notes"),d=jn(n);s&&(s.value=d.customerName),i&&(i.value=d.trainerId),o&&(o.value=String(d.duration)),a&&(a.value=d.type),c&&(c.value=d.notes),[s,i,o,a,c].forEach(Xn),r.dataset.quickBooking="true";let l=e.querySelector(".form-heading"),h=l?.querySelector(".eyebrow"),S=l?.querySelector("h1"),g=l?.querySelector("p:last-child"),E=r.querySelector('button[type="submit"]');return h&&(h.textContent="\u6700\u77ED\u5165\u529B"),S&&(S.textContent="\u30AF\u30A4\u30C3\u30AF\u4E88\u7D04"),g&&(g.textContent=`${d.operatorLabel}\u3068\u3057\u306660\u5206\u306E\u4E88\u7D04\u67A0\u3092\u4F5C\u6210\u3057\u307E\u3059\u3002\u5165\u529B\u306F\u4E88\u7D04\u65E5\u3068\u958B\u59CB\u6642\u9593\u3060\u3051\u3067\u3059\u3002`),E&&(E.textContent="\u30AF\u30A4\u30C3\u30AF\u4E88\u7D04\u3092\u767B\u9332"),!0}function Ct(e,t=0){let n=()=>{Jn()||t>=8||!Ae(e.location?.hash)||Ct(e,t+1)};typeof e.requestAnimationFrame=="function"?e.requestAnimationFrame(n):e.setTimeout?.(n,0)}function Qn({globalRef:e=globalThis,documentRef:t=globalThis.document,sessionStorageRef:n=globalThis.sessionStorage}={}){if(!t||!e?.location)return()=>{};if(e.__tamafitQuickBookingInstalled)return()=>{};e.__tamafitQuickBookingInstalled=!0;let r=i=>{let o=i.target.closest?.("[data-quick-booking]");if(!o)return;let a=zn(o.dataset.date);if(a){i.preventDefault(),i.stopPropagation();try{n?.setItem("tamafit_calendar_return_hash",e.location.hash)}catch{}e.location.hash=a}},s=()=>Ct(e);return t.addEventListener("click",r,!0),e.addEventListener?.("hashchange",s),Ct(e),()=>{t.removeEventListener("click",r,!0),e.removeEventListener?.("hashchange",s),delete e.__tamafitQuickBookingInstalled}}typeof document<"u"&&Qn();var at=["\u65E5","\u6708","\u706B","\u6C34","\u6728","\u91D1","\u571F"];function z(e){return String(e).padStart(2,"0")}function f(e){return`${e.getFullYear()}-${z(e.getMonth()+1)}-${z(e.getDate())}`}function O(e){let[t,n,r]=String(e).split("-").map(Number);return new Date(t,n-1,r)}function ct(e){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(e)))return!1;let t=O(e);return f(t)===e}function L(e,t){let n=new Date(e.getFullYear(),e.getMonth(),e.getDate());return n.setDate(n.getDate()+t),n}function P(e,t){return new Date(e.getFullYear(),e.getMonth()+t,1)}function ke(e){return L(e,-e.getDay())}function dt(e){let t=new Date(e.getFullYear(),e.getMonth(),1),n=ke(t);return Array.from({length:42},(r,s)=>L(n,s))}function j(e){let t=ke(e);return Array.from({length:7},(n,r)=>L(t,r))}function xe(e){return`${e.getFullYear()}\u5E74${e.getMonth()+1}\u6708`}function Ot(e){return`${e.getMonth()+1}\u6708${e.getDate()}\u65E5\uFF08${at[e.getDay()]}\uFF09`}function $e(e){return`${e.getMonth()+1}/${e.getDate()}\uFF08${at[e.getDay()]}\uFF09`}function Te(e){let t=j(e),n=t[0],r=t[6];return n.getMonth()===r.getMonth()?`${n.getMonth()+1}/${n.getDate()}\u301C${r.getMonth()+1}/${r.getDate()}`:`${n.getMonth()+1}/${n.getDate()}\u301C${r.getMonth()+1}/${r.getDate()}`}function Lt(e){let[t="",n=""]=String(e).split("T");return{date:t,time:n.slice(0,5)}}function X(e,t){return`${e}T${t}:00`}function Nt(e){let[t,n]=e.split(":").map(Number);return t*60+n}function De(e){return`${z(Math.floor(e/60))}:${z(e%60)}`}function lt(e,t){let{date:n,time:r}=Lt(e);return X(n,De(Nt(r)+t))}function He(e,t,n){let r=[];for(let s=Nt(e);s<=Nt(t);s+=n)r.push(De(s));return r}function ut(e){return f(e)===f(new Date)}function w(e){return`${e.getFullYear()}-${z(e.getMonth()+1)}`}function R(e){if(!/^\d{4}-\d{2}$/.test(String(e)))return new Date;let[t,n]=e.split("-").map(Number);return new Date(t,n-1,1)}function x(e=window.location.hash){let t=e.replace(/^#\/?/,""),[n="",r=""]=t.split("?"),s=n.split("/").filter(Boolean),i=new URLSearchParams(r),o=new Date;return s[0]==="month"?{name:"month",month:s[1]||w(o)}:s[0]==="week"?{name:"week",date:s[1]||f(o)}:s[0]==="day"?{name:"day",date:s[1]||f(o)}:s[0]==="booking"&&s[1]==="new"?{name:"booking-new",date:i.get("date")||f(o)}:s[0]==="booking"&&s[1]==="edit"&&s[2]?{name:"booking-edit",id:decodeURIComponent(s[2])}:s[0]==="history"?{name:"history"}:{name:"month",month:w(o)}}function b(e,{replace:t=!1}={}){let n=e.startsWith("#")?e:`#/${e.replace(/^\//,"")}`;if(t){history.replaceState(null,"",n),window.dispatchEvent(new HashChangeEvent("hashchange"));return}window.location.hash=n}var Me="\u305F\u307E\u30D5\u30A3\u30C3\u30C8\u4E88\u7D04",Ce="https://script.google.com/macros/s/AKfycbzQf3thjGYKpV13bH6V0n1ZKQT23Wvvx8K7CQhRNIuH6mAQwih9Cg28r3ETnz9AVB4Etw/exec",I=[{id:"tamai",name:"\u7389\u4E95",shortName:"\u7389\u4E95",color:"pink"},{id:"obayashi",name:"\u5927\u6797",shortName:"\u5927\u6797",color:"aqua"}],J=[{id:"member",name:"\u901A\u5E38\u4E88\u7D04"},{id:"trial",name:"\u4F53\u9A13"},{id:"consultation",name:"\u898B\u5B66\u30FB\u76F8\u8AC7"},{id:"blocked",name:"\u4E88\u7D04\u30D6\u30ED\u30C3\u30AF"},{id:"tentative",name:"\u4EEE\u4E88\u7D04\u67A0"},{id:"event",name:"\u30A4\u30D9\u30F3\u30C8"}],Ne=[30,60,90],Oe="09:00",Le="21:00",Re=15,Be=5;var $=class{async listEvents(){throw new Error("listEvents must be implemented")}async getEvent(){throw new Error("getEvent must be implemented")}async createEvent(){throw new Error("createEvent must be implemented")}async updateEvent(){throw new Error("updateEvent must be implemented")}async deleteEvent(){throw new Error("deleteEvent must be implemented")}async findConflicts(){throw new Error("findConflicts must be implemented")}async findBufferWarnings(){throw new Error("findBufferWarnings must be implemented")}async listHistory(){throw new Error("listHistory must be implemented")}async deleteHistory(){throw new Error("deleteHistory must be implemented")}};function H(e,t,n=null,r=30){if(!t.trainerId)return[];let s=Date.parse(t.startAt),i=Date.parse(t.endAt),o=r*60*1e3;return!Number.isFinite(s)||!Number.isFinite(i)?[]:e.filter(a=>{if(a.id===n||a.trainerId!==t.trainerId)return!1;let c=Date.parse(a.startAt),d=Date.parse(a.endAt);if(!Number.isFinite(c)||!Number.isFinite(d))return!1;let l=s-d,h=c-i;return l>=0&&l<o||h>=0&&h<o})}var Pe="recurring:";function Zn(e){return/^https:\/\/script\.google\.com\/macros\/s\//.test(String(e||""))}function Fe(e){if(!Zn(e))throw new Error("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u9023\u643A\u306EURL\u304C\u672A\u8A2D\u5B9A\u3067\u3059\u3002Apps Script\u3092\u30C7\u30D7\u30ED\u30A4\u3057\u3066\u304B\u3089 src/config.js \u306B /exec URL \u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002")}function tr(e){return/同じ担当トレーナーに重複する予約があります|予約が見つかりませんでした|未対応の操作です|確認してください|入力してください|一致しません|予約IDがありません/.test(String(e||""))}function Ke(e,{mutation:t=!1}={}){if(e?.status==="success")return e;let n=new Error(e?.message||"Google\u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u306E\u901A\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");throw n.retryable=typeof e?.retryable=="boolean"?e.retryable:t&&!tr(n.message),typeof e?.code=="string"&&(n.code=e.code),n}function Q(e,t,{retryable:n=!0}={}){let r=new Error(e);return r.retryable=n,r.cause=t,r}function Rt(e,t){return t?{...e,mutationId:t}:e}function We(e){if(!e?.isRecurring)return e;let t=String(e.calendarEventId||e.id||"");if(!t||!e.startAt)return{...e,isRecurring:!0,readOnly:!0};let n=String(e.id||""),r=n.startsWith(Pe)?n:`${Pe}${encodeURIComponent(t)}:${e.startAt}`;return{...e,calendarEventId:t,id:r,isRecurring:!0,readOnly:!0}}var F=class extends ${constructor({endpoint:t=Ce,fetchImpl:n=(...r)=>globalThis.fetch(...r)}={}){super(),this.endpoint=t,this.fetchImpl=n}async get(t,n={}){Fe(this.endpoint);let r=new URL(this.endpoint);r.searchParams.set("action",t),Object.entries(n).forEach(([i,o])=>{o!=null&&r.searchParams.set(i,o)});let s;try{s=await this.fetchImpl(r,{method:"GET",redirect:"follow"})}catch(i){throw Q("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002",i)}if(!s.ok)throw Q("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");return Ke(await s.json())}async post(t,n={},{retryOnce:r=!!n.mutationId}={}){Fe(this.endpoint);let s=JSON.stringify({action:t,operatorId:V(),...n}),i=r?2:1;for(let o=0;o<i;o+=1)try{let a=await this.fetchImpl(this.endpoint,{method:"POST",redirect:"follow",body:s});if(!a.ok)throw Q(`Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\uFF08HTTP ${a.status}\uFF09`);return Ke(await a.json(),{mutation:!!n.mutationId})}catch(a){if(a?.retryable===!1)throw a;if(o+1<i)continue;throw a?.retryable?a:Q("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002",a)}throw Q("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002")}async listEvents(t,n){return((await this.get("staffCalendarList",{startDate:t,endDate:n})).events||[]).map(We)}async getEvent(t){let n=await this.get("staffCalendarGet",{id:t});return n.event?We(n.event):null}async createEventWithHistory(t,{mutationId:n=""}={}){let r=await this.post("staffCalendarCreate",Rt({event:t},n));return{event:r.event,history:r.history||null}}async createEvent(t,n={}){return(await this.createEventWithHistory(t,n)).event}async updateEventWithHistory(t,n,{mutationId:r=""}={}){let s=await this.post("staffCalendarUpdate",Rt({id:t,event:n},r));return{event:s.event,history:s.history||null}}async updateEvent(t,n,r={}){return(await this.updateEventWithHistory(t,n,r)).event}async deleteEventWithHistory(t,{mutationId:n=""}={}){return{history:(await this.post("staffCalendarDelete",Rt({id:t},n))).history||null}}async deleteEvent(t,n={}){await this.deleteEventWithHistory(t,n)}async findConflicts(t,n=null){if(!t.trainerId)return[];let r=t.startAt.slice(0,10);return(await this.listEvents(r,r)).filter(i=>i.id===n||i.trainerId!==t.trainerId?!1:t.startAt<i.endAt&&t.endAt>i.startAt)}async findBufferWarnings(t,n=null){let r=t.startAt.slice(0,10);return H(await this.listEvents(r,r),t,n)}async listHistory(t=50){return(await this.get("staffCalendarHistory",{limit:t})).entries||[]}async deleteHistoryResult(t){let n=await this.post("staffCalendarHistoryDelete",{historyIds:(Array.isArray(t)?t:[t]).map(String).filter(Boolean)},{retryOnce:!1});return{deleted:n.deleted||[],acknowledged:n.acknowledged||n.deleted||[]}}async deleteHistory(t){return(await this.deleteHistoryResult(t)).deleted}};var Ge=["\u5C71\u7530 \u82B1\u5B50","\u4F50\u85E4 \u4E00\u90CE","\u9234\u6728 \u7F8E\u9999","\u9AD8\u6A4B \u5065","\u4F0A\u85E4 \u548C\u5B50","\u4E2D\u6751 \u76F4\u5B50","\u5C0F\u6797 \u535A","\u68EE\u4E95 \u6075","\u91CE\u53E3 \u8AA0","\u897F\u539F \u7531\u7F8E"],qe=["09:30","10:00","11:30","13:00","14:30","16:00","18:00","19:30"];function Ye({id:e,date:t,time:n,duration:r=60,customerName:s,trainerIndex:i,type:o="member",notes:a=""}){let c=X(t,n);return{id:e,customerName:s,trainerId:I[i%I.length].id,startAt:c,endAt:lt(c,r),duration:r,type:o,notes:a,status:"confirmed",source:"mock",createdAt:`${t}T08:00:00`,updatedAt:`${t}T08:00:00`}}function Bt(e=new Date){let t=new Date(e.getFullYear(),e.getMonth(),1),n=[],r=[1,3,4,5,6,8,10,11,12,14,16,18,19,20,22,25,27,29],s=1;r.forEach((o,a)=>{let c=f(L(t,o-1)),d=o===11?7:a%4+1;for(let l=0;l<d;l+=1)n.push(Ye({id:`mock-${s}`,date:c,time:qe[(a+l)%qe.length],duration:l%3===0?30:60,customerName:Ge[(a*2+l)%Ge.length],trainerIndex:a+l,type:o===11&&l===1?"trial":"member",notes:l===0&&a%3===0?"\u59FF\u52E2\u3068\u80A9\u307E\u308F\u308A\u3092\u78BA\u8A8D":""})),s+=1});let i=f(L(t,20));return n.push(Ye({id:`mock-${s}`,date:i,time:"12:00",duration:90,customerName:"\u30B9\u30BF\u30C3\u30D5\u4E88\u5B9A",trainerIndex:0,type:"blocked"})),n}function Ue(e){return J.find(t=>t.id===e)||J[0]}var Ve="tamafit_staff_calendar_events_v1",ze="tamafit_staff_calendar_history_v1";function er(){return globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():`booking-${Date.now()}-${Math.random().toString(16).slice(2)}`}var ht=class extends ${constructor(t=globalThis.localStorage){super(),this.storage=t}readAll(){try{let n=this.storage.getItem(Ve);if(n)return JSON.parse(n)}catch{}let t=Bt();return this.writeAll(t),t}writeAll(t){try{this.storage.setItem(Ve,JSON.stringify(t))}catch{}}readHistory(){try{let t=JSON.parse(this.storage.getItem(ze)||"[]");return Array.isArray(t)?t:[]}catch{return[]}}writeHistory(t){try{this.storage.setItem(ze,JSON.stringify(t.slice(0,50)))}catch{}}addHistory(t,n,r){let s=r||n;s&&this.writeHistory([{timestamp:new Date().toISOString(),action:t,source:_()?.name||"\u672A\u8A2D\u5B9A\u7AEF\u672B",id:s.id,customerName:s.customerName,trainerName:s.trainerId==="tamai"?"\u7389\u4E95":s.trainerId==="obayashi"?"\u5927\u6797":"\u6307\u5B9A\u306A\u3057",startAt:s.startAt,endAt:s.endAt,typeName:{member:"\u901A\u5E38\u4E88\u7D04",trial:"\u4F53\u9A13",consultation:"\u898B\u5B66\u30FB\u76F8\u8AC7",blocked:"\u4E88\u7D04\u30D6\u30ED\u30C3\u30AF",tentative:"\u4EEE\u4E88\u7D04\u67A0",event:"\u30A4\u30D9\u30F3\u30C8"}[s.type]||s.type,notes:s.notes||"",beforeSummary:n&&r?`${n.startAt}\u301C${n.endAt} / ${n.customerName}`:""},...this.readHistory()])}async listEvents(t,n){return this.readAll().filter(r=>r.startAt.slice(0,10)>=t&&r.startAt.slice(0,10)<=n).sort((r,s)=>r.startAt.localeCompare(s.startAt))}async getEvent(t){return this.readAll().find(n=>n.id===t)||null}async createEvent(t){let n=new Date().toISOString(),r={...t,id:er(),status:"confirmed",source:"staff-calendar",createdAt:n,updatedAt:n},s=this.readAll();return s.push(r),this.writeAll(s),this.addHistory("\u4F5C\u6210",null,r),r}async updateEvent(t,n){let r=this.readAll(),s=r.findIndex(o=>o.id===t);if(s<0)throw new Error("\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");let i={...r[s]};return r[s]={...r[s],...n,id:t,updatedAt:new Date().toISOString()},this.writeAll(r),this.addHistory("\u5909\u66F4",i,r[s]),r[s]}async deleteEvent(t){let n=this.readAll(),r=n.find(i=>i.id===t),s=n.filter(i=>i.id!==t);if(s.length===n.length)throw new Error("\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");this.writeAll(s),this.addHistory("\u524A\u9664",r,null)}async findConflicts(t,n=null){return t.trainerId?this.readAll().filter(r=>r.id===n||r.trainerId!==t.trainerId?!1:t.startAt<r.endAt&&t.endAt>r.startAt):[]}async findBufferWarnings(t,n=null){return H(this.readAll(),t,n)}async listHistory(t=50){return this.readHistory().slice(0,t)}async resetDemoData(){let t=Bt();return this.writeAll(t),t}};var nr=2e4,je=4;function Pt(e){return e&&typeof e.getItem=="function"&&typeof e.setItem=="function"}function Ft(e,t,n){return e.startDate<=t&&e.endDate>=n}function ft(e){return String(e?.startAt||"").slice(0,10)}function Kt(e,t,n){return e.filter(r=>ft(r)>=t&&ft(r)<=n).sort((r,s)=>r.startAt.localeCompare(s.startAt))}function Wt(e){let t=globalThis.crypto?.randomUUID?.()||`${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;return`${e}-${Date.now()}-${t}`}function Xe(e,t,n=null){return t.trainerId?e.filter(r=>r.id===n||r.trainerId!==t.trainerId?!1:t.startAt<r.endAt&&t.endAt>r.startAt):[]}var mt=class extends ${constructor(t,{storage:n=globalThis.localStorage,storageKey:r="tamafit_staff_calendar_cache_v1",now:s=()=>Date.now(),ttlMs:i=nr}={}){super(),this.source=t,this.storage=n,this.storageKey=r,this.now=s,this.ttlMs=i,this.pendingRequests=new Map,this.cacheGeneration=0,this.snapshots=this.readSnapshots()}readSnapshots(){if(!Pt(this.storage))return[];try{let t=JSON.parse(this.storage.getItem(this.storageKey)||"[]");return Array.isArray(t)?t.filter(n=>n&&Array.isArray(n.events)&&n.startDate&&n.endDate&&n.fetchedAt!==void 0).map(n=>({...n,fetchedAt:n.events.some(r=>r.status==="pending")?0:n.fetchedAt})):[]}catch{return[]}}writeSnapshots(){if(Pt(this.storage))try{this.storage.setItem(this.storageKey,JSON.stringify(this.snapshots))}catch{}}getCachedEvents(t,n){let r=this.snapshots.filter(s=>Ft(s,t,n)).sort((s,i)=>i.fetchedAt-s.fetchedAt)[0];return r?{events:Kt(r.events,t,n),fetchedAt:r.fetchedAt,isFresh:this.now()-r.fetchedAt<this.ttlMs}:null}async listEvents(t,n){let r=this.getCachedEvents(t,n);return r?.isFresh?r.events:this.refreshEvents(t,n)}async refreshEvents(t,n){let r=`${t}:${n}`;if(this.pendingRequests.has(r))return this.pendingRequests.get(r);let s=this.cacheGeneration,i=this.source.listEvents(t,n).then(o=>{if(s!==this.cacheGeneration)return this.getCachedEvents(t,n)?.events||Kt(o,t,n);let a={startDate:t,endDate:n,events:[...o].sort((c,d)=>c.startAt.localeCompare(d.startAt)),fetchedAt:this.now()};return this.snapshots=[a,...this.snapshots.filter(c=>c.startDate!==t||c.endDate!==n)].slice(0,je),this.writeSnapshots(),Kt(a.events,t,n)}).finally(()=>this.pendingRequests.delete(r));return this.pendingRequests.set(r,i),i}invalidate(){if(this.cacheGeneration+=1,this.snapshots=[],this.pendingRequests.clear(),!!Pt(this.storage))try{this.storage.removeItem(this.storageKey)}catch{}}updateCachedEvents({removeIds:t=[],upsertEvents:n=[]}={}){this.cacheGeneration+=1;let r=new Set(t.filter(Boolean));n.forEach(i=>{i?.id&&r.add(i.id)});let s=this.snapshots.map(i=>{let o=i.events.some(c=>r.has(c.id)),a=i.events.filter(c=>!r.has(c.id));return n.forEach(c=>{let d=ft(c);d&&Ft(i,d,d)&&(a.push(c),o=!0)}),o?{...i,events:a.sort((c,d)=>c.startAt.localeCompare(d.startAt)),fetchedAt:this.now()}:i});n.forEach(i=>{let o=ft(i);!o||s.some(a=>Ft(a,o,o))||s.unshift({startDate:o,endDate:o,events:[i],fetchedAt:this.now()})}),this.snapshots=s.slice(0,je),this.writeSnapshots()}async getEvent(t){return this.snapshots.flatMap(r=>r.events).find(r=>r.id===t)||this.source.getEvent(t)}async createEvent(t){let n=await this.source.createEvent(t);return this.updateCachedEvents({upsertEvents:[n]}),n}async updateEvent(t,n){let r=await this.source.updateEvent(t,n);return this.updateCachedEvents({removeIds:[t],upsertEvents:[r]}),r}async deleteEvent(t){await this.source.deleteEvent(t),this.updateCachedEvents({removeIds:[t]})}analyzeCachedBooking(t,n=null){let r=t.startAt.slice(0,10),s=this.getCachedEvents(r,r);return s?{conflicts:Xe(s.events,t,n),bufferWarnings:H(s.events,t,n),events:s.events,isFresh:s.isFresh}:null}async analyzeBooking(t,n=null){let r=this.analyzeCachedBooking(t,n);if(r)return r;let s=t.startAt.slice(0,10),i=await this.refreshEvents(s,s);return{conflicts:Xe(i,t,n),bufferWarnings:H(i,t,n),events:i,isFresh:!0}}async findConflicts(t,n=null){return(await this.analyzeBooking(t,n)).conflicts}async findBufferWarnings(t,n=null){return(await this.analyzeBooking(t,n)).bufferWarnings}createEventOptimistic(t){let n=Wt("create"),r={id:`pending:${n}`,...t,status:"pending",source:"optimistic",isManaged:!0,lastUpdated:this.now()};this.updateCachedEvents({upsertEvents:[r]});let s=this.source.createEvent(t,{mutationId:n}).then(i=>(this.updateCachedEvents({removeIds:[r.id],upsertEvents:[i]}),i)).catch(i=>{throw this.updateCachedEvents({removeIds:[r.id]}),i});return{event:r,committed:s,mutationId:n}}async updateEventOptimistic(t,n){let r=await this.getEvent(t);if(!r)throw new Error("\u5909\u66F4\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");let s=Wt("update"),i={...r,...n,id:t,status:"pending",source:"optimistic",lastUpdated:this.now()};this.updateCachedEvents({removeIds:[t],upsertEvents:[i]});let o=this.source.updateEvent(t,n,{mutationId:s}).then(a=>(this.updateCachedEvents({removeIds:[t],upsertEvents:[a]}),a)).catch(a=>{throw this.updateCachedEvents({removeIds:[t],upsertEvents:[r]}),a});return{event:i,previous:r,committed:o,mutationId:s}}async deleteEventOptimistic(t){let n=await this.getEvent(t);if(!n)throw new Error("\u524A\u9664\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");let r=Wt("delete");this.updateCachedEvents({removeIds:[t]});let s=this.source.deleteEvent(t,{mutationId:r}).then(()=>n).catch(i=>{throw this.updateCachedEvents({upsertEvents:[n]}),i});return{event:n,committed:s,mutationId:r}}async listHistory(t=50){return this.source.listHistory(t)}};function T(e){return[e?.action||"",e?.customerName||"",e?.startAt||"",e?.endAt||"",e?.beforeSummary||""].join("|")}var rr=3e4,Je=24,K=50,Gt=[1500,4e3,1e4,3e4,6e4];function Z(e,t,n){try{return JSON.parse(e?.getItem(t)||"null")??n}catch{return n}}function pt(e,t,n){try{e?.setItem(t,JSON.stringify(n))}catch{}}function qt(e){let t=globalThis.crypto?.randomUUID?.()||`${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;return`${e}-${Date.now()}-${t}`}function sr(e){return String(e?.startAt||"").slice(0,10)}function Yt(e,t,n){let r=sr(e);return r>=t&&r<=n}function gt(e){return[...e].sort((t,n)=>t.startAt.localeCompare(n.startAt))}function ir(e){return e==="tamai"?"\u7389\u4E95":e==="obayashi"?"\u5927\u6797":"\u6307\u5B9A\u306A\u3057"}function or(e){return{member:"\u901A\u5E38\u4E88\u7D04",trial:"\u4F53\u9A13",consultation:"\u898B\u5B66\u30FB\u76F8\u8AC7",blocked:"\u4E88\u7D04\u30D6\u30ED\u30C3\u30AF",tentative:"\u4EEE\u4E88\u7D04\u67A0",event:"\u30A4\u30D9\u30F3\u30C8"}[e]||e||"\u4E88\u5B9A"}function ar(e,t,n=null){return t.trainerId?e.filter(r=>r.id===n||r.trainerId!==t.trainerId?!1:t.startAt<r.endAt&&t.endAt>r.startAt):[]}var yt=class extends ${constructor(t,{storage:n=globalThis.localStorage,storageKey:r="tamafit_staff_calendar_local_first_v1",now:s=()=>Date.now(),ttlMs:i=rr}={}){super(),this.source=t,this.storage=n,this.storageKey=r,this.now=s,this.ttlMs=i,this.recordsKey=`${r}:records`,this.coverageKey=`${r}:coverage`,this.outboxKey=`${r}:outbox`,this.historyKey=`${r}:history`,this.records=Z(n,this.recordsKey,[]),this.coverage=Z(n,this.coverageKey,[]),this.outbox=Z(n,this.outboxKey,[]),this.history=Z(n,this.historyKey,[]),this.listeners=new Set,this.syncing=!1,this.retryTimer=null,this.refreshes=new Map,this.migrateLegacyCache(),queueMicrotask(()=>this.syncNow())}migrateLegacyCache(){if(this.records.length)return;let t=Z(this.storage,"tamafit_staff_calendar_google_cache_v1",[]);if(!Array.isArray(t)||!t.length)return;let n=new Map;t.forEach(r=>{(r?.events||[]).forEach(s=>n.set(s.id,s))}),this.records=gt([...n.values()]),this.coverage=t.filter(r=>r?.startDate&&r?.endDate).map(r=>({startDate:r.startDate,endDate:r.endDate,fetchedAt:r.fetchedAt||0})).slice(0,Je),this.persist()}persist(){pt(this.storage,this.recordsKey,this.records),pt(this.storage,this.coverageKey,this.coverage),pt(this.storage,this.outboxKey,this.outbox),pt(this.storage,this.historyKey,this.history.slice(0,K))}onSyncFailure(t){return this.listeners.add(t),()=>this.listeners.delete(t)}emitFailure(t){this.listeners.forEach(n=>{try{n(t)}catch{}})}getCachedEvents(t,n){let r=this.coverage.filter(s=>s.startDate<=t&&s.endDate>=n).sort((s,i)=>i.fetchedAt-s.fetchedAt)[0];return{events:gt(this.records.filter(s=>Yt(s,t,n))),fetchedAt:r?.fetchedAt||0,isFresh:!!(r&&this.now()-r.fetchedAt<this.ttlMs)}}getEventCached(t){return this.records.find(n=>n.id===t)||null}getCachedHistory(){return this.history.slice(0,K)}async listEvents(t,n){return this.getCachedEvents(t,n).events}async getEvent(t){let n=this.getEventCached(t);if(n)return n;let r=await this.source.getEvent(t);return r&&this.upsertRecord(r),r}async refreshEvents(t,n){let r=`${t}:${n}`;if(this.refreshes.has(r))return this.refreshes.get(r);let s=this.source.listEvents(t,n).then(i=>{let o=new Set(this.outbox.filter(h=>h.kind==="update"||h.kind==="delete").map(h=>h.targetId)),a=this.records.filter(h=>Yt(h,t,n)&&(h.syncState==="pending"||o.has(h.id)||String(h.id).startsWith("local:"))),c=this.records.filter(h=>!Yt(h,t,n)),d=i.filter(h=>!o.has(h.id)),l=new Map;return[...c,...d,...a].forEach(h=>l.set(h.id,h)),this.records=gt([...l.values()]),this.coverage=[{startDate:t,endDate:n,fetchedAt:this.now()},...this.coverage.filter(h=>h.startDate!==t||h.endDate!==n)].slice(0,Je),this.persist(),this.getCachedEvents(t,n).events}).finally(()=>this.refreshes.delete(r));return this.refreshes.set(r,s),s}refreshHistory(){return this.source.listHistory(K).then(t=>{let n=this.history.filter(s=>s.localOnly),r=new Set;return this.history=[...n,...t].filter(s=>{let i=`${s.timestamp}|${s.action}|${s.id}|${s.customerName}`;return r.has(i)?!1:(r.add(i),!0)}).slice(0,K),this.persist(),this.history})}async listHistory(t=K){return this.history.slice(0,t)}upsertRecord(t,n=""){let r=new Set([n,t?.id].filter(Boolean));this.records=gt([...this.records.filter(s=>!r.has(s.id)),...t?[t]:[]]),this.persist()}removeRecord(t){this.records=this.records.filter(n=>n.id!==t),this.persist()}appendLocalHistory(t,n,r){let s=r||n;if(!s)return;let i=new Date(this.now()).toISOString();this.history=[{timestamp:i,action:t,source:_()?.name||"\u672A\u8A2D\u5B9A\u7AEF\u672B",id:s.id,customerName:s.customerName,trainerName:ir(s.trainerId),startAt:s.startAt,endAt:s.endAt,typeName:or(s.type),notes:s.notes||"",beforeSummary:n&&r?`${n.startAt}\u301C${n.endAt} / ${n.customerName}`:"",localOnly:!0},...this.history].slice(0,K),this.persist()}analyzeCachedBooking(t,n=null){let r=t.startAt.slice(0,10),s=this.getCachedEvents(r,r).events;return{conflicts:ar(s,t,n),bufferWarnings:H(s,t,n),events:s}}async analyzeBooking(t,n=null){return this.analyzeCachedBooking(t,n)}async findConflicts(t,n=null){return this.analyzeCachedBooking(t,n).conflicts}async findBufferWarnings(t,n=null){return this.analyzeCachedBooking(t,n).bufferWarnings}createEventOptimistic(t){let n=qt("create"),r=`local:${n}`,s={...t,id:r,status:"confirmed",syncState:"pending",source:"local-first",isManaged:!0,lastUpdated:this.now()};return this.upsertRecord(s),this.appendLocalHistory("\u4F5C\u6210",null,s),this.outbox.push({id:n,kind:"create",targetId:r,input:t,before:null,createdAt:this.now(),attempts:0,notified:!1}),this.persist(),queueMicrotask(()=>this.syncNow()),{event:s,mutationId:n}}updateEventOptimistic(t,n){let r=this.getEventCached(t);if(!r)throw new Error("\u5909\u66F4\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");let s=qt("update"),i={...r,...n,id:t,status:"confirmed",syncState:"pending",source:"local-first",lastUpdated:this.now()};return this.upsertRecord(i),this.appendLocalHistory("\u5909\u66F4",r,i),this.outbox.push({id:s,kind:"update",targetId:t,input:n,before:r,createdAt:this.now(),attempts:0,notified:!1}),this.persist(),queueMicrotask(()=>this.syncNow()),{event:i,previous:r,mutationId:s}}deleteEventOptimistic(t){let n=this.getEventCached(t);if(!n)throw new Error("\u524A\u9664\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");let r=qt("delete");return this.removeRecord(t),this.appendLocalHistory("\u524A\u9664",n,null),this.outbox.push({id:r,kind:"delete",targetId:t,input:null,before:n,createdAt:this.now(),attempts:0,notified:!1}),this.persist(),queueMicrotask(()=>this.syncNow()),{event:n,mutationId:r}}async createEvent(t){return this.createEventOptimistic(t).event}async updateEvent(t,n){return this.updateEventOptimistic(t,n).event}async deleteEvent(t){this.deleteEventOptimistic(t)}rewriteTargetId(t,n){this.outbox.forEach(r=>{r.targetId===t&&(r.targetId=n),r.before?.id===t&&(r.before={...r.before,id:n})})}rollback(t,n){t.kind==="create"?this.removeRecord(t.targetId):t.before&&this.upsertRecord({...t.before,syncState:void 0}),this.outbox=this.outbox.filter(r=>r.id!==t.id),this.persist(),this.emitFailure({op:t,error:n,rolledBack:!0})}scheduleRetry(t,n){t.attempts=Number(t.attempts||0)+1;let r=Math.min(t.attempts-1,Gt.length-1);t.nextAttemptAt=this.now()+Gt[r],t.attempts>=3&&!t.notified&&(t.notified=!0,this.emitFailure({op:t,error:n,rolledBack:!1,deferred:!0})),this.persist(),clearTimeout(this.retryTimer),this.retryTimer=setTimeout(()=>this.syncNow(),Gt[r])}async syncOperation(t){if(t.kind==="create"){let n=await this.source.createEvent(t.input,{mutationId:t.id}),r=t.targetId,s=this.outbox.slice(1).filter(o=>o.targetId===r);this.rewriteTargetId(r,n.id);let i=this.getEventCached(r);this.removeRecord(r),s.some(o=>o.kind==="delete")||this.upsertRecord(s.length&&i?{...i,id:n.id,syncState:"pending",source:"local-first"}:{...n,syncState:void 0});return}if(t.kind==="update"){let n=await this.source.updateEvent(t.targetId,t.input,{mutationId:t.id});this.outbox.slice(1).some(s=>s.targetId===t.targetId)||this.upsertRecord({...n,syncState:void 0});return}t.kind==="delete"&&await this.source.deleteEvent(t.targetId,{mutationId:t.id})}async syncNow(){if(!(this.syncing||!this.outbox.length)&&!(typeof navigator<"u"&&navigator.onLine===!1)){this.syncing=!0,clearTimeout(this.retryTimer);try{for(;this.outbox.length;){let t=this.outbox[0];if(t.nextAttemptAt&&t.nextAttemptAt>this.now()){this.scheduleRetry(t,new Error("\u518D\u8A66\u884C\u5F85\u3061"));break}try{await this.syncOperation(t),this.outbox.shift(),this.persist()}catch(n){if(n?.retryable!==!1){this.scheduleRetry(t,n);break}this.rollback(t,n)}}}finally{this.syncing=!1}}}};var cr=90,dr=41,lr="recurring:",Qe=50;function tn(e,t){return Math.round((O(t).getTime()-O(e).getTime())/864e5)}function zt(e){let t=new Date(e.getFullYear(),e.getMonth(),1),n=new Date(e.getFullYear(),e.getMonth()+1,0);return{startDate:f(t),endDate:f(n)}}function Ze(e,t){let n=O(e),r=O(t);if(!(tn(e,t)===dr&&n.getDay()===0&&r.getDay()===6))return{startDate:e,endDate:t};let i=new Date(n.getFullYear(),n.getMonth(),n.getDate()+7);return zt(i)}function ur(e){return`${lr}${encodeURIComponent(e.id)}:${e.startAt}`}function Ut(e,t){try{let n=JSON.parse(e?.getItem(t)||"[]");return new Set(Array.isArray(n)?n.map(String):[])}catch{return new Set}}function Vt(e,t,n){try{e?.setItem(t,JSON.stringify([...n]))}catch{}}function hr(e){return String(e||"").startsWith("local:")||String(e||"").startsWith("local-legacy:")}function fr(e,t=new Set){let n=new Map;return e.forEach(r=>n.set(r.id,(n.get(r.id)||0)+1)),n.forEach((r,s)=>{r>1&&t.add(s)}),e.map(r=>t.has(r.id)?{...r,calendarEventId:r.id,id:ur(r),isRecurring:!0,readOnly:!0}:r)}function mr(e,t){return new Proxy(e,{get(n,r,s){if(r==="listEvents")return async(...o)=>fr(await n.listEvents(...o),t);let i=Reflect.get(n,r,s);return typeof i=="function"?i.bind(n):i}})}var bt=class extends yt{constructor(t,n={}){let r=new Set;super(mr(t,r),n),this.knownRecurringSeriesIds=r,this.changeListeners=new Set,this.historyDeleteSyncing=!1,this.historyHiddenIdsKey=`${this.storageKey}:history-hidden-ids`,this.historyHiddenMutationIdsKey=`${this.storageKey}:history-hidden-mutations`,this.historyHiddenSemanticKeysKey=`${this.storageKey}:history-hidden-semantic`,this.hiddenHistoryIds=Ut(this.storage,this.historyHiddenIdsKey),this.hiddenHistoryMutationIds=Ut(this.storage,this.historyHiddenMutationIdsKey),this.hiddenHistorySemanticKeys=Ut(this.storage,this.historyHiddenSemanticKeysKey),this.ensureHistoryIds(),queueMicrotask(()=>this.syncHistoryDeletes())}onChange(t){return this.changeListeners.add(t),()=>this.changeListeners.delete(t)}emitChange(){this.changeListeners.forEach(t=>{try{t()}catch{}})}getCachedEvents(t,n){let r=Ze(t,n);return super.getCachedEvents(r.startDate,r.endDate)}ensureHistoryIds(){let t=!1;this.history=this.history.map((n,r)=>{if(n?.historyId)return n;t=!0;let s=encodeURIComponent(T(n)).slice(0,180);return{...n,historyId:`local-legacy:${s}:${r}`}}),t&&this.persist()}persistHistoryDeletionState(){Vt(this.storage,this.historyHiddenIdsKey,this.hiddenHistoryIds),Vt(this.storage,this.historyHiddenMutationIdsKey,this.hiddenHistoryMutationIds),Vt(this.storage,this.historyHiddenSemanticKeysKey,this.hiddenHistorySemanticKeys)}markNewestLocalHistory(t){let n=this.history[0];n?.localOnly&&(this.history[0]={...n,historyId:`local:${t}`,mutationId:t},this.persist())}createEventOptimistic(t){let n=super.createEventOptimistic(t);return this.markNewestLocalHistory(n.mutationId),n}updateEventOptimistic(t,n){let r=super.updateEventOptimistic(t,n);return this.markNewestLocalHistory(r.mutationId),r}deleteEventOptimistic(t){let n=super.deleteEventOptimistic(t);return this.markNewestLocalHistory(n.mutationId),n}async refreshOneRange(t,n){let r=this.getCachedEvents(t,n);if(r.isFresh)return r.events;let s=await super.refreshEvents(t,n);return this.emitChange(),s}async prefetchCurrentAndNextMonth(){let t=new Date(this.now()),n=[zt(t),zt(P(t,1))];for(let r of n)try{await this.refreshOneRange(r.startDate,r.endDate)}catch{}return this.getCachedEvents(n[0].startDate,n[1].endDate).events}async refreshEvents(t,n){if(tn(t,n)>cr)return this.prefetchCurrentAndNextMonth();let r=Ze(t,n);return this.refreshOneRange(r.startDate,r.endDate)}async refreshHistory(){let t=await this.source.listHistory(Qe);t.forEach(s=>{let i=s.mutationId&&this.hiddenHistoryMutationIds.has(String(s.mutationId)),o=T(s),a=this.hiddenHistorySemanticKeys.has(o);!i&&!a||(s.historyId&&this.hiddenHistoryIds.add(String(s.historyId)),i&&this.hiddenHistoryMutationIds.delete(String(s.mutationId)),a&&this.hiddenHistorySemanticKeys.delete(o))});let n=this.history.filter(s=>!(!s.localOnly||s.historyId&&this.hiddenHistoryIds.has(String(s.historyId))||s.mutationId&&this.hiddenHistoryMutationIds.has(String(s.mutationId))||this.hiddenHistorySemanticKeys.has(T(s)))),r=new Set;return this.history=[...t,...n].filter(s=>{if(s.historyId&&this.hiddenHistoryIds.has(String(s.historyId))||s.mutationId&&this.hiddenHistoryMutationIds.has(String(s.mutationId))||this.hiddenHistorySemanticKeys.has(T(s)))return!1;let i=s.mutationId?`mutation:${s.mutationId}`:`semantic:${T(s)}`;return r.has(i)?!1:(r.add(i),!0)}).slice(0,Qe),this.persist(),this.persistHistoryDeletionState(),this.emitChange(),queueMicrotask(()=>this.syncHistoryDeletes()),this.history}deleteHistoryOptimistic(t){let n=new Set((Array.isArray(t)?t:[t]).map(String).filter(Boolean));if(!n.size)return[];let r=this.history.filter(s=>n.has(String(s.historyId||"")));return r.forEach(s=>{let i=String(s.historyId||"");hr(i)?s.mutationId?this.hiddenHistoryMutationIds.add(String(s.mutationId)):this.hiddenHistorySemanticKeys.add(T(s)):this.hiddenHistoryIds.add(i)}),this.history=this.history.filter(s=>!n.has(String(s.historyId||""))),this.persist(),this.persistHistoryDeletionState(),this.emitChange(),queueMicrotask(()=>this.syncHistoryDeletes()),r}async syncHistoryDeletes(){if(this.historyDeleteSyncing||!this.hiddenHistoryIds.size||typeof navigator<"u"&&navigator.onLine===!1||typeof this.source.deleteHistory!="function")return;this.historyDeleteSyncing=!0;let t=[...this.hiddenHistoryIds];try{await this.source.deleteHistory(t),t.forEach(n=>this.hiddenHistoryIds.delete(n)),this.persistHistoryDeletionState()}catch{}finally{this.historyDeleteSyncing=!1}}rollback(t,n){let r=this.outbox.slice(1).filter(s=>s.targetId===t.targetId);if(t.kind==="create"&&r.length){let s=new Set(r.map(i=>i.id));this.outbox=this.outbox.filter(i=>!s.has(i.id))}if(t.kind==="update"&&r.length){this.outbox=this.outbox.filter(s=>s.id!==t.id),this.persist(),this.emitChange();return}super.rollback(t,n),this.emitChange()}async syncNow(){if(!this.syncing){if(!this.outbox.length){this.syncHistoryDeletes();return}if(!(typeof navigator<"u"&&navigator.onLine===!1)){this.syncing=!0,clearTimeout(this.retryTimer);try{for(;this.outbox.length;){let t=this.outbox[0];if(t.nextAttemptAt&&t.nextAttemptAt>this.now()){let n=Math.max(50,t.nextAttemptAt-this.now());clearTimeout(this.retryTimer),this.retryTimer=setTimeout(()=>this.syncNow(),n);break}try{await this.syncOperation(t),this.outbox.shift(),this.persist(),this.emitChange()}catch(n){if(n?.retryable!==!1){this.scheduleRetry(t,n);break}this.rollback(t,n)}}}finally{this.syncing=!1}this.syncHistoryDeletes(),!this.outbox.length&&(this.hiddenHistoryMutationIds.size||this.hiddenHistorySemanticKeys.size)&&this.refreshHistory().catch(()=>{})}}}};var Jt=50,pr="Google\u30AB\u30EC\u30F3\u30C0\u30FC\u76F4\u63A5\u64CD\u4F5C";function en(e,t){try{let n=JSON.parse(e?.getItem(t)||"[]");return new Set(Array.isArray(n)?n.map(String):[])}catch{return new Set}}function nn(e,t,n){try{e?.setItem(t,JSON.stringify([...n]))}catch{}}function sn(e){let t=String(e||"");if(!t)return"";let n=NaN;if(/Z$/.test(t))n=Date.parse(t);else{let r=t.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);r&&(n=Date.parse(`${r[1]}-${r[2]}-${r[3]}T${r[4]}:${r[5]}:00+09:00`))}return Number.isFinite(n)?String(Math.floor(n/6e4)):t.slice(0,16)}function tt(e){return[e?.action||"",e?.customerName||"",e?.startAt||"",e?.endAt||"",sn(e?.timestamp)].join("|")}function rn(e){let t=sn(e?.timestamp);return/^\d+$/.test(t)?Number(t):0}function jt(e){let t=String(e?.historyId||"");return!!(t&&!t.startsWith("local:")&&!t.startsWith("local-legacy:"))}function Xt(e,t,n=()=>!1){let r=[...Array.isArray(e)?e:[],...Array.isArray(t)?t:[]],s=new Set,i=new Set,o=new Set,a=[];return r.forEach(c=>{if(!c||n(c))return;let d=String(c.mutationId||""),l=String(c.historyId||""),h=tt(c);d&&s.has(d)||l&&i.has(l)||h&&o.has(h)||(d&&s.add(d),l&&i.add(l),h&&o.add(h),a.push(c))}),a.sort((c,d)=>rn(d)-rn(c)).slice(0,Jt)}var vt=class extends bt{constructor(t,n={}){super(t,n),this.historyPendingDeleteIdsKey=`${this.storageKey}:history-pending-delete-ids-v2`,this.historyHiddenLegacyKeysKey=`${this.storageKey}:history-hidden-legacy-ops-v2`,this.historyMigrationKey=`${this.storageKey}:history-migration-v2`,this.pendingHistoryDeleteIds=en(this.storage,this.historyPendingDeleteIdsKey),this.hiddenHistoryLegacyKeys=en(this.storage,this.historyHiddenLegacyKeysKey),this.hiddenHistoryIds.forEach(r=>this.pendingHistoryDeleteIds.add(r)),this.migrateHistoryV2(),this.persistHistoryV2State(),queueMicrotask(()=>this.syncHistoryDeletes())}persistHistoryV2State(){this.persistHistoryDeletionState(),nn(this.storage,this.historyPendingDeleteIdsKey,this.pendingHistoryDeleteIds),nn(this.storage,this.historyHiddenLegacyKeysKey,this.hiddenHistoryLegacyKeys)}migrateHistoryV2(){if(this.storage?.getItem(this.historyMigrationKey)==="done")return;let t=this.history.filter(r=>jt(r)),n=this.history.filter(r=>!jt(r));this.history=Xt(t,n,r=>this.isHistoryHidden(r)),this.persist();try{this.storage?.setItem(this.historyMigrationKey,"done")}catch{}}isHistoryHidden(t){let n=String(t?.historyId||""),r=String(t?.mutationId||"");return!!(n&&this.hiddenHistoryIds.has(n)||r&&this.hiddenHistoryMutationIds.has(r)||this.hiddenHistorySemanticKeys.has(T(t))||this.hiddenHistoryLegacyKeys.has(tt(t)))}hideHistoryEntry(t,{queueServerDelete:n=!0}={}){if(!t)return;let r=String(t.historyId||""),s=String(t.mutationId||""),i=tt(t);r&&jt(t)&&(this.hiddenHistoryIds.add(r),n&&this.pendingHistoryDeleteIds.add(r)),s&&this.hiddenHistoryMutationIds.add(s),i&&this.hiddenHistoryLegacyKeys.add(i),this.hiddenHistorySemanticKeys.add(T(t))}isLegacyRecurringAudit(t){if(t?.source!==pr||t?.action!=="\u5909\u66F4")return!1;let n=String(t?.id||"");return!!(n&&this.knownRecurringSeriesIds.has(n))}purgeKnownRecurringHistory(){let t=!1;this.history.forEach(n=>{this.isLegacyRecurringAudit(n)&&(this.hideHistoryEntry(n),t=!0)}),t&&(this.history=this.history.filter(n=>!this.isLegacyRecurringAudit(n)),this.persist(),this.persistHistoryV2State(),this.emitChange(),queueMicrotask(()=>this.syncHistoryDeletes()))}async refreshOneRange(t,n){let r=await super.refreshOneRange(t,n),s=!1;return r.forEach(i=>{if(!i?.isRecurring)return;let o=String(i.calendarEventId||i.id||"");!o||this.knownRecurringSeriesIds.has(o)||(this.knownRecurringSeriesIds.add(o),s=!0)}),s&&this.purgeKnownRecurringHistory(),r}async refreshHistory(){let t=await this.source.listHistory(Jt),n=[];t.forEach(s=>{if(this.isLegacyRecurringAudit(s)||this.isHistoryHidden(s)){this.hideHistoryEntry(s);return}n.push(s)});let r=this.history.filter(s=>s.localOnly&&!this.isHistoryHidden(s));return this.history=Xt(n,r,s=>this.isHistoryHidden(s)),this.persist(),this.persistHistoryV2State(),this.emitChange(),queueMicrotask(()=>this.syncHistoryDeletes()),this.history}deleteHistoryOptimistic(t){let n=new Set((Array.isArray(t)?t:[t]).map(String).filter(Boolean));if(!n.size)return[];let r=this.history.filter(s=>n.has(String(s.historyId||"")));return r.forEach(s=>this.hideHistoryEntry(s)),this.history=this.history.filter(s=>!n.has(String(s.historyId||""))),this.persist(),this.persistHistoryV2State(),this.emitChange(),queueMicrotask(()=>this.syncHistoryDeletes()),r}promoteMutationHistory(t,n){let r=String(t||"");if(!r)return;let s=this.history.find(a=>String(a.mutationId||"")===r);if(this.hiddenHistoryMutationIds.has(r)||s&&this.isHistoryHidden(s)){n&&this.hideHistoryEntry({...n,mutationId:n.mutationId||r}),this.history=this.history.filter(a=>String(a.mutationId||"")!==r),this.persist(),this.persistHistoryV2State(),queueMicrotask(()=>this.syncHistoryDeletes());return}if(!n)return;let i={...n,mutationId:n.mutationId||r,localOnly:!1},o=tt(i);this.history=this.history.filter(a=>String(a.mutationId||"")!==r&&tt(a)!==o),this.history=Xt([i],this.history,a=>this.isHistoryHidden(a)),this.persist()}async syncHistoryDeletes(){if(this.historyDeleteSyncing||!this.pendingHistoryDeleteIds.size||typeof navigator<"u"&&navigator.onLine===!1||typeof this.source.deleteHistory!="function"&&typeof this.source.deleteHistoryResult!="function")return;this.historyDeleteSyncing=!0;let t=[...this.pendingHistoryDeleteIds].slice(0,Jt);try{let n=[];if(typeof this.source.deleteHistoryResult=="function"){let r=await this.source.deleteHistoryResult(t);n=r?.acknowledged||r?.deleted||[]}else n=await this.source.deleteHistory(t);n.map(String).forEach(r=>this.pendingHistoryDeleteIds.delete(r)),this.persistHistoryV2State()}catch{}finally{this.historyDeleteSyncing=!1}}async syncOperation(t){if(t.kind==="create"){let n=typeof this.source.createEventWithHistory=="function"?await this.source.createEventWithHistory(t.input,{mutationId:t.id}):{event:await this.source.createEvent(t.input,{mutationId:t.id}),history:null},r=n.event,s=t.targetId,i=this.outbox.slice(1).filter(a=>a.targetId===s);this.rewriteTargetId(s,r.id);let o=this.getEventCached(s);this.removeRecord(s),i.some(a=>a.kind==="delete")||this.upsertRecord(i.length&&o?{...o,id:r.id,syncState:"pending",source:"local-first"}:{...r,syncState:void 0}),this.promoteMutationHistory(t.id,n.history);return}if(t.kind==="update"){let n=typeof this.source.updateEventWithHistory=="function"?await this.source.updateEventWithHistory(t.targetId,t.input,{mutationId:t.id}):{event:await this.source.updateEvent(t.targetId,t.input,{mutationId:t.id}),history:null};this.outbox.slice(1).some(s=>s.targetId===t.targetId)||this.upsertRecord({...n.event,syncState:void 0}),this.promoteMutationHistory(t.id,n.history);return}if(t.kind==="delete"){let n=typeof this.source.deleteEventWithHistory=="function"?await this.source.deleteEventWithHistory(t.targetId,{mutationId:t.id}):(await this.source.deleteEvent(t.targetId,{mutationId:t.id}),{history:null});this.promoteMutationHistory(t.id,n.history)}}};function gr(e,t){let n=Date.parse(`${e}T00:00:00Z`),r=Date.parse(`${t}T00:00:00Z`);return!Number.isFinite(n)||!Number.isFinite(r)?0:Math.round((r-n)/864e5)}function yr(e,{windowRef:t=globalThis.window,timeout:n=1200,fallbackDelay:r=350}={}){if(typeof t?.requestIdleCallback=="function"){let i=t.requestIdleCallback(e,{timeout:n});return()=>t.cancelIdleCallback?.(i)}let s=globalThis.setTimeout(e,r);return()=>globalThis.clearTimeout(s)}function on(e,{windowRef:t=globalThis.window}={}){let n=!1,r=null,s=!1,i=(o,a={})=>yr(o,{windowRef:t,...a});return new Proxy(e,{get(o,a,c){if(a==="refreshEvents")return(l,h)=>gr(l,h)>90?(s||(s=!0,i(()=>{s=!1,o.refreshEvents(l,h).catch(()=>{})},{timeout:900,fallbackDelay:250})),Promise.resolve(o.getCachedEvents(l,h)?.events||[])):o.refreshEvents(l,h);if(a==="refreshHistory")return(...l)=>{let h=/^#\/history(?:$|[/?])/.test(String(t?.location?.hash||""));return!n&&!h?(n=!0,r=i(()=>{r=null,o.refreshHistory(...l).catch(()=>{})},{timeout:1600,fallbackDelay:700}),Promise.resolve(o.getCachedHistory?.()||[])):(r&&(r(),r=null),o.refreshHistory(...l))};let d=Reflect.get(o,a,c);return typeof d=="function"?d.bind(o):d}})}function an(){return window.location.protocol==="file:"&&!window.TAMAFIT_USE_LIVE_CALENDAR?new mt(new ht,{storageKey:"tamafit_staff_calendar_mock_cache_v1"}):on(new vt(new F,{storageKey:"tamafit_staff_calendar_local_first_v1"}))}function u(e){return String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function v(e){return u(e)}var cn="tamafit_staff_calendar_local_first_v1",br=36,vr={tamai:"??",obayashi:"??"},p={phase:"idle",checkedAt:0,fingerprint:"",results:[],checkedCount:0,error:""},et=null;function Qt(e){let t=String(e?.startAt||"").slice(0,10);return/^\d{4}-\d{2}-\d{2}$/.test(t)?t:""}function wr(e){if(!e)throw new Error("??????????????????");let t=n=>{let r=e.getItem(n);if(r===null)return[];let s=JSON.parse(r);if(!Array.isArray(s))throw new Error("???????????????????");return s};return{records:t(cn+":records"),outbox:t(cn+":outbox")}}function St(e){return JSON.stringify([e.records,e.outbox])}function Sr(e){let t=[...new Set(e.map(Qt).filter(Boolean).map(r=>r.slice(0,7)))].sort();if(t.length>br)throw new Error("???????????????????????????");let n=[];for(let r of t){let s=n.at(-1),i=s?new Date(Date.UTC(+s.last.slice(0,4),+s.last.slice(5,7),1)).toISOString().slice(0,7):"";s&&r===i&&s.count<3?(s.last=r,s.count+=1):n.push({first:r,last:r,count:1})}return n.map(({first:r,last:s})=>({startDate:r+"-01",endDate:new Date(Date.UTC(+s.slice(0,4),+s.slice(5,7),0)).toISOString().slice(0,10)}))}function wt(e){return[String(e.startAt||""),String(e.endAt||""),String(e.customerName||"").trim(),String(e.trainerId||""),String(e.type||"")].join("|")}function Ir(e,t){let n=new Map(t.map(a=>[String(a.id),a])),r=new Set;for(let a of e.records)Qt(a)&&a?.id&&n.has(String(a.id))&&r.add(String(a.id));let s=new Map;for(let a of t){if(r.has(String(a.id)))continue;let c=wt(a);s.has(c)||s.set(c,[]),s.get(c).push(a)}let i=new Set(e.outbox.map(a=>String(a?.targetId||""))),o=[];for(let a of e.records){if(!Qt(a)||!a?.id)continue;let c=n.get(String(a.id)),d=i.has(String(a.id))||a.syncState==="pending"||String(a.id).startsWith("local:");if(c)wt(a)!==wt(c)&&o.push({kind:"different",local:a,remote:c,pending:d});else{let l=s.get(wt(a));l?.length?l.shift():o.push({kind:"missing",local:a,remote:null,pending:d})}}return o.sort((a,c)=>String(a.local.startAt).localeCompare(String(c.local.startAt)))}function Zt(){return wr(globalThis.localStorage)}function Er(e){return e.map(({kind:t,local:n,remote:r,pending:s})=>{let i=String(n.startAt||""),o=String(n.endAt||""),a=vr[n.trainerId]||"?????",c=t==="missing"?"Google?????????":"Google???????",d=r?`<p class="booking-audit__remote">Google??${u(r.customerName||"????")} / ${u(String(r.startAt||"").slice(11,16))}?${u(String(r.endAt||"").slice(11,16))}</p>`:"";return`<li class="booking-audit__item">
      <div><strong>${u(i.slice(0,10).replaceAll("-","/"))} ${u(i.slice(11,16))}?${u(o.slice(11,16))}</strong>
      <span class="booking-audit__label">${c}</span></div>
      <div>${u(n.customerName||"????")} / ${u(a)}${s?' <strong class="booking-audit__pending">?????????????</strong>':""}</div>
      ${d}
    </li>`}).join("")}var dn=`<style>
.booking-audit{margin:24px 0 16px;padding:16px;border:1px solid #d2ded6;border-radius:14px;background:#f7faf8;color:#22352a;font-size:13px;line-height:1.65}
.booking-audit h2{font-size:16px;margin:0 0 5px}
.booking-audit p{margin:5px 0}
.booking-audit__muted{color:#5e6f65}
.booking-audit__button{margin:11px 0 4px;padding:9px 16px;min-height:42px;border:1px solid #17814a;border-radius:8px;background:#fff;color:#086039;font-size:14px;font-weight:750}
.booking-audit__button:disabled{opacity:.6}
.booking-audit__list{list-style:none;margin:10px 0;padding:0;display:grid;gap:8px}
.booking-audit__item{padding:10px;background:white;border:1px solid #e3d4ad;border-left:4px solid #ca8d2c;border-radius:8px;overflow-wrap:anywhere}
.booking-audit__item strong{font-weight:750}
.booking-audit__label{margin-left:8px;color:#926315;font-weight:800}
.booking-audit__pending{color:#9c3c2f;font-size:12px}
.booking-audit__remote{color:#7e4b13}
.booking-audit__warning{padding:9px 11px;border-radius:8px;background:#fff1df;color:#7b391c}
.booking-audit__error{padding:9px 11px;border-radius:8px;background:#fff0f0;color:#8b2525}
.booking-audit__success{font-weight:750;color:#0e6e41}
</style>`;function te(){let e;try{e=Zt()}catch(s){return`<section class="booking-audit" data-booking-audit>${dn}<h2>???Google???????????</h2><p class="booking-audit__error">${u(s.message||"?????????????????")}</p></section>`}let t=p.checkedAt&&p.fingerprint!==St(e),n=p.phase==="checking"?'<p role="status">Google??????????????</p>':p.phase==="error"?`<p class="booking-audit__error" role="alert">???????????${u(p.error)}???????????????????</p>`:p.checkedAt&&t?'<p class="booking-audit__warning">??????????????????????????????</p>':p.checkedAt&&p.results.length?`<p class="booking-audit__warning" role="status">?????????Google?? ${p.results.length} ?????????</p><ul class="booking-audit__list">${Er(p.results)}</ul>`:p.checkedAt?`<p class="booking-audit__success" role="status">??????????? ${p.checkedCount} ????????????????</p>`:"<p>???????????</p>",r=p.checkedAt?new Date(p.checkedAt).toLocaleString("ja-JP",{timeZone:"Asia/Tokyo"}):"";return`<section class="booking-audit" data-booking-audit aria-label="Google??????">
    ${dn}
    <h2>???Google???????????</h2>
    <p class="booking-audit__muted">??????????????? ${e.records.length} ??Google??????????????????????????????????????????</p>
    <button class="booking-audit__button" type="button" data-action="run-booking-audit" ${p.phase==="checking"?"disabled":""}>Google?????</button>
    ${r?`<p class="booking-audit__muted">?????${u(r)}?Google?????20??????????????</p>`:""}
    ${n}
    <p class="booking-audit__muted">???????????????????????????</p>
    ${p.results.some(s=>s.pending)&&!t&&p.phase!=="error"?'<p class="booking-audit__warning">????????????????????????????????????????????????????????</p>':""}
  </section>`}async function ln(e){if(et)return et;let t;try{t=Zt()}catch(n){p={...p,phase:"error",error:n.message||"?????????????????"},e();return}return p={...p,phase:"checking",error:"",results:[]},e(),et=(async()=>{try{let n=Sr(t.records),r=new F,s=await Promise.all(n.map(({startDate:a,endDate:c})=>r.listEvents(a,c))),i=Zt();if(St(t)!==St(i))throw new Error("????????????????????????????????");let o=s.flat();p={phase:"done",results:Ir(t,o),checkedCount:t.records.length,checkedAt:Date.now(),fingerprint:St(t),error:""}}catch(n){p={...p,phase:"error",error:n.message||"??????????"}}finally{et=null,e()}})(),et}function A(e,{title:t=Me,subtitle:n="\u30B9\u30BF\u30C3\u30D5\u30AB\u30EC\u30F3\u30C0\u30FC",backAction:r="",showAdd:s=!0,isRefreshing:i=!1}={}){let o=_();return`
    <div class="app-shell">
      <header class="app-header">
        <div class="app-header__inner">
          ${r?`
            <button class="icon-button" type="button" data-action="${r}" aria-label="\u524D\u306E\u753B\u9762\u3078\u623B\u308B">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div class="app-header__copy">
              <span>${n}</span>
              <strong>${t}</strong>
            </div>
          `:`
            <button class="header-home" type="button" data-action="go-home" aria-label="\u30DB\u30FC\u30E0\u306B\u623B\u308B">
              <span class="brand-mark" aria-hidden="true">T</span>
              <span class="app-header__copy">
                <span>${n}</span>
                <strong>${t}</strong>
              </span>
            </button>
          `}
          ${i?'<span class="refresh-status" role="status"><i aria-hidden="true"></i>\u66F4\u65B0\u4E2D</span>':""}
          ${s?`
            <button class="header-add-button" type="button" data-action="new-booking" aria-label="\u4E88\u7D04\u3092\u8FFD\u52A0">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          `:'<span class="app-header__spacer" aria-hidden="true"></span>'}
        </div>
      </header>
      <main class="app-main">${e}</main>
      <footer class="app-footer">
        <button class="operator-setting" type="button" data-action="change-operator">
          <span>\u3053\u306E\u7AEF\u672B\u306E\u64CD\u4F5C\u8005</span>
          <strong>${o?.name||"\u672A\u8A2D\u5B9A"}</strong>
          <small>\u5909\u66F4</small>
        </button>
      </footer>
    </div>
  `}function ee(e){return A(`
    <section class="state-panel">
      <span class="state-panel__icon" aria-hidden="true">!</span>
      <h2>\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F</h2>
      <p>${e}</p>
      <button class="button button--primary" type="button" data-action="reload">\u3082\u3046\u4E00\u5EA6\u8A66\u3059</button>
    </section>
  `)}function ne({event:e=null,defaultDate:t,defaultTrainerId:n="tamai"}){let r=!!e,s=e?Lt(e.startAt):{date:t,time:"10:00"},i=e?.type||"member",o=e?e.trainerId:n,a=He(Oe,Le,Re),c=`
    <section class="booking-form-view">
      <div class="form-heading">
        <p class="eyebrow">${r?"\u4E88\u7D04\u5185\u5BB9\u306E\u5909\u66F4":"\u65B0\u3057\u3044\u4E88\u7D04"}</p>
        <h1>${r?"\u4E88\u7D04\u3092\u7DE8\u96C6":"\u4E88\u7D04\u3092\u8FFD\u52A0"}</h1>
        <p>\u4FDD\u5B58\u3059\u308B\u3068\u3059\u3050\u753B\u9762\u306B\u53CD\u6620\u3055\u308C\u3001Google\u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u306E\u540C\u671F\u306F\u88CF\u5074\u3067\u884C\u308F\u308C\u307E\u3059\u3002</p>
      </div>

      <form class="booking-form" id="bookingForm" data-event-id="${v(e?.id||"")}">
        <div class="field field--full">
          <label for="customerName">\u304A\u5BA2\u69D8\u540D\u30FB\u4E88\u5B9A\u540D</label>
          <input id="customerName" name="customerName" type="text" value="${v(e?.customerName||"")}" placeholder="\u4F8B\uFF1A\u5C71\u7530 \u82B1\u5B50" autocomplete="off" required>
          <small>\u4E88\u7D04\u30D6\u30ED\u30C3\u30AF\u30FB\u4EEE\u4E88\u7D04\u67A0\u30FB\u30A4\u30D9\u30F3\u30C8\u3067\u306F\u3001\u7528\u9014\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002</small>
        </div>

        <div class="field field--full">
          <label for="trainerId">\u62C5\u5F53\u30C8\u30EC\u30FC\u30CA\u30FC</label>
          <div class="select-wrap">
            <select id="trainerId" name="trainerId">
              <option value="" ${o===""?"selected":""}>\u6307\u5B9A\u306A\u3057\uFF08\u5171\u901A\u4E88\u5B9A\uFF09</option>
              ${I.map(d=>`<option value="${d.id}" ${o===d.id?"selected":""}>${u(d.name)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="bookingDate">\u4E88\u7D04\u65E5</label>
          <input id="bookingDate" name="date" type="date" value="${v(s.date)}" required>
        </div>

        <div class="field">
          <label for="bookingTime">\u958B\u59CB\u6642\u9593</label>
          <div class="select-wrap">
            <select id="bookingTime" name="time" required>
              ${a.map(d=>`<option value="${d}" ${s.time===d?"selected":""}>${d}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="duration">\u6240\u8981\u6642\u9593</label>
          <div class="select-wrap">
            <select id="duration" name="duration" required>
              ${Ne.map(d=>`<option value="${d}" ${(e?.duration||60)===d?"selected":""}>${d}\u5206</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="bookingType">\u4E88\u7D04\u7A2E\u985E</label>
          <div class="select-wrap">
            <select id="bookingType" name="type" required>
              ${J.map(d=>`<option value="${d.id}" ${i===d.id?"selected":""}>${u(d.name)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field field--full">
          <label for="notes">\u30E1\u30E2 <span>\u4EFB\u610F</span></label>
          <textarea id="notes" name="notes" rows="3" placeholder="\u5F53\u65E5\u306E\u6CE8\u610F\u70B9\u3084\u7533\u3057\u9001\u308A">${u(e?.notes||"")}</textarea>
        </div>

        <div class="form-message" id="formMessage" role="alert"></div>

        <div class="form-actions">
          ${r?`<button class="button button--danger" type="button" data-action="delete-booking" data-id="${v(e.id)}">\u4E88\u7D04\u3092\u524A\u9664</button>`:""}
          <button class="button button--primary ${r?"":"button--wide"}" type="submit">${r?"\u5909\u66F4\u3092\u4FDD\u5B58":"\u4E88\u7D04\u3059\u308B"}</button>
        </div>
      </form>
    </section>
  `;return A(c,{title:r?"\u4E88\u7D04\u3092\u7DE8\u96C6":"\u4E88\u7D04\u3092\u8FFD\u52A0",subtitle:"\u30B9\u30BF\u30C3\u30D5\u30AB\u30EC\u30F3\u30C0\u30FC",backAction:"back-from-form",showAdd:!1})}function _r(e){let t=I.find(a=>a.id===e.trainerId),n=Ue(e.type),r=["member","trial","consultation"].includes(e.type),s=e.type==="trial"?"amber":t?.color||"neutral",i=!!e.isRecurring,o=i?'aria-disabled="true" title="\u7E70\u308A\u8FD4\u3057\u4E88\u5B9A\u306FGoogle\u30AB\u30EC\u30F3\u30C0\u30FC\u304B\u3089\u7DE8\u96C6\u3057\u3066\u304F\u3060\u3055\u3044"':`data-action="edit-booking" data-id="${e.id}"`;return`
    <button class="day-event day-event--${s}${i?" is-readonly":""}" type="button" ${o}>
      <span class="day-event__time">
        <strong>${e.startAt.slice(11,16)}</strong>
        <small>${e.endAt.slice(11,16)}</small>
      </span>
      <span class="day-event__line" aria-hidden="true"></span>
      <span class="day-event__content">
        <span class="day-event__badges">
          <small>${u(t?.name||"\u6307\u5B9A\u306A\u3057")}</small>
          <small>${u(n.name)}</small>
          ${i?"<small>\u5B9A\u671F</small>":""}
        </span>
        <strong>${u(r?`${e.customerName} \u69D8`:e.customerName)}</strong>
        <span>${e.duration}\u5206${e.notes?`\u30FB${u(e.notes)}`:""}</span>
      </span>
      ${i?'<span class="sync-badge" aria-label="Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306E\u7E70\u308A\u8FD4\u3057\u4E88\u5B9A">\u5B9A\u671F</span>':`<span class="day-event__manage" aria-label="\u30BF\u30C3\u30D7\u3057\u3066\u5909\u66F4\u307E\u305F\u306F\u524A\u9664">
            <span class="day-event__manage-edit">\u5909\u66F4</span>
            <span class="day-event__manage-separator">\u30FB</span>
            <span class="day-event__manage-delete">\u524A\u9664</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          </span>`}
    </button>
  `}function un(e,t){let n=f(e),r=`
    <section class="day-view">
      <div class="day-summary">
        <div>
          <p class="eyebrow">1\u65E5\u306E\u4E88\u7D04</p>
          <h1>${Ot(e)}</h1>
        </div>
        <span class="count-badge">${t.length}\u4EF6</span>
      </div>

      <div class="day-event-list">
        ${t.length?t.map(_r).join(""):`
          <div class="empty-day">
            <span aria-hidden="true">\u2713</span>
            <h2>\u4E88\u7D04\u306F\u3042\u308A\u307E\u305B\u3093</h2>
            <p>\u3053\u306E\u65E5\u306F\u307E\u3060\u3059\u3079\u3066\u306E\u6642\u9593\u3092\u8ABF\u6574\u3067\u304D\u307E\u3059\u3002</p>
          </div>
        `}
      </div>

      <button class="button button--wide day-add-button day-standard-booking-button" type="button" data-action="new-booking" data-date="${n}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        \u3053\u306E\u65E5\u306B\u4E88\u7D04\u3092\u8FFD\u52A0
      </button>
      <button class="button button--wide day-quick-booking-button" type="button" data-quick-booking data-date="${n}">
        <span class="day-quick-booking-button__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M13 2 5 14h7l-1 8 8-12h-7l1-8Z"/></svg>
        </span>
        <span class="day-quick-booking-button__copy">
          <strong>\u30AF\u30A4\u30C3\u30AF\u4E88\u7D04</strong>
          <small>\u65E5\u4ED8\u3068\u6642\u9593\u3060\u3051\u3067\u767B\u9332</small>
        </span>
        <svg class="day-quick-booking-button__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </section>
  `;return A(r,{title:"\u4E88\u7D04\u4E00\u89A7",subtitle:Ot(e),backAction:"back-to-calendar",showAdd:!1})}var hn=10;function It(e){return{\u4F5C\u6210:"\u65B0\u898F\u4E88\u7D04",\u5909\u66F4:"\u5185\u5BB9\u5909\u66F4",\u524A\u9664:"\u4E88\u7D04\u524A\u9664"}[e]||String(e||"\u64CD\u4F5C")}function re(e){return{\u4F5C\u6210:"create",\u5909\u66F4:"update",\u524A\u9664:"delete"}[e]||"other"}function Ar(e){let t=String(e||"").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);return t?{month:Number(t[2]),day:Number(t[3]),hour:t[4],minute:t[5]}:null}function Et(e){let t=String(e||"");if(!t)return"\u65E5\u6642\u4E0D\u660E";if(/Z$/.test(t)){let r=new Date(t);if(!Number.isNaN(r.getTime()))return new Intl.DateTimeFormat("ja-JP",{timeZone:"Asia/Tokyo",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:!1}).format(r)}let n=Ar(t);return n?`${n.month}/${n.day} ${n.hour}:${n.minute}`:t.slice(0,16)}function kr(e){let t=Et(e),n=t.match(/(\d{1,2}:\d{2})$/);return n?n[1]:t}function _t(e,t=hn){let n=(Array.isArray(e)?e:[]).slice(0,t),r=n.length?n.map(s=>`
        <div class="recent-history__row">
          <time>${u(kr(s.timestamp))}</time>
          <strong title="${v(s.customerName||"\u540D\u79F0\u306A\u3057")}">${u(s.customerName||"\u540D\u79F0\u306A\u3057")}</strong>
          <span>${u(It(s.action))}</span>
        </div>
      `).join(""):'<p class="recent-history__empty">\u64CD\u4F5C\u5C65\u6B74\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093</p>';return`
    <section class="recent-history" aria-label="\u6700\u8FD1\u306E\u64CD\u4F5C\u30ED\u30B0">
      <div class="recent-history__heading">
        <strong>\u6700\u8FD1\u306E\u64CD\u4F5C\u30ED\u30B0</strong>
        <span>${hn}\u4EF6</span>
      </div>
      <div class="recent-history__list">${r}</div>
      <button class="recent-history__more" type="button" data-action="open-history">
        \u5C65\u6B74\u3092\u3059\u3079\u3066\u898B\u308B
        <span aria-hidden="true">\u203A</span>
      </button>
    </section>
  `}function xr(e){let t=String(e.startAt||"").replace("T"," ").slice(0,16),n=String(e.endAt||"").slice(11,16);return`${t}\u301C${n}`}function $r(e){let t=String(e.historyId||""),n=!!t;return`
    <article class="history-entry history-entry--${re(e.action)} is-organizing-row" data-history-entry="${v(t)}">
      <label class="history-entry__organize-row">
        ${n?`
          <span class="history-entry__select" aria-label="\u3053\u306E\u5C65\u6B74\u3092\u9078\u629E">
            <input type="checkbox" data-history-select value="${v(t)}">
            <span aria-hidden="true"></span>
          </span>
        `:'<span class="history-entry__select-placeholder" aria-hidden="true"></span>'}
        <time>${u(Et(e.timestamp))}</time>
        <strong title="${v(e.customerName||"\u540D\u79F0\u306A\u3057")}">${u(e.customerName||"\u540D\u79F0\u306A\u3057")}</strong>
        <span>${u(It(e.action))}</span>
      </label>
    </article>
  `}function Tr(e,{organizing:t=!1}={}){if(t)return $r(e);let n=String(e.historyId||""),r=!!n;return`
    <details class="history-entry history-entry--${re(e.action)}" data-history-entry="${v(n)}">
      <summary class="history-entry__summary">
        <time>${u(Et(e.timestamp))}</time>
        <strong title="${v(e.customerName||"\u540D\u79F0\u306A\u3057")}">${u(e.customerName||"\u540D\u79F0\u306A\u3057")}</strong>
        <span>${u(It(e.action))}</span>
        <i aria-hidden="true">\u203A</i>
      </summary>
      <div class="history-entry__details">
        <div class="history-entry__details-line">
          <span>\u4E88\u7D04</span>
          <strong>${u(xr(e))}</strong>
        </div>
        <div class="history-entry__details-line">
          <span>\u64CD\u4F5C</span>
          <strong>${u(e.source||"\u4E0D\u660E")}</strong>
        </div>
        <div class="history-entry__details-line">
          <span>\u62C5\u5F53</span>
          <strong>${u(e.trainerName||"\u6307\u5B9A\u306A\u3057")}</strong>
        </div>
        <div class="history-entry__details-line">
          <span>\u7A2E\u985E</span>
          <strong>${u(e.typeName||"\u4E88\u5B9A")}</strong>
        </div>
        ${e.beforeSummary?`
          <div class="history-entry__details-line history-entry__before">
            <span>\u5909\u66F4\u524D</span>
            <strong>${u(e.beforeSummary)}</strong>
          </div>
        `:""}
        ${r?`
          <button class="history-entry__delete" type="button" data-action="delete-history-one" data-history-id="${v(n)}">\u3053\u306E\u8A18\u9332\u3092\u524A\u9664</button>
        `:""}
      </div>
    </details>
  `}function se(e,{organizing:t=!1}={}){let n=Array.isArray(e)?e:[],r=`
    <section class="history-view ${t?"is-organizing":""}">
      <div class="history-heading">
        <div class="history-heading__copy">
          <p class="eyebrow">\u4E88\u7D04\u64CD\u4F5C\u306E\u8A18\u9332</p>
          <h1>\u64CD\u4F5C\u5C65\u6B74</h1>
          <p>\u6700\u65B050\u4EF6\u3092\u65B0\u3057\u3044\u9806\u306B\u8868\u793A\u3057\u307E\u3059\u3002\u5C65\u6B74\u3092\u6D88\u3057\u3066\u3082\u4E88\u7D04\u81EA\u4F53\u306B\u306F\u5F71\u97FF\u3057\u307E\u305B\u3093\u3002</p>
        </div>
        ${n.length?`
          <button class="history-organize-button" type="button" data-action="${t?"history-organize-cancel":"history-organize"}">
            ${t?"\u5B8C\u4E86":"\u5C65\u6B74\u3092\u6574\u7406"}
          </button>
        `:""}
      </div>
      <div class="history-list">
        ${n.length?n.map(s=>Tr(s,{organizing:t})).join(""):`
          <div class="empty-day">
            <span aria-hidden="true">i</span>
            <h2>\u64CD\u4F5C\u5C65\u6B74\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093</h2>
            <p>\u4E88\u7D04\u3092\u8FFD\u52A0\u30FB\u5909\u66F4\u30FB\u524A\u9664\u3059\u308B\u3068\u3001\u3053\u3053\u306B\u8A18\u9332\u3055\u308C\u307E\u3059\u3002</p>
          </div>
        `}
      </div>
      ${t&&n.length?`
        <div class="history-selection-bar">
          <span><strong data-history-selected-count>0</strong>\u4EF6\u3092\u9078\u629E</span>
          <button type="button" data-action="delete-history-selected" disabled>\u9078\u629E\u3057\u305F\u5C65\u6B74\u3092\u524A\u9664</button>
        </div>
      `:""}
    </section>
  `;return A(r,{title:"\u64CD\u4F5C\u5C65\u6B74",subtitle:"\u30B9\u30BF\u30C3\u30D5\u30AB\u30EC\u30F3\u30C0\u30FC",backAction:"back-to-calendar",showAdd:!1})}function Dr(e){return e.reduce((t,n)=>{let r=n.startAt.slice(0,10);return t[r]||=[],t[r].push(n),t},{})}function Hr(e){let t=I.find(i=>i.id===e.trainerId),n=e.startAt.slice(11,16),r=Array.from(e.customerName.split(/[ 　]/)[0]).slice(0,2).join("");return`
    <span class="month-event month-event--${e.type==="trial"?"amber":t?.color||"neutral"}" title="${v(`${n} ${e.customerName}`)}">
      <b>${u(n)}</b><span>${u(r)}</span>
    </span>
  `}function fn(e,t,n=[]){let r=dt(e),s=Dr(t),i=e.getMonth(),o=r.map(c=>{let d=f(c),l=s[d]||[],h=l.slice(0,Be),S=l.length-h.length,g=["month-cell"];return c.getMonth()!==i&&g.push("is-outside"),ut(c)&&g.push("is-today"),c.getDay()===0&&g.push("is-sunday"),c.getDay()===6&&g.push("is-saturday"),`
      <button class="${g.join(" ")}" type="button" data-action="open-day" data-date="${d}" aria-label="${c.getMonth()+1}\u6708${c.getDate()}\u65E5\u3001\u4E88\u7D04${l.length}\u4EF6">
        <span class="month-cell__date">${c.getDate()}</span>
        <span class="month-cell__events">
          ${h.map(Hr).join("")}
          ${S>0?`<span class="month-event-more">\u307B\u304B${S}\u4EF6</span>`:""}
        </span>
      </button>
    `}).join(""),a=`
    <section class="calendar-view" aria-labelledby="calendarTitle">
      <div class="calendar-toolbar">
        <div class="calendar-toolbar__month-nav">
          <button class="icon-button icon-button--subtle" type="button" data-action="previous-month" aria-label="\u524D\u306E\u6708">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 id="calendarTitle">${xe(e)}</h1>
          <button class="icon-button icon-button--subtle" type="button" data-action="next-month" aria-label="\u6B21\u306E\u6708">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
        <button class="today-button" type="button" data-action="today">\u4ECA\u6708\u3078\u623B\u308B</button>
      </div>

      <div class="view-switch" aria-label="\u30AB\u30EC\u30F3\u30C0\u30FC\u8868\u793A">
        <button class="is-active" type="button" data-action="show-month" aria-pressed="true">\u6708\u9593</button>
        <button type="button" data-action="show-week" aria-pressed="false">\u9031\u9593</button>
      </div>

      <div class="month-calendar" data-month="${w(e)}">
        <div class="weekday-row" aria-hidden="true">
          ${at.map((c,d)=>`<span class="${d===0?"is-sunday":d===6?"is-saturday":""}">${c}</span>`).join("")}
        </div>
        <div class="month-grid">${o}</div>
      </div>

      ${_t(n)}

      <div class="calendar-legend" aria-label="\u62C5\u5F53\u30C8\u30EC\u30FC\u30CA\u30FC\u306E\u8272\u5206\u3051">
        ${I.map(c=>`<span><i class="legend-dot legend-dot--${c.color}"></i>${u(c.name)}</span>`).join("")}
        <span><i class="legend-dot legend-dot--amber"></i>\u4F53\u9A13</span>
      </div>
    </section>
  `;return A(a)}function Mr(e){return e.reduce((t,n)=>{let r=n.startAt.slice(0,10);return t[r]||=[],t[r].push(n),t},{})}function Cr(e){let t=I.find(r=>r.id===e.trainerId);return`
    <div class="week-event week-event--${e.type==="trial"?"amber":t?.color||"neutral"}">
      <time>${e.startAt.slice(11,16)}</time>
      <span class="week-event__main">
        <strong>${u(e.customerName)}</strong>
        <small>${u(t?.name||"\u6307\u5B9A\u306A\u3057")}\u30FB${e.duration}\u5206</small>
      </span>
    </div>
  `}function mn(e,t,n=[]){let r=j(e),s=Mr(t),i=r.map(a=>{let c=f(a),d=s[c]||[];return`
      <article class="week-day ${ut(a)?"is-today":""}">
        <button class="week-day__header" type="button" data-action="open-day" data-date="${c}">
          <span>${$e(a)}</span>
          <small>${d.length?`${d.length}\u4EF6`:"\u4E88\u7D04\u306A\u3057"}</small>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        <div class="week-day__events">
          ${d.length?d.map(Cr).join(""):'<p class="week-day__empty">\u4E88\u7D04\u306F\u3042\u308A\u307E\u305B\u3093</p>'}
        </div>
      </article>
    `}).join(""),o=`
    <section class="calendar-view">
      <div class="calendar-toolbar">
        <div class="calendar-toolbar__month-nav">
          <button class="icon-button icon-button--subtle" type="button" data-action="previous-week" aria-label="\u524D\u306E\u9031">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1>${Te(e)}</h1>
          <button class="icon-button icon-button--subtle" type="button" data-action="next-week" aria-label="\u6B21\u306E\u9031">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
        <button class="today-button" type="button" data-action="go-home">\u4ECA\u6708\u3078\u623B\u308B</button>
      </div>

      <div class="view-switch" aria-label="\u30AB\u30EC\u30F3\u30C0\u30FC\u8868\u793A">
        <button type="button" data-action="show-month" aria-pressed="false">\u6708\u9593</button>
        <button class="is-active" type="button" data-action="show-week" aria-pressed="true">\u9031\u9593</button>
      </div>

      <div class="week-list">${i}</div>
      ${_t(n)}
    </section>
  `;return A(o)}var y=document.getElementById("app"),m=an(),nt=document.getElementById("pwaInstallDialog"),kt="",ie=!1,B=!1,oe=!1;function Nr(){let e=document.getElementById("operatorDialog");return e||(document.body.insertAdjacentHTML("beforeend",`
    <dialog class="operator-dialog" id="operatorDialog">
      <div class="operator-dialog__body">
        <p class="eyebrow">\u3053\u306E\u7AEF\u672B\u3092\u8A2D\u5B9A</p>
        <h2>\u64CD\u4F5C\u8005\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044</h2>
        <p>\u4E88\u7D04\u306E\u62C5\u5F53\u521D\u671F\u5024\u3068\u64CD\u4F5C\u5C65\u6B74\u306B\u4F7F\u7528\u3057\u307E\u3059\u3002</p>
        <div class="operator-dialog__choices">
          ${U.map(t=>`
            <button type="button" data-operator-choice="${t.id}">
              <strong>${t.name}</strong>
              <span>${t.trainerId?`\u65B0\u898F\u4E88\u7D04\u306E\u62C5\u5F53\uFF1A${t.name}`:"\u65B0\u898F\u4E88\u7D04\u306E\u62C5\u5F53\uFF1A\u6307\u5B9A\u306A\u3057"}</span>
            </button>
          `).join("")}
        </div>
        <button class="operator-dialog__cancel" type="button" data-operator-cancel>\u5909\u66F4\u3057\u306A\u3044</button>
      </div>
    </dialog>
  `),document.getElementById("operatorDialog"))}function gn({required:e=!1}={}){let t=Nr(),n=t.querySelector("[data-operator-cancel]");return n.hidden=e,new Promise(r=>{let s=(a="")=>{t.removeEventListener("click",i),t.removeEventListener("cancel",o),a&&Ie(a),t.open&&t.close(),r(a?_():null)},i=a=>{let c=a.target.closest("[data-operator-choice]");c&&s(c.dataset.operatorChoice),a.target.closest("[data-operator-cancel]")&&s()},o=a=>{a.preventDefault(),e||s()};t.addEventListener("click",i),t.addEventListener("cancel",o),t.showModal()})}function M(e){return e.name==="month"?R(e.month):(e.name==="week"||e.name==="day"||e.name==="booking-new")&&ct(e.date)?O(e.date):new Date}function yn(e){if(e.name==="month"){let t=R(e.month),n=dt(t);return{startDate:f(n[0]),endDate:f(n.at(-1)),render:(r,s)=>fn(t,r,s),view:"month"}}if(e.name==="week"){let t=M(e),n=j(t);return{startDate:f(n[0]),endDate:f(n.at(-1)),render:(r,s)=>mn(t,r,s),view:"week"}}if(e.name==="day"){let t=M(e),n=f(t);return{startDate:n,endDate:n,render:r=>un(t,r),view:""}}return null}function ae(){["month","week","day"].includes(x().name)&&sessionStorage.setItem("tamafit_calendar_return_hash",window.location.hash)}function ce(e=new Date){return sessionStorage.getItem("tamafit_calendar_return_hash")||kt||`#/month/${w(e)}`}function Or(e){let t=m.getCachedEvents(e.startDate,e.endDate),n=m.getCachedHistory?.()||[];y.innerHTML=e.render(t.events,n).replace("</main>",`${te()}</main>`),e.view&&Ee(e.view),$t(),t.isFresh||m.refreshEvents(e.startDate,e.endDate).catch(()=>{})}function Lr(){let e=y.querySelector("[data-booking-audit]");e&&(e.outerHTML=te())}function de(){let e=[...y.querySelectorAll("[data-history-select]:checked")],t=y.querySelector("[data-history-selected-count]"),n=y.querySelector('[data-action="delete-history-selected"]');t&&(t.textContent=String(e.length)),n&&(n.disabled=e.length===0)}function W({refresh:e=!1}={}){y.innerHTML=se(m.getCachedHistory?.()||[],{organizing:B}),de(),!(!e||oe||typeof m.refreshHistory!="function")&&(oe=!0,m.refreshHistory().then(()=>{x().name==="history"&&(y.innerHTML=se(m.getCachedHistory?.()||[],{organizing:B}),de())}).catch(()=>{}).finally(()=>{oe=!1}))}function rt(){let e=x();k.route=e;let t=yn(e);if(t){(e.name==="month"||e.name==="week")&&(kt=window.location.hash),Or(t);return}if(e.name==="booking-new"){let n=M(e);y.innerHTML=ne({defaultDate:f(n),defaultTrainerId:_()?.trainerId??"tamai"}),le();return}if(e.name==="booking-edit"){let n=m.getEventCached?.(e.id);if(n){y.innerHTML=ne({event:n,defaultDate:n.startAt.slice(0,10)}),le();return}y.innerHTML=ee("\u3053\u306E\u7AEF\u672B\u306B\u4E88\u7D04\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u30AB\u30EC\u30F3\u30C0\u30FC\u3078\u623B\u3063\u3066\u540C\u671F\u5F8C\u306B\u3082\u3046\u4E00\u5EA6\u958B\u3044\u3066\u304F\u3060\u3055\u3044\u3002"),m.getEvent(e.id).then(r=>{r&&x().name==="booking-edit"&&x().id===e.id&&rt()}).catch(()=>{});return}e.name==="history"&&W({refresh:!0})}function xt(){ie||(ie=!0,requestAnimationFrame(()=>{ie=!1;let e=x();if(e.name==="history"){W({refresh:!1});return}["month","week","day"].includes(e.name)&&rt()}))}function At(e){let t=document.getElementById("formMessage");t&&(t.textContent=e,t.classList.toggle("is-visible",!!e))}function Rr(){let e=document.getElementById("syncErrorDialog");return e||(document.body.insertAdjacentHTML("beforeend",`
    <dialog class="confirm-dialog sync-error-dialog" id="syncErrorDialog">
      <div class="confirm-dialog__body">
        <p class="eyebrow">Google\u540C\u671F</p>
        <h2 data-sync-error-title>Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u53CD\u6620\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F</h2>
        <div class="confirm-dialog__summary" data-sync-error-summary></div>
        <div class="confirm-dialog__actions is-single">
          <button class="button button--danger-solid button--wide" type="button" data-sync-error-close>\u78BA\u8A8D\u3057\u307E\u3057\u305F</button>
        </div>
      </div>
    </dialog>
  `),e=document.getElementById("syncErrorDialog"),e.addEventListener("click",t=>{t.target.closest("[data-sync-error-close]")&&e.open&&e.close()}),e.addEventListener("cancel",t=>{t.preventDefault(),e.close()}),e)}function Br(e){let t=Rr(),n=e.op?.before||m.getEventCached?.(e.op?.targetId),r=e.deferred?"Google\u30AB\u30EC\u30F3\u30C0\u30FC\u3078\u306E\u540C\u671F\u304C\u9045\u308C\u3066\u3044\u307E\u3059":"Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u53CD\u6620\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F",s=e.deferred?"\u7AEF\u672B\u4E0A\u306E\u4E88\u7D04\u306F\u305D\u306E\u307E\u307E\u4FDD\u6301\u3057\u3001\u30CD\u30C3\u30C8\u63A5\u7D9A\u4E2D\u306B\u81EA\u52D5\u3067\u518D\u8A66\u884C\u3057\u307E\u3059\u3002":"Google\u5074\u3067\u4FDD\u5B58\u3067\u304D\u306A\u304B\u3063\u305F\u305F\u3081\u3001\u7AEF\u672B\u4E0A\u306E\u64CD\u4F5C\u3092\u5143\u306E\u72B6\u614B\u3078\u623B\u3057\u307E\u3057\u305F\u3002";t.querySelector("[data-sync-error-title]").textContent=r,t.querySelector("[data-sync-error-summary]").innerHTML=`
    <div class="sync-error-message">
      ${n?.customerName?`<p><strong>${u(n.customerName)}</strong><br>${u(String(n.startAt||"").replace("T"," ").slice(0,16))}</p>`:""}
      <p>${u(s)}</p>
      <p class="sync-error-message__reason">\u7406\u7531\uFF1A${u(e.error?.message||"\u901A\u4FE1\u30A8\u30E9\u30FC")}</p>
    </div>
  `,t.open||t.showModal(),xt()}function Pr(){let e=document.getElementById("historyDeleteDialog");return e||(document.body.insertAdjacentHTML("beforeend",`
    <dialog class="confirm-dialog" id="historyDeleteDialog">
      <div class="confirm-dialog__body">
        <p class="eyebrow">\u64CD\u4F5C\u5C65\u6B74\u306E\u6574\u7406</p>
        <h2 data-history-delete-title>\u5C65\u6B74\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F</h2>
        <div class="confirm-dialog__summary" data-history-delete-summary></div>
        <div class="confirm-dialog__actions">
          <button class="button button--secondary" type="button" data-history-delete-cancel>\u30AD\u30E3\u30F3\u30BB\u30EB</button>
          <button class="button button--danger-solid" type="button" data-history-delete-confirm>\u5C65\u6B74\u3092\u524A\u9664</button>
        </div>
      </div>
    </dialog>
  `),document.getElementById("historyDeleteDialog"))}function pn(e){let t=(Array.isArray(e)?e:[e]).map(String).filter(Boolean);if(!t.length)return Promise.resolve(!1);let n=Pr(),r=m.getCachedHistory?.().filter(o=>t.includes(String(o.historyId||"")))||[],s=t.length===1?"\u3053\u306E\u64CD\u4F5C\u5C65\u6B74\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F":`${t.length}\u4EF6\u306E\u64CD\u4F5C\u5C65\u6B74\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F`,i=r.map(o=>o.customerName).filter(Boolean).slice(0,3);return n.querySelector("[data-history-delete-title]").textContent=s,n.querySelector("[data-history-delete-summary]").innerHTML=`
    ${i.length?`<p><strong>${u(i.join("\u3001"))}${r.length>3?" \u307B\u304B":""}</strong></p>`:""}
    <p>\u5C65\u6B74\u3060\u3051\u3092\u524A\u9664\u3057\u307E\u3059\u3002Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306E\u4E88\u7D04\u81EA\u4F53\u306F\u524A\u9664\u3055\u308C\u307E\u305B\u3093\u3002</p>
  `,new Promise(o=>{let a=l=>{n.removeEventListener("click",c),n.removeEventListener("cancel",d),n.open&&n.close(),o(l)},c=l=>{l.target.closest("[data-history-delete-confirm]")&&a(!0),l.target.closest("[data-history-delete-cancel]")&&a(!1)},d=l=>{l.preventDefault(),a(!1)};n.addEventListener("click",c),n.addEventListener("cancel",d),n.showModal()})}function le(){let e=document.getElementById("bookingType"),t=document.getElementById("customerName");if(!e||!t)return;let n=["blocked","tentative","event"].includes(e.value);t.placeholder=n?"\u4F8B\uFF1A\u6E05\u6383\u30FB\u6253\u3061\u5408\u308F\u305B":"\u4F8B\uFF1A\u5C71\u7530 \u82B1\u5B50"}function Fr(e){if(e?.dataset.date&&ct(e.dataset.date))return e.dataset.date;let t=x();return(t.name==="day"||t.name==="week")&&ct(t.date)?t.date:t.name==="month"?f(R(t.month)):f(new Date)}async function Kr(e){let t=e.dataset.action,n=x();if(t==="previous-month"||t==="next-month"){b(`month/${w(P(R(n.month),t==="previous-month"?-1:1))}`);return}if(t==="previous-week"||t==="next-week"){b(`week/${f(L(M(n),t==="previous-week"?-7:7))}`);return}if(t==="today"||t==="go-home"){b(`month/${w(new Date)}`);return}if(t==="show-month"){b(`month/${w(M(n))}`);return}if(t==="show-week"){b(`week/${f(M(n))}`);return}if(t==="open-day"){kt=window.location.hash,b(`day/${e.dataset.date}`);return}if(t==="new-booking"){ae(),b(`booking/new?date=${Fr(e)}`);return}if(t==="edit-booking"){ae(),b(`booking/edit/${encodeURIComponent(e.dataset.id)}`);return}if(t==="back-to-calendar"){B=!1;let r=n.name==="history"?ce(M(n)):kt||`#/month/${w(M(n))}`;b(r.replace(/^#\//,""));return}if(t==="back-from-form"){b(ce(M(n)).replace(/^#\//,""));return}if(t==="open-history"){B=!1,ae(),b("history");return}if(t==="run-booking-audit"){await ln(Lr);return}if(t==="history-organize"){B=!0,W({refresh:!1});return}if(t==="history-organize-cancel"){B=!1,W({refresh:!1});return}if(t==="delete-history-one"){let r=e.dataset.historyId;if(!r||!await pn([r]))return;m.deleteHistoryOptimistic?.([r]),W({refresh:!1});return}if(t==="delete-history-selected"){let r=[...y.querySelectorAll("[data-history-select]:checked")].map(s=>s.value).filter(Boolean);if(!r.length||!await pn(r))return;B=!1,m.deleteHistoryOptimistic?.(r),W({refresh:!1});return}if(t==="reload"){b(ce().replace(/^#\//,""));return}if(t==="change-operator"){await gn()&&rt();return}if(t==="install-app"){await Yr();return}if(t==="delete-booking"){let r=m.getEventCached?.(e.dataset.id);if(!r)return;m.deleteEventOptimistic(r.id),b(`day/${r.startAt.slice(0,10)}`)}}function Wr(e){At("");let t=new FormData(e),n=e.dataset.eventId||null,r=String(t.get("date")),s=String(t.get("time")),i=Number(t.get("duration")),o=X(r,s),a={customerName:String(t.get("customerName")||"").trim(),trainerId:String(t.get("trainerId")||""),startAt:o,endAt:lt(o,i),duration:i,type:String(t.get("type")||"member"),notes:String(t.get("notes")||"").trim()};if(!a.customerName){At("\u304A\u5BA2\u69D8\u540D\u307E\u305F\u306F\u4E88\u5B9A\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002");return}let c=m.analyzeCachedBooking?.(a,n);if(c?.conflicts?.length){let d=c.conflicts[0];At(`\u540C\u3058\u62C5\u5F53\u8005\u306B ${d.startAt.slice(11,16)}\u301C${d.endAt.slice(11,16)} \u306E\u4E88\u7D04\u304C\u3042\u308A\u307E\u3059\u3002`);return}n?m.updateEventOptimistic(n,a):m.createEventOptimistic(a),b(`day/${r}`)}function Gr(){return window.matchMedia?.("(display-mode: standalone)").matches||window.navigator.standalone===!0}function bn(){let e=navigator.userAgent;return/iPad|iPhone|iPod/.test(e)&&!/CriOS|FxiOS|EdgiOS|OPiOS/.test(e)}function qr(){return k.isInstalled||Gr()?"":k.installPrompt?"android":bn()?"ios":""}function $t(){y.querySelector(".pwa-install-banner")?.remove();let e=qr(),t=y.querySelector(".app-main");!e||!t||t.insertAdjacentHTML("afterbegin",`
    <section class="pwa-install-banner" aria-label="\u30A2\u30D7\u30EA\u3068\u3057\u3066\u8FFD\u52A0">
      <div><strong>${e==="android"?"\u30A2\u30D7\u30EA\u3068\u3057\u3066\u8FFD\u52A0":"\u30DB\u30FC\u30E0\u753B\u9762\u306B\u8FFD\u52A0"}</strong><span>\u30DB\u30FC\u30E0\u753B\u9762\u304B\u3089\u3059\u3050\u958B\u3051\u307E\u3059</span></div>
      <button class="pwa-install-banner__button" type="button" data-action="install-app">\u8FFD\u52A0</button>
    </section>
  `)}async function Yr(){if(k.installPrompt){let e=k.installPrompt;k.installPrompt=null,await e.prompt(),await e.userChoice,$t();return}bn()&&nt&&!nt.open&&nt.showModal()}y.addEventListener("click",e=>{let t=e.target.closest("[data-action]");t&&Kr(t).catch(()=>{})});y.addEventListener("submit",e=>{if(e.target.id==="bookingForm"){e.preventDefault();try{Wr(e.target)}catch(t){At(t.message||"\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002")}}});y.addEventListener("change",e=>{e.target.id==="bookingType"&&le(),e.target.matches?.("[data-history-select]")&&de()});window.addEventListener("hashchange",rt);window.addEventListener("online",()=>{m.syncNow?.(),m.syncHistoryDeletes?.(),m.refreshHistory?.().then(xt).catch(()=>{});let e=yn(x());e&&m.refreshEvents(e.startDate,e.endDate).catch(()=>{})});window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),k.installPrompt=e,$t()});window.addEventListener("appinstalled",()=>{k.installPrompt=null,k.isInstalled=!0,$t()});nt?.addEventListener("click",e=>{e.target.closest("[data-pwa-dialog-close]")&&nt.close()});m.onSyncFailure?.(Br);m.onChange?.(xt);"serviceWorker"in navigator&&window.location.protocol!=="file:"&&window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));async function Ur(){V()||await gn({required:!0}),window.location.hash?rt():b(`month/${w(new Date)}`,{replace:!0});let e=new Date,t=f(P(e,-3)),n=f(P(e,6));m.refreshEvents(t,n).catch(()=>{}),m.refreshHistory?.().then(xt).catch(()=>{}),m.syncHistoryDeletes?.(),m.syncNow?.()}Ur().catch(e=>{y.innerHTML=ee(u(e.message||"\u30A2\u30D7\u30EA\u3092\u8D77\u52D5\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002"))});function Vr(e,t=new Date){let n=R(e);return w(n)===w(t)?new Date(t.getFullYear(),t.getMonth(),t.getDate()):n}function zr(e,t=new Date){let n=String(e||"").match(/^#\/month\/(\d{4}-\d{2})/);return n?`#/week/${f(Vr(n[1],t))}`:null}function jr({root:e=document,now:t=()=>new Date}={}){e.addEventListener("click",n=>{if(!n.target.closest?.('[data-action="show-week"]'))return;let s=zr(window.location.hash,t());s&&(n.preventDefault(),n.stopPropagation(),window.location.hash=s)},!0)}typeof document<"u"&&jr();var vn=null;function Xr(e){return{create:"\u4E88\u7D04\u5B8C\u4E86",update:"\u5909\u66F4\u5B8C\u4E86",delete:"\u524A\u9664\u5B8C\u4E86"}[e]||"\u5B8C\u4E86"}function Jr(){if(document.getElementById("actionFeedbackStyles"))return;let e=document.createElement("style");e.id="actionFeedbackStyles",e.textContent=`
    .action-feedback {
      position: fixed;
      left: 50%;
      top: calc(82px + env(safe-area-inset-top));
      z-index: 3000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: min(78vw, 360px);
      min-width: 240px;
      min-height: 68px;
      padding: 16px 24px;
      border: 1px solid rgba(255, 255, 255, 0.24);
      border-radius: 20px;
      background: rgba(13, 143, 77, 0.97);
      color: #fff;
      box-shadow: 0 14px 38px rgba(8, 73, 40, 0.3);
      font-size: 21px;
      font-weight: 900;
      letter-spacing: 0.04em;
      line-height: 1.1;
      pointer-events: none;
      opacity: 0;
      transform: translate3d(-50%, -14px, 0) scale(0.96);
      transition: opacity 140ms ease-out, transform 190ms cubic-bezier(0.22, 1, 0.36, 1);
      will-change: opacity, transform;
    }

    .action-feedback::before {
      content: "\u2713";
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin-right: 12px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.18);
      font-size: 22px;
      font-weight: 900;
      line-height: 1;
      flex: 0 0 auto;
    }

    .action-feedback.is-visible {
      opacity: 1;
      transform: translate3d(-50%, 0, 0) scale(1);
    }

    @media (prefers-reduced-motion: reduce) {
      .action-feedback {
        transition: opacity 80ms linear;
        transform: translate3d(-50%, 0, 0);
      }
    }
  `,document.head.appendChild(e)}function Qr(){let e=document.getElementById("actionFeedbackToast");return e||(Jr(),e=document.createElement("div"),e.id="actionFeedbackToast",e.className="action-feedback",e.setAttribute("role","status"),e.setAttribute("aria-live","polite"),e.setAttribute("aria-atomic","true"),document.body.appendChild(e),e)}function wn(e){let t=Qr();t.textContent=Xr(e),clearTimeout(vn),requestAnimationFrame(()=>t.classList.add("is-visible")),vn=setTimeout(()=>t.classList.remove("is-visible"),1100)}function Zr({root:e=document}={}){e.addEventListener("submit",t=>{let n=t.target.closest?.("#bookingForm");if(!n)return;let r=n.dataset.eventId?"update":"create";setTimeout(()=>{/^#\/day\//.test(window.location.hash)&&wn(r)},0)}),e.addEventListener("click",t=>{t.target.closest?.('[data-action="delete-booking"]')&&setTimeout(()=>{/^#\/day\//.test(window.location.hash)&&wn("delete")},0)})}typeof document<"u"&&Zr();
