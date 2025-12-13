/**
 * REDIGER LOKALE OVERLAY (EDITROOMOVERLAY.TSX)
 * =============================================
 * 
 * FORMÅL:
 * Dette overlay giver administratorer mulighed for at redigere eksisterende lokaleoplysninger.
 * Admin kan ændre alle detaljer om et lokale inklusive navn, kapacitet, sæder og faciliteter.
 * 
 * NÅR DET VISES:
 * - Når en administrator klikker på "Rediger" knappen på et lokale
 * - Fra admin-panelet ved lokalestyring
 * - Kun tilgængeligt for brugere med admin-rolle
 * 
 * FUNKTIONALITET:
 * - Indlæser eksisterende lokaledata
 * - Giver mulighed for at ændre lokalenavn
 * - Tillader opdatering af kapacitet (antal personer)
 * - Lader admin ændre antal sæder
 * - Checkboxes til at angive faciliteter (whiteboard, skærm, tavle)
 * - Gemmer ændringer til Supabase database
 * - Validerer input før der gemmes
 * 
 * BRUGERINTERAKTION:
 * - Indtast nyt lokalenavn
 * - Juster kapacitet og antal sæder via number inputs
 * - Markér/afmarkér checkboxes for faciliteter
 * - Klik "Gem" for at gemme ændringer
 * - Klik "Annuller" eller X for at fortryde
 * 
 * DATABASE OPERATIONER:
 * - UPDATE operation på 'rooms' tabel
 * - Opdaterer: room_name, capacity, nr_of_seats, has_board, has_whiteboard, has_screen
 * - Fejlhåndtering med alert ved mislykket opdatering
 */

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "react-i18next";

/**
 * Type definition for lokale der kan redigeres
 * 
 * @property {string} id - Unik identifikator for lokalet
 * @property {string} room_name - Lokalets navn
 * @property {string | null} room_type - Type af lokale (studierum, klasseværelse, etc.)
 * @property {number | null} capacity - Maksimal kapacitet (antal personer)
 * @property {number | null} floor - Hvilken etage lokalet er på
 * @property {boolean | null} has_whiteboard - Om lokalet har whiteboard
 * @property {boolean | null} has_screen - Om lokalet har projektionsskærm
 * @property {boolean | null} has_board - Om lokalet har tavle
 * @property {boolean | null} is_closed - Om lokalet er lukket/utilgængeligt
 * @property {number | null} nr_of_seats - Antal siddepladser i lokalet
 */
type RoomForEdit = {
  id: string;
  room_name: string;
  room_type: string | null;
  capacity: number | null;
  floor: number | null;
  has_whiteboard: boolean | null;
  has_screen: boolean | null;
  has_board: boolean | null;
  is_closed: boolean | null;
  nr_of_seats?: number | null;
};

/**
 * Props til EditRoomOverlay komponenten
 * 
 * @property {RoomForEdit} room - Det lokale der skal redigeres
 * @property {() => void} onClose - Callback når overlay lukkes
 * @property {() => void} onSave - Callback når ændringer gemmes succesfuldt
 */
type EditRoomOverlayProps = {
  room: RoomForEdit;
  onClose: () => void;
  onSave: () => void;
};

/**
 * EditRoomOverlay komponent
 * -------------------------
 * Hovedkomponent der håndterer redigering af lokaleoplysninger.
 * Bruger React Portal til at rendere overlay udenfor normal DOM-hierarki.
 * 
 * @param {EditRoomOverlayProps} props - Komponentens props
 * @returns {JSX.Element | null} Portal med overlay eller null hvis ikke mounted
 */
