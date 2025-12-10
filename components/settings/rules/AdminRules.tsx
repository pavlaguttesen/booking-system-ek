// Viser bookingsystemets regler specifikt for administratorer.

import { useTranslation } from "react-i18next";
export default function AdminRules() {
  //Translation constant
  const { t } = useTranslation();
  return (
    <div className="max-w-[800px] p-2">
      <p
        className="mb-4 p-3 rounded-lg "
        style={{
          backgroundColor: "var(--color-secondary-200)",
        }}
      >
        {t("settings.rules_admin1")}
      </p>
      <p
        className="mb-4 p-3 rounded-lg "
        style={{
          backgroundColor: "var(--color-secondary-200)",
        }}
      >
        {t("settings.rules_admin2")}
      </p>
      <p
        className="mb-4 p-3 rounded-lg "
        style={{
          backgroundColor: "var(--color-secondary-200)",
        }}
      >
        {t("settings.rules_admin3")}
      </p>
      <p
        className="mb-4 p-3 rounded-lg "
        style={{
          backgroundColor: "var(--color-secondary-200)",
        }}
      >
        {t("settings.rules_admin4")}
      </p>
    </div>
  );
}
