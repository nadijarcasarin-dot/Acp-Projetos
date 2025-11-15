import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import BarChartCard from '../components/BarChartCard';
import type { ChartData } from '../types';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { supabase } from '../lib/supabaseClient';

const COLORS = ['#6b7280', '#3b82f6', '#ef4444', '#10b981']; // Pendente, Em Andamento, Atrasado, Concluído
const CHART_LABELS = ['Pendente', 'Em Andamento', 'Atrasado', 'Concluído'];

// --- Helper Functions for Data Processing ---

const processProjectStatus = (projects: any[]): ChartData[] => {
    const projectCounts: Record<string, number> = { 'Pendente': 0, 'Em Andamento': 0, 'Atrasado': 0, 'Concluído': 0 };
    (projects || []).forEach(p => {
      if (p && p.status) {
        const status = p.status === 'Em andamento' ? 'Em Andamento' : p.status;
        if (projectCounts.hasOwnProperty(status)) projectCounts[status]++;
      }
    });
    return CHART_LABELS.map(label => ({ name: label, value: projectCounts[label] }));
};

const processTaskStatus = (tasks: any[]): ChartData[] => {
    const taskCounts: Record<string, number> = { 'Pendente': 0, 'Em Andamento': 0, 'Atrasado': 0, 'Concluído': 0 };
    (tasks || []).forEach(t => {
      if (t && t.status) {
        let status = t.status;
        if (status === 'Em Andamento') status = 'Em Andamento';
        else if (status === 'Atrasada') status = 'Atrasado';
        else if (status === 'Concluída') status = 'Concluído';
        if (taskCounts.hasOwnProperty(status)) taskCounts[status]++;
      }
    });
    return CHART_LABELS.map(label => ({ name: label, value: taskCounts[label] }));
};

const processProjectsByUser = (projects: any[]) => {
    const managerCounts = (projects || []).reduce((acc, project) => {
      const managerName = project?.users?.full_name;
      if (managerName) acc[managerName] = (acc[managerName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(managerCounts).map(([name, projects]) => ({ name, projects }));
};

const processTasksByUser = (tasks: any[]) => {
    const userTaskCounts = (tasks || []).reduce((acc, task) => {
        const userName = task?.users?.full_name;
        if (userName) acc[userName] = (acc[userName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(userTaskCounts).map(([name, tasks]) => ({ name, tasks }));
};

// --- Components ---

const AiButton: React.FC = () => (
    <div className="border-t mt-4 pt-4">
        <button className="flex items-center justify-center w-full py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg">
            <SparklesIcon className="h-4 w-4 mr-2"/>
            Análise com IA
        </button>
    </div>
);

const CustomDonutCard: React.FC<{data: ChartData[], colors: string[]}> = ({data, colors}) => (
    <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
             <Legend iconType="square" iconSize={10} verticalAlign="bottom" align="center" />
          </PieChart>
        </ResponsiveContainer>
      </div>
)

const Relatorios: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [projectList, setProjectList] = useState<{ id: number; title: string }[]>([]);

  const [selectedProject, setSelectedProject] = useState('Todos');

  const [projectStatusData, setProjectStatusData] = useState<ChartData[]>([]);
  const [taskStatusData, setTaskStatusData] = useState<ChartData[]>([]);
  const [projectsByUserData, setProjectsByUserData] = useState<any[]>([]);
  const [tasksByUserData, setTasksByUserData] = useState<any[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          supabase.from('projects').select('id, title, status, users:manager_id(full_name)').abortSignal(signal),
          supabase.from('tasks').select('status, project_id, users:assignee_id(full_name)').abortSignal(signal)
        ]);

        if (signal.aborted) return;

        const { data: projectsData, error: projectsError } = projectsRes;
        if (projectsError) throw projectsError;
        
        const { data: tasksData, error: tasksError } = tasksRes;
        if (tasksError) throw tasksError;
        
        const sanitizedProjects = (projectsData || []).map(p => ({
          ...p,
          users: p.users || { full_name: 'Responsável Indefinido' }
        }));
        setAllProjects(sanitizedProjects);
        setProjectList(sanitizedProjects.map(p => ({ id: p.id, title: p.title })));

        const sanitizedTasks = (tasksData || []).map(t => ({
          ...t,
          users: t.users || { full_name: 'Responsável Indefinido' }
        }));
        setAllTasks(sanitizedTasks);

      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(`Falha ao carregar dados dos relatórios: ${err.message}`);
        }
      } finally {
        if (!signal.aborted) {
            setLoading(false);
        }
      }
    };
    fetchInitialData();

    return () => {
        controller.abort();
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    setProjectStatusData(processProjectStatus(allProjects));
    setProjectsByUserData(processProjectsByUser(allProjects));
  }, [allProjects, loading]);
  
  useEffect(() => {
    if(loading) return;
    const tasksToProcess = selectedProject === 'Todos'
        ? allTasks
        : allTasks.filter(t => t.project_id?.toString() === selectedProject);
    setTaskStatusData(processTaskStatus(tasksToProcess));
    setTasksByUserData(processTasksByUser(tasksToProcess));
  }, [allTasks, selectedProject, loading]);

  if (loading) return <div className="p-6 text-center text-gray-500">Carregando relatórios...</div>;
  if (error) return <div className="p-6 text-center text-red-500 bg-red-100 rounded-lg">{error}</div>;
  
  const selectedProjectTitle = projectList.find(p => p.id.toString() === selectedProject)?.title;

  return (
    <div className="p-6">
       <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>
            <div className="relative">
                <label className="text-sm font-medium text-gray-700 mr-2">Filtrar por Projeto:</label>
                <select 
                    value={selectedProject} 
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="Todos">Todos os Projetos</option>
                    {projectList.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
        </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Status por Projetos</h3>
                <div className="flex-grow">
                    <CustomDonutCard data={projectStatusData} colors={COLORS} />
                </div>
                <AiButton />
            </div>
             <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Status por Tarefas {selectedProject !== 'Todos' && <span className="text-base font-normal text-gray-500">- {selectedProjectTitle}</span>}
                </h3>
                <div className="flex-grow">
                    <CustomDonutCard data={taskStatusData} colors={COLORS} />
                </div>
                <AiButton />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                <div className="flex-grow">
                    <BarChartCard title="Projetos por Usuários" data={projectsByUserData} barColor="#3b82f6" dataKey="projects" />
                </div>
                 <AiButton />
            </div>
             <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Tarefas por Usuário {selectedProject !== 'Todos' && <span className="text-base font-normal text-gray-500">- {selectedProjectTitle}</span>}
                </h3>
                <div className="flex-grow">
                    <BarChartCard title="" data={tasksByUserData} barColor="#3b82f6" dataKey="tasks" />
                </div>
                <AiButton />
            </div>
       </div>
    </div>
  );
};

export default Relatorios;
