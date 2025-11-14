import React, { useState, useEffect } from 'react';
import DonutChartCard from '../components/DonutChartCard';
import BarChartCard from '../components/BarChartCard';
import type { ChartData, BarChartData } from '../types';
import { supabase } from '../lib/supabaseClient';

const COLORS = ['#6b7280', '#3b82f6', '#ef4444', '#10b981']; // Pendente, Em Andamento, Atrasado, Concluído
const CHART_LABELS = ['Pendente', 'Em Andamento', 'Atrasado', 'Concluído'];

const Dashboard: React.FC = () => {
    const [projectStatusData, setProjectStatusData] = useState<ChartData[]>([]);
    const [taskStatusData, setTaskStatusData] = useState<ChartData[]>([]);
    const [teamWorkloadData, setTeamWorkloadData] = useState<BarChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [projectsRes, tasksRes] = await Promise.all([
                    supabase.from('projects').select('status').abortSignal(signal),
                    supabase.from('tasks').select('status, users(full_name)').abortSignal(signal)
                ]);

                if (signal.aborted) return;

                const { data: projects, error: projectsError } = projectsRes;
                if (projectsError) throw projectsError;

                const { data: tasks, error: tasksError } = tasksRes;
                if (tasksError) throw tasksError;

                // Process project status data
                const projectCounts: Record<string, number> = { 'Pendente': 0, 'Em Andamento': 0, 'Atrasado': 0, 'Concluído': 0 };
                (projects || []).forEach(p => {
                    if (p && p.status) {
                        if (p.status === 'Em andamento') {
                            projectCounts['Em Andamento']++;
                        } else if (projectCounts.hasOwnProperty(p.status)) {
                            projectCounts[p.status]++;
                        }
                    }
                });
                setProjectStatusData(CHART_LABELS.map(label => ({ name: label, value: projectCounts[label] })));

                // Process task status data
                const taskCounts: Record<string, number> = { 'Pendente': 0, 'Em Andamento': 0, 'Atrasado': 0, 'Concluído': 0 };
                (tasks || []).forEach(t => {
                    if (t && t.status) {
                        if (t.status === 'Em Andamento') taskCounts['Em Andamento']++;
                        else if (t.status === 'Atrasada') taskCounts['Atrasado']++;
                        else if (t.status === 'Concluída') taskCounts['Concluído']++;
                        else if (taskCounts.hasOwnProperty(t.status)) {
                            taskCounts[t.status]++;
                        }
                    }
                });
                setTaskStatusData(CHART_LABELS.map(label => ({ name: label, value: taskCounts[label] })));
                
                // Process team workload data
                const workloadCounts = (tasks || []).reduce((acc: Record<string, number>, task: any) => {
                    const userRelation = task?.users;
                    const isUserObject = userRelation && typeof userRelation === 'object' && !Array.isArray(userRelation);
                    const userName = isUserObject ? (userRelation as { full_name: string }).full_name : null;

                    if (typeof userName === 'string' && userName.trim()) {
                        const trimmedName = userName.trim();
                        acc[trimmedName] = (acc[trimmedName] || 0) + 1;
                    }
                    return acc;
                }, {} as Record<string, number>);
                
                const processedWorkloadData = Object.entries(workloadCounts)
                    .map(([name, count]): BarChartData => ({ name, tasks: count as number }))
                    .sort((a, b) => b.tasks - a.tasks);
                setTeamWorkloadData(processedWorkloadData);

            } catch (err: unknown) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    const message = err.message || String(err);
                    setError(`Falha ao carregar dados do dashboard: ${message}`);
                    console.error(err);
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
    
    if (loading) {
        return <div className="p-6 text-center text-gray-500">Carregando dashboard...</div>;
    }
    
    if (error) {
        return <div className="p-6 text-center text-red-500 bg-red-100 rounded-lg">{error}</div>;
    }

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