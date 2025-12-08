import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

export default function SettingsSidebar({
  activePage,
  setActivePage,
}: {
  activePage: string;
  setActivePage: (page: string) => void;
}) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const items = [
    { id: "apparance", label: t("settings.appearance_title"), icon: "🎨" },
    { id: "language", label: t("settings.language_title"), icon: "🌐" },
    { id: "rules", label: t("settings.rules_title"), icon: "📜" },
  ];

  return (
    <div className="w-64 p-4 flex flex-col rounded-l-xl" style={{ backgroundColor: "var(--color-secondary-200", color:"var(--color-text-main"}}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActivePage(item.id)}
          className={`flex items-center gap-3 p-3 rounded-lg text-left transition
            ${
              activePage === item.id ? "bg-white shadow" : "hover:bg-white/40"
            }`}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}

      <Link
        href="/min-side"
        className="mt-auto bg-white p-4 rounded-lg flex items-center gap-3 hover:bg-white/80 transition"
      >
        {/* <img
          src={profile?.avatar_url || "/avatar.jpg"}
          className="w-10 h-10 rounded-full"
        /> */}

        <div>
          <p className="font-medium">{profile?.full_name || "Bruger"}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </Link>
    </div>
  );
}
