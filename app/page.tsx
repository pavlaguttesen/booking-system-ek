// Hovedside for bookingsystemet. Viser timeline, filtre og overlays til oprettelse,
// redigering og sletning af bookinger. Håndterer valg af dato, tid og lokale.

"use client";

import { useState } from "react";
import { BookingTimeline } from "@/components/booking/BookingTimeline";
import { BookingAdvancedFilters } from "@/components/booking/BookingAdvancedFilters";
import BookingList from "@/components/booking/BookingList";
import { BookingProvider, useBookingContext } from "@/context/BookingContext";

import { CreateBookingOverlay } from "@/app/overlays/CreateBookingOverlay";
import { ErrorOverlay } from "@/app/overlays/ErrorOverlay";
import { SelectRoomOverlay } from "@/app/overlays/SelectRoomOverlay";
import { DeleteBookingOverlay } from "@/app/overlays/DeleteBookingsOverlay";

import { createClient } from "@supabase/supabase-js";
import TopFilterBar from "@/components/booking/TopFilterBar";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import { validateBookingLimits } from "@/context/BookingRules";
import { useTranslation } from "react-i18next";

/* ---------------------------------------------------------
   SUPABASE CLIENT
--------------------------------------------------------- */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/* Skal matche BookingTimeline */
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 16;

/* ---------------------------------------------------------
   PAGE CONTENT
--------------------------------------------------------- */
function PageContent() {
  const { role } = useAuth();

  const {
    rooms,
    profiles,
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

  const [error, setError] = useState<{ title: string; message: string } | null>(
    null
  );

  const [selectRoomOpen, setSelectRoomOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [searchTimes, setSearchTimes] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

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
        title: t("ErrorMsg.tooLate"),
        message: t("ErrorMsg.cantCreatePastBooking"),
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
     NYT: BEKRÆFT SLETNING
  --------------------------------------------------------- */
  async function handleConfirmDelete() {
    if (!bookingToDelete) return;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingToDelete.id);

    if (error) {
      return setError({
        title: t("ErrorMsg.deletionError"),
        message: t("ErrorMsg.supabaseError"),
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
        title: t("ErrorMsg.selectDate"),
        message: t("ErrorMsg.mustSelectDate"),
      });
    }

    if (!filters.timeFrom || !filters.timeTo) {
      return setError({
        title: t("ErrorMsg.missingTime"),
        message: t("ErrorMsg.bothTimes"),
      });
    }

    const [fh, fm] = filters.timeFrom.split(":").map(Number);
    const [th, tm] = filters.timeTo.split(":").map(Number);

    if (isNaN(fh) || isNaN(th)) {
      return setError({
        title: t("ErrorMsg.timeFormat"),
        message: t("ErrorMsg.validTimes"),
      });
    }

    const start = dayjs(selectedDate).hour(fh).minute(fm).toDate();
    const end = dayjs(selectedDate).hour(th).minute(tm).toDate();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return setError({
        title: t("ErrorMsg.invalidTime"),
        message: t("ErrorMsg.couldNotParseTime"),
      });
    }

    if (end <= start) {
      return setError({
        title: t("ErrorMsg.timeRange"),
        message: t("ErrorMsg.endAfterStart"),
      });
    }

    if (dayjs(start).isBefore(dayjs())) {
      return setError({
        title: t("ErrorMsg.tooLate"),
        message: t("ErrorMsg.cantSearchPast"),
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
        title: t("ErrorMsg.noMatch"),
        message: t("ErrorMsg.noRoomsMatch"),
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
        title: t("ErrorMsg.noAvailableRooms"),
        message: t("ErrorMsg.noAvailableText"),
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
     SUBMIT BOOKING (MED ALLE REGLER)
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
          title: t("ErrorMsg.notLoggedIn"),
          message: t("ErrorMsg.mustBeLoggedIn"),
        });
      }

      if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
        return setError({
          title: t("ErrorMsg.invalidTime"),
          message: t("ErrorMsg.timeDataError"),
        });
      }

      if (dayjs(start).isBefore(dayjs())) {
        return setError({
          title: t("ErrorMsg.tooLate"),
          message: t("ErrorMsg.cantBookPast"),
        });
      }

      const weekday = start.getDay();
      if (weekday === 0 || weekday === 6) {
        return setError({
          title: t("ErrorMsg.closed"),
          message: t("ErrorMsg.noWeekendBooking"),
        });
      }

      // Åbningstider (skal matche BookingTimeline)
      const sh = start.getHours() + start.getMinutes() / 60;
      const eh = end.getHours() + end.getMinutes() / 60;

      if (sh < DAY_START_HOUR || eh > DAY_END_HOUR) {
        return setError({
          title: t("ErrorMsg.outsideHours"),
          message: t("ErrorMsg.withinHours", { start: DAY_START_HOUR, end: DAY_END_HOUR }),
        });
      }

      // Fremtidige bookinger for denne bruger
      const now = new Date();
      const futureBookingsForUser = bookings.filter(
        (b) =>
          b.user_id === user.id &&
          new Date(b.end_time).getTime() > now.getTime()
      );

      const limits = validateBookingLimits(
        role ?? "student",
        futureBookingsForUser,
        start,
        end
      );

      if (!limits.ok) {
        return setError({
          title: t("ErrorMsg.limitExceeded"),
          message: limits.message ?? t("ErrorMsg.limitError"),
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
          title: t("ErrorMsg.occupied"),
          message: t("ErrorMsg.roomOccupied"),
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
        title: t("ErrorMsg.error"),
        message: t("ErrorMsg.generalError"),
      });
    }
  }
  const { t } = useTranslation();

  /* ---------------------------------------------------------
     KALENDER
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
            onDeleteBooking={handleDeleteBookingRequest}
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
                title: t("ErrorMsg.tooLate"),
                message: t("ErrorMsg.timeAlreadyPassed"),
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
          profile={
            profiles.find((p) => p.id === bookingToDelete.user_id) || null
          }
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
