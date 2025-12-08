import { useTranslation } from "react-i18next";
export default function TeacherRules() {
  const { t } = useTranslation();
  return (
    <div>
      <p className="mb-4">{t("settings.teacher_description")}</p>
      <p className="mb-4">{t("settings.rules_teacher1")}</p>
      <p className="mb-4">{t("settings.rules_teacher2")} </p>
      <p className="mb-4">{t("settings.rules_teacher3")}</p>
      <p className="mb-4">{t("settings.rules_teacher4")}</p>
    </div>
  );
}
