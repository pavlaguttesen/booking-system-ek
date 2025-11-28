"use client";

import { useState } from "react";
import { BookingTimeline } from "@/components/booking/BookingTimeline";
import { BookingAdvancedFilters } from "@/components/booking/BookingAdvancedFilters";
import { BookingList } from "@/components/booking/BookingList";
import { BookingProvider, useBookingContext } from "@/context/BookingContext";
import { CreateBookingOverlay } from "@/app/overlays/CreateBookingOverlay";
import { ErrorOverlay } from "@/app/overlays/ErrorOverlay";
import { SelectRoomOverlay } from "@/app/overlays/SelectRoomOverlay";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

import TopFilterBar from "@/components/booking/TopFilterBar";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function PageContent() {
  const { rooms, bookings, filteredBookings, selectedDate, reloadBookings } =
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

  // -----------------------------
  // TIMELINE BOOKING REQUEST
  // -----------------------------
  function handleCreateBookingRequest(data: {
    roomId: string;
    start: Date;
    end: Date;
  }) {
    // BLOCK PAST BOOKINGS
    if (dayjs(data.start).isBefore(dayjs())) {
      return setError({
        title: "For sent",
        message: "Du kan ikke oprette en booking i fortiden.",
      });
    }

    setOverlayData(data);
    setOverlayOpen(true);
  }

  // -----------------------------
  // ADVANCED SEARCH LOGIC
  // -----------------------------
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

    if (end <= start) {
      return setError({
        title: "Fejl i tidsrum",
        message: "Sluttid skal være senere end starttid.",
      });
    }

    // Prevent booking in past
    if (dayjs(start).isBefore(dayjs())) {
      return setError({
        title: "For sent",
        message: "Du kan ikke søge efter ledige rum i et tidsrum der allerede er gået.",
      });
    }

    const requiredCap =
      filters.eightPersons ? 8 : filters.sixPersons ? 6 : filters.fourPersons ? 4 : 0;

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
        message: "Ingen rum opfylder dine valgte filtre.",
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

    // MULTIPLE ROOMS → open selection modal
    setAvailableRooms(available);
    setSearchTimes({ start, end });
    setSelectRoomOpen(true);
  }

  // -----------------------------
  // SUBMIT BOOKING
  // -----------------------------
  async function handleSubmitBooking(formData: {
    roomId: string;
    title: string;
    start: Date;
    end: Date;
  }) {
    try {
      const { roomId, title, start, end } = formData;

      // Prevent booking past
      if (dayjs(start).isBefore(dayjs())) {
        return setError({
          title: "For sent",
          message: "Du kan ikke booke et tidsrum der allerede er gået.",
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
        title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        user_id: null,
        booking_type: "normal",
      });

      if (error) throw error;

      await reloadBookings();
      setOverlayOpen(false);
    } catch (err) {
      console.error(err);
      setError({
        title: "Fejl",
        message: "Der opstod en fejl. Prøv igen senere.",
      });
    }
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-6 space-y-8">
      <TopFilterBar />

      <div className="flex gap-10">
        <div className="flex-1 space-y-6">
          <BookingTimeline onCreateBooking={handleCreateBookingRequest} />
          <BookingList />
        </div>

        <div className="w-[340px] shrink-0 space-y-6">
          <BookingAdvancedFilters onSearch={handleAdvancedSearch} />
        </div>
      </div>

      {/* CREATE BOOKING */}
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

      {/* ERROR */}
      {error && (
        <ErrorOverlay
          opened={!!error}
          title={error.title}
          message={error.message}
          onClose={() => setError(null)}
        />
      )}

      {/* ROOM SELECTION MODAL */}
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
    </div>
  );
}

export default function Page() {
  return (
    <BookingProvider>
      <PageContent />
    </BookingProvider>
  );
}
