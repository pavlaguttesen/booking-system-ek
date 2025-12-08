"use client";

// Overlay til bekræftelse af sletning af et lokale

import { Modal, Text, Button, Stack, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";

type DeleteRoomOverlayProps = {
  opened: boolean;
  onClose: () => void;
  room: any;
  onConfirm: () => void; // kaldes når admin bekræfter sletning
};

export default function DeleteRoomOverlay({
  opened,
  onClose,
  room,
  onConfirm,
}: DeleteRoomOverlayProps) {
  const { t } = useTranslation();
  return (
    <Modal opened={opened} onClose={onClose} title={t("admin.deleteRoom")} centered>
      <Stack gap="md">
        <Text c="red" fw={600}>
          {t("admin.deleteRoomText")}
        </Text>

        <Text>
          <b>{t("booking.room")}:</b> {room?.room_name}
        </Text>

        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={onClose}>
            {t("common.cancel")}
          </Button>

          <Button color="red" onClick={onConfirm}>
            {t("admin.deleteRoom")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
