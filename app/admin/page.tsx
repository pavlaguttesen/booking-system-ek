// Admin-side til håndtering af lokaler og bookinger. Kun tilgængelig for admin-brugere.

"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import CreateRoomForm from "@/components/admin/CreateRoomForm";
import AdminRoomList from "@/components/admin/AdminRoomList";
import AdminRoomFilters from "@/components/admin/AdminRoomFilters";
import AdminBookingPanel from "@/components/admin/AdminBookingPanel";
import CreateRepeatingBookingForm from "@/components/admin/CreateRepeatingBookingForm";

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

  // REDIGER OVERLAY TILSTAND
  const [roomToEdit, setRoomToEdit] = useState<any | null>(null);

  // SLET OVERLAY TILSTAND
  const [roomToDelete, setRoomToDelete] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Data for repeating booking form
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  function handleRoomCreated() {
    setReloadRoomsKey(prev => prev + 1);
  }

  function handleRepeatingBookingCreated() {
    setReloadRoomsKey(prev => prev + 1);
  }

  useEffect(() => {
    if (role && role !== "admin") {
      router.replace("/");
    }
  }, [role, router]);

  // Load rooms and bookings
  useEffect(() => {
    async function loadData() {
      const [{ data: roomsData }, { data: bookingsData }] = await Promise.all([
        supabase.from("rooms").select("*"),
        supabase.from("bookings").select("*"),
      ]);
      setRooms(roomsData || []);
      setBookings(bookingsData || []);
    }
    loadData();
  }, [reloadRoomsKey]);

  if (!role) return null;

  async function handleConfirmDeleteRoom() {
    if (!roomToDelete) return;

    await supabase.from("rooms").delete().eq("id", roomToDelete.id);

    setReloadRoomsKey(prev => prev + 1);
    setDeleteOpen(false);
    setRoomToDelete(null);
  }

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 pb-10">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-main">Administrering</h1>
        <p className="text-secondary-200 mt-1">Styr lokaler og bookinger</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN - Room Management */}
        <div className="space-y-6">
          {/* CREATE ROOM SECTION */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
            <h2 className="text-xl font-semibold text-main mb-4">
              Opret nyt lokale
            </h2>
            <CreateRoomForm onRoomCreated={handleRoomCreated} />
          </div>

          {/* ROOM FILTERS & LIST SECTION */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
            <h2 className="text-xl font-semibold text-main mb-4">
              Administrer lokaler
            </h2>
            
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

            <div className="mt-6">
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
          </div>
        </div>

        {/* RIGHT COLUMN - Booking Management */}
        <div className="space-y-6">
          {/* CREATE REPEATING BOOKING */}
          <CreateRepeatingBookingForm
            onSuccess={handleRepeatingBookingCreated}
            rooms={rooms}
            bookings={bookings}
          />

          {/* BOOKINGS SECTION */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
            <AdminBookingPanel />
          </div>
        </div>
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
