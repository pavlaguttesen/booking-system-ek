"use client";

import { useState } from "react";
import { BookingTimeline } from "@/components/booking/BookingTimeline";
import { BookingFilters } from "@/components/booking/BookingFilters";
import { BookingAdvancedFilters } from "@/components/booking/BookingAdvancedFilters";
import { BookingList } from "@/components/booking/BookingList";
import {
  BookingProvider,
  useBookingContext,
} from "@/context/BookingContext";
import { CreateBookingOverlay } from "@/app/overlays/CreateBookingOverlay";
import { ErrorOverlay } from "@/app/overlays/ErrorOverlay";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

// Supabase client (samme env-variabler som i context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function PageContent() {
  const {
    rooms,
    bookings,
    filteredBookings,
    selectedDate,
    reloadBookings,
  } = useBookingContext();

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayData, setOverlayData] = useState<{
    roomId: string;
    start: Date;
    end: Date;
  } | null>(null);

  const [error, setError] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Når der klikkes i timeline
  function handleCreateBookingRequest(data: {
    roomId: string;
    start: Date;
    end: Date;
  }) {
    setOverlayData(data);
    setOverlayOpen(true);
  }

  // Avanceret søgning via højresiden
  function handleAdvancedSearch(filters: {
    timeFrom: string;
    timeTo: string;
    whiteboard: boolean;
    screen: boolean;
    fourPersons: boolean;
    sixPersons: boolean;
    eightPersons: boolean;
    board: boolean;
  }) {
    if (!selectedDate) {
      setError({
        title: "Vælg dato",
        message: "Vælg venligst en dato i kalenderen før du søger.",
      });
      return;
    }

    const { timeFrom, timeTo } = filters;

    if (!timeFrom || !timeTo) {
      setError({
        title: "Tid mangler",
        message: "Vælg både start- og sluttid for din søgning.",
      });
      return;
    }

    const [fromH, fromM] = timeFrom.split(":").map(Number);
    const [toH, toM] = timeTo.split(":").map(Number);

    if (isNaN(fromH) || isNaN(toH)) {
      setError({
        title: "Ugyldig tid",
        message: "Kontrollér dine tidspunkter og prøv igen.",
      });
      return;
    }

    const start = dayjs(selectedDate)
      .hour(fromH)
      .minute(fromM || 0)
      .second(0)
      .toDate();

    const end = dayjs(selectedDate)
      .hour(toH)
      .minute(toM || 0)
      .second(0)
      .toDate();

    if (end <= start) {
      setError({
        title: "Ugyldig periode",
        message: "Sluttid skal være senere end starttid.",
      });
      return;
    }

    // Filtrer rooms efter features
    const requiredCapacity = filters.eightPersons
      ? 8
      : filters.sixPersons
      ? 6
      : filters.fourPersons
      ? 4
      : 0;

    const featureMatchedRooms = rooms.filter((r) => {
      if (filters.whiteboard && !r.has_whiteboard) return false;
      if (filters.screen && !r.has_screen) return false;
      if (filters.board && !r.has_board) return false;

      if (requiredCapacity && (r.capacity || 0) < requiredCapacity)
        return false;

      return true;
    });

    if (featureMatchedRooms.length === 0) {
      setError({
        title: "Ingen ledige rum",
        message:
          "Der er ingen rum, der matcher dine filtre. Prøv at ændre kravene.",
      });
      return;
    }

    // Find rum uden booking i perioden
    const dayBookings = bookings.filter((b) =>
      dayjs(b.start_time).isSame(dayjs(selectedDate), "day")
    );

    function hasConflict(roomId: string) {
      const newStart = start.getTime();
      const newEnd = end.getTime();
      return dayBookings.some((b) => {
        if (b.room_id !== roomId) return false;
        const existingStart = new Date(b.start_time).getTime();
        const existingEnd = new Date(b.end_time).getTime();

        return (
          (newStart >= existingStart && newStart < existingEnd) ||
          (existingStart >= newStart && existingStart < newEnd)
        );
      });
    }

    const freeRoom = featureMatchedRooms.find(
      (room) => !hasConflict(room.id)
    );

    if (!freeRoom) {
      setError({
        title: "Ingen ledige rum",
        message:
          "Der er ingen ledige studierum med dine valg. Prøv at ændre tid eller filtre.",
      });
      return;
    }

    // Vi har fundet et ledigt rum → åbner booking-overlay
    handleCreateBookingRequest({
      roomId: freeRoom.id,
      start,
      end,
    });
  }

  // Når booking sendes fra overlay
  async function handleSubmitBooking(formData: {
    roomId: string;
    title: string;
    start: Date;
    end: Date;
  }) {
    try {
      const { roomId, title, start, end } = formData;

      // Lukkedage (weekend)
      const weekday = start.getDay();
      if (weekday === 0 || weekday === 6) {
        setError({
          title: "Booking kunne ikke foretages",
          message: "Booking er ikke muligt på lukkedage.",
        });
        return;
      }

      // Konflikt-check mod eksisterende bookinger (samme rum)
      const hasConflict = filteredBookings.some((b) => {
        if (b.room_id !== roomId) return false;

        const existingStart = new Date(b.start_time).getTime();
        const existingEnd = new Date(b.end_time).getTime();
        const newStart = start.getTime();
        const newEnd = end.getTime();

        return (
          (newStart >= existingStart && newStart < existingEnd) ||
          (existingStart >= newStart && existingStart < newEnd)
        );
      });

      if (hasConflict) {
        setError({
          title: "Ingen ledige rum",
          message:
            "Der er ingen ledige studierum med dine valg. Prøv at ændre tid eller filtre.",
        });
        return;
      }

      const { error } = await supabase.from("bookings").insert({
        room_id: roomId,
        title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        user_id: null, // kan kobles på auth senere
        booking_type: "normal",
      });

      if (error) {
        setError({
          title: "Booking kunne ikke foretages",
          message: error.message,
        });
        return;
      }

      await reloadBookings();
      setOverlayOpen(false);
    } catch (err) {
      console.error(err);
      setError({
        title: "Booking kunne ikke foretages",
        message: "Der opstod en fejl. Prøv igen senere.",
      });
    }
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-6">
      <div className="flex gap-10">
        {/* VENSTRE: Timeline + liste */}
        <div className="flex-1 space-y-6">
          <BookingTimeline onCreateBooking={handleCreateBookingRequest} />
          <BookingList />
        </div>

        {/* HØJRE: Filtre + avanceret søgning */}
        <div className="w-[340px] shrink-0 space-y-6">
          <BookingFilters />
          <BookingAdvancedFilters onSearch={handleAdvancedSearch} />
        </div>
      </div>

      {/* Overlay til oprettelse */}
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

      {/* Fejl-popup */}
      {error && (
        <ErrorOverlay
          opened={!!error}
          title={error.title}
          message={error.message}
          onClose={() => setError(null)}
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
