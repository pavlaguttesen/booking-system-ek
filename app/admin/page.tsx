"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import CreateRoomForm from "@/components/admin/CreateRoomForm";
import AdminRoomList from "@/components/admin/AdminRoomList";
import AdminRoomFilters from "@/components/admin/AdminRoomFilters";
import AdminBookingList from "@/components/admin/AdminBookingList";

export default function AdminPage() {
  const { role } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [floorFilter, setFloorFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    if (role && role !== "admin") {
      router.replace("/");
    }
  }, [role, router]);

  if (!role) return null;

  return (
    <div className="max-w-6xl mx-auto mt-10 flex gap-10">

      {/* LEFT SIDE */}
      <div className="w-1/2 bg-white p-8 rounded-lg shadow-sm border border-secondary-200">

        <h1 className="text-2xl font-semibold text-main mb-8">
          Administrer lokaler
        </h1>

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

        <div className="mb-12">
          <h2 className="text-xl font-semibold text-main mb-4">Opret nyt lokale</h2>
          <CreateRoomForm />
        </div>

        <AdminRoomList
          search={search}
          typeFilter={typeFilter}
          floorFilter={floorFilter}
          statusFilter={statusFilter}
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="w-1/2 bg-white p-8 rounded-lg shadow-sm border border-secondary-200">
        <AdminBookingList />
      </div>

    </div>
  );
}
