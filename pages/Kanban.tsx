import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { InformationCircleIcon } from '../components/icons/InformationCircleIcon';
import Modal from '../components/Modal';
import Notification from '../components/Notification';

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
  // FIX: Added start_date and end_date to the Task interface.
  start_date: string;
  due_date: string;
  end_date: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluída' | 'Atrasada';
  projects: Project | null;
  users: User | null;
}

const emptyTaskForm: Partial<Task> = {
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
  // FIX: Corrected typo from toLocale-string to toLocaleDateString.
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};


const columnStyles: Record<string, { title: string; color: string }> = {
    'Pendente': { title: 'Pendente', color: 'gray-500' },
    'Em Andamento': { title: 'Em Andamento', color: 'blue-500' },
    'Concluída': { title: 'Concluída', color: 'green-500' },
    'Atrasada': { title: 'Atrasada', color: 'red-500' },
};
const statusColumns = ['Pendente', 'Em Andamento', 'Concluída', 'Atrasada'];

const KanbanTaskCard: React.FC<{
  task: Task, 
  handleDragStart: (e: React.DragEvent, taskId: number, sourceColumn: string) => void 
}> = ({ task, handleDragStart }) => (
    <div 
      className="bg-white p-4 rounded-lg shadow-sm mb-4 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => handleDragStart(e, task.id, task.status)}
    >
        <h4 className="font-bold text-gray-800 text-sm">{task.title}</h4>
        <p className="text-xs text-gray-500 mt-1 mb-3">{task.projects?.title}</p>
        <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-500">
                <span className="text-xs">Venc.: {formatDate(task.due_date)}</span>
            </div>
            <img 
              src={task.users?.avatar_url || `https://i.pravatar.cc/150?u=${task.assignee_id}`} 
              className="h-6 w-6 rounded-full" 
              alt={task.users?.full_name || ''} 
              title={task.users?.full_name || 'Responsável'}
            />
        </div>
    </div>
);


