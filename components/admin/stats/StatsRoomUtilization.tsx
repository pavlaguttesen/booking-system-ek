"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";

// Denne komponent viser udnyttelsesgrad (i procent) for et valgt lokale
// inden for en valgt periode. Admin kan vælge start- og slutdato.
export default function StatsRoomUtilization() {
  const { t } = useTranslation();
  // Lokaler og bookinger hentes fra databasen (Supabase)
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // Valg af lokale og periode
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]); // flere rum kan sammenlignes
  const [roomToAdd, setRoomToAdd] = useState<string>(""); // buffer til dropdown-valg før tilføj
  const [roomQuery, setRoomQuery] = useState<string>(""); // søgning i lokaler
  const MAX_ROOMS = 6; // Dansk kommentar: Maksimalt antal lokaler i sammenligning for overskuelighed.
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

  // Udregn procent del af perioden, hvor lokalet er booket (for flere rum)
  const utilizationMap = useMemo(() => {
    if (!start || !end) return new Map<string, number>();
    const s = new Date(`${start}T00:00:00Z`).getTime();
    const e = new Date(`${end}T23:59:59Z`).getTime();
    if (e <= s) return new Map<string, number>();
    const windowMs = e - s;

    const map = new Map<string, number>();
    selectedRoomIds.forEach(roomId => {
      const roomBookings = bookings.filter(b => b.room_id === roomId);
      const totalBookedMs = roomBookings.reduce((acc, b) => {
        const bs = new Date(b.start_time).getTime();
        const be = new Date(b.end_time).getTime();
        const overlapStart = Math.max(s, bs);
        const overlapEnd = Math.min(e, be);
        const overlap = Math.max(0, overlapEnd - overlapStart);
        return acc + overlap;
      }, 0);
      const pct = windowMs > 0 ? (totalBookedMs / windowMs) * 100 : 0;
      map.set(roomId, Math.min(100, Math.max(0, Number(pct.toFixed(2)))));
    });
    return map;
  }, [bookings, end, selectedRoomIds, start]);

  // Simpelt mini-chart (SVG) der viser procent visuelt som en bar
  function UtilizationBar({ value }: { value: number }) {
    // value: procent 0-100
    const width = 260; // px
    const height = 14; // px
    const filled = Math.max(0, Math.min(100, value));
    return (
      <svg width={width} height={height} role="img" aria-label={t("adminStats.utilAria", { value: filled })}>
        {/* Baggrund */}
        <rect x={0} y={0} width={width} height={height} fill="#E5E7EB" rx={8} />
        {/* Fyldt del */}
        <rect x={0} y={0} width={(filled / 100) * width} height={height} fill="#4F46E5" rx={8} />
      </svg>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overskrift */}
      <div className="border-b border-secondary-200 pb-2">
        <h3 className="text-lg font-semibold text-main">{t("adminStats.utilTitle")}</h3>
        <p className="text-sm text-secondary-300">{t("adminStats.utilSubtitle")}</p>
      </div>
      {/* Hurtigvalg for semestre */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-main">{t("adminStats.quickSelect")}</span>
        <button className="px-3 py-1 border border-secondary-200 rounded bg-white hover:bg-secondary-50 text-main text-sm transition" onClick={() => { setStart("2025-08-01"); setEnd("2025-12-31"); }}>{t("adminStats.quickAutumn2025")}</button>
        <button className="px-3 py-1 border border-secondary-200 rounded bg-white hover:bg-secondary-50 text-main text-sm transition" onClick={() => { setStart("2026-01-01"); setEnd("2026-06-30"); }}>{t("adminStats.quickSpring2026")}</button>
      </div>

      {/* Room selection section */}
      <div className="bg-secondary-50 p-4 rounded border border-secondary-200">
        <label className="text-sm font-semibold text-main mb-3 block">{t("adminStats.selectRoom")}</label>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
          <div className="space-y-2">
            <input
              type="text"
              className="w-full bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm text-sm"
              placeholder={t("adminStats.searchRoomPlaceholder")}
              value={roomQuery}
              onChange={(e) => setRoomQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // Dansk kommentar: Enter tilføjer det aktuelt valgte eller første forslag.
                  if (roomToAdd && !selectedRoomIds.includes(roomToAdd) && selectedRoomIds.length < MAX_ROOMS) {
                    setSelectedRoomIds(prev => [...prev, roomToAdd]);
                    setRoomToAdd("");
                    return;
                  }
                  const first = rooms
                    .filter(r => {
                      const q = roomQuery.trim().toLowerCase();
                      if (!q) return true;
                      const name = String(r.room_name ?? r.name ?? "").toLowerCase();
                      const floor = String(r.floor ?? "").toLowerCase();
                      return name.includes(q) || floor.includes(q);
                    })
                    .sort((a, b) => String(a.room_name ?? a.name ?? "").localeCompare(String(b.room_name ?? b.name ?? "")))[0];
                  if (first && !selectedRoomIds.includes(first.id) && selectedRoomIds.length < MAX_ROOMS) {
                    setSelectedRoomIds(prev => [...prev, first.id]);
                    setRoomToAdd("");
                  }
                } else if (e.key === "Escape") {
                  // Dansk kommentar: Esc rydder søgning.
                  setRoomQuery("");
                  setRoomToAdd("");
                }
              }}
            />
            <div className="max-h-40 overflow-auto border border-secondary-200 rounded bg-white shadow-sm">
              {rooms
                .filter(r => {
                  const q = roomQuery.trim().toLowerCase();
                  if (!q) return true;
                  const name = String(r.room_name ?? r.name ?? "").toLowerCase();
                  const floor = String(r.floor ?? "").toLowerCase();
                  return name.includes(q) || floor.includes(q);
                })
                .sort((a, b) => String(a.room_name ?? a.name ?? "").localeCompare(String(b.room_name ?? b.name ?? "")))
                .slice(0, 20)
                .map(r => (
                  <button
                    key={r.id}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary-50 border-b border-secondary-100 last:border-0 transition ${
                      roomToAdd === r.id ? "bg-primary-50 border-l-2 border-l-primary-600" : selectedRoomIds.includes(r.id) ? "bg-secondary-100" : "bg-white"
                    }`}
                    onClick={() => setRoomToAdd(r.id)}
                  >
                    <span className="font-medium text-main">{r.room_name ?? r.name ?? r.id}</span>
                    <span className="ml-2 text-secondary-300 text-xs">• {t("admin.floor")}: {r.floor ?? "-"}</span>
                  </button>
                ))}
            </div>
          </div>
          <div className="flex lg:flex-col gap-2">
            <button
              className="px-4 py-2 rounded bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition whitespace-nowrap"
              disabled={!roomToAdd || selectedRoomIds.includes(roomToAdd) || selectedRoomIds.length >= MAX_ROOMS}
              onClick={() => {
                // Dansk kommentar: Tilføjer det valgte lokale til sammenligningslisten (uden duplikater).
                if (!roomToAdd || selectedRoomIds.includes(roomToAdd) || selectedRoomIds.length >= MAX_ROOMS) return;
                setSelectedRoomIds(prev => [...prev, roomToAdd]);
                setRoomToAdd("");
              }}
            >
              {t("adminStats.addRoom")}
            </button>
            <button
              className="px-4 py-2 rounded border border-secondary-200 bg-white text-main text-sm hover:bg-secondary-100 transition whitespace-nowrap disabled:opacity-50"
              disabled={selectedRoomIds.length === 0}
              onClick={() => {
                // Dansk kommentar: Fjerner alle valgte lokaler fra listen.
                setSelectedRoomIds([]);
              }}
            >
              {t("adminStats.clearRooms")}
            </button>
          </div>
        </div>
        {selectedRoomIds.length >= MAX_ROOMS && (
          <p className="mt-2 text-xs text-secondary-400">{t("adminStats.maxRoomsReached", { max: MAX_ROOMS })}</p>
        )}
      </div>

      {/* Selected rooms chips */}
      {selectedRoomIds.length > 0 && (
        <div className="bg-white p-4 rounded border border-secondary-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-main">{t("adminStats.selectedRooms", { count: selectedRoomIds.length })}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedRoomIds.map(id => {
              const room = rooms.find(r => r.id === id);
              const label = room?.room_name ?? room?.name ?? id;
              return (
                <span key={id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-secondary-200 bg-secondary-50 text-main text-sm">
                  <span className="font-medium">{label}</span>
                  <button
                    className="rounded-full bg-white border border-secondary-200 w-5 h-5 flex items-center justify-center text-sm hover:bg-secondary-100 transition"
                    onClick={() => setSelectedRoomIds(prev => prev.filter(x => x !== id))}
                    aria-label={t("adminStats.removeRoom")}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Date range filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-main">{t("admin.fromDate")}</label>
          <input
            type="date"
            className="bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm text-sm"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-main">{t("admin.toDate")}</label>
          <input
            type="date"
            className="bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm text-sm"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
          {/* Old duplicate chips - will be removed */}
          {false && selectedRoomIds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedRoomIds.map(id => {
                const room = rooms.find(r => r.id === id);
                const label = room?.room_name ?? room?.name ?? id;
                return (
                  <span key={id} className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-secondary-200 bg-secondary-100 text-main text-xs">
                    {label}
                    <button
                      className="rounded-full bg-white border border-secondary-200 px-2 py-0.5 text-xs hover:bg-secondary-50"
                      onClick={() => setSelectedRoomIds(prev => prev.filter(x => x !== id))}
                      aria-label={t("adminStats.removeRoom")}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          {selectedRoomIds.length >= MAX_ROOMS && (
            <p className="mt-2 text-xs text-secondary-400">{t("adminStats.maxRoomsReached", { max: MAX_ROOMS })}</p>
          )}
      </div>

      {/* Resultat: flere lokaler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="space-y-3 bg-secondary-50 p-4 rounded border border-secondary-200">
          <h4 className="text-sm font-semibold text-main">{t("adminStats.utilListTitle")}</h4>
          {selectedRoomIds.length === 0 || utilizationMap.size === 0 ? (
            <p className="text-secondary-300 text-sm">{t("adminStats.utilEmpty")}</p>
          ) : (
            <div className="space-y-3">
              {selectedRoomIds.map(roomId => {
                const pct = utilizationMap.get(roomId) ?? 0;
                const room = rooms.find(r => r.id === roomId);
                const label = room?.room_name ?? room?.name ?? roomId;
                return (
                  <div key={roomId} className="p-3 rounded border border-secondary-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between text-sm font-semibold text-main">
                      <span>{label}</span>
                      <div className="flex items-center gap-2">
                        <span>{pct}%</span>
                        <button
                          className="text-xs px-2 py-1 rounded border border-secondary-200 text-secondary-400 hover:bg-secondary-50"
                          onClick={() => {
                            // Dansk kommentar: Fjerner lokalet fra sammenligningslisten.
                            setSelectedRoomIds(prev => prev.filter(id => id !== roomId));
                          }}
                        >
                          {t("adminStats.removeRoom")}
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <UtilizationBar value={pct} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <UtilizationComparisonChart
          rooms={rooms}
          selectedRoomIds={selectedRoomIds}
          utilizationMap={utilizationMap}
          title={t("adminStats.utilChartTitle")}
          ariaLabel={t("adminStats.utilChartAria")}
        />
      </div>
    </div>
  );
}

function UtilizationComparisonChart({
  rooms,
  selectedRoomIds,
  utilizationMap,
  title,
  ariaLabel,
}: {
  rooms: any[];
  selectedRoomIds: string[];
  utilizationMap: Map<string, number>;
  title: string;
  ariaLabel: string;
}) {
  const entries = selectedRoomIds
    .map(id => {
      const pct = utilizationMap.get(id) ?? 0;
      const room = rooms.find(r => r.id === id);
      const label = room?.room_name ?? room?.name ?? id;
      return { id, label, pct };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8);

  const values = entries.map(e => e.pct);
  const max = Math.max(100, ...values, 1);
  const barWidth = 48;
  const gap = 16;
  const height = 220;
  const width = entries.length * barWidth + Math.max(entries.length - 1, 0) * gap;

  if (entries.length === 0) {
    return (
      <div className="bg-secondary-50 p-4 rounded border border-secondary-200 text-secondary-300 text-sm">
        {title}
        <div className="mt-2">{ariaLabel}</div>
      </div>
    );
  }

  return (
    <div className="bg-secondary-50 p-4 rounded border border-secondary-200">
      <div className="text-sm font-semibold text-main mb-3">{title}</div>
      <svg width={String(width)} height={String(height)} role="img" aria-label={ariaLabel}>
        <line x1="0" y1={String(height - 28)} x2={String(width)} y2={String(height - 28)} stroke="#E5E7EB" strokeWidth="1" />
        {entries.map((entry, i) => {
          const h = (entry.pct / max) * (height - 60);
          const x = i * (barWidth + gap);
          const y = height - h - 32;
          return (
            <g key={entry.id}>
              <rect
                x={String(x)}
                y={String(y)}
                width={String(barWidth)}
                height={String(h)}
                fill="#4F46E5"
                rx={8}
              >
                <title>{`${entry.label}: ${entry.pct}%`}</title>
              </rect>
              <text x={String(x + barWidth / 2)} y={String(y - 6)} textAnchor="middle" fontSize={12} fill="#1f2937" fontWeight="600">
                {entry.pct}%
              </text>
              <text x={String(x + barWidth / 2)} y={String(height - 10)} textAnchor="middle" fontSize={12} fill="#4b5563">
                {entry.label.length > 10 ? entry.label.slice(0, 10) + "…" : entry.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
