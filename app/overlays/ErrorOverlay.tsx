/**
 * FEJL OVERLAY (ERROROVERLAY.TSX)
 * ================================
 * 
 * FORMÅL:
 * Dette overlay viser fejlmeddelelser til brugeren når noget går galt i systemet.
 * Det bruges primært i booking-processen, men kan bruges til at vise alle typer fejl.
 * 
 * NÅR DET VISES:
 * - Når en booking fejler (f.eks. overlap, manglende rettigheder)
 * - Når en database-operation fejler
 * - Når validering af input fejler
 * - Når netværksfejl opstår
 * - Generel fejlhåndtering i applikationen
 * 
 * FUNKTIONALITET:
 * - Viser en brugervenlig fejlmeddelelse
 * - Inkluderer en titel og beskrivelse af fejlen
 * - Giver mulighed for at lukke overlay og fortsætte
 * - Centreret på skærmen for maximum synlighed
 * 
 * BRUGERINTERAKTION:
 * - Klik på X-ikon i øverste højre hjørne for at lukke
 * - Klik på "Tilbage"-knappen for at lukke
 * - Klik uden for modal for at lukke
 * - Tryk ESC for at lukke
 */

"use client";

import { Modal, Button, Text, Stack } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

/**
 * Props til ErrorOverlay komponenten
 * 
 * @property {boolean} opened - Om overlay er åben/synlig
 * @property {() => void} onClose - Callback når overlay lukkes
 * @property {string} title - Fejlens overskrift/titel
 * @property {string} message - Detaljeret beskrivelse af fejlen
 */
type ErrorOverlayProps = {
  opened: boolean;
  onClose: () => void;
  title: string;
  message: string;
};

/**
 * ErrorOverlay komponent
 * ----------------------
 * Viser en modal dialog med fejlinformation i et brugervenligt format.
 * Inkluderer lukkeknap og tilbage-knap for at give brugeren kontrol.
 * 
 * @param {ErrorOverlayProps} props - Komponentens props
 * @returns {JSX.Element} Modal med fejlbesked
 */
export function ErrorOverlay({
  opened,
  onClose,
  title,
  message,
}: ErrorOverlayProps) {
  // Hook til oversættelser
  const { t } = useTranslation();
  
  return (
    <Modal opened={opened} onClose={onClose} centered title={null} radius="md">
      {/* LUK KNAP - X-ikon i øverste højre hjørne */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 cursor-pointer transition"
        aria-label="Luk fejlbesked" // Tilgængelighed for skærmlæsere
      >
        <FontAwesomeIcon icon={faCircleXmark} className="text-2xl" />
      </button>

      {/* INDHOLD - Centreret med padding */}
      <Stack gap="md" className="text-center px-6 py-4 mt-2">
        {/* FEJL TITEL - Fremhævet med fed skrift og større størrelse */}
        <Text fw={700} size="xl">
          {title}
        </Text>

        {/* FEJL BESKED - Detaljeret beskrivelse af hvad der gik galt */}
        <Text size="md">{message}</Text>

        {/* TILBAGE KNAP - Lukker overlay og lader brugeren fortsætte */}
        <Button onClick={onClose} mt="sm" fullWidth>
          {t("booking.back")} {/* "Tilbage" */}
        </Button>
      </Stack>
    </Modal>
  );
}
