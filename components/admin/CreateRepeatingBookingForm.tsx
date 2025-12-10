// Component for creating repeating bookings - Admin only

"use client";

import {
  Card,
  TextInput,
  Button,
  Select,
  Group,
  Text,
  Stack,
  Checkbox,
  Alert,
} from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import type { Room } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { createClient } from "@supabase/supabase-js";
import { generateRecurrenceDates, createBookingsFromRecurrence } from "@/utils/repeatingBookingHelpers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 16;

type CreateRepeatingBookingFormProps = {
  onSuccess: () => void;
  rooms?: any[];
  bookings?: any[];
};

function normalizeType(type: string | null): string | null {
  if (!type) return null;
  return type === "møderum" ? "studierum" : type;
}

export default function CreateRepeatingBookingForm({
  onSuccess,
  rooms = [],
  bookings = [],
}: CreateRepeatingBookingFormProps) {
  const { user, role } = useAuth();
  const { t } = useTranslation();

  const [roomId, setRoomId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [chosenDate, setChosenDate] = useState<string | null>(dayjs().format("YYYY-MM-DD"));
  const [startTime, setStartTime] = useState<Date>(
    dayjs().hour(8).minute(0).toDate()
  );
  const [endTime, setEndTime] = useState<Date>(
    dayjs().hour(10).minute(0).toDate()
  );
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "biweekly" | "monthly">("weekly");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string | null>(
    dayjs().add(1, "month").format("YYYY-MM-DD")
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize roomId with first available room
  useEffect(() => {
    if (rooms.length > 0 && !roomId) {
      setRoomId(rooms[0].id);
    }
  }, [rooms, roomId]);

  // Allowed room types for admin
  const allowedRoomsForDropdown = rooms;

  // Combine date and time
  function combine(dateStr: string | null, time: Date): Date {
    if (!dateStr) return new Date();
    return dayjs(dateStr)
      .hour(dayjs(time).hour())
      .minute(dayjs(time).minute())
      .second(0)
      .toDate();
  }

  // Validate form
  function validate(): string | null {
    if (!roomId) return "Vælg venligst et lokale";
    if (!title) return "Indtast venligst en titel";
    if (!chosenDate) return "Vælg venligst en startdato";
    if (!recurrenceEndDate) return "Vælg venligst en slutdato";

    const finalStart = combine(chosenDate, startTime);
    const finalEnd = combine(chosenDate, endTime);

    if (finalEnd <= finalStart) {
      return "Sluttidspunktet skal være efter starttidspunktet";
    }

    // Check opening hours
    const startHour =
      dayjs(finalStart).hour() + dayjs(finalStart).minute() / 60;
    const endHour = dayjs(finalEnd).hour() + dayjs(finalEnd).minute() / 60;

    if (startHour < DAY_START_HOUR || endHour > DAY_END_HOUR) {
      return `Booking skal være mellem ${DAY_START_HOUR}:00 og ${DAY_END_HOUR}:00`;
    }

    // Check that end date is after start date
    if (dayjs(recurrenceEndDate).isBefore(dayjs(chosenDate), "day")) {
      return "Slutdatoen skal være efter startdatoen";
    }

    return null;
  }

  // Handle submission
  async function handleSubmit() {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      const err = validate();
      if (err) {
        setErrorMessage(err);
        return;
      }

      setIsLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData.user;

      if (!currentUser) {
        setErrorMessage("Du skal være logget ind");
        return;
      }

      const finalStart = combine(chosenDate, startTime);
      const finalEnd = combine(chosenDate, endTime);

      // Create the repeating booking record
      const { data: repeatingData, error: repeatingError } = await supabase
        .from("repeating_bookings")
        .insert({
          room_id: roomId,
          title: title,
          start_time: dayjs(finalStart).format("HH:mm:ss"),
          end_time: dayjs(finalEnd).format("HH:mm:ss"),
          recurrence_type: recurrenceType,
          recurrence_end_date: dayjs(recurrenceEndDate).format("YYYY-MM-DD"),
          is_active: true,
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (repeatingError) {
        console.error("REPEATING BOOKING ERROR:", repeatingError);
        setErrorMessage("Fejl ved oprettelse af tilbagevendende booking");
        return;
      }

      // Generate individual bookings
      const recurrenceDates = generateRecurrenceDates(
        finalStart,
        recurrenceEndDate ? dayjs(recurrenceEndDate, "DD-MM-YYYY").toDate() : dayjs().add(1, "month").toDate(),
        recurrenceType
      );

      // Only create bookings that don't conflict and are on weekdays
      const validDates = recurrenceDates.filter((date) => {
        const dayOfWeek = dayjs(date).day();
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) return false;

        // Check for conflicts
        const bookingStart = dayjs(date)
          .hour(finalStart.getHours())
          .minute(finalStart.getMinutes())
          .toDate();
        const bookingEnd = dayjs(date)
          .hour(finalEnd.getHours())
          .minute(finalEnd.getMinutes())
          .toDate();

        return !bookings.some((b) => {
          if (b.room_id !== roomId) return false;
          const bS = new Date(b.start_time).getTime();
          const bE = new Date(b.end_time).getTime();
          const s = bookingStart.getTime();
          const e = bookingEnd.getTime();
          return s < bE && e > bS;
        });
      });

      const bookingsToCreate = createBookingsFromRecurrence(
        validDates,
        finalStart,
        finalEnd,
        roomId,
        title,
        currentUser.id,
        repeatingData.id
      );

      // Insert all individual bookings
      if (bookingsToCreate.length > 0) {
        const { error: bookingsError } = await supabase
          .from("bookings")
          .insert(bookingsToCreate);

        if (bookingsError) {
          console.error("BOOKINGS INSERT ERROR:", bookingsError);
          setErrorMessage("Fejl ved oprettelse af individuelle bookinger");
          return;
        }
      }

      setSuccessMessage(
        `Tilbagevendende booking oprettet! ${bookingsToCreate.length} bookinger genereret.`
      );

      // Reset form
      setTitle("");
      setChosenDate(dayjs().format("YYYY-MM-DD"));
      setStartTime(dayjs().hour(8).minute(0).toDate());
      setEndTime(dayjs().hour(10).minute(0).toDate());
      setRecurrenceType("weekly");
      setRecurrenceEndDate(dayjs().add(1, "month").format("YYYY-MM-DD"));

      // Call success callback
      onSuccess();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("RAW ERROR:", err);
      setErrorMessage("En uventet fejl opstod");
    } finally {
      setIsLoading(false);
    }
  }

  const isDisabled = !!validate() || isLoading;

  return (
    <Card withBorder padding="lg" className="bg-white border-secondary-200">
      <Text fw={600} size="lg" className="mb-4 text-main">
        Opret tilbagevendende booking
      </Text>

      <Stack gap="md">
        {errorMessage && (
          <Alert color="red" title="Fejl">
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert color="green" title="Succes">
            {successMessage}
          </Alert>
        )}

        <Select
          label="Lokale"
          data={allowedRoomsForDropdown.map((r) => ({
            value: r.id,
            label: r.room_name,
          }))}
          value={roomId}
          onChange={(val) => {
            setRoomId(val || "");
            setErrorMessage(null);
          }}
        />

        <TextInput
          label="Titel"
          placeholder="f.eks. Matematik gruppe 1"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrorMessage(null);
          }}
        />

        <DatePickerInput
          label="Startdato"
          value={chosenDate}
          valueFormat="DD-MM-YYYY"
          onChange={(value) => {
            setChosenDate(value);
            setErrorMessage(null);
          }}
        />

        <Group grow>
          <TimeInput
            label="Starttidspunkt"
            value={dayjs(startTime).format("HH:mm")}
            onChange={(event) => {
              const [h, m] = event.currentTarget.value.split(":");
              setStartTime(dayjs(startTime).hour(+h).minute(+m).toDate());
              setErrorMessage(null);
            }}
          />

          <TimeInput
            label="Sluttidspunkt"
            value={dayjs(endTime).format("HH:mm")}
            onChange={(event) => {
              const [h, m] = event.currentTarget.value.split(":");
              setEndTime(dayjs(endTime).hour(+h).minute(+m).toDate());
              setErrorMessage(null);
            }}
          />
        </Group>

        <Select
          label="Gentagelsestype"
          data={[
            { value: "daily", label: "Dagligt" },
            { value: "weekly", label: "Ugentligt" },
            { value: "biweekly", label: "Hver anden uge" },
            { value: "monthly", label: "Månedligt" },
          ]}
          value={recurrenceType}
          onChange={(val) => {
            if (val) setRecurrenceType(val as "daily" | "weekly" | "biweekly" | "monthly");
          }}
        />

        <DatePickerInput
          label="Slutdato for gentagelse"
          value={recurrenceEndDate}
          valueFormat="DD-MM-YYYY"
          onChange={(value) => {
            setRecurrenceEndDate(value);
            setErrorMessage(null);
          }}
        />

        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={isDisabled}
          loading={isLoading}
        >
          Opret tilbagevendende booking
        </Button>
      </Stack>
    </Card>
  );
}
