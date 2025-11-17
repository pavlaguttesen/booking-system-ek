"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Room = {
  id: string;
  room_name: string;
  floor: number;
  nr_of_seats: number;
};

type Booking = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  booking_type?: "normal" | "exam";
  rooms: { room_name: string }[] | null;
  profiles: { full_name: string | null; role: string }[] | null;
};

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setErrorMsg(null);

      // --- Hent rooms ---
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("id, room_name, floor, nr_of_seats")
        .order("room_name", { ascending: true });

      if (roomsError) {
        setErrorMsg(roomsError.message);
        setLoading(false);
        return;
      }

      setRooms((roomsData ?? []) as Room[]);

      // --- Hent bookings + join på rooms & profiles ---
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          `
          id,
          title,
          description,
          start_time,
          end_time,
          booking_type,
          rooms ( room_name ),
          profiles ( full_name, role )
        `
        )
        .order("start_time", { ascending: true });

      if (bookingsError) {
        setErrorMsg(bookingsError.message);
        setLoading(false);
        return;
      }

      setBookings((bookingsData ?? []) as Booking[]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto py-6 px-4 text-slate-100">
        <h1 className="text-2xl font-bold mb-4">Booking system</h1>
        <p>Henter data...</p>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="max-w-5xl mx-auto py-6 px-4 text-slate-100">
        <h1 className="text-2xl font-bold mb-4">Booking system</h1>
        <p className="text-red-400">Fejl: {errorMsg}</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto py-6 px-4 text-slate-100">
      <h1 className="text-2xl font-bold mb-6">Booking system</h1>

      {/* Lokaler */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Lokaler</h2>
        <div className="space-y-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="rounded-lg border border-slate-700 px-4 py-2 flex justify-between"
            >
              <div>
                <p className="font-medium">{room.room_name}</p>
                <p className="text-sm text-slate-400">
                  Etage: {room.floor} • Pladser: {room.nr_of_seats}
                </p>
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
            <p className="text-slate-400 text-sm">Ingen lokaler fundet.</p>
          )}
        </div>
      </section>

      {/* Bookinger */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Bookinger</h2>
        <div className="space-y-3">
          {bookings.map((b) => {
            const roomName = b.rooms?.[0]?.room_name ?? "Ukendt lokale";
            const profile = b.profiles?.[0] ?? null;
            const fullName = profile?.full_name ?? "Ukendt bruger";
            const role = (profile as any)?.role as string | undefined;

            return (
              <div
                key={b.id}
                className="rounded-lg border border-slate-700 px-4 py-3"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium">
                      {b.title}{" "}
                      {b.booking_type === "exam" && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-900/70 text-amber-100">
                          Eksamen
                        </span>
                      )}
                      {role === "teacher" && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-900/70 text-blue-100">
                          Teacher
                        </span>
                      )}
                      {role === "admin" && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-900/70 text-red-100">
                          Admin
                        </span>
                      )}
                    </p>

                    <p className="text-sm text-slate-400">
                      {roomName} •{" "}
                      {new Date(b.start_time).toLocaleString("da-DK", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}{" "}
                      –{" "}
                      {new Date(b.end_time).toLocaleTimeString("da-DK", {
                        timeStyle: "short",
                      })}
                    </p>

                    <p className="text-sm text-slate-400">
                      Booker: {fullName}
                    </p>

                    {b.description && (
                      <p className="text-sm text-slate-300 mt-1">
                        {b.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {bookings.length === 0 && (
            <p className="text-slate-400 text-sm">Ingen bookinger fundet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
