"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Denne komponent viser udnyttelsesgrad (i procent) for et valgt lokale
// inden for en valgt periode. Admin kan vælge start- og slutdato.
export default function StatsRoomUtilization() {
  // Lokaler og bookinger hentes fra databasen (Supabase)
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // Valg af lokale og periode
  const [roomId, setRoomId] = useState<string | null>(null); // room_id er UUID i data
  const [start, setStart] = useState<string>(""); // yyyy-MM-dd (fra input type=date)
  const [end, setEnd] = useState<string>("");

  // Hent lokaler og bookinger
  useEffect(() => {
    async function load() {
      const [roomsRes, bookingsRes] = await Promise.all([
        supabase.from("rooms").select("*"),
        supabase.from("bookings").select("id,room_id,start_time,end_time"),
      ]);
      if (roomsRes.error) console.error("Fejl ved hentning af lokaler:", roomsRes.error);
      if (bookingsRes.error) console.error("Fejl ved hentning af bookinger:", bookingsRes.error);
      setRooms(roomsRes.data || []);
      setBookings(bookingsRes.data || []);
    }
    load();
  }, []);

  // Udregn procent del af perioden, hvor lokalet er booket
  const percentage = useMemo(() => {
    if (!roomId || !start || !end) return null;
    // Konverter dato-input (yyyy-MM-dd) til tidsstempler i UTC ved start/slut af dag
    const s = new Date(`${start}T00:00:00Z`).getTime();
    const e = new Date(`${end}T23:59:59Z`).getTime();
    if (e <= s) return null;
    const windowMs = e - s;

    // Filtrér bookinger for det valgte lokale
    const roomBookings = bookings.filter(b => b.room_id === roomId);
    // Beregn overlap mellem booking og valgt periode
    const totalBookedMs = roomBookings.reduce((acc, b) => {
      const bs = new Date(b.start_time).getTime();
      const be = new Date(b.end_time).getTime();
      const overlapStart = Math.max(s, bs);
      const overlapEnd = Math.min(e, be);
      const overlap = Math.max(0, overlapEnd - overlapStart);
      return acc + overlap;
    }, 0);

    const pct = windowMs > 0 ? (totalBookedMs / windowMs) * 100 : 0;
    return Math.min(100, Math.max(0, Number(pct.toFixed(2))));
  }, [roomId, start, end, bookings]);

  // Simpelt mini-chart (SVG) der viser procent visuelt som en bar
  function UtilizationBar({ value }: { value: number }) {
    // value: procent 0-100
    const width = 300; // px
    const height = 16; // px
    const filled = Math.max(0, Math.min(100, value));
    return (
      <svg width={width} height={height} role="img" aria-label={`Udnyttelse ${filled}%`}>
        {/* Baggrund */}
        <rect x={0} y={0} width={width} height={height} fill="#E5E7EB" rx={8} />
        {/* Fyldt del */}
        <rect x={0} y={0} width={(filled / 100) * width} height={height} fill="#22C55E" rx={8} />
      </svg>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overskrift */}
      <div className="border-b border-secondary-200 pb-2">
        <h3 className="text-lg font-semibold text-main">Udnyttelse pr. lokale</h3>
        <p className="text-sm text-secondary-300">Vælg et lokale og periode for at se udnyttelsesgraden</p>
      </div>
      {/* Hurtigvalg for semestre */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-main">Hurtigvalg:</span>
        <button className="px-3 py-1 border border-secondary-200 rounded bg-secondary-50 hover:bg-secondary-100 text-main text-sm transition" onClick={() => { setStart("2025-08-01"); setEnd("2025-12-31"); }}>Efterår 2025</button>
        <button className="px-3 py-1 border border-secondary-200 rounded bg-secondary-50 hover:bg-secondary-100 text-main text-sm transition" onClick={() => { setStart("2026-01-01"); setEnd("2026-06-30"); }}>Forår 2026</button>
      </div>
      {/* Kontroller for lokale og periode */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          className="bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm"
          value={roomId ?? ""}
          onChange={(e) => setRoomId(e.target.value || null)}
        >
          <option value="">Vælg lokale</option>
          {[...rooms]
            .sort((a, b) => String(a.room_name ?? a.name ?? "").localeCompare(String(b.room_name ?? b.name ?? "")))
            .map(r => (
              // Viser rummets navn (room_name) i stedet for generic name
              <option key={r.id} value={r.id}>{r.room_name ?? r.name ?? r.id}</option>
            ))}
        </select>
        <input
          // Startdato for perioden
          type="date"
          className="bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          // Slutdato for perioden
          type="date"
          className="bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>

      {/* Resultat: procent og lille diagram */}
      <div className="bg-secondary-50 p-4 rounded border border-secondary-200">
        {percentage === null ? (
          <p className="text-secondary-300 text-sm">Vælg lokale og periode for at se udnyttelsesgrad.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-main">Udnyttelsesgrad:</span>
              <span className="text-2xl font-bold text-main">{percentage}%</span>
            </div>
            <UtilizationBar value={percentage} />
          </div>
        )}
      </div>
    </div>
  );
}
