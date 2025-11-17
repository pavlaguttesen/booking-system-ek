"use client";

import { BookingProvider } from "@/context/BookingContext";
import { BookingFilters } from "@/components/booking/BookingFilters";
import { BookingList } from "@/components/booking/BookingList";

export default function HomePage() {
  return (
    <BookingProvider>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Booking system</h1>
          <p className="text-sm text-slate-400">
            Se og filtrér bookinger på tværs af lokaler, datoer og typer.
          </p>
        </header>

        <BookingFilters />
        <BookingList />
      </div>
    </BookingProvider>
  );
}
