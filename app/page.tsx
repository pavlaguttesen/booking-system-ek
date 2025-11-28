"use client";

import { useState } from "react";
import { BookingTimeline } from "@/components/booking/BookingTimeline";
import { BookingFilters } from "@/components/booking/BookingFilters";
import { BookingList } from "@/components/booking/BookingList";
import { BookingProvider, useBookingContext } from "@/context/BookingContext";
import { CreateBookingOverlay } from "@/app/overlays/CreateBookingOverlay";

function PageContent() {
  const { rooms } = useBookingContext();

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayData, setOverlayData] = useState<{
    roomId: string;
    start: Date;
    end: Date;
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

  // Når booking sendes fra modal
  function handleSubmitBooking(formData: {
    roomId: string;
    title: string;
    start: Date;
    end: Date;
  }) {
    console.log("NEW BOOKING:", formData);

    // TODO:
    // await supabase.from("bookings").insert(...)
    // refresh bookings from context
    setOverlayOpen(false);
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-6">
      <div className="flex gap-10">

        {/* ------------------ VENSTRE SIDE (TIMELINE + RESULTATER) ------------------ */}
        <div className="flex-1 space-y-6">

          {/* TIMELINE */}
          <BookingTimeline onCreateBooking={handleCreateBookingRequest} />

          {/* LISTEN UNDER TIMELINE */}
          <BookingList />
        </div>

        {/* ------------------ HØJRE SIDE (KALENDER + FILTRE) ------------------ */}
        <div className="w-[330px] shrink-0">
          <BookingFilters />
        </div>
      </div>

      {/* ------------------ CREATE BOOKING OVERLAY ------------------ */}
      <CreateBookingOverlay
        opened={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        rooms={rooms}
        roomId={overlayData?.roomId ?? ""}
        start={overlayData?.start ?? new Date()}
        end={overlayData?.end ?? new Date()}
        onSubmit={handleSubmitBooking}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <BookingProvider>
      <PageContent />
    </BookingProvider>
  );
}
