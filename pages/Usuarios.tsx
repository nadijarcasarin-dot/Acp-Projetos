import React, { useState } from 'react';
import { SearchIcon } from '../components/icons/SearchIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { MailIcon } from '../components/icons/MailIcon';
import { PhoneIcon } from '../components/icons/PhoneIcon';
import Modal from '../components/Modal';

interface User {
  name: string;
  role: string;
  title: string;
  email: string;
  phone: string;
  avatar: string;
}

const initialUsers: User[] = [
  {
    name: 'Alice Silva',
    role: 'Administrador',
    title: 'Engenheiro Ambiental',
    email: 'alice.silva@intelliproject.com',
    phone: '(11) 98765-4321',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    name: 'Bruno Costa',
    role: 'Gestor de projetos',
    title: 'Agrônomo',
    email: 'bruno.costa@intelliproject.com',
    phone: '(21) 91234-5678',
    avatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    name: 'Carla Dias',
    role: 'Colaborador',
    title: 'Veterinário',
    email: 'carla.dias@intelliproject.com',
    phone: '(31) 95555-1212',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
];

const emptyUser: Omit<User, 'avatar'> = {
  name: '',
  role: '',
  title: '',
  email: '',
  phone: '',
};

// Data that would come from the database
const availableRoles = [
    'Administrador',
    'Gerente de Projetos',
    'Gestor de projetos',
    'Membro da Equipe',
    'Colaborador',
    'Cliente',
    'Visualizador',
];
  
const availableTitles = [
    'Gerente de Projetos',
    'Desenvolvedor Front-end',
    'Desenvolvedor Back-end',
    'Designer UI/UX',
    'Analista de Qualidade (QA)',
    'Analista de DevOps',
    'Engenheiro Ambiental',
    'Agrônomo',
    'Veterinário',
];


const Usuarios: React.FC = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState(emptyUser);
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      let v = value.replace(/\D/g, '');
      v = v.substring(0, 11);

      if (v.length >= 11) {
        v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (v.length > 6) {
        v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/(\d{2})(\d*)/, '($1) $2');
      }
      
      setNewUser(prev => ({ ...prev, phone: v }));
    } else {
      setNewUser(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    // FIX: Check if field is a string before calling trim to avoid type errors.
    if (Object.values(newUser).every(field => typeof field === 'string' && field.trim() !== '')) {
       const userWithAvatar: User = {
        ...newUser,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
      };
      setUsers([...users, userWithAvatar]);
      setNewUser(emptyUser);
      setIsModalOpen(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
            + Adicionar Usuário
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

        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.email} className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
              <div className="flex items-center">
                <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full mr-4" />
                <div>
                  <p className="font-bold text-lg text-gray-800">{user.name}</p>
                  <p className="text-gray-600">{user.role} · {user.title}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MailIcon className="h-4 w-4 mr-1" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      <span>{user.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="text-gray-500 hover:text-blue-600">
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button className="text-gray-500 hover:text-red-600">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Novo Usuário"
      >
        <form onSubmit={handleAddNewUser}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input type="text" name="name" value={newUser.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
              <select name="role" value={newUser.role} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Selecione um nível</option>
                {availableRoles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <select name="title" value={newUser.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Selecione um cargo</option>
                {availableTitles.map(title => <option key={title} value={title}>{title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={newUser.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input type="tel" name="phone" value={newUser.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="(XX) XXXXX-XXXX" required maxLength={15} />
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

export default Usuarios;