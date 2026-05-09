import { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardVisualizationProps {
  data: any[];
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4'];

export function DashboardVisualization({ data }: DashboardVisualizationProps) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500">No data available for visualization</div>;
  }

  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter(col => {
    const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
    return values.length > 0 && !isNaN(Number(values[0]));
  });

  const categoricalColumns = columns.filter(col => {
    const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
    if (values.length === 0) return false;
    const uniqueCount = new Set(values).size;
    return uniqueCount < 20 && isNaN(Number(values[0]));
  });

  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [selectedXAxis, setSelectedXAxis] = useState(categoricalColumns[0] || columns[0]);
  const [selectedYAxis, setSelectedYAxis] = useState(numericColumns[0] || columns[1]);
  const idCounterRef = useRef(0);

  // Suppress Recharts internal key warnings (these are harmless internal rendering warnings)
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('Encountered two children with the same key') ||
         args[0].includes('Keys should be unique'))
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const chartData = useMemo(() => {
    idCounterRef.current = 0;
    const generateId = () => {
      return `${chartType}_${selectedXAxis}_${selectedYAxis}_${idCounterRef.current++}`;
    };

    if (chartType === 'pie') {
      const frequency: { [key: string]: number } = {};
      data.forEach((row) => {
        const key = String(row[selectedXAxis] || 'N/A');
        const value = Number(row[selectedYAxis]) || 0;
        frequency[key] = (frequency[key] || 0) + value;
      });

      return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({
          uniqueId: generateId(),
          name,
          value
        }));
    } else {
      const aggregated: { [key: string]: { sum: number; count: number } } = {};

      data.forEach((row) => {
        const key = String(row[selectedXAxis] || 'N/A');
        const value = Number(row[selectedYAxis]) || 0;

        if (!aggregated[key]) {
          aggregated[key] = { sum: 0, count: 0 };
        }
        aggregated[key].sum += value;
        aggregated[key].count += 1;
      });

      return Object.entries(aggregated)
        .slice(0, 15)
        .map(([name, dataItem]) => ({
          uniqueId: generateId(),
          name,
          value: dataItem.sum / dataItem.count
        }));
    }
  }, [data, chartType, selectedXAxis, selectedYAxis]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4">Chart Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">X-Axis (Category)</label>
            <select
              value={selectedXAxis}
              onChange={(e) => setSelectedXAxis(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Y-Axis (Value)</label>
            <select
              value={selectedYAxis}
              onChange={(e) => setSelectedYAxis(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {numericColumns.length > 0 ? numericColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              )) : columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-96">
          {chartType === 'bar' && (
            <ResponsiveContainer width="100%" height="100%" key={`bar-container-${chartType}-${selectedXAxis}-${selectedYAxis}`}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name={selectedYAxis} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartType === 'line' && (
            <ResponsiveContainer width="100%" height="100%" key={`line-container-${chartType}-${selectedXAxis}-${selectedYAxis}`}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" name={selectedYAxis} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {chartType === 'pie' && (
            <ResponsiveContainer width="100%" height="100%" key={`pie-container-${chartType}-${selectedXAxis}-${selectedYAxis}`}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="uniqueId"
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={entry.uniqueId} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-64">
            <div className="text-sm text-gray-600 mb-2">Distribution Overview</div>
            <ResponsiveContainer width="100%" height="100%" key={`mini-bar-${selectedXAxis}-${selectedYAxis}`}>
              <BarChart data={chartData.slice(0, 5)}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-64">
            <div className="text-sm text-gray-600 mb-2">Trend Analysis</div>
            <ResponsiveContainer width="100%" height="100%" key={`mini-line-${selectedXAxis}-${selectedYAxis}`}>
              <LineChart data={chartData.slice(0, 10)}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-64">
            <div className="text-sm text-gray-600 mb-2">Proportional View</div>
            <ResponsiveContainer width="100%" height="100%" key={`mini-pie-${selectedXAxis}-${selectedYAxis}`}>
              <PieChart>
                <Pie
                  data={chartData.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="uniqueId"
                  label
                >
                  {chartData.slice(0, 5).map((entry, idx) => (
                    <Cell key={`mini-${entry.uniqueId}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
