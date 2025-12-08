"use client";

// Overlay til bekræftelse af sletning af et lokale

import { Modal, Text, Button, Stack, Group } from "@mantine/core";

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
  return (
    <Modal opened={opened} onClose={onClose} title="Slet lokale" centered>
      <Stack gap="md">
        <Text c="red" fw={600}>
          Er du sikker på, at du vil slette dette lokale?
        </Text>

        <Text>
          <b>Lokale:</b> {room?.room_name}
        </Text>

        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={onClose}>
            Annuller
          </Button>

          <Button color="red" onClick={onConfirm}>
            Slet lokale
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
