

import React, { useState } from 'react';
import { SearchIcon } from '../components/icons/SearchIcon';
import { FolderIcon } from '../components/icons/FolderIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { ExclamationCircleIcon } from '../components/icons/ExclamationCircleIcon';
import { UserGroupIcon } from '../components/icons/UserGroupIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import Modal from '../components/Modal';

interface Project {
  title: string;
  empresa: string;
  responsavel: string;
  dataInicio: string;
  dataTermino: string;
  description: string;
  progress: number;
  status: string;
  avatars: string[];
}

const initialProjects: Project[] = [
  {
    title: 'Desenvolvimento de Novo Herbicida',
    empresa: 'AgroCorp',
    responsavel: 'Ana Lúcia',
    dataInicio: '2024-01-15',
    dataTermino: '2024-12-20',
    description: 'Projeto de pesquisa e desenvolvimento de um novo herbicida mais eficiente e ecológico.',
    progress: 50,
    status: 'Em andamento',
    avatars: ['https://i.pravatar.cc/150?img=1', 'https://i.pravatar.cc/150?img=2', 'https://i.pravatar.cc/150?img=3', 'https://i.pravatar.cc/150?img=4'],
  },
  {
    title: 'Sistema de Irrigação Inteligente',
    empresa: 'Fazenda Sol Nascente',
    responsavel: 'Bruno Costa',
    dataInicio: '2023-09-01',
    dataTermino: '2024-03-31',
    description: 'Implementação de um sistema de irrigação automatizado baseado em sensores de umidade do solo.',
    progress: 100,
    status: 'Concluído',
    avatars: ['https://i.pravatar.cc/150?img=5'],
  },
  {
    title: 'Auditoria Ambiental Anual',
    empresa: 'Indústria Verde',
    responsavel: 'Carla Dias',
    dataInicio: '2024-06-01',
    dataTermino: '2024-08-31',
    description: 'Auditoria completa dos processos da empresa para conformidade com as normas ambientais.',
    progress: 33,
    status: 'Atrasado',
    avatars: ['https://i.pravatar.cc/150?img=6', 'https://i.pravatar.cc/150?img=7'],
  },
];

const emptyProject: Omit<Project, 'progress' | 'status' | 'avatars'> = {
  title: '',
  empresa: '',
  responsavel: '',
  dataInicio: '',
  dataTermino: '',
  description: '',
};

// Mock data to simulate fetching from DB
const mockEmpresas = ['AgroTech Soluções', 'Campo Forte Insumos', 'Terra Boa Agronegócios', 'Grão de Ouro Coop.', 'Fazenda Bela Vista', 'AgroCorp', 'Fazenda Sol Nascente', 'Indústria Verde'];
const mockResponsaveis = ['Ana Lúcia', 'Bruno Costa', 'Carla Dias', 'Alice Silva', 'Daniel Souza'];


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
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const Projetos: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState(emptyProject);
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.title.trim() && newProject.empresa && newProject.responsavel && newProject.dataInicio && newProject.dataTermino) {
      const projectToAdd: Project = {
        ...newProject,
        progress: 0,
        status: 'Em andamento',
        avatars: [],
      };
      setProjects(prev => [projectToAdd, ...prev]);
      setNewProject(emptyProject);
      setIsModalOpen(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
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
            onClick={() => setIsModalOpen(true)}
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
                <p className="text-3xl font-bold text-gray-800">5</p>
                <p className="text-gray-500">Usuários Ativos</p>
            </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Projetos Ativos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
                <div key={project.title} className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 cursor-pointer hover:text-blue-600">{project.title}</h3>
                            <p className="text-sm text-gray-500">Empresa: {project.empresa}</p>
                             <div className="flex items-center text-xs text-gray-400 mt-1">
                                <CalendarIcon className="h-4 w-4 mr-1"/>
                                <span>{formatDate(project.dataInicio)} - {formatDate(project.dataTermino)}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(project.status)}`}>{project.status}</span>
                          <button className="text-gray-400 hover:text-blue-600" title="Editar projeto">
                            <PencilIcon className="h-5 w-5" />
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
                        <div className="flex items-center">
                            <div className="flex -space-x-2">
                                {project.avatars.slice(0, 2).map((avatar, i) => (
                                    <img key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src={avatar} alt="" />
                                ))}
                                {project.avatars.length > 2 && (
                                     <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 ring-2 ring-white z-10 ml-[-8px]">
                                         +1
                                     </div>
                                )}
                            </div>
                        </div>
                        <button className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800">
                            <SparklesIcon className="h-4 w-4 mr-1"/>
                            Resumo com IA
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
    <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Novo Projeto"
      >
        <form onSubmit={handleAddNewProject}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título do Projeto</label>
              <input type="text" name="title" value={newProject.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea name="description" value={newProject.description} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <select name="empresa" value={newProject.empresa} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Selecione uma empresa</option>
                {mockEmpresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
              <select name="responsavel" value={newProject.responsavel} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Selecione um responsável</option>
                {mockResponsaveis.map(resp => <option key={resp} value={resp}>{resp}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                    <input type="date" name="dataInicio" value={newProject.dataInicio} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Término</label>
                    <input type="date" name="dataTermino" value={newProject.dataTermino} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
            </div>
          </div>
          <div className="flex justify-end pt-6 border-t mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Projetos;
