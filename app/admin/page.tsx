// Admin-side til håndtering af lokaler og bookinger. Kun tilgængelig for admin-brugere.

"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import CreateRoomForm from "@/components/admin/CreateRoomForm";
import AdminRoomList from "@/components/admin/AdminRoomList";
import AdminRoomFilters from "@/components/admin/AdminRoomFilters";
import AdminBookingPanel from "@/components/admin/AdminBookingPanel";
import AdminStatsTabs from "@/components/admin/stats/AdminStatsTabs";
import CreateRepeatingBookingForm from "@/components/admin/CreateRepeatingBookingForm";
import { useTranslation } from "react-i18next";

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
  const [activeTab, setActiveTab] = useState<"manage" | "stats">("manage");

  const { t } = useTranslation();

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-main">{t("admin.administration")}</h1>
        <p className="text-secondary-200 mt-1">{t("admin.manageRoomandBookings")}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6 border-b border-secondary-200">
        <button
          className={`px-3 py-2 rounded-t ${
            activeTab === "manage" ? "bg-secondary-50 font-medium" : "hover:bg-secondary-50"
          }`}
          onClick={() => setActiveTab("manage")}
        >
          {t("admin.administrate")}
        </button>
        <button
          className={`px-3 py-2 rounded-t ${
            activeTab === "stats" ? "bg-secondary-50 font-medium" : "hover:bg-secondary-50"
          }`}
          onClick={() => setActiveTab("stats")}
        >
          {t("admin.statiscs")}
        </button>
      </div>

      {activeTab === "manage" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
              <h2 className="text-xl font-semibold text-secondary mb-4">{t("admin.createnewRoom")}</h2>
              <CreateRoomForm onRoomCreated={handleRoomCreated} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
              <h2 className="text-xl font-semibold text-secondary mb-4">{t("admin.manageRooms")}</h2>
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

          <div className="space-y-6">
            <CreateRepeatingBookingForm
              onSuccess={handleRepeatingBookingCreated}
              rooms={rooms}
              bookings={bookings}
            />
            <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
              <AdminBookingPanel />
            </div>
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <AdminStatsTabs />
      )}

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
