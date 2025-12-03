"use client";

// Formular til oprettelse af nye lokaler. Admin vælger navn,
// antal pladser, etage og faciliteter. Data sendes til Supabase.

import { useState } from "react";
import {
  TextInput,
  NumberInput,
  Checkbox,
  Button,
  Select,
} from "@mantine/core";
import { supabase } from "@/lib/supabaseClient";

type CreateRoomFormProps = {
  // Kaldes efter succesfuld oprettelse, så parent kan genindlæse listen
  onRoomCreated?: () => void;
};

export default function CreateRoomForm({ onRoomCreated }: CreateRoomFormProps) {
  // Lokal state til formularfelter
  const [roomName, setRoomName] = useState("");
  const [capacity, setCapacity] = useState<number | null>(null);
  const [floor, setFloor] = useState<number | null>(null);
  const [nrOfSeats, setNrOfSeats] = useState<number | null>(null);
  const [hasWhiteboard, setHasWhiteboard] = useState(false);
  const [hasScreen, setHasScreen] = useState(false);
  const [hasBoard, setHasBoard] = useState(false);
  const [roomType, setRoomType] = useState<string | null>(null);
  const [isClosed, setIsClosed] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    // Simpel validering
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
        nr_of_seats: nrOfSeats ?? null,
        has_whiteboard: hasWhiteboard,
        has_screen: hasScreen,
        has_board: hasBoard,
        room_type: roomType,
        is_closed: isClosed,
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    //Kald parent callback så listen kan genindlæses
    if (onRoomCreated) {
      onRoomCreated();
    }

    setSuccessMsg("Lokalet blev oprettet.");
    setLoading(false);

    // Reset form
    setRoomName("");
    setCapacity(null);
    setFloor(null);
    setNrOfSeats(null);
    setHasWhiteboard(false);
    setHasScreen(false);
    setHasBoard(false);
    setRoomType(null);
    setIsClosed(false);
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Fejl- og succesbeskeder */}
      {errorMsg && (
        <p className="text-red-600 text-sm">{errorMsg}</p>
      )}

      {successMsg && (
        <p className="text-green-700 text-sm">{successMsg}</p>
      )}

      {/* Lokalenavn */}
      <TextInput
        label="Lokalenavn"
        placeholder="Fx 3.14 eller 'Studierum 5'"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />

      {/* Lokaletype */}
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

      {/* Kapacitet */}
      <NumberInput
        label="Kapacitet"
        placeholder="Fx 24"
        value={capacity ?? undefined}
        onChange={(value) =>
          setCapacity(typeof value === "number" ? value : null)
        }
        min={1}
      />

      {/* Antal sæder */}
      <NumberInput
        label="Antal sæder"
        placeholder="Fx 16"
        value={nrOfSeats ?? undefined}
        onChange={(value) =>
          setNrOfSeats(typeof value === "number" ? value : null)
        }
        min={1}
      />

      {/* Etage */}
      <NumberInput
        label="Etage"
        placeholder="Fx 1, 2, 3..."
        value={floor ?? undefined}
        onChange={(value) =>
          setFloor(typeof value === "number" ? value : null)
        }
        min={1}
      />

      {/* Faciliteter */}
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

        <Checkbox
          label="Lukket lokale"
          checked={isClosed}
          onChange={(e) => setIsClosed(e.currentTarget.checked)}
        />
      </div>

      {/* Submit-knap */}
      <Button loading={loading} onClick={handleSubmit}>
        Opret lokale
      </Button>
    </div>
  );
}