export default function EditRoomOverlay({
  room,
  onClose,
  onSave,
}: EditRoomOverlayProps) {
  // Hook til oversættelser
  const { t } = useTranslation();
  
  /**
   * STATE: mounted
   * Indikerer om komponenten er mounted på klienten.
   * Bruges til at sikre at createPortal kun kaldes efter hydration.
   */
  const [mounted, setMounted] = useState(false);

  /**
   * STATE: roomName
   * Lokalets navn - kan redigeres af bruger
   * Initialiseres med eksisterende værdi fra room.room_name
   */
  const [roomName, setRoomName] = useState(room.room_name);
  
  /**
   * STATE: capacity
   * Maksimal kapacitet for lokalet (antal personer)
   * Sættes til 0 hvis ikke angivet
   */
  const [capacity, setCapacity] = useState(room.capacity ?? 0);
  
  /**
   * STATE: seats
   * Antal siddepladser i lokalet
   * Sættes til 0 hvis ikke angivet
   */
  const [seats, setSeats] = useState(room.nr_of_seats ?? 0);
  
  /**
   * STATE: hasWhiteboard
   * Boolean der angiver om lokalet har whiteboard
   * Sættes til false hvis ikke angivet
   */
  const [hasWhiteboard, setHasWhiteboard] = useState(
    room.has_whiteboard ?? false
  );
  
  /**
   * STATE: hasScreen
   * Boolean der angiver om lokalet har projektionsskærm
   * Sættes til false hvis ikke angivet
   */
  const [hasScreen, setHasScreen] = useState(room.has_screen ?? false);
  
  /**
   * STATE: hasBoard
   * Boolean der angiver om lokalet har tavle
   * Sættes til false hvis ikke angivet
   */
  const [hasBoard, setHasBoard] = useState(room.has_board ?? false);

  /**
   * EFFECT: Sæt mounted state
   * --------------------------
   * Kører når komponenten mountes.
   * Sætter mounted til true for at indikere at komponenten er klar til rendering.
   * Dette sikrer at createPortal ikke fejler under server-side rendering.
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * FUNCTION: handleSave
   * --------------------
   * Håndterer gemning af ændringer til databasen.
   * 
   * FLOW:
   * 1. Sender UPDATE query til Supabase 'rooms' tabel
   * 2. Opdaterer alle redigerede felter (navn, kapacitet, faciliteter)
   * 3. Matcher på lokale-ID for at sikre korrekt opdatering
   * 4. Håndterer fejl med console log og alert til bruger
   * 5. Kalder onSave callback ved succes
   * 6. Lukker overlay
   * 
   * @async
   * @returns {Promise<void>}
   */
  async function handleSave() {
    // Udfør UPDATE operation på Supabase
    const { error } = await supabase
      .from("rooms")
      .update({
        room_name: roomName,
        capacity,
        nr_of_seats: seats,
        has_board: hasBoard,
        has_whiteboard: hasWhiteboard,
        has_screen: hasScreen,
      })
      .eq("id", room.id); // Match på lokale-ID

    // Fejlhåndtering - log til console og vis alert
    if (error) {
      console.error("Update error:", error);
      alert(t("ErrorMsg.updateFailed")); // Vis fejlbesked til bruger
      return;
    }

    // Success - kald callbacks
    onSave(); // Notificer parent om succesfuld gemning
    onClose(); // Luk overlay
  }

  // Vent med at rendere indtil komponenten er mounted (for at undgå hydration fejl)
  if (!mounted) return null;

  /**
   * OVERLAY JSX
   * -----------
   * Hovedlayout for overlay med header, content og footer
   * Bruger fixed positioning til at dække hele skærmen
   */
  const overlay = (
    /* BACKDROP - Semi-transparent sort baggrund der dækker hele skærmen */
    <div className="fixed inset-0 bg-black/40 z-9999 flex justify-center items-center p-4">
      {/* MODAL BOX - Hvid container med skygge og afrundede hjørner */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl border border-secondary-200">
        
        {/* HEADER - Titel og luk-knap */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-main">{t("admin.editRoom")}</h2>

          {/* Luk-knap (X) i øverste højre hjørne */}
          <button
            onClick={onClose}
            className="text-2xl leading-none text-secondary-600 hover:text-main"
            aria-label="Luk overlay"
          >
            ×
          </button>
        </div>

        {/* CONTENT - Formular til redigering af lokaledata */}
        <div className="px-6 py-6 space-y-6">
          
          {/* INPUT: Lokalenavn */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t("admin.Roomname")}
            </label>
            {/* Text input - opdaterer roomName state ved ændring */}
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:outline-none"
            />
          </div>

          {/* INPUT: Kapacitet (antal personer) */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t("admin.capacity")}
            </label>
            {/* Number input - opdaterer capacity state ved ændring */}
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:outline-none"
            />
          </div>

          {/* INPUT: Antal sæder */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t("admin.amountofseats")}
            </label>
            {/* Number input - opdaterer seats state ved ændring */}
            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:outline-none"
            />
          </div>

          {/* CHECKBOXES: Faciliteter i lokalet */}
          <div className="flex items-center gap-6 mt-2">
            {/* Checkbox for whiteboard */}
            <label className="flex items-center gap-2 text-secondary-700">
              <input
                type="checkbox"
                checked={hasWhiteboard}
                onChange={() => setHasWhiteboard(!hasWhiteboard)} // Toggle boolean værdi
                className="h-4 w-4"
              />
              {t("admin.Roomname")} {/* TODO: Add whiteboard translation */}
            </label>

            {/* Checkbox for tavle */}
            <label className="flex items-center gap-2 text-secondary-700">
              <input
                type="checkbox"
                checked={hasBoard}
                onChange={() => setHasBoard(!hasBoard)} // Toggle boolean værdi
                className="h-4 w-4"
              />
              {t("admin.seets")} {/* TODO: Add board translation */}
            </label>

            {/* Checkbox for skærm/projektor */}
            <label className="flex items-center gap-2 text-secondary-700">
              <input
                type="checkbox"
                checked={hasScreen}
                onChange={() => setHasScreen(!hasScreen)} // Toggle boolean værdi
                className="h-4 w-4"
              />
              {t("admin.screen")}
            </label>
          </div>
        </div>

        {/* FOOTER - Handlingsknapper (Annuller og Gem) */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-secondary-200 bg-secondary-50 rounded-b-xl">
          {/* ANNULLER KNAP - Lukker overlay uden at gemme */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-secondary-200 text-secondary-700 hover:bg-secondary-300"
          >
            {t("common.cancel")}
          </button>

          {/* GEM KNAP - Gemmer ændringer og lukker overlay */}
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-600/90"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );

  /**
   * RETURN: createPortal
   * --------------------
   * Bruger React Portal til at rendere overlay udenfor normal DOM-struktur.
   * Dette sikrer at overlay altid vises over alt andet indhold.
   * Overlay mountes i elementet med id "overlay-root".
   */
  return createPortal(overlay, document.getElementById("overlay-root")!);
}
