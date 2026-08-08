const WEEKDAYS_SHORT = ["日", "月", "火", "水", "木", "金", "土"];

export function pad(value) {
  return String(value).padStart(2, "0");
}

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const date = parseISODate(value);
  return toISODate(date) === value;
}

export function addDays(date, amount) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function startOfWeek(date) {
  return addDays(date, -date.getDay());
}

export function getMonthGrid(anchorDate) {
  const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function getWeekDays(anchorDate) {
  const start = startOfWeek(anchorDate);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function formatMonthTitle(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function formatDayTitle(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAYS_SHORT[date.getDay()]}）`;
}

export function formatShortDay(date) {
  return `${date.getMonth() + 1}/${date.getDate()}（${WEEKDAYS_SHORT[date.getDay()]}）`;
}

export function formatWeekRange(anchorDate) {
  const days = getWeekDays(anchorDate);
  const start = days[0];
  const end = days[6];
  if (start.getMonth() === end.getMonth()) {
    return `${start.getMonth() + 1}/${start.getDate()}〜${end.getMonth() + 1}/${end.getDate()}`;
  }
  return `${start.getMonth() + 1}/${start.getDate()}〜${end.getMonth() + 1}/${end.getDate()}`;
}

export function dateTimeToParts(value) {
  const [date = "", time = ""] = String(value).split("T");
  return { date, time: time.slice(0, 5) };
}

export function combineDateAndTime(date, time) {
  return `${date}T${time}:00`;
}

export function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value) {
  return `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
}

export function addMinutesToDateTime(value, minutes) {
  const { date, time } = dateTimeToParts(value);
  return combineDateAndTime(date, minutesToTime(timeToMinutes(time) + minutes));
}

export function createTimeOptions(start, end, step) {
  const options = [];
  for (let value = timeToMinutes(start); value <= timeToMinutes(end); value += step) {
    options.push(minutesToTime(value));
  }
  return options;
}

export function compareDateTime(a, b) {
  return String(a).localeCompare(String(b));
}

export function isToday(date) {
  return toISODate(date) === toISODate(new Date());
}

export function monthRouteValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function parseMonthRoute(value) {
  if (!/^\d{4}-\d{2}$/.test(String(value))) return new Date();
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export { WEEKDAYS_SHORT };
