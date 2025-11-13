
import React, { useState } from 'react';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { InformationCircleIcon } from '../components/icons/InformationCircleIcon';
import Modal from '../components/Modal';

// Mock data copied from Tarefas.tsx for the modal
const emptyTaskForm = {
    title: '',
    description: '',
    project: '',
    assignee: '',
    startDate: '',
    dueDate: '',
    endDate: '',
};

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
    { name: 'Mariana Alves', avatar: 'https://i.pravatar.cc/150?img=12'},
    { name: 'Lucas Martins', avatar: 'https://i.pravatar.cc/150?img=11'},
];


interface Task {
    id: number;
    title: string;
    description: string;
    assignee: string; // avatar url
    dueDate: string;
}

interface KanbanData {
    'Pendente': Task[];
    'Em Andamento': Task[];
    'Concluída': Task[];
    'Atrasada': Task[];
}


const initialKanbanData: KanbanData = {
  'Pendente': [
    { id: 1, title: 'Relatório de impacto ambiental', description: 'Documentação dos efeitos do novo produto.', assignee: 'https://i.pravatar.cc/150?img=12', dueDate: '30/08/24' },
    { id: 2, title: 'Elaboração do relatório final', description: 'Consolidação de todas as informações da auditoria.', assignee: 'https://i.pravatar.cc/150?img=11', dueDate: '10/08/24' },
  ],
  'Em Andamento': [
    { id: 3, title: 'Análise de custos de produção', description: 'Levantamento de custos com fornecedores.', assignee: 'https://i.pravatar.cc/150?img=2', dueDate: '15/08/24' },
  ],
  'Concluída': [
    { id: 4, title: 'Pesquisa de componentes químicos', description: 'Análise de artigos científicos e patentes.', assignee: 'https://i.pravatar.cc/150?img=5', dueDate: '15/06/24' },
    { id: 5, title: 'Testes em laboratório - Fase 1', description: 'Primeira rodada de testes com a fórmula A.', assignee: 'https://i.pravatar.cc/150?img=10', dueDate: '30/07/24' },
  ],
  'Atrasada': [
    { id: 6, title: 'Inspeção de campo', description: 'Visita às instalações para verificar procedimentos.', assignee: 'https://i.pravatar.cc/150?img=1', dueDate: '25/07/24' },
  ],
};

const columnStyles = {
    'Pendente': { title: 'Pendente', color: 'gray-500' },
    'Em Andamento': { title: 'Em Andamento', color: 'blue-500' },
    'Concluída': { title: 'Concluída', color: 'green-500' },
    'Atrasada': { title: 'Atrasada', color: 'red-500' },
}

const KanbanTaskCard: React.FC<{task: Task, columnTitle: string, handleDragStart: (e: React.DragEvent, taskId: number, sourceColumn: string) => void }> = ({ task, columnTitle, handleDragStart }) => (
    <div 
      className="bg-white p-4 rounded-lg shadow-sm mb-4 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => handleDragStart(e, task.id, columnTitle)}
    >
        <h4 className="font-bold text-gray-800">{task.title}</h4>
        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
        <div className="flex justify-between items-center mt-4">
            <div className="flex items-center text-sm text-gray-500">
                <img src={task.assignee} className="h-6 w-6 rounded-full mr-2" alt="" />
                <span>Venc.: {task.dueDate}</span>
            </div>
            <button>
                <InformationCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
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
                {tasks.map(task => <KanbanTaskCard key={task.id} task={task} columnTitle={title} handleDragStart={handleDragStart} />)}
            </div>
        </div>
    );
};


const Kanban: React.FC = () => {
  const [boardData, setBoardData] = useState<KanbanData>(initialKanbanData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState(emptyTaskForm);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    const assigneeData = mockResponsaveis.find(r => r.name === newTask.assignee);
    if (newTask.title && newTask.project && assigneeData && newTask.dueDate) {
        const taskToAdd: Task = {
            id: Date.now(),
            title: newTask.title,
            description: newTask.description,
            assignee: assigneeData.avatar,
            dueDate: new Date(newTask.dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
        };
        setBoardData(prev => ({
          ...prev,
          'Pendente': [...prev['Pendente'], taskToAdd],
        }));
        setNewTask(emptyTaskForm);
        setIsModalOpen(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: number, sourceColumn: string) => {
    e.dataTransfer.setData('taskId', taskId.toString());
    e.dataTransfer.setData('sourceColumn', sourceColumn);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    const sourceColumn = e.dataTransfer.getData('sourceColumn');

    if (sourceColumn === targetColumn) return;

    let draggedTask: Task | undefined;
    const newBoardData = { ...boardData };

    const sourceTasks = [...newBoardData[sourceColumn as keyof KanbanData]];
    const taskIndex = sourceTasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        [draggedTask] = sourceTasks.splice(taskIndex, 1);
        newBoardData[sourceColumn as keyof KanbanData] = sourceTasks;
    }

    if (!draggedTask) return;

    const targetTasks = [...newBoardData[targetColumn as keyof KanbanData]];
    targetTasks.push(draggedTask);
    newBoardData[targetColumn as keyof KanbanData] = targetTasks;
    
    setBoardData(newBoardData);
  };
  
  const handleColumnDragOver = (e: React.DragEvent, columnTitle: string) => {
    e.preventDefault();
    setDraggedOverColumn(columnTitle);
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOverColumn(null);
  }


  return (
    <>
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quadro Kanban</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
             <select className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Todos os Projetos</option>
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
        {Object.entries(boardData).map(([title, tasks]) => (
            <KanbanColumn 
                key={title} 
                title={title} 
                tasks={tasks} 
                isDraggedOver={draggedOverColumn === title}
                handleDragStart={handleDragStart}
                handleDragOver={(e) => handleColumnDragOver(e, title)}
                handleDrop={handleDrop}
                handleDragLeave={handleDragLeave}
            />
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
};

export default Kanban;
