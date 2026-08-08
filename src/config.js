export const APP_NAME = "たまフィット予約";

// Dedicated staff-calendar Apps Script Web App URL. Paste the deployed /exec URL here.
// The file preview intentionally uses local demo data, so visual checks work without GAS.
export const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzQf3thjGYKpV13bH6V0n1ZKQT23Wvvx8K7CQhRNIuH6mAQwih9Cg28r3ETnz9AVB4Etw/exec";

export const TRAINERS = [
  { id: "tamai", name: "玉井", shortName: "玉井", color: "pink" },
  { id: "obayashi", name: "大林", shortName: "大林", color: "aqua" }
];

export const BOOKING_TYPES = [
  { id: "member", name: "通常予約" },
  { id: "trial", name: "体験" },
  { id: "consultation", name: "見学・相談" },
  { id: "blocked", name: "予約ブロック" },
  { id: "tentative", name: "仮予約枠" },
  { id: "event", name: "イベント" }
];

export const DURATIONS = [30, 60, 90];
export const OPENING_TIME = "09:00";
export const CLOSING_TIME = "21:00";
export const TIME_STEP_MINUTES = 15;
export const MONTH_EVENT_LIMIT = 5;
