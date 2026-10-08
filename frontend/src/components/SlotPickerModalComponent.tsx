import { X } from 'lucide-react';
import { Modal } from './ModalComponent';
import { Button } from './ButtonComponent';
import { AvailableSlots } from './AvailableSlotsComponent';
import type { AvailableSlot } from '../types/availabilityType';

interface SlotPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateLabel: string;
  slots: AvailableSlot[];
  isLoading: boolean;
  error: string | null;
  selectedSlot: AvailableSlot | null;
  onSelectSlot: (slot: AvailableSlot) => void;
  onConfirm: () => void;
}

export function SlotPickerModal({
  isOpen,
  onClose,
  dateLabel,
  slots,
  isLoading,
  error,
  selectedSlot,
  onSelectSlot,
  onConfirm
}: SlotPickerModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-0 top-0 cursor-pointer border-none bg-transparent text-(--text) hover:text-(--accent)"
        >
          <X size={20} />
        </button>

        <h2 className="m-0 text-center text-(--text-h)">Horarios disponibles</h2>
        <p className="mb-6 mt-1 text-center capitalize text-(--text)">{dateLabel}</p>

        <AvailableSlots
          slots={slots}
          isLoading={isLoading}
          error={error}
          selectedSlot={selectedSlot}
          onSelectSlot={onSelectSlot}
        />

        <Button
          type="button"
          className="mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50 mb-6"
          disabled={!selectedSlot}
          onClick={onConfirm}
        >
          Seleccionar horario
        </Button>
      </div>
    </Modal>
  );
}
