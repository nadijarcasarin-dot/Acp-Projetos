
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import BarChartCard from '../components/BarChartCard';
import type { ChartData } from '../types';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';

const projectStatusData: ChartData[] = [
  { name: 'Pendente', value: 4 },
  { name: 'Em Andamento', value: 12 },
  { name: 'Atrasado', value: 2 },
  { name: 'Concluído', value: 18 },
];

const taskStatusData: ChartData[] = [
  { name: 'Pendente', value: 8 },
  { name: 'Em Andamento', value: 15 },
  { name: 'Atrasado', value: 3 },
  { name: 'Concluída', value: 25 },
];

const projectsByUserData = [
    { name: 'Fernanda Lima', projects: 4 },
    { name: 'Roberto Silva', projects: 5 },
    { name: 'Juliana Costa', projects: 6 },
    { name: 'Carlos Pereira', projects: 7 },
    { name: 'Ana Lúcia', projects: 4 },
];

const tasksByUserData = [
    { name: 'Mariana Alves', tasks: 2 },
    { name: 'Lucas Martins', tasks: 9 },
    { name: 'Fernanda Lima', tasks: 6 },
    { name: 'Roberto Silva', tasks: 8 },
    { name: 'Juliana Costa', tasks: 10 },
    { name: 'Carlos Pereira', tasks: 11 },
    { name: 'Ana Lúcia', tasks: 5 },
];

const COLORS = ['#6b7280', '#3b82f6', '#ef4444', '#10b981'];

const AiButton: React.FC = () => (
    <div className="border-t mt-4 pt-4">
        <button className="flex items-center justify-center w-full py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg">
            <SparklesIcon className="h-4 w-4 mr-2"/>
            Análise com IA
        </button>
    </div>
);

const FilterableCardHeader: React.FC<{title: string}> = ({ title }) => (
    <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="relative">
            <select className="appearance-none bg-gray-100 border border-gray-200 rounded-md py-1 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Todos os Projetos</option>
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        </div>
    </div>
);

const CustomDonutCard: React.FC<{title:string, data: ChartData[], colors: string[]}> = ({title, data, colors}) => (
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
  return (
    <div className="p-6">
       <h1 className="text-3xl font-bold text-gray-800 mb-6">Relatórios</h1>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Status por Projetos</h3>
                <div className="flex-grow">
                    <CustomDonutCard data={projectStatusData} colors={COLORS} title="Status por Projetos" />
                </div>
                <AiButton />
            </div>
             <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                <FilterableCardHeader title="Status por Tarefas" />
                <div className="flex-grow">
                    <CustomDonutCard data={taskStatusData} colors={COLORS} title="Status por Tarefas" />
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
                <div className="flex-grow">
                    <FilterableCardHeader title="Tarefas por Usuário" />
                    <BarChartCard title="" data={tasksByUserData} barColor="#3b82f6" dataKey="tasks" />
                </div>
                <AiButton />
            </div>
       </div>
    </div>
  );
};

export default Relatorios;
