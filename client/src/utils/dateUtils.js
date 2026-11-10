const BUSINESS_TIME_ZONE = "Africa/Johannesburg";

const pad2 = (n) => String(n).padStart(2, "0");

/** month is 1-12 */
export const toDateString = (year, month, day) => `${year}-${pad2(month)}-${pad2(day)}`;

export const parseDateString = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return { year, month, day };
};

/** Today's date in South Africa, regardless of the visitor's own timezone. */
export const getTodayString = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
};

/** "2026-10-20" -> e.g. "Tuesday, 20 October 2026" (formatted in UTC: no day shift). */
export const formatDateLong = (dateString) => {
  const { year, month, day } = parseDateString(dateString);
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

/** month is 1-12 */
export const formatMonthYear = (year, month) =>
  new Intl.DateTimeFormat("en-ZA", { timeZone: "UTC", month: "long", year: "numeric" }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );

/**
 * Calendar cells for a month, Monday-first. Leading `null`s pad the first week;
 * every other cell is a "YYYY-MM-DD" string. month is 1-12.
 */
export const getMonthGrid = (year, month) => {
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateString(year, month, day));
  }
  return cells;
};

export const addMonths = (year, month, delta) => {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

/** Positive if `a` is after `b`, in whole months. */
export const compareMonths = (a, b) => a.year * 12 + a.month - (b.year * 12 + b.month);

/** First/last day of a month, with the start clipped so it is never before `today`. */
export const getMonthRange = (year, month, today) => {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const first = toDateString(year, month, 1);
  return {
    startDate: first < today ? today : first,
    endDate: toDateString(year, month, daysInMonth),
  };
};