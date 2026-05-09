import { useState, useRef } from 'react';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table2,
  Sparkles,
  FileSpreadsheet,
  Plus,
  X,
  Home,
  Lightbulb,
  TrendingUp,
  Target,
  Layers,
  Activity,
  Camera,
  Settings
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { VisualizationCard } from './VisualizationCard';

interface ReportViewProps {
  data: any[];
  fileName: string;
  onTransformData: () => void;
  onViewInsights: () => void;
  onBackToHome: () => void;
}

export interface Visualization {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'table' | 'stackedBar' | 'area' | 'donut' | 'scatter' | 'column';
  xAxis: string;
  yAxis: string;
  title: string;
  titleColor: string;
  titleFontSize: number;
  titleFontFamily: string;
  titleBold: boolean;
  titleItalic: boolean;
  chartColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  showLegend: boolean;
  showGrid: boolean;
  width: number;
  height: number;
}

export function ReportView({ data, fileName, onTransformData, onViewInsights, onBackToHome }: ReportViewProps) {
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [showFieldsPane, setShowFieldsPane] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const numericColumns = columns.filter(col => {
    const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
    return values.length > 0 && !isNaN(Number(values[0]));
  });
  const categoricalColumns = columns.filter(col => {
    const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
    if (values.length === 0) return false;
    const uniqueCount = new Set(values).size;
    return uniqueCount < 50 && isNaN(Number(values[0]));
  });

  const addVisualization = (type: Visualization['type']) => {
    const newViz: Visualization = {
      id: `viz-${Date.now()}-${Math.random()}`,
      type,
      xAxis: categoricalColumns[0] || columns[0] || '',
      yAxis: numericColumns[0] || columns[1] || '',
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
      titleColor: '#3D3D3D',
      titleFontSize: 20,
      titleFontFamily: 'ui-sans-serif, system-ui, sans-serif',
      titleBold: true,
      titleItalic: false,
      chartColor: '#5B6B7F',
      textColor: '#3D3D3D',
      fontSize: 12,
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      showLegend: true,
      showGrid: true,
      width: 700,
      height: 450
    };
    setVisualizations([...visualizations, newViz]);
  };

  const updateVisualization = (id: string, updates: Partial<Visualization>) => {
    setVisualizations(visualizations.map(viz =>
      viz.id === id ? { ...viz, ...updates } : viz
    ));
  };

  const removeVisualization = (id: string) => {
    setVisualizations(visualizations.filter(viz => viz.id !== id));
  };

  const handleDownloadCSV = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          const stringValue = String(value ?? '');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName.replace(/\.[^/.]+$/, '')}_data_${Date.now()}.csv`;
    link.click();
  };

  const handleDownloadDashboard = async () => {
    if (!canvasRef.current) return;

    try {
      const dataUrl = await toPng(canvasRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const link = document.createElement('a');
      link.download = `Dashboard_${fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading dashboard:', error);
      alert('Unable to export dashboard. Please try again.');
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f4f6fb' }}>
      {/* Top Ribbon */}
      <div className="bg-white/90 backdrop-blur-sm border-b shadow-lg" style={{ borderColor: '#d7dfea' }}>
        <div className="px-8 py-4 flex items-center justify-between border-b" style={{ borderColor: '#d7dfea' }}>
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl shadow-lg" style={{ background: '#5B6B7F' }}>
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#3D3D3D' }}>
                Interactive Dashboard
              </h1>
              <div className="text-sm flex items-center space-x-2 mt-1" style={{ color: '#6B6B6B' }}>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{fileName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToHome}
              className="px-5 py-2.5 bg-white border-2 rounded-xl hover:shadow-md text-sm font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
              style={{ borderColor: '#D4D0C0' }}
            >
              <Home className="w-4 h-4" style={{ color: '#3D3D3D' }} />
              <span style={{ color: '#3D3D3D' }}>Home</span>
            </button>

            <button
              onClick={onViewInsights}
              className="px-5 py-2.5 bg-white border-2 rounded-xl hover:shadow-md text-sm font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
              style={{ borderColor: '#D4D0C0' }}
            >
              <Lightbulb className="w-4 h-4" style={{ color: '#5B6B7F' }} />
              <span style={{ color: '#3D3D3D' }}>Insights</span>
            </button>

            <button
              onClick={onTransformData}
              className="px-5 py-2.5 bg-white border-2 rounded-xl hover:shadow-md text-sm font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
              style={{ borderColor: '#D4D0C0' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#6B6B6B' }} />
              <span style={{ color: '#3D3D3D' }}>Transform</span>
            </button>

            <div className="h-10 mx-2" style={{ borderLeft: '2px solid #D4D0C0' }}></div>

            <button
              onClick={handleDownloadCSV}
              className="px-5 py-2.5 text-white rounded-xl text-sm font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{ background: '#5B6B7F' }}
              title="Download data as CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleDownloadDashboard}
              className="px-5 py-2.5 text-white rounded-xl text-sm font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: '#5B6B7F' }}
              disabled={visualizations.length === 0}
              title="Download entire dashboard as image"
            >
              <Camera className="w-4 h-4" />
              <span>Export Dashboard</span>
            </button>
          </div>
        </div>

        <div className="px-8 py-5" style={{ background: '#F8F6F0' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Plus className="w-5 h-5" style={{ color: '#5B6B7F' }} />
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#3D3D3D' }}>Insert Visualizations</span>
            </div>
            <div className="text-xs" style={{ color: '#6B6B6B' }}>{visualizations.length} chart{visualizations.length !== 1 ? 's' : ''} added</div>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-9 gap-3">
            <button
              onClick={() => addVisualization('bar')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: '#D4D0C0' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: '#E8E4D6' }}>
                <BarChart3 className="w-6 h-6 transition-colors duration-300" style={{ color: '#5B6B7F' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#3D3D3D' }}>Bar</span>
            </button>

            <button
              onClick={() => addVisualization('column')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: '#D4D0C0' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: '#E8E4D6' }}>
                <BarChart3 className="w-6 h-6 transform rotate-90 transition-colors duration-300" style={{ color: '#5B6B7F' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#3D3D3D' }}>Column</span>
            </button>

            <button
              onClick={() => addVisualization('stackedBar')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: '#D4D0C0' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: '#E8E4D6' }}>
                <Layers className="w-6 h-6 transition-colors duration-300" style={{ color: '#5B6B7F' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#3D3D3D' }}>Stacked</span>
            </button>

            <button
              onClick={() => addVisualization('line')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: '#D4D0C0' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: '#E8E4D6' }}>
                <LineChartIcon className="w-6 h-6 transition-colors duration-300" style={{ color: '#5B6B7F' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#3D3D3D' }}>Line</span>
            </button>

            <button
              onClick={() => addVisualization('area')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: '#D4D0C0' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: '#E8E4D6' }}>
                <Activity className="w-6 h-6 transition-colors duration-300" style={{ color: '#5B6B7F' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#3D3D3D' }}>Area</span>
            </button>

            <button
              onClick={() => addVisualization('pie')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: '#D4D0C0' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: '#E8E4D6' }}>
                <PieChartIcon className="w-6 h-6 transition-colors duration-300" style={{ color: '#5B6B7F' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#3D3D3D' }}>Pie</span>
            </button>

            <button
              onClick={() => addVisualization('donut')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: '#D4D0C0' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: '#E8E4D6' }}>
                <Target className="w-6 h-6 transition-colors duration-300" style={{ color: '#5B6B7F' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#3D3D3D' }}>Donut</span>
            </button>

            <button
              onClick={() => addVisualization('scatter')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: '#D4D0C0' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: '#E8E4D6' }}>
                <TrendingUp className="w-6 h-6 transition-colors duration-300" style={{ color: '#5B6B7F' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#3D3D3D' }}>Scatter</span>
            </button>

            <button
              onClick={() => addVisualization('table')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: '#D4D0C0' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: '#E8E4D6' }}>
                <Table2 className="w-6 h-6 transition-colors duration-300" style={{ color: '#5B6B7F' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#3D3D3D' }}>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div ref={canvasRef} className="flex-1 overflow-auto p-6 bg-gray-100">
          {visualizations.length === 0 ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center max-w-lg">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-20 animate-pulse" style={{ background: '#D4D0C0' }}></div>
                  <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border" style={{ borderColor: '#D4D0C0' }}>
                    <div className="mb-4 relative inline-block">
                      <div className="p-4 rounded-2xl shadow-lg" style={{ background: '#5B6B7F' }}>
                        <Plus className="w-12 h-12 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center animate-ping" style={{ background: '#D4D0C0' }}>
                        <Sparkles className="w-3 h-3" style={{ color: '#3D3D3D' }} />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-3" style={{ color: '#3D3D3D' }}>
                      Build Your Dashboard
                    </h2>
                    <p className="text-sm mb-6 leading-relaxed" style={{ color: '#6B6B6B' }}>
                      Start creating beautiful visualizations! Click any chart type above to begin.
                      <br />
                      <span className="text-xs" style={{ color: '#6B6B6B' }}>Fully customizable • Drag to resize • Professional exports</span>
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border" style={{ background: '#F8F6F0', borderColor: '#D4D0C0' }}>
                        <div className="text-2xl font-bold" style={{ color: '#5B6B7F' }}>{data.length.toLocaleString()}</div>
                        <div className="text-xs mt-0.5 font-medium" style={{ color: '#3D3D3D' }}>Records</div>
                      </div>
                      <div className="p-3 rounded-xl border" style={{ background: '#F8F6F0', borderColor: '#D4D0C0' }}>
                        <div className="text-2xl font-bold" style={{ color: '#5B6B7F' }}>{numericColumns.length}</div>
                        <div className="text-xs mt-0.5 font-medium" style={{ color: '#3D3D3D' }}>Numeric Fields</div>
                      </div>
                      <div className="p-3 rounded-xl border" style={{ background: '#F8F6F0', borderColor: '#D4D0C0' }}>
                        <div className="text-2xl font-bold" style={{ color: '#5B6B7F' }}>{categoricalColumns.length}</div>
                        <div className="text-xs mt-0.5 font-medium" style={{ color: '#3D3D3D' }}>Categories</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6 items-start justify-start">
              {visualizations.map((viz) => (
                <VisualizationCard
                  key={viz.id}
                  visualization={viz}
                  data={data}
                  columns={columns}
                  numericColumns={numericColumns}
                  onUpdate={(updates) => updateVisualization(viz.id, updates)}
                  onRemove={() => removeVisualization(viz.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Fields Pane */}
        {showFieldsPane && (
          <div className="w-80 bg-white/90 backdrop-blur-sm border-l-2 flex flex-col shadow-2xl" style={{ borderColor: '#D4D0C0' }}>
            <div className="p-5 border-b-2" style={{ borderColor: '#D4D0C0', background: '#F8F6F0' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg" style={{ background: '#5B6B7F' }}>
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: '#3D3D3D' }}>Data Fields</h3>
                </div>
                <button
                  onClick={() => setShowFieldsPane(false)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200 group"
                >
                  <X className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                </button>
              </div>

              <div className="rounded-2xl p-4 shadow-lg" style={{ background: '#5B6B7F' }}>
                <div className="text-white font-semibold">{fileName.replace(/\.[^/.]+$/, '')}</div>
                <div className="text-sm mt-1 flex items-center space-x-1" style={{ color: '#F8F6F0' }}>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{data.length.toLocaleString()} rows</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {columns.map((col) => {
                  const isNumeric = numericColumns.includes(col);
                  return (
                    <div
                      key={col}
                      className={`group flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer text-sm border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                        isNumeric
                          ? 'border-[#D4D0C0] hover:border-[#5B6B7F]'
                          : 'border-[#D4D0C0] hover:border-[#5B6B7F]'
                      }`}
                      title={`${col} (${isNumeric ? 'Numeric' : 'Text'})`}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold shadow-sm transition-all duration-200 group-hover:scale-110 text-white" style={{ background: isNumeric ? '#5B6B7F' : '#6B6B6B' }}>
                        {isNumeric ? '∑' : 'Aa'}
                      </div>
                      <span className="font-medium" style={{ color: '#3D3D3D' }}>{col}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t-2" style={{ borderColor: '#D4D0C0', background: '#F8F6F0' }}>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#5B6B7F' }}></div>
                <span className="text-sm font-semibold" style={{ color: '#3D3D3D' }}>{columns.length} Fields Available</span>
              </div>
              <div className="text-xs flex items-center space-x-1" style={{ color: '#6B6B6B' }}>
                <Settings className="w-3 h-3" />
                <span>Click chart settings to configure</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
