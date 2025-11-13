import React, { useState } from 'react';
import { SearchIcon } from '../components/icons/SearchIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import Modal from '../components/Modal';

const initialUserRoles = [
  'Gerente de Projetos',
  'Desenvolvedor Front-end',
  'Desenvolvedor Back-end',
  'Designer UI/UX',
  'Analista de Qualidade (QA)',
  'Analista de DevOps',
];

const CargosUsuario: React.FC = () => {
  const [roles, setRoles] = useState(initialUserRoles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoleName.trim()) {
      setRoles([...roles, newRoleName.trim()]);
      setNewRoleName('');
      setIsModalOpen(false);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Cargos</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cargo..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              + Novo Cargo
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <ul>
            {filteredRoles.map((role, index) => (
              <li
                key={role}
                className={`flex justify-between items-center py-4 ${index < filteredRoles.length - 1 ? 'border-b border-gray-200' : ''}`}
              >
                <span className="text-gray-700">{role}</span>
                <div className="flex items-center space-x-4">
                  <button className="text-gray-500 hover:text-blue-600">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button className="text-gray-500 hover:text-red-600">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Novo Cargo"
      >
        <form onSubmit={handleAddNewRole}>
          <div className="mb-4">
            <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cargo
            </label>
            <input
              type="text"
              id="roleName"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mr-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default CargosUsuario;