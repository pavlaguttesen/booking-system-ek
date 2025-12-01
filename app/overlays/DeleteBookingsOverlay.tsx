"use client";

import { Modal, Text, Button, Stack, Group } from "@mantine/core";
import dayjs from "dayjs";
import type { Booking, Room, Profile } from "@/context/BookingContext";

type DeleteBookingOverlayProps = {
  opened: boolean;
  onClose: () => void;
  booking: Booking;
  room: Room | null;
  profile: Profile | null;
  onConfirm: () => void;
};

export function DeleteBookingOverlay({
  opened,
  onClose,
  booking,
  room,
  profile,
  onConfirm,
}: DeleteBookingOverlayProps) {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  return (
    <Modal opened={opened} onClose={onClose} title="Slet booking" centered>
      <Stack gap="md">

        <Text size="sm" c="red" fw={600}>
          Er du sikker på at du vil slette denne booking?
        </Text>

        <Stack gap={4}>
          <Text>
            <b>Titel:</b> {booking.title || "(ingen titel)"}
          </Text>
          <Text>
            <b>Lokale:</b> {room?.room_name ?? "Ukendt"}
          </Text>
          <Text>
            <b>Booker:</b> {profile?.full_name ?? "Ukendt bruger"}
          </Text>
          <Text>
            <b>Dato:</b>{" "}
            {start.toLocaleDateString("da-DK", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </Text>
          <Text>
            <b>Tid:</b>{" "}
            {start.toLocaleTimeString("da-DK", { timeStyle: "short" })} –{" "}
            {end.toLocaleTimeString("da-DK", { timeStyle: "short" })}
          </Text>
        </Stack>

        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={onClose}>
            Annuller
          </Button>

          <Button color="red" onClick={onConfirm}>
            Slet booking
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
