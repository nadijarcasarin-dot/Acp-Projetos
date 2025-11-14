import React from 'react';
import Modal from './Modal';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="text-center">
        <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
        <div className="mt-4 text-gray-600">{message}</div>
      </div>
      <div className="flex justify-center items-stretch space-x-4 mt-6 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
        >
          Confirmar Exclusão
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
