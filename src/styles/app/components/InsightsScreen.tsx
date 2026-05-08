import { useRef } from 'react';
import { ArrowRight, ArrowLeft, Home, TrendingUp, Award, BarChart3, Activity, Download, Lightbulb } from 'lucide-react';
import { toPng } from 'html-to-image';

interface InsightsScreenProps {
  data: any[];
  fileName: string;
  onCreateReport: () => void;
  onBackToCompare: () => void;
  onBackToHome: () => void;
}

export function InsightsScreen({ data, fileName, onCreateReport, onBackToCompare, onBackToHome }: InsightsScreenProps) {
  const insightsRef = useRef<HTMLDivElement>(null);
  const columns = Object.keys(data[0] || {});

  const handleDownloadInsights = async () => {
    if (!insightsRef.current) return;

    try {
      const dataUrl = await toPng(insightsRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const link = document.createElement('a');
      link.download = `Insights_${fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading insights:', error);
      alert('Unable to export insights. Please try again.');
    }
  };

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

  const getNumericInsights = (colName: string) => {
    const values = data.map(row => Number(row[colName])).filter(v => !isNaN(v));
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    let trend = 'stable';
    if (values.length >= 3) {
      const firstThird = values.slice(0, Math.floor(values.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 3);
      const lastThird = values.slice(-Math.floor(values.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 3);
      if (lastThird > firstThird * 1.1) trend = 'increasing';
      else if (lastThird < firstThird * 0.9) trend = 'decreasing';
    }

    return { mean, median, min, max, range, stdDev, trend };
  };

  const getCategoricalInsights = (colName: string) => {
    const values = data.map(row => row[colName]).filter(v => v !== null && v !== undefined && v !== '');
    const frequency: { [key: string]: number } = {};
    values.forEach(v => {
      const key = String(v);
      frequency[key] = (frequency[key] || 0) + 1;
    });

    const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
    const mostFrequent = sorted.slice(0, 5);
    const uniqueCount = Object.keys(frequency).length;

    return { mostFrequent, uniqueCount, totalValues: values.length };
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: '#E8E4D6' }}>
      {/* Header */}
      <div className="backdrop-blur-sm border-b-2 px-8 py-5 shadow-xl text-white" style={{ background: '#5B6B7F', borderColor: '#D4D0C0' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl shadow-lg" style={{ background: '#5B6B7F' }}>
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Data Insights & Analytics
              </h1>
              <p className="mt-1 flex items-center space-x-2" style={{ color: '#F8F6F0' }}>
                <Activity className="w-4 h-4" />
                <span>{fileName}</span>
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onBackToHome}
              className="px-5 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl hover:bg-white/30 hover:border-white/50 hover:shadow-md font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={onBackToCompare}
              className="px-5 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl hover:bg-white/30 hover:border-white/50 hover:shadow-md font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleDownloadInsights}
              className="px-5 py-2.5 text-white rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{ background: '#5B6B7F' }}
            >
              <Download className="w-4 h-4" />
              <span>Export Insights</span>
            </button>
            <button
              onClick={onCreateReport}
              className="px-6 py-2.5 text-white rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{ background: '#5B6B7F' }}
            >
              <span>Create Visualizations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div ref={insightsRef} className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-white rounded-2xl shadow-xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl" style={{ borderColor: '#CBCBCB' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, #6D8196, #4A4A4A)' }}>
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#6D8196' }}></div>
              </div>
              <div className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: '#6D8196' }}>Total Records</div>
              <div className="text-5xl font-bold" style={{ color: '#4A4A4A' }}>
                {data.length.toLocaleString()}
              </div>
            </div>
            <div className="group bg-white rounded-2xl shadow-xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl" style={{ borderColor: '#CBCBCB' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, #6D8196, #4A4A4A)' }}>
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#6D8196' }}></div>
              </div>
              <div className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: '#6D8196' }}>Numeric Fields</div>
              <div className="text-5xl font-bold" style={{ color: '#4A4A4A' }}>
                {numericColumns.length}
              </div>
            </div>
            <div className="group bg-white rounded-2xl shadow-xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl" style={{ borderColor: '#CBCBCB' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, #6D8196, #4A4A4A)' }}>
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#6D8196' }}></div>
              </div>
              <div className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: '#6D8196' }}>Categorical Fields</div>
              <div className="text-5xl font-bold" style={{ color: '#4A4A4A' }}>
                {categoricalColumns.length}
              </div>
            </div>
          </div>

          {/* Numeric Insights */}
          {numericColumns.length > 0 && (
            <div className="backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: '#CBCBCB' }}>
              <div className="px-8 py-6 text-white" style={{ background: 'linear-gradient(135deg, #6D8196 0%, #4A4A4A 100%)' }}>
                <h2 className="text-2xl font-bold flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <BarChart3 className="w-7 h-7" />
                  </div>
                  <span>Numeric Column Analytics</span>
                </h2>
              </div>
              <div className="p-8 space-y-8">
                {numericColumns.map(col => {
                  const insights = getNumericInsights(col);
                  if (!insights) return null;

                  return (
                    <div key={col} className="border-2 rounded-2xl p-8 hover:shadow-xl transition-all duration-300" style={{ borderColor: '#CBCBCB', background: 'linear-gradient(to bottom right, rgba(255, 255, 227, 0.3), rgba(203, 203, 203, 0.1))' }}>
                      <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2" style={{ color: '#4A4A4A' }}>
                        <div className="w-1.5 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #6D8196, #4A4A4A)' }}></div>
                        <span>{col}</span>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div className="group bg-white p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 hover:scale-105 border-2" style={{ borderColor: '#CBCBCB' }}>
                          <div className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: '#6D8196' }}>Mean</div>
                          <div className="text-3xl font-bold" style={{ color: '#4A4A4A' }}>{insights.mean.toFixed(2)}</div>
                        </div>
                        <div className="group bg-white p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 hover:scale-105 border-2" style={{ borderColor: '#CBCBCB' }}>
                          <div className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: '#6D8196' }}>Median</div>
                          <div className="text-3xl font-bold" style={{ color: '#6D8196' }}>{insights.median.toFixed(2)}</div>
                        </div>
                        <div className="group bg-white p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 hover:scale-105 border-2" style={{ borderColor: '#CBCBCB' }}>
                          <div className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: '#6D8196' }}>Range</div>
                          <div className="text-xl font-bold" style={{ color: '#4A4A4A' }}>{insights.min.toFixed(1)} - {insights.max.toFixed(1)}</div>
                        </div>
                        <div className="group bg-white p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 hover:scale-105 border-2" style={{ borderColor: '#CBCBCB' }}>
                          <div className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: '#6D8196' }}>Std Dev</div>
                          <div className="text-3xl font-bold" style={{ color: '#4A4A4A' }}>{insights.stdDev.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border-l-4 shadow-lg" style={{ borderLeftColor: '#6D8196' }}>
                        <div className="flex items-start space-x-3">
                          <TrendingUp className="w-6 h-6 mt-1" style={{ color: '#6D8196' }} />
                          <div>
                            <div className="mb-1" style={{ color: '#4A4A4A' }}>
                              <strong>Trend:</strong> {insights.trend.charAt(0).toUpperCase() + insights.trend.slice(1)}
                            </div>
                            <div className="text-sm" style={{ color: '#6D8196' }}>
                              <strong>Interpretation:</strong> The {col} field has a mean value of <strong>{insights.mean.toFixed(2)}</strong> with
                              values ranging from <strong>{insights.min.toFixed(1)}</strong> to <strong>{insights.max.toFixed(1)}</strong>.
                              The data shows a <strong>{insights.trend}</strong> pattern across the dataset.
                              Standard deviation of <strong>{insights.stdDev.toFixed(2)}</strong> indicates {insights.stdDev / insights.mean < 0.3 ? 'low' : insights.stdDev / insights.mean < 0.7 ? 'moderate' : 'high'} variability.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categorical Insights */}
          {categoricalColumns.length > 0 && (
            <div className="backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: '#CBCBCB' }}>
              <div className="px-8 py-6 text-white" style={{ background: 'linear-gradient(135deg, #6D8196 0%, #4A4A4A 100%)' }}>
                <h2 className="text-2xl font-bold flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Award className="w-7 h-7" />
                  </div>
                  <span>Categorical Column Analytics</span>
                </h2>
              </div>
              <div className="p-8 space-y-8">
                {categoricalColumns.map(col => {
                  const insights = getCategoricalInsights(col);
                  if (!insights) return null;

                  return (
                    <div key={col} className="border-2 rounded-2xl p-8 hover:shadow-xl transition-all duration-300" style={{ borderColor: '#CBCBCB', background: 'linear-gradient(to bottom right, rgba(255, 255, 227, 0.3), rgba(203, 203, 203, 0.1))' }}>
                      <h3 className="text-2xl font-bold mb-4 flex items-center space-x-2" style={{ color: '#4A4A4A' }}>
                        <div className="w-1.5 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #6D8196, #4A4A4A)' }}></div>
                        <span>{col}</span>
                      </h3>
                      <div className="mb-6 text-base">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-md">
                          <span style={{ color: '#6D8196' }}>Total:</span>
                          <strong style={{ color: '#4A4A4A' }}>{insights.uniqueCount}</strong>
                          <span style={{ color: '#6D8196' }}>unique values from</span>
                          <strong style={{ color: '#4A4A4A' }}>{insights.totalValues}</strong>
                          <span style={{ color: '#6D8196' }}>records</span>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl mb-6 shadow-lg">
                        <div className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: '#6D8196' }}>Top 5 Most Frequent Values</div>
                        <div className="space-y-3">
                          {insights.mostFrequent.map(([value, count], idx) => (
                            <div key={idx} className="flex items-center space-x-4 group">
                              <div className="flex-1 rounded-2xl h-10 relative overflow-hidden shadow-sm group-hover:shadow-md transition-shadow" style={{ backgroundColor: 'rgba(203, 203, 203, 0.3)' }}>
                                <div
                                  className="h-10 flex items-center px-5 text-white font-semibold text-sm transition-all duration-500"
                                  style={{
                                    width: `${(count / insights.totalValues) * 100}%`,
                                    background: 'linear-gradient(to right, #6D8196, #4A4A4A)'
                                  }}
                                >
                                  {value}
                                </div>
                              </div>
                              <div className="text-sm w-28 text-right font-semibold">
                                <div style={{ color: '#4A4A4A' }}>{count}</div>
                                <div className="text-xs" style={{ color: '#6D8196' }}>({((count / insights.totalValues) * 100).toFixed(1)}%)</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border-l-4 shadow-lg" style={{ borderLeftColor: '#6D8196' }}>
                        <div className="text-sm leading-relaxed" style={{ color: '#4A4A4A' }}>
                          <span className="font-bold" style={{ color: '#6D8196' }}>💡 Interpretation:</span> The <strong>{col}</strong> field contains <strong style={{ color: '#6D8196' }}>{insights.uniqueCount}</strong> distinct categories.
                          The most common value is "<strong style={{ color: '#4A4A4A' }}>{insights.mostFrequent[0][0]}</strong>" which appears in <strong style={{ color: '#6D8196' }}>{insights.mostFrequent[0][1]}</strong> records
                          (<strong style={{ color: '#6D8196' }}>{((insights.mostFrequent[0][1] / insights.totalValues) * 100).toFixed(1)}%</strong> of all data).
                          This suggests <strong style={{ color: '#4A4A4A' }}>{insights.uniqueCount < 5 ? 'low diversity with concentrated distribution' :
                            insights.uniqueCount < 10 ? 'moderate diversity' :
                            'high diversity with well-distributed categories'}</strong>.
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
