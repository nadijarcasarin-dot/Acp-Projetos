
import React, { useState } from 'react';
import { SearchIcon } from '../components/icons/SearchIcon';
import { CheckIcon } from '../components/icons/CheckIcon';

const notifications = [
  { id: 1, text: 'O projeto "Sistema de Irrigação Inteligente" foi concluído. Parabéns!', time: 'há 1 anos', read: true },
  { id: 2, text: 'Lembrete: A tarefa "Análise de custos de produção" vence em 3 dias.', time: 'há 1 anos', read: false },
  { id: 3, text: 'Você foi designado para uma nova tarefa: "Relatório de impacto ambiental".', time: 'há 1 anos', read: false },
  { id: 4, text: 'A tarefa "Inspeção de campo" está atrasada. Por favor, atualize seu status.', time: 'há 1 anos', read: false },
  { id: 5, text: 'Um novo documento "Checklist de Auditoria.docx" foi adicionado ao projeto "Auditoria Ambiental Anual".', time: 'há 1 anos', read: true },
];

const Notificacoes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Todas');

  const getFilteredNotifications = () => {
    if (activeTab === 'Não Lidas') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  };

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
          <button className="text-sm text-blue-600 font-semibold hover:underline">
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
        {getFilteredNotifications().map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start p-4 rounded-lg transition-colors duration-200 ${
              !notification.read ? 'bg-white shadow-sm' : 'bg-transparent'
            }`}
          >
            {!notification.read && <span className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-4 flex-shrink-0"></span>}
            <div className={`flex-grow ${notification.read ? 'ml-6' : ''}`}>
              <p className="text-gray-800">{notification.text}</p>
              <p className="text-sm text-gray-500 mt-1">{notification.time}</p>
            </div>
            {!notification.read && (
              <button className="text-gray-400 hover:text-green-500 ml-4">
                <CheckIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notificacoes;
