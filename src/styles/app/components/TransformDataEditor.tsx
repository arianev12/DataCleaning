import { useState } from 'react';
import { Check, Undo, Trash2, Type, Hash, Calendar, Home, FileSpreadsheet } from 'lucide-react';

interface TransformStep {
  name: string;
  data: any[];
}

interface TransformDataEditorProps {
  originalData: any[];
  fileName: string;
  onCloseAndApply: (cleanedData: any[]) => void;
  onBackToHome: () => void;
}

export function TransformDataEditor({ originalData, fileName, onCloseAndApply, onBackToHome }: TransformDataEditorProps) {
  const [steps, setSteps] = useState<TransformStep[]>([
    { name: 'Source', data: [...originalData] }
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentData = steps[currentStepIndex].data;

  const addStep = (stepName: string, transformFn: (data: any[]) => any[]) => {
    const newData = transformFn(currentData);
    const newSteps = steps.slice(0, currentStepIndex + 1);
    newSteps.push({ name: stepName, data: newData });
    setSteps(newSteps);
    setCurrentStepIndex(newSteps.length - 1);
  };

  const goToStep = (index: number) => {
    setCurrentStepIndex(index);
  };

  const removeStep = (index: number) => {
    if (index === 0) return; // Can't remove source
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    setCurrentStepIndex(Math.min(currentStepIndex, newSteps.length - 1));
  };

  const handleRemoveDuplicates = () => {
    addStep('Removed Duplicates', (data) => {
      const seen = new Set();
      return data.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
  };

  const handleRemoveMissingRows = () => {
    addStep('Removed Empty Rows', (data) => {
      const columns = Object.keys(data[0] || {});
      return data.filter(row => {
        return columns.every(col => {
          const val = row[col];
          return val !== null && val !== undefined && val !== '';
        });
      });
    });
  };

  const handleFillMissing = () => {
    addStep('Filled Missing Values', (data) => {
      const columns = Object.keys(data[0] || {});
      const looksNumeric = (val: any) => {
        if (val === null || val === undefined || val === '') return false;
        const s = String(val).trim().replace(/[$,\s%]/g, '');
        if (s === '') return false;
        return !isNaN(Number(s));
      };

      const columnIsNumeric: Record<string, boolean> = {};
      columns.forEach(col => {
        const sampleValues = data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
        columnIsNumeric[col] = sampleValues.some(v => looksNumeric(v));
      });

      return data.map(row => {
        const newRow = { ...row } as any;
        columns.forEach(col => {
          if (newRow[col] === null || newRow[col] === undefined || newRow[col] === '') {
            if (columnIsNumeric[col]) {
              newRow[col] = 0;
            } else {
              newRow[col] = 'N/A';
            }
          }
        });
        return newRow;
      });
    });
  };

  const handleTrimWhitespace = () => {
    addStep('Trimmed Text', (data) => {
      return data.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          const value = row[key];
          newRow[key] = typeof value === 'string' ? value.trim() : value;
        });
        return newRow;
      });
    });
  };

  const handleUppercase = () => {
    addStep('Uppercase Text', (data) => {
      return data.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          const value = row[key];
          newRow[key] = typeof value === 'string' ? value.toUpperCase() : value;
        });
        return newRow;
      });
    });
  };

  const handleLowercase = () => {
    addStep('Lowercase Text', (data) => {
      return data.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          const value = row[key];
          newRow[key] = typeof value === 'string' ? value.toLowerCase() : value;
        });
        return newRow;
      });
    });
  };

  const handleConvertTypes = () => {
    addStep('Changed Type', (data) => {
      return data.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          const value = row[key];
          if (typeof value === 'string' && value !== '') {
            const numValue = Number(value);
            newRow[key] = !isNaN(numValue) ? numValue : value;
          } else {
            newRow[key] = value;
          }
        });
        return newRow;
      });
    });
  };

  const columns = currentData.length > 0 ? Object.keys(currentData[0]) : [];
  const missingCount = columns.reduce((acc, col) => {
    const missing = currentData.filter(row => {
      const val = row[col];
      return val === null || val === undefined || val === '';
    }).length;
    return acc + missing;
  }, 0);

  const getColumnType = (col: string) => {
    const values = currentData.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
    if (values.length === 0) return 'text';
    const sample = values[0];
    if (!isNaN(Number(sample)) && sample !== '') return 'number';
    if (!isNaN(Date.parse(sample))) return 'date';
    return 'text';
  };
  const getQueryCount = () => {
    const combinedMatch = fileName.match(/^Combined_(\d+)_files_/i);
    return combinedMatch ? Number(combinedMatch[1]) : 1;
  };

  const getChangedRowCount = () => {
    const sharedLength = Math.min(originalData.length, currentData.length);
    let changed = Math.abs(originalData.length - currentData.length);

    for (let i = 0; i < sharedLength; i += 1) {
      if (JSON.stringify(originalData[i]) !== JSON.stringify(currentData[i])) {
        changed += 1;
      }
    }

    return changed;
  };

  const typesPresent = columns.some(col => getColumnType(col) !== 'text');

  return (
    <div className="h-screen flex flex-col" style={{ background: '#E8E4D6' }}>
      {/* Header */}
      <div className="text-white px-6 py-4 flex items-center justify-between shadow-lg" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-white/20">
              <Type className="w-5 h-5 text-white" />
            </div>
            <span>Power Query Editor</span>
          </h1>
          <p className="text-sm ml-8 flex items-center space-x-1.5" style={{ color: '#FFFFE3' }}>
            <FileSpreadsheet className="w-4 h-4" />
            <span>{fileName}</span>
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onBackToHome}
            className="px-5 py-2.5 bg-white/12 backdrop-blur-sm border-2 rounded-xl text-sm font-medium flex items-center space-x-2 transition-all duration-200 hover:bg-white/25 hover:scale-105"
            style={{ borderColor: 'rgba(215,223,234,0.18)' }}
          >
            <Home className="w-4 h-4" style={{ color: '#10263f' }} />
            <span style={{ color: '#10263f' }}>Home</span>
          </button>
          <button
            onClick={() => onCloseAndApply(currentData)}
            className="px-6 py-2.5 text-white rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}
          >
            <Check className="w-4 h-4" />
            <span>Close & Apply</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r flex flex-col" style={{ backgroundColor: 'rgba(109, 129, 150, 0.08)', borderColor: '#D7DFEA' }}>
          <div className="p-4 border-b bg-white" style={{ borderColor: '#D7DFEA' }}>
            <h2 className="text-sm uppercase mb-3" style={{ color: '#6D8196' }}>
              Queries ({getQueryCount()})
            </h2>
            <div className="border rounded p-2 text-sm" style={{ backgroundColor: 'rgba(109, 129, 150, 0.16)', borderColor: '#6D8196', color: '#10263f' }}>
              {fileName.replace(/\.[^/.]+$/, '')}
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-sm uppercase mb-3" style={{ color: '#6D8196' }}>Applied Steps</h3>
            <div className="space-y-1">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between px-3 py-2 rounded text-sm cursor-pointer border"
                  style={{
                    backgroundColor: idx === currentStepIndex ? 'rgba(109, 129, 150, 0.15)' : 'white',
                    borderColor: idx === currentStepIndex ? '#6D8196' : '#D7DFEA',
                    color: '#4A4A4A'
                  }}
                  onClick={() => goToStep(idx)}
                  onMouseEnter={(e) => {
                    if (idx !== currentStepIndex) {
                      e.currentTarget.style.backgroundColor = 'rgba(109, 129, 150, 0.10)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (idx !== currentStepIndex) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <span>{step.name}</span>
                  {idx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStep(idx);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded"
                      title="Delete step"
                      style={{ backgroundColor: 'rgba(203, 203, 203, 0.3)' }}
                    >
                      <Trash2 className="w-3 h-3" style={{ color: '#4A4A4A' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t bg-white" style={{ borderColor: '#D7DFEA' }}>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span style={{ color: '#6D8196' }}>Rows:</span>
                <span style={{ color: '#4A4A4A' }}>{currentData.length.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6D8196' }}>Columns:</span>
                <span style={{ color: '#4A4A4A' }}>{columns.length}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6D8196' }}>Missing:</span>
                <span style={{ color: missingCount > 0 ? '#4A4A4A' : '#6D8196' }}>
                  {missingCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6D8196' }}>Changed:</span>
                <span style={{ color: '#4A4A4A' }}>{getChangedRowCount()}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6D8196' }}>Step:</span>
                <span style={{ color: '#4A4A4A' }}>{currentStepIndex + 1} of {steps.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Transform Ribbon */}
          <div className="border-b p-4" style={{ backgroundColor: 'rgba(109, 129, 150, 0.08)', borderColor: '#D7DFEA' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase" style={{ color: '#6D8196' }}>Transform Operations</div>
              {currentStepIndex < steps.length - 1 && (
                <button
                  onClick={() => setCurrentStepIndex(steps.length - 1)}
                  className="text-sm flex items-center space-x-1"
                  style={{ color: '#6D8196' }}
                >
                  <Undo className="w-4 h-4" />
                  <span>Go to Latest</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRemoveDuplicates}
                className="px-4 py-2 bg-white border rounded text-sm transition-all"
                style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(109, 129, 150, 0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Remove Duplicates
              </button>

              <button
                onClick={handleRemoveMissingRows}
                className="px-4 py-2 bg-white border rounded text-sm transition-all"
                style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(109, 129, 150, 0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Remove Empty Rows
              </button>

              <button
                onClick={handleFillMissing}
                className="px-4 py-2 bg-white border rounded text-sm transition-all"
                style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(109, 129, 150, 0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Fill Missing
              </button>

              <button
                onClick={handleTrimWhitespace}
                className="px-4 py-2 bg-white border rounded text-sm transition-all"
                style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(109, 129, 150, 0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Trim Text
              </button>

              <button
                onClick={handleUppercase}
                className="px-4 py-2 bg-white border rounded text-sm transition-all"
                style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(109, 129, 150, 0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                UPPERCASE
              </button>

              <button
                onClick={handleLowercase}
                className="px-4 py-2 bg-white border rounded text-sm transition-all"
                style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(109, 129, 150, 0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                lowercase
              </button>

              <button
                onClick={handleConvertTypes}
                className="px-4 py-2 bg-white border rounded text-sm transition-all flex items-center space-x-2"
                style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.backgroundColor = 'rgba(109, 129, 150, 0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <Type className="w-4 h-4" style={{ color: '#4A4A4A' }} />
                Detect Types
              </button>
            </div>
          </div>

          {/* Data Preview */}
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: '#D7DFEA' }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0" style={{ backgroundColor: 'rgba(109, 129, 150, 0.14)' }}>
                  <tr>
                    {columns.map((col) => {
                      const type = getColumnType(col);
                      return (
                        <th key={col} className="px-4 py-3 text-left border-b" style={{ borderColor: '#D7DFEA' }}>
                          <div className="flex items-center space-x-2">
                            {type === 'number' ? (
                              <Hash className="w-4 h-4" style={{ color: '#6D8196' }} />
                            ) : type === 'date' ? (
                              <Calendar className="w-4 h-4" style={{ color: '#6D8196' }} />
                            ) : (
                              <Type className="w-4 h-4" style={{ color: '#4A4A4A' }} />
                            )}
                            <div className="flex items-baseline space-x-2">
                              <span style={{ color: '#4A4A4A' }}>{col}</span>
                              <span className="text-xs" style={{ color: '#6D8196' }}>{type}</span>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {currentData.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className="border-b transition-colors" style={{ borderColor: '#D7DFEA' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(109, 129, 150, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '';
                      }}>
                      {columns.map((col) => {
                        const value = row[col];
                        const isEmpty = value === null || value === undefined || value === '';
                        return (
                          <td key={col} className="px-4 py-2">
                            {isEmpty ? (
                              <span className="italic" style={{ color: '#10263f', backgroundColor: 'rgba(109, 129, 150, 0.16)', padding: '2px 4px', borderRadius: '4px' }}>null</span>
                            ) : (
                              <span style={{ color: '#4A4A4A' }}>{String(value)}</span>
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

