import { escapeHtml } from "./utils/html.js";
import { GoogleCalendarRepository } from "./services/google-calendar-repository.js";

const STORAGE_KEY = "tamafit_staff_calendar_local_first_v1";
const MONTH_LIMIT = 36;
const TRAINERS = { tamai: "??", obayashi: "??" };
let state = { phase: "idle", checkedAt: 0, fingerprint: "", results: [], checkedCount: 0, error: "" };
let pendingAudit = null;

function validDate(event) {
  const date = String(event?.startAt || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

export function readLocalAuditSnapshot(storage) {
  if (!storage) throw new Error("??????????????????");
  const parse = (key) => {
    const raw = storage.getItem(key);
    if (raw === null) return [];
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) throw new Error("???????????????????");
    return value;
  };
  return {
    records: parse(STORAGE_KEY + ":records"),
    outbox: parse(STORAGE_KEY + ":outbox")
  };
}

function fingerprintOf(snapshot) {
  return JSON.stringify([snapshot.records, snapshot.outbox]);
}

export function getAuditRanges(records) {
  const months = [...new Set(records.map(validDate).filter(Boolean).map((day) => day.slice(0, 7)))].sort();
  if (months.length > MONTH_LIMIT) throw new Error("???????????????????????????");
  const groups = [];
  for (const month of months) {
    const current = groups.at(-1);
    const expectedNext = current ? new Date(Date.UTC(+current.last.slice(0,4), +current.last.slice(5,7), 1)).toISOString().slice(0,7) : "";
    if (current && month === expectedNext && current.count < 3) {
      current.last = month;
      current.count += 1;
    } else {
      groups.push({ first: month, last: month, count: 1 });
    }
  }
  return groups.map(({ first, last }) => ({
    startDate: first + "-01",
    endDate: new Date(Date.UTC(+last.slice(0, 4), +last.slice(5, 7), 0)).toISOString().slice(0, 10)
  }));
}

function compareKey(event) {
  return [
    String(event.startAt || ""),
    String(event.endAt || ""),
    String(event.customerName || "").trim(),
    String(event.trainerId || ""),
    String(event.type || "")
  ].join("|");
}

export function compareBookings(snapshot, remoteEvents) {
  const byId = new Map(remoteEvents.map((event) => [String(event.id), event]));
  const reservedRemoteIds = new Set();
  // Match canonical IDs first. Content-based matching must not consume a
  // server event that belongs to another local record with a matching ID.
  for (const local of snapshot.records) {
    if (validDate(local) && local?.id && byId.has(String(local.id))) {
      reservedRemoteIds.add(String(local.id));
    }
  }
  const byContent = new Map();
  for (const event of remoteEvents) {
    if (reservedRemoteIds.has(String(event.id))) continue;
    const key = compareKey(event);
    if (!byContent.has(key)) byContent.set(key, []);
    byContent.get(key).push(event);
  }
  const queued = new Set(snapshot.outbox.map((operation) => String(operation?.targetId || "")));
  const results = [];
  for (const local of snapshot.records) {
    if (!validDate(local) || !local?.id) continue;
    const remote = byId.get(String(local.id));
    const pending = queued.has(String(local.id)) || local.syncState === "pending" || String(local.id).startsWith("local:");
    if (remote) {
      if (compareKey(local) !== compareKey(remote)) {
        results.push({ kind: "different", local, remote, pending });
      }
    } else {
      const equivalent = byContent.get(compareKey(local));
      if (equivalent?.length) equivalent.shift();
      else results.push({ kind: "missing", local, remote: null, pending });
    }
  }
  return results.sort((a, b) => String(a.local.startAt).localeCompare(String(b.local.startAt)));
}

function currentSnapshot() {
  return readLocalAuditSnapshot(globalThis.localStorage);
}

function panelResults(results) {
  return results.map(({ kind, local, remote, pending }) => {
    const dt = String(local.startAt || "");
    const end = String(local.endAt || "");
    const trainer = TRAINERS[local.trainerId] || "?????";
    const subtitle = kind === "missing" ? "Google?????????" : "Google???????";
    const googleText = remote
      ? `<p class="booking-audit__remote">Google??${escapeHtml(remote.customerName || "????")} / ${escapeHtml(String(remote.startAt || "").slice(11,16))}?${escapeHtml(String(remote.endAt || "").slice(11,16))}</p>`
      : "";
    return `<li class="booking-audit__item">
      <div><strong>${escapeHtml(dt.slice(0, 10).replaceAll("-", "/"))} ${escapeHtml(dt.slice(11,16))}?${escapeHtml(end.slice(11,16))}</strong>
      <span class="booking-audit__label">${subtitle}</span></div>
      <div>${escapeHtml(local.customerName || "????")} / ${escapeHtml(trainer)}${pending ? ' <strong class="booking-audit__pending">?????????????</strong>' : ""}</div>
      ${googleText}
    </li>`;
  }).join("");
}

const STYLES = `<style>
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
</style>`;

export function renderBookingAuditPanel() {
  let snapshot;
  try { snapshot = currentSnapshot(); } catch (error) {
    return `<section class="booking-audit" data-booking-audit>${STYLES}<h2>???Google???????????</h2><p class="booking-audit__error">${escapeHtml(error.message || "?????????????????")}</p></section>`;
  }
  const changed = state.checkedAt && state.fingerprint !== fingerprintOf(snapshot);
  const status = state.phase === "checking"
    ? '<p role="status">Google??????????????</p>'
    : state.phase === "error"
      ? `<p class="booking-audit__error" role="alert">???????????${escapeHtml(state.error)}???????????????????</p>`
      : state.checkedAt && changed
        ? '<p class="booking-audit__warning">??????????????????????????????</p>'
        : state.checkedAt && state.results.length
          ? `<p class="booking-audit__warning" role="status">?????????Google?? ${state.results.length} ?????????</p><ul class="booking-audit__list">${panelResults(state.results)}</ul>`
          : state.checkedAt
            ? `<p class="booking-audit__success" role="status">??????????? ${state.checkedCount} ????????????????</p>`
            : "<p>???????????</p>";
  const stamp = state.checkedAt ? new Date(state.checkedAt).toLocaleString("ja-JP", {timeZone:"Asia/Tokyo"}) : "";
  return `<section class="booking-audit" data-booking-audit aria-label="Google??????">
    ${STYLES}
    <h2>???Google???????????</h2>
    <p class="booking-audit__muted">??????????????? ${snapshot.records.length} ??Google??????????????????????????????????????????</p>
    <button class="booking-audit__button" type="button" data-action="run-booking-audit" ${state.phase === "checking" ? "disabled" : ""}>Google?????</button>
    ${stamp ? `<p class="booking-audit__muted">?????${escapeHtml(stamp)}?Google?????20??????????????</p>` : ""}
    ${status}
    <p class="booking-audit__muted">???????????????????????????</p>
    ${state.results.some((item) => item.pending) && !changed && state.phase !== "error"
      ? '<p class="booking-audit__warning">????????????????????????????????????????????????????????</p>' : ""}
  </section>`;
}

export async function runBookingAudit(refreshPanel) {
  if (pendingAudit) return pendingAudit;
  let snapshot;
  try { snapshot = currentSnapshot(); } catch (error) {
    state = { ...state, phase: "error", error: error.message || "?????????????????" };
    refreshPanel();
    return;
  }
  state = { ...state, phase: "checking", error: "", results: [] };
  refreshPanel();
  pendingAudit = (async () => {
    try {
      const ranges = getAuditRanges(snapshot.records);
      const source = new GoogleCalendarRepository();
      const serverLists = await Promise.all(ranges.map(({ startDate, endDate }) => source.listEvents(startDate, endDate)));
      const latest = currentSnapshot();
      if (fingerprintOf(snapshot) !== fingerprintOf(latest)) {
        throw new Error("????????????????????????????????");
      }
      const remote = serverLists.flat();
      state = {
        phase: "done",
        results: compareBookings(snapshot, remote),
        checkedCount: snapshot.records.length,
        checkedAt: Date.now(),
        fingerprint: fingerprintOf(snapshot),
        error: ""
      };
    } catch (error) {
      state = { ...state, phase: "error", error: error.message || "??????????" };
    } finally {
      pendingAudit = null;
      refreshPanel();
    }
  })();
  return pendingAudit;
}
