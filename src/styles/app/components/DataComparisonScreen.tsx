import { useState, useRef } from 'react';
import { ArrowRight, ArrowLeft, Home, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { toPng } from 'html-to-image';

interface DataComparisonScreenProps {
  originalData: any[];
  cleanedData: any[];
  fileName: string;
  onViewInsights: () => void;
  onBackToTransform: () => void;
  onBackToHome: () => void;
}

export function DataComparisonScreen({
  originalData,
  cleanedData,
  fileName,
  onViewInsights,
  onBackToTransform,
  onBackToHome
}: DataComparisonScreenProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'original' | 'cleaned'>('side-by-side');
  const comparisonRef = useRef<HTMLDivElement>(null);

  const handleDownloadCleanedCSV = () => {
    if (cleanedData.length === 0) return;

    const headers = Object.keys(cleanedData[0]);
    const csvContent = [
      headers.join(','),
      ...cleanedData.map(row =>
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
    link.download = `${fileName.replace(/\.[^/.]+$/, '')}_cleaned_${Date.now()}.csv`;
    link.click();
  };

  const handleDownloadComparison = async () => {
    if (!comparisonRef.current) return;

    try {
      const dataUrl = await toPng(comparisonRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const link = document.createElement('a');
      link.download = `Comparison_${fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading comparison:', error);
      alert('Unable to export comparison. Please try again.');
    }
  };

  const columns = originalData.length > 0 ? Object.keys(originalData[0]) : [];
  const rowsRemoved = originalData.length - cleanedData.length;
  const dataQualityImprovement = () => {
    const originalMissing = columns.reduce((acc, col) => {
      return acc + originalData.filter(row => {
        const val = row[col];
        return val === null || val === undefined || val === '';
      }).length;
    }, 0);

    const cleanedMissing = columns.reduce((acc, col) => {
      return acc + cleanedData.filter(row => {
        const val = row[col];
        return val === null || val === undefined || val === '';
      }).length;
    }, 0);

    const originalQuality = 100 - (originalMissing / (originalData.length * columns.length)) * 100;
    const cleanedQuality = 100 - (cleanedMissing / (cleanedData.length * columns.length)) * 100;

    return (cleanedQuality - originalQuality).toFixed(1);
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f4f6fb' }}>
      {/* Header */}
      <div className="text-white px-6 py-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 100%)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center space-x-2">
              <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span>Data Comparison</span>
            </h1>
            <p className="text-sm ml-8" style={{ color: '#FFFFE3' }}>{fileName} - Before vs After Cleaning</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onBackToHome}
              className="px-5 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl hover:bg-white/30 hover:border-white/50 hover:shadow-md font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={onBackToTransform}
              className="px-5 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl hover:bg-white/30 hover:border-white/50 hover:shadow-md font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleDownloadCleanedCSV}
              className="px-5 py-2.5 text-white rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{ background: '#3b82f6' }}
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleDownloadComparison}
              className="px-5 py-2.5 text-white rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{ background: 'linear-gradient(to right, #6D8196, #4A4A4A)' }}
            >
              <Download className="w-4 h-4" />
              <span>Export Image</span>
            </button>
            <button
              onClick={onViewInsights}
              className="px-6 py-2.5 text-white rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{ background: 'linear-gradient(to right, #6D8196, #4A4A4A)' }}
            >
              <span>View Insights</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div ref={comparisonRef} className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Impact Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6" style={{ border: '1px solid #d7dfea' }}>
              <div className="text-sm mb-1" style={{ color: '#6D8196' }}>Original Rows</div>
              <div className="text-3xl" style={{ color: '#10263f' }}>{originalData.length.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6" style={{ border: '1px solid #d7dfea' }}>
              <div className="text-sm mb-1" style={{ color: '#6D8196' }}>Cleaned Rows</div>
              <div className="text-3xl" style={{ color: '#3b82f6' }}>{cleanedData.length.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6" style={{ border: '1px solid #d7dfea' }}>
              <div className="text-sm mb-1" style={{ color: '#6D8196' }}>Rows Removed</div>
              <div className="flex items-center space-x-2">
                {rowsRemoved > 0 ? (
                  <>
                    <TrendingDown className="w-6 h-6" style={{ color: '#ef4444' }} />
                    <div className="text-3xl" style={{ color: '#ef4444' }}>{rowsRemoved}</div>
                  </>
                ) : (
                  <div className="text-3xl" style={{ color: '#6D8196' }}>0</div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6" style={{ border: '1px solid #d7dfea' }}>
              <div className="text-sm mb-1" style={{ color: '#6D8196' }}>Quality Improvement</div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6" style={{ color: '#10b981' }} />
                <div className="text-3xl" style={{ color: '#10b981' }}>+{dataQualityImprovement()}%</div>
              </div>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="bg-white rounded-lg shadow p-4" style={{ border: '1px solid #d7dfea' }}>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('side-by-side')}
                className="px-4 py-2 rounded-lg transition-all"
                style={{
                  background: viewMode === 'side-by-side' ? 'linear-gradient(135deg, #3b82f6 0%, #1e3350 100%)' : '#d7dfea',
                  color: viewMode === 'side-by-side' ? 'white' : '#10263f'
                }}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setViewMode('original')}
                className="px-4 py-2 rounded-lg transition-all"
                style={{
                  background: viewMode === 'original' ? 'linear-gradient(135deg, #3b82f6 0%, #1e3350 100%)' : '#d7dfea',
                  color: viewMode === 'original' ? 'white' : '#10263f'
                }}
              >
                Original Only
              </button>
              <button
                onClick={() => setViewMode('cleaned')}
                className="px-4 py-2 rounded-lg transition-all"
                style={{
                  background: viewMode === 'cleaned' ? 'linear-gradient(135deg, #3b82f6 0%, #1e3350 100%)' : '#d7dfea',
                  color: viewMode === 'cleaned' ? 'white' : '#10263f'
                }}
              >
                Cleaned Only
              </button>
            </div>
          </div>

          {/* Data Comparison Tables */}
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow overflow-hidden" style={{ border: '1px solid #d7dfea' }}>
                <div className="px-6 py-4 border-b" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.08), rgba(215, 223, 234, 0.35))', borderColor: '#d7dfea' }}>
                  <h3 className="text-lg" style={{ color: '#10263f' }}>Original Data</h3>
                </div>
                <div className="overflow-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0" style={{ backgroundColor: 'rgba(215, 223, 234, 0.25)' }}>
                      <tr>
                        {columns.map(col => (
                          <th key={col} className="px-4 py-2 text-left border-b" style={{ color: '#10263f', borderColor: '#d7dfea' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {originalData.slice(0, 20).map((row, idx) => (
                        <tr key={idx} className="border-b transition-colors" style={{ borderColor: '#d7dfea' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '';
                          }}>
                          {columns.map(col => {
                            const value = row[col];
                            const isEmpty = value === null || value === undefined || value === '';
                            return (
                              <td key={col} className="px-4 py-2">
                                {isEmpty ? (
                                  <span className="italic px-1" style={{ color: '#10263f', backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>null</span>
                                ) : (
                                  <span style={{ color: '#10263f' }}>{String(value)}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden" style={{ border: '1px solid #d7dfea' }}>
                <div className="px-6 py-4 border-b" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.08), rgba(215, 223, 234, 0.3))', borderColor: '#d7dfea' }}>
                  <h3 className="text-lg" style={{ color: '#10263f' }}>Cleaned Data</h3>
                </div>
                <div className="overflow-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0" style={{ backgroundColor: 'rgba(215, 223, 234, 0.25)' }}>
                      <tr>
                        {columns.map(col => (
                          <th key={col} className="px-4 py-2 text-left border-b" style={{ color: '#10263f', borderColor: '#d7dfea' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cleanedData.slice(0, 20).map((row, idx) => (
                        <tr key={idx} className="border-b transition-colors" style={{ borderColor: '#d7dfea' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '';
                          }}>
                          {columns.map(col => (
                            <td key={col} className="px-4 py-2" style={{ color: '#10263f' }}>
                              {String(row[col] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden" style={{ border: '1px solid #d7dfea' }}>
              <div className={`px-6 py-4 border-b`} style={{
                background: viewMode === 'original' ? 'rgba(215, 223, 234, 0.4)' : 'rgba(109, 129, 150, 0.15)',
                borderColor: '#d7dfea'
              }}>
                <h3 className="text-lg" style={{ color: '#4A4A4A' }}>
                  {viewMode === 'original' ? 'Original Data' : 'Cleaned Data'}
                </h3>
              </div>
              <div className="overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0" style={{ backgroundColor: 'rgba(215, 223, 234, 0.25)' }}>
                    <tr>
                      {columns.map(col => (
                        <th key={col} className="px-4 py-2 text-left border-b" style={{ color: '#10263f', borderColor: '#d7dfea' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(viewMode === 'original' ? originalData : cleanedData).slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="border-b transition-colors" style={{ borderColor: '#d7dfea' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '';
                        }}>
                        {columns.map(col => {
                          const value = row[col];
                          const isEmpty = value === null || value === undefined || value === '';
                          return (
                            <td key={col} className="px-4 py-2">
                              {isEmpty && viewMode === 'original' ? (
                                <span className="italic px-1" style={{ color: '#10263f', backgroundColor: 'rgba(215, 223, 234, 0.45)' }}>null</span>
                              ) : (
                                <span style={{ color: '#10263f' }}>{String(value || '')}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
