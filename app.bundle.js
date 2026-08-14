var fn="tamafit_staff_calendar_local_first_v1:coverage";function At(e){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(e||"")))return null;let t=new Date(`${e}T00:00:00Z`);return Number.isNaN(t.getTime())?null:t}function nt(e){return e.toISOString().slice(0,10)}function mn(e,t){let n=At(e),s=At(t);return!n||!s?1/0:Math.round((s.getTime()-n.getTime())/864e5)+1}function pn(e,t={}){if(String(t?.method||e?.method||"GET").toUpperCase()!=="GET")return null;let s;try{s=new URL(typeof e=="string"||e instanceof URL?String(e):e?.url||"")}catch{return null}if(s.hostname!=="script.google.com"||s.searchParams.get("action")!=="staffCalendarList")return null;let r=s.searchParams.get("startDate")||"",i=s.searchParams.get("endDate")||"",a=mn(r,i);return!Number.isFinite(a)||a<1||a>70?null:{startDate:r,endDate:i}}function yn(e){let t=String(e||""),n=t.match(/^#\/month\/(\d{4})-(\d{2})/);if(n)return`${n[1]}-${n[2]}-01`;let s=t.match(/^#\/(?:week|day)\/(\d{4}-\d{2}-\d{2})/);return s?s[1]:""}function ae(e){let t=String(e||""),n=t.match(/^#\/month\/(\d{4})-(\d{2})/);if(n){let i=new Date(Date.UTC(Number(n[1]),Number(n[2])-1,1)),a=new Date(Date.UTC(Number(n[1]),Number(n[2]),0));return{startDate:nt(i),endDate:nt(a)}}let s=t.match(/^#\/week\/(\d{4}-\d{2}-\d{2})/);if(s){let i=At(s[1]);if(!i)return null;let a=new Date(i.getTime()-i.getUTCDay()*864e5),o=new Date(a.getTime()+6*864e5);return{startDate:nt(a),endDate:nt(o)}}let r=t.match(/^#\/day\/(\d{4}-\d{2}-\d{2})/);return r?{startDate:r[1],endDate:r[1]}:null}function gn(e){let t=String(e||""),n=t.match(/^#\/month\/(\d{4})-(\d{2})/);return n?`${Number(n[2])}\u6708`:/^#\/week\//.test(t)?"\u3053\u306E\u9031":/^#\/day\//.test(t)?"\u3053\u306E\u65E5":"\u4E88\u5B9A"}function vn(e,t){let n=ae(t);return!n||!e?.startDate||!e?.endDate?!1:e.startDate<=n.startDate&&e.endDate>=n.endDate}function bn(e){try{let t=JSON.parse(e?.getItem(fn)||"[]");return Array.isArray(t)?t:[]}catch{return[]}}function ie(e,t){let n=ae(t);return n?bn(e).some(s=>s?.startDate<=n.startDate&&s?.endDate>=n.endDate&&Number(s?.fetchedAt||0)>0):!1}function wn(e){if(e.getElementById("calendarFetchStatusStyles"))return;let t=e.createElement("style");t.id="calendarFetchStatusStyles",t.textContent=`
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
  `,e.head.appendChild(t)}function Sn(e){let t=e.getElementById("calendarFetchStatus");return t||(wn(e),t=e.createElement("div"),t.id="calendarFetchStatus",t.className="calendar-fetch-status",t.setAttribute("role","status"),t.setAttribute("aria-live","polite"),t.innerHTML=`
    <span class="calendar-fetch-status__spinner" aria-hidden="true"></span>
    <span class="calendar-fetch-status__copy">
      <strong class="calendar-fetch-status__title"></strong>
      <span class="calendar-fetch-status__detail"></span>
    </span>
  `,e.body.appendChild(t),t)}function In({globalRef:e=globalThis,documentRef:t=globalThis.document,locationRef:n=globalThis.location,storageRef:s=globalThis.localStorage}={}){if(!e?.fetch||!t||!n)return()=>{};if(e.__tamafitCalendarFetchStatusInstalled)return()=>{};e.__tamafitCalendarFetchStatusInstalled=!0;let r=e.fetch.bind(e),i=Sn(t),a=new Map,o=0,c=null,d=null,l=i.querySelector(".calendar-fetch-status__title"),u=i.querySelector(".calendar-fetch-status__detail"),w=()=>{clearTimeout(c),clearTimeout(d),c=null,d=null},p=()=>{w(),i.classList.remove("is-visible","is-large","is-compact")},I=()=>[...a.values()].some(T=>vn(T,n.hash)),K=T=>{let C=gn(n.hash);i.classList.remove("is-large","is-compact"),i.classList.add(T==="initial"?"is-large":"is-compact"),T==="initial"?(l.textContent=`${C}\u306E\u4E88\u5B9A\u3092\u8AAD\u307F\u8FBC\u3093\u3067\u3044\u307E\u3059`,u.textContent="\u30AB\u30EC\u30F3\u30C0\u30FC\u306F\u79FB\u52D5\u6E08\u307F\u3067\u3059\u3002\u305D\u306E\u307E\u307E\u304A\u5F85\u3061\u304F\u3060\u3055\u3044",d=setTimeout(()=>{!i.classList.contains("is-visible")||!I()||(l.textContent="\u4E88\u5B9A\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u6642\u9593\u304C\u304B\u304B\u3063\u3066\u3044\u307E\u3059",u.textContent="\u901A\u4FE1\u72B6\u6CC1\u306B\u3088\u3063\u3066\u6642\u9593\u304C\u304B\u304B\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059")},8e3)):(l.textContent="\u6700\u65B0\u306E\u4E88\u5B9A\u3092\u78BA\u8A8D\u4E2D",u.textContent=""),i.classList.add("is-visible")},M=()=>{if(!yn(n.hash)||!I()){p();return}let C=!ie(s,n.hash),et=C?"is-large":"is-compact";i.classList.contains("is-visible")&&i.classList.contains(et)||(w(),i.classList.remove("is-visible","is-large","is-compact"),c=setTimeout(()=>{if(c=null,!I())return;let W=!ie(s,n.hash);K(W?"initial":"refresh")},C?80:350))},un=(T,C)=>{let et=pn(T,C);if(!et)return r(T,C);let W=++o;a.set(W,et),M();let re;try{re=r(T,C)}catch(hn){throw a.delete(W),M(),hn}return Promise.resolve(re).finally(()=>{a.delete(W),M()})};return e.fetch=un,e.addEventListener?.("hashchange",M),()=>{p(),a.clear(),e.fetch=r,e.removeEventListener?.("hashchange",M),delete e.__tamafitCalendarFetchStatusInstalled}}typeof window<"u"&&In();var le="tamafit_staff_calendar_local_first_v1",oe=`${le}:history`,ce=`${le}:history-hidden-ids`,En="Google\u30AB\u30EC\u30F3\u30C0\u30FC\u76F4\u63A5\u64CD\u4F5C";function de(e,t,n){try{return JSON.parse(e?.getItem(t)||"null")??n}catch{return n}}function ue(e){let t=String(e||"").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);if(!t)return null;let[,n,s,r,i,a]=t;return{dayNumber:Math.floor(Date.UTC(Number(n),Number(s)-1,Number(r))/864e5),time:`${i}:${a}`}}function _n(e){return String(e||"").slice(0,16)}function An(e){return e?.source===En&&e?.action==="\u5909\u66F4"&&e?.historyId&&e?.id&&ue(e.startAt)}function $n(e){if(e.length<3)return!1;let t=e.map(r=>ue(r.startAt));if(t.some(r=>!r)||new Set(t.map(r=>r.time)).size!==1)return!1;let s=[...new Set(t.map(r=>r.dayNumber))].sort((r,i)=>r-i);return s.length<3?!1:s.every(r=>(r-s[0])%7===0)}function xn(e){let t=new Map;(Array.isArray(e)?e:[]).forEach(s=>{if(!An(s))return;let r=[s.id,s.customerName||"",_n(s.timestamp)].join("|");t.has(r)||t.set(r,[]),t.get(r).push(s)});let n=new Set;return t.forEach(s=>{$n(s)&&s.forEach(r=>n.add(String(r.historyId)))}),[...n]}function kn(e=globalThis.localStorage){if(!e)return[];let t=de(e,oe,[]),n=xn(t);if(!n.length)return[];let s=new Set(n),r=new Set(de(e,ce,[]).map(String));n.forEach(i=>r.add(i));try{e.setItem(oe,JSON.stringify(t.filter(i=>!s.has(String(i?.historyId||""))))),e.setItem(ce,JSON.stringify([...r]))}catch{return[]}return n}typeof window<"u"&&kn(window.localStorage);var xt="cubic-bezier(0.22, 1, 0.36, 1)",q=".month-calendar, .week-list",st=0;function $t(e){return String(e).padStart(2,"0")}function Tn(e){return`${e.getFullYear()}-${$t(e.getMonth()+1)}-${$t(e.getDate())}`}function Dn(e,t){let n=t>=0?1:-1,s=String(e||"").match(/^#\/month\/(\d{4})-(\d{2})/);if(s){let i=new Date(Number(s[1]),Number(s[2])-1+n,1);return`#/month/${i.getFullYear()}-${$t(i.getMonth()+1)}`}let r=String(e||"").match(/^#\/week\/(\d{4})-(\d{2})-(\d{2})/);if(r){let i=new Date(Number(r[1]),Number(r[2])-1,Number(r[3]));return i.setDate(i.getDate()+n*7),`#/week/${Tn(i)}`}return null}function Hn({distance:e,width:t,velocity:n=0}){let s=Math.abs(Number(e)||0),r=Math.max(1,Number(t)||1),i=Math.abs(Number(n)||0),a=Math.max(92,r*.28),o=Math.max(60,r*.16);return s>=a||s>=o&&i>=.85}function Mn(){if(document.getElementById("calendarSwipeStyles"))return;let e=document.createElement("style");e.id="calendarSwipeStyles",e.textContent=`
    ${q} {
      touch-action: pan-y;
      overscroll-behavior-x: contain;
      transform: translate3d(0, 0, 0);
    }
    ${q}.is-calendar-swiping {
      will-change: transform;
    }
  `,document.head.appendChild(e)}function kt(e){e?.isConnected&&(e.classList.remove("is-calendar-swiping"),e.style.transition="",e.style.transform="",e.style.pointerEvents="")}function he(e){e?.isConnected&&(e.style.transition=`transform 230ms ${xt}`,e.style.transform="translate3d(0, 0, 0)",setTimeout(()=>kt(e),260))}function fe(e,t){let n=()=>e.querySelector?.(q),s=n();if(!s){requestAnimationFrame(()=>{n()&&fe(e,t)});return}let r=Math.max(1,s.clientWidth||window.innerWidth||1),i=t>0?r:-r;s.classList.add("is-calendar-swiping"),s.style.transition="none",s.style.transform=`translate3d(${i}px, 0, 0)`,s.style.pointerEvents="none",requestAnimationFrame(()=>{requestAnimationFrame(()=>{s.isConnected&&(s.style.transition=`transform 240ms ${xt}`,s.style.transform="translate3d(0, 0, 0)",setTimeout(()=>kt(s),270))})})}function Cn({root:e=document}={}){Mn();let t=null,n=0;e.addEventListener("pointerdown",r=>{if(!r.isPrimary||r.pointerType==="mouse")return;let i=r.target.closest?.(q);if(!i)return;let a=performance.now();t={pointerId:r.pointerId,surface:i,startX:r.clientX,startY:r.clientY,lastX:r.clientX,lastTime:a,velocityX:0,horizontal:!1,cancelled:!1}}),e.addEventListener("pointermove",r=>{if(!t||r.pointerId!==t.pointerId||t.cancelled)return;let i=r.clientX-t.startX,a=r.clientY-t.startY,o=Math.abs(i),c=Math.abs(a);if(!t.horizontal){if(o<8&&c<8)return;if(c>=o){t.cancelled=!0;return}t.horizontal=!0,t.surface.classList.add("is-calendar-swiping"),t.surface.setPointerCapture?.(r.pointerId)}r.preventDefault();let d=performance.now(),l=Math.max(1,d-t.lastTime),u=(r.clientX-t.lastX)/l;t.velocityX=t.velocityX*.55+u*.45,t.lastX=r.clientX,t.lastTime=d;let p=Math.max(1,t.surface.clientWidth||window.innerWidth||1)*.96,I=Math.abs(i),K=I<=p?i:Math.sign(i)*(p+(I-p)*.18);t.surface.style.transition="none",t.surface.style.transform=`translate3d(${K}px, 0, 0)`},{passive:!1});function s(r,i=!1){if(!t||r.pointerId!==t.pointerId)return;let a=t;if(t=null,i||a.cancelled||!a.horizontal){kt(a.surface);return}let o=r.clientX-a.startX,d=performance.now()-a.lastTime>90?0:a.velocityX,l=Math.max(1,a.surface.clientWidth||window.innerWidth||1),u=Hn({distance:o,width:l,velocity:d});if(n=performance.now()+450,!u){he(a.surface);return}let w=o<0?1:-1,p=Dn(window.location.hash,w);if(!p){he(a.surface);return}let I=w>0?-l:l,K=Math.max(0,Math.min(1,(l-Math.min(l,Math.abs(o)))/l)),M=Math.round(140+K*90);a.surface.style.pointerEvents="none",a.surface.style.transition=`transform ${M}ms ${xt}`,a.surface.style.transform=`translate3d(${I}px, 0, 0)`,st=w,setTimeout(()=>{window.location.hash=p},M)}e.addEventListener("pointerup",r=>s(r)),e.addEventListener("pointercancel",r=>s(r,!0)),e.addEventListener("click",r=>{performance.now()>=n||r.target.closest?.(q)&&(r.preventDefault(),r.stopPropagation())},!0),window.addEventListener("hashchange",()=>{if(!st)return;let r=st;st=0,queueMicrotask(()=>fe(e,r))})}typeof document<"u"&&Cn();var Nn="tamafit_staff_calendar_last_view",me="tamafit_staff_calendar_operator_v1",G=[{id:"tamai",name:"\u7389\u4E95",trainerId:"tamai"},{id:"obayashi",name:"\u5927\u6797",trainerId:"obayashi"},{id:"store",name:"\u5E97\u8217\u7528\u7AEF\u672B",trainerId:""}];function Y(){try{let e=globalThis.localStorage?.getItem(me)||"";return G.some(t=>t.id===e)?e:""}catch{return""}}function E(){let e=Y();return G.find(t=>t.id===e)||null}function pe(e){if(!G.some(t=>t.id===e))return!1;try{return globalThis.localStorage?.setItem(me,e),!0}catch{return!1}}function ye(e){if(!(e!=="month"&&e!=="week"))try{localStorage.setItem(Nn,e)}catch{}}var A={route:null,isLoading:!1,installPrompt:null,isInstalled:!1};var On=60,Ln="blocked",Rn="\u30AF\u30A4\u30C3\u30AF\u4E88\u7D04",ge="\u5E97\u8217\u5171\u7528";function ve(e){let t=String(e||"");return/^#\/booking\/new\?/.test(t)&&/(?:^|[?&])quick=1(?:&|$)/.test(t)}function Bn(e){let t=String(e||"");return/^\d{4}-\d{2}-\d{2}$/.test(t)?`#/booking/new?date=${t}&quick=1`:""}function Pn(e){let t=String(e?.trainerId||"");return{customerName:t?Rn:ge,trainerId:t,duration:On,type:Ln,notes:"",operatorLabel:t?String(e?.name||"\u62C5\u5F53\u30C8\u30EC\u30FC\u30CA\u30FC"):ge}}function Fn(e){e?.closest?.(".field")?.setAttribute("hidden","")}function Kn({documentRef:e=globalThis.document,locationRef:t=globalThis.location,operator:n=E()}={}){if(!e||!t||!ve(t.hash))return!1;let s=e.getElementById("bookingForm");if(!s)return!1;let r=e.getElementById("customerName"),i=e.getElementById("trainerId"),a=e.getElementById("duration"),o=e.getElementById("bookingType"),c=e.getElementById("notes"),d=Pn(n);r&&(r.value=d.customerName),i&&(i.value=d.trainerId),a&&(a.value=String(d.duration)),o&&(o.value=d.type),c&&(c.value=d.notes),[r,i,a,o,c].forEach(Fn),s.dataset.quickBooking="true";let l=e.querySelector(".form-heading"),u=l?.querySelector(".eyebrow"),w=l?.querySelector("h1"),p=l?.querySelector("p:last-child"),I=s.querySelector('button[type="submit"]');return u&&(u.textContent="\u6700\u77ED\u5165\u529B"),w&&(w.textContent="\u30AF\u30A4\u30C3\u30AF\u4E88\u7D04"),p&&(p.textContent=`${d.operatorLabel}\u3068\u3057\u306660\u5206\u306E\u4E88\u7D04\u67A0\u3092\u4F5C\u6210\u3057\u307E\u3059\u3002\u5165\u529B\u306F\u4E88\u7D04\u65E5\u3068\u958B\u59CB\u6642\u9593\u3060\u3051\u3067\u3059\u3002`),I&&(I.textContent="\u30AF\u30A4\u30C3\u30AF\u4E88\u7D04\u3092\u767B\u9332"),!0}function Tt(e,t=0){let n=()=>{Kn()||t>=8||!ve(e.location?.hash)||Tt(e,t+1)};typeof e.requestAnimationFrame=="function"?e.requestAnimationFrame(n):e.setTimeout?.(n,0)}function Wn({globalRef:e=globalThis,documentRef:t=globalThis.document,sessionStorageRef:n=globalThis.sessionStorage}={}){if(!t||!e?.location)return()=>{};if(e.__tamafitQuickBookingInstalled)return()=>{};e.__tamafitQuickBookingInstalled=!0;let s=i=>{let a=i.target.closest?.("[data-quick-booking]");if(!a)return;let o=Bn(a.dataset.date);if(o){i.preventDefault(),i.stopPropagation();try{n?.setItem("tamafit_calendar_return_hash",e.location.hash)}catch{}e.location.hash=o}},r=()=>Tt(e);return t.addEventListener("click",s,!0),e.addEventListener?.("hashchange",r),Tt(e),()=>{t.removeEventListener("click",s,!0),e.removeEventListener?.("hashchange",r),delete e.__tamafitQuickBookingInstalled}}typeof document<"u"&&Wn();var rt=["\u65E5","\u6708","\u706B","\u6C34","\u6728","\u91D1","\u571F"];function U(e){return String(e).padStart(2,"0")}function f(e){return`${e.getFullYear()}-${U(e.getMonth()+1)}-${U(e.getDate())}`}function N(e){let[t,n,s]=String(e).split("-").map(Number);return new Date(t,n-1,s)}function it(e){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(e)))return!1;let t=N(e);return f(t)===e}function O(e,t){let n=new Date(e.getFullYear(),e.getMonth(),e.getDate());return n.setDate(n.getDate()+t),n}function B(e,t){return new Date(e.getFullYear(),e.getMonth()+t,1)}function be(e){return O(e,-e.getDay())}function at(e){let t=new Date(e.getFullYear(),e.getMonth(),1),n=be(t);return Array.from({length:42},(s,r)=>O(n,r))}function V(e){let t=be(e);return Array.from({length:7},(n,s)=>O(t,s))}function we(e){return`${e.getFullYear()}\u5E74${e.getMonth()+1}\u6708`}function Ht(e){return`${e.getMonth()+1}\u6708${e.getDate()}\u65E5\uFF08${rt[e.getDay()]}\uFF09`}function Se(e){return`${e.getMonth()+1}/${e.getDate()}\uFF08${rt[e.getDay()]}\uFF09`}function Ie(e){let t=V(e),n=t[0],s=t[6];return n.getMonth()===s.getMonth()?`${n.getMonth()+1}/${n.getDate()}\u301C${s.getMonth()+1}/${s.getDate()}`:`${n.getMonth()+1}/${n.getDate()}\u301C${s.getMonth()+1}/${s.getDate()}`}function Mt(e){let[t="",n=""]=String(e).split("T");return{date:t,time:n.slice(0,5)}}function z(e,t){return`${e}T${t}:00`}function Dt(e){let[t,n]=e.split(":").map(Number);return t*60+n}function Ee(e){return`${U(Math.floor(e/60))}:${U(e%60)}`}function ot(e,t){let{date:n,time:s}=Mt(e);return z(n,Ee(Dt(s)+t))}function _e(e,t,n){let s=[];for(let r=Dt(e);r<=Dt(t);r+=n)s.push(Ee(r));return s}function ct(e){return f(e)===f(new Date)}function b(e){return`${e.getFullYear()}-${U(e.getMonth()+1)}`}function L(e){if(!/^\d{4}-\d{2}$/.test(String(e)))return new Date;let[t,n]=e.split("-").map(Number);return new Date(t,n-1,1)}function $(e=window.location.hash){let t=e.replace(/^#\/?/,""),[n="",s=""]=t.split("?"),r=n.split("/").filter(Boolean),i=new URLSearchParams(s),a=new Date;return r[0]==="month"?{name:"month",month:r[1]||b(a)}:r[0]==="week"?{name:"week",date:r[1]||f(a)}:r[0]==="day"?{name:"day",date:r[1]||f(a)}:r[0]==="booking"&&r[1]==="new"?{name:"booking-new",date:i.get("date")||f(a)}:r[0]==="booking"&&r[1]==="edit"&&r[2]?{name:"booking-edit",id:decodeURIComponent(r[2])}:r[0]==="history"?{name:"history"}:{name:"month",month:b(a)}}function y(e,{replace:t=!1}={}){let n=e.startsWith("#")?e:`#/${e.replace(/^\//,"")}`;if(t){history.replaceState(null,"",n),window.dispatchEvent(new HashChangeEvent("hashchange"));return}window.location.hash=n}var Ae="\u305F\u307E\u30D5\u30A3\u30C3\u30C8\u4E88\u7D04",$e="https://script.google.com/macros/s/AKfycbzQf3thjGYKpV13bH6V0n1ZKQT23Wvvx8K7CQhRNIuH6mAQwih9Cg28r3ETnz9AVB4Etw/exec",S=[{id:"tamai",name:"\u7389\u4E95",shortName:"\u7389\u4E95",color:"pink"},{id:"obayashi",name:"\u5927\u6797",shortName:"\u5927\u6797",color:"aqua"}],X=[{id:"member",name:"\u901A\u5E38\u4E88\u7D04"},{id:"trial",name:"\u4F53\u9A13"},{id:"consultation",name:"\u898B\u5B66\u30FB\u76F8\u8AC7"},{id:"blocked",name:"\u4E88\u7D04\u30D6\u30ED\u30C3\u30AF"},{id:"tentative",name:"\u4EEE\u4E88\u7D04\u67A0"},{id:"event",name:"\u30A4\u30D9\u30F3\u30C8"}],xe=[30,60,90],ke="09:00",Te="21:00",De=15,He=5;var x=class{async listEvents(){throw new Error("listEvents must be implemented")}async getEvent(){throw new Error("getEvent must be implemented")}async createEvent(){throw new Error("createEvent must be implemented")}async updateEvent(){throw new Error("updateEvent must be implemented")}async deleteEvent(){throw new Error("deleteEvent must be implemented")}async findConflicts(){throw new Error("findConflicts must be implemented")}async findBufferWarnings(){throw new Error("findBufferWarnings must be implemented")}async listHistory(){throw new Error("listHistory must be implemented")}async deleteHistory(){throw new Error("deleteHistory must be implemented")}};function D(e,t,n=null,s=30){if(!t.trainerId)return[];let r=Date.parse(t.startAt),i=Date.parse(t.endAt),a=s*60*1e3;return!Number.isFinite(r)||!Number.isFinite(i)?[]:e.filter(o=>{if(o.id===n||o.trainerId!==t.trainerId)return!1;let c=Date.parse(o.startAt),d=Date.parse(o.endAt);if(!Number.isFinite(c)||!Number.isFinite(d))return!1;let l=r-d,u=c-i;return l>=0&&l<a||u>=0&&u<a})}var Me="recurring:";function qn(e){return/^https:\/\/script\.google\.com\/macros\/s\//.test(String(e||""))}function Ce(e){if(!qn(e))throw new Error("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u9023\u643A\u306EURL\u304C\u672A\u8A2D\u5B9A\u3067\u3059\u3002Apps Script\u3092\u30C7\u30D7\u30ED\u30A4\u3057\u3066\u304B\u3089 src/config.js \u306B /exec URL \u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002")}function Ne(e){if(e?.status==="success")return e;let t=new Error(e?.message||"Google\u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u306E\u901A\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");throw t.retryable=!1,t}function j(e,t,{retryable:n=!0}={}){let s=new Error(e);return s.retryable=n,s.cause=t,s}function Ct(e,t){return t?{...e,mutationId:t}:e}function Oe(e){if(!e?.isRecurring)return e;let t=String(e.calendarEventId||e.id||"");if(!t||!e.startAt)return{...e,isRecurring:!0,readOnly:!0};let n=String(e.id||""),s=n.startsWith(Me)?n:`${Me}${encodeURIComponent(t)}:${e.startAt}`;return{...e,calendarEventId:t,id:s,isRecurring:!0,readOnly:!0}}var dt=class extends x{constructor({endpoint:t=$e,fetchImpl:n=(...s)=>globalThis.fetch(...s)}={}){super(),this.endpoint=t,this.fetchImpl=n}async get(t,n={}){Ce(this.endpoint);let s=new URL(this.endpoint);s.searchParams.set("action",t),Object.entries(n).forEach(([i,a])=>{a!=null&&s.searchParams.set(i,a)});let r;try{r=await this.fetchImpl(s,{method:"GET",redirect:"follow"})}catch(i){throw j("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002",i)}if(!r.ok)throw j("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");return Ne(await r.json())}async post(t,n={},{retryOnce:s=!!n.mutationId}={}){Ce(this.endpoint);let r=JSON.stringify({action:t,operatorId:Y(),...n}),i=s?2:1;for(let a=0;a<i;a+=1)try{let o=await this.fetchImpl(this.endpoint,{method:"POST",redirect:"follow",body:r});if(!o.ok){let c=o.status===429||o.status>=500;if(a+1<i&&c)continue;throw j("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002",null,{retryable:c})}return Ne(await o.json())}catch(o){if(o?.retryable===!1)throw o;if(a+1<i)continue;throw o?.retryable?o:j("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002",o)}throw j("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002")}async listEvents(t,n){return((await this.get("staffCalendarList",{startDate:t,endDate:n})).events||[]).map(Oe)}async getEvent(t){let n=await this.get("staffCalendarGet",{id:t});return n.event?Oe(n.event):null}async createEventWithHistory(t,{mutationId:n=""}={}){let s=await this.post("staffCalendarCreate",Ct({event:t},n));return{event:s.event,history:s.history||null}}async createEvent(t,n={}){return(await this.createEventWithHistory(t,n)).event}async updateEventWithHistory(t,n,{mutationId:s=""}={}){let r=await this.post("staffCalendarUpdate",Ct({id:t,event:n},s));return{event:r.event,history:r.history||null}}async updateEvent(t,n,s={}){return(await this.updateEventWithHistory(t,n,s)).event}async deleteEventWithHistory(t,{mutationId:n=""}={}){return{history:(await this.post("staffCalendarDelete",Ct({id:t},n))).history||null}}async deleteEvent(t,n={}){await this.deleteEventWithHistory(t,n)}async findConflicts(t,n=null){if(!t.trainerId)return[];let s=t.startAt.slice(0,10);return(await this.listEvents(s,s)).filter(i=>i.id===n||i.trainerId!==t.trainerId?!1:t.startAt<i.endAt&&t.endAt>i.startAt)}async findBufferWarnings(t,n=null){let s=t.startAt.slice(0,10);return D(await this.listEvents(s,s),t,n)}async listHistory(t=50){return(await this.get("staffCalendarHistory",{limit:t})).entries||[]}async deleteHistoryResult(t){let n=await this.post("staffCalendarHistoryDelete",{historyIds:(Array.isArray(t)?t:[t]).map(String).filter(Boolean)},{retryOnce:!1});return{deleted:n.deleted||[],acknowledged:n.acknowledged||n.deleted||[]}}async deleteHistory(t){return(await this.deleteHistoryResult(t)).deleted}};var Le=["\u5C71\u7530 \u82B1\u5B50","\u4F50\u85E4 \u4E00\u90CE","\u9234\u6728 \u7F8E\u9999","\u9AD8\u6A4B \u5065","\u4F0A\u85E4 \u548C\u5B50","\u4E2D\u6751 \u76F4\u5B50","\u5C0F\u6797 \u535A","\u68EE\u4E95 \u6075","\u91CE\u53E3 \u8AA0","\u897F\u539F \u7531\u7F8E"],Re=["09:30","10:00","11:30","13:00","14:30","16:00","18:00","19:30"];function Be({id:e,date:t,time:n,duration:s=60,customerName:r,trainerIndex:i,type:a="member",notes:o=""}){let c=z(t,n);return{id:e,customerName:r,trainerId:S[i%S.length].id,startAt:c,endAt:ot(c,s),duration:s,type:a,notes:o,status:"confirmed",source:"mock",createdAt:`${t}T08:00:00`,updatedAt:`${t}T08:00:00`}}function Nt(e=new Date){let t=new Date(e.getFullYear(),e.getMonth(),1),n=[],s=[1,3,4,5,6,8,10,11,12,14,16,18,19,20,22,25,27,29],r=1;s.forEach((a,o)=>{let c=f(O(t,a-1)),d=a===11?7:o%4+1;for(let l=0;l<d;l+=1)n.push(Be({id:`mock-${r}`,date:c,time:Re[(o+l)%Re.length],duration:l%3===0?30:60,customerName:Le[(o*2+l)%Le.length],trainerIndex:o+l,type:a===11&&l===1?"trial":"member",notes:l===0&&o%3===0?"\u59FF\u52E2\u3068\u80A9\u307E\u308F\u308A\u3092\u78BA\u8A8D":""})),r+=1});let i=f(O(t,20));return n.push(Be({id:`mock-${r}`,date:i,time:"12:00",duration:90,customerName:"\u30B9\u30BF\u30C3\u30D5\u4E88\u5B9A",trainerIndex:0,type:"blocked"})),n}function Pe(e){return X.find(t=>t.id===e)||X[0]}var Fe="tamafit_staff_calendar_events_v1",Ke="tamafit_staff_calendar_history_v1";function Gn(){return globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():`booking-${Date.now()}-${Math.random().toString(16).slice(2)}`}var lt=class extends x{constructor(t=globalThis.localStorage){super(),this.storage=t}readAll(){try{let n=this.storage.getItem(Fe);if(n)return JSON.parse(n)}catch{}let t=Nt();return this.writeAll(t),t}writeAll(t){try{this.storage.setItem(Fe,JSON.stringify(t))}catch{}}readHistory(){try{let t=JSON.parse(this.storage.getItem(Ke)||"[]");return Array.isArray(t)?t:[]}catch{return[]}}writeHistory(t){try{this.storage.setItem(Ke,JSON.stringify(t.slice(0,50)))}catch{}}addHistory(t,n,s){let r=s||n;r&&this.writeHistory([{timestamp:new Date().toISOString(),action:t,source:E()?.name||"\u672A\u8A2D\u5B9A\u7AEF\u672B",id:r.id,customerName:r.customerName,trainerName:r.trainerId==="tamai"?"\u7389\u4E95":r.trainerId==="obayashi"?"\u5927\u6797":"\u6307\u5B9A\u306A\u3057",startAt:r.startAt,endAt:r.endAt,typeName:{member:"\u901A\u5E38\u4E88\u7D04",trial:"\u4F53\u9A13",consultation:"\u898B\u5B66\u30FB\u76F8\u8AC7",blocked:"\u4E88\u7D04\u30D6\u30ED\u30C3\u30AF",tentative:"\u4EEE\u4E88\u7D04\u67A0",event:"\u30A4\u30D9\u30F3\u30C8"}[r.type]||r.type,notes:r.notes||"",beforeSummary:n&&s?`${n.startAt}\u301C${n.endAt} / ${n.customerName}`:""},...this.readHistory()])}async listEvents(t,n){return this.readAll().filter(s=>s.startAt.slice(0,10)>=t&&s.startAt.slice(0,10)<=n).sort((s,r)=>s.startAt.localeCompare(r.startAt))}async getEvent(t){return this.readAll().find(n=>n.id===t)||null}async createEvent(t){let n=new Date().toISOString(),s={...t,id:Gn(),status:"confirmed",source:"staff-calendar",createdAt:n,updatedAt:n},r=this.readAll();return r.push(s),this.writeAll(r),this.addHistory("\u4F5C\u6210",null,s),s}async updateEvent(t,n){let s=this.readAll(),r=s.findIndex(a=>a.id===t);if(r<0)throw new Error("\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");let i={...s[r]};return s[r]={...s[r],...n,id:t,updatedAt:new Date().toISOString()},this.writeAll(s),this.addHistory("\u5909\u66F4",i,s[r]),s[r]}async deleteEvent(t){let n=this.readAll(),s=n.find(i=>i.id===t),r=n.filter(i=>i.id!==t);if(r.length===n.length)throw new Error("\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");this.writeAll(r),this.addHistory("\u524A\u9664",s,null)}async findConflicts(t,n=null){return t.trainerId?this.readAll().filter(s=>s.id===n||s.trainerId!==t.trainerId?!1:t.startAt<s.endAt&&t.endAt>s.startAt):[]}async findBufferWarnings(t,n=null){return D(this.readAll(),t,n)}async listHistory(t=50){return this.readHistory().slice(0,t)}async resetDemoData(){let t=Nt();return this.writeAll(t),t}};var Yn=2e4,We=4;function Ot(e){return e&&typeof e.getItem=="function"&&typeof e.setItem=="function"}function Lt(e,t,n){return e.startDate<=t&&e.endDate>=n}function ut(e){return String(e?.startAt||"").slice(0,10)}function Rt(e,t,n){return e.filter(s=>ut(s)>=t&&ut(s)<=n).sort((s,r)=>s.startAt.localeCompare(r.startAt))}function Bt(e){let t=globalThis.crypto?.randomUUID?.()||`${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;return`${e}-${Date.now()}-${t}`}function qe(e,t,n=null){return t.trainerId?e.filter(s=>s.id===n||s.trainerId!==t.trainerId?!1:t.startAt<s.endAt&&t.endAt>s.startAt):[]}var ht=class extends x{constructor(t,{storage:n=globalThis.localStorage,storageKey:s="tamafit_staff_calendar_cache_v1",now:r=()=>Date.now(),ttlMs:i=Yn}={}){super(),this.source=t,this.storage=n,this.storageKey=s,this.now=r,this.ttlMs=i,this.pendingRequests=new Map,this.cacheGeneration=0,this.snapshots=this.readSnapshots()}readSnapshots(){if(!Ot(this.storage))return[];try{let t=JSON.parse(this.storage.getItem(this.storageKey)||"[]");return Array.isArray(t)?t.filter(n=>n&&Array.isArray(n.events)&&n.startDate&&n.endDate&&n.fetchedAt!==void 0).map(n=>({...n,fetchedAt:n.events.some(s=>s.status==="pending")?0:n.fetchedAt})):[]}catch{return[]}}writeSnapshots(){if(Ot(this.storage))try{this.storage.setItem(this.storageKey,JSON.stringify(this.snapshots))}catch{}}getCachedEvents(t,n){let s=this.snapshots.filter(r=>Lt(r,t,n)).sort((r,i)=>i.fetchedAt-r.fetchedAt)[0];return s?{events:Rt(s.events,t,n),fetchedAt:s.fetchedAt,isFresh:this.now()-s.fetchedAt<this.ttlMs}:null}async listEvents(t,n){let s=this.getCachedEvents(t,n);return s?.isFresh?s.events:this.refreshEvents(t,n)}async refreshEvents(t,n){let s=`${t}:${n}`;if(this.pendingRequests.has(s))return this.pendingRequests.get(s);let r=this.cacheGeneration,i=this.source.listEvents(t,n).then(a=>{if(r!==this.cacheGeneration)return this.getCachedEvents(t,n)?.events||Rt(a,t,n);let o={startDate:t,endDate:n,events:[...a].sort((c,d)=>c.startAt.localeCompare(d.startAt)),fetchedAt:this.now()};return this.snapshots=[o,...this.snapshots.filter(c=>c.startDate!==t||c.endDate!==n)].slice(0,We),this.writeSnapshots(),Rt(o.events,t,n)}).finally(()=>this.pendingRequests.delete(s));return this.pendingRequests.set(s,i),i}invalidate(){if(this.cacheGeneration+=1,this.snapshots=[],this.pendingRequests.clear(),!!Ot(this.storage))try{this.storage.removeItem(this.storageKey)}catch{}}updateCachedEvents({removeIds:t=[],upsertEvents:n=[]}={}){this.cacheGeneration+=1;let s=new Set(t.filter(Boolean));n.forEach(i=>{i?.id&&s.add(i.id)});let r=this.snapshots.map(i=>{let a=i.events.some(c=>s.has(c.id)),o=i.events.filter(c=>!s.has(c.id));return n.forEach(c=>{let d=ut(c);d&&Lt(i,d,d)&&(o.push(c),a=!0)}),a?{...i,events:o.sort((c,d)=>c.startAt.localeCompare(d.startAt)),fetchedAt:this.now()}:i});n.forEach(i=>{let a=ut(i);!a||r.some(o=>Lt(o,a,a))||r.unshift({startDate:a,endDate:a,events:[i],fetchedAt:this.now()})}),this.snapshots=r.slice(0,We),this.writeSnapshots()}async getEvent(t){return this.snapshots.flatMap(s=>s.events).find(s=>s.id===t)||this.source.getEvent(t)}async createEvent(t){let n=await this.source.createEvent(t);return this.updateCachedEvents({upsertEvents:[n]}),n}async updateEvent(t,n){let s=await this.source.updateEvent(t,n);return this.updateCachedEvents({removeIds:[t],upsertEvents:[s]}),s}async deleteEvent(t){await this.source.deleteEvent(t),this.updateCachedEvents({removeIds:[t]})}analyzeCachedBooking(t,n=null){let s=t.startAt.slice(0,10),r=this.getCachedEvents(s,s);return r?{conflicts:qe(r.events,t,n),bufferWarnings:D(r.events,t,n),events:r.events,isFresh:r.isFresh}:null}async analyzeBooking(t,n=null){let s=this.analyzeCachedBooking(t,n);if(s)return s;let r=t.startAt.slice(0,10),i=await this.refreshEvents(r,r);return{conflicts:qe(i,t,n),bufferWarnings:D(i,t,n),events:i,isFresh:!0}}async findConflicts(t,n=null){return(await this.analyzeBooking(t,n)).conflicts}async findBufferWarnings(t,n=null){return(await this.analyzeBooking(t,n)).bufferWarnings}createEventOptimistic(t){let n=Bt("create"),s={id:`pending:${n}`,...t,status:"pending",source:"optimistic",isManaged:!0,lastUpdated:this.now()};this.updateCachedEvents({upsertEvents:[s]});let r=this.source.createEvent(t,{mutationId:n}).then(i=>(this.updateCachedEvents({removeIds:[s.id],upsertEvents:[i]}),i)).catch(i=>{throw this.updateCachedEvents({removeIds:[s.id]}),i});return{event:s,committed:r,mutationId:n}}async updateEventOptimistic(t,n){let s=await this.getEvent(t);if(!s)throw new Error("\u5909\u66F4\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");let r=Bt("update"),i={...s,...n,id:t,status:"pending",source:"optimistic",lastUpdated:this.now()};this.updateCachedEvents({removeIds:[t],upsertEvents:[i]});let a=this.source.updateEvent(t,n,{mutationId:r}).then(o=>(this.updateCachedEvents({removeIds:[t],upsertEvents:[o]}),o)).catch(o=>{throw this.updateCachedEvents({removeIds:[t],upsertEvents:[s]}),o});return{event:i,previous:s,committed:a,mutationId:r}}async deleteEventOptimistic(t){let n=await this.getEvent(t);if(!n)throw new Error("\u524A\u9664\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");let s=Bt("delete");this.updateCachedEvents({removeIds:[t]});let r=this.source.deleteEvent(t,{mutationId:s}).then(()=>n).catch(i=>{throw this.updateCachedEvents({upsertEvents:[n]}),i});return{event:n,committed:r,mutationId:s}}async listHistory(t=50){return this.source.listHistory(t)}};function k(e){return[e?.action||"",e?.customerName||"",e?.startAt||"",e?.endAt||"",e?.beforeSummary||""].join("|")}var Un=3e4,Ge=24,P=50,Pt=[1500,4e3,1e4,3e4,6e4];function J(e,t,n){try{return JSON.parse(e?.getItem(t)||"null")??n}catch{return n}}function ft(e,t,n){try{e?.setItem(t,JSON.stringify(n))}catch{}}function Ft(e){let t=globalThis.crypto?.randomUUID?.()||`${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;return`${e}-${Date.now()}-${t}`}function Vn(e){return String(e?.startAt||"").slice(0,10)}function Kt(e,t,n){let s=Vn(e);return s>=t&&s<=n}function mt(e){return[...e].sort((t,n)=>t.startAt.localeCompare(n.startAt))}function zn(e){return e==="tamai"?"\u7389\u4E95":e==="obayashi"?"\u5927\u6797":"\u6307\u5B9A\u306A\u3057"}function Xn(e){return{member:"\u901A\u5E38\u4E88\u7D04",trial:"\u4F53\u9A13",consultation:"\u898B\u5B66\u30FB\u76F8\u8AC7",blocked:"\u4E88\u7D04\u30D6\u30ED\u30C3\u30AF",tentative:"\u4EEE\u4E88\u7D04\u67A0",event:"\u30A4\u30D9\u30F3\u30C8"}[e]||e||"\u4E88\u5B9A"}function jn(e,t,n=null){return t.trainerId?e.filter(s=>s.id===n||s.trainerId!==t.trainerId?!1:t.startAt<s.endAt&&t.endAt>s.startAt):[]}var pt=class extends x{constructor(t,{storage:n=globalThis.localStorage,storageKey:s="tamafit_staff_calendar_local_first_v1",now:r=()=>Date.now(),ttlMs:i=Un}={}){super(),this.source=t,this.storage=n,this.storageKey=s,this.now=r,this.ttlMs=i,this.recordsKey=`${s}:records`,this.coverageKey=`${s}:coverage`,this.outboxKey=`${s}:outbox`,this.historyKey=`${s}:history`,this.records=J(n,this.recordsKey,[]),this.coverage=J(n,this.coverageKey,[]),this.outbox=J(n,this.outboxKey,[]),this.history=J(n,this.historyKey,[]),this.listeners=new Set,this.syncing=!1,this.retryTimer=null,this.refreshes=new Map,this.migrateLegacyCache(),queueMicrotask(()=>this.syncNow())}migrateLegacyCache(){if(this.records.length)return;let t=J(this.storage,"tamafit_staff_calendar_google_cache_v1",[]);if(!Array.isArray(t)||!t.length)return;let n=new Map;t.forEach(s=>{(s?.events||[]).forEach(r=>n.set(r.id,r))}),this.records=mt([...n.values()]),this.coverage=t.filter(s=>s?.startDate&&s?.endDate).map(s=>({startDate:s.startDate,endDate:s.endDate,fetchedAt:s.fetchedAt||0})).slice(0,Ge),this.persist()}persist(){ft(this.storage,this.recordsKey,this.records),ft(this.storage,this.coverageKey,this.coverage),ft(this.storage,this.outboxKey,this.outbox),ft(this.storage,this.historyKey,this.history.slice(0,P))}onSyncFailure(t){return this.listeners.add(t),()=>this.listeners.delete(t)}emitFailure(t){this.listeners.forEach(n=>{try{n(t)}catch{}})}getCachedEvents(t,n){let s=this.coverage.filter(r=>r.startDate<=t&&r.endDate>=n).sort((r,i)=>i.fetchedAt-r.fetchedAt)[0];return{events:mt(this.records.filter(r=>Kt(r,t,n))),fetchedAt:s?.fetchedAt||0,isFresh:!!(s&&this.now()-s.fetchedAt<this.ttlMs)}}getEventCached(t){return this.records.find(n=>n.id===t)||null}getCachedHistory(){return this.history.slice(0,P)}async listEvents(t,n){return this.getCachedEvents(t,n).events}async getEvent(t){let n=this.getEventCached(t);if(n)return n;let s=await this.source.getEvent(t);return s&&this.upsertRecord(s),s}async refreshEvents(t,n){let s=`${t}:${n}`;if(this.refreshes.has(s))return this.refreshes.get(s);let r=this.source.listEvents(t,n).then(i=>{let a=new Set(this.outbox.filter(u=>u.kind==="update"||u.kind==="delete").map(u=>u.targetId)),o=this.records.filter(u=>Kt(u,t,n)&&(u.syncState==="pending"||a.has(u.id)||String(u.id).startsWith("local:"))),c=this.records.filter(u=>!Kt(u,t,n)),d=i.filter(u=>!a.has(u.id)),l=new Map;return[...c,...d,...o].forEach(u=>l.set(u.id,u)),this.records=mt([...l.values()]),this.coverage=[{startDate:t,endDate:n,fetchedAt:this.now()},...this.coverage.filter(u=>u.startDate!==t||u.endDate!==n)].slice(0,Ge),this.persist(),this.getCachedEvents(t,n).events}).finally(()=>this.refreshes.delete(s));return this.refreshes.set(s,r),r}refreshHistory(){return this.source.listHistory(P).then(t=>{let n=this.history.filter(r=>r.localOnly),s=new Set;return this.history=[...n,...t].filter(r=>{let i=`${r.timestamp}|${r.action}|${r.id}|${r.customerName}`;return s.has(i)?!1:(s.add(i),!0)}).slice(0,P),this.persist(),this.history})}async listHistory(t=P){return this.history.slice(0,t)}upsertRecord(t,n=""){let s=new Set([n,t?.id].filter(Boolean));this.records=mt([...this.records.filter(r=>!s.has(r.id)),...t?[t]:[]]),this.persist()}removeRecord(t){this.records=this.records.filter(n=>n.id!==t),this.persist()}appendLocalHistory(t,n,s){let r=s||n;if(!r)return;let i=new Date(this.now()).toISOString();this.history=[{timestamp:i,action:t,source:E()?.name||"\u672A\u8A2D\u5B9A\u7AEF\u672B",id:r.id,customerName:r.customerName,trainerName:zn(r.trainerId),startAt:r.startAt,endAt:r.endAt,typeName:Xn(r.type),notes:r.notes||"",beforeSummary:n&&s?`${n.startAt}\u301C${n.endAt} / ${n.customerName}`:"",localOnly:!0},...this.history].slice(0,P),this.persist()}analyzeCachedBooking(t,n=null){let s=t.startAt.slice(0,10),r=this.getCachedEvents(s,s).events;return{conflicts:jn(r,t,n),bufferWarnings:D(r,t,n),events:r}}async analyzeBooking(t,n=null){return this.analyzeCachedBooking(t,n)}async findConflicts(t,n=null){return this.analyzeCachedBooking(t,n).conflicts}async findBufferWarnings(t,n=null){return this.analyzeCachedBooking(t,n).bufferWarnings}createEventOptimistic(t){let n=Ft("create"),s=`local:${n}`,r={...t,id:s,status:"confirmed",syncState:"pending",source:"local-first",isManaged:!0,lastUpdated:this.now()};return this.upsertRecord(r),this.appendLocalHistory("\u4F5C\u6210",null,r),this.outbox.push({id:n,kind:"create",targetId:s,input:t,before:null,createdAt:this.now(),attempts:0,notified:!1}),this.persist(),queueMicrotask(()=>this.syncNow()),{event:r,mutationId:n}}updateEventOptimistic(t,n){let s=this.getEventCached(t);if(!s)throw new Error("\u5909\u66F4\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");let r=Ft("update"),i={...s,...n,id:t,status:"confirmed",syncState:"pending",source:"local-first",lastUpdated:this.now()};return this.upsertRecord(i),this.appendLocalHistory("\u5909\u66F4",s,i),this.outbox.push({id:r,kind:"update",targetId:t,input:n,before:s,createdAt:this.now(),attempts:0,notified:!1}),this.persist(),queueMicrotask(()=>this.syncNow()),{event:i,previous:s,mutationId:r}}deleteEventOptimistic(t){let n=this.getEventCached(t);if(!n)throw new Error("\u524A\u9664\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");let s=Ft("delete");return this.removeRecord(t),this.appendLocalHistory("\u524A\u9664",n,null),this.outbox.push({id:s,kind:"delete",targetId:t,input:null,before:n,createdAt:this.now(),attempts:0,notified:!1}),this.persist(),queueMicrotask(()=>this.syncNow()),{event:n,mutationId:s}}async createEvent(t){return this.createEventOptimistic(t).event}async updateEvent(t,n){return this.updateEventOptimistic(t,n).event}async deleteEvent(t){this.deleteEventOptimistic(t)}rewriteTargetId(t,n){this.outbox.forEach(s=>{s.targetId===t&&(s.targetId=n),s.before?.id===t&&(s.before={...s.before,id:n})})}rollback(t,n){t.kind==="create"?this.removeRecord(t.targetId):t.before&&this.upsertRecord({...t.before,syncState:void 0}),this.outbox=this.outbox.filter(s=>s.id!==t.id),this.persist(),this.emitFailure({op:t,error:n,rolledBack:!0})}scheduleRetry(t,n){t.attempts=Number(t.attempts||0)+1;let s=Math.min(t.attempts-1,Pt.length-1);t.nextAttemptAt=this.now()+Pt[s],t.attempts>=3&&!t.notified&&(t.notified=!0,this.emitFailure({op:t,error:n,rolledBack:!1,deferred:!0})),this.persist(),clearTimeout(this.retryTimer),this.retryTimer=setTimeout(()=>this.syncNow(),Pt[s])}async syncOperation(t){if(t.kind==="create"){let n=await this.source.createEvent(t.input,{mutationId:t.id}),s=t.targetId,r=this.outbox.slice(1).filter(a=>a.targetId===s);this.rewriteTargetId(s,n.id);let i=this.getEventCached(s);this.removeRecord(s),r.some(a=>a.kind==="delete")||this.upsertRecord(r.length&&i?{...i,id:n.id,syncState:"pending",source:"local-first"}:{...n,syncState:void 0});return}if(t.kind==="update"){let n=await this.source.updateEvent(t.targetId,t.input,{mutationId:t.id});this.outbox.slice(1).some(r=>r.targetId===t.targetId)||this.upsertRecord({...n,syncState:void 0});return}t.kind==="delete"&&await this.source.deleteEvent(t.targetId,{mutationId:t.id})}async syncNow(){if(!(this.syncing||!this.outbox.length)&&!(typeof navigator<"u"&&navigator.onLine===!1)){this.syncing=!0,clearTimeout(this.retryTimer);try{for(;this.outbox.length;){let t=this.outbox[0];if(t.nextAttemptAt&&t.nextAttemptAt>this.now()){this.scheduleRetry(t,new Error("\u518D\u8A66\u884C\u5F85\u3061"));break}try{await this.syncOperation(t),this.outbox.shift(),this.persist()}catch(n){if(n?.retryable!==!1){this.scheduleRetry(t,n);break}this.rollback(t,n)}}}finally{this.syncing=!1}}}};var Jn=90,Qn=41,Zn="recurring:",Ye=50;function Ve(e,t){return Math.round((N(t).getTime()-N(e).getTime())/864e5)}function Gt(e){let t=new Date(e.getFullYear(),e.getMonth(),1),n=new Date(e.getFullYear(),e.getMonth()+1,0);return{startDate:f(t),endDate:f(n)}}function Ue(e,t){let n=N(e),s=N(t);if(!(Ve(e,t)===Qn&&n.getDay()===0&&s.getDay()===6))return{startDate:e,endDate:t};let i=new Date(n.getFullYear(),n.getMonth(),n.getDate()+7);return Gt(i)}function ts(e){return`${Zn}${encodeURIComponent(e.id)}:${e.startAt}`}function Wt(e,t){try{let n=JSON.parse(e?.getItem(t)||"[]");return new Set(Array.isArray(n)?n.map(String):[])}catch{return new Set}}function qt(e,t,n){try{e?.setItem(t,JSON.stringify([...n]))}catch{}}function es(e){return String(e||"").startsWith("local:")||String(e||"").startsWith("local-legacy:")}function ns(e,t=new Set){let n=new Map;return e.forEach(s=>n.set(s.id,(n.get(s.id)||0)+1)),n.forEach((s,r)=>{s>1&&t.add(r)}),e.map(s=>t.has(s.id)?{...s,calendarEventId:s.id,id:ts(s),isRecurring:!0,readOnly:!0}:s)}function ss(e,t){return new Proxy(e,{get(n,s,r){if(s==="listEvents")return async(...a)=>ns(await n.listEvents(...a),t);let i=Reflect.get(n,s,r);return typeof i=="function"?i.bind(n):i}})}var yt=class extends pt{constructor(t,n={}){let s=new Set;super(ss(t,s),n),this.knownRecurringSeriesIds=s,this.changeListeners=new Set,this.historyDeleteSyncing=!1,this.historyHiddenIdsKey=`${this.storageKey}:history-hidden-ids`,this.historyHiddenMutationIdsKey=`${this.storageKey}:history-hidden-mutations`,this.historyHiddenSemanticKeysKey=`${this.storageKey}:history-hidden-semantic`,this.hiddenHistoryIds=Wt(this.storage,this.historyHiddenIdsKey),this.hiddenHistoryMutationIds=Wt(this.storage,this.historyHiddenMutationIdsKey),this.hiddenHistorySemanticKeys=Wt(this.storage,this.historyHiddenSemanticKeysKey),this.ensureHistoryIds(),queueMicrotask(()=>this.syncHistoryDeletes())}onChange(t){return this.changeListeners.add(t),()=>this.changeListeners.delete(t)}emitChange(){this.changeListeners.forEach(t=>{try{t()}catch{}})}getCachedEvents(t,n){let s=Ue(t,n);return super.getCachedEvents(s.startDate,s.endDate)}ensureHistoryIds(){let t=!1;this.history=this.history.map((n,s)=>{if(n?.historyId)return n;t=!0;let r=encodeURIComponent(k(n)).slice(0,180);return{...n,historyId:`local-legacy:${r}:${s}`}}),t&&this.persist()}persistHistoryDeletionState(){qt(this.storage,this.historyHiddenIdsKey,this.hiddenHistoryIds),qt(this.storage,this.historyHiddenMutationIdsKey,this.hiddenHistoryMutationIds),qt(this.storage,this.historyHiddenSemanticKeysKey,this.hiddenHistorySemanticKeys)}markNewestLocalHistory(t){let n=this.history[0];n?.localOnly&&(this.history[0]={...n,historyId:`local:${t}`,mutationId:t},this.persist())}createEventOptimistic(t){let n=super.createEventOptimistic(t);return this.markNewestLocalHistory(n.mutationId),n}updateEventOptimistic(t,n){let s=super.updateEventOptimistic(t,n);return this.markNewestLocalHistory(s.mutationId),s}deleteEventOptimistic(t){let n=super.deleteEventOptimistic(t);return this.markNewestLocalHistory(n.mutationId),n}async refreshOneRange(t,n){let s=this.getCachedEvents(t,n);if(s.isFresh)return s.events;let r=await super.refreshEvents(t,n);return this.emitChange(),r}async prefetchCurrentAndNextMonth(){let t=new Date(this.now()),n=[Gt(t),Gt(B(t,1))];for(let s of n)try{await this.refreshOneRange(s.startDate,s.endDate)}catch{}return this.getCachedEvents(n[0].startDate,n[1].endDate).events}async refreshEvents(t,n){if(Ve(t,n)>Jn)return this.prefetchCurrentAndNextMonth();let s=Ue(t,n);return this.refreshOneRange(s.startDate,s.endDate)}async refreshHistory(){let t=await this.source.listHistory(Ye);t.forEach(r=>{let i=r.mutationId&&this.hiddenHistoryMutationIds.has(String(r.mutationId)),a=k(r),o=this.hiddenHistorySemanticKeys.has(a);!i&&!o||(r.historyId&&this.hiddenHistoryIds.add(String(r.historyId)),i&&this.hiddenHistoryMutationIds.delete(String(r.mutationId)),o&&this.hiddenHistorySemanticKeys.delete(a))});let n=this.history.filter(r=>!(!r.localOnly||r.historyId&&this.hiddenHistoryIds.has(String(r.historyId))||r.mutationId&&this.hiddenHistoryMutationIds.has(String(r.mutationId))||this.hiddenHistorySemanticKeys.has(k(r)))),s=new Set;return this.history=[...t,...n].filter(r=>{if(r.historyId&&this.hiddenHistoryIds.has(String(r.historyId))||r.mutationId&&this.hiddenHistoryMutationIds.has(String(r.mutationId))||this.hiddenHistorySemanticKeys.has(k(r)))return!1;let i=r.mutationId?`mutation:${r.mutationId}`:`semantic:${k(r)}`;return s.has(i)?!1:(s.add(i),!0)}).slice(0,Ye),this.persist(),this.persistHistoryDeletionState(),this.emitChange(),queueMicrotask(()=>this.syncHistoryDeletes()),this.history}deleteHistoryOptimistic(t){let n=new Set((Array.isArray(t)?t:[t]).map(String).filter(Boolean));if(!n.size)return[];let s=this.history.filter(r=>n.has(String(r.historyId||"")));return s.forEach(r=>{let i=String(r.historyId||"");es(i)?r.mutationId?this.hiddenHistoryMutationIds.add(String(r.mutationId)):this.hiddenHistorySemanticKeys.add(k(r)):this.hiddenHistoryIds.add(i)}),this.history=this.history.filter(r=>!n.has(String(r.historyId||""))),this.persist(),this.persistHistoryDeletionState(),this.emitChange(),queueMicrotask(()=>this.syncHistoryDeletes()),s}async syncHistoryDeletes(){if(this.historyDeleteSyncing||!this.hiddenHistoryIds.size||typeof navigator<"u"&&navigator.onLine===!1||typeof this.source.deleteHistory!="function")return;this.historyDeleteSyncing=!0;let t=[...this.hiddenHistoryIds];try{await this.source.deleteHistory(t),t.forEach(n=>this.hiddenHistoryIds.delete(n)),this.persistHistoryDeletionState()}catch{}finally{this.historyDeleteSyncing=!1}}rollback(t,n){let s=this.outbox.slice(1).filter(r=>r.targetId===t.targetId);if(t.kind==="create"&&s.length){let r=new Set(s.map(i=>i.id));this.outbox=this.outbox.filter(i=>!r.has(i.id))}if(t.kind==="update"&&s.length){this.outbox=this.outbox.filter(r=>r.id!==t.id),this.persist(),this.emitChange();return}super.rollback(t,n),this.emitChange()}async syncNow(){if(!this.syncing){if(!this.outbox.length){this.syncHistoryDeletes();return}if(!(typeof navigator<"u"&&navigator.onLine===!1)){this.syncing=!0,clearTimeout(this.retryTimer);try{for(;this.outbox.length;){let t=this.outbox[0];if(t.nextAttemptAt&&t.nextAttemptAt>this.now()){let n=Math.max(50,t.nextAttemptAt-this.now());clearTimeout(this.retryTimer),this.retryTimer=setTimeout(()=>this.syncNow(),n);break}try{await this.syncOperation(t),this.outbox.shift(),this.persist(),this.emitChange()}catch(n){if(n?.retryable!==!1){this.scheduleRetry(t,n);break}this.rollback(t,n)}}}finally{this.syncing=!1}this.syncHistoryDeletes(),!this.outbox.length&&(this.hiddenHistoryMutationIds.size||this.hiddenHistorySemanticKeys.size)&&this.refreshHistory().catch(()=>{})}}}};var Vt=50,rs="Google\u30AB\u30EC\u30F3\u30C0\u30FC\u76F4\u63A5\u64CD\u4F5C";function ze(e,t){try{let n=JSON.parse(e?.getItem(t)||"[]");return new Set(Array.isArray(n)?n.map(String):[])}catch{return new Set}}function Xe(e,t,n){try{e?.setItem(t,JSON.stringify([...n]))}catch{}}function Je(e){let t=String(e||"");if(!t)return"";let n=NaN;if(/Z$/.test(t))n=Date.parse(t);else{let s=t.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);s&&(n=Date.parse(`${s[1]}-${s[2]}-${s[3]}T${s[4]}:${s[5]}:00+09:00`))}return Number.isFinite(n)?String(Math.floor(n/6e4)):t.slice(0,16)}function Q(e){return[e?.action||"",e?.customerName||"",e?.startAt||"",e?.endAt||"",Je(e?.timestamp)].join("|")}function je(e){let t=Je(e?.timestamp);return/^\d+$/.test(t)?Number(t):0}function Yt(e){let t=String(e?.historyId||"");return!!(t&&!t.startsWith("local:")&&!t.startsWith("local-legacy:"))}function Ut(e,t,n=()=>!1){let s=[...Array.isArray(e)?e:[],...Array.isArray(t)?t:[]],r=new Set,i=new Set,a=new Set,o=[];return s.forEach(c=>{if(!c||n(c))return;let d=String(c.mutationId||""),l=String(c.historyId||""),u=Q(c);d&&r.has(d)||l&&i.has(l)||u&&a.has(u)||(d&&r.add(d),l&&i.add(l),u&&a.add(u),o.push(c))}),o.sort((c,d)=>je(d)-je(c)).slice(0,Vt)}var gt=class extends yt{constructor(t,n={}){super(t,n),this.historyPendingDeleteIdsKey=`${this.storageKey}:history-pending-delete-ids-v2`,this.historyHiddenLegacyKeysKey=`${this.storageKey}:history-hidden-legacy-ops-v2`,this.historyMigrationKey=`${this.storageKey}:history-migration-v2`,this.pendingHistoryDeleteIds=ze(this.storage,this.historyPendingDeleteIdsKey),this.hiddenHistoryLegacyKeys=ze(this.storage,this.historyHiddenLegacyKeysKey),this.hiddenHistoryIds.forEach(s=>this.pendingHistoryDeleteIds.add(s)),this.migrateHistoryV2(),this.persistHistoryV2State(),queueMicrotask(()=>this.syncHistoryDeletes())}persistHistoryV2State(){this.persistHistoryDeletionState(),Xe(this.storage,this.historyPendingDeleteIdsKey,this.pendingHistoryDeleteIds),Xe(this.storage,this.historyHiddenLegacyKeysKey,this.hiddenHistoryLegacyKeys)}migrateHistoryV2(){if(this.storage?.getItem(this.historyMigrationKey)==="done")return;let t=this.history.filter(s=>Yt(s)),n=this.history.filter(s=>!Yt(s));this.history=Ut(t,n,s=>this.isHistoryHidden(s)),this.persist();try{this.storage?.setItem(this.historyMigrationKey,"done")}catch{}}isHistoryHidden(t){let n=String(t?.historyId||""),s=String(t?.mutationId||"");return!!(n&&this.hiddenHistoryIds.has(n)||s&&this.hiddenHistoryMutationIds.has(s)||this.hiddenHistorySemanticKeys.has(k(t))||this.hiddenHistoryLegacyKeys.has(Q(t)))}hideHistoryEntry(t,{queueServerDelete:n=!0}={}){if(!t)return;let s=String(t.historyId||""),r=String(t.mutationId||""),i=Q(t);s&&Yt(t)&&(this.hiddenHistoryIds.add(s),n&&this.pendingHistoryDeleteIds.add(s)),r&&this.hiddenHistoryMutationIds.add(r),i&&this.hiddenHistoryLegacyKeys.add(i),this.hiddenHistorySemanticKeys.add(k(t))}isLegacyRecurringAudit(t){if(t?.source!==rs||t?.action!=="\u5909\u66F4")return!1;let n=String(t?.id||"");return!!(n&&this.knownRecurringSeriesIds.has(n))}purgeKnownRecurringHistory(){let t=!1;this.history.forEach(n=>{this.isLegacyRecurringAudit(n)&&(this.hideHistoryEntry(n),t=!0)}),t&&(this.history=this.history.filter(n=>!this.isLegacyRecurringAudit(n)),this.persist(),this.persistHistoryV2State(),this.emitChange(),queueMicrotask(()=>this.syncHistoryDeletes()))}async refreshOneRange(t,n){let s=await super.refreshOneRange(t,n),r=!1;return s.forEach(i=>{if(!i?.isRecurring)return;let a=String(i.calendarEventId||i.id||"");!a||this.knownRecurringSeriesIds.has(a)||(this.knownRecurringSeriesIds.add(a),r=!0)}),r&&this.purgeKnownRecurringHistory(),s}async refreshHistory(){let t=await this.source.listHistory(Vt),n=[];t.forEach(r=>{if(this.isLegacyRecurringAudit(r)||this.isHistoryHidden(r)){this.hideHistoryEntry(r);return}n.push(r)});let s=this.history.filter(r=>r.localOnly&&!this.isHistoryHidden(r));return this.history=Ut(n,s,r=>this.isHistoryHidden(r)),this.persist(),this.persistHistoryV2State(),this.emitChange(),queueMicrotask(()=>this.syncHistoryDeletes()),this.history}deleteHistoryOptimistic(t){let n=new Set((Array.isArray(t)?t:[t]).map(String).filter(Boolean));if(!n.size)return[];let s=this.history.filter(r=>n.has(String(r.historyId||"")));return s.forEach(r=>this.hideHistoryEntry(r)),this.history=this.history.filter(r=>!n.has(String(r.historyId||""))),this.persist(),this.persistHistoryV2State(),this.emitChange(),queueMicrotask(()=>this.syncHistoryDeletes()),s}promoteMutationHistory(t,n){let s=String(t||"");if(!s)return;let r=this.history.find(o=>String(o.mutationId||"")===s);if(this.hiddenHistoryMutationIds.has(s)||r&&this.isHistoryHidden(r)){n&&this.hideHistoryEntry({...n,mutationId:n.mutationId||s}),this.history=this.history.filter(o=>String(o.mutationId||"")!==s),this.persist(),this.persistHistoryV2State(),queueMicrotask(()=>this.syncHistoryDeletes());return}if(!n)return;let i={...n,mutationId:n.mutationId||s,localOnly:!1},a=Q(i);this.history=this.history.filter(o=>String(o.mutationId||"")!==s&&Q(o)!==a),this.history=Ut([i],this.history,o=>this.isHistoryHidden(o)),this.persist()}async syncHistoryDeletes(){if(this.historyDeleteSyncing||!this.pendingHistoryDeleteIds.size||typeof navigator<"u"&&navigator.onLine===!1||typeof this.source.deleteHistory!="function"&&typeof this.source.deleteHistoryResult!="function")return;this.historyDeleteSyncing=!0;let t=[...this.pendingHistoryDeleteIds].slice(0,Vt);try{let n=[];if(typeof this.source.deleteHistoryResult=="function"){let s=await this.source.deleteHistoryResult(t);n=s?.acknowledged||s?.deleted||[]}else n=await this.source.deleteHistory(t);n.map(String).forEach(s=>this.pendingHistoryDeleteIds.delete(s)),this.persistHistoryV2State()}catch{}finally{this.historyDeleteSyncing=!1}}async syncOperation(t){if(t.kind==="create"){let n=typeof this.source.createEventWithHistory=="function"?await this.source.createEventWithHistory(t.input,{mutationId:t.id}):{event:await this.source.createEvent(t.input,{mutationId:t.id}),history:null},s=n.event,r=t.targetId,i=this.outbox.slice(1).filter(o=>o.targetId===r);this.rewriteTargetId(r,s.id);let a=this.getEventCached(r);this.removeRecord(r),i.some(o=>o.kind==="delete")||this.upsertRecord(i.length&&a?{...a,id:s.id,syncState:"pending",source:"local-first"}:{...s,syncState:void 0}),this.promoteMutationHistory(t.id,n.history);return}if(t.kind==="update"){let n=typeof this.source.updateEventWithHistory=="function"?await this.source.updateEventWithHistory(t.targetId,t.input,{mutationId:t.id}):{event:await this.source.updateEvent(t.targetId,t.input,{mutationId:t.id}),history:null};this.outbox.slice(1).some(r=>r.targetId===t.targetId)||this.upsertRecord({...n.event,syncState:void 0}),this.promoteMutationHistory(t.id,n.history);return}if(t.kind==="delete"){let n=typeof this.source.deleteEventWithHistory=="function"?await this.source.deleteEventWithHistory(t.targetId,{mutationId:t.id}):(await this.source.deleteEvent(t.targetId,{mutationId:t.id}),{history:null});this.promoteMutationHistory(t.id,n.history)}}};function is(e,t){let n=Date.parse(`${e}T00:00:00Z`),s=Date.parse(`${t}T00:00:00Z`);return!Number.isFinite(n)||!Number.isFinite(s)?0:Math.round((s-n)/864e5)}function as(e,{windowRef:t=globalThis.window,timeout:n=1200,fallbackDelay:s=350}={}){if(typeof t?.requestIdleCallback=="function"){let i=t.requestIdleCallback(e,{timeout:n});return()=>t.cancelIdleCallback?.(i)}let r=globalThis.setTimeout(e,s);return()=>globalThis.clearTimeout(r)}function Qe(e,{windowRef:t=globalThis.window}={}){let n=!1,s=null,r=!1,i=(a,o={})=>as(a,{windowRef:t,...o});return new Proxy(e,{get(a,o,c){if(o==="refreshEvents")return(l,u)=>is(l,u)>90?(r||(r=!0,i(()=>{r=!1,a.refreshEvents(l,u).catch(()=>{})},{timeout:900,fallbackDelay:250})),Promise.resolve(a.getCachedEvents(l,u)?.events||[])):a.refreshEvents(l,u);if(o==="refreshHistory")return(...l)=>{let u=/^#\/history(?:$|[/?])/.test(String(t?.location?.hash||""));return!n&&!u?(n=!0,s=i(()=>{s=null,a.refreshHistory(...l).catch(()=>{})},{timeout:1600,fallbackDelay:700}),Promise.resolve(a.getCachedHistory?.()||[])):(s&&(s(),s=null),a.refreshHistory(...l))};let d=Reflect.get(a,o,c);return typeof d=="function"?d.bind(a):d}})}function Ze(){return window.location.protocol==="file:"&&!window.TAMAFIT_USE_LIVE_CALENDAR?new ht(new lt,{storageKey:"tamafit_staff_calendar_mock_cache_v1"}):Qe(new gt(new dt,{storageKey:"tamafit_staff_calendar_local_first_v1"}))}function h(e){return String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function g(e){return h(e)}function _(e,{title:t=Ae,subtitle:n="\u30B9\u30BF\u30C3\u30D5\u30AB\u30EC\u30F3\u30C0\u30FC",backAction:s="",showAdd:r=!0,isRefreshing:i=!1}={}){let a=E();return`
    <div class="app-shell">
      <header class="app-header">
        <div class="app-header__inner">
          ${s?`
            <button class="icon-button" type="button" data-action="${s}" aria-label="\u524D\u306E\u753B\u9762\u3078\u623B\u308B">
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
          ${r?`
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
          <strong>${a?.name||"\u672A\u8A2D\u5B9A"}</strong>
          <small>\u5909\u66F4</small>
        </button>
      </footer>
    </div>
  `}function zt(e){return _(`
    <section class="state-panel">
      <span class="state-panel__icon" aria-hidden="true">!</span>
      <h2>\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F</h2>
      <p>${e}</p>
      <button class="button button--primary" type="button" data-action="reload">\u3082\u3046\u4E00\u5EA6\u8A66\u3059</button>
    </section>
  `)}function Xt({event:e=null,defaultDate:t,defaultTrainerId:n="tamai"}){let s=!!e,r=e?Mt(e.startAt):{date:t,time:"10:00"},i=e?.type||"member",a=e?e.trainerId:n,o=_e(ke,Te,De),c=`
    <section class="booking-form-view">
      <div class="form-heading">
        <p class="eyebrow">${s?"\u4E88\u7D04\u5185\u5BB9\u306E\u5909\u66F4":"\u65B0\u3057\u3044\u4E88\u7D04"}</p>
        <h1>${s?"\u4E88\u7D04\u3092\u7DE8\u96C6":"\u4E88\u7D04\u3092\u8FFD\u52A0"}</h1>
        <p>\u4FDD\u5B58\u3059\u308B\u3068\u3059\u3050\u753B\u9762\u306B\u53CD\u6620\u3055\u308C\u3001Google\u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u306E\u540C\u671F\u306F\u88CF\u5074\u3067\u884C\u308F\u308C\u307E\u3059\u3002</p>
      </div>

      <form class="booking-form" id="bookingForm" data-event-id="${g(e?.id||"")}">
        <div class="field field--full">
          <label for="customerName">\u304A\u5BA2\u69D8\u540D\u30FB\u4E88\u5B9A\u540D</label>
          <input id="customerName" name="customerName" type="text" value="${g(e?.customerName||"")}" placeholder="\u4F8B\uFF1A\u5C71\u7530 \u82B1\u5B50" autocomplete="off" required>
          <small>\u4E88\u7D04\u30D6\u30ED\u30C3\u30AF\u30FB\u4EEE\u4E88\u7D04\u67A0\u30FB\u30A4\u30D9\u30F3\u30C8\u3067\u306F\u3001\u7528\u9014\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002</small>
        </div>

        <div class="field field--full">
          <label for="trainerId">\u62C5\u5F53\u30C8\u30EC\u30FC\u30CA\u30FC</label>
          <div class="select-wrap">
            <select id="trainerId" name="trainerId">
              <option value="" ${a===""?"selected":""}>\u6307\u5B9A\u306A\u3057\uFF08\u5171\u901A\u4E88\u5B9A\uFF09</option>
              ${S.map(d=>`<option value="${d.id}" ${a===d.id?"selected":""}>${h(d.name)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="bookingDate">\u4E88\u7D04\u65E5</label>
          <input id="bookingDate" name="date" type="date" value="${g(r.date)}" required>
        </div>

        <div class="field">
          <label for="bookingTime">\u958B\u59CB\u6642\u9593</label>
          <div class="select-wrap">
            <select id="bookingTime" name="time" required>
              ${o.map(d=>`<option value="${d}" ${r.time===d?"selected":""}>${d}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="duration">\u6240\u8981\u6642\u9593</label>
          <div class="select-wrap">
            <select id="duration" name="duration" required>
              ${xe.map(d=>`<option value="${d}" ${(e?.duration||60)===d?"selected":""}>${d}\u5206</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="bookingType">\u4E88\u7D04\u7A2E\u985E</label>
          <div class="select-wrap">
            <select id="bookingType" name="type" required>
              ${X.map(d=>`<option value="${d.id}" ${i===d.id?"selected":""}>${h(d.name)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field field--full">
          <label for="notes">\u30E1\u30E2 <span>\u4EFB\u610F</span></label>
          <textarea id="notes" name="notes" rows="3" placeholder="\u5F53\u65E5\u306E\u6CE8\u610F\u70B9\u3084\u7533\u3057\u9001\u308A">${h(e?.notes||"")}</textarea>
        </div>

        <div class="form-message" id="formMessage" role="alert"></div>

        <div class="form-actions">
          ${s?`<button class="button button--danger" type="button" data-action="delete-booking" data-id="${g(e.id)}">\u4E88\u7D04\u3092\u524A\u9664</button>`:""}
          <button class="button button--primary ${s?"":"button--wide"}" type="submit">${s?"\u5909\u66F4\u3092\u4FDD\u5B58":"\u4E88\u7D04\u3059\u308B"}</button>
        </div>
      </form>
    </section>
  `;return _(c,{title:s?"\u4E88\u7D04\u3092\u7DE8\u96C6":"\u4E88\u7D04\u3092\u8FFD\u52A0",subtitle:"\u30B9\u30BF\u30C3\u30D5\u30AB\u30EC\u30F3\u30C0\u30FC",backAction:"back-from-form",showAdd:!1})}function os(e){let t=S.find(o=>o.id===e.trainerId),n=Pe(e.type),s=["member","trial","consultation"].includes(e.type),r=e.type==="trial"?"amber":t?.color||"neutral",i=!!e.isRecurring,a=i?'aria-disabled="true" title="\u7E70\u308A\u8FD4\u3057\u4E88\u5B9A\u306FGoogle\u30AB\u30EC\u30F3\u30C0\u30FC\u304B\u3089\u7DE8\u96C6\u3057\u3066\u304F\u3060\u3055\u3044"':`data-action="edit-booking" data-id="${e.id}"`;return`
    <button class="day-event day-event--${r}${i?" is-readonly":""}" type="button" ${a}>
      <span class="day-event__time">
        <strong>${e.startAt.slice(11,16)}</strong>
        <small>${e.endAt.slice(11,16)}</small>
      </span>
      <span class="day-event__line" aria-hidden="true"></span>
      <span class="day-event__content">
        <span class="day-event__badges">
          <small>${h(t?.name||"\u6307\u5B9A\u306A\u3057")}</small>
          <small>${h(n.name)}</small>
          ${i?"<small>\u5B9A\u671F</small>":""}
        </span>
        <strong>${h(s?`${e.customerName} \u69D8`:e.customerName)}</strong>
        <span>${e.duration}\u5206${e.notes?`\u30FB${h(e.notes)}`:""}</span>
      </span>
      ${i?'<span class="sync-badge" aria-label="Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306E\u7E70\u308A\u8FD4\u3057\u4E88\u5B9A">\u5B9A\u671F</span>':`<span class="day-event__manage" aria-label="\u30BF\u30C3\u30D7\u3057\u3066\u5909\u66F4\u307E\u305F\u306F\u524A\u9664">
            <span class="day-event__manage-edit">\u5909\u66F4</span>
            <span class="day-event__manage-separator">\u30FB</span>
            <span class="day-event__manage-delete">\u524A\u9664</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          </span>`}
    </button>
  `}function tn(e,t){let n=f(e),s=`
    <section class="day-view">
      <div class="day-summary">
        <div>
          <p class="eyebrow">1\u65E5\u306E\u4E88\u7D04</p>
          <h1>${Ht(e)}</h1>
        </div>
        <span class="count-badge">${t.length}\u4EF6</span>
      </div>

      <div class="day-event-list">
        ${t.length?t.map(os).join(""):`
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
  `;return _(s,{title:"\u4E88\u7D04\u4E00\u89A7",subtitle:Ht(e),backAction:"back-to-calendar",showAdd:!1})}var en=10;function vt(e){return{\u4F5C\u6210:"\u65B0\u898F\u4E88\u7D04",\u5909\u66F4:"\u5185\u5BB9\u5909\u66F4",\u524A\u9664:"\u4E88\u7D04\u524A\u9664"}[e]||String(e||"\u64CD\u4F5C")}function jt(e){return{\u4F5C\u6210:"create",\u5909\u66F4:"update",\u524A\u9664:"delete"}[e]||"other"}function cs(e){let t=String(e||"").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);return t?{month:Number(t[2]),day:Number(t[3]),hour:t[4],minute:t[5]}:null}function bt(e){let t=String(e||"");if(!t)return"\u65E5\u6642\u4E0D\u660E";if(/Z$/.test(t)){let s=new Date(t);if(!Number.isNaN(s.getTime()))return new Intl.DateTimeFormat("ja-JP",{timeZone:"Asia/Tokyo",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:!1}).format(s)}let n=cs(t);return n?`${n.month}/${n.day} ${n.hour}:${n.minute}`:t.slice(0,16)}function ds(e){let t=bt(e),n=t.match(/(\d{1,2}:\d{2})$/);return n?n[1]:t}function wt(e,t=en){let n=(Array.isArray(e)?e:[]).slice(0,t),s=n.length?n.map(r=>`
        <div class="recent-history__row">
          <time>${h(ds(r.timestamp))}</time>
          <strong title="${g(r.customerName||"\u540D\u79F0\u306A\u3057")}">${h(r.customerName||"\u540D\u79F0\u306A\u3057")}</strong>
          <span>${h(vt(r.action))}</span>
        </div>
      `).join(""):'<p class="recent-history__empty">\u64CD\u4F5C\u5C65\u6B74\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093</p>';return`
    <section class="recent-history" aria-label="\u6700\u8FD1\u306E\u64CD\u4F5C\u30ED\u30B0">
      <div class="recent-history__heading">
        <strong>\u6700\u8FD1\u306E\u64CD\u4F5C\u30ED\u30B0</strong>
        <span>${en}\u4EF6</span>
      </div>
      <div class="recent-history__list">${s}</div>
      <button class="recent-history__more" type="button" data-action="open-history">
        \u5C65\u6B74\u3092\u3059\u3079\u3066\u898B\u308B
        <span aria-hidden="true">\u203A</span>
      </button>
    </section>
  `}function ls(e){let t=String(e.startAt||"").replace("T"," ").slice(0,16),n=String(e.endAt||"").slice(11,16);return`${t}\u301C${n}`}function us(e){let t=String(e.historyId||""),n=!!t;return`
    <article class="history-entry history-entry--${jt(e.action)} is-organizing-row" data-history-entry="${g(t)}">
      <label class="history-entry__organize-row">
        ${n?`
          <span class="history-entry__select" aria-label="\u3053\u306E\u5C65\u6B74\u3092\u9078\u629E">
            <input type="checkbox" data-history-select value="${g(t)}">
            <span aria-hidden="true"></span>
          </span>
        `:'<span class="history-entry__select-placeholder" aria-hidden="true"></span>'}
        <time>${h(bt(e.timestamp))}</time>
        <strong title="${g(e.customerName||"\u540D\u79F0\u306A\u3057")}">${h(e.customerName||"\u540D\u79F0\u306A\u3057")}</strong>
        <span>${h(vt(e.action))}</span>
      </label>
    </article>
  `}function hs(e,{organizing:t=!1}={}){if(t)return us(e);let n=String(e.historyId||""),s=!!n;return`
    <details class="history-entry history-entry--${jt(e.action)}" data-history-entry="${g(n)}">
      <summary class="history-entry__summary">
        <time>${h(bt(e.timestamp))}</time>
        <strong title="${g(e.customerName||"\u540D\u79F0\u306A\u3057")}">${h(e.customerName||"\u540D\u79F0\u306A\u3057")}</strong>
        <span>${h(vt(e.action))}</span>
        <i aria-hidden="true">\u203A</i>
      </summary>
      <div class="history-entry__details">
        <div class="history-entry__details-line">
          <span>\u4E88\u7D04</span>
          <strong>${h(ls(e))}</strong>
        </div>
        <div class="history-entry__details-line">
          <span>\u64CD\u4F5C</span>
          <strong>${h(e.source||"\u4E0D\u660E")}</strong>
        </div>
        <div class="history-entry__details-line">
          <span>\u62C5\u5F53</span>
          <strong>${h(e.trainerName||"\u6307\u5B9A\u306A\u3057")}</strong>
        </div>
        <div class="history-entry__details-line">
          <span>\u7A2E\u985E</span>
          <strong>${h(e.typeName||"\u4E88\u5B9A")}</strong>
        </div>
        ${e.beforeSummary?`
          <div class="history-entry__details-line history-entry__before">
            <span>\u5909\u66F4\u524D</span>
            <strong>${h(e.beforeSummary)}</strong>
          </div>
        `:""}
        ${s?`
          <button class="history-entry__delete" type="button" data-action="delete-history-one" data-history-id="${g(n)}">\u3053\u306E\u8A18\u9332\u3092\u524A\u9664</button>
        `:""}
      </div>
    </details>
  `}function Jt(e,{organizing:t=!1}={}){let n=Array.isArray(e)?e:[],s=`
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
        ${n.length?n.map(r=>hs(r,{organizing:t})).join(""):`
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
  `;return _(s,{title:"\u64CD\u4F5C\u5C65\u6B74",subtitle:"\u30B9\u30BF\u30C3\u30D5\u30AB\u30EC\u30F3\u30C0\u30FC",backAction:"back-to-calendar",showAdd:!1})}function fs(e){return e.reduce((t,n)=>{let s=n.startAt.slice(0,10);return t[s]||=[],t[s].push(n),t},{})}function ms(e){let t=S.find(i=>i.id===e.trainerId),n=e.startAt.slice(11,16),s=Array.from(e.customerName.split(/[ 　]/)[0]).slice(0,2).join("");return`
    <span class="month-event month-event--${e.type==="trial"?"amber":t?.color||"neutral"}" title="${g(`${n} ${e.customerName}`)}">
      <b>${h(n)}</b><span>${h(s)}</span>
    </span>
  `}function nn(e,t,n=[]){let s=at(e),r=fs(t),i=e.getMonth(),a=s.map(c=>{let d=f(c),l=r[d]||[],u=l.slice(0,He),w=l.length-u.length,p=["month-cell"];return c.getMonth()!==i&&p.push("is-outside"),ct(c)&&p.push("is-today"),c.getDay()===0&&p.push("is-sunday"),c.getDay()===6&&p.push("is-saturday"),`
      <button class="${p.join(" ")}" type="button" data-action="open-day" data-date="${d}" aria-label="${c.getMonth()+1}\u6708${c.getDate()}\u65E5\u3001\u4E88\u7D04${l.length}\u4EF6">
        <span class="month-cell__date">${c.getDate()}</span>
        <span class="month-cell__events">
          ${u.map(ms).join("")}
          ${w>0?`<span class="month-event-more">\u307B\u304B${w}\u4EF6</span>`:""}
        </span>
      </button>
    `}).join(""),o=`
    <section class="calendar-view" aria-labelledby="calendarTitle">
      <div class="calendar-toolbar">
        <div class="calendar-toolbar__month-nav">
          <button class="icon-button icon-button--subtle" type="button" data-action="previous-month" aria-label="\u524D\u306E\u6708">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 id="calendarTitle">${we(e)}</h1>
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

      <div class="month-calendar" data-month="${b(e)}">
        <div class="weekday-row" aria-hidden="true">
          ${rt.map((c,d)=>`<span class="${d===0?"is-sunday":d===6?"is-saturday":""}">${c}</span>`).join("")}
        </div>
        <div class="month-grid">${a}</div>
      </div>

      ${wt(n)}

      <div class="calendar-legend" aria-label="\u62C5\u5F53\u30C8\u30EC\u30FC\u30CA\u30FC\u306E\u8272\u5206\u3051">
        ${S.map(c=>`<span><i class="legend-dot legend-dot--${c.color}"></i>${h(c.name)}</span>`).join("")}
        <span><i class="legend-dot legend-dot--amber"></i>\u4F53\u9A13</span>
      </div>
    </section>
  `;return _(o)}function ps(e){return e.reduce((t,n)=>{let s=n.startAt.slice(0,10);return t[s]||=[],t[s].push(n),t},{})}function ys(e){let t=S.find(s=>s.id===e.trainerId);return`
    <div class="week-event week-event--${e.type==="trial"?"amber":t?.color||"neutral"}">
      <time>${e.startAt.slice(11,16)}</time>
      <span class="week-event__main">
        <strong>${h(e.customerName)}</strong>
        <small>${h(t?.name||"\u6307\u5B9A\u306A\u3057")}\u30FB${e.duration}\u5206</small>
      </span>
    </div>
  `}function sn(e,t,n=[]){let s=V(e),r=ps(t),i=s.map(o=>{let c=f(o),d=r[c]||[];return`
      <article class="week-day ${ct(o)?"is-today":""}">
        <button class="week-day__header" type="button" data-action="open-day" data-date="${c}">
          <span>${Se(o)}</span>
          <small>${d.length?`${d.length}\u4EF6`:"\u4E88\u7D04\u306A\u3057"}</small>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        <div class="week-day__events">
          ${d.length?d.map(ys).join(""):'<p class="week-day__empty">\u4E88\u7D04\u306F\u3042\u308A\u307E\u305B\u3093</p>'}
        </div>
      </article>
    `}).join(""),a=`
    <section class="calendar-view">
      <div class="calendar-toolbar">
        <div class="calendar-toolbar__month-nav">
          <button class="icon-button icon-button--subtle" type="button" data-action="previous-week" aria-label="\u524D\u306E\u9031">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1>${Ie(e)}</h1>
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
      ${wt(n)}
    </section>
  `;return _(a)}var v=document.getElementById("app"),m=Ze(),Z=document.getElementById("pwaInstallDialog"),It="",Qt=!1,R=!1,Zt=!1;function gs(){let e=document.getElementById("operatorDialog");return e||(document.body.insertAdjacentHTML("beforeend",`
    <dialog class="operator-dialog" id="operatorDialog">
      <div class="operator-dialog__body">
        <p class="eyebrow">\u3053\u306E\u7AEF\u672B\u3092\u8A2D\u5B9A</p>
        <h2>\u64CD\u4F5C\u8005\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044</h2>
        <p>\u4E88\u7D04\u306E\u62C5\u5F53\u521D\u671F\u5024\u3068\u64CD\u4F5C\u5C65\u6B74\u306B\u4F7F\u7528\u3057\u307E\u3059\u3002</p>
        <div class="operator-dialog__choices">
          ${G.map(t=>`
            <button type="button" data-operator-choice="${t.id}">
              <strong>${t.name}</strong>
              <span>${t.trainerId?`\u65B0\u898F\u4E88\u7D04\u306E\u62C5\u5F53\uFF1A${t.name}`:"\u65B0\u898F\u4E88\u7D04\u306E\u62C5\u5F53\uFF1A\u6307\u5B9A\u306A\u3057"}</span>
            </button>
          `).join("")}
        </div>
        <button class="operator-dialog__cancel" type="button" data-operator-cancel>\u5909\u66F4\u3057\u306A\u3044</button>
      </div>
    </dialog>
  `),document.getElementById("operatorDialog"))}function an({required:e=!1}={}){let t=gs(),n=t.querySelector("[data-operator-cancel]");return n.hidden=e,new Promise(s=>{let r=(o="")=>{t.removeEventListener("click",i),t.removeEventListener("cancel",a),o&&pe(o),t.open&&t.close(),s(o?E():null)},i=o=>{let c=o.target.closest("[data-operator-choice]");c&&r(c.dataset.operatorChoice),o.target.closest("[data-operator-cancel]")&&r()},a=o=>{o.preventDefault(),e||r()};t.addEventListener("click",i),t.addEventListener("cancel",a),t.showModal()})}function H(e){return e.name==="month"?L(e.month):(e.name==="week"||e.name==="day"||e.name==="booking-new")&&it(e.date)?N(e.date):new Date}function on(e){if(e.name==="month"){let t=L(e.month),n=at(t);return{startDate:f(n[0]),endDate:f(n.at(-1)),render:(s,r)=>nn(t,s,r),view:"month"}}if(e.name==="week"){let t=H(e),n=V(t);return{startDate:f(n[0]),endDate:f(n.at(-1)),render:(s,r)=>sn(t,s,r),view:"week"}}if(e.name==="day"){let t=H(e),n=f(t);return{startDate:n,endDate:n,render:s=>tn(t,s),view:""}}return null}function te(){["month","week","day"].includes($().name)&&sessionStorage.setItem("tamafit_calendar_return_hash",window.location.hash)}function ee(e=new Date){return sessionStorage.getItem("tamafit_calendar_return_hash")||It||`#/month/${b(e)}`}function vs(e){let t=m.getCachedEvents(e.startDate,e.endDate),n=m.getCachedHistory?.()||[];v.innerHTML=e.render(t.events,n),e.view&&ye(e.view),_t(),t.isFresh||m.refreshEvents(e.startDate,e.endDate).catch(()=>{})}function ne(){let e=[...v.querySelectorAll("[data-history-select]:checked")],t=v.querySelector("[data-history-selected-count]"),n=v.querySelector('[data-action="delete-history-selected"]');t&&(t.textContent=String(e.length)),n&&(n.disabled=e.length===0)}function F({refresh:e=!1}={}){v.innerHTML=Jt(m.getCachedHistory?.()||[],{organizing:R}),ne(),!(!e||Zt||typeof m.refreshHistory!="function")&&(Zt=!0,m.refreshHistory().then(()=>{$().name==="history"&&(v.innerHTML=Jt(m.getCachedHistory?.()||[],{organizing:R}),ne())}).catch(()=>{}).finally(()=>{Zt=!1}))}function tt(){let e=$();A.route=e;let t=on(e);if(t){(e.name==="month"||e.name==="week")&&(It=window.location.hash),vs(t);return}if(e.name==="booking-new"){let n=H(e);v.innerHTML=Xt({defaultDate:f(n),defaultTrainerId:E()?.trainerId??"tamai"}),se();return}if(e.name==="booking-edit"){let n=m.getEventCached?.(e.id);if(n){v.innerHTML=Xt({event:n,defaultDate:n.startAt.slice(0,10)}),se();return}v.innerHTML=zt("\u3053\u306E\u7AEF\u672B\u306B\u4E88\u7D04\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u30AB\u30EC\u30F3\u30C0\u30FC\u3078\u623B\u3063\u3066\u540C\u671F\u5F8C\u306B\u3082\u3046\u4E00\u5EA6\u958B\u3044\u3066\u304F\u3060\u3055\u3044\u3002"),m.getEvent(e.id).then(s=>{s&&$().name==="booking-edit"&&$().id===e.id&&tt()}).catch(()=>{});return}e.name==="history"&&F({refresh:!0})}function Et(){Qt||(Qt=!0,requestAnimationFrame(()=>{Qt=!1;let e=$();if(e.name==="history"){F({refresh:!1});return}["month","week","day"].includes(e.name)&&tt()}))}function St(e){let t=document.getElementById("formMessage");t&&(t.textContent=e,t.classList.toggle("is-visible",!!e))}function bs(){let e=document.getElementById("syncErrorDialog");return e||(document.body.insertAdjacentHTML("beforeend",`
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
  `),e=document.getElementById("syncErrorDialog"),e.addEventListener("click",t=>{t.target.closest("[data-sync-error-close]")&&e.open&&e.close()}),e.addEventListener("cancel",t=>{t.preventDefault(),e.close()}),e)}function ws(e){let t=bs(),n=e.op?.before||m.getEventCached?.(e.op?.targetId),s=e.deferred?"Google\u30AB\u30EC\u30F3\u30C0\u30FC\u3078\u306E\u540C\u671F\u304C\u9045\u308C\u3066\u3044\u307E\u3059":"Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u53CD\u6620\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F",r=e.deferred?"\u7AEF\u672B\u4E0A\u306E\u4E88\u7D04\u306F\u305D\u306E\u307E\u307E\u4FDD\u6301\u3057\u3001\u30CD\u30C3\u30C8\u63A5\u7D9A\u4E2D\u306B\u81EA\u52D5\u3067\u518D\u8A66\u884C\u3057\u307E\u3059\u3002":"Google\u5074\u3067\u4FDD\u5B58\u3067\u304D\u306A\u304B\u3063\u305F\u305F\u3081\u3001\u7AEF\u672B\u4E0A\u306E\u64CD\u4F5C\u3092\u5143\u306E\u72B6\u614B\u3078\u623B\u3057\u307E\u3057\u305F\u3002";t.querySelector("[data-sync-error-title]").textContent=s,t.querySelector("[data-sync-error-summary]").innerHTML=`
    <div class="sync-error-message">
      ${n?.customerName?`<p><strong>${h(n.customerName)}</strong><br>${h(String(n.startAt||"").replace("T"," ").slice(0,16))}</p>`:""}
      <p>${h(r)}</p>
      <p class="sync-error-message__reason">\u7406\u7531\uFF1A${h(e.error?.message||"\u901A\u4FE1\u30A8\u30E9\u30FC")}</p>
    </div>
  `,t.open||t.showModal(),Et()}function Ss(){let e=document.getElementById("historyDeleteDialog");return e||(document.body.insertAdjacentHTML("beforeend",`
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
  `),document.getElementById("historyDeleteDialog"))}function rn(e){let t=(Array.isArray(e)?e:[e]).map(String).filter(Boolean);if(!t.length)return Promise.resolve(!1);let n=Ss(),s=m.getCachedHistory?.().filter(a=>t.includes(String(a.historyId||"")))||[],r=t.length===1?"\u3053\u306E\u64CD\u4F5C\u5C65\u6B74\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F":`${t.length}\u4EF6\u306E\u64CD\u4F5C\u5C65\u6B74\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F`,i=s.map(a=>a.customerName).filter(Boolean).slice(0,3);return n.querySelector("[data-history-delete-title]").textContent=r,n.querySelector("[data-history-delete-summary]").innerHTML=`
    ${i.length?`<p><strong>${h(i.join("\u3001"))}${s.length>3?" \u307B\u304B":""}</strong></p>`:""}
    <p>\u5C65\u6B74\u3060\u3051\u3092\u524A\u9664\u3057\u307E\u3059\u3002Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306E\u4E88\u7D04\u81EA\u4F53\u306F\u524A\u9664\u3055\u308C\u307E\u305B\u3093\u3002</p>
  `,new Promise(a=>{let o=l=>{n.removeEventListener("click",c),n.removeEventListener("cancel",d),n.open&&n.close(),a(l)},c=l=>{l.target.closest("[data-history-delete-confirm]")&&o(!0),l.target.closest("[data-history-delete-cancel]")&&o(!1)},d=l=>{l.preventDefault(),o(!1)};n.addEventListener("click",c),n.addEventListener("cancel",d),n.showModal()})}function se(){let e=document.getElementById("bookingType"),t=document.getElementById("customerName");if(!e||!t)return;let n=["blocked","tentative","event"].includes(e.value);t.placeholder=n?"\u4F8B\uFF1A\u6E05\u6383\u30FB\u6253\u3061\u5408\u308F\u305B":"\u4F8B\uFF1A\u5C71\u7530 \u82B1\u5B50"}function Is(e){if(e?.dataset.date&&it(e.dataset.date))return e.dataset.date;let t=$();return(t.name==="day"||t.name==="week")&&it(t.date)?t.date:t.name==="month"?f(L(t.month)):f(new Date)}async function Es(e){let t=e.dataset.action,n=$();if(t==="previous-month"||t==="next-month"){y(`month/${b(B(L(n.month),t==="previous-month"?-1:1))}`);return}if(t==="previous-week"||t==="next-week"){y(`week/${f(O(H(n),t==="previous-week"?-7:7))}`);return}if(t==="today"||t==="go-home"){y(`month/${b(new Date)}`);return}if(t==="show-month"){y(`month/${b(H(n))}`);return}if(t==="show-week"){y(`week/${f(H(n))}`);return}if(t==="open-day"){It=window.location.hash,y(`day/${e.dataset.date}`);return}if(t==="new-booking"){te(),y(`booking/new?date=${Is(e)}`);return}if(t==="edit-booking"){te(),y(`booking/edit/${encodeURIComponent(e.dataset.id)}`);return}if(t==="back-to-calendar"){R=!1;let s=n.name==="history"?ee(H(n)):It||`#/month/${b(H(n))}`;y(s.replace(/^#\//,""));return}if(t==="back-from-form"){y(ee(H(n)).replace(/^#\//,""));return}if(t==="open-history"){R=!1,te(),y("history");return}if(t==="history-organize"){R=!0,F({refresh:!1});return}if(t==="history-organize-cancel"){R=!1,F({refresh:!1});return}if(t==="delete-history-one"){let s=e.dataset.historyId;if(!s||!await rn([s]))return;m.deleteHistoryOptimistic?.([s]),F({refresh:!1});return}if(t==="delete-history-selected"){let s=[...v.querySelectorAll("[data-history-select]:checked")].map(r=>r.value).filter(Boolean);if(!s.length||!await rn(s))return;R=!1,m.deleteHistoryOptimistic?.(s),F({refresh:!1});return}if(t==="reload"){y(ee().replace(/^#\//,""));return}if(t==="change-operator"){await an()&&tt();return}if(t==="install-app"){await xs();return}if(t==="delete-booking"){let s=m.getEventCached?.(e.dataset.id);if(!s)return;m.deleteEventOptimistic(s.id),y(`day/${s.startAt.slice(0,10)}`)}}function _s(e){St("");let t=new FormData(e),n=e.dataset.eventId||null,s=String(t.get("date")),r=String(t.get("time")),i=Number(t.get("duration")),a=z(s,r),o={customerName:String(t.get("customerName")||"").trim(),trainerId:String(t.get("trainerId")||""),startAt:a,endAt:ot(a,i),duration:i,type:String(t.get("type")||"member"),notes:String(t.get("notes")||"").trim()};if(!o.customerName){St("\u304A\u5BA2\u69D8\u540D\u307E\u305F\u306F\u4E88\u5B9A\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002");return}let c=m.analyzeCachedBooking?.(o,n);if(c?.conflicts?.length){let d=c.conflicts[0];St(`\u540C\u3058\u62C5\u5F53\u8005\u306B ${d.startAt.slice(11,16)}\u301C${d.endAt.slice(11,16)} \u306E\u4E88\u7D04\u304C\u3042\u308A\u307E\u3059\u3002`);return}n?m.updateEventOptimistic(n,o):m.createEventOptimistic(o),y(`day/${s}`)}function As(){return window.matchMedia?.("(display-mode: standalone)").matches||window.navigator.standalone===!0}function cn(){let e=navigator.userAgent;return/iPad|iPhone|iPod/.test(e)&&!/CriOS|FxiOS|EdgiOS|OPiOS/.test(e)}function $s(){return A.isInstalled||As()?"":A.installPrompt?"android":cn()?"ios":""}function _t(){v.querySelector(".pwa-install-banner")?.remove();let e=$s(),t=v.querySelector(".app-main");!e||!t||t.insertAdjacentHTML("afterbegin",`
    <section class="pwa-install-banner" aria-label="\u30A2\u30D7\u30EA\u3068\u3057\u3066\u8FFD\u52A0">
      <div><strong>${e==="android"?"\u30A2\u30D7\u30EA\u3068\u3057\u3066\u8FFD\u52A0":"\u30DB\u30FC\u30E0\u753B\u9762\u306B\u8FFD\u52A0"}</strong><span>\u30DB\u30FC\u30E0\u753B\u9762\u304B\u3089\u3059\u3050\u958B\u3051\u307E\u3059</span></div>
      <button class="pwa-install-banner__button" type="button" data-action="install-app">\u8FFD\u52A0</button>
    </section>
  `)}async function xs(){if(A.installPrompt){let e=A.installPrompt;A.installPrompt=null,await e.prompt(),await e.userChoice,_t();return}cn()&&Z&&!Z.open&&Z.showModal()}v.addEventListener("click",e=>{let t=e.target.closest("[data-action]");t&&Es(t).catch(()=>{})});v.addEventListener("submit",e=>{if(e.target.id==="bookingForm"){e.preventDefault();try{_s(e.target)}catch(t){St(t.message||"\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002")}}});v.addEventListener("change",e=>{e.target.id==="bookingType"&&se(),e.target.matches?.("[data-history-select]")&&ne()});window.addEventListener("hashchange",tt);window.addEventListener("online",()=>{m.syncNow?.(),m.syncHistoryDeletes?.(),m.refreshHistory?.().then(Et).catch(()=>{});let e=on($());e&&m.refreshEvents(e.startDate,e.endDate).catch(()=>{})});window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),A.installPrompt=e,_t()});window.addEventListener("appinstalled",()=>{A.installPrompt=null,A.isInstalled=!0,_t()});Z?.addEventListener("click",e=>{e.target.closest("[data-pwa-dialog-close]")&&Z.close()});m.onSyncFailure?.(ws);m.onChange?.(Et);"serviceWorker"in navigator&&window.location.protocol!=="file:"&&window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));async function ks(){Y()||await an({required:!0}),window.location.hash?tt():y(`month/${b(new Date)}`,{replace:!0});let e=new Date,t=f(B(e,-3)),n=f(B(e,6));m.refreshEvents(t,n).catch(()=>{}),m.refreshHistory?.().then(Et).catch(()=>{}),m.syncHistoryDeletes?.(),m.syncNow?.()}ks().catch(e=>{v.innerHTML=zt(h(e.message||"\u30A2\u30D7\u30EA\u3092\u8D77\u52D5\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002"))});function Ts(e,t=new Date){let n=L(e);return b(n)===b(t)?new Date(t.getFullYear(),t.getMonth(),t.getDate()):n}function Ds(e,t=new Date){let n=String(e||"").match(/^#\/month\/(\d{4}-\d{2})/);return n?`#/week/${f(Ts(n[1],t))}`:null}function Hs({root:e=document,now:t=()=>new Date}={}){e.addEventListener("click",n=>{if(!n.target.closest?.('[data-action="show-week"]'))return;let r=Ds(window.location.hash,t());r&&(n.preventDefault(),n.stopPropagation(),window.location.hash=r)},!0)}typeof document<"u"&&Hs();var dn=null;function Ms(e){return{create:"\u4E88\u7D04\u5B8C\u4E86",update:"\u5909\u66F4\u5B8C\u4E86",delete:"\u524A\u9664\u5B8C\u4E86"}[e]||"\u5B8C\u4E86"}function Cs(){if(document.getElementById("actionFeedbackStyles"))return;let e=document.createElement("style");e.id="actionFeedbackStyles",e.textContent=`
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
  `,document.head.appendChild(e)}function Ns(){let e=document.getElementById("actionFeedbackToast");return e||(Cs(),e=document.createElement("div"),e.id="actionFeedbackToast",e.className="action-feedback",e.setAttribute("role","status"),e.setAttribute("aria-live","polite"),e.setAttribute("aria-atomic","true"),document.body.appendChild(e),e)}function ln(e){let t=Ns();t.textContent=Ms(e),clearTimeout(dn),requestAnimationFrame(()=>t.classList.add("is-visible")),dn=setTimeout(()=>t.classList.remove("is-visible"),1100)}function Os({root:e=document}={}){e.addEventListener("submit",t=>{let n=t.target.closest?.("#bookingForm");if(!n)return;let s=n.dataset.eventId?"update":"create";setTimeout(()=>{/^#\/day\//.test(window.location.hash)&&ln(s)},0)}),e.addEventListener("click",t=>{t.target.closest?.('[data-action="delete-booking"]')&&setTimeout(()=>{/^#\/day\//.test(window.location.hash)&&ln("delete")},0)})}typeof document<"u"&&Os();
