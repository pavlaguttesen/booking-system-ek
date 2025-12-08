// Modal til valg af ledigt lokale fra en liste når der er flere muligheder.

"use client";

import { Modal, Button } from "@mantine/core";
import { useTranslation } from "react-i18next";

type SelectRoomOverlayProps = {
  opened: boolean;
  onClose: () => void;
  rooms: { id: string; room_name: string; capacity: number | null }[];
  start: Date;
  end: Date;
  onSelect: (roomId: string) => void;
};

export function SelectRoomOverlay({
  opened,
  onClose,
  rooms,
  start,
  end,
  onSelect,
}: SelectRoomOverlayProps) {
  const { t } = useTranslation();
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("booking.selectroom")}
      centered
    >
      <div className="space-y-3">
        {rooms.length === 0 && (
          <p className="text-center text-main">{t("admin.lookforroom")}</p>
        )}

        {rooms.map((r) => (
          <Button
            key={r.id}
            fullWidth
            className="bg-primary-600 hover:bg-primary-700 text-invert"
            onClick={() => onSelect(r.id)}
          >
            {r.room_name} ({t("admin.capacity")}: {r.capacity ?? t("booking.unknownroom")})
          </Button>
        ))}
      </div>
    </Modal>
  );
}
