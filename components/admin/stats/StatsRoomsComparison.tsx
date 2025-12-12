"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Sammenligner lokaler, med filtre og sortering, og viser simpel popularitetsindikator
export default function StatsRoomsComparison() {
  // Data for lokaler og bookinger
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // Filtre
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [floorFilter, setFloorFilter] = useState<string | null>(null);
  const [whiteboard, setWhiteboard] = useState<boolean>(false);
  const [screen, setScreen] = useState<boolean>(false);
  const [board, setBoard] = useState<boolean>(false);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  // Hent data
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

  // Filtrer bookinger efter periode
  const bookingsInPeriod = useMemo(() => {
    if (!start || !end) return bookings;
    const s = new Date(`${start}T00:00:00Z`).getTime();
    const e = new Date(`${end}T23:59:59Z`).getTime();
    return bookings.filter(b => {
      const bs = new Date(b.start_time).getTime();
      const be = new Date(b.end_time).getTime();
      return be >= s && bs <= e;
    });
  }, [bookings, start, end]);

  // Popularitet = antal bookinger pr. lokale i perioden
  const popularityMap = useMemo(() => {
    const map = new Map<string, number>();
    bookingsInPeriod.forEach(b => map.set(b.room_id, (map.get(b.room_id) || 0) + 1));
    return map;
  }, [bookingsInPeriod]);

  // Anvend filtre på lokaler og annotér popularitet (brug korrekte felter)
  const filtered = useMemo(() => {
    return rooms
      .filter(r => {
        const roomType = r.room_type ?? r.type ?? null;
        const floorStr = r.floor !== null && r.floor !== undefined ? String(r.floor) : null;
        if (typeFilter && roomType !== typeFilter) return false;
        if (floorFilter && floorStr !== String(floorFilter)) return false;
        if (whiteboard && !r.has_whiteboard) return false;
        if (screen && !r.has_screen) return false;
        if (board && !r.has_board) return false;
        if (capacity && (typeof r.capacity !== "number" || r.capacity < capacity)) return false;
        return true;
      })
      .map(r => ({
        ...r,
        popularity: popularityMap.get(r.id) || 0,
      }));
  }, [rooms, typeFilter, floorFilter, popularityMap, whiteboard, screen, board, capacity]);

  // Sortering
  const [sortBy, setSortBy] = useState<"type" | "popularity" | "floor">("popularity");
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === "popularity") arr.sort((a, b) => b.popularity - a.popularity);
    if (sortBy === "type") arr.sort((a, b) => String(a.room_type ?? a.type ?? "").localeCompare(String(b.room_type ?? b.type ?? "")));
    if (sortBy === "floor") arr.sort((a, b) => Number(a.floor ?? 0) - Number(b.floor ?? 0));
    return arr;
  }, [filtered, sortBy]);

  // Unikke typer og etager til dropdowns (fra room_type/floor), sorteret
  const uniqueTypes = Array.from(new Set(rooms.map(r => r.room_type ?? r.type)))
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map(String)
    .sort((a, b) => a.localeCompare(b));
  const uniqueFloors = Array.from(new Set(rooms.map(r => r.floor)))
    .filter((v) => v !== null && v !== undefined)
    .map((v) => String(v))
    .sort((a, b) => Number(a) - Number(b));

  return (
    <div className="space-y-4">
      {/* Overskrift */}
      <div className="border-b border-secondary-200 pb-2">
        <h3 className="text-lg font-semibold text-main">Sammenligning af lokaler</h3>
        <p className="text-sm text-secondary-300">Filtrer og sammenlign lokaler baseret på popularitet og faciliteter</p>
      </div>
      
      {/* Filtre inkl. periode og faciliteter/kapacitet */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <select className="bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm" value={typeFilter ?? ""} onChange={(e) => setTypeFilter(e.target.value ? e.target.value : null)}>
          <option value="">Type (alle)</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm" value={floorFilter ?? ""} onChange={(e) => setFloorFilter(e.target.value ? e.target.value : null)}>
          <option value="">Etage (alle)</option>
          {uniqueFloors.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <input type="date" className="bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm" value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="date" className="bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm" value={end} onChange={(e) => setEnd(e.target.value)} />
        <select className="bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="popularity">Sorter: Popularitet</option>
          <option value="type">Sorter: Type</option>
          <option value="floor">Sorter: Etage</option>
        </select>
      </div>

      {/* Faciliteter + kapacitet */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-main">Faciliteter:</span>
          <button className={`px-3 py-1 rounded border text-sm transition ${whiteboard ? "bg-primary-600 text-white border-primary-600" : "bg-secondary-200 text-main border-secondary-200 hover:bg-secondary-100"}`} onClick={() => setWhiteboard(v => !v)}>Whiteboard</button>
          <button className={`px-3 py-1 rounded border text-sm transition ${screen ? "bg-primary-600 text-white border-primary-600" : "bg-secondary-200 text-main border-secondary-200 hover:bg-secondary-100"}`} onClick={() => setScreen(v => !v)}>Skærm</button>
          <button className={`px-3 py-1 rounded border text-sm transition ${board ? "bg-primary-600 text-white border-primary-600" : "bg-secondary-200 text-main border-secondary-200 hover:bg-secondary-100"}`} onClick={() => setBoard(v => !v)}>Opslagstavle</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-main">Kapacitet:</span>
          <input
            type="number"
            min={0}
            className="bg-white border border-secondary-200 rounded px-3 py-1 text-main shadow-sm w-24"
            value={capacity ?? ""}
            onChange={(e) => {
              const n = Number(e.target.value);
              setCapacity(!isNaN(n) && n > 0 ? n : null);
            }}
            placeholder="fx 20"
          />
        </div>
        <button
          className="px-4 py-2 rounded-md border text-sm transition bg-secondary-300 border-secondary-200 text-main hover:bg-secondary-200 font-medium"
          onClick={() => { setTypeFilter(null); setFloorFilter(null); setStart(""); setEnd(""); setWhiteboard(false); setScreen(false); setBoard(false); setCapacity(null); }}
        >
          Nulstil filtre
        </button>
      </div>

      {/* Hurtigvalg for semestre */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-main">Hurtigvalg:</span>
        <button className="px-3 py-1 border border-secondary-200 rounded bg-secondary-50 hover:bg-secondary-100 text-main text-sm transition" onClick={() => { setStart("2025-08-01"); setEnd("2025-12-31"); }}>Efterår 2025</button>
        <button className="px-3 py-1 border border-secondary-200 rounded bg-secondary-50 hover:bg-secondary-100 text-main text-sm transition" onClick={() => { setStart("2026-01-01"); setEnd("2026-06-30"); }}>Forår 2026</button>
      </div>

      {/* Kort over lokaler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.length > 0 ? (
          sorted.map(r => (
            <div key={r.id} className="bg-white p-4 border border-secondary-200 rounded shadow-sm">
              <div className="font-semibold text-main">{r.room_name ?? r.name}</div>
              <div className="text-sm text-secondary-300">Type: {r.room_type || r.type || "-"}</div>
              <div className="text-sm text-secondary-300">Etage: {r.floor ?? "-"}</div>
              <div className="mt-2 text-sm"><span className="font-medium">Popularitet:</span> {r.popularity}</div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-secondary-300 py-8">Ingen lokaler matcher de valgte filtre</div>
        )}
      </div>

      {/* Søjlediagram over de mest populære lokaler i perioden */}
      <PopularityChart rooms={sorted.slice(0, 8)} />
    </div>
  );
}

// Simpel søjlediagram (SVG) der viser popularitet for top-lokaler
function PopularityChart({ rooms }: { rooms: Array<{ id: string; room_name?: string; name?: string; popularity: number }> }) {
  // Sikring mod tomme eller ugyldige data
  if (!rooms || rooms.length === 0) {
    return (
      <div className="mt-4 text-secondary-300 text-sm">Ingen data til popularitetsdiagram i den valgte periode.</div>
    );
  }

  const labels = rooms.map(r => String(r.room_name ?? r.name ?? ""));
  const values = rooms.map(r => {
    const v = Number(r.popularity);
    return isNaN(v) || v < 0 ? 0 : v;
  });
  const max = Math.max(1, ...values);
  const barWidth = 40;
  const gap = 16;
  const height = 180;
  const width = rooms.length * barWidth + (rooms.length - 1) * gap;

  return (
    <div className="mt-4 bg-secondary-50 p-4 rounded border border-secondary-200">
      <div className="text-sm font-semibold text-main mb-3">Top popularitet (antal bookinger)</div>
      <svg width={String(width)} height={String(height)} role="img" aria-label="Popularitet pr. lokale">
        {values.map((v, i) => {
          const safeV = typeof v === "number" && isFinite(v) ? v : 0;
          const h = (safeV / max) * (height - 30);
          const x = i * (barWidth + gap);
          const y = height - h - 20;
          const safeY = isFinite(y) ? y : height - 20;
          const safeH = isFinite(h) && h >= 0 ? h : 0;
          return (
            <g key={i}>
              <rect x={String(x)} y={String(safeY)} width={String(barWidth)} height={String(safeH)} fill="#6366F1" rx={6} />
              <text x={String(x + barWidth / 2)} y={String(height - 6)} textAnchor="middle" fontSize={11} fill="#374151">
                {(() => { const label = labels[i] ?? ""; return label.length > 8 ? label.slice(0, 8) + "…" : label; })()}
              </text>
              <text x={String(x + barWidth / 2)} y={String(safeY - 4)} textAnchor="middle" fontSize={11} fill="#374151">{safeV}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
