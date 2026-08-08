const VIEW_STORAGE_KEY = "tamafit_staff_calendar_last_view";
const OPERATOR_STORAGE_KEY = "tamafit_staff_calendar_operator_v1";

export const OPERATORS = [
  { id: "tamai", name: "玉井", trainerId: "tamai" },
  { id: "obayashi", name: "大林", trainerId: "obayashi" },
  { id: "store", name: "店舗用端末", trainerId: "" }
];

export function loadOperatorId() {
  try {
    const value = globalThis.localStorage?.getItem(OPERATOR_STORAGE_KEY) || "";
    return OPERATORS.some((operator) => operator.id === value) ? value : "";
  } catch {
    return "";
  }
}

export function getOperatorProfile() {
  const id = loadOperatorId();
  return OPERATORS.find((operator) => operator.id === id) || null;
}

export function saveOperatorId(id) {
  if (!OPERATORS.some((operator) => operator.id === id)) return false;
  try {
    globalThis.localStorage?.setItem(OPERATOR_STORAGE_KEY, id);
    return true;
  } catch {
    return false;
  }
}

export function loadLastView() {
  try {
    const value = localStorage.getItem(VIEW_STORAGE_KEY);
    return value === "week" ? "week" : "month";
  } catch {
    return "month";
  }
}

export function saveLastView(view) {
  if (view !== "month" && view !== "week") return;
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    // The app remains usable when storage is unavailable.
  }
}

export const appState = {
  route: null,
  isLoading: false,
  installPrompt: null,
  isInstalled: false
};
