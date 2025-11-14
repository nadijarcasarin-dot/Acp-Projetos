import React, { useState, useEffect } from 'react';
import { SearchIcon } from '../components/icons/SearchIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';
import { supabase } from '../lib/supabaseClient';

interface UserLevel {
  id: number;
  name: string;
}

const emptyLevel: Partial<UserLevel> = { name: '' };

const TiposNiveisUsuario: React.FC = () => {
  const [levels, setLevels] = useState<UserLevel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<UserLevel | null>(null);
  const [currentLevel, setCurrentLevel] = useState<Partial<UserLevel>>(emptyLevel);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const fetchLevels = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setLevels(data || []);
    } catch (error: any) {
      setError(`Failed to fetch data: ${error.message}`);
      console.error("Error fetching user levels:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const openModalForNew = () => {
    setCurrentLevel(emptyLevel);
    setIsEditing(false);
    setIsModalOpen(true);
  };
  
  const openModalForEdit = (level: UserLevel) => {
    setCurrentLevel(level);
    setIsEditing(true);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLevel(emptyLevel);
    setIsEditing(false);
    setError(null);
  };

  const openDeleteModal = (level: UserLevel) => {
    setLevelToDelete(level);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentLevel(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name } = currentLevel;

    if (name?.trim()) {
      let query;
      const levelData = { name: name.trim() };

      if (isEditing) {
        query = supabase.from('user_levels').update(levelData).eq('id', currentLevel.id);
      } else {
        query = supabase.from('user_levels').insert([levelData]);
      }
      
      const { error: queryError } = await query;
      if (queryError) {
        setError(queryError.message);
      } else {
        closeModal();
        await fetchLevels();
        setNotification({ type: 'success', message: `Nível ${isEditing ? 'atualizado' : 'criado'} com sucesso!` });
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!levelToDelete) return;

    const { error: deleteError } = await supabase
      .from('user_levels')
      .delete()
      .eq('id', levelToDelete.id);

    setIsDeleteModalOpen(false);

    if (deleteError) {
      const friendlyMessage = deleteError.message.includes('foreign key constraint')
        ? "Não é possível excluir: este nível está em uso por um ou mais usuários."
        : `Erro ao excluir: ${deleteError.message}`;
      setNotification({ type: 'error', message: friendlyMessage });
    } else {
      setNotification({ type: 'success', message: 'Nível excluído com sucesso!' });
      setLevels(prevLevels => prevLevels.filter(l => l.id !== levelToDelete.id));
    }
    setLevelToDelete(null);
  };

  const filteredLevels = levels.filter(level =>
    typeof level.name === 'string' && level.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
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
              onClick={openModalForNew}
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
              + Novo Nível
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          {loading ? (
            <p className="text-center text-gray-500">Carregando...</p>
          ) : (
            <ul>
              {filteredLevels.map((level, index) => (
                <li
                  key={level.id}
                  className={`flex justify-between items-center py-4 ${index < filteredLevels.length - 1 ? 'border-b border-gray-200' : ''}`}
                >
                  <span className="text-gray-700">{level.name}</span>
                  <div className="flex items-center space-x-4 ml-4 flex-shrink-0">
                    <button className="text-gray-500 hover:text-blue-600" onClick={() => openModalForEdit(level)} title="Editar">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="text-gray-500 hover:text-red-600" onClick={() => openDeleteModal(level)} title="Excluir">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? 'Editar Nível' : 'Adicionar Novo Nível'}
      >
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm" role="alert">{error}</div>}
          <div className="mb-4">
            <label htmlFor="levelName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Nível
            </label>
            <input
              type="text"
              id="levelName"
              name="name"
              value={currentLevel.name || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end pt-4 border-t">
            <button
              type="button"
              onClick={closeModal}
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
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={
          <>
            Tem certeza que deseja excluir o nível <strong>"{levelToDelete?.name}"</strong>?
            <br />
            Esta ação não pode ser desfeita.
          </>
        }
      />
    </>
  );
};

export default TiposNiveisUsuario;