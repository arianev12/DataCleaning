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
  Settings,
  Type
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
  type: 'bar' | 'line' | 'pie' | 'table' | 'stackedBar' | 'area' | 'donut' | 'scatter' | 'column' | 'text';
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
      xAxis: type === 'text' ? '' : (categoricalColumns[0] || columns[0] || ''),
      yAxis: type === 'text' ? '' : (numericColumns[0] || columns[1] || ''),
      title: type === 'text' ? 'Add your title here' : `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
      titleColor: '#10263f',
      titleFontSize: 20,
      titleFontFamily: 'ui-sans-serif, system-ui, sans-serif',
      titleBold: true,
      titleItalic: false,
      chartColor: '#3b82f6',
      textColor: '#10263f',
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
      const node = canvasRef.current;
      const width = node.scrollWidth;
      const height = node.scrollHeight;

      const dataUrl = await toPng(canvasRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'visible'
        }
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
      <div className="backdrop-blur-sm border-b-2 shadow-lg text-white" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)', borderColor: '#123a5a' }}>
        <div className="px-8 py-4 flex items-center justify-between border-b-2" style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Interactive Dashboard
              </h1>
              <div className="text-sm flex items-center space-x-2 mt-1" style={{ color: '#e8f4f8' }}>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{fileName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToHome}
              className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-white/12 backdrop-blur-sm border-2 rounded-xl hover:bg-white/25 text-sm font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
              style={{ borderColor: 'rgba(215,223,234,0.18)' }}
            >
              <Home className="w-4 h-4" style={{ color: '#10263f' }} />
              <span style={{ color: '#10263f' }}>Home</span>
            </button>

            <button
              onClick={onViewInsights}
              className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-white/12 backdrop-blur-sm border-2 rounded-xl hover:bg-white/25 text-sm font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
              style={{ borderColor: 'rgba(215,223,234,0.18)' }}
            >
              <Lightbulb className="w-4 h-4" style={{ color: '#10263f' }} />
              <span style={{ color: '#10263f' }}>Insights</span>
            </button>

            <button
              onClick={onTransformData}
              className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-white/12 backdrop-blur-sm border-2 rounded-xl hover:bg-white/25 text-sm font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
              style={{ borderColor: 'rgba(215,223,234,0.18)' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#5b6b7f' }} />
              <span style={{ color: '#10263f' }}>Transform</span>
            </button>

            <div className="h-8 mx-2" style={{ borderLeft: '2px solid #D7DFEA', opacity: 0.35 }}></div>

            <button
              onClick={handleDownloadCSV}
              className="px-5 py-2.5 text-white rounded-xl text-sm font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}
              title="Download data as CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleDownloadDashboard}
              className="px-5 py-2.5 text-white rounded-xl text-sm font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}
              disabled={visualizations.length === 0}
              title="Download entire dashboard as image"
            >
              <Camera className="w-4 h-4" />
              <span>Export Dashboard</span>
            </button>
          </div>
        </div>

        <div className="px-8 py-5" style={{ background: 'linear-gradient(to right, rgba(18, 58, 90, 0.22), rgba(59, 130, 246, 0.12))' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Plus className="w-5 h-5" style={{ color: '#3b82f6' }} />
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#10263f' }}>Insert Visualizations</span>
            </div>
            <div className="text-xs" style={{ color: '#5b6b7f' }}>{visualizations.length} chart{visualizations.length !== 1 ? 's' : ''} added</div>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-9 gap-3">
            <button
              onClick={() => addVisualization('bar')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(16, 38, 63, 0.2))' }}>
                <BarChart3 className="w-6 h-6 transition-colors duration-300" style={{ color: '#10263f' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#10263f' }}>Bar</span>
            </button>

            <button
              onClick={() => addVisualization('column')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(16, 38, 63, 0.2))' }}>
                <BarChart3 className="w-6 h-6 transform rotate-90 transition-colors duration-300" style={{ color: '#10263f' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#10263f' }}>Column</span>
            </button>

            <button
              onClick={() => addVisualization('stackedBar')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(16, 38, 63, 0.2))' }}>
                <Layers className="w-6 h-6 transition-colors duration-300" style={{ color: '#10263f' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#10263f' }}>Stacked</span>
            </button>

            <button
              onClick={() => addVisualization('line')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(16, 38, 63, 0.2))' }}>
                <LineChartIcon className="w-6 h-6 transition-colors duration-300" style={{ color: '#10263f' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#10263f' }}>Line</span>
            </button>

            <button
              onClick={() => addVisualization('area')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(16, 38, 63, 0.2))' }}>
                <Activity className="w-6 h-6 transition-colors duration-300" style={{ color: '#10263f' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#10263f' }}>Area</span>
            </button>

            <button
              onClick={() => addVisualization('pie')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(16, 38, 63, 0.2))' }}>
                <PieChartIcon className="w-6 h-6 transition-colors duration-300" style={{ color: '#10263f' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#10263f' }}>Pie</span>
            </button>

            <button
              onClick={() => addVisualization('donut')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(16, 38, 63, 0.2))' }}>
                <Target className="w-6 h-6 transition-colors duration-300" style={{ color: '#10263f' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#10263f' }}>Donut</span>
            </button>

            <button
              onClick={() => addVisualization('scatter')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(16, 38, 63, 0.2))' }}>
                <TrendingUp className="w-6 h-6 transition-colors duration-300" style={{ color: '#10263f' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#10263f' }}>Scatter</span>
            </button>

            <button
              onClick={() => addVisualization('table')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(16, 38, 63, 0.2))' }}>
                <Table2 className="w-6 h-6 transition-colors duration-300" style={{ color: '#10263f' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#10263f' }}>Table</span>
            </button>

            <button
              onClick={() => addVisualization('text')}
              className="group flex flex-col items-center px-4 py-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              <div className="p-2 rounded-xl transition-colors duration-300" style={{ background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(16, 38, 63, 0.2))' }}>
                <Type className="w-6 h-6 transition-colors duration-300" style={{ color: '#10263f' }} />
              </div>
              <span className="text-xs font-medium mt-2" style={{ color: '#10263f' }}>Text</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden" style={{ background: '#f4f6fb' }}>
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto w-full max-w-[1280px]">
            <div
              ref={canvasRef}
              className="relative mx-auto min-h-[760px] w-full rounded-2xl border-2 border-dashed shadow-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #fcfdff 100%)',
                borderColor: '#6D8196'
              }}
            >
              <div className="absolute inset-0 pointer-events-none opacity-[0.18]" style={{
                backgroundImage: 'linear-gradient(rgba(16,38,63,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,38,63,0.08) 1px, transparent 1px)',
                backgroundSize: '28px 28px'
              }} />
              <div className="relative z-10 h-full p-6">
                {visualizations.length === 0 ? (
                  <div className="h-full min-h-[700px] flex items-center justify-center p-6">
                    <div className="text-center max-w-lg">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-2xl opacity-20 animate-pulse" style={{ background: '#D4D0C0' }}></div>
                        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border" style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                          <div className="mb-4 relative inline-block">
                            <div className="p-4 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
                              <Plus className="w-12 h-12 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center animate-ping" style={{ background: '#D4D0C0' }}>
                              <Sparkles className="w-3 h-3" style={{ color: '#10263f' }} />
                            </div>
                          </div>
                          <h2 className="text-2xl font-bold mb-3" style={{ color: '#10263f' }}>
                            Build Your Dashboard
                          </h2>
                          <p className="text-sm mb-6 leading-relaxed" style={{ color: '#5b6b7f' }}>
                            Start creating beautiful visualizations. Add them, then keep them inside the dashed page area just like the Power BI canvas.
                            <br />
                            <span className="text-xs" style={{ color: '#5b6b7f' }}>Fully customizable • Drag to resize • Professional exports</span>
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl border" style={{ background: '#F8F6F0', borderColor: '#123a5a' }}>
                              <div className="text-2xl font-bold" style={{ color: '#10263f' }}>{data.length.toLocaleString()}</div>
                              <div className="text-xs mt-0.5 font-medium" style={{ color: '#10263f' }}>Records</div>
                            </div>
                            <div className="p-3 rounded-xl border" style={{ background: '#F8F6F0', borderColor: '#123a5a' }}>
                              <div className="text-2xl font-bold" style={{ color: '#10263f' }}>{numericColumns.length}</div>
                              <div className="text-xs mt-0.5 font-medium" style={{ color: '#10263f' }}>Numeric Fields</div>
                            </div>
                            <div className="p-3 rounded-xl border" style={{ background: '#F8F6F0', borderColor: '#123a5a' }}>
                              <div className="text-2xl font-bold" style={{ color: '#10263f' }}>{categoricalColumns.length}</div>
                              <div className="text-xs mt-0.5 font-medium" style={{ color: '#10263f' }}>Categories</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-6 items-start justify-start content-start">
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
            </div>
          </div>
        </div>

        {/* Right Fields Pane */}
        {showFieldsPane && (
          <div className="w-80 bg-white/90 backdrop-blur-sm border-l-2 flex flex-col shadow-2xl" style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
            <div className="p-5 border-b-2" style={{ borderColor: '#123a5a', background: '#F8F6F0' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: '#10263f' }}>Data Fields</h3>
                </div>
                <button
                  onClick={() => setShowFieldsPane(false)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200 group"
                >
                  <X className="w-4 h-4 text-[#D7DFEA] group-hover:text-[#10263f]" />
                </button>
              </div>

              <div className="rounded-2xl p-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
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
                      <span className="font-medium" style={{ color: '#10263f' }}>{col}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t-2" style={{ borderColor: '#123a5a', background: '#F8F6F0' }}>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}></div>
                <span className="text-sm font-semibold" style={{ color: '#10263f' }}>{columns.length} Fields Available</span>
              </div>
              <div className="text-xs flex items-center space-x-1" style={{ color: '#5b6b7f' }}>
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







