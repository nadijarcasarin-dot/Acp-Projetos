import React from 'react';
import type { Page, NavItem } from '../types';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { UsersIcon } from './icons/UsersIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { FolderIcon } from './icons/FolderIcon';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';
import { ViewBoardsIcon } from './icons/ViewBoardsIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { BellIcon } from './icons/BellIcon';
import { PresentationChartLineIcon } from './icons/PresentationChartLineIcon';
import { CogIcon } from './icons/CogIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';


const mainNavItems: NavItem[] = [
  { name: 'Dashboard', icon: ChartBarIcon },
  { name: 'Tipos/Nível de Usuários', icon: UserGroupIcon },
  { name: 'Usuários', icon: UsersIcon },
  { name: 'Cargos de Usuário', icon: BriefcaseIcon },
  { name: 'Empresas', icon: BuildingOfficeIcon },
  { name: 'Permissões', icon: ShieldCheckIcon },
  { name: 'Projetos', icon: FolderIcon },
  { name: 'Tarefas', icon: ClipboardCheckIcon },
  { name: 'Kanban de Tarefas', icon: ViewBoardsIcon },
  { name: 'Documentos', icon: DocumentTextIcon },
  { name: 'Notificações', icon: BellIcon },
  { name: 'Relatórios', icon: PresentationChartLineIcon },
];

const footerNavItems: NavItem[] = [
  { name: 'Configurações', icon: CogIcon },
  { name: 'Sair', icon: LogoutIcon },
];

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isCollapsed }) => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, page: Page) => {
    e.preventDefault();
    setActivePage(page);
  };

  return (
    <div className={`bg-[#100956] text-gray-300 flex flex-col h-screen fixed transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center h-20 border-b border-white/20 px-4 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
        <FolderIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
        {!isCollapsed && <h1 className="text-2xl font-bold ml-2 text-white whitespace-nowrap">Acp-Projetos</h1>}
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {mainNavItems.map((item) => (
          <a
            key={item.name}
            href="#"
            onClick={(e) => handleNavClick(e, item.name)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              activePage === item.name
                ? 'bg-blue-700 text-white'
                : 'hover:bg-white/10 hover:text-white'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className={`h-5 w-5 flex-shrink-0 ${!isCollapsed && 'mr-3'}`} />
            {!isCollapsed && item.name}
          </a>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/20">
        <div className={`flex items-center mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
            <img src="https://picsum.photos/id/433/100/100" alt="User Avatar" className="h-10 w-10 rounded-full flex-shrink-0" />
            {!isCollapsed && (
              <div className="ml-3">
                  <p className="text-sm font-medium text-white whitespace-nowrap">Ana Lúcia</p>
                  <p className="text-xs text-gray-400 whitespace-nowrap">Gerente de Projetos</p>
              </div>
            )}
        </div>
        <div className="space-y-2">
            {footerNavItems.map((item) => (
            <a
                key={item.name}
                href="#"
                onClick={(e) => handleNavClick(e, item.name)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activePage === item.name
                    ? 'bg-blue-700 text-white'
                    : 'hover:bg-white/10 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.name : undefined}
            >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${!isCollapsed && 'mr-3'}`} />
                {!isCollapsed && item.name}
            </a>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;