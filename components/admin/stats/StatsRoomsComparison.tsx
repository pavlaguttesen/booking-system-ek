"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";

// Sammenligner lokaler: filters, popularity (booking count), and utilization
export default function StatsRoomsComparison() {
  const { t } = useTranslation();
  // Data for lokaler og bookinger
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // Periode
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  // Filtre til sammenligning
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [floorFilter, setFloorFilter] = useState<string | null>(null);
  const [whiteboard, setWhiteboard] = useState<boolean>(false);
  const [screen, setScreen] = useState<boolean>(false);
  const [board, setBoard] = useState<boolean>(false);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // (Removed) Multi-room selection/utilization state

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

  // Bookinger i perioden til sammenligning
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

  // Popularitet (antal bookinger pr. lokale)
  const popularityMap = useMemo(() => {
    const map = new Map<string, number>();
    bookingsInPeriod.forEach(b => map.set(b.room_id, (map.get(b.room_id) || 0) + 1));
    return map;
  }, [bookingsInPeriod]);

  // (Removed) utilizationMap

  // Filtrer lokaler og annotér popularitet
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
      .map(r => ({ ...r, popularity: popularityMap.get(r.id) || 0 }));
  }, [rooms, typeFilter, floorFilter, whiteboard, screen, board, capacity, popularityMap]);

  // Sortering
  const [sortBy, setSortBy] = useState<"type" | "popularity" | "floor">("popularity");
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === "popularity") arr.sort((a, b) => b.popularity - a.popularity);
    if (sortBy === "type") arr.sort((a, b) => String(a.room_type ?? a.type ?? "").localeCompare(String(b.room_type ?? b.type ?? "")));
    if (sortBy === "floor") arr.sort((a, b) => Number(a.floor ?? 0) - Number(b.floor ?? 0));
    return arr;
  }, [filtered, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRooms = sorted.slice(startIndex, startIndex + itemsPerPage);

  // Reset side når filtre ændres
  useEffect(() => { setCurrentPage(1); }, [typeFilter, floorFilter, whiteboard, screen, board, capacity, start, end, sortBy]);

  // Unikke typer og etager til dropdowns
  const uniqueTypes = Array.from(new Set(rooms.map(r => r.room_type ?? r.type)))
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map(String)
    .sort((a, b) => a.localeCompare(b));
  const uniqueFloors = Array.from(new Set(rooms.map(r => r.floor)))
    .filter((v) => v !== null && v !== undefined)
    .map((v) => String(v))
    .sort((a, b) => Number(a) - Number(b));

  // (Removed) UtilizationBar

  return (
    <div className="space-y-4">
      {/* Overskrift */}
      <div className="border-b border-secondary-200 pb-2">
        <h3 className="text-lg font-semibold text-main">{t("adminStats.compareTitle")}</h3>
        <p className="text-sm text-secondary-300">{t("adminStats.compareSubtitle")}</p>
      </div>

      {/* (Removed) Room selection for utilization */}

      {/* (Removed) Selected rooms chips */}
      
      {/* Filtre inkl. periode og faciliteter/kapacitet */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary-400">{t("adminStats.cardTypeLabel")}</label>
          <select className="h-10 bg-white border border-secondary-200 rounded px-3 text-main shadow-sm w-full" value={typeFilter ?? ""} onChange={(e) => setTypeFilter(e.target.value ? e.target.value : null)}>
            <option value="">{t("adminStats.typeAllOption")}</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary-400">{t("adminStats.cardFloorLabel")}</label>
          <select className="h-10 bg-white border border-secondary-200 rounded px-3 text-main shadow-sm w-full" value={floorFilter ?? ""} onChange={(e) => setFloorFilter(e.target.value ? e.target.value : null)}>
            <option value="">{t("adminStats.floorAllOption")}</option>
            {uniqueFloors.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary-400">{t("admin.fromDate")}</label>
          <input type="date" className="h-10 bg-white border border-secondary-200 rounded px-3 text-main shadow-sm w-full" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary-400">{t("admin.toDate")}</label>
          <input type="date" className="h-10 bg-white border border-secondary-200 rounded px-3 text-main shadow-sm w-full" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary-400">{t("adminStats.sortPopularity")}</label>
          <select className="h-10 bg-white border border-secondary-200 rounded px-3 text-main shadow-sm w-full" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="popularity">{t("adminStats.sortPopularity")}</option>
            <option value="type">{t("adminStats.sortType")}</option>
            <option value="floor">{t("adminStats.sortFloor")}</option>
          </select>
        </div>
      </div>

      {/* Faciliteter + kapacitet */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="flex flex-col gap-1 md:col-span-3">
          <label className="text-xs font-medium text-secondary-400">{t("adminStats.facilitiesLabel")}</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              className={`h-10 w-full rounded border text-sm transition ${whiteboard ? "bg-primary-600 text-white border-primary-600" : "bg-white text-main border-secondary-200 hover:bg-secondary-50"}`}
              onClick={() => setWhiteboard(v => !v)}
            >
              {t("adminStats.facilityWhiteboard")}
            </button>
            <button
              className={`h-10 w-full rounded border text-sm transition ${screen ? "bg-primary-600 text-white border-primary-600" : "bg-white text-main border-secondary-200 hover:bg-secondary-50"}`}
              onClick={() => setScreen(v => !v)}
            >
              {t("adminStats.facilityScreen")}
            </button>
            <button
              className={`h-10 w-full rounded border text-sm transition ${board ? "bg-primary-600 text-white border-primary-600" : "bg-white text-main border-secondary-200 hover:bg-secondary-50"}`}
              onClick={() => setBoard(v => !v)}
            >
              {t("adminStats.facilityBoard")}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary-400">{t("adminStats.capacityLabel")}</label>
          <input
            type="number"
            min={0}
            className="h-10 bg-white border border-secondary-200 rounded px-3 text-main shadow-sm w-full"
            value={capacity ?? ""}
            onChange={(e) => {
              const n = Number(e.target.value);
              setCapacity(!isNaN(n) && n > 0 ? n : null);
            }}
            placeholder={t("adminStats.capacityPlaceholder")}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary-400">{t("adminStats.resetFilters")}</label>
          <button
            className="h-10 w-full rounded-md border text-sm transition bg-secondary-300 border-secondary-200 text-main hover:bg-secondary-200 font-medium"
            onClick={() => { setTypeFilter(null); setFloorFilter(null); setStart(""); setEnd(""); setWhiteboard(false); setScreen(false); setBoard(false); setCapacity(null); }}
          >
            {t("adminStats.resetFilters")}
          </button>
        </div>
      </div>

      {/* Hurtigvalg for semestre */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-main">{t("adminStats.quickSelect")}</span>
        <button className="px-3 py-1 border border-secondary-200 rounded bg-secondary-50 hover:bg-secondary-100 text-main text-sm transition" onClick={() => { setStart("2025-08-01"); setEnd("2025-12-31"); }}>{t("adminStats.quickAutumn2025")}</button>
        <button className="px-3 py-1 border border-secondary-200 rounded bg-secondary-50 hover:bg-secondary-100 text-main text-sm transition" onClick={() => { setStart("2026-01-01"); setEnd("2026-06-30"); }}>{t("adminStats.quickSpring2026")}</button>
      </div>

      {/* (Removed) Utilization results */}

      {/* Result list and chart side by side under filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-3">
          {paginatedRooms.length > 0 ? (
            paginatedRooms.map(r => (
              <div key={r.id} className="bg-white p-4 border border-secondary-200 rounded shadow-sm">
                <div className="font-semibold text-main">{r.room_name ?? r.name}</div>
                <div className="text-sm text-secondary-300">{t("adminStats.cardTypeLabel")}: {r.room_type || r.type || "-"}</div>
                <div className="text-sm text-secondary-300">{t("adminStats.cardFloorLabel")}: {r.floor ?? "-"}</div>
                <div className="mt-2 text-sm"><span className="font-medium">{t("adminStats.cardBookingsLabel")}:</span> {r.popularity}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-secondary-300 py-8 border border-dashed border-secondary-200 rounded">{t("adminStats.noRoomsMatch")}</div>
          )}

          {/* Pagination controls */}
          {sorted.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-1 p-3 bg-secondary-50 rounded border border-secondary-200">
              <span className="text-sm text-secondary-300">
                {t("admin.showing")} {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sorted.length)} {t("admin.of")} {sorted.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 text-sm border border-secondary-200 rounded bg-white hover:bg-secondary-50 disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  {t("admin.previous")}
                </button>
                <span className="text-sm text-main">{currentPage}/{totalPages}</span>
                <button
                  className="px-3 py-1 text-sm border border-secondary-200 rounded bg-white hover:bg-secondary-50 disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  {t("admin.next")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Booking count chart */}
        <PopularityChart rooms={sorted.slice(0, 8)} />
      </div>
    </div>
  );
}

// (Removed) UtilizationComparisonChart component

// Simpel søjlediagram (SVG) der viser popularitet for top-lokaler
function PopularityChart({ rooms }: { rooms: Array<{ id: string; room_name?: string; name?: string; popularity: number }> }) {
  const { t } = useTranslation();
  // Sikring mod tomme eller ugyldige data
  if (!rooms || rooms.length === 0) {
    return (
      <div className="mt-4 text-secondary-300 text-sm">{t("adminStats.chartNoData")}</div>
    );
  }

  const labels = rooms.map(r => String(r.room_name ?? r.name ?? ""));
  const values = rooms.map(r => {
    const v = Number(r.popularity);
    return isNaN(v) || v < 0 ? 0 : v;
  });
  const max = Math.max(1, ...values);
  const barWidth = 54;
  const gap = 14;
  const height = 220;
  const width = rooms.length * barWidth + (rooms.length - 1) * gap;

  return (
    <div className="mt-4 bg-white p-4 rounded border border-secondary-200 shadow-sm">
      <div className="text-sm font-semibold text-main mb-3">{t("adminStats.chartTitle")}</div>
      <svg width={String(width)} height={String(height)} role="img" aria-label={t("adminStats.chartAria")}>
        <line x1="0" y1={String(height - 28)} x2={String(width)} y2={String(height - 28)} stroke="#E5E7EB" strokeWidth="1" />
        {values.map((v, i) => {
          const safeV = typeof v === "number" && isFinite(v) ? v : 0;
          const h = (safeV / max) * (height - 60);
          const x = i * (barWidth + gap);
          const y = height - h - 32;
          const safeY = isFinite(y) ? y : height - 32;
          const safeH = isFinite(h) && h >= 0 ? h : 0;
          return (
            <g key={i}>
              <rect
                x={String(x)}
                y={String(safeY)}
                width={String(barWidth)}
                height={String(safeH)}
                fill="#4F46E5"
                rx={8}
              >
                <title>{`${labels[i] ?? ""}: ${safeV}`}</title>
              </rect>
              <text x={String(x + barWidth / 2)} y={String(safeY - 6)} textAnchor="middle" fontSize={12} fill="#111827" fontWeight="600">
                {safeV}
              </text>
              <text x={String(x + barWidth / 2)} y={String(height - 10)} textAnchor="middle" fontSize={12} fill="#4B5563">
                {(() => { const label = labels[i] ?? ""; return label.length > 10 ? label.slice(0, 10) + "…" : label; })()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
