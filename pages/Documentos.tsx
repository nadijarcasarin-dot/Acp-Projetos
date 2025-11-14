import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TrashIcon } from '../components/icons/TrashIcon';
import { DocumentIcon } from '../components/icons/DocumentIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { UploadIcon } from '../components/icons/UploadIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';

interface Project {
  id: number;
  title: string;
}

interface Document {
  id: number;
  title: string;
  description: string;
  project_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
  projects: Project | null;
}

const emptyForm = {
    title: '',
    description: '',
    project_id: '',
    file: null as File | null,
};

const getFileIconColor = (type?: string) => {
    if (!type) return 'text-gray-500';
    if (type.includes('pdf')) return 'text-red-500';
    if (type.includes('sheet') || type.includes('excel')) return 'text-green-500';
    if (type.includes('document') || type.includes('word')) return 'text-blue-500';
    return 'text-gray-500';
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

const Documentos: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDocument, setNewDocument] = useState(emptyForm);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  const [selectedProject, setSelectedProject] = useState('Todos');

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [docRes, projRes] = await Promise.all([
          supabase.from('documents').select('*, projects(id, title)').order('created_at', { ascending: false }).abortSignal(signal),
          supabase.from('projects').select('id, title').order('title').abortSignal(signal)
        ]);

        if (signal.aborted) return;
        
        const { data: docData, error: docError } = docRes;
        if (docError) throw docError;
        
        const { data: projData, error: projError } = projRes;
        if (projError) throw projError;
        
        const sanitizedDocs = (docData || []).map(doc => {
          const projectRelation = doc.projects;
          return {
            ...doc,
            projects: (projectRelation && typeof projectRelation === 'object' && !Array.isArray(projectRelation))
              ? projectRelation
              : { id: doc.project_id, title: 'Projeto Indefinido' }
          }
        });
        setDocuments(sanitizedDocs as Document[]);
        setProjects(projData || []);

      } catch (err: any) {
        if (err.name !== 'AbortError') {
            setError(`Falha ao carregar dados: ${err.message}`);
        }
      } finally {
        if (!signal.aborted) {
            setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
        controller.abort();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDocument(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setNewDocument(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewDocument(emptyForm);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocument.file || !newDocument.project_id) {
        setNotification({ type: 'error', message: 'Por favor, preencha todos os campos obrigatórios.' });
        return;
    }
    setIsUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    const file = newDocument.file;
    const filePath = `public/${user?.id || 'anon'}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file);

    if (uploadError) {
        let friendlyMessage = `Falha no upload: ${uploadError.message}`;
        if (uploadError.message.toLowerCase().includes('bucket not found')) {
            friendlyMessage = "Falha no upload: O 'bucket' de armazenamento chamado 'documentos' não foi encontrado. Por favor, crie-o na seção 'Storage' do seu painel Supabase para poder carregar arquivos.";
        } else if (uploadError.message.toLowerCase().includes('security policy')) {
            friendlyMessage = "Falha de segurança: Verifique se as políticas de segurança (RLS) para o 'Storage' e para a tabela 'documents' estão configuradas corretamente no Supabase."
        }
        setNotification({ type: 'error', message: friendlyMessage });
        setIsUploading(false);
        return;
    }

    const docData = {
        title: newDocument.title,
        description: newDocument.description,
        project_id: parseInt(newDocument.project_id, 10),
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        uploaded_by_id: user?.id || null,
    };

    const { data: newDoc, error: insertError } = await supabase
        .from('documents')
        .insert(docData)
        .select('*, projects(id, title)')
        .single();
    
    setIsUploading(false);
    if (insertError) {
        await supabase.storage.from('documentos').remove([filePath]);
        let friendlyMessage = `Erro ao salvar documento: ${insertError.message}`;
        if (insertError.message.toLowerCase().includes('security policy')) {
            friendlyMessage = "Falha de segurança: Verifique se as políticas de segurança (RLS) para a tabela 'documents' estão configuradas corretamente no Supabase."
        }
        setNotification({ type: 'error', message: friendlyMessage });
    } else {
        setNotification({ type: 'success', message: 'Documento carregado com sucesso!' });
        closeModal();
        
        const projectRelation = newDoc.projects;
        const sanitizedDoc = {
          ...newDoc,
          projects: (projectRelation && typeof projectRelation === 'object' && !Array.isArray(projectRelation))
            ? projectRelation
            : projects.find(p => p.id.toString() === newDocument.project_id) || { id: newDoc.project_id, title: 'Projeto Indefinido' }
        } as Document;

        setDocuments(prev => [sanitizedDoc, ...prev]);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from('documentos').download(filePath);
    if (error) {
      setNotification({ type: 'error', message: `Erro no download: ${error.message}` });
      return;
    }
    const blob = new Blob([data], { type: data.type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const openDeleteModal = (doc: Document) => {
    setDocToDelete(doc);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;

    const { error: storageError } = await supabase.storage.from('documentos').remove([docToDelete.file_path]);
    if (storageError) {
        setNotification({ type: 'error', message: `Erro ao remover arquivo: ${storageError.message}` });
        setIsDeleteModalOpen(false);
        return;
    }
    
    const { error: dbError } = await supabase.from('documents').delete().eq('id', docToDelete.id);
    
    setIsDeleteModalOpen(false);
    if (dbError) {
        setNotification({ type: 'error', message: `Erro ao excluir registro: ${dbError.message}` });
    } else {
        setNotification({ type: 'success', message: 'Documento excluído com sucesso!' });
        setDocuments(prev => prev.filter(d => d.id !== docToDelete.id));
    }
    setDocToDelete(null);
  };
  
  const filteredDocuments = documents.filter(doc => {
    if (!doc) return false;
    return selectedProject === 'Todos' ? true : (doc.project_id != null && doc.project_id.toString() === selectedProject);
  });

  return (
    <>
    {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Documentos</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
             <select 
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Todos">Filtrar por Projeto: Todos</option>
                {projects.map(project => (
                    <option key={project.id} value={project.id}>
                        {project.title}
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
      
      {loading ? <p className="text-center text-gray-500">Carregando documentos...</p> :
      error ? <p className="text-center text-red-500">{error}</p> :
      <div className="space-y-4">
        {filteredDocuments.map((doc) => (
          <div key={doc.id} className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
                <div className={`p-3 rounded-lg mr-4 flex-shrink-0 ${getFileIconColor(doc.file_type).replace('text-', 'bg-').replace('-500', '-100')}`}>
                    <DocumentIcon className={`h-6 w-6 ${getFileIconColor(doc.file_type)}`} />
                </div>
              <div className="truncate">
                <p className="font-bold text-gray-800 truncate">{doc.title}</p>
                <p className="text-sm text-gray-600 mb-1 truncate">{doc.description}</p>
                <p className="text-sm text-gray-500 truncate">
                  {doc.file_name} · Projeto: {doc.projects?.title || 'N/A'} · Enviado em: {formatDate(doc.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 pl-4">
              <button onClick={() => handleDownload(doc.file_path, doc.file_name)} className="text-gray-500 hover:text-blue-600" title="Baixar">
                <DownloadIcon className="h-5 w-5" />
              </button>
              <button onClick={() => openDeleteModal(doc)} className="text-gray-500 hover:text-red-600" title="Excluir">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      }
    </div>

    <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
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
              <select name="project_id" value={newDocument.project_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Selecione um projeto</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
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
            <button type="button" onClick={closeModal} className="mr-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" disabled={isUploading}>
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400" disabled={isUploading}>
              {isUploading ? 'Salvando...' : 'Salvar'}
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
            Tem certeza que deseja excluir o documento <strong>"{docToDelete?.title}"</strong>?
            <br />
            Esta ação removerá o arquivo permanentemente.
          </>
        }
      />
    </>
  );
};

export default Documentos;