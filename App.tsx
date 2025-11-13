import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PlaceholderPage from './pages/PlaceholderPage';
import type { Page } from './types';
import TiposNiveisUsuario from './pages/TiposNiveisUsuario';
import Usuarios from './pages/Usuarios';
import CargosUsuario from './pages/CargosUsuario';
import Documentos from './pages/Documentos';
import Empresas from './pages/Empresas';
import Projetos from './pages/Projetos';
import Tarefas from './pages/Tarefas';
import Notificacoes from './pages/Notificacoes';
import Dashboard from './pages/Dashboard';
import Permissoes from './pages/Permissoes';
import Kanban from './pages/Kanban';
import Relatorios from './pages/Relatorios';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Projetos':
        return <Projetos />;
      case 'Tipos/Nível de Usuários':
        return <TiposNiveisUsuario />;
      case 'Usuários':
        return <Usuarios />;
      case 'Cargos de Usuário':
        return <CargosUsuario />;
      case 'Documentos':
        return <Documentos />;
      case 'Empresas':
        return <Empresas />;
      case 'Tarefas':
        return <Tarefas />;
      case 'Notificações':
        return <Notificacoes />;
      case 'Permissões':
        return <Permissoes />;
      case 'Kanban de Tarefas':
        return <Kanban />;
      case 'Relatórios':
        return <Relatorios />;
      case 'Configurações':
      case 'Sair':
        return <PlaceholderPage title={activePage} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isCollapsed={isSidebarCollapsed} 
      />
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
