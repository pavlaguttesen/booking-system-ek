"use client";

import { Modal, Button, Text, Stack } from "@mantine/core";

export function ErrorOverlay({
  opened,
  onClose,
  title,
  message,
}: {
  opened: boolean;
  onClose: () => void;
  title: string;
  message: string;
}) {
  return (
    <Modal opened={opened} onClose={onClose} centered radius="md">
      <Stack gap="md" className="text-center px-6 py-4">
        <Text fw={700} size="xl">
          {title}
        </Text>

        <Text size="md">{message}</Text>

        <Button onClick={onClose} mt="sm" fullWidth>
          Tilbage
        </Button>
      </Stack>
    </Modal>
  );
}
