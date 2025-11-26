"use client";

import { useState } from "react";
import { BookingTimeline } from "@/components/booking/BookingTimeline";
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

  // When clicking the timeline
  function handleCreateBookingRequest(data: {
    roomId: string;
    start: Date;
    end: Date;
  }) {
    setOverlayData(data);
    setOverlayOpen(true);
  }

  // When pressing "Opret booking"
  function handleSubmitBooking(formData: {
    roomId: string;
    title: string;
    start: Date;
    end: Date;
  }) {
    console.log("NEW BOOKING:", formData);

    // TODO: CALL SUPABASE HERE
    // await supabase.from("bookings").insert(...)
    // then refresh state

    setOverlayOpen(false);
  }

  return (
    <>
      <div className="flex gap-10">
        {/* LEFT SIDE — timeline */}
        <div className="flex-1">
          <BookingTimeline onCreateBooking={handleCreateBookingRequest} />
        </div>

        {/* RIGHT SIDE — your existing date picker + filter UI */}
        <div className="w-[300px]">
          {/* This is where you embed your DatePicker, TimeInput, Filters, etc */}
          <p className="text-sm text-gray-600">
            Right-side filter + calendar UI goes here.
          </p>
        </div>
      </div>

      {/* CREATE BOOKING OVERLAY */}
      <CreateBookingOverlay
        opened={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        rooms={rooms}
        roomId={overlayData?.roomId ?? ""}
        start={overlayData?.start ?? new Date()}
        end={overlayData?.end ?? new Date()}
        onSubmit={handleSubmitBooking}
      />
    </>
  );
}

export default function HomePage() {
  return (
    <BookingProvider>
      <PageContent />
    </BookingProvider>
  );
}
