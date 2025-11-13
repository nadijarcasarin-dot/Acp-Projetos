import React, { useState } from 'react';
import { SearchIcon } from '../components/icons/SearchIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import Modal from '../components/Modal';

const initialUserLevels = [
  'Administrador',
  'Gerente de Projetos',
  'Membro da Equipe',
  'Cliente',
  'Visualizador',
];

const TiposNiveisUsuario: React.FC = () => {
  const [levels, setLevels] = useState(initialUserLevels);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddNewLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLevelName.trim()) {
      setLevels([...levels, newLevelName.trim()]);
      setNewLevelName('');
      setIsModalOpen(false);
    }
  };

  const filteredLevels = levels.filter(level =>
    level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Tipos/Níveis de Usuário</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar nível..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
              + Novo Nível
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <ul>
            {filteredLevels.map((level, index) => (
              <li
                key={level}
                className={`flex justify-between items-center py-4 ${index < filteredLevels.length - 1 ? 'border-b border-gray-200' : ''}`}
              >
                <span className="text-gray-700">{level}</span>
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
        title="Adicionar Novo Nível"
      >
        <form onSubmit={handleAddNewLevel}>
          <div className="mb-4">
            <label htmlFor="levelName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Nível
            </label>
            <input
              type="text"
              id="levelName"
              value={newLevelName}
              onChange={(e) => setNewLevelName(e.target.value)}
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

export default TiposNiveisUsuario;