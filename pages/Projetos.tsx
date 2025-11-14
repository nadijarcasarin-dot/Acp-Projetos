import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SearchIcon } from '../components/icons/SearchIcon';
import { FolderIcon } from '../components/icons/FolderIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { ExclamationCircleIcon } from '../components/icons/ExclamationCircleIcon';
import { UserGroupIcon } from '../components/icons/UserGroupIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';

interface Company {
  id: number;
  name: string;
}

interface User {
  id: string;
  full_name: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: string;
  company_id: number;
  manager_id: string;
  companies: Company | null;
  users: User | null;
}

const emptyProject: Partial<Project> = {
  title: '',
  description: '',
  company_id: undefined,
  manager_id: undefined,
  start_date: '',
  end_date: '',
  progress: 0,
  status: 'Pendente',
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Concluído': return 'bg-green-100 text-green-800';
    case 'Atrasado': return 'bg-red-100 text-red-800';
    case 'Em andamento': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getProgressClass = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-green-500';
      case 'Atrasado': return 'bg-red-500';
      case 'Em andamento': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const Projetos: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>(emptyProject);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*, companies(id, name), users:manager_id(id, full_name)');

      if (projectsError) throw projectsError;
      
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('project_id, status');

      if (tasksError) throw tasksError;

      const projectsWithProgress = (projectsData || []).map(project => {
        const projectTasks = (tasksData || []).filter(task => task.project_id === project.id);
        const completedTasks = projectTasks.filter(task => task.status === 'Concluída').length;
        const totalTasks = projectTasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
            ...project,
            progress: progress,
        };
      });

      const sanitizedProjects = projectsWithProgress.map(project => ({
        ...project,
        companies: project.companies || { id: project.company_id, name: 'Empresa Indefinida' },
        users: project.users || { id: project.manager_id, full_name: 'Responsável Indefinido' },
      }));
      setProjects(sanitizedProjects as Project[]);


      const { data: companiesData, error: companiesError } = await supabase.from('companies').select('id, name').order('name');
      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      const { data: usersData, error: usersError } = await supabase.from('users').select('id, full_name').order('full_name');
      if (usersError) throw usersError;
      setUsers(usersData || []);

    } catch (err: any) {
      setError(`Falha ao buscar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModalForNew = () => {
    setCurrentProject(emptyProject);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openModalForEdit = (project: Project) => {
    setCurrentProject(project);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openDeleteModal = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProject(emptyProject);
    setError(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentProject(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const companyId = currentProject.company_id ? parseInt(currentProject.company_id as any, 10) : null;
    if (!companyId) {
      setError("Por favor, selecione uma empresa válida.");
      return;
    }

    if (!currentProject.manager_id) {
      setError("Por favor, selecione um responsável válido.");
      return;
    }

    const projectData = {
      title: currentProject.title,
      description: currentProject.description,
      company_id: companyId,
      manager_id: currentProject.manager_id,
      start_date: currentProject.start_date,
      end_date: currentProject.end_date,
      progress: isEditing ? currentProject.progress : 0,
      status: currentProject.status || 'Pendente',
    };
    
    let query;
    if (isEditing) {
      query = supabase.from('projects').update(projectData).eq('id', currentProject.id);
    } else {
      query = supabase.from('projects').insert([projectData]);
    }
    
    const { error } = await query;
    if (error) {
      setError(error.message);
    } else {
      closeModal();
      await fetchData();
      setNotification({ type: 'success', message: `Projeto ${isEditing ? 'atualizado' : 'criado'} com sucesso!` });
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
    
    setIsDeleteModalOpen(false);
    if (error) {
        setNotification({ type: 'error', message: `Erro ao excluir: ${error.message}` });
    } else {
        setNotification({ type: 'success', message: 'Projeto excluído com sucesso!' });
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
    }
    setProjectToDelete(null);
  };

  const filteredProjects = projects.filter(project => {
    if (!project || typeof project.title !== 'string' || !project.companies || typeof project.companies.name !== 'string') {
        return false;
    }
    const searchTermLower = searchTerm.toLowerCase();
    const titleMatch = project.title.toLowerCase().includes(searchTermLower);
    const companyMatch = project.companies.name.toLowerCase().includes(searchTermLower);
    return titleMatch || companyMatch;
  });
  
  const renderModalFooter = () => (
    <>
      <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
        Cancelar
      </button>
      <button type="submit" form="project-form" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
        Salvar
      </button>
    </>
  );

  return (
    <>
    {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Painel</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por projetos ou tarefas..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={openModalForNew}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
            + Novo Projeto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4"><FolderIcon className="h-6 w-6 text-blue-600" /></div>
            <div>
                <p className="text-3xl font-bold text-gray-800">{projects.length}</p>
                <p className="text-gray-500">Total de Projetos</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
            <div className="bg-green-100 p-3 rounded-lg mr-4"><CheckCircleIcon className="h-6 w-6 text-green-600" /></div>
            <div>
                <p className="text-3xl font-bold text-gray-800">{projects.filter(p => p.status === 'Concluído').length}</p>
                <p className="text-gray-500">Concluídos</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
            <div className="bg-red-100 p-3 rounded-lg mr-4"><ExclamationCircleIcon className="h-6 w-6 text-red-600" /></div>
            <div>
                <p className="text-3xl font-bold text-gray-800">{projects.filter(p => p.status === 'Atrasado').length}</p>
                <p className="text-gray-500">Atrasados</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
            <div className="bg-gray-100 p-3 rounded-lg mr-4"><UserGroupIcon className="h-6 w-6 text-gray-600" /></div>
            <div>
                <p className="text-3xl font-bold text-gray-800">{users.length}</p>
                <p className="text-gray-500">Usuários Ativos</p>
            </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Projetos Ativos</h2>
         {loading ? <p className="text-center text-gray-500">Carregando projetos...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map(project => (
                    <div key={project.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-800 cursor-pointer hover:text-blue-600">{project.title}</h3>
                                <p className="text-sm text-gray-500">Empresa: {project.companies?.name || 'N/A'}</p>
                                 <div className="flex items-center text-xs text-gray-400 mt-1">
                                    <CalendarIcon className="h-4 w-4 mr-1"/>
                                    <span>{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(project.status)}`}>{project.status}</span>
                               <button onClick={() => openModalForEdit(project)} className="text-gray-400 hover:text-blue-600" title="Editar projeto">
                                <PencilIcon className="h-5 w-5" />
                              </button>
                               <button onClick={() => openDeleteModal(project)} className="text-gray-400 hover:text-red-600" title="Excluir projeto">
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 flex-grow mb-4">{project.description}</p>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-500">Progresso</span>
                                <span className="text-sm font-semibold text-gray-800">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className={`${getProgressClass(project.status)} h-2 rounded-full`} style={{width: `${project.progress}%`}}></div>
                            </div>
                        </div>
                        <div className="border-t mt-4 pt-4 flex justify-between items-center">
                            <div>
                               <p className="text-sm text-gray-500">Responsável: <strong>{project.users?.full_name || 'N/A'}</strong></p>
                            </div>
                            <button className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800">
                                <SparklesIcon className="h-4 w-4 mr-1"/>
                                Resumo com IA
                            </button>
                        </div>
                    </div>
                ))}
            </div>
         )}
      </div>
    </div>
    <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? 'Editar Projeto' : 'Adicionar Novo Projeto'}
        footer={renderModalFooter()}
      >
        <form id="project-form" onSubmit={handleSubmit}>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm" role="alert">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título do Projeto</label>
              <input type="text" name="title" value={currentProject.title || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea name="description" value={currentProject.description || ''} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <select name="company_id" value={currentProject.company_id || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Selecione uma empresa</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
              <select name="manager_id" value={currentProject.manager_id || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Selecione um responsável</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                    <input type="date" name="start_date" value={currentProject.start_date || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Término</label>
                    <input type="date" name="end_date" value={currentProject.end_date || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={currentProject.status || 'Pendente'} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Atrasado">Atrasado</option>
                </select>
            </div>
          </div>
        </form>
      </Modal>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão de Projeto"
        message={
          <>
            Tem certeza que deseja excluir o projeto <strong>"{projectToDelete?.title}"</strong>?
            <br />
            Esta ação não pode ser desfeita.
          </>
        }
      />
    </>
  );
};

export default Projetos;