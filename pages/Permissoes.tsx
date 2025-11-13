import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';

const permissionGroups = {
  'Gerenciar Projetos': ['Cadastrar', 'Editar', 'Excluir', 'Visualizar'],
  'Gerenciar Tarefas': ['Cadastrar', 'Editar', 'Excluir', 'Alterar Status', 'Gerenciar Kanban', 'Visualizar'],
  'Gerenciar Documentos': ['Cadastrar', 'Editar', 'Excluir', 'Baixar'],
  'Visualizar Relatórios': ['Todos', 'Projetos', 'Tarefas'],
  'Gerenciar Empresas': ['Cadastrar', 'Editar', 'Excluir'],
};

const allPermissionsList = Object.entries(permissionGroups).flatMap(([group, perms]) => 
  perms.map(p => `${group}.${p}`)
);

// Mock database
const initialUserPermissions: Record<string, string[]> = {
  'Ana Lúcia': [
    'Gerenciar Projetos.Cadastrar', 'Gerenciar Projetos.Editar', 'Gerenciar Projetos.Excluir', 'Gerenciar Projetos.Visualizar',
    'Gerenciar Tarefas.Cadastrar', 'Gerenciar Tarefas.Editar', 'Gerenciar Tarefas.Excluir', 'Gerenciar Tarefas.Alterar Status', 'Gerenciar Tarefas.Gerenciar Kanban', 'Gerenciar Tarefas.Visualizar',
    'Gerenciar Documentos.Cadastrar', 'Gerenciar Documentos.Editar', 'Gerenciar Documentos.Excluir', 'Gerenciar Documentos.Baixar',
    'Visualizar Relatórios.Todos', 'Visualizar Relatórios.Projetos', 'Visualizar Relatórios.Tarefas',
    'Gerenciar Empresas.Cadastrar', 'Gerenciar Empresas.Editar', 'Gerenciar Empresas.Excluir',
  ],
  'Bruno Costa': ['Gerenciar Projetos.Visualizar', 'Gerenciar Tarefas.Visualizar', 'Gerenciar Kanban', 'Visualizar Relatórios.Projetos'],
  'Carla Dias': ['Gerenciar Tarefas.Visualizar', 'Gerenciar Documentos.Baixar'],
};

const users = ['Ana Lúcia', 'Bruno Costa', 'Carla Dias'];


const PermissionGroup: React.FC<{ 
  title: string; 
  permissions: string[];
  checkedPermissions: Set<string>;
  onPermissionChange: (permission: string, isChecked: boolean) => void;
}> = ({ title, permissions, checkedPermissions, onPermissionChange }) => (
  <div className="bg-gray-50 p-4 rounded-lg h-full">
    <h3 className="font-bold text-gray-700 mb-3">{title}</h3>
    <div className="space-y-2">
      {permissions.map(permission => {
        const fullPermissionName = `${title}.${permission}`;
        return (
          <label key={permission} className="flex items-center">
            <input 
              type="checkbox" 
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
              checked={checkedPermissions.has(fullPermissionName)}
              onChange={(e) => onPermissionChange(fullPermissionName, e.target.checked)}
            />
            <span className="ml-2 text-sm text-gray-600">{permission}</span>
          </label>
        );
      })}
    </div>
  </div>
);

const Permissoes: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [currentUserPermissions, setCurrentUserPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedUser && initialUserPermissions[selectedUser]) {
      setCurrentUserPermissions(new Set(initialUserPermissions[selectedUser]));
    } else {
      setCurrentUserPermissions(new Set());
    }
  }, [selectedUser]);
  
  const handlePermissionChange = (permission: string, isChecked: boolean) => {
    const newPermissions = new Set(currentUserPermissions);
    if (isChecked) {
      newPermissions.add(permission);
    } else {
      newPermissions.delete(permission);
    }
    setCurrentUserPermissions(newPermissions);
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setCurrentUserPermissions(new Set(allPermissionsList));
    } else {
      setCurrentUserPermissions(new Set());
    }
  };

  const handleSave = () => {
    if (!selectedUser) {
      alert("Por favor, selecione um usuário.");
      return;
    }
    // Simulate saving to DB
    initialUserPermissions[selectedUser] = Array.from(currentUserPermissions);
    alert(`Permissões para ${selectedUser} foram salvas com sucesso!`);
  };

  const allChecked = currentUserPermissions.size === allPermissionsList.length;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Permissões</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar Usuário</label>
            <div className="relative">
                <select 
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Selecione um usuário...</option>
                    {users.map(user => <option key={user} value={user}>{user}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
        </div>
        
        {selectedUser && (
          <>
            <div className="mb-6 pb-6 border-b">
                 <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      name="all" 
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={allChecked}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-gray-800 font-medium">Todas</span>
                </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {Object.entries(permissionGroups).map(([title, permissions]) => (
                  <PermissionGroup 
                    key={title}
                    title={title} 
                    permissions={permissions} 
                    checkedPermissions={currentUserPermissions}
                    onPermissionChange={handlePermissionChange}
                  />
                ))}
            </div>

            <div className="mt-8 pt-6 border-t flex justify-end">
              <button 
                onClick={handleSave}
                disabled={!selectedUser}
                className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Permissoes;