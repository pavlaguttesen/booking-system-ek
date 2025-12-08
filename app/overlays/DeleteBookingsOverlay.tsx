"use client";

import { Modal, Text, Button, Stack, Group } from "@mantine/core";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

type DeleteBookingOverlayProps = {
  opened: boolean;
  onClose: () => void;
  booking: any;
  room: any;
  profile: any;
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
  const { t } = useTranslation();
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  return (
    <Modal opened={opened} onClose={onClose} centered title={null}>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 cursor-pointer transition"
      >
        <FontAwesomeIcon icon={faCircleXmark} className="text-2xl" />
      </button>

      <Stack gap="md" className="mt-2">
        <Text size="xl" fw={700}>
          {t("booking.deletebooking")}
        </Text>

        <Text size="sm" c="red" fw={600}>
          {t("booking.deletethisbooking")}
        </Text>

        <Stack gap={4}>
          <Text>
            <b>{t("booking.title")}:</b> {booking.title || t("booking.notitle")}
          </Text>

          <Text>
            <b>{t("booking.room")}:</b> {room?.room_name ?? t("booking.unknownroom")}
          </Text>

          <Text>
            <b>{t("admin.user")}:</b> {profile?.full_name ?? t("unknown.unknownUser")}
          </Text>

          <Text>
            <b>{t("booking.date")}:</b> {start.toLocaleDateString("da-DK")}
          </Text>

          <Text>
            <b>{t("booking.time")}:</b>{" "}
            {start.toLocaleTimeString("da-DK", { timeStyle: "short" })}
            {" – "}
            {end.toLocaleTimeString("da-DK", { timeStyle: "short" })}
          </Text>
        </Stack>

        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={onClose}>
            {t("common.cancel")}
          </Button>

          <Button color="red" onClick={onConfirm}>
            {t("booking.deletebooking")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
