import React, { useEffect } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { XIcon } from './icons/XIcon';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = 'fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-lg flex items-center transition-opacity duration-300';
  const typeClasses = {
    success: 'bg-green-100 border-l-4 border-green-500 text-green-800',
    error: 'bg-red-100 border-l-4 border-red-500 text-red-800',
  };
  const Icon = type === 'success' ? CheckCircleIcon : ExclamationCircleIcon;

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <Icon className="h-6 w-6 mr-3 flex-shrink-0" />
      <span className="flex-grow text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-black/10">
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Notification;
