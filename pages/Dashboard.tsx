
import React from 'react';
import DonutChartCard from '../components/DonutChartCard';
import BarChartCard from '../components/BarChartCard';
import type { ChartData, BarChartData } from '../types';

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

const teamWorkloadData: BarChartData[] = [
    { name: 'Mariana Alves', tasks: 2 },
    { name: 'Lucas Martins', tasks: 4 },
    { name: 'Fernanda Lima', tasks: 3 },
    { name: 'Roberto Silva', tasks: 3 },
    { name: 'Juliana Costa', tasks: 4 },
    { name: 'Carlos Pereira', tasks: 5 },
    { name: 'Ana Lúcia', tasks: 3 },
];

const COLORS = ['#6b7280', '#3b82f6', '#ef4444', '#10b981'];


const Dashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DonutChartCard title="Status por Projeto" data={projectStatusData} colors={COLORS} />
        <DonutChartCard title="Status por Tarefa" data={taskStatusData} colors={COLORS} />
        <div className="md:col-span-2">
            <BarChartCard title="Carga de Trabalho da Equipe" data={teamWorkloadData} barColor="#3b82f6" dataKey="tasks" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
