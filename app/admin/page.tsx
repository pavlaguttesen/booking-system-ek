"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import CreateRoomForm from "@/components/admin/CreateRoomForm";
import AdminRoomList from "@/components/admin/AdminRoomList";
import AdminRoomFilters from "@/components/admin/AdminRoomFilters";
import AdminBookingPanel from "@/components/admin/AdminBookingPanel";

import EditRoomOverlay from "@/app/overlays/EditRoomOverlay";
import DeleteRoomOverlay from "@/app/overlays/DeleteRoomOverlay";

import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const { role } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [floorFilter, setFloorFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [reloadRoomsKey, setReloadRoomsKey] = useState(0);

  // EDIT OVERLAY STATE
  const [roomToEdit, setRoomToEdit] = useState<any | null>(null);

  // DELETE OVERLAY STATE
  const [roomToDelete, setRoomToDelete] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleRoomCreated() {
    setReloadRoomsKey(prev => prev + 1);
  }

  useEffect(() => {
    if (role && role !== "admin") {
      router.replace("/");
    }
  }, [role, router]);

  if (!role) return null;

  async function handleConfirmDeleteRoom() {
    if (!roomToDelete) return;

    await supabase.from("rooms").delete().eq("id", roomToDelete.id);

    setReloadRoomsKey(prev => prev + 1);
    setDeleteOpen(false);
    setRoomToDelete(null);
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 flex gap-10">

      {/* LEFT SIDE */}
      <div className="w-1/2 bg-white p-8 rounded-lg shadow-sm border border-secondary-200">

        <h1 className="text-2xl font-semibold text-main mb-8">
          Administrer lokaler
        </h1>

        <div className="mb-12">
          <h2 className="text-xl font-semibold text-main mb-4">
            Opret nyt lokale
          </h2>
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
          onEdit={(room) => setRoomToEdit(room)}
          onDelete={(room) => {
            setRoomToDelete(room);
            setDeleteOpen(true);
          }}
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="w-1/2 bg-white p-8 rounded-lg shadow-sm border border-secondary-200">
        <AdminBookingPanel />
      </div>

      {/* EDIT OVERLAY */}
      {roomToEdit && (
        <EditRoomOverlay
          room={roomToEdit}
          onClose={() => setRoomToEdit(null)}
          onSave={() => {
            setRoomToEdit(null);
            setReloadRoomsKey(prev => prev + 1);
          }}
        />
      )}

      {/* DELETE OVERLAY */}
      {deleteOpen && roomToDelete && (
        <DeleteRoomOverlay
          opened={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          room={roomToDelete}
          onConfirm={handleConfirmDeleteRoom}
        />
      )}
    </div>
  );
}
