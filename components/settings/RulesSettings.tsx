import { useAuth } from "@/context/AuthContext";
import AdminRules from "./rules/AdminRules";
import StudentRules from "./rules/StudentRules";
import TeacherRules from "./rules/TeacherRules";

export default function RulesSettings() {
  const { role } = useAuth();

  if (role === "admin") {
    return AdminRules();
  }

  if (role === "teacher") {
    return TeacherRules();
  }

  return StudentRules();
}
