import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  labels: string[];
  values: number[];
  title: string;
}

interface ChartRendererProps {
  data: ChartData;
  type: 'bar' | 'pie' | 'histogram';
  width?: number;
  height?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export const ChartRenderer = ({ data, type, width = 600, height = 400 }: ChartRendererProps) => {
  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.values[index],
  }));

  if (type === 'pie') {
    return (
      <div style={{ width, height, background: 'white', padding: '20px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '18px', fontWeight: 'bold' }}>
          {data.title}
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ width, height, background: 'white', padding: '20px' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '18px', fontWeight: 'bold' }}>
        {data.title}
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#0088FE" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
