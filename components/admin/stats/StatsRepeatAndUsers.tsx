"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";

// Viser statistik for gentagne bookinger samt (valgfrit) hvor ofte brugere booker.
export default function StatsRepeatAndUsers() {
  const { t } = useTranslation();
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
    const labels = [t("adminStats.repeatLabelRecurring"), t("adminStats.repeatLabelNonRecurring")];
    const values = [repeatCount, Math.max(0, totalCount - repeatCount)];
    const max = Math.max(1, ...values);
    const barHeight = 32;
    const rowGap = 18;
    const paddingLeft = 140; // space for category labels
    const paddingRight = 80; // space for value pill
    const width = 520; // fixed width for horizontal layout
    const height = labels.length * (barHeight + rowGap) + 20;
    return (
      <svg width={width} height={height} role="img" aria-label={t("adminStats.repeatChartAria")}>
        {values.map((v, i) => {
          const rowY = i * (barHeight + rowGap) + 10;
          const barLength = (v / max) * (width - paddingLeft - paddingRight);
          const color = i === 0 ? "#4F46E5" : "#93C5FD";
          const label = labels[i] ?? "";
          // Category label (left)
          const catX = 12;
          const catY = rowY + barHeight / 2 + 5; // text baseline adjustment
          // Value pill (right)
          const valueStr = String(v);
          const valueWidth = Math.min(92, Math.max(36, valueStr.length * 8.5 + 12));
          const pillX = paddingLeft + barLength + 10;
          const pillY = rowY + (barHeight - 22) / 2;
          return (
            <g key={i}>
              {/* Category label on the left */}
              <text x={catX} y={catY} fontSize={13} fill="#111827" fontWeight="600">{label}</text>
              {/* Bar */}
              <rect x={paddingLeft} y={rowY} width={barLength} height={barHeight} fill={color} rx={6} />
              {/* Value pill */}
              <rect x={pillX} y={pillY} width={valueWidth} height={22} fill="#FFFFFF" stroke="#E5E7EB" rx={8} />
              <text x={pillX + valueWidth / 2} y={pillY + 15} textAnchor="middle" fontSize={14} fill="#0F172A" fontWeight="700">{v}</text>
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
        <h3 className="text-lg font-semibold text-secondary">{t("adminStats.repeatTitle")}</h3>
        <p className="text-sm text-secondary">{t("adminStats.repeatSubtitle")}</p>
      </div>
      {/* Hurtigvalg for semestre */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="flex flex-col gap-1 md:col-span-1">
          <label className="text-xs font-medium text-secondary">{t("adminStats.quickSelect")}</label>
          <div className="grid grid-cols-2 gap-2">
            <button className="h-10 w-full rounded border text-sm transition bg-secondary-50 hover:bg-secondary-100 text-secondary border-secondary-200" onClick={() => { setStart("2025-08-01"); setEnd("2025-12-31"); }}>{t("adminStats.quickAutumn2025")}</button>
            <button className="h-10 w-full rounded border text-sm transition bg-secondary-50 hover:bg-secondary-100 text-secondary border-secondary-200" onClick={() => { setStart("2026-01-01"); setEnd("2026-06-30"); }}>{t("adminStats.quickSpring2026")}</button>
          </div>
        </div>
        {/* Periodevælger */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary">{t("admin.fromDate")}</label>
          <input type="date" className="h-10 bg-white border border-secondary-200 rounded px-3 text-secondary opacity-50 shadow-sm w-full" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary">{t("admin.toDate")}</label>
          <input type="date" className="h-10 bg-white border border-secondary-200 rounded px-3 text-secondary opacity-50 shadow-sm w-full" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>



      {/* Nøgletal */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-white rounded border border-secondary-200 shadow-sm">
          <div className="text-secondary opacity-70">{t("adminStats.repeatCount")}</div>
          <div className="text-2xl font-semibold text-secondary">{repeatCount}</div>
        </div>
        <div className="p-4 bg-white rounded border border-secondary-200 shadow-sm">
          <div className="text-secondary opacity-70">{t("adminStats.repeatShare")}</div>
          <div className="text-2xl font-semibold text-secondary">{repeatPct}%</div>
        </div>
      </div>

      {/* Diagram */}
      <RepeatChart />

      {/* Toggle for brugerliste */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-secondary">
          <input type="checkbox" className="accent-primary-600" checked={showUsers} onChange={(e) => setShowUsers(e.target.checked)} />
          <span className="text-sm">{t("adminStats.repeatShowUsers")}</span>
        </label>
      </div>

      {/* Brugerfrekvensliste */}
      {showUsers && (
        <div className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {userFreq.map(([userId, count]) => (
              <div key={userId} className="flex items-center justify-between p-3 border border-secondary-200 rounded bg-white shadow-sm">
                {/* Viser brugernavn hvis tilgængelig */}
                <span className="text-secondary-400">{userNames[userId] || userId}</span>
                <span className="font-medium text-main">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
