/**
 * VÆLG LOKALE OVERLAY (SELECTROOMOVERLAY.TSX)
 * ============================================
 * 
 * FORMÅL:
 * Dette overlay vises når der er flere ledige lokaler til rådighed for en given tidsperiode.
 * Brugeren kan vælge det ønskede lokale fra listen af tilgængelige muligheder.
 * 
 * NÅR DET VISES:
 * - Efter at brugeren har valgt et tidsrum til booking
 * - Når systemet finder flere ledige lokaler der matcher søgekriterierne
 * - Før den endelige booking oprettes
 * 
 * FUNKTIONALITET:
 * - Viser en liste over alle tilgængelige lokaler
 * - Inkluderer information om lokaets navn og kapacitet
 * - Håndterer tom liste hvis der ikke findes ledige lokaler
 * - Sender valgt lokale-ID tilbage til parent-komponenten
 * 
 * BRUGERINTERAKTION:
 * - Klik på et lokale for at vælge det
 * - Klik uden for modal eller tryk ESC for at lukke
 */

"use client";

import { Modal, Button } from "@mantine/core";
import { useTranslation } from "react-i18next";

/**
 * Props til SelectRoomOverlay komponenten
 * 
 * @property {boolean} opened - Om overlay er åben/synlig
 * @property {() => void} onClose - Callback når overlay lukkes
 * @property {Array} rooms - Array af tilgængelige lokaler med id, navn og kapacitet
 * @property {Date} start - Start-tidspunkt for den ønskede booking
 * @property {Date} end - Slut-tidspunkt for den ønskede booking
 * @property {(roomId: string) => void} onSelect - Callback når et lokale vælges
 */
type SelectRoomOverlayProps = {
  opened: boolean;
  onClose: () => void;
  rooms: { id: string; room_name: string; capacity: number | null }[];
  start: Date;
  end: Date;
  onSelect: (roomId: string) => void;
};

/**
 * SelectRoomOverlay komponent
 * ---------------------------
 * Viser en modal dialog med en liste af tilgængelige lokaler.
 * Brugeren kan vælge et lokale fra listen for at fortsætte booking-processen.
 * 
 * @param {SelectRoomOverlayProps} props - Komponentens props
 * @returns {JSX.Element} Modal med liste af valgbare lokaler
 */
export function SelectRoomOverlay({
  opened,
  onClose,
  rooms,
  start,
  end,
  onSelect,
}: SelectRoomOverlayProps) {
  // Hook til oversættelser
  const { t } = useTranslation();
  
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("booking.selectroom")} // "Vælg lokale"
      centered
    >
      <div className="space-y-3">
        {/* Besked hvis ingen lokaler er tilgængelige */}
        {rooms.length === 0 && (
          <p className="text-center text-main">{t("admin.lookforroom")}</p>
        )}

        {/* Liste over tilgængelige lokaler som knapper */}
        {rooms.map((r) => (
          <Button
            key={r.id}
            fullWidth
            className="bg-primary-600 hover:bg-primary-700 text-invert"
            onClick={() => onSelect(r.id)} // Sender valgt lokale-ID til parent
          >
            {/* Viser lokalenavn og kapacitet (eller "ukendt" hvis kapacitet mangler) */}
            {r.room_name} ({t("admin.capacity")}: {r.capacity ?? t("booking.unknownroom")})
          </Button>
        ))}
      </div>
    </Modal>
  );
}
