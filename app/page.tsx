"use client";

import { BookingProvider } from "@/context/BookingContext";
import { BookingFilters } from "@/components/booking/BookingFilters";
import { BookingList } from "@/components/booking/BookingList";

export default function HomePage() {
  return (
    <BookingProvider>
      {/* Wrapper med vores globale farver */}
      <div className="space-y-6 bg-page text-main">
        <header>
          <h1 className="text-2xl font-bold text-primary-600">
            Booking system
          </h1>
          <p className="text-sm text-primary-200">
            Se og filtrér bookinger på tværs af lokaler, datoer og typer.
          </p>
        </header>

        <BookingFilters />
        <BookingList />
      </div>
    </BookingProvider>
  );
}
