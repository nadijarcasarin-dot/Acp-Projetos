import React, { useState } from 'react';
import { SearchIcon } from '../components/icons/SearchIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import Modal from '../components/Modal';

const initialCompanies = [
  { name: 'AgroTech Soluções', type: 'Produtor Rural', city: 'Cascavel', district: 'Linha São João' },
  { name: 'Campo Forte Insumos', type: 'Revenda', city: 'Toledo', district: 'Centro' },
  { name: 'Terra Boa Agronegócios', type: 'Produtor Rural', city: 'Marechal Cândido Rondon', district: 'Linha Guarani' },
  { name: 'Grão de Ouro Coop.', type: 'Cooperativa', city: 'Palotina', district: 'Distrito Industrial' },
  { name: 'Fazenda Bela Vista', type: 'Produtor Rural', city: 'Assis Chateaubriand', district: 'Linha Bela Vista' },
];

interface Company {
  name: string;
  type: string;
  city: string;
  district: string;
}

const Empresas: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState<Company>({ name: '', type: '', city: '', district: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompany.name.trim() && newCompany.type.trim() && newCompany.city.trim() && newCompany.district.trim()) {
      setCompanies([...companies, newCompany]);
      setNewCompany({ name: '', type: '', city: '', district: '' });
      setIsModalOpen(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Empresas</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              + Nova Empresa
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome Fantasia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enquadramento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bairro/Linha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCompanies.map((company, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.district}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-4">
                      <button className="text-gray-500 hover:text-blue-600">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button className="text-gray-500 hover:text-red-600">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Nova Empresa"
      >
        <form onSubmit={handleAddNewCompany}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
              <input type="text" name="name" value={newCompany.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enquadramento</label>
              <input type="text" name="type" value={newCompany.type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input type="text" name="city" value={newCompany.city} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro/Linha</label>
              <input type="text" name="district" value={newCompany.district} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
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

export default Empresas;