import React, { useState, useEffect } from 'react';
import { SearchIcon } from '../components/icons/SearchIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';
import { supabase } from '../lib/supabaseClient';

interface Company {
  id: number;
  name: string;
  type: string;
  city: string;
  district: string;
}

const emptyCompany: Omit<Company, 'id'> = { name: '', type: '', city: '', district: '' };

const Empresas: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Partial<Company>>(emptyCompany);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name', { ascending: true })
          .abortSignal(signal);
        
        if (error) throw error;
        if (!signal.aborted) {
            setCompanies(data || []);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
            setError('A requisição demorou muito. Verifique sua conexão e tente novamente.');
        } else {
            setError(`Falha ao buscar dados: ${error.message}`);
        }
      } finally {
        if (!signal.aborted) {
            setLoading(false);
        }
      }
    };

    fetchCompanies();
    
    return () => {
        clearTimeout(timeoutId);
        controller.abort();
    };
  }, []);

  const openModalForNew = () => {
    setCurrentCompany(emptyCompany);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openModalForEdit = (company: Company) => {
    setCurrentCompany(company);
    setIsEditing(true);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCompany(emptyCompany);
    setIsEditing(false);
    setError(null);
  }

  const openDeleteModal = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { name, type, city, district } = currentCompany;

    if (!name?.trim() || !type?.trim() || !city?.trim() || !district?.trim()) {
      setError("Todos os campos devem ser preenchidos.");
      return;
    }
    
    const companyData = { name, type, city, district };

    try {
      if (isEditing) {
        const { data, error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', currentCompany.id!)
          .select()
          .single();
        if (error) throw error;
        setCompanies(prev => prev.map(c => c.id === data.id ? data : c));
        setNotification({ type: 'success', message: 'Empresa atualizada com sucesso!' });
      } else {
        const { data, error } = await supabase
          .from('companies')
          .insert(companyData)
          .select()
          .single();
        if (error) throw error;
        setCompanies(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setNotification({ type: 'success', message: 'Empresa criada com sucesso!' });
      }
      closeModal();
    } catch (error: any) {
      setError(error.message);
    }
  };
  
  const handleConfirmDelete = async () => {
      if (!companyToDelete) return;

      const { error } = await supabase.from('companies').delete().eq('id', companyToDelete.id);
      
      setIsDeleteModalOpen(false);
      
      if (error) {
          const friendlyMessage = error.message.includes('foreign key constraint')
            ? "Não é possível excluir: esta empresa está associada a um ou mais projetos."
            : `Erro ao excluir: ${error.message}`;
          setNotification({ type: 'error', message: friendlyMessage });
      } else {
          setNotification({ type: 'success', message: 'Empresa excluída com sucesso!' });
          setCompanies(prevCompanies => prevCompanies.filter(c => c.id !== companyToDelete.id));
      }
      setCompanyToDelete(null);
  }

  const filteredCompanies = companies.filter(company =>
    Object.values(company).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Empresas</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={openModalForNew}
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              + Nova Empresa
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome Fantasia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enquadramento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bairro/Linha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4">Carregando...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="p-6 text-center text-red-500 bg-red-100 rounded-lg">{error}</td></tr>
              ) : filteredCompanies.map((company) => (
                <tr key={company.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.district}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-4">
                      <button className="text-gray-500 hover:text-blue-600" onClick={() => openModalForEdit(company)} title="Editar">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button className="text-gray-500 hover:text-red-600" onClick={() => openDeleteModal(company)} title="Excluir">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? 'Editar Empresa' : 'Adicionar Nova Empresa'}
      >
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm" role="alert">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
              <input type="text" name="name" value={currentCompany.name || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enquadramento</label>
              <input type="text" name="type" value={currentCompany.type || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input type="text" name="city" value={currentCompany.city || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro/Linha</label>
              <input type="text" name="district" value={currentCompany.district || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
          <div className="flex justify-end pt-6 border-t mt-6">
            <button type="button" onClick={closeModal} className="mr-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
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
            Tem certeza que deseja excluir a empresa <strong>"{companyToDelete?.name}"</strong>?
            <br />
            Esta ação não pode ser desfeita.
          </>
        }
      />
    </>
  );
};

export default Empresas;