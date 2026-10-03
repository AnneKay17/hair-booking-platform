//All date/time parsing and arithmetic for the scheduling engine, kept string/integer-based so there's no timezone conversion to get wrong.
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** "HH:MM" in 24-hour format, e.g. "09:30". */
export const isValidTimeString = (value) => {
  if (typeof value !== "string") return false;
  return TIME_REGEX.test(value);
};

/**
 * "YYYY-MM-DD" that is also a real calendar date (rejects "2026-02-30").
 * Uses Date only in UTC, purely to validate the calendar — never for
 * time-of-day math, so it cannot shift any HH:MM value.
 */
export const isValidDateString = (value) => {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

/** "09:30" -> 570. No Date object involved. */
export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/** 570 -> "09:30". No Date object involved. */
export const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/**
 * Today's date as "YYYY-MM-DD", read from the server process's local clock.
 * The business operates in South Africa local time; this assumes the server
 * process itself is running in (or configured for) that timezone.
 */
export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isPastDate = (dateString) => dateString < getTodayDateString();