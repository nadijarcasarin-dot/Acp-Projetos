
import React from 'react';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-700">{title}</h1>
        <p className="text-gray-500 mt-2">Esta página está em construção.</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
