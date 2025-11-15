import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';
import type { TaskStatus } from '../types';

interface User {
  id: string;
  full_name: string;
  avatar_url: string;
}

interface Project {
  id: number;
  title: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  project_id: number;
  assignee_id: string;
  start_date: string;
  due_date: string;
  end_date: string;
  status: TaskStatus;
  projects: Project | null;
  users: User | null;
}

const emptyTask: Partial<Task> = {
  title: '',
  description: '',
  project_id: undefined,
  assignee_id: undefined,
  start_date: '',
  due_date: '',
  end_date: '',
  status: 'Pendente',
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const getStatusClasses = (status: string) => {
  switch(status) {
      case 'Atrasada': return { border: 'border-red-500', select: 'bg-red-100 text-red-800 focus:ring-red-500' };
      case 'Em Andamento': return { border: 'border-blue-500', select: 'bg-blue-100 text-blue-800 focus:ring-blue-500' };
      case 'Concluída': return { border: 'border-green-500', select: 'bg-green-100 text-green-800 focus:ring-green-500' };
      default: return { border: 'border-gray-500', select: 'bg-gray-100 text-gray-800 focus:ring-gray-500' };
  }
}

const Tarefas: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [filters, setFilters] = useState({ status: 'Todos', project: 'Todos', assignee: 'Todos' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTask, setCurrentTask] = useState<Partial<Task>>(emptyTask);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [saving, setSaving] = useState(false);


    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [tasksRes, projectsRes, usersRes] = await Promise.all([
                    supabase.from('tasks').select('*, projects(id, title), users(id, full_name, avatar_url)').abortSignal(signal),
                    supabase.from('projects').select('id, title').order('title').abortSignal(signal),
                    supabase.from('users').select('id, full_name').order('full_name').abortSignal(signal),
                ]);

                if (signal.aborted) return;
                
                const { data: tasksData, error: tasksError } = tasksRes;
                if (tasksError) throw tasksError;

                const { data: projectsData, error: projectsError } = projectsRes;
                if (projectsError) throw projectsError;

                const { data: usersData, error: usersError } = usersRes;
                if (usersError) throw usersError;

                const sanitizedTasks = (tasksData || []).map(task => {
                    return {
                        ...task,
                        projects: task.projects || { id: task.project_id, title: 'Projeto Indefinido' },
                        users: task.users || { id: task.assignee_id, full_name: 'Responsável Indefinido', avatar_url: '' }
                    };
                });
                setTasks(sanitizedTasks as Task[]);
                setProjects(projectsData || []);
                setUsers(usersData || []);
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setError(`Falha ao buscar dados: ${err.message}`);
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

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = async (taskId: number, newStatus: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId);

        if (error) {
            setNotification({ type: 'error', message: `Erro ao atualizar status: ${error.message}` });
        } else {
            setNotification({ type: 'success', message: 'Status atualizado com sucesso!' });
            setTasks(prev => prev.map(task => task.id === taskId ? { ...task, status: newStatus as TaskStatus } : task));
        }
    };

    const openModalForNew = () => {
        setCurrentTask(emptyTask);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openModalForEdit = (task: Task) => {
        setCurrentTask(task);
        setIsEditing(true);
        setIsModalOpen(true);
    };
    
    const openDeleteModal = (task: Task) => {
        setTaskToDelete(task);
        setIsDeleteModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setError(null);
    };
    
    const sanitizeAndAddTask = (task: any, existingTasks: Task[]) => {
        const projectRelation = task.projects;
        const userRelation = task.users;

        const sanitizedTask: Task = {
            ...task,
            projects: (projectRelation && typeof projectRelation === 'object' && !Array.isArray(projectRelation))
                ? projectRelation
                : projects.find(p => p.id === task.project_id) || { id: task.project_id, title: 'Projeto Indefinido' },
            users: (userRelation && typeof userRelation === 'object' && !Array.isArray(userRelation))
                ? userRelation
                : users.find(u => u.id === task.assignee_id) || { id: task.assignee_id, full_name: 'Responsável Indefinido', avatar_url: '' },
        };

        if (isEditing) {
            return existingTasks.map(t => t.id === sanitizedTask.id ? sanitizedTask : t);
        } else {
            return [...existingTasks, sanitizedTask];
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        const taskData = {
            title: currentTask.title,
            description: currentTask.description,
            project_id: currentTask.project_id,
            assignee_id: currentTask.assignee_id,
            start_date: currentTask.start_date,
            due_date: currentTask.due_date,
            end_date: currentTask.end_date,
            status: currentTask.status || 'Pendente',
        };

        try {
            let savedTask;
            if (isEditing) {
                const { data, error } = await supabase
                    .from('tasks')
                    .update(taskData)
                    .eq('id', currentTask.id!)
                    .select('*, projects(id, title), users(id, full_name, avatar_url)')
                    .single();
                if (error) throw error;
                savedTask = data;
            } else {
                const { data, error: taskError } = await supabase
                    .from('tasks')
                    .insert(taskData)
                    .select('*, projects(id, title), users(id, full_name, avatar_url)')
                    .single();
                if (taskError) throw taskError;
                savedTask = data;
            }
            
            setTasks(prev => sanitizeAndAddTask(savedTask, prev));
            closeModal();
            setNotification({ type: 'success', message: `Tarefa ${isEditing ? 'atualizada' : 'criada'} com sucesso!` });
        } catch (error: any) {
            console.error("Falha ao salvar tarefa:", error);
            const userMessage = `Falha ao salvar a tarefa. Motivo: ${error.message}`;
            setError(userMessage);
            setNotification({ type: 'error', message: userMessage });
        } finally {
            setSaving(false);
        }
    };


    const handleConfirmDelete = async () => {
        if (!taskToDelete) return;
        const { error } = await supabase.from('tasks').delete().eq('id', taskToDelete.id);
        
        setIsDeleteModalOpen(false);
        if (error) {
            setNotification({ type: 'error', message: `Erro ao excluir: ${error.message}` });
        } else {
            setNotification({ type: 'success', message: 'Tarefa excluída com sucesso!' });
            setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
        }
        setTaskToDelete(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentTask(prev => ({ ...prev, [name]: value }));
    };

    const filteredTasks = tasks.filter(task => {
        if (!task || task.project_id == null || task.assignee_id == null) return false;
        const statusMatch = filters.status === 'Todos' || task.status === filters.status;
        const projectMatch = filters.project === 'Todos' || task.project_id.toString() === filters.project;
        const assigneeMatch = filters.assignee === 'Todos' || task.assignee_id === filters.assignee;
        return statusMatch && projectMatch && assigneeMatch;
    });

    return (
        <>
            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Gerenciador de Tarefas</h1>
                    <button 
                        onClick={openModalForNew}
                        className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        + Nova Tarefa
                    </button>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <label className="text-sm text-gray-500">Status</label>
                            <select name="status" value={filters.status} onChange={handleFilterChange} className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1">
                                <option value="Todos">Todos</option>
                                <option value="Pendente">Pendente</option>
                                <option value="Em Andamento">Em Andamento</option>
                                <option value="Concluída">Concluída</option>
                                <option value="Atrasada">Atrasada</option>
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 mt-2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <label className="text-sm text-gray-500">Projeto</label>
                            <select name="project" value={filters.project} onChange={handleFilterChange} className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1">
                                <option value="Todos">Todos</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                             <ChevronDownIcon className="absolute right-3 top-1/2 mt-2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <label className="text-sm text-gray-500">Responsável</label>
                            <select name="assignee" value={filters.assignee} onChange={handleFilterChange} className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1">
                                <option value="Todos">Todos</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                            </select>
                             <ChevronDownIcon className="absolute right-3 top-1/2 mt-2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {loading ? <p className="text-center text-gray-500">Carregando tarefas...</p> : (
                    <div className="space-y-4">
                        {filteredTasks.map((task) => {
                            const { border, select } = getStatusClasses(task.status);
                            return (
                                <div key={task.id} className={`bg-white rounded-lg shadow-md p-4 border-l-[5px] ${border}`}>
                                    {/* Top section: Project & Assignee */}
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-lg text-blue-800">{task.projects?.title || 'Projeto não encontrado'}</p>
                                        <div className="flex items-center">
                                            <span className="text-sm font-semibold text-gray-700 mr-2">{task.users?.full_name || 'N/A'}</span>
                                            <img src={task.users?.avatar_url || `https://i.pravatar.cc/150?u=${task.assignee_id}`} alt={task.users?.full_name || 'Avatar'} className="h-8 w-8 rounded-full object-cover" />
                                        </div>
                                    </div>
                
                                    {/* Middle section: Title & Description */}
                                    <div className="my-3">
                                        <p className="font-bold text-lg text-gray-800">{task.title}</p>
                                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                    </div>
                
                                    {/* Bottom section: Date, Status, Actions */}
                                    <div className="flex justify-end items-center space-x-4 pt-3 mt-2 border-t border-gray-100">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <CalendarIcon className="h-4 w-4 mr-1.5"/>
                                            <span>Venc.: {formatDate(task.due_date)}</span>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={task.status}
                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                className={`appearance-none rounded-md py-1 pl-3 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-1 ${select}`}
                                            >
                                                <option value="Pendente">Pendente</option>
                                                <option value="Em Andamento">Em Andamento</option>
                                                <option value="Concluída">Concluída</option>
                                                <option value="Atrasada">Atrasada</option>
                                            </select>
                                            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
                                        </div>
                                        <button onClick={() => openModalForEdit(task)} className="text-gray-400 hover:text-blue-600" title="Editar Tarefa"><PencilIcon className="h-5 w-5"/></button>
                                        <button onClick={() => openDeleteModal(task)} className="text-gray-400 hover:text-red-600" title="Excluir Tarefa"><TrashIcon className="h-5 w-5"/></button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
            
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={isEditing ? 'Editar Tarefa' : 'Adicionar Nova Tarefa'}
                size="2xl"
            >
                <form onSubmit={handleSubmit}>
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm" role="alert">{error}</div>}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título da Tarefa</label>
                            <input type="text" name="title" value={currentTask.title || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <textarea name="description" value={currentTask.description || ''} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
                                <select name="project_id" value={currentTask.project_id || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                    <option value="">Selecione um projeto</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                                <select name="assignee_id" value={currentTask.assignee_id || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                    <option value="">Selecione um responsável</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                                <input type="date" name="start_date" value={currentTask.start_date || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento (Crítica)</label>
                                <input type="date" name="due_date" value={currentTask.due_date || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Término</label>
                                <input type="date" name="end_date" value={currentTask.end_date || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t mt-6">
                        <button type="button" onClick={closeModal} className="mr-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" disabled={saving}>
                        Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400" disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </Modal>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão de Tarefa"
                message={<>Tem certeza que deseja excluir a tarefa <strong>"{taskToDelete?.title}"</strong>?</>}
            />
        </>
    );
}

export default Tarefas;