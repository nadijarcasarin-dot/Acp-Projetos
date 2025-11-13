import React, { useState } from 'react';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import Modal from '../components/Modal';

interface Task {
  project: string;
  title: string;
  description: string;
  assignee: { name: string; avatar: string };
  startDate: string;
  dueDate: string;
  endDate: string;
  status: string;
  color: string;
}

const initialTasks: Task[] = [
    {
      project: 'Desenvolvimento de Novo Herbicida',
      title: 'Pesquisa de componentes químicos',
      description: 'Análise de artigos científicos e patentes.',
      assignee: { name: 'Carla Dias', avatar: 'https://i.pravatar.cc/150?img=5' },
      startDate: '2024-06-01',
      dueDate: '2024-06-15',
      endDate: '2024-06-20',
      status: 'Atrasada',
      color: 'border-red-500'
    },
    {
      project: 'Sistema de Irrigação Inteligente',
      title: 'Compra dos sensores',
      description: 'Aquisição de 50 sensores de umidade.',
      assignee: { name: 'Bruno Costa', avatar: 'https://i.pravatar.cc/150?img=2' },
      startDate: '2024-06-20',
      dueDate: '2024-06-30',
      endDate: '2024-07-05',
      status: 'Em andamento',
      color: 'border-blue-500'
    },
    {
      project: 'Auditoria Ambiental Anual',
      title: 'Coleta de documentos fiscais',
      description: 'Reunir todas as notas fiscais do período.',
      assignee: { name: 'Daniel Souza', avatar: 'https://i.pravatar.cc/150?img=10' },
      startDate: '2024-07-01',
      dueDate: '2024-07-10',
      endDate: '2024-07-15',
      status: 'Concluída',
      color: 'border-green-500'
    },
  ];

const emptyTaskForm = {
    title: '',
    description: '',
    project: '',
    assignee: '',
    startDate: '',
    dueDate: '',
    endDate: '',
};

// Mock data
const mockProjects = [
    'Desenvolvimento de Novo Herbicida',
    'Sistema de Irrigação Inteligente',
    'Auditoria Ambiental Anual',
];
const mockResponsaveis = [
    { name: 'Carla Dias', avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Bruno Costa', avatar: 'https://i.pravatar.cc/150?img=2' },
    { name: 'Daniel Souza', avatar: 'https://i.pravatar.cc/150?img=10' },
    { name: 'Alice Silva', avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Ana Lúcia', avatar: 'https://i.pravatar.cc/150?img=4' },
];

const getStatusClasses = (status: string) => {
    switch(status) {
        case 'Atrasada': return 'bg-red-100 text-red-800';
        case 'Em andamento': return 'bg-blue-100 text-blue-800';
        case 'Concluída': return 'bg-green-100 text-green-800';
        case 'Pendente': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

const FilterSelect: React.FC<{label: string, options: string[]}> = ({label, options}) => (
    <div className="relative">
        <label className="text-sm text-gray-500">{label}</label>
        <select className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1">
            {options.map(opt => <option key={opt}>{opt}</option>)}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 mt-2 h-5 w-5 text-gray-400 pointer-events-none" />
    </div>
);

const Tarefas: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState(emptyTaskForm);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
    };

    const handleAddNewTask = (e: React.FormEvent) => {
        e.preventDefault();
        const assigneeData = mockResponsaveis.find(r => r.name === newTask.assignee);
        if (newTask.title && newTask.project && assigneeData) {
            const taskToAdd: Task = {
                ...newTask,
                assignee: assigneeData,
                status: 'Pendente',
                color: 'border-gray-500'
            };
            setTasks(prev => [taskToAdd, ...prev]);
            setNewTask(emptyTaskForm);
            setIsModalOpen(false);
        }
    };

    return (
        <>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Gerenciador de Tarefas</h1>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        + Nova Tarefa
                    </button>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FilterSelect label="Status" options={['Todos']} />
                        <FilterSelect label="Projeto" options={['Todos']} />
                        <FilterSelect label="Responsável" options={['Todos']} />
                        <FilterSelect label="Ordenar por" options={['Data de Vencimento']} />
                    </div>
                </div>

                <div className="space-y-4">
                    {tasks.map((task, index) => (
                         <div key={`${task.title}-${index}`} className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${task.color}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500">{task.project}</p>
                                    <p className="font-bold text-lg text-gray-800">{task.title}</p>
                                </div>
                                <div className="flex items-center flex-shrink-0">
                                    <div className="text-right">
                                        <p className="font-semibold text-sm text-gray-800">{task.assignee.name}</p>
                                    </div>
                                    <img src={task.assignee.avatar} alt={task.assignee.name} className="h-10 w-10 rounded-full ml-3" />
                                </div>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <p className="text-sm text-gray-600 max-w-md">{task.description}</p>
                                <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
                                    <div className="flex items-center text-xs text-gray-500 space-x-2">
                                        <CalendarIcon className="h-4 w-4"/>
                                        <span>Início: {new Date(task.startDate).toLocaleDateString()}</span>
                                        <span className="font-semibold">Venc.: {new Date(task.dueDate).toLocaleDateString()}</span>
                                        <span>Término: {new Date(task.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="relative">
                                        <select defaultValue={task.status} className={`appearance-none rounded-full py-1 pl-3 pr-8 text-xs font-semibold focus:outline-none ${getStatusClasses(task.status)}`}>
                                            <option>Pendente</option>
                                            <option>Em andamento</option>
                                            <option>Concluída</option>
                                            <option>Atrasada</option>
                                        </select>
                                        <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
                                    </div>
                                    <button className="bg-indigo-600 text-white font-semibold px-3 py-1 rounded-lg hover:bg-indigo-700 text-sm flex items-center whitespace-nowrap">
                                        <SparklesIcon className="h-4 w-4 mr-1"/>
                                        Gerar Análise
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
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
                            <input type="text" name="title" value={newTask.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <textarea name="description" value={newTask.description} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
                                <select name="project" value={newTask.project} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                    <option value="">Selecione um projeto</option>
                                    {mockProjects.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                                <select name="assignee" value={newTask.assignee} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                    <option value="">Selecione um responsável</option>
                                    {mockResponsaveis.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                                <input type="date" name="startDate" value={newTask.startDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento (Crítica)</label>
                                <input type="date" name="dueDate" value={newTask.dueDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Término</label>
                                <input type="date" name="endDate" value={newTask.endDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
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
}

export default Tarefas;
