import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function SettingsSidebar({
  activePage,
  setActivePage,
}: {
  activePage: string;
  setActivePage: (page: string) => void;
}) {
  const { user, profile } = useAuth();

  const items = [
    { id: "apparance", label: "Udseende", icon: "🎨" },
    { id: "language", label: "Sprog", icon: "🌐" },
    { id: "rules", label: "Regler", icon: "📜" },
  ];

  return (
    <div className="w-64 bg-[#d6dcf1] p-4 flex flex-col rounded-l-xl">
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
        <img
          src={profile?.avatar_url || "/avatar.jpg"}
          className="w-10 h-10 rounded-full"
        />

        <div>
          <p className="font-medium">{profile?.full_name || "Bruger"}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </Link>
    </div>
  );
}
