
import React, { useState } from 'react';
import { TrashIcon } from '../components/icons/TrashIcon';
import { DocumentIcon } from '../components/icons/DocumentIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { UploadIcon } from '../components/icons/UploadIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import Modal from '../components/Modal';


interface Document {
  title: string;
  description: string;
  name: string;
  project: string;
  date: string;
  type: string;
}

const initialDocuments: Document[] = [
  {
    title: 'Escopo do Projeto',
    description: 'Documento detalhando o escopo completo do projeto de herbicida.',
    name: 'Escopo do Projeto.pdf',
    project: 'Desenvolvimento de Novo Herbicida',
    date: '2024-05-02',
    type: 'pdf',
  },
  {
    title: 'Análise de Risco',
    description: 'Planilha com a análise de risco e mitigação de problemas.',
    name: 'Análise de Risco.xlsx',
    project: 'Desenvolvimento de Novo Herbicida',
    date: '2024-05-10',
    type: 'xlsx',
  },
  {
    title: 'Checklist de Auditoria',
    description: 'Checklist completo para a auditoria anual de conformidade.',
    name: 'Checklist de Auditoria.docx',
    project: 'Checklist de Auditoria Anual',
    date: '2024-07-01',
    type: 'docx',
  },
];

const mockProjects = [
    'Desenvolvimento de Novo Herbicida',
    'Sistema de Irrigação Inteligente',
    'Auditoria Ambiental Anual',
    'Checklist de Auditoria Anual',
];

const getFileIconColor = (type: string) => {
    switch (type) {
        case 'pdf':
            return 'text-red-500';
        case 'xlsx':
            return 'text-green-500';
        case 'docx':
            return 'text-blue-500';
        default:
            return 'text-gray-500';
    }
}

const emptyForm = {
    title: '',
    description: '',
    project: '',
    file: null as File | null,
};

const Documentos: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDocument, setNewDocument] = useState(emptyForm);
  const [selectedProject, setSelectedProject] = useState('Todos');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDocument(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setNewDocument(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDocument.title && newDocument.file && newDocument.project) {
        const newDoc: Document = {
            title: newDocument.title,
            description: newDocument.description,
            name: newDocument.file.name,
            project: newDocument.project,
            date: new Date().toISOString().split('T')[0],
            type: newDocument.file.name.split('.').pop() || '',
        };
        setDocuments(prev => [newDoc, ...prev]);
        setIsModalOpen(false);
        setNewDocument(emptyForm);
    }
  };
  
  const filteredDocuments = documents.filter(doc =>
    selectedProject === 'Todos' ? true : doc.project === selectedProject
  );
  
  const projectsForFilter = ['Todos', ...Array.from(new Set(documents.map(d => d.project)))];


  return (
    <>
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Documentos</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
             <select 
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {projectsForFilter.map(project => (
                    <option key={project} value={project}>
                        {project === 'Todos' ? 'Filtrar por Projeto: Todos' : project}
                    </option>
                ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center">
            <UploadIcon className="h-5 w-5 mr-2" />
            Carregar Documento
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredDocuments.map((doc, index) => (
          <div key={`${doc.name}-${index}`} className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
                <div className={`p-3 rounded-lg mr-4 flex-shrink-0 ${getFileIconColor(doc.type).replace('text-', 'bg-').replace('-500', '-100')}`}>
                    <DocumentIcon className={`h-6 w-6 ${getFileIconColor(doc.type)}`} />
                </div>
              <div className="truncate">
                <p className="font-bold text-gray-800 truncate">{doc.title}</p>
                <p className="text-sm text-gray-600 mb-1 truncate">{doc.description}</p>
                <p className="text-sm text-gray-500 truncate">
                  {doc.name} · Projeto: {doc.project} · Enviado em: {doc.date}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 pl-4">
              <button className="text-gray-500 hover:text-blue-600">
                <DownloadIcon className="h-5 w-5" />
              </button>
              <button className="text-gray-500 hover:text-red-600">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Carregar Novo Documento"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input type="text" name="title" value={newDocument.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea name="description" value={newDocument.description} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
              <select name="project" value={newDocument.project} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Selecione um projeto</option>
                {mockProjects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                <span>Carregue um arquivo</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} required/>
                            </label>
                            <p className="pl-1">ou arraste e solte</p>
                        </div>
                        {newDocument.file ? (
                             <p className="text-xs text-green-600">{newDocument.file.name}</p>
                        ) : (
                            <p className="text-xs text-gray-500">PNG, JPG, PDF até 10MB</p>
                        )}
                    </div>
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

export default Documentos;
