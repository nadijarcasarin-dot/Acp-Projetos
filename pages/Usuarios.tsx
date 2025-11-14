import React, { useState, useEffect } from 'react';
import { SearchIcon } from '../components/icons/SearchIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { MailIcon } from '../components/icons/MailIcon';
import { PhoneIcon } from '../components/icons/PhoneIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';
import { supabase } from '../lib/supabaseClient';

interface UserLevel {
  id: number;
  name: string;
}

interface JobTitle {
  id: number;
  name: string;
}

interface UserProfile {
  id: string; // UUID from auth.users
  full_name: string;
  phone: string;
  avatar_url: string;
  user_level_id: number;
  job_title_id: number;
  user_levels: { name: string } | null;
  job_titles: { name: string } | null;
}

const emptyNewUserForm = {
    email: '',
    password: '',
    full_name: '',
    phone: '',
    user_level_id: '',
    job_title_id: '',
};

const Usuarios: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState(emptyNewUserForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [availableLevels, setAvailableLevels] = useState<UserLevel[]>([]);
  const [availableTitles, setAvailableTitles] = useState<JobTitle[]>([]);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersRes, levelsRes, titlesRes] = await Promise.all([
          supabase.from('users').select('*, user_levels(name), job_titles(name)').abortSignal(signal),
          supabase.from('user_levels').select('*').abortSignal(signal),
          supabase.from('job_titles').select('*').abortSignal(signal),
        ]);

        if (signal.aborted) return;

        const { data: usersData, error: usersError } = usersRes;
        if (usersError) throw usersError;

        const { data: levelsData, error: levelsError } = levelsRes;
        if (levelsError) throw levelsError;

        const { data: titlesData, error: titlesError } = titlesRes;
        if (titlesError) throw titlesError;

        const sanitizedUsers = (usersData || []).map(user => {
          const levelRelation = user.user_levels;
          const titleRelation = user.job_titles;
          return {
            ...user,
            user_levels: (levelRelation && typeof levelRelation === 'object' && !Array.isArray(levelRelation))
              ? levelRelation
              : { name: 'Nível Indefinido' },
            job_titles: (titleRelation && typeof titleRelation === 'object' && !Array.isArray(titleRelation))
              ? titleRelation
              : { name: 'Cargo Indefinido' },
          };
        });
        setUsers(sanitizedUsers as UserProfile[]);
        setAvailableLevels(levelsData || []);
        setAvailableTitles(titlesData || []);

      } catch (err: any) {
        if (err.name !== 'AbortError') {
            setError(`Falha ao buscar dados: ${err.message}`);
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
  
  const openEditModal = (user: UserProfile) => {
    setIsEditing(true);
    setEditingUser(user);
    setIsModalOpen(true);
  };
  
  const openAddModal = () => {
    setIsEditing(false);
    setNewUser(emptyNewUserForm);
    setIsModalOpen(true);
  }
  
  const openDeleteModal = (user: UserProfile) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setNewUser(emptyNewUserForm);
    setError(null);
    setAvatarFile(null);
    setAvatarPreview(null);
  }
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingUser) return;
    const { name, value } = e.target;
    setEditingUser(prev => ({ ...prev!, [name]: value }));
  };

  const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);
    setSaving(true);
  
    try {
      let avatarUrl = editingUser.avatar_url;
  
      if (avatarFile) {
        const filePath = `public/${editingUser.id}/${Date.now()}_${avatarFile.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });
  
        if (uploadError) throw uploadError;
  
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        avatarUrl = urlData.publicUrl;
      }
  
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          full_name: editingUser.full_name,
          phone: editingUser.phone,
          user_level_id: editingUser.user_level_id,
          job_title_id: editingUser.job_title_id,
          avatar_url: avatarUrl,
        })
        .eq('id', editingUser.id)
        .select('*, user_levels(name), job_titles(name)')
        .single();
  
      if (updateError) throw updateError;
      
      const sanitizedUser = {
        ...updatedUser,
        user_levels: updatedUser.user_levels || { name: 'Nível Indefinido' },
        job_titles: updatedUser.job_titles || { name: 'Cargo Indefinido' },
      };

      setUsers(prev => prev.map(u => u.id === sanitizedUser.id ? (sanitizedUser as UserProfile) : u));
      closeModal();
      setNotification({ type: 'success', message: 'Usuário atualizado com sucesso!' });
    } catch (err: any) {
      if (err.message.includes('violates row-level security policy')) {
        setError("Falha de segurança: Você não tem permissão para atualizar este usuário. Verifique se as políticas de segurança (RLS) da tabela 'users' no Supabase permitem a atualização (UPDATE).");
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: newUser.email,
          password: newUser.password,
        });

        if (authError) throw authError;

        if (authData.user) {
            let avatarUrl = null;
            if (avatarFile) {
                const filePath = `public/${authData.user.id}/${Date.now()}_${avatarFile.name}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                avatarUrl = urlData.publicUrl;
            }

            const { data: newProfile, error: profileError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    full_name: newUser.full_name,
                    phone: newUser.phone,
                    user_level_id: newUser.user_level_id,
                    job_title_id: newUser.job_title_id,
                    avatar_url: avatarUrl,
                })
                .select('*, user_levels(name), job_titles(name)')
                .single();
            
            if (profileError) throw profileError;

            const sanitizedUser = {
                ...newProfile,
                user_levels: newProfile.user_levels || { name: availableLevels.find(l => l.id.toString() === newUser.user_level_id)?.name || 'Nível Indefinido' },
                job_titles: newProfile.job_titles || { name: availableTitles.find(t => t.id.toString() === newUser.job_title_id)?.name || 'Cargo Indefinido' },
            };

            setUsers(prev => [...prev, sanitizedUser as UserProfile].sort((a,b) => a.full_name.localeCompare(b.full_name)));
            closeModal();
            setNotification({ type: 'success', message: 'Usuário criado com sucesso!' });
        }
    } catch (err: any) {
        if (err.message.includes('violates row-level security policy')) {
          setError("Falha de segurança: Você não tem permissão para criar este usuário. Verifique se as políticas de segurança (RLS) da tabela 'users' no Supabase permitem a inserção (INSERT).");
        } else {
          setError(err.message);
        }
    } finally {
        setSaving(false);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userToDelete.id);
    
    setIsDeleteModalOpen(false);

    if (error) {
      setNotification({ type: 'error', message: `Erro ao excluir perfil: ${error.message}` });
    } else {
      setNotification({ type: 'success', message: 'Perfil do usuário excluído com sucesso!' });
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
    }
    setUserToDelete(null);
  };


  const filteredUsers = users.filter(user => {
    if (!user) return false;
    const term = searchTerm.toLowerCase();
    const nameMatch = user.full_name?.toLowerCase().includes(term);
    const levelMatch = user.user_levels?.name?.toLowerCase().includes(term);
    const titleMatch = user.job_titles?.name?.toLowerCase().includes(term);
    return nameMatch || levelMatch || titleMatch;
  });
  
  const renderModalFooter = () => (
    <>
      <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" disabled={saving}>
        Cancelar
      </button>
      <button type="submit" form="user-form" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400" disabled={saving}>
        {saving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Usuário')}
      </button>
    </>
  );

  return (
    <>
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
           <button
              onClick={openAddModal}
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              + Novo Usuário
            </button>
        </div>

        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, cargo ou tipo..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loading ? <p className="text-center text-gray-500">Carregando usuários...</p> : (
            <>
                {filteredUsers.length > 0 ? (
                    <div className="space-y-4">
                        {filteredUsers.map((user) => (
                            <div key={user.id} className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <img src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.full_name} className="h-16 w-16 rounded-full mr-4 object-cover" />
                                <div>
                                <p className="font-bold text-lg text-gray-800">{user.full_name}</p>
                                <p className="text-gray-600">{user.user_levels?.name || 'N/A'} · {user.job_titles?.name || 'N/A'}</p>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                    <div className="flex items-center">
                                    <PhoneIcon className="h-4 w-4 mr-1" />
                                    <span>{user.phone || 'N/A'}</span>
                                    </div>
                                </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button className="text-gray-500 hover:text-blue-600" onClick={() => openEditModal(user)} title="Editar">
                                <PencilIcon className="h-5 w-5" />
                                </button>
                                <button className="text-gray-500 hover:text-red-600" onClick={() => openDeleteModal(user)} title="Excluir">
                                <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Clique em "+ Novo Usuário" para adicionar o primeiro.
                        </p>
                        <p className="mt-2 text-xs text-gray-400 px-4">
                            Se você já cadastrou usuários e eles não aparecem, verifique se as políticas de segurança (RLS) da tabela 'users' no Supabase permitem a visualização pública (SELECT).
                        </p>
                    </div>
                )}
            </>
        )}
      </div>

      <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
          footer={renderModalFooter()}
      >
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert"><p>{error}</p></div>}
          <form id="user-form" onSubmit={isEditing ? handleUpdateUser : handleAddNewUser}>
          <div className="space-y-4">
              
              <div className="flex flex-col items-center space-y-2 mb-4">
                  <img 
                      src={avatarPreview || (isEditing ? editingUser?.avatar_url : null) || 'https://via.placeholder.com/96'} 
                      alt="Avatar Preview" 
                      className="h-24 w-24 rounded-full object-cover"
                  />
                  <label htmlFor="avatar-upload" className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500">
                      Trocar Foto
                  </label>
                  <input 
                      id="avatar-upload" 
                      type="file" 
                      className="sr-only" 
                      accept="image/png, image/jpeg, image/webp" 
                      onChange={handleAvatarChange}
                  />
              </div>

              {isEditing ? (
                  <>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                          <input type="text" name="full_name" value={editingUser?.full_name || ''} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
                      </div>
                  </>
              ) : (
                  <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <input type="email" name="email" value={newUser.email} onChange={handleNewUserInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input type="password" name="password" value={newUser.password} onChange={handleNewUserInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <input type="text" name="full_name" value={newUser.full_name} onChange={handleNewUserInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                  </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                <select name="user_level_id" value={isEditing ? editingUser?.user_level_id : newUser.user_level_id} onChange={isEditing ? handleEditInputChange : handleNewUserInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">Selecione um nível</option>
                    {availableLevels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <select name="job_title_id" value={isEditing ? editingUser?.job_title_id : newUser.job_title_id} onChange={isEditing ? handleEditInputChange : handleNewUserInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">Selecione um cargo</option>
                    {availableTitles.map(title => <option key={title.id} value={title.id}>{title.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input type="tel" name="phone" value={isEditing ? editingUser?.phone : newUser.phone} onChange={isEditing ? handleEditInputChange : handleNewUserInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="(XX) XXXXX-XXXX" maxLength={15} />
              </div>
          </div>
          </form>
      </Modal>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão de Perfil"
        message={
          <>
            <p>Tem certeza que deseja excluir o perfil de <strong>"{userToDelete?.full_name}"</strong>?</p>
            <p className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded-md mt-2">
              Atenção: Esta ação remove apenas as informações do perfil (nome, cargo, etc.). O usuário ainda poderá fazer login.
            </p>
          </>
        }
      />
    </>
  );
};

export default Usuarios;