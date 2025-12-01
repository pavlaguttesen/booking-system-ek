"use client";

// Dansk kommentar: Formular til oprettelse af nye lokaler. Admin vælger navn,
// antal pladser, etage og faciliteter. Data sendes til Supabase.

import { useState } from "react";
import { TextInput, NumberInput, Checkbox, Button, Select } from "@mantine/core";
import { supabase } from "@/lib/supabaseClient";

export default function CreateRoomForm() {
  const [roomName, setRoomName] = useState("");
  const [capacity, setCapacity] = useState<number | null>(null);
  const [floor, setFloor] = useState<number | null>(null);
  const [hasWhiteboard, setHasWhiteboard] = useState(false);
  const [hasScreen, setHasScreen] = useState(false);
  const [hasBoard, setHasBoard] = useState(false);
  const [roomType, setRoomType] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    // Dansk kommentar: Validerer at admin har udfyldt de vigtigste felter
    if (!roomName || !roomType) {
      setErrorMsg("Du skal udfylde både navn og type.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("rooms").insert([
      {
        room_name: roomName,
        capacity: capacity ?? null,
        floor: floor ?? null,
        has_whiteboard: hasWhiteboard,
        has_screen: hasScreen,
        has_board: hasBoard,
        room_type: roomType,
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setSuccessMsg("Lokalet blev oprettet.");
    setLoading(false);

    // Dansk kommentar: Nulstil formular efter succes
    setRoomName("");
    setCapacity(null);
    setFloor(null);
    setHasWhiteboard(false);
    setHasScreen(false);
    setHasBoard(false);
    setRoomType(null);
  }

  return (
    <div className="flex flex-col gap-6">

      {errorMsg && (
        <p className="text-red-600 text-sm">{errorMsg}</p>
      )}

      {successMsg && (
        <p className="text-green-700 text-sm">{successMsg}</p>
      )}

      <TextInput
        label="Lokalenavn"
        placeholder="Fx 3.14 eller 'Studierum 5'"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />

      <Select
        label="Lokaletype"
        placeholder="Vælg type"
        value={roomType}
        onChange={setRoomType}
        data={[
          { value: "studierum", label: "Studierum" },
          { value: "møderum", label: "Møderum" },
          { value: "klasseværelse", label: "Klasselokale" },
          { value: "auditorium", label: "Auditorium" },
        ]}
      />

      <NumberInput
        label="Kapacitet"
        placeholder="Fx 24"
        value={capacity ?? undefined} // Dansk kommentar: undefined i stedet for null til Mantine
        onChange={(value) => {
          // Dansk kommentar: Mantine giver string | number, vi gemmer som number | null
          if (typeof value === "number") {
            setCapacity(value);
          } else {
            setCapacity(null);
          }
        }}
        min={1}
      />

      <NumberInput
        label="Etage"
        placeholder="Fx 1, 2, 3..."
        value={floor ?? undefined}
        onChange={(value) => {
          if (typeof value === "number") {
            setFloor(value);
          } else {
            setFloor(null);
          }
        }}
        min={1}
      />

      <div className="flex flex-col gap-2">
        <Checkbox
          label="Whiteboard"
          checked={hasWhiteboard}
          onChange={(e) => setHasWhiteboard(e.currentTarget.checked)}
        />

        <Checkbox
          label="Skærm"
          checked={hasScreen}
          onChange={(e) => setHasScreen(e.currentTarget.checked)}
        />

        <Checkbox
          label="Opslagstavle"
          checked={hasBoard}
          onChange={(e) => setHasBoard(e.currentTarget.checked)}
        />
      </div>

      <Button loading={loading} onClick={handleSubmit}>
        Opret lokale
      </Button>
    </div>
  );
}