const KanbanColumn: React.FC<{
  title: string, 
  tasks: Task[], 
  isDraggedOver: boolean,
  handleDragStart: (e: React.DragEvent, taskId: number, sourceColumn: string) => void,
  handleDragOver: (e: React.DragEvent) => void,
  handleDrop: (e: React.DragEvent, targetColumn: string) => void,
  handleDragLeave: (e: React.DragEvent) => void,
}> = ({ title, tasks, isDraggedOver, handleDragStart, handleDragOver, handleDrop, handleDragLeave }) => {
    const style = columnStyles[title as keyof typeof columnStyles];
    const borderClass = `border-${style.color}`;
    
    return (
        <div 
          className={`bg-gray-100 rounded-lg p-3 flex-1 min-w-[280px] transition-colors duration-200 ${isDraggedOver ? 'bg-blue-100' : ''}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, title)}
          onDragLeave={handleDragLeave}
        >
            <div className={`flex justify-between items-center mb-4 pb-2 border-b-2 ${borderClass}`}>
                <h3 className="font-semibold text-gray-700">{style.title}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">{tasks.length}</span>
            </div>
            <div>
                {tasks.map(task => <KanbanTaskCard key={task.id} task={task} handleDragStart={handleDragStart} />)}
            </div>
        </div>
    );
};


const Kanban: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [selectedProject, setSelectedProject] = useState('Todos');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState<Partial<Task>>(emptyTaskForm);
    const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

        const fetchData = async () => {
            setLoading(true);
            try {
                const [tasksRes, projectsRes, usersRes] = await Promise.all([
                    supabase.from('tasks').select('*, projects(id, title), users(id, full_name, avatar_url)').abortSignal(signal),
                    supabase.from('projects').select('id, title').order('title').abortSignal(signal),
                    supabase.from('users').select('id, full_name, avatar_url').order('full_name').abortSignal(signal),
                ]);

                if (signal.aborted) return;
                
                const { data: tasksData, error: tasksError } = tasksRes;
                if (tasksError) throw tasksError;

                const { data: projectsData, error: projectsError } = projectsRes;
                if (projectsError) throw projectsError;

                const { data: usersData, error: usersError } = usersRes;
                if (usersError) throw usersError;
                
                const sanitizedTasks = (tasksData || []).map(task => ({
                    ...task,
                    projects: task.projects || { id: task.project_id, title: 'Projeto Indefinido' },
                    users: task.users || { id: task.assignee_id, full_name: 'Responsável Indefinido', avatar_url: '' }
                }));
                setTasks((sanitizedTasks as Task[]) || []);
                setProjects(projectsData || []);
                setUsers(usersData || []);

            } catch (err: any) {
                let errorMessage = `Falha ao buscar dados: ${err.message}`;
                if (err.name === 'AbortError') {
                    errorMessage = 'A requisição demorou muito. Verifique sua conexão e tente novamente.';
                }
                setNotification({ type: 'error', message: errorMessage });
            } finally {
                if (!signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, []);
  
    const handleAddNewTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const taskData = { ...newTask, status: 'Pendente' };
        
        const { data, error } = await supabase
            .from('tasks')
            .insert([taskData])
            .select('*, projects(id, title), users(id, full_name, avatar_url)')
            .single();

        if (error) {
            setNotification({ type: 'error', message: `Erro ao criar tarefa: ${error.message}` });
        } else if (data) {
            const projectRelation = data.projects;
            const userRelation = data.users;
            const sanitizedTask = {
                ...data,
                projects: (projectRelation && typeof projectRelation === 'object' && !Array.isArray(projectRelation))
                    ? projectRelation
                    : { id: data.project_id, title: 'Projeto Indefinido' },
                users: (userRelation && typeof userRelation === 'object' && !Array.isArray(userRelation))
                    ? userRelation
                    : { id: data.assignee_id, full_name: 'Responsável Indefinido', avatar_url: '' }
            };

            setTasks(prev => [...prev, sanitizedTask as Task]);
            setNotification({ type: 'success', message: 'Tarefa criada com sucesso!' });
            setIsModalOpen(false);
            setNewTask(emptyTaskForm);
        }
    };

    const handleDragStart = (e: React.DragEvent, taskId: number, sourceColumn: string) => {
        e.dataTransfer.setData('taskId', taskId.toString());
        e.dataTransfer.setData('sourceStatus', sourceColumn);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        setDraggedOverColumn(null);
        const taskId = parseInt(e.dataTransfer.getData('taskId'));
        const sourceStatus = e.dataTransfer.getData('sourceStatus');

        if (sourceStatus === targetStatus) return;

        const originalTasks = [...tasks];
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, status: targetStatus as Task['status'] } : t
        );
        setTasks(updatedTasks);

        const { error } = await supabase
            .from('tasks')
            .update({ status: targetStatus })
            .eq('id', taskId);

        if (error) {
            setTasks(originalTasks);
            setNotification({ type: 'error', message: `Falha ao mover tarefa: ${error.message}` });
        } else {
            setNotification({ type: 'success', message: 'Tarefa movida com sucesso!' });
        }
    };
  
    const handleColumnDragOver = (e: React.DragEvent, columnTitle: string) => {
        e.preventDefault();
        setDraggedOverColumn(columnTitle);
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDraggedOverColumn(null);
    }
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
    };

    const filteredTasks = tasks.filter(task => {
        if (!task || task.project_id == null) return false;
        return selectedProject === 'Todos' || task.project_id.toString() === selectedProject;
    });

    const boardData = statusColumns.reduce((acc, status) => {
        acc[status] = filteredTasks.filter(task => task.status === status);
        return acc;
    }, {} as Record<string, Task[]>);


    return (
        <>
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Quadro Kanban</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                 <select 
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 >
                    <option value="Todos">Todos os Projetos</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                + Adicionar Tarefa
              </button>
            </div>
          </div>

          <div className="flex space-x-4 overflow-x-auto pb-4">
            {loading ? <p className="text-center text-gray-500 w-full py-8">Carregando quadro...</p> : (
                statusColumns.map((title) => (
                    <KanbanColumn 
                        key={title} 
                        title={title} 
                        tasks={boardData[title] || []} 
                        isDraggedOver={draggedOverColumn === title}
                        handleDragStart={handleDragStart}
                        handleDragOver={(e) => handleColumnDragOver(e, title)}
                        handleDrop={handleDrop}
                        handleDragLeave={handleDragLeave}
                    />
                ))
            )}
          </div>
        </div>

        <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Adicionar Nova Tarefa"
            size="2xl"
        >
            <form onSubmit={handleAddNewTask}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título da Tarefa</label>
                        <input type="text" name="title" value={newTask.title || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea name="description" value={newTask.description || ''} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
                            <select name="project_id" value={newTask.project_id || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">Selecione um projeto</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                            <select name="assignee_id" value={newTask.assignee_id || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">Selecione um responsável</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                            <input type="date" name="start_date" value={newTask.start_date || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                            <input type="date" name="due_date" value={newTask.due_date || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Término</label>
                            <input type="date" name="end_date" value={newTask.end_date || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

export default Kanban;