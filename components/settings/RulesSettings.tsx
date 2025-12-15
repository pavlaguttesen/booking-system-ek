/**
 * RulesSettings Komponent
 * 
 * Indstillings-sektion der viser booking-regler baseret på brugerens rolle.
 * Komponenten fungerer som router der viser forskellige regel-sæt alt efter
 * om brugeren er admin, lærer eller studerende.
 * 
 * Funktionalitet:
 * - Henter brugerrolle fra AuthContext
 * - Viser AdminRules for administratorer
 * - Viser TeacherRules for lærere
 * - Viser StudentRules for studerende (default)
 * 
 * Roller:
 * - admin: Fuld adgang, kan administrere lokaler og bookinger
 * - teacher: Kan booke alle typer lokaler uden begrænsninger
 * - student: Max 4 bookinger, kun studierum
 */

import { useAuth } from "@/context/AuthContext";
import AdminRules from "./rules/AdminRules";
import StudentRules from "./rules/StudentRules";
import TeacherRules from "./rules/TeacherRules";

export default function RulesSettings() {
  // Hent brugerens rolle fra AuthContext
  const { role } = useAuth();

  // Vis admin-specifikke regler
  if (role === "admin") {
    return AdminRules();
  }

  // Vis lærer-specifikke regler
  if (role === "teacher") {
    return TeacherRules();
  }

  // Standard: Vis studerende-regler
  return StudentRules();
}
