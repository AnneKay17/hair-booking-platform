/** 30 -> "R30", 45.5 -> "R45.50" */
export const formatPrice = (price) =>
  `R${Number.isInteger(price) ? price : price.toFixed(2)}`;

/** 45 -> "45 min", 90 -> "1 hr 30 min", 240 -> "4 hrs" */
export const formatDuration = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourText = `${hours} ${hours === 1 ? "hr" : "hrs"}`;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return hourText;
  return `${hourText} ${minutes} min`;
};