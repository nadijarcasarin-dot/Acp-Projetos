// FIX: Import React to make React types available in this file.
import React from 'react';

export type Page = 
  | 'Dashboard'
  | 'Tipos/Nível de Usuários'
  | 'Usuários'
  | 'Cargos de Usuário'
  | 'Empresas'
  | 'Permissões'
  | 'Projetos'
  | 'Tarefas'
  | 'Kanban de Tarefas'
  | 'Documentos'
  | 'Notificações'
  | 'Relatórios'
  | 'Configurações'
  | 'Sair';

export type ProjectStatus = 'Pendente' | 'Em andamento' | 'Concluído' | 'Atrasado';
export type TaskStatus = 'Pendente' | 'Em Andamento' | 'Concluída' | 'Atrasada';


export interface NavItem {
  name: Page;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface BarChartData {
  name:string;
  tasks: number;
}
