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
  onUpdate: (updates: Partial<Visualization>) => void;
  onRemove: () => void;
  previewMode?: boolean;
}

const PRESET_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Navy', value: '#10263f' },
  { name: 'Sky', value: '#38bdf8' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Amber', value: '#d97706' },
];

const PIE_COLORS = ['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#10263f', '#38bdf8', '#059669', '#d97706'];

export function VisualizationCard({
  visualization,
  data,
  columns,
  onUpdate,
  onRemove,
  previewMode = false
}: VisualizationCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [showTitleControls, setShowTitleControls] = useState(false);
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
  const bodyStyleRef = useRef({ cursor: '', userSelect: '' });
  const minCardWidth = 160;
  const isTextVisualization = visualization.type === 'text';
  const isTitleVisualization = isTextVisualization && visualization.showTitle === true && visualization.showTextBox === false;
  const isTextBoxVisualization = isTextVisualization && visualization.showTextBox !== false && visualization.showTitle === false;
  const minCardHeight = isTitleVisualization ? 80 : 120;
  const showTextBox = !isTextVisualization || visualization.showTextBox !== false;
  const baseWidth = 700;
  const baseHeight = 450;
  const contentScale = Math.min(1, Math.min(visualization.width / baseWidth, visualization.height / baseHeight));
  const scaledTitleFontSize = Math.max(10, Math.round(visualization.titleFontSize * contentScale));
  const scaledFontSize = Math.max(8, Math.round(visualization.fontSize * contentScale));
  const scaledBodyFontSize = Math.max(10, Math.round((visualization.fontSize + 2) * contentScale));
  const axisLabelHeight = Math.max(60, Math.round(100 * contentScale));
  const axisLabelWidth = Math.max(80, Math.round(150 * contentScale));
  const titlePlaceholder = isTextVisualization ? 'Add your title here' : 'Chart Title';
  const canConfigureAxes = !isTextVisualization && visualization.type !== 'table';
  const canShowTextFormatting = visualization.type !== 'table' && !isTextVisualization;
  const isPreview = Boolean(previewMode);
  const isNumericAxisColumn = (column: string) => {
    const values = data
      .map((row) => row[column])
      .filter((value) => value !== null && value !== undefined && value !== '');
    return values.length > 0 && !isNaN(Number(values[0]));
  };

  const titleStyle = {
    color: visualization.titleColor,
    fontSize: scaledTitleFontSize,
    fontFamily: visualization.titleFontFamily,
    fontWeight: visualization.titleBold ? 'bold' : 'normal',
    fontStyle: visualization.titleItalic ? 'italic' : 'normal'
  };

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
        const newWidth = Math.max(minCardWidth, startSize.width + deltaX);
        onUpdate({ width: newWidth });
      }
      if (resizeDirection === 'height' || resizeDirection === 'both') {
        const newHeight = Math.max(minCardHeight, startSize.height + deltaY);
        onUpdate({ height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isResizing) {
      bodyStyleRef.current = {
        cursor: document.body.style.cursor,
        userSelect: document.body.style.userSelect
      };
      const cursor = resizeDirection === 'width'
        ? 'ew-resize'
        : resizeDirection === 'height'
          ? 'ns-resize'
          : 'nwse-resize';
      document.body.style.cursor = cursor;
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.body.style.cursor = bodyStyleRef.current.cursor;
        document.body.style.userSelect = bodyStyleRef.current.userSelect;
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
    const isNumericYAxis = isNumericAxisColumn(visualization.yAxis);

    if (visualization.type === 'pie' || visualization.type === 'donut') {
      const frequency: { [key: string]: number } = {};
      data.forEach((row) => {
        const key = String(row[visualization.xAxis] || 'N/A');
        const value = isNumericYAxis ? Number(row[visualization.yAxis]) || 0 : 1;
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
        const value = isNumericYAxis ? Number(row[visualization.yAxis]) || 0 : 1;

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
          value: isNumericYAxis ? dataItem.sum / dataItem.count : dataItem.count
        }));
    }
  };

  const chartData = prepareChartData();

  const renderChart = () => {
    if (isTextVisualization) {
      if (isTitleVisualization) {
        const titleValue = visualization.title || '';
        const hasTitle = titleValue.trim().length > 0;
        const displayTitle = hasTitle ? titleValue : titlePlaceholder;
        const displayStyle = {
          ...titleStyle,
          color: hasTitle ? visualization.titleColor : '#9aa8b6',
          fontWeight: hasTitle ? titleStyle.fontWeight : 'normal'
        };

        if (isPreview) {
          return (
            <div className="p-6" style={{ height: visualization.height }}>
              <div className="h-full flex items-center justify-center">
                <div style={titleStyle} className="text-center w-full">
                  {hasTitle ? titleValue : ''}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="p-6" style={{ height: visualization.height }}>
            <div
              className="h-full rounded-2xl border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: '#D7DFEA', background: 'linear-gradient(180deg, rgba(16, 38, 63, 0.03), rgba(59, 130, 246, 0.03))' }}
            >
              {isEditingTitle ? (
                <input
                  ref={(el) => (titleInputRef.current = el)}
                  type="text"
                  value={visualization.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  onBlur={(e) => saveTitle(e.target.value)}
                  onKeyDown={handleTitleKey}
                  style={titleStyle}
                  className="w-full bg-white/90 border-2 border-[#D7DFEA] rounded-xl px-4 py-3 outline-none text-center"
                  placeholder={titlePlaceholder}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="w-full text-center px-4 py-3"
                  style={displayStyle}
                >
                  {displayTitle}
                </button>
              )}
            </div>
          </div>
        );
      }

      const textValue = visualization.textBody || '';

      if (isPreview) {
        return (
          <div className="p-4" style={{ height: visualization.height }}>
            <div
              className="h-full"
              style={{
                color: visualization.textColor,
                fontSize: scaledBodyFontSize,
                fontFamily: visualization.fontFamily,
                fontWeight: visualization.titleBold ? 'bold' : 'normal',
                fontStyle: visualization.titleItalic ? 'italic' : 'normal',
                whiteSpace: 'pre-wrap'
              }}
            >
              {textValue}
            </div>
          </div>
        );
      }

      return (
        <div className="p-4" style={{ height: visualization.height }}>
          {showTextBox ? (
            <div className="h-full rounded-2xl border-2 border-dashed flex flex-col" style={{ borderColor: '#D7DFEA', background: 'linear-gradient(180deg, rgba(16, 38, 63, 0.03), rgba(59, 130, 246, 0.03))' }}>
              {!isTextBoxVisualization ? null : (
                <div className="px-4 pt-4 text-xs uppercase tracking-wide" style={{ color: '#6D8196' }}>Text Box</div>
              )}
              <textarea
                value={textValue}
                onChange={(e) => onUpdate({ textBody: e.target.value })}
                placeholder="Add your text here"
                className="flex-1 w-full resize-none bg-transparent outline-none px-4 py-3"
                style={{
                  color: visualization.textColor,
                  fontSize: scaledBodyFontSize,
                  fontFamily: visualization.fontFamily,
                  fontWeight: visualization.titleBold ? 'bold' : 'normal',
                  fontStyle: visualization.titleItalic ? 'italic' : 'normal',
                  minHeight: visualization.height - 60
                }}
              />
            </div>
          ) : (
            <div className="h-full" />
          )}
        </div>
      );
    }

    if (visualization.type === 'table') {
      return (
        <div className="overflow-auto" style={{ height: visualization.height }}>
          <table className="w-full text-sm" style={{
            fontFamily: visualization.fontFamily,
            fontSize: scaledFontSize,
            color: visualization.textColor
          }}>
            <thead className="sticky top-0" style={{ background: 'linear-gradient(to right, rgba(16, 38, 63, 0.08), rgba(59, 130, 246, 0.12))', zIndex: 10 }}>
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2 text-left border-b text-xs uppercase whitespace-nowrap" style={{ color: '#10263f' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-blue-50">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2 whitespace-nowrap">{String(row[col] || '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const commonAxisProps = {
      tick: { fontSize: scaledFontSize, fill: visualization.textColor, fontFamily: visualization.fontFamily }
    };

    return (
      <ResponsiveContainer width="100%" height={visualization.height}>
        {visualization.type === 'bar' ? (
          <BarChart data={chartData}>
            {visualization.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={axisLabelHeight}
              label={{ value: visualization.xAxis, position: 'insideBottom', offset: -5 }}
              {...commonAxisProps}
            />
            <YAxis label={{ value: visualization.yAxis, angle: -90, position: 'insideLeft', offset: -5 }} {...commonAxisProps} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: scaledFontSize, fontFamily: visualization.fontFamily }} />}
            <Bar dataKey="value" fill={visualization.chartColor} name={visualization.yAxis} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : visualization.type === 'column' ? (
          <BarChart data={chartData} layout="vertical">
            {visualization.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              type="number"
              label={{ value: visualization.yAxis, position: 'insideBottom', offset: -5 }}
              {...commonAxisProps}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={axisLabelWidth}
              label={{ value: visualization.xAxis, angle: -90, position: 'insideLeft', offset: -5 }}
              {...commonAxisProps}
            />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: scaledFontSize, fontFamily: visualization.fontFamily }} />}
            <Bar dataKey="value" fill={visualization.chartColor} name={visualization.yAxis} radius={[0, 4, 4, 0]} />
          </BarChart>
        ) : visualization.type === 'stackedBar' ? (
          <BarChart data={chartData}>
            {visualization.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={axisLabelHeight}
              label={{ value: visualization.xAxis, position: 'insideBottom', offset: -5 }}
              {...commonAxisProps}
            />
            <YAxis label={{ value: visualization.yAxis, angle: -90, position: 'insideLeft', offset: -5 }} {...commonAxisProps} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: scaledFontSize, fontFamily: visualization.fontFamily }} />}
            <Bar dataKey="value" stackId="a" fill={visualization.chartColor} name={visualization.yAxis} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : visualization.type === 'line' ? (
          <LineChart data={chartData}>
            {visualization.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={axisLabelHeight}
              label={{ value: visualization.xAxis, position: 'insideBottom', offset: -5 }}
              {...commonAxisProps}
            />
            <YAxis label={{ value: visualization.yAxis, angle: -90, position: 'insideLeft', offset: -5 }} {...commonAxisProps} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: scaledFontSize, fontFamily: visualization.fontFamily }} />}
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
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={axisLabelHeight}
              label={{ value: visualization.xAxis, position: 'insideBottom', offset: -5 }}
              {...commonAxisProps}
            />
            <YAxis label={{ value: visualization.yAxis, angle: -90, position: 'insideLeft', offset: -5 }} {...commonAxisProps} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: scaledFontSize, fontFamily: visualization.fontFamily }} />}
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
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: scaledFontSize, fontFamily: visualization.fontFamily }} />}
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
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: scaledFontSize, fontFamily: visualization.fontFamily }} />}
          </PieChart>
        ) : visualization.type === 'scatter' ? (
          <ScatterChart>
            {visualization.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              dataKey="x"
              name={visualization.xAxis}
              label={{ value: visualization.xAxis, position: 'insideBottom', offset: -5 }}
              {...commonAxisProps}
            />
            <YAxis
              dataKey="y"
              name={visualization.yAxis}
              label={{ value: visualization.yAxis, angle: -90, position: 'insideLeft', offset: -5 }}
              {...commonAxisProps}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            {visualization.showLegend && <Legend wrapperStyle={{ fontSize: scaledFontSize, fontFamily: visualization.fontFamily }} />}
            <Scatter name={`${visualization.xAxis} vs ${visualization.yAxis}`} data={chartData} fill={visualization.chartColor} />
          </ScatterChart>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <p className="text-[#D7DFEA]">Unsupported chart type: {visualization.type}</p>
          </div>
        )}
      </ResponsiveContainer>
    );
  };

  const saveTitle = (val: string) => {
    onUpdate({ title: val });
    setIsEditingTitle(false);
  };

  const handleTitleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  return (
    <div
      ref={cardRef}
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 overflow-hidden relative ${
        isPreview ? '' : 'group transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]'
      }`}
      style={{ width: Math.max(visualization.width, minCardWidth), borderColor: '#D7DFEA' }}
    >
      {!isPreview && (
        <div className="border-b-2 px-5 py-4" style={{ background: '#FFFFFF', borderColor: '#D7DFEA' }}>
          <div
            className="relative w-full flex items-center justify-end"
            onMouseEnter={() => setShowTitleControls(true)}
            onMouseLeave={() => setShowTitleControls(false)}
          >
            <div
              className={`flex items-center space-x-1.5 flex-wrap gap-y-1.5 justify-end transition-all duration-200 ${showTitleControls || isEditingTitle ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-70 translate-x-0 pointer-events-auto'}`}
            >
              {canConfigureAxes && (
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
              )}
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
              {canShowTextFormatting && (
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
              )}
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
        </div>
      )}

      {/* Configuration Panel - Axes */}
      {!isPreview && showConfig && canConfigureAxes && (
        <div className="border-b-2 p-5" style={{ background: '#FFFFFF', borderColor: '#D7DFEA' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[#10263f] text-sm mb-2">X-Axis (Category)</label>
              <select
                value={visualization.xAxis}
                onChange={(e) => onUpdate({ xAxis: e.target.value })}
                className="w-full px-3 py-2 border-2 border-[#D7DFEA] rounded-lg focus:border-blue-500 outline-none"
              >
                {columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#10263f] text-sm mb-2">Y-Axis (Value)</label>
              <select
                value={visualization.yAxis}
                onChange={(e) => onUpdate({ yAxis: e.target.value })}
                className="w-full px-3 py-2 border-2 border-[#D7DFEA] rounded-lg focus:border-blue-500 outline-none"
              >
                {columns.map((col) => (
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
                  : 'border-[#D7DFEA]'
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
                  : 'border-[#D7DFEA]'
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
      {!isPreview && showTitleFormatting && (
        <div className="border-b-2 p-5" style={{ background: '#FFFFFF', borderColor: '#D7DFEA' }}>
          <div className="text-sm mb-3 text-[#10263f]">Title Formatting</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[#10263f] text-xs mb-1">Font Family</label>
              <select
                value={visualization.titleFontFamily}
                onChange={(e) => onUpdate({ titleFontFamily: e.target.value })}
                className="w-full px-2 py-1 border-2 border-[#D7DFEA] rounded outline-none text-sm"
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
              <label className="block text-[#10263f] text-xs mb-1">Font Size: {visualization.titleFontSize}px</label>
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
              <label className="block text-[#10263f] text-xs mb-1">Title Color</label>
              <input
                type="color"
                value={visualization.titleColor}
                onChange={(e) => onUpdate({ titleColor: e.target.value })}
                className="w-full h-9 rounded border-2 border-[#D7DFEA] cursor-pointer"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={() => onUpdate({ titleBold: !visualization.titleBold })}
                className={`flex-1 px-3 py-2 rounded border-2 transition-all ${
                  visualization.titleBold
                    ? 'text-white border-transparent'
                    : 'border-[#D7DFEA] hover:border-green-400'
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
                    : 'border-[#D7DFEA] hover:border-green-400'
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
      {!isPreview && showTextFormatting && canShowTextFormatting && (
        <div className="border-b-2 p-5" style={{ background: '#FFFFFF', borderColor: '#D7DFEA' }}>
          <div className="text-sm mb-3 text-[#10263f]">Chart Text Formatting</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#10263f] text-xs mb-1">Font Family</label>
              <select
                value={visualization.fontFamily}
                onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                className="w-full px-2 py-1 border-2 border-[#D7DFEA] rounded focus:border-orange-500 outline-none text-sm"
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
              <label className="block text-[#10263f] text-xs mb-1">Font Size: {visualization.fontSize}px</label>
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
              <label className="block text-[#10263f] text-xs mb-1">Text Color</label>
              <input
                type="color"
                value={visualization.textColor}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
                className="w-full h-9 rounded border-2 border-[#D7DFEA] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Color Picker */}
      {!isPreview && showColorPicker && visualization.type !== 'table' && visualization.type !== 'pie' && visualization.type !== 'donut' && (
        <div className="border-b-2 p-5" style={{ background: '#FFFFFF', borderColor: '#D7DFEA' }}>
          <label className="block text-[#10263f] text-sm mb-3">Chart Color</label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((colorObj) => (
              <button
                key={colorObj.value}
                onClick={() => onUpdate({ chartColor: colorObj.value })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  visualization.chartColor === colorObj.value
                    ? 'border-[#10263f] scale-110'
                    : 'border-[#D7DFEA] hover:scale-105'
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
            <label className="block text-[#10263f] text-xs mb-1">Custom Color</label>
            <input
              type="color"
              value={visualization.chartColor}
              onChange={(e) => onUpdate({ chartColor: e.target.value })}
              className="w-full h-10 rounded border-2 border-[#D7DFEA] cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Chart Content */}
      <div className="p-6 relative" style={{ background: '#FFFFFF' }}>
        {!isTextVisualization && visualization.title && (
          <div className="absolute left-6 right-6 top-3 z-20">
            {isEditingTitle && !isPreview ? (
              <input
                ref={(el) => (titleInputRef.current = el)}
                type="text"
                value={visualization.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                onBlur={(e) => saveTitle(e.target.value)}
                onKeyDown={handleTitleKey}
                style={titleStyle}
                className="w-full bg-white/90 border-2 border-[#D7DFEA] rounded-xl px-3 py-2 outline-none"
              />
            ) : (
              <div onClick={() => !isPreview && setIsEditingTitle(true)} style={{ cursor: isPreview ? 'default' : 'text' }}>
                <div style={titleStyle} className="text-base font-semibold truncate text-center">{visualization.title}</div>
              </div>
            )}
          </div>
        )}
        {renderChart()}
        {!isPreview && (
          <>
            <div
              className="absolute bottom-0 right-0 w-7 h-7 cursor-nwse-resize opacity-70 hover:opacity-100 transition-all duration-200"
              style={{ background: '#6D8196' }}
              onMouseDown={(e) => startResize('both', e)}
              title="Resize"
            />
            <div
              className="absolute bottom-0 left-0 w-7 h-7 cursor-nesw-resize opacity-70 hover:opacity-100 transition-all duration-200"
              style={{ background: '#6D8196' }}
              onMouseDown={(e) => startResize('both', e)}
              title="Resize"
            />
            <div
              className="absolute top-0 right-0 w-7 h-7 cursor-nesw-resize opacity-70 hover:opacity-100 transition-all duration-200"
              style={{ background: '#6D8196' }}
              onMouseDown={(e) => startResize('both', e)}
              title="Resize"
            />
            <div
              className="absolute top-0 left-0 w-7 h-7 cursor-nwse-resize opacity-70 hover:opacity-100 transition-all duration-200"
              style={{ background: '#6D8196' }}
              onMouseDown={(e) => startResize('both', e)}
              title="Resize"
            />
            <div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-4 cursor-ns-resize opacity-70 hover:opacity-100 rounded-t-lg transition-all duration-200"
              style={{ background: '#6D8196' }}
              onMouseDown={(e) => startResize('height', e)}
              title="Resize height"
            />
            <div
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-4 cursor-ns-resize opacity-70 hover:opacity-100 rounded-b-lg transition-all duration-200"
              style={{ background: '#6D8196' }}
              onMouseDown={(e) => startResize('height', e)}
              title="Resize height"
            />
            <div
              className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-24 cursor-ew-resize opacity-70 hover:opacity-100 rounded-l-lg transition-all duration-200"
              style={{ background: '#6D8196' }}
              onMouseDown={(e) => startResize('width', e)}
              title="Resize width"
            />
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-24 cursor-ew-resize opacity-70 hover:opacity-100 rounded-r-lg transition-all duration-200"
              style={{ background: '#6D8196' }}
              onMouseDown={(e) => startResize('width', e)}
              title="Resize width"
            />
          </>
        )}
      </div>

        {/* Footer */}
      {visualization.type !== 'table' && (
        <div className="border-t-2 px-5 py-3 text-xs flex items-center justify-between" style={{ background: '#FFFFFF', borderColor: '#D7DFEA' }}>
          <div />
          {!isPreview && (
            <div className="flex items-center space-x-3 text-[#D7DFEA]">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{chartData.length} points</span>
              </span>
              <span className="text-[#D7DFEA]">•</span>
              <span>{visualization.width}×{visualization.height}px</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}





