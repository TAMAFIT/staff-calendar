const VIEW_STORAGE_KEY = "tamafit_staff_calendar_last_view";

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
  installPrompt: null
};
