// Komponent til oprettelse af tilbagevendende bookinger - Kun admin

"use client";

import {
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

  // Initialiser roomId med første tilgængelige lokale
  useEffect(() => {
    if (rooms.length > 0 && !roomId) {
      setRoomId(rooms[0].id);
    }
  }, [rooms, roomId]);

  // Tilladte lokaltyper for admin
  const allowedRoomsForDropdown = rooms;

  // Kombiner dato og tid
  function combine(dateStr: string | null, time: Date): Date {
    if (!dateStr) return new Date();
    return dayjs(dateStr)
      .hour(dayjs(time).hour())
      .minute(dayjs(time).minute())
      .second(0)
      .toDate();
  }

  // Validér formularen
  function validate(): string | null {
    if (!roomId) return t("validation.selectRoom");
    if (!title) return t("validation.enterTitle");
    if (!chosenDate) return t("validation.selectStartDate");
    if (!recurrenceEndDate) return t("validation.selectEndDate");

    const finalStart = combine(chosenDate, startTime);
    const finalEnd = combine(chosenDate, endTime);

    if (finalEnd <= finalStart) {
      return t("validation.endTimeBeforeStart");
    }

    // Tjek åbningstid
    const startHour =
      dayjs(finalStart).hour() + dayjs(finalStart).minute() / 60;
    const endHour = dayjs(finalEnd).hour() + dayjs(finalEnd).minute() / 60;

    if (startHour < DAY_START_HOUR || endHour > DAY_END_HOUR) {
      return t("validation.bookingOutsideHours", { returnObjects: false }).replace("{0}", DAY_START_HOUR.toString()).replace("{1}", DAY_END_HOUR.toString());
    }

    // Tjek at slutdatoen er efter startdatoen
    if (dayjs(recurrenceEndDate).isBefore(dayjs(chosenDate), "day")) {
      return t("validation.endDateBeforeStart");
    }

    return null;
  }

  // Håndter indsendelse
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
        setErrorMessage(t("booking.mustBeLoggedIn"));
        return;
      }

      const finalStart = combine(chosenDate, startTime);
      const finalEnd = combine(chosenDate, endTime);

      // Opret tilbagevendende booking-post
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
        setErrorMessage(t("repeatingBooking.repeatingBookingError"));
        return;
      }

      // Generer individuelle bookinger
      const recurrenceDates = generateRecurrenceDates(
        finalStart,
        recurrenceEndDate ? dayjs(recurrenceEndDate, "DD-MM-YYYY").toDate() : dayjs().add(1, "month").toDate(),
        recurrenceType
      );

      // Opret kun bookinger uden konflikter og på hverdage
      const validDates = recurrenceDates.filter((date) => {
        const dayOfWeek = dayjs(date).day();
        // Spring weekender over (0 = Søndag, 6 = Lørdag)
        if (dayOfWeek === 0 || dayOfWeek === 6) return false;

        // Tjek for konflikter
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

      // Indsæt alle individuelle bookinger
      if (bookingsToCreate.length > 0) {
        const { error: bookingsError } = await supabase
          .from("bookings")
          .insert(bookingsToCreate);

        if (bookingsError) {
          console.error("BOOKINGS INSERT ERROR:", bookingsError);
          setErrorMessage(t("repeatingBooking.bookingsCreationError"));
          return;
        }
      }

      setSuccessMessage(
        `${t("repeatingBooking.successMessage")} ${bookingsToCreate.length} ${bookingsToCreate.length === 1 ? "booking" : "bookinger"} ${t("repeatingBooking.generated")}.`
      );

      // Nulstil formularen
      setTitle("");
      setChosenDate(dayjs().format("YYYY-MM-DD"));
      setStartTime(dayjs().hour(8).minute(0).toDate());
      setEndTime(dayjs().hour(10).minute(0).toDate());
      setRecurrenceType("weekly");
      setRecurrenceEndDate(dayjs().add(1, "month").format("YYYY-MM-DD"));

      // Kald success callback
      onSuccess();

      // Ryd succesbeskeden efter 3 sekunder
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("RAW ERROR:", err);
      setErrorMessage(t("ErrorMsg.generalError"));
    } finally {
      setIsLoading(false);
    }
  }

  const isDisabled = !!validate() || isLoading;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
      <Text fw={600} size="lg" className="mb-4 text-black">
        {t("repeatingBooking.title")}
      </Text>

      <Stack gap="md">
        {errorMessage && (
          <Alert color="red" title={t("repeatingBooking.errorTitle")}>
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert color="green" title={t("repeatingBooking.successTitle")}>
            {successMessage}
          </Alert>
        )}

        <Select
          label={t("repeatingBooking.roomLabel")}
          data={allowedRoomsForDropdown
            .sort((a, b) => a.room_name.localeCompare(b.room_name, "da"))
            .map((r) => ({
              value: r.id,
              label: r.room_name,
            }))}
          value={roomId}
          onChange={(val) => {
            setRoomId(val || "");
            setErrorMessage(null);
          }}
          styles={{
            label: {
              color: "#000000",
            }
          }}
        />

        <TextInput
          label={t("repeatingBooking.titleLabel")}
          placeholder={t("repeatingBooking.titlePlaceholder")}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrorMessage(null);
          }}
          styles={{
            label: {
              color: "#000000",
            }
          }}
        />

        <DatePickerInput
          label={t("repeatingBooking.startDateLabel")}
          value={chosenDate}
          valueFormat="DD-MM-YYYY"
          onChange={(value) => {
            setChosenDate(value);
            setErrorMessage(null);
          }}
          styles={{
            label: {
              color: "#000000",
            }
          }}
        />

        <Group grow>
          <TimeInput
            label={t("repeatingBooking.startTimeLabel")}
            value={dayjs(startTime).format("HH:mm")}
            onChange={(event) => {
              const [h, m] = event.currentTarget.value.split(":");
              setStartTime(dayjs(startTime).hour(+h).minute(+m).toDate());
              setErrorMessage(null);
            }}
            styles={{
              label: {
                color: "#000000",
              }
            }}
          />

          <TimeInput
            label={t("repeatingBooking.endTimeLabel")}
            value={dayjs(endTime).format("HH:mm")}
            onChange={(event) => {
              const [h, m] = event.currentTarget.value.split(":");
              setEndTime(dayjs(endTime).hour(+h).minute(+m).toDate());
              setErrorMessage(null);
            }}
            styles={{
              label: {
                color: "#000000",
              }
            }}
          />
        </Group>

        <Select
          label={t("repeatingBooking.recurrenceTypeLabel")}
          data={[
            { value: "daily", label: t("repeatingBooking.recurrenceTypeDaily") },
            { value: "weekly", label: t("repeatingBooking.recurrenceTypeWeekly") },
            { value: "biweekly", label: t("repeatingBooking.recurrenceTypeBiweekly") },
            { value: "monthly", label: t("repeatingBooking.recurrenceTypeMonthly") },
          ]}
          value={recurrenceType}
          onChange={(val) => {
            if (val) setRecurrenceType(val as "daily" | "weekly" | "biweekly" | "monthly");
          }}
          styles={{
            label: {
              color: "#000000",
            }
          }}
        />

        <DatePickerInput
          label={t("repeatingBooking.recurrenceEndDateLabel")}
          value={recurrenceEndDate}
          valueFormat="DD-MM-YYYY"
          onChange={(value) => {
            setRecurrenceEndDate(value);
            setErrorMessage(null);
          }}
          styles={{
            label: {
              color: "#000000",
            }
          }}
        />

        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={isDisabled}
          loading={isLoading}
        >
          {t("repeatingBooking.createButton")}
        </Button>
      </Stack>
    </div>
  );
}
