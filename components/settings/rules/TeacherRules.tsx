// Viser bookingsystemets regler specifikt for lærere.

import { useTranslation } from "react-i18next";
export default function TeacherRules() {
  const { t } = useTranslation();
  return (
    <div className="max-w-[800px] p-2">
      <p className="mb-4">{t("settings.teacher_description")}</p>
      <p
        className="mb-4 p-3 rounded-lg "
        style={{
          backgroundColor: "var(--color-secondary-200)",
        }}
      >
        {t("settings.rules_teacher1")}
      </p>
      <p
        className="mb-4 p-3 rounded-lg "
        style={{
          backgroundColor: "var(--color-secondary-200)",
        }}
      >
        {t("settings.rules_teacher2")}{" "}
      </p>
      <p
        className="mb-4 p-3 rounded-lg "
        style={{
          backgroundColor: "var(--color-secondary-200)",
        }}
      >
        {t("settings.rules_teacher3")}
      </p>
      <p
        className="mb-4 p-3 rounded-lg "
        style={{
          backgroundColor: "var(--color-secondary-200)",
        }}
      >
        {t("settings.rules_teacher4")}
      </p>
    </div>
  );
}
