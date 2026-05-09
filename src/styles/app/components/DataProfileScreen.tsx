import { useRef } from 'react';
import { ArrowRight, Home, Hash, Type, Calendar, AlertCircle, Download, FileSpreadsheet, Table, Columns, CheckCircle, TrendingUp } from 'lucide-react';
import { toPng } from 'html-to-image';

interface DataProfileScreenProps {
  data: any[];
  fileName: string;
  onStartCleaning: () => void;
  onBackToHome: () => void;
}

export function DataProfileScreen({ data, fileName, onStartCleaning, onBackToHome }: DataProfileScreenProps) {
  const profileRef = useRef<HTMLDivElement>(null);

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
    link.download = `${fileName.replace(/\.[^/.]+$/, '')}_original_${Date.now()}.csv`;
    link.click();
  };

  const handleDownloadProfile = async () => {
    if (!profileRef.current) return;

    try {
      const dataUrl = await toPng(profileRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const link = document.createElement('a');
      link.download = `Profile_${fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading profile:', error);
      alert('Unable to export profile. Please try again.');
    }
  };
  const columns = Object.keys(data[0] || {});
  const rowCount = data.length;
  const columnCount = columns.length;

  const getColumnProfile = (columnName: string) => {
    const values = data.map(row => row[columnName]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const missingCount = rowCount - nonNullValues.length;
    const missingPercentage = ((missingCount / rowCount) * 100).toFixed(1);
    const uniqueCount = new Set(nonNullValues).size;

    let dataType = 'text';
    let min, max, mean, median;

    if (nonNullValues.length > 0) {
      const sampleValue = nonNullValues[0];
      if (!isNaN(Number(sampleValue)) && sampleValue !== '') {
        dataType = 'number';
        const numValues = nonNullValues.map(Number).filter(n => !isNaN(n));
        if (numValues.length > 0) {
          min = Math.min(...numValues);
          max = Math.max(...numValues);
          mean = (numValues.reduce((a, b) => a + b, 0) / numValues.length).toFixed(2);
          const sorted = [...numValues].sort((a, b) => a - b);
          median = sorted.length % 2 === 0
            ? ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(2)
            : sorted[Math.floor(sorted.length / 2)].toFixed(2);
        }
      } else if (!isNaN(Date.parse(sampleValue))) {
        dataType = 'date';
      }
    }

    return {
      dataType,
      missingCount,
      missingPercentage,
      uniqueCount,
      nonNullCount: nonNullValues.length,
      min,
      max,
      mean,
      median
    };
  };

  const totalMissing = columns.reduce((acc, col) => {
    return acc + getColumnProfile(col).missingCount;
  }, 0);

  const getTypeIcon = (type: string) => {
    if (type === 'number') return <Hash className="w-4 h-4" style={{ color: '#6D8196' }} />;
    if (type === 'date') return <Calendar className="w-4 h-4" style={{ color: '#6D8196' }} />;
    return <Type className="w-4 h-4" style={{ color: '#10263f' }} />;
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f4f6fb' }}>
      {/* Header */}
      <div className="text-white px-6 py-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 100%)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center space-x-2">
              <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                <Hash className="w-5 h-5" />
              </div>
              <span>Data Profile</span>
            </h1>
            <p className="text-sm ml-8 flex items-center space-x-1.5" style={{ color: '#FFFFE3' }}>
              <FileSpreadsheet className="w-4 h-4" />
              <span>{fileName}</span>
            </p>
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
              onClick={handleDownloadCSV}
              className="px-5 py-2.5 text-white rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{ background: '#6D8196' }}
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleDownloadProfile}
              className="px-5 py-2.5 text-white rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{ background: '#6D8196' }}
            >
              <Download className="w-4 h-4" />
              <span>Export Profile</span>
            </button>
            <button
              onClick={onStartCleaning}
              className="px-6 py-2.5 text-white rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{ background: '#6D8196' }}
            >
              <span>Start Cleaning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div ref={profileRef} className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="group bg-white rounded-xl shadow-lg p-6 border-2 transition-all duration-300 hover:scale-105" style={{ borderColor: '#d7dfea' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5b6b7f' }}>Total Rows</div>
                <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(to bottom right, #3b82f6, #1e3350)' }}>
                  <Table className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold" style={{ color: '#4A4A4A' }}>
                {rowCount.toLocaleString()}
              </div>
              <div className="mt-2 text-xs" style={{ color: '#5b6b7f' }}>Records in dataset</div>
            </div>
            <div className="group bg-white rounded-xl shadow-lg p-6 border-2 transition-all duration-300 hover:scale-105" style={{ borderColor: '#d7dfea' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5b6b7f' }}>Total Columns</div>
                <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(to bottom right, #3b82f6, #1e3350)' }}>
                  <Columns className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold" style={{ color: '#4A4A4A' }}>
                {columnCount}
              </div>
              <div className="mt-2 text-xs" style={{ color: '#5b6b7f' }}>Attributes captured</div>
            </div>
            <div className="group bg-white rounded-xl shadow-lg p-6 border-2 transition-all duration-300 hover:scale-105" style={{ borderColor: '#d7dfea' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5b6b7f' }}>Missing Values</div>
                <div className={`p-2 rounded-lg`} style={{ background: totalMissing > 0 ? 'linear-gradient(to bottom right, #ef4444, #b42318)' : 'linear-gradient(to bottom right, #3b82f6, #1e3350)' }}>
                  {totalMissing > 0 ? <AlertCircle className="w-4 h-4 text-white" /> : <CheckCircle className="w-4 h-4 text-white" />}
                </div>
              </div>
              <div className={`text-3xl font-bold`} style={{ color: totalMissing > 0 ? '#ef4444' : '#10263f' }}>
                {totalMissing.toLocaleString()}
              </div>
              <div className="mt-2 text-xs" style={{ color: '#5b6b7f' }}>Null or empty cells</div>
            </div>
            <div className="group bg-white rounded-xl shadow-lg p-6 border-2 transition-all duration-300 hover:scale-105" style={{ borderColor: '#d7dfea' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5b6b7f' }}>Data Quality</div>
                <div className={`p-2 rounded-lg`} style={{ background: 'linear-gradient(to bottom right, #3b82f6, #1e3350)' }}>
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className={`text-3xl font-bold`} style={{ color: totalMissing / (rowCount * columnCount) < 0.05 ? '#10b981' : '#ef4444' }}>
                {(100 - (totalMissing / (rowCount * columnCount)) * 100).toFixed(1)}%
              </div>
              <div className="mt-2 text-xs" style={{ color: '#5b6b7f' }}>Completeness score</div>
            </div>
          </div>

          {/* Column Details */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2" style={{ borderColor: '#d7dfea' }}>
            <div className="px-6 py-4 border-b-2" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.08), rgba(215, 223, 234, 0.35))', borderColor: '#d7dfea' }}>
              <h2 className="text-lg font-bold flex items-center space-x-2" style={{ color: '#10263f' }}>
                <Hash className="w-5 h-5" style={{ color: '#5b6b7f' }} />
                <span>Column Analysis</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.08), rgba(215, 223, 234, 0.25))', borderColor: '#d7dfea' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#10263f' }}>Column Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#10263f' }}>Data Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#10263f' }}>Non-Null</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#10263f' }}>Missing</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#10263f' }}>Unique</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#10263f' }}>Statistics</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#d7dfea' }}>
                  {columns.map((column) => {
                    const profile = getColumnProfile(column);
                    return (
                      <tr key={column} className="transition-colors duration-200" style={{
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to right, rgba(59, 130, 246, 0.08), rgba(215, 223, 234, 0.25))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '';
                      }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(profile.dataType)}
                            <span className="font-semibold" style={{ color: '#10263f' }}>{column}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1.5 rounded-full text-xs font-semibold border" style={{
                            backgroundColor: profile.dataType === 'number' ? 'rgba(109, 129, 150, 0.15)' :
                                           profile.dataType === 'date' ? 'rgba(203, 203, 203, 0.3)' : '#FFFFE3',
                            color: '#10263f',
                            borderColor: '#d7dfea'
                          }}>
                            {profile.dataType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold" style={{ color: '#10263f' }}>{profile.nonNullCount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          {profile.missingCount > 0 ? (
                            <div className="flex items-center space-x-2">
                              <div className="p-1 rounded" style={{ backgroundColor: 'rgba(203, 203, 203, 0.3)' }}>
                                <AlertCircle className="w-3.5 h-3.5" style={{ color: '#4A4A4A' }} />
                              </div>
                              <span className="font-semibold" style={{ color: '#4A4A4A' }}>{profile.missingCount} ({profile.missingPercentage}%)</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="p-1 rounded" style={{ backgroundColor: 'rgba(109, 129, 150, 0.15)' }}>
                                <CheckCircle className="w-3.5 h-3.5" style={{ color: '#6D8196' }} />
                              </div>
                              <span className="font-semibold" style={{ color: '#6D8196' }}>0 (0%)</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#5b6b7f' }}>
                            {profile.uniqueCount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {profile.dataType === 'number' && (
                            <div className="text-xs space-y-0.5" style={{ color: '#5b6b7f' }}>
                              <div className="flex items-center space-x-1">
                                <span>Min:</span>
                                <span className="font-semibold" style={{ color: '#10263f' }}>{profile.min}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>Max:</span>
                                <span className="font-semibold" style={{ color: '#10263f' }}>{profile.max}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>Mean:</span>
                                <span className="font-semibold" style={{ color: '#10263f' }}>{profile.mean}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>Median:</span>
                                <span className="font-semibold" style={{ color: '#10263f' }}>{profile.median}</span>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Preview */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2" style={{ borderColor: '#d7dfea' }}>
            <div className="px-6 py-4 border-b-2" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.08), rgba(215, 223, 234, 0.35))', borderColor: '#d7dfea' }}>
              <h2 className="text-lg font-bold flex items-center space-x-2" style={{ color: '#10263f' }}>
                <FileSpreadsheet className="w-5 h-5" style={{ color: '#5b6b7f' }} />
                <span>Data Preview (First 10 rows)</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(215, 223, 234, 0.2))', borderColor: '#d7dfea' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide sticky left-0" style={{ color: '#10263f', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>#</th>
                    {columns.map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#10263f' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#d7dfea' }}>
                  {data.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="transition-colors duration-200"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to right, rgba(59, 130, 246, 0.08), rgba(215, 223, 234, 0.25))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '';
                      }}>
                      <td className="px-4 py-3 font-bold sticky left-0 bg-white" style={{ color: '#5b6b7f' }}>{idx + 1}</td>
                      {columns.map((col) => {
                        const value = row[col];
                        const isEmpty = value === null || value === undefined || value === '';
                        return (
                          <td key={col} className="px-4 py-3">
                            {isEmpty ? (
                              <span className="px-2 py-1 rounded text-xs font-semibold italic border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#10263f', borderColor: '#d7dfea' }}>null</span>
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
        </div>
      </div>
    </div>
  );
}
