// Modal til visning af fejlmeddelelser. Vises når der sker en fejl i bookingprocessen.

"use client";

import { Modal, Button, Text, Stack } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

type ErrorOverlayProps = {
  opened: boolean;
  onClose: () => void;
  title: string;
  message: string;
};

export function ErrorOverlay({
  opened,
  onClose,
  title,
  message,
}: ErrorOverlayProps) {
  const { t } = useTranslation();
  return (
    <Modal opened={opened} onClose={onClose} centered title={null} radius="md">
      {/* LUK KNAP */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 cursor-pointer transition"
      >
        <FontAwesomeIcon icon={faCircleXmark} className="text-2xl" />
      </button>

      <Stack gap="md" className="text-center px-6 py-4 mt-2">
        <Text fw={700} size="xl">
          {title}
        </Text>

        <Text size="md">{message}</Text>

        <Button onClick={onClose} mt="sm" fullWidth>
          {t("booking.back")}
        </Button>
      </Stack>
    </Modal>
  );
}
