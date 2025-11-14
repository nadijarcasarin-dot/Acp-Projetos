import React, { useState, useEffect } from 'react';
import { SearchIcon } from '../components/icons/SearchIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';
import { supabase } from '../lib/supabaseClient';

interface JobTitle {
  id: number;
  name: string;
}

const emptyRole: Partial<JobTitle> = { name: '' };

const CargosUsuario: React.FC = () => {
  const [roles, setRoles] = useState<JobTitle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<JobTitle | null>(null);
  const [currentRole, setCurrentRole] = useState<Partial<JobTitle>>(emptyRole);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('job_titles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setRoles(data || []);
    } catch (error: any) {
      setError(`Falha ao buscar dados: ${error.message}`);
      console.error("Error fetching job titles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openModalForNew = () => {
    setCurrentRole(emptyRole);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openModalForEdit = (role: JobTitle) => {
    setCurrentRole(role);
    setIsEditing(true);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRole(emptyRole);
    setIsEditing(false);
    setError(null);
  };
  
  const openDeleteModal = (role: JobTitle) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentRole(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { name } = currentRole;

    if (!name?.trim()) {
      setError("O nome do cargo não pode estar vazio.");
      return;
    }
    
    const roleData = { name: name.trim() };

    try {
      if (isEditing) {
        const { data, error } = await supabase
          .from('job_titles')
          .update(roleData)
          .eq('id', currentRole.id!)
          .select()
          .single();
        if (error) throw error;
        setRoles(prev => prev.map(r => r.id === data.id ? data : r));
        setNotification({ type: 'success', message: 'Cargo atualizado com sucesso!' });
      } else {
        const { data, error } = await supabase
          .from('job_titles')
          .insert(roleData)
          .select()
          .single();
        if (error) throw error;
        setRoles(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setNotification({ type: 'success', message: 'Cargo criado com sucesso!' });
      }
      closeModal();
    } catch (error: any) {
      setError(error.message);
    }
  };


  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;

    const { error: deleteError } = await supabase
      .from('job_titles')
      .delete()
      .eq('id', roleToDelete.id);

    setIsDeleteModalOpen(false);

    if (deleteError) {
      const friendlyMessage = deleteError.message.includes('foreign key constraint')
        ? "Não é possível excluir: este cargo está em uso por um ou mais usuários."
        : `Erro ao excluir: ${deleteError.message}`;
      setNotification({ type: 'error', message: friendlyMessage });
    } else {
      setNotification({ type: 'success', message: 'Cargo excluído com sucesso!' });
      setRoles(prevRoles => prevRoles.filter(r => r.id !== roleToDelete.id));
    }
    setRoleToDelete(null);
  };


  const filteredRoles = roles.filter(role =>
    typeof role.name === 'string' && role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
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
              onClick={openModalForNew}
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              + Novo Cargo
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          {loading ? (
            <p className="text-center text-gray-500">Carregando...</p>
          ) : (
            <ul>
              {filteredRoles.map((role, index) => (
                <li
                  key={role.id}
                  className={`flex justify-between items-center py-4 ${index < filteredRoles.length - 1 ? 'border-b border-gray-200' : ''}`}
                >
                  <span className="text-gray-700">{role.name}</span>
                  <div className="flex items-center space-x-4 ml-4 flex-shrink-0">
                    <button className="text-gray-500 hover:text-blue-600" onClick={() => openModalForEdit(role)} title="Editar">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="text-gray-500 hover:text-red-600" onClick={() => openDeleteModal(role)} title="Excluir">
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
        title={isEditing ? 'Editar Cargo' : 'Adicionar Novo Cargo'}
      >
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm" role="alert">{error}</div>}
          <div className="mb-4">
            <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cargo
            </label>
            <input
              type="text"
              id="roleName"
              name="name"
              value={currentRole.name || ''}
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
            Tem certeza que deseja excluir o cargo <strong>"{roleToDelete?.name}"</strong>?
            <br />
            Esta ação não pode ser desfeita.
          </>
        }
      />
    </>
  );
};

export default CargosUsuario;