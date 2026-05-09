import { useState, useEffect, useRef } from 'react';
import { X, Settings, Type, Palette, Eye, EyeOff, Grid3x3 } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { Visualization } from './ReportView';

interface VisualizationCardProps {
  visualization: Visualization;
  data: any[];
  columns: string[];
  numericColumns: string[];
  onUpdate: (updates: Partial<Visualization>) => void;
  onRemove: () => void;
}

const PRESET_COLORS = [
  { name: 'Slate', value: '#5B6B7F' },
  { name: 'Beige', value: '#D4D0C0' },
  { name: 'Stone', value: '#6B6B6B' },
  { name: 'Charcoal', value: '#3D3D3D' },
  { name: 'Soft', value: '#F8F6F0' },
  { name: 'Mist', value: '#E8E4D6' },
  { name: 'Ink', value: '#232B36' },
  { name: 'Smoke', value: '#A9A59A' },
];

const PIE_COLORS = ['#5B6B7F', '#D4D0C0', '#6B6B6B', '#3D3D3D', '#E8E4D6', '#F8F6F0', '#232B36', '#A9A59A'];

export function VisualizationCard({
  visualization,
  data,
  columns,
  numericColumns,
  onUpdate,
  onRemove
}: VisualizationCardProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextFormatting, setShowTextFormatting] = useState(false);
  const [showTitleFormatting, setShowTitleFormatting] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'width' | 'height' | 'both' | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const idCounterRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeDirection) return;

      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      if (resizeDirection === 'width' || resizeDirection === 'both') {
        const newWidth = Math.max(300, startSize.width + deltaX);
        onUpdate({ width: newWidth });
      }
      if (resizeDirection === 'height' || resizeDirection === 'both') {
        const newHeight = Math.max(200, startSize.height + deltaY);
        onUpdate({ height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizeDirection, startPos, startSize, onUpdate]);

  const startResize = (direction: 'width' | 'height' | 'both', e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width: visualization.width, height: visualization.height });
  };


  const prepareChartData = () => {
    idCounterRef.current = 0;
    const generateId = () => {
      return `${visualization.type}_${visualization.xAxis}_${visualization.yAxis}_${idCounterRef.current++}`;
    };

    if (visualization.type === 'pie' || visualization.type === 'donut') {
      const frequency: { [key: string]: number } = {};
      data.forEach((row) => {
        const key = String(row[visualization.xAxis] || 'N/A');
        const value = Number(row[visualization.yAxis]) || 0;
        frequency[key] = (frequency[key] || 0) + value;
      });

      return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({
          uniqueId: generateId(),
          name,
          value
        }));
    } else if (visualization.type === 'scatter') {
      return data.map((row) => ({
        uniqueId: generateId(),
        name: String(row[visualization.xAxis] || 'N/A'),
        x: Number(row[visualization.xAxis]) || 0,
        y: Number(row[visualization.yAxis]) || 0
      }));
    } else {
      const aggregated: { [key: string]: { sum: number; count: number } } = {};

      data.forEach((row) => {
        const key = String(row[visualization.xAxis] || 'N/A');
        const value = Number(row[visualization.yAxis]) || 0;

        if (!aggregated[key]) {
          aggregated[key] = { sum: 0, count: 0 };
        }
        aggregated[key].sum += value;
        aggregated[key].count += 1;
      });

      return Object.entries(aggregated)
        .map(([name, dataItem]) => ({
          uniqueId: generateId(),
          name,
          value: dataItem.sum / dataItem.count
        }));
    }
  };

  const chartData = prepareChartData();

  const renderChart = () => {
    if (visualization.type === 'table') {
      return (
        <div className="overflow-auto" style={{ height: visualization.height }}>
          <table className="w-full text-sm" style={{
            fontFamily: visualization.fontFamily,
            fontSize: visualization.fontSize,
            color: visualization.textColor
          }}>
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2 text-left border-b text-xs uppercase text-gray-700">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2">{String(row[col] || '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const commonAxisProps = {
      tick: { fontSize: visualization.fontSize, fill: visualization.textColor, fontFamily: visualization.fontFamily }
    };

    return (
      <ResponsiveContainer width="100%" height={visualization.height}>
        {visualization.type === 'bar' ? (
          <BarChart data={chartData}>
            {visualization.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: visualization.fontSize, fontFamily: visualization.fontFamily }} />}
            <Bar dataKey="value" fill={visualization.chartColor} name={visualization.yAxis} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : visualization.type === 'column' ? (
          <BarChart data={chartData} layout="vertical">
            {visualization.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis type="number" {...commonAxisProps} />
            <YAxis dataKey="name" type="category" width={150} {...commonAxisProps} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: visualization.fontSize, fontFamily: visualization.fontFamily }} />}
            <Bar dataKey="value" fill={visualization.chartColor} name={visualization.yAxis} radius={[0, 4, 4, 0]} />
          </BarChart>
        ) : visualization.type === 'stackedBar' ? (
          <BarChart data={chartData}>
            {visualization.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: visualization.fontSize, fontFamily: visualization.fontFamily }} />}
            <Bar dataKey="value" stackId="a" fill={visualization.chartColor} name={visualization.yAxis} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : visualization.type === 'line' ? (
          <LineChart data={chartData}>
            {visualization.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: visualization.fontSize, fontFamily: visualization.fontFamily }} />}
            <Line
              type="monotone"
              dataKey="value"
              stroke={visualization.chartColor}
              name={visualization.yAxis}
              strokeWidth={3}
              dot={{ r: 4, fill: visualization.chartColor }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        ) : visualization.type === 'area' ? (
          <AreaChart data={chartData}>
            {visualization.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: visualization.fontSize, fontFamily: visualization.fontFamily }} />}
            <Area
              type="monotone"
              dataKey="value"
              stroke={visualization.chartColor}
              fill={visualization.chartColor}
              fillOpacity={0.6}
              name={visualization.yAxis}
            />
          </AreaChart>
        ) : visualization.type === 'pie' ? (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={visualization.height / 3}
              fill="#8884d8"
              dataKey="value"
              nameKey="uniqueId"
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.uniqueId} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: visualization.fontSize, fontFamily: visualization.fontFamily }} />}
          </PieChart>
        ) : visualization.type === 'donut' ? (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              innerRadius={visualization.height / 5}
              outerRadius={visualization.height / 3}
              fill="#8884d8"
              dataKey="value"
              nameKey="uniqueId"
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.uniqueId} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: visualization.fontSize, fontFamily: visualization.fontFamily }} />}
          </PieChart>
        ) : visualization.type === 'scatter' ? (
          <ScatterChart>
            {visualization.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis dataKey="x" name={visualization.xAxis} {...commonAxisProps} />
            <YAxis dataKey="y" name={visualization.yAxis} {...commonAxisProps} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: visualization.fontSize, fontFamily: visualization.fontFamily }} />}
            <Scatter name={`${visualization.xAxis} vs ${visualization.yAxis}`} data={chartData} fill={visualization.chartColor} />
          </ScatterChart>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <p className="text-gray-500">Unsupported chart type: {visualization.type}</p>
          </div>
        )}
      </ResponsiveContainer>
    );
  };

  const titleStyle = {
    color: visualization.titleColor,
    fontSize: visualization.titleFontSize,
    fontFamily: visualization.titleFontFamily,
    fontWeight: visualization.titleBold ? 'bold' : 'normal',
    fontStyle: visualization.titleItalic ? 'italic' : 'normal'
  };

  return (
    <div
      ref={cardRef}
      className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl relative hover:scale-[1.02]"
      style={{ width: Math.max(visualization.width, 350), borderColor: '#D4D0C0' }}
    >
      {/* Header */}
      <div className="border-b-2 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3" style={{ background: '#F8F6F0', borderColor: '#D4D0C0' }}>
        <input
          type="text"
          value={visualization.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          style={titleStyle}
          className="w-full sm:flex-1 bg-white/80 border-2 border-transparent outline-none focus:bg-white rounded-xl px-4 py-2 transition-all duration-200 hover:bg-white/90"
          placeholder="Chart Title"
        />
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5 justify-end w-full sm:w-auto">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${
              showConfig
                ? 'text-white shadow-lg'
                : 'bg-white/50 hover:bg-white'
              }
              style={showConfig ? { background: '#6D8196' } : { color: '#6B6B6B' }}
            }`}
            title="Configure Axes"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTitleFormatting(!showTitleFormatting)}
            className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${
              showTitleFormatting
                ? 'text-white shadow-lg'
                : 'bg-white/50 hover:bg-white'
              }
              style={showTitleFormatting ? { background: '#6D8196' } : { color: '#6B6B6B' }}
            }`}
            title="Title Formatting"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTextFormatting(!showTextFormatting)}
            className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${
              showTextFormatting
                ? 'text-white shadow-lg'
                : 'bg-white/50 hover:bg-white'
              }
              style={showTextFormatting ? { background: '#6D8196' } : { color: '#6B6B6B' }}
            }`}
            title="Text Formatting"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${
              showColorPicker
                ? 'text-white shadow-lg'
                : 'bg-white/50 hover:bg-white'
              }
              style={showColorPicker ? { background: '#6D8196' } : { color: '#6B6B6B' }}
            }`}
            title="Chart Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 bg-white/50 hover:shadow-lg"
            style={{ color: '#6B6B6B' }}
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Configuration Panel - Axes */}
      {showConfig && visualization.type !== 'table' && (
        <div className="border-b-2 p-5" style={{ background: '#F8F6F0', borderColor: '#D4D0C0' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm mb-2">X-Axis (Category)</label>
              <select
                value={visualization.xAxis}
                onChange={(e) => onUpdate({ xAxis: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
              >
                {columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-2">Y-Axis (Value)</label>
              <select
                value={visualization.yAxis}
                onChange={(e) => onUpdate({ yAxis: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
              >
                {numericColumns.length > 0 ? numericColumns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                )) : columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => onUpdate({ showLegend: !visualization.showLegend })}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                visualization.showLegend
                  ? 'text-white border-transparent'
                  : 'border-gray-300'
              }`}
                style={visualization.showLegend ? { background: '#6D8196' } : { color: '#3D3D3D' }}
            >
              {visualization.showLegend ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Legend</span>
            </button>
            <button
              onClick={() => onUpdate({ showGrid: !visualization.showGrid })}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                visualization.showGrid
                  ? 'text-white border-transparent'
                  : 'border-gray-300'
              }`}
                style={visualization.showGrid ? { background: '#6D8196' } : { color: '#3D3D3D' }}
            >
              <Grid3x3 className="w-4 h-4" />
              <span>Grid</span>
            </button>
          </div>
        </div>
      )}

      {/* Title Formatting Panel */}
      {showTitleFormatting && (
        <div className="border-b-2 p-5" style={{ background: '#F8F6F0', borderColor: '#D4D0C0' }}>
          <div className="text-sm mb-3 text-gray-700">Title Formatting</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 text-xs mb-1">Font Family</label>
              <select
                value={visualization.titleFontFamily}
                onChange={(e) => onUpdate({ titleFontFamily: e.target.value })}
                className="w-full px-2 py-1 border-2 border-gray-300 rounded outline-none text-sm"
                style={{ color: '#3D3D3D' }}
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Tahoma">Tahoma</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-xs mb-1">Font Size: {visualization.titleFontSize}px</label>
              <input
                type="range"
                min="12"
                max="48"
                value={visualization.titleFontSize}
                onChange={(e) => onUpdate({ titleFontSize: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-xs mb-1">Title Color</label>
              <input
                type="color"
                value={visualization.titleColor}
                onChange={(e) => onUpdate({ titleColor: e.target.value })}
                className="w-full h-9 rounded border-2 border-gray-300 cursor-pointer"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={() => onUpdate({ titleBold: !visualization.titleBold })}
                className={`flex-1 px-3 py-2 rounded border-2 transition-all ${
                  visualization.titleBold
                    ? 'text-white border-transparent'
                    : 'border-gray-300 hover:border-green-400'
                }`}
                  style={visualization.titleBold ? { background: '#6D8196' } : { color: '#3D3D3D' }}
              >
                <strong>B</strong>
              </button>
              <button
                onClick={() => onUpdate({ titleItalic: !visualization.titleItalic })}
                className={`flex-1 px-3 py-2 rounded border-2 transition-all ${
                  visualization.titleItalic
                    ? 'text-white border-transparent'
                    : 'border-gray-300 hover:border-green-400'
                }`}
                  style={visualization.titleItalic ? { background: '#6D8196' } : { color: '#3D3D3D' }}
              >
                <em>I</em>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Formatting Panel */}
      {showTextFormatting && visualization.type !== 'table' && (
        <div className="border-b-2 p-5" style={{ background: '#F8F6F0', borderColor: '#D4D0C0' }}>
          <div className="text-sm mb-3 text-gray-700">Chart Text Formatting</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-xs mb-1">Font Family</label>
              <select
                value={visualization.fontFamily}
                onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                className="w-full px-2 py-1 border-2 border-gray-300 rounded focus:border-orange-500 outline-none text-sm"
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Tahoma">Tahoma</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-xs mb-1">Font Size: {visualization.fontSize}px</label>
              <input
                type="range"
                min="8"
                max="24"
                value={visualization.fontSize}
                onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-xs mb-1">Text Color</label>
              <input
                type="color"
                value={visualization.textColor}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
                className="w-full h-9 rounded border-2 border-gray-300 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Color Picker */}
      {showColorPicker && visualization.type !== 'table' && visualization.type !== 'pie' && visualization.type !== 'donut' && (
        <div className="border-b-2 p-5" style={{ background: '#F8F6F0', borderColor: '#D4D0C0' }}>
          <label className="block text-gray-700 text-sm mb-3">Chart Color</label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((colorObj) => (
              <button
                key={colorObj.value}
                onClick={() => onUpdate({ chartColor: colorObj.value })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  visualization.chartColor === colorObj.value
                    ? 'border-gray-800 scale-110'
                    : 'border-gray-300 hover:scale-105'
                }`}
                style={{ backgroundColor: colorObj.value }}
                title={colorObj.name}
              >
                {visualization.chartColor === colorObj.value && (
                  <div className="text-white text-xs">✓</div>
                )}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className="block text-gray-700 text-xs mb-1">Custom Color</label>
            <input
              type="color"
              value={visualization.chartColor}
              onChange={(e) => onUpdate({ chartColor: e.target.value })}
              className="w-full h-10 rounded border-2 border-gray-300 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Chart Content */}
      <div className="p-6 relative" style={{ background: '#FFFFFF' }}>
        {renderChart()}

        {/* Resize Handles - All 4 corners and 4 edges */}
        {/* Bottom-Right Corner */}
        <div
          className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize opacity-0 group-hover:opacity-80 hover:opacity-100 hover:scale-150 transition-all duration-200"
          style={{ background: '#6D8196' }}
          onMouseDown={(e) => startResize('both', e)}
          title="Resize"
        />
        {/* Bottom-Left Corner */}
        <div
          className="absolute bottom-0 left-0 w-5 h-5 cursor-nesw-resize opacity-0 group-hover:opacity-80 hover:opacity-100 hover:scale-150 transition-all duration-200"
          style={{ background: '#6D8196' }}
          onMouseDown={(e) => startResize('both', e)}
          title="Resize"
        />
        {/* Top-Right Corner */}
        <div
          className="absolute top-0 right-0 w-5 h-5 cursor-nesw-resize opacity-0 group-hover:opacity-80 hover:opacity-100 hover:scale-150 transition-all duration-200"
          style={{ background: '#6D8196' }}
          onMouseDown={(e) => startResize('both', e)}
          title="Resize"
        />
        {/* Top-Left Corner */}
        <div
          className="absolute top-0 left-0 w-5 h-5 cursor-nwse-resize opacity-0 group-hover:opacity-80 hover:opacity-100 hover:scale-150 transition-all duration-200"
          style={{ background: '#6D8196' }}
          onMouseDown={(e) => startResize('both', e)}
          title="Resize"
        />
        {/* Bottom Edge */}
        <div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-3 cursor-ns-resize opacity-0 group-hover:opacity-80 hover:opacity-100 hover:h-4 rounded-t-lg transition-all duration-200"
          style={{ background: '#6D8196' }}
          onMouseDown={(e) => startResize('height', e)}
          title="Resize height"
        />
        {/* Top Edge */}
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-3 cursor-ns-resize opacity-0 group-hover:opacity-80 hover:opacity-100 hover:h-4 rounded-b-lg transition-all duration-200"
          style={{ background: '#6D8196' }}
          onMouseDown={(e) => startResize('height', e)}
          title="Resize height"
        />
        {/* Right Edge */}
        <div
          className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-16 cursor-ew-resize opacity-0 group-hover:opacity-80 hover:opacity-100 hover:w-4 rounded-l-lg transition-all duration-200"
          style={{ background: '#6D8196' }}
          onMouseDown={(e) => startResize('width', e)}
          title="Resize width"
        />
        {/* Left Edge */}
        <div
          className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-16 cursor-ew-resize opacity-0 group-hover:opacity-80 hover:opacity-100 hover:w-4 rounded-r-lg transition-all duration-200"
          style={{ background: '#6D8196' }}
          onMouseDown={(e) => startResize('width', e)}
          title="Resize width"
        />
      </div>

      {/* Footer */}
      {visualization.type !== 'table' && (
        <div className="border-t-2 px-5 py-3 text-xs flex items-center justify-between" style={{ background: '#F8F6F0', borderColor: '#D4D0C0' }}>
          <div className="flex items-center space-x-2">
            <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
              {visualization.xAxis}
            </div>
            <span className="text-gray-400">×</span>
            <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg font-medium">
              {visualization.yAxis}
            </div>
          </div>
          <div className="flex items-center space-x-3 text-gray-500">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{chartData.length} points</span>
            </span>
            <span className="text-gray-400">•</span>
            <span>{visualization.width}×{visualization.height}px</span>
          </div>
        </div>
      )}
    </div>
  );
}


