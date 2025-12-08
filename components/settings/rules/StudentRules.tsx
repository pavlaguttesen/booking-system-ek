// Viser bookingsystemets regler specifikt for studerende.

import { useTranslation } from "react-i18next";

export default function StudentRules() {
  const { t } = useTranslation();
  return (
    <div>
      <p className="mb-4">{t("settings.student_description")}</p>
      <p className="mb-4">{t("settings.rules_student1")}</p>
      <p className="mb-4">{t("settings.rules_student2")}</p>
      <p className="mb-4">{t("settings.rules_student3")}</p>
      <p className="mb-4">{t("settings.rules_student4")}</p>
    </div>
  );
}
