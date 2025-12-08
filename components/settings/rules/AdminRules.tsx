import { useTranslation } from "react-i18next";
export default function AdminRules() {
  //Translation constant
  const { t } = useTranslation();
  return (
    <div>
      <p className="mb-4">{t("settings.rules_admin1")}</p>
      <p className="mb-4">{t("settings.rules_admin2")}</p>
      <p className="mb-4">{t("settings.rules_admin3")}</p>
      <p className="mb-4">{t("settings.rules_admin4")}</p>
    </div>
  );
}
