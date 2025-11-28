import dayjs from "dayjs";

// Returnerer om valgt dato matcher i dag
export function isToday(date: string | null) {
  if (!date) return false;
  return dayjs().isSame(dayjs(date), "day");
}
