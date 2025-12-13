// Utility-funktioner til datohåndtering i hele applikationen.
// Disse hjælpefunktioner bruges til at arbejde med datoer på en konsistent måde.

// Importér dayjs biblioteket til moderne dato-håndtering (lettere alternativ til moment.js)
import dayjs from "dayjs";

/**
 * Kontrollerer om en given dato er i dag.
 * 
 * @param date - Dato som string eller null
 * @returns true hvis datoen matcher dags dato, false ellers
 */
export function isToday(date: string | null) {
  // Hvis ingen dato er angivet, returner false
  if (!date) return false;
  
  // Sammenlign dagens dato med den angivne dato på dag-niveau (ignorer tid)
  return dayjs().isSame(dayjs(date), "day");
}
