export default function SettingsSidebar({ activePage, setActivePage }: any) {
  const items = [
    { id: "apparance", label: "Udseende", icon: "🏠" },
    { id: "profile", label: "Rediger profil", icon: "👤" },
    { id: "language", label: "Sprog", icon: "🌐" },
    { id: "rules", label: "Regler", icon: "📜" },
  ];

  return (
    <div className="w-64 bg-[#d6dcf1] p-4 flex flex-col rounded-l-xl">

      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActivePage(item.id)}
          className={`flex items-center gap-3 p-3 rounded-lg text-left 
            ${activePage === item.id ? "bg-white shadow" : "hover:bg-white/40"}`}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}

      <div className="mt-auto bg-white p-4 rounded-lg flex items-center gap-3">
        <img src="/avatar.jpg" className="w-10 h-10 rounded-full" />
        <div>
          <p className="font-medium">name</p>
          <p className="text-sm text-gray-500">email</p>
        </div>
      </div>

    </div>
  );
}
