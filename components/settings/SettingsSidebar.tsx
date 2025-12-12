// Sidebar i indstillinger modal med navigationsknapper mellem faner (udseende, sprog, regler) og brugerinfo.

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

export default function SettingsSidebar({
  activePage,
  setActivePage,
  onClose
}: {
  activePage: string;
  setActivePage: (page: string) => void;
  onClose: () => void;

}) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const items = [
    { id: "apparance", label: t("settings.appearance_title"), icon: "🎨" },
    { id: "language", label: t("settings.language_title"), icon: "🌐" },
    { id: "rules", label: t("settings.rules_title"), icon: "📜" },
  ];

  return (
    <div
      className="w-64 p-4 flex flex-col rounded-l-xl"
      style={{
        backgroundColor: "var(--color-secondary-200",
        color: "var(--color-text-main",
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActivePage(item.id)}
          className={`flex items-center gap-3 p-3 rounded-lg text-left transition
            ${
              activePage === item.id ? "bg-white/40" : "hover:bg-white/40"
            }`}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}

      <Link
        href="/mypage"
        className="mt-auto bg-white/40 p-4 rounded-lg flex items-center gap-3 hover:bg-white/80 transition"
      onClick={onClose}
      >
        <img
          src={profile?.avatar_url || "https://vmyzbnqvfwwmhoazveei.supabase.co/storage/v1/object/public/avatar/user-regular-full.svg"}
          className="w-10 h-10 rounded-full object-cover bg-white border border-gray-300"
        />

        <div>
          <p className="font-xs text-gray-600">
            {profile?.full_name || "Bruger"}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>

      </Link>
    </div>
  );
}
