
import React, { useContext } from 'react';
import { MenuAlt1Icon } from './icons/MenuAlt1Icon';
import { AuthContext } from '../contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { userProfile } = useContext(AuthContext);

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
          <p className="font-semibold text-gray-800">{userProfile?.full_name || 'Usuário'}</p>
          <p className="text-sm text-gray-500">{userProfile?.job_titles?.name || 'Cargo'}</p>
        </div>
        <img
          className="h-12 w-12 rounded-full object-cover"
          src={userProfile?.avatar_url || `https://i.pravatar.cc/150?u=${userProfile?.id}`}
          alt="User avatar"
        />
      </div>
    </header>
  );
};

export default Header;