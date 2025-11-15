import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from '../contexts/AuthContext';
import { SearchIcon } from '../components/icons/SearchIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { BellIcon } from '../components/icons/BellIcon';

interface Notification {
  id: number;
  message: string;
  created_at: string;
  read: boolean;
  user_id: string;
}

// Helper function to format time difference
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return `há ${Math.floor(interval)} anos`;
  interval = seconds / 2592000;
  if (interval > 1) return `há ${Math.floor(interval)} meses`;
  interval = seconds / 86400;
  if (interval > 1) return `há ${Math.floor(interval)} dias`;
  interval = seconds / 3600;
  if (interval > 1) return `há ${Math.floor(interval)} horas`;
  interval = seconds / 60;
  if (interval > 1) return `há ${Math.floor(interval)} minutos`;
  return `há ${Math.floor(seconds)} segundos`;
};


const Notificacoes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Todas');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useContext(AuthContext);
  
  useEffect(() => {
    if (!userProfile) return;

    const controller = new AbortController();
    const signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })
          .abortSignal(signal);

        if (error) throw error;
        
        if (!signal.aborted) {
          setNotifications(data || []);
        }
      } catch (err: any) {
          if (err.name === 'AbortError') {
            setError('A requisição demorou muito. Verifique sua conexão e tente novamente.');
          } else {
            setError(`Falha ao buscar notificações: ${err.message}`);
          }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
      supabase.removeChannel(channel);
    };
  }, [userProfile]);
  
  const handleMarkAsRead = async (id: number) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
          // You can add a notification pop-up here for errors
          console.error("Failed to mark notification as read:", error);
      } else {
          setNotifications(prev => 
              prev.map(n => n.id === id ? { ...n, read: true } : n)
          );
      }
  };
  
  const handleMarkAllAsRead = async () => {
      if (!userProfile) return;
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userProfile.id)
        .in('id', unreadIds);
      
      if (error) {
          console.error("Failed to mark all as read:", error);
      } else {
          setNotifications(prev => prev.map(n => ({...n, read: true})));
      }
  };

  const getFilteredNotifications = () => {
    if (activeTab === 'Não Lidas') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Notificações</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('Todas')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'Todas' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveTab('Não Lidas')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'Não Lidas' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
          >
            Não Lidas
          </button>
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 font-semibold hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
            disabled={notifications.every(n => n.read)}
          >
            Marcar todas como lidas
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por notificações..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-4">
        {loading ? (
            <p className="text-center text-gray-500 py-8">Carregando notificações...</p>
        ) : error ? (
            <div className="p-6 text-center text-red-500 bg-red-100 rounded-lg">{error}</div>
        ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma notificação por aqui</h3>
                <p className="mt-1 text-sm text-gray-500">
                    {activeTab === 'Não Lidas' 
                    ? 'Você está em dia com tudo!' 
                    : 'Quando algo importante acontecer, você será notificado aqui.'
                    }
                </p>
                 <p className="mt-2 text-xs text-gray-400 px-4">
                    Se você espera ver notificações, verifique se a tabela 'notifications' existe no Supabase e se as políticas de segurança (RLS) permitem a leitura (SELECT).
                </p>
            </div>
        ) : (
            filteredNotifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`flex items-start p-4 rounded-lg transition-colors duration-200 ${
                    !notification.read ? 'bg-white shadow-sm' : 'bg-transparent'
                    }`}
                >
                    {!notification.read && <span className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-4 flex-shrink-0"></span>}
                    <div className={`flex-grow ${notification.read ? 'ml-6' : ''}`}>
                    <p className="text-gray-800">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatTimeAgo(notification.created_at)}</p>
                    </div>
                    {!notification.read && (
                    <button 
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-gray-400 hover:text-green-500 ml-4"
                        title="Marcar como lida"
                    >
                        <CheckIcon className="h-5 w-5" />
                    </button>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Notificacoes;