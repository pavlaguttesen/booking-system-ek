"use client";

// Dansk kommentar: Profilkort henter selv user fra AuthContext
import { useAuth } from "@/context/AuthContext";

export default function ProfileCard() {
  const { profile, user, logout } = useAuth();

  return (
    <div className="w-full flex flex-col items-center text-center">

      {/* Dansk kommentar: Viser navn eller fallback */}
      <h2 className="text-xl font-semibold">
        {profile?.full_name ?? user?.email ?? "Ukendt bruger"}
      </h2>

      {/* Log ud knap */}
      <button
        onClick={logout}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg"
      >
        Log ud
      </button>
    </div>
  );
}
