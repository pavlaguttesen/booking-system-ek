/**
 * SLET BOOKING OVERLAY (DELETEBOOKINGSOVERLAY.TSX)
 * =================================================
 * 
 * FORMÅL:
 * Dette overlay viser en bekræftelsesdialog når en bruger ønsker at slette en booking.
 * Det viser alle relevante detaljer om bookingen og kræver eksplicit bekræftelse før sletning.
 * 
 * NÅR DET VISES:
 * - Når en bruger klikker på "Slet booking" fra deres bookingsliste
 * - Fra "Min side" når brugeren ser deres egne bookinger
 * - Fra admin-panelet når en administrator sletter en booking
 * - Når en booking skal fjernes fra systemet
 * 
 * FUNKTIONALITET:
 * - Viser komplet information om bookingen (titel, lokale, bruger, dato, tid)
 * - Advarselsbesked om at sletningen er permanent
 * - Håndterer bookinger med eller uden titel
 * - Formaterer dato og tid i dansk format (da-DK)
 * - Viser fallback-tekster hvis data mangler (ukendt lokale/bruger)
 * - Kræver eksplicit bekræftelse før sletning
 * 
 * BRUGERINTERAKTION:
 * - Gennemse bookingdetaljer
 * - Klik på X-ikon i øverste højre hjørne for at fortryde
 * - Klik "Annuller" for at fortryde sletning
 * - Klik "Slet booking" (rød knap) for at bekræfte sletning
 * - Klik uden for modal eller tryk ESC for at lukke
 * 
 * DATABASE OPERATIONER:
 * - DELETE operation udføres i parent-komponenten via onConfirm callback
 * - Denne komponent håndterer kun bekræftelse UI
 * 
 * DATA FORMATERING:
 * - Datoer formateres med toLocaleDateString("da-DK")
 * - Tider formateres med toLocaleTimeString("da-DK", { timeStyle: "short" })
 * - Viser "Ingen titel" hvis booking ikke har titel
 * - Viser "Ukendt lokale" hvis lokaledata mangler
 * - Viser "Ukendt bruger" hvis profildata mangler
 * 
 * SIKKERHED:
 * - Rød farve på bekræftelsesknap indikerer destruktiv handling
 * - Kræver eksplicit klik på bekræftelsesknap
 * - Viser alle relevante data så bruger kan verificere korrekt booking
 */

"use client";

import { Modal, Text, Button, Stack, Group } from "@mantine/core";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

/**
 * Props til DeleteBookingOverlay komponenten
 * 
 * @property {boolean} opened - Om overlay er åben/synlig
 * @property {() => void} onClose - Callback når overlay lukkes uden sletning
 * @property {any} booking - Booking objektet der skal slettes (indeholder titel, start_time, end_time)
 * @property {any} room - Lokale objektet tilknyttet bookingen (indeholder room_name)
 * @property {any} profile - Brugerprofil for den der oprettede bookingen (indeholder full_name)
 * @property {() => void} onConfirm - Callback når bruger bekræfter sletning
 */
type DeleteBookingOverlayProps = {
  opened: boolean;
  onClose: () => void;
  booking: any;
  room: any;
  profile: any;
  onConfirm: () => void;
};

/**
 * DeleteBookingOverlay komponent
 * -------------------------------
 * Viser en bekræftelsesdialog med detaljeret information om bookingen der skal slettes.
 * Bruger rød farve til advarselsknappen for at indikere destruktiv handling.
 * 
 * @param {DeleteBookingOverlayProps} props - Komponentens props
 * @returns {JSX.Element} Modal med bekræftelsesdialog og bookingdetaljer
 */
export function DeleteBookingOverlay({
  opened,
  onClose,
  booking,
  room,
  profile,
  onConfirm,
}: DeleteBookingOverlayProps) {
  // Hook til oversættelser
  const { t } = useTranslation();
  
  /**
   * Konverter booking tidspunkter til Date objekter
   * Disse bruges til at formatere dato og tid i UI
   */
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  return (
    <Modal opened={opened} onClose={onClose} centered title={null}>
      {/* LUK KNAP - X-ikon i øverste højre hjørne */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 cursor-pointer transition"
        aria-label="Luk dialog"
      >
        <FontAwesomeIcon icon={faCircleXmark} className="text-2xl" />
      </button>

      <Stack gap="md" className="mt-2">
        {/* TITEL - "Slet booking" */}
        <Text size="xl" fw={700}>
          {t("booking.deletebooking")}
        </Text>

        {/* ADVARSELSBESKED - Rød tekst for at indikere permanent handling */}
        <Text size="sm" c="red" fw={600}>
          {t("booking.deletethisbooking")} {/* "Er du sikker på at du vil slette denne booking?" */}
        </Text>

        {/* BOOKING DETALJER - Viser al relevant information */}
        <Stack gap={4}>
          {/* Booking titel (eller "Ingen titel" hvis mangler) */}
          <Text>
            <b>{t("booking.title")}:</b> {booking.title || t("booking.notitle")}
          </Text>

          {/* Lokalenavn (eller "Ukendt lokale" hvis mangler) */}
          <Text>
            <b>{t("booking.room")}:</b> {room?.room_name ?? t("booking.unknownroom")}
          </Text>

          {/* Brugernavn (eller "Ukendt bruger" hvis mangler) */}
          <Text>
            <b>{t("admin.user")}:</b> {profile?.full_name ?? t("unknown.unknownUser")}
          </Text>

          {/* Dato - formateret i dansk format (dd.mm.yyyy) */}
          <Text>
            <b>{t("booking.date")}:</b> {start.toLocaleDateString("da-DK")}
          </Text>

          {/* Tidspunkt - formateret i dansk kort format (HH:MM) */}
          <Text>
            <b>{t("booking.time")}:</b>{" "}
            {start.toLocaleTimeString("da-DK", { timeStyle: "short" })}
            {" – "}
            {end.toLocaleTimeString("da-DK", { timeStyle: "short" })}
          </Text>
        </Stack>

        {/* HANDLINGSKNAPPER - Annuller eller bekræft sletning */}
        <Group justify="space-between" mt="md">
          {/* ANNULLER KNAP - Lukker overlay uden at slette */}
          <Button variant="default" onClick={onClose}>
            {t("common.cancel")} {/* "Annuller" */}
          </Button>

          {/* SLET KNAP - Bekræfter sletningen (rød for at advare) */}
          <Button color="red" onClick={onConfirm}>
            {t("booking.deletebooking")} {/* "Slet booking" */}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
