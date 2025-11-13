import React from 'react';
import { MenuAlt1Icon } from './icons/MenuAlt1Icon';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="flex justify-between items-center p-4">
      <button 
        onClick={onToggleSidebar} 
        className="text-gray-500 hover:text-gray-800 focus:outline-none"
        aria-label="Toggle sidebar"
      >
        <MenuAlt1Icon className="h-6 w-6" />
      </button>
      <div className="flex items-center">
        <div className="text-right mr-4">
          <p className="font-semibold text-gray-800">Ana Lúcia</p>
          <p className="text-sm text-gray-500">Gerente de Projetos</p>
        </div>
        <img
          className="h-12 w-12 rounded-full object-cover"
          src="https://picsum.photos/id/433/100/100"
          alt="User avatar"
        />
      </div>
    </header>
  );
};

export default Header;
