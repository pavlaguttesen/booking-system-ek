"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import CreateRoomForm from "@/components/admin/CreateRoomForm";
import AdminRoomList from "@/components/admin/AdminRoomList";
import AdminRoomFilters from "@/components/admin/AdminRoomFilters";

// 👉 DETTE er den nye og eneste booking-komponent
import AdminBookingPanel from "@/components/admin/AdminBookingPanel";

export default function AdminPage() {
  const { role } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [floorFilter, setFloorFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [reloadRoomsKey, setReloadRoomsKey] = useState(0);

  function handleRoomCreated() {
    setReloadRoomsKey((prev) => prev + 1);
  }

  useEffect(() => {
    if (role && role !== "admin") {
      router.replace("/");
    }
  }, [role, router]);

  if (!role) return null;

  return (
    <div className="max-w-6xl mx-auto mt-10 flex gap-10">
      
      {/* VENSTRE SIDE – LOKALER */}
      <div className="w-1/2 bg-white p-8 rounded-lg shadow-sm border border-secondary-200">

        <h1 className="text-2xl font-semibold text-main mb-8">
          Administrer lokaler
        </h1>

        <div className="mb-12">
          <h2 className="text-xl font-semibold text-main mb-4">Opret nyt lokale</h2>
          <CreateRoomForm onRoomCreated={handleRoomCreated} />
        </div>

        <AdminRoomFilters
          search={search}
          setSearch={setSearch}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          floorFilter={floorFilter}
          setFloorFilter={setFloorFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <AdminRoomList
          search={search}
          typeFilter={typeFilter}
          floorFilter={floorFilter}
          statusFilter={statusFilter}
          reloadKey={reloadRoomsKey}
        />
      </div>

      {/* HØJRE SIDE – BOOKINGER */}
      <div className="w-1/2 bg-white p-8 rounded-lg shadow-sm border border-secondary-200">
        <AdminBookingPanel />
      </div>
    </div>
  );
}
