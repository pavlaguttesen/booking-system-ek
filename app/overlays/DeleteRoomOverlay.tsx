/**
 * SLET LOKALE OVERLAY (DELETEROOMOVERLAY.TSX)
 * ============================================
 * 
 * FORMÅL:
 * Dette overlay viser en bekræftelsesdialog når en administrator ønsker at slette et lokale.
 * Det sikrer at admin ikke sletter et lokale ved et uheld ved at kræve eksplicit bekræftelse.
 * 
 * NÅR DET VISES:
 * - Når en administrator klikker på "Slet lokale" knappen
 * - Fra admin-panelet ved lokalestyring
 * - Kun tilgængeligt for brugere med admin-rolle
 * 
 * FUNKTIONALITET:
 * - Viser advarselsbesked om at sletningen er permanent
 * - Viser navn på det lokale der skal slettes
 * - Kræver eksplicit bekræftelse før sletning
 * - Giver mulighed for at fortryde
 * 
 * BRUGERINTERAKTION:
 * - Læs advarselsbeskeden
 * - Klik "Slet lokale" for at bekræfte sletning (rød knap)
 * - Klik "Annuller" for at fortryde
 * - Klik uden for modal eller tryk ESC for at lukke
 * 
 * DATABASE OPERATIONER:
 * - DELETE operation udføres i parent-komponenten via onConfirm callback
 * - Denne komponent håndterer kun bekræftelse UI
 * 
 * SIKKERHED:
 * - Advarselsfarve (rød) for at indikere farlig handling
 * - Kræver eksplicit klik på bekræftelsesknap
 * - Viser hvilken ressource der slettes
 */

"use client";

import { Modal, Text, Button, Stack, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";

/**
 * Props til DeleteRoomOverlay komponenten
 * 
 * @property {boolean} opened - Om overlay er åben/synlig
 * @property {() => void} onClose - Callback når overlay lukkes uden sletning
 * @property {any} room - Det lokale der skal slettes (indeholder bl.a. room_name)
 * @property {() => void} onConfirm - Callback når admin bekræfter sletning
 */
type DeleteRoomOverlayProps = {
  opened: boolean;
  onClose: () => void;
  room: any;
  onConfirm: () => void;
};

/**
 * DeleteRoomOverlay komponent
 * ---------------------------
 * Viser en bekræftelsesdialog for sletning af lokale.
 * Bruger rød farve til advarselsknappen for at indikere destruktiv handling.
 * 
 * @param {DeleteRoomOverlayProps} props - Komponentens props
 * @returns {JSX.Element} Modal med bekræftelsesdialog
 */
export default function DeleteRoomOverlay({
  opened,
  onClose,
  room,
  onConfirm,
}: DeleteRoomOverlayProps) {
  // Hook til oversættelser
  const { t } = useTranslation();
  
  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={t("admin.deleteRoom")} // "Slet lokale"
      centered
    >
      <Stack gap="md">
        {/* ADVARSELSBESKED - Rød tekst for at indikere farlig handling */}
        <Text c="red" fw={600}>
          {t("admin.deleteRoomText")} {/* "Er du sikker på at du vil slette dette lokale?" */}
        </Text>

        {/* LOKALE INFORMATION - Viser hvilket lokale der slettes */}
        <Text>
          <b>{t("booking.room")}:</b> {room?.room_name}
        </Text>

        {/* HANDLINGSKNAPPER - Annuller eller bekræft sletning */}
        <Group justify="space-between" mt="md">
          {/* ANNULLER KNAP - Lukker overlay uden at slette */}
          <Button variant="default" onClick={onClose}>
            {t("common.cancel")} {/* "Annuller" */}
          </Button>

          {/* SLET KNAP - Bekræfter sletningen (rød for at advare) */}
          <Button color="red" onClick={onConfirm}>
            {t("admin.deleteRoom")} {/* "Slet lokale" */}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
