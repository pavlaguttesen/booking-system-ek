"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Viser statistik for gentagne bookinger samt (valgfrit) hvor ofte brugere booker.
export default function StatsRepeatAndUsers() {
  // Bookinger fra databasen
  const [bookings, setBookings] = useState<any[]>([]);
  // Toggle til at vise brugerfrekvens
  const [showUsers, setShowUsers] = useState(false);
  // Periodefilter (datoer) som admin kan vælge
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  // Opslag af brugernavne
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Hent bookinger
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("bookings")
        .select("id,is_repeating,user_id,start_time,end_time");
      setBookings(data || []);
    }
    load();
  }, []);

  // Hent brugerprofiler for at vise navne i stedet for ids (hvis findes)
  useEffect(() => {
    async function loadProfiles() {
      // Vi antager en 'profiles' tabel med kolonner id, full_name (tilpas hvis anderledes)
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name");
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => {
        if (p.id) map[p.id] = p.full_name || p.id;
      });
      setUserNames(map);
    }
    loadProfiles();
  }, []);

  // Filtrér bookinger efter periode, hvis sat
  const filtered = useMemo(() => {
    if (!start || !end) return bookings;
    const s = new Date(`${start}T00:00:00Z`).getTime();
    const e = new Date(`${end}T23:59:59Z`).getTime();
    return bookings.filter(b => {
      const bs = new Date(b.start_time).getTime();
      const be = new Date(b.end_time).getTime();
      return be >= s && bs <= e; // enhver overlap med perioden
    });
  }, [bookings, start, end]);

  // Antal gentagne og procent
  const repeatCount = useMemo(() => filtered.filter(b => b.is_repeating).length, [filtered]);
  const totalCount = filtered.length;
  const repeatPct = totalCount ? Number(((repeatCount / totalCount) * 100).toFixed(2)) : 0;

  // Brugerfrekvens (hvor mange bookinger per user_id)
  const userFreq = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(b => {
      if (!b.user_id) return;
      map.set(b.user_id, (map.get(b.user_id) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  // Lille søjlediagram (SVG) for gentagne vs. ikke-gentagne
  function RepeatChart() {
    const labels = ["Gentagne", "Ikke-gentagne"];
    const values = [repeatCount, Math.max(0, totalCount - repeatCount)];
    const max = Math.max(1, ...values);
    const barWidth = 60;
    const gap = 24;
    const height = 120;
    const width = labels.length * barWidth + (labels.length - 1) * gap;
    return (
      <svg width={width} height={height} role="img" aria-label="Gentagne kontra ikke-gentagne">
        {values.map((v, i) => {
          const h = (v / max) * (height - 20);
          const x = i * (barWidth + gap);
          const y = height - h;
          const color = i === 0 ? "#3B82F6" : "#A3E635";
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={h} fill={color} rx={6} />
              <text x={x + barWidth / 2} y={height - 2} textAnchor="middle" fontSize={12} fill="#374151">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overskrift */}
      <div className="border-b border-secondary-200 pb-2">
        <h3 className="text-lg font-semibold text-main">Gentagelser & brugere</h3>
        <p className="text-sm text-secondary-300">Statistik over gentagne bookinger og brugerfrekvens</p>
      </div>
      {/* Hurtigvalg for semestre */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-main">Hurtigvalg:</span>
        <button className="px-3 py-1 border border-secondary-200 rounded bg-secondary-50 hover:bg-secondary-100 text-main text-sm transition" onClick={() => { setStart("2025-08-01"); setEnd("2025-12-31"); }}>Efterår 2025</button>
        <button className="px-3 py-1 border border-secondary-200 rounded bg-secondary-50 hover:bg-secondary-100 text-main text-sm transition" onClick={() => { setStart("2026-01-01"); setEnd("2026-06-30"); }}>Forår 2026</button>
      </div>
      {/* Periodevælger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input type="date" className="bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm" value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="date" className="bg-white border border-secondary-200 rounded px-3 py-2 text-main shadow-sm" value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>

      {/* Nøgletal */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-secondary-50 rounded">
          <div className="text-secondary-300">Gentagne bookinger</div>
          <div className="text-2xl font-semibold">{repeatCount}</div>
        </div>
        <div className="p-4 bg-secondary-50 rounded">
          <div className="text-secondary-300">Andel gentagne</div>
          <div className="text-2xl font-semibold">{repeatPct}%</div>
        </div>
      </div>

      {/* Diagram */}
      <RepeatChart />

      {/* Toggle for brugerliste */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showUsers} onChange={(e) => setShowUsers(e.target.checked)} />
          <span>Vis brugere og frekvens</span>
        </label>
      </div>

      {/* Brugerfrekvensliste */}
      {showUsers && (
        <div className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {userFreq.map(([userId, count]) => (
              <div key={userId} className="flex items-center justify-between p-3 border rounded">
                {/* Viser brugernavn hvis tilgængelig */}
                <span className="text-secondary-300">{userNames[userId] || userId}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
