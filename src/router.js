import { monthRouteValue, toISODate } from "./utils/date.js";

export function parseRoute(hash = window.location.hash) {
  const raw = hash.replace(/^#\/?/, "");
  const [path = "", queryString = ""] = raw.split("?");
  const segments = path.split("/").filter(Boolean);
  const query = new URLSearchParams(queryString);
  const today = new Date();

  if (segments[0] === "month") {
    return { name: "month", month: segments[1] || monthRouteValue(today) };
  }

  if (segments[0] === "week") {
    return { name: "week", date: segments[1] || toISODate(today) };
  }

  if (segments[0] === "day") {
    return { name: "day", date: segments[1] || toISODate(today) };
  }

  if (segments[0] === "booking" && segments[1] === "new") {
    return { name: "booking-new", date: query.get("date") || toISODate(today) };
  }

  if (segments[0] === "booking" && segments[1] === "edit" && segments[2]) {
    return { name: "booking-edit", id: decodeURIComponent(segments[2]) };
  }

  if (segments[0] === "history") {
    return { name: "history" };
  }

  return { name: "month", month: monthRouteValue(today) };
}

export function navigate(path, { replace = false } = {}) {
  const nextHash = path.startsWith("#") ? path : `#/${path.replace(/^\//, "")}`;
  if (replace) {
    history.replaceState(null, "", nextHash);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = nextHash;
}
