
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface BarChartCardProps {
  title: string;
  data: any[];
  barColor: string;
  dataKey: string;
}

const BarChartCard: React.FC<BarChartCardProps> = ({ title, data, barColor, dataKey }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
       {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
            <Tooltip cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} />
            <Bar dataKey={dataKey} fill={barColor} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChartCard;
