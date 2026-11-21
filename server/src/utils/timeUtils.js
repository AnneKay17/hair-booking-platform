const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const BUSINESS_TIME_ZONE = "Africa/Johannesburg";

export const isValidTimeString = (value) => {
  if (typeof value !== "string") return false;
  return TIME_REGEX.test(value);
};

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

export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const getBusinessNow = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type).value;

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
};

/** Today's date ("YYYY-MM-DD") in South Africa, regardless of the server's own timezone. */
export const getTodayDateString = () => getBusinessNow().date;

/** Minutes since midnight right now, in South Africa. */
export const getCurrentTimeMinutes = () => getBusinessNow().minutes;

export const isPastDate = (dateString) => dateString < getTodayDateString();