import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import Notification from '../components/Notification';

// Interfaces
interface User {
  id: string;
  full_name: string;
}

interface Permission {
  id: number;
  name: string;
}

// Frontend definition of permission structure
const permissionGroups = {
  'Gerenciar Projetos': ['Cadastrar', 'Editar', 'Excluir', 'Visualizar'],
  'Gerenciar Tarefas': ['Cadastrar', 'Editar', 'Excluir', 'Alterar Status', 'Gerenciar Kanban', 'Visualizar'],
  'Gerenciar Documentos': ['Cadastrar', 'Editar', 'Excluir', 'Baixar'],
  'Visualizar Relatórios': ['Todos', 'Projetos', 'Tarefas'],
  'Gerenciar Empresas': ['Cadastrar', 'Editar', 'Excluir'],
};

// Component for a single group of permissions
const PermissionGroup: React.FC<{ 
  title: string; 
  permissions: (Permission & { shortName: string })[];
  checkedPermissionIds: Set<number>;
  onPermissionChange: (permissionId: number, isChecked: boolean) => void;
}> = ({ title, permissions, checkedPermissionIds, onPermissionChange }) => (
  <div className="bg-gray-50 p-4 rounded-lg h-full">
    <h3 className="font-bold text-gray-700 mb-3">{title}</h3>
    <div className="space-y-2">
      {permissions.map(permission => (
          <label key={permission.id} className="flex items-center">
            <input 
              type="checkbox" 
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
              checked={checkedPermissionIds.has(permission.id)}
              onChange={(e) => onPermissionChange(permission.id, e.target.checked)}
            />
            <span className="ml-2 text-sm text-gray-600">{permission.shortName}</span>
          </label>
      ))}
    </div>
  </div>
);


const Permissoes: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [currentUserPermissionIds, setCurrentUserPermissionIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const syncAndFetchPermissions = useCallback(async (signal: AbortSignal) => {
        const allPermissionNames = Object.entries(permissionGroups).flatMap(([group, perms]) => 
            perms.map(p => `${group}.${p}`)
        );
        
        const { data: existingPermissions, error: fetchError } = await supabase.from('permissions').select('name').abortSignal(signal);
        if (fetchError) throw new Error(`Falha ao buscar permissões existentes: ${fetchError.message}`);

        const existingNames = new Set(existingPermissions.map(p => p.name));
        const missingPermissions = allPermissionNames
            .filter(name => !existingNames.has(name))
            .map(name => ({ name }));

        if (missingPermissions.length > 0) {
            const { error: insertError } = await supabase.from('permissions').insert(missingPermissions);
            if (insertError) throw new Error(`Falha ao inserir novas permissões: ${insertError.message}`);
        }

        const { data: allPerms, error: fetchAllError } = await supabase.from('permissions').select('id, name').abortSignal(signal);
        if (fetchAllError) throw new Error(`Falha ao buscar todas as permissões: ${fetchAllError.message}`);
        
        if (!signal.aborted) {
            setAllPermissions(allPerms || []);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchData = async () => {
            setLoading(true);
            try {
                await syncAndFetchPermissions(signal);
                if (signal.aborted) return;
                
                const { data: usersData, error: usersError } = await supabase.from('users').select('id, full_name').order('full_name').abortSignal(signal);
                if (usersError) throw usersError;

                if (!signal.aborted) {
                    setUsers(usersData || []);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setNotification({ type: 'error', message: err.message });
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
    }, [syncAndFetchPermissions]);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchUserPermissions = async () => {
            if (!selectedUserId) {
                setCurrentUserPermissionIds(new Set());
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('user_permissions')
                    .select('permission_id')
                    .eq('user_id', selectedUserId)
                    .abortSignal(signal);

                if (error) throw error;
                if (!signal.aborted) {
                    setCurrentUserPermissionIds(new Set(data.map(p => p.permission_id)));
                }
            } catch (error: any) {
                 if (error.name !== 'AbortError') {
                    setNotification({ type: 'error', message: `Erro ao buscar permissões do usuário: ${error.message}` });
                    setCurrentUserPermissionIds(new Set());
                 }
            }
        };
        fetchUserPermissions();
        
        return () => {
            controller.abort();
        };
    }, [selectedUserId]);

    const handlePermissionChange = (permissionId: number, isChecked: boolean) => {
        setCurrentUserPermissionIds(prev => {
            const newPermissions = new Set(prev);
            isChecked ? newPermissions.add(permissionId) : newPermissions.delete(permissionId);
            return newPermissions;
        });
    };

    const handleSelectAll = (isChecked: boolean) => {
        isChecked 
            ? setCurrentUserPermissionIds(new Set(allPermissions.map(p => p.id)))
            : setCurrentUserPermissionIds(new Set());
    };

    const handleSave = async () => {
        if (!selectedUserId) {
            setNotification({ type: 'error', message: 'Por favor, selecione um usuário.' });
            return;
        }
        setSaving(true);

        const { error: deleteError } = await supabase.from('user_permissions').delete().eq('user_id', selectedUserId);
        
        if (deleteError) {
            setSaving(false);
            setNotification({ type: 'error', message: `Erro ao atualizar: ${deleteError.message}` });
            return;
        }

        if (currentUserPermissionIds.size > 0) {
            const newPermissions = Array.from(currentUserPermissionIds).map(permission_id => ({
                user_id: selectedUserId,
                permission_id,
            }));
            const { error: insertError } = await supabase.from('user_permissions').insert(newPermissions);
            if (insertError) {
                setSaving(false);
                setNotification({ type: 'error', message: `Erro ao salvar: ${insertError.message}` });
                return;
            }
        }
        
        setSaving(false);
        setNotification({ type: 'success', message: 'Permissões salvas com sucesso!' });
    };

    const permissionsByGroup = allPermissions.reduce((acc, perm) => {
        if (typeof perm?.name !== 'string') return acc; // Robustness check
        const [group, ...nameParts] = perm.name.split('.');
        const shortName = nameParts.join('.');
        if (!acc[group]) acc[group] = [];
        acc[group].push({ ...perm, shortName });
        return acc;
    }, {} as Record<string, (Permission & { shortName: string })[]>);

    const allChecked = allPermissions.length > 0 && currentUserPermissionIds.size === allPermissions.length;

    return (
        <>
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Permissões</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6 max-w-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar Usuário</label>
                    <div className="relative">
                        <select 
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            <option value="">{loading ? 'Carregando...' : 'Selecione um usuário...'}</option>
                            {users.map(user => <option key={user.id} value={user.id}>{user.full_name}</option>)}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                </div>
                
                {selectedUserId && (
                    <>
                        <div className="mb-6 pb-6 border-b">
                            <label className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    checked={allChecked}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                                <span className="ml-2 text-sm text-gray-800 font-medium">Selecionar Todas</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {Object.entries(permissionsByGroup).map(([title, permissions]) => (
                                <PermissionGroup 
                                    key={title}
                                    title={title} 
                                    permissions={permissions} 
                                    checkedPermissionIds={currentUserPermissionIds}
                                    onPermissionChange={handlePermissionChange}
                                />
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t flex justify-end">
                            <button 
                                onClick={handleSave}
                                disabled={!selectedUserId || saving}
                                className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
        </>
    );
};

export default Permissoes;