import test from "node:test";
import assert from "node:assert/strict";
import { readLocalAuditSnapshot, getAuditRanges, compareBookings, renderBookingAuditPanel } from "../src/local-booking-audit.js";

const local = (id, name = "森", date = "2026-11-01") => ({
  id, customerName: name, trainerId: "obayashi",
  startAt: date + "T16:00:00", endAt: date + "T17:00:00",
  type: "member", duration: 60
});
const storage = (data) => ({
  getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; }
});

test("the user's local booking absent from Google is listed", () => {
  const snapshot = {records:[local("local:create-1")], outbox:[{targetId:"local:create-1",kind:"create"}]};
  const [item] = compareBookings(snapshot, []);
  assert.equal(item.kind, "missing");
  assert.equal(item.pending, true);
  assert.equal(item.local.customerName, "森");
});

test("same event ID but different name is reported as a mismatch", () => {
  const res = compareBookings({records:[local("google-1","森さん")],outbox:[]}, [local("google-1","森")]);
  assert.equal(res.length, 1);
  assert.equal(res[0].kind, "different");
});

test("same booking found by ID is not reported", () => {
  assert.deepEqual(compareBookings({records:[local("google-1")],outbox:[]},[local("google-1")]),[]);
});

test("matching details with a different ID are reported as a separate booking", () => {
  const result = compareBookings({records:[local("local:create-1")],outbox:[]},[local("google-1")]);
  assert.equal(result.length,1);
  assert.equal(result[0].kind,"missing");
  assert.equal(result[0].overlaps[0].id,"google-1");
});

test("server-side deletion of a locally cached booking is listed", () => {
  assert.equal(compareBookings({records:[local("google-1")],outbox:[]},[])[0].kind,"missing");
});

test("audit examines all local months in groups of up to three consecutive months", () => {
  assert.deepEqual(getAuditRanges([local("a","A","2026-10-01"),local("b","B","2026-11-01"),local("c","C","2027-02-01")]),[
    {startDate:"2026-10-01",endDate:"2026-11-30"},
    {startDate:"2027-02-01",endDate:"2027-02-28"}
  ]);
});

test("local storage data is not mistaken for empty when malformed", () => {
  assert.throws(() => readLocalAuditSnapshot(storage({"tamafit_staff_calendar_local_first_v1:records":"{oops"})));
});

test("no local records is a valid empty comparison", () => {
  assert.deepEqual(getAuditRanges([]),[]);
  assert.deepEqual(compareBookings({records:[],outbox:[]},[]),[]);
});

test("one Google booking with a different ID cannot hide either local booking", () => {
  const actual = compareBookings({records:[local("local:create-1"),local("local:create-2")],outbox:[]},[local("google-1")]);
  assert.equal(actual.length,2);
  assert.ok(actual.every((item)=>item.kind==="missing"));
});

test("a remote canonical ID is reserved for its local record before content matching", () => {
  const actual = compareBookings({
    records:[local("local:a"),local("google-1")],
    outbox:[]
  },[local("google-1")]);
  assert.equal(actual.length,1);
  assert.equal(actual[0].local.id,"local:a");
});

test("Japanese diagnostic heading remains readable", () => {
  assert.match(renderBookingAuditPanel(), /端末とGoogleの予約照合/);
});

test("different IDs remain distinct even with the same time and honorific variation", () => {
  const result=compareBookings({records:[local("local:pending-creation","森様")],outbox:[{targetId:"local:pending-creation",kind:"create"}]},[local("actual-google-id","森")]);
  assert.equal(result.length,1);
  assert.equal(result[0].kind,"missing");
  assert.equal(result[0].pending,true);
  assert.equal(result[0].overlaps[0].id,"actual-google-id");
});

test("different IDs at the same slot remain separate regardless of names", () => {
  const result=compareBookings({records:[local("local:new","森井")],outbox:[]},[local("actual","森")]);
  assert.equal(result.length,1);
  assert.equal(result[0].kind,"missing");
  assert.equal(result[0].overlaps[0].customerName,"森");
});

test("same ID with equivalent honorific variants is not an error", () => {
  assert.deepEqual(compareBookings({records:[local("id-1"," 森　様 ")],outbox:[]},[local("id-1","森")]),[]);
});

test("overlapping Google time with a different ID is flagged without merging IDs", () => {
  const remote = {...local("another-id","別の予約"),startAt:"2026-11-01T16:30:00",endAt:"2026-11-01T17:30:00"};
  const result=compareBookings({records:[local("local:original","森")],outbox:[]},[remote]);
  assert.equal(result.length,1);
  assert.equal(result[0].kind,"missing");
  assert.equal(result[0].overlaps.length,1);
});
