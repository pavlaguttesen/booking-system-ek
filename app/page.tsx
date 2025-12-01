"use client";

import { useState } from "react";
import { BookingTimeline } from "@/components/booking/BookingTimeline";
import { BookingAdvancedFilters } from "@/components/booking/BookingAdvancedFilters";
import { BookingList } from "@/components/booking/BookingList";
import { BookingProvider, useBookingContext } from "@/context/BookingContext";

import { CreateBookingOverlay } from "@/app/overlays/CreateBookingOverlay";
import { ErrorOverlay } from "@/app/overlays/ErrorOverlay";
import { SelectRoomOverlay } from "@/app/overlays/SelectRoomOverlay";
import { DeleteBookingOverlay } from "@/app/overlays/DeleteBookingsOverlay";

import { createClient } from "@supabase/supabase-js";
import TopFilterBar from "@/components/booking/TopFilterBar";
import dayjs from "dayjs";

/* ---------------------------------------------------------
   SUPABASE CLIENT
--------------------------------------------------------- */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/* ---------------------------------------------------------
   PAGE CONTENT
--------------------------------------------------------- */
function PageContent() {
  const { rooms, profiles, bookings, filteredBookings, selectedDate, reloadBookings } =
    useBookingContext();

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayData, setOverlayData] = useState<{
    roomId: string;
    start: Date;
    end: Date;
  } | null>(null);

  const [error, setError] = useState<{ title: string; message: string } | null>(
    null
  );

  const [selectRoomOpen, setSelectRoomOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [searchTimes, setSearchTimes] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  // ↓↓↓ NYE STATES TIL SLETNING ↓↓↓
  const [deleteOverlayOpen, setDeleteOverlayOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<any>(null);

  /* ---------------------------------------------------------
     TIMELINE BOOKING REQUEST
  --------------------------------------------------------- */
  function handleCreateBookingRequest(data: {
    roomId: string;
    start: Date;
    end: Date;
  }) {
    if (dayjs(data.start).isBefore(dayjs())) {
      return setError({
        title: "For sent",
        message: "Du kan ikke oprette en booking i fortiden.",
      });
    }

    setOverlayData(data);
    setOverlayOpen(true);
  }

  /* ---------------------------------------------------------
     NYT: DELETE BOOKING REQUEST
  --------------------------------------------------------- */
  function handleDeleteBookingRequest(booking: any) {
    setBookingToDelete(booking);
    setDeleteOverlayOpen(true);
  }

  /* ---------------------------------------------------------
     NYT: CONFIRM DELETE
  --------------------------------------------------------- */
  async function handleConfirmDelete() {
    if (!bookingToDelete) return;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingToDelete.id);

    if (error) {
      return setError({
        title: "Fejl",
        message: "Kunne ikke slette booking.",
      });
    }

    await reloadBookings();
    setDeleteOverlayOpen(false);
    setBookingToDelete(null);
  }

  /* ---------------------------------------------------------
     ADVANCED SEARCH LOGIC
  --------------------------------------------------------- */
  async function handleAdvancedSearch(filters: {
    timeFrom: string;
    timeTo: string;
    whiteboard: boolean;
    screen: boolean;
    board: boolean;
    fourPersons: boolean;
    sixPersons: boolean;
    eightPersons: boolean;
  }) {
    if (!selectedDate) {
      return setError({
        title: "Vælg dato",
        message: "Du skal vælge en dato først.",
      });
    }

    if (!filters.timeFrom || !filters.timeTo) {
      return setError({
        title: "Manglende tid",
        message: "Vælg både start- og sluttid.",
      });
    }

    const [fh, fm] = filters.timeFrom.split(":").map(Number);
    const [th, tm] = filters.timeTo.split(":").map(Number);

    if (isNaN(fh) || isNaN(th)) {
      return setError({
        title: "Tidsformat",
        message: "Indtast venligst gyldige tidspunkter.",
      });
    }

    const start = dayjs(selectedDate).hour(fh).minute(fm).toDate();
    const end = dayjs(selectedDate).hour(th).minute(tm).toDate();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return setError({
        title: "Ugyldig tid",
        message: "Kunne ikke tolke tidspunkt.",
      });
    }

    if (end <= start) {
      return setError({
        title: "Fejl i tidsrum",
        message: "Sluttid skal være senere end starttid.",
      });
    }

    if (dayjs(start).isBefore(dayjs())) {
      return setError({
        title: "For sent",
        message: "Du kan ikke søge i et tidsrum der allerede er gået.",
      });
    }

    const requiredCap = filters.eightPersons
      ? 8
      : filters.sixPersons
      ? 6
      : filters.fourPersons
      ? 4
      : 0;

    const featureMatched = rooms.filter((r) => {
      if (filters.whiteboard && !r.has_whiteboard) return false;
      if (filters.screen && !r.has_screen) return false;
      if (filters.board && !r.has_board) return false;
      if (requiredCap && (r.capacity || 0) < requiredCap) return false;
      return true;
    });

    if (featureMatched.length === 0) {
      return setError({
        title: "Ingen match",
        message: "Ingen rum opfylder dine filtre.",
      });
    }

    const dayBookings = bookings.filter((b) =>
      dayjs(b.start_time).isSame(selectedDate, "day")
    );

    const available = featureMatched.filter((r) => {
      return !dayBookings.some((b) => {
        if (b.room_id !== r.id) return false;

        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();

        const s = start.getTime();
        const e = end.getTime();

        return s < bEnd && e > bStart;
      });
    });

    if (available.length === 0) {
      return setError({
        title: "Ingen ledige rum",
        message: "Der er ingen ledige rum i dette tidsrum.",
      });
    }

    if (available.length === 1) {
      return handleCreateBookingRequest({
        roomId: available[0].id,
        start,
        end,
      });
    }

    setAvailableRooms(available);
    setSearchTimes({ start, end });
    setSelectRoomOpen(true);
  }

  /* ---------------------------------------------------------
     SUBMIT BOOKING
  --------------------------------------------------------- */
  async function handleSubmitBooking(formData: {
    roomId: string;
    title: string;
    start: Date;
    end: Date;
  }) {
    try {
      const { roomId, title, start, end } = formData;

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        return setError({
          title: "Ikke logget ind",
          message: "Du skal være logget ind for at oprette en booking.",
        });
      }

      if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
        return setError({
          title: "Ugyldig tid",
          message: "Tidsdata kunne ikke læses korrekt.",
        });
      }

      if (dayjs(start).isBefore(dayjs())) {
        return setError({
          title: "For sent",
          message: "Du kan ikke booke et tidsrum der er gået.",
        });
      }

      const weekday = start.getDay();
      if (weekday === 0 || weekday === 6) {
        return setError({
          title: "Lukket",
          message: "Studierum kan ikke bookes i weekenden.",
        });
      }

      const hasConflict = filteredBookings.some((b) => {
        if (b.room_id !== roomId) return false;

        const bS = new Date(b.start_time).getTime();
        const bE = new Date(b.end_time).getTime();
        const s = start.getTime();
        const e = end.getTime();

        return s < bE && e > bS;
      });

      if (hasConflict) {
        return setError({
          title: "Optaget",
          message: "Dette rum er optaget i valgt tidsrum.",
        });
      }

      const { error } = await supabase.from("bookings").insert({
        room_id: roomId,
        title: title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        user_id: user.id,
        booking_type: "normal",
        description: null,
      });

      if (error) {
        console.error("SUPABASE ERROR:", error);
        throw error;
      }

      await reloadBookings();
      setOverlayOpen(false);
    } catch (err) {
      console.error("RAW ERROR:", err);
      setError({
        title: "Fejl",
        message: "Der opstod en fejl. Prøv igen senere.",
      });
    }
  }

  /* ---------------------------------------------------------
     RENDER
  --------------------------------------------------------- */
  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-6 space-y-8">
      {/* TOP FILTRE */}
      <div className="flex items-center justify-between">
        <TopFilterBar />
      </div>

      {/* LAYOUT */}
      <div className="flex gap-10">
        <div className="flex-1 space-y-6">
          <BookingTimeline
            onCreateBooking={handleCreateBookingRequest}
            onDeleteBooking={handleDeleteBookingRequest} // ← NYT
          />
          <BookingList />
        </div>

        {/* ADVANCED */}
        <div className="w-[340px] shrink-0 space-y-6">
          <BookingAdvancedFilters
            onSearch={handleAdvancedSearch}
            onError={(title, message) => setError({ title, message })}
          />
        </div>
      </div>

      {/* CREATE BOOKING OVERLAY */}
      {overlayData && (
        <CreateBookingOverlay
          opened={overlayOpen}
          onClose={() => setOverlayOpen(false)}
          rooms={rooms}
          roomId={overlayData.roomId}
          start={overlayData.start}
          end={overlayData.end}
          onSubmit={handleSubmitBooking}
        />
      )}

      {/* ERROR OVERLAY */}
      {error && (
        <ErrorOverlay
          opened={!!error}
          title={error.title}
          message={error.message}
          onClose={() => setError(null)}
        />
      )}

      {/* SELECT ROOM OVERLAY */}
      {selectRoomOpen && searchTimes && (
        <SelectRoomOverlay
          opened={selectRoomOpen}
          onClose={() => setSelectRoomOpen(false)}
          rooms={availableRooms}
          start={searchTimes.start}
          end={searchTimes.end}
          onSelect={(roomId) => {
            if (dayjs(searchTimes.start).isBefore(dayjs())) {
              return setError({
                title: "For sent",
                message: "Dette tidsrum er allerede passeret.",
              });
            }

            setSelectRoomOpen(false);
            handleCreateBookingRequest({
              roomId,
              start: searchTimes.start,
              end: searchTimes.end,
            });
          }}
        />
      )}

      {/* DELETE BOOKING OVERLAY */}
      {deleteOverlayOpen && bookingToDelete && (
        <DeleteBookingOverlay
          opened={deleteOverlayOpen}
          onClose={() => setDeleteOverlayOpen(false)}
          booking={bookingToDelete}
          room={rooms.find((r) => r.id === bookingToDelete.room_id) || null}
          profile={profiles.find((p) => p.id === bookingToDelete.user_id) || null}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   PAGE WRAPPER MED PROVIDER
--------------------------------------------------------- */
export default function Page() {
  return (
    <BookingProvider>
      <PageContent />
    </BookingProvider>
  );
}
