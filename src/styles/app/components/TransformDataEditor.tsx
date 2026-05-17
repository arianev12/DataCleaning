import { useRef, useState } from 'react';
import { Check, Undo, Trash2, Type, Hash, Calendar, Home, FileSpreadsheet, ChevronDown } from 'lucide-react';

interface TransformStep {
  name: string;
  data: any[];
}

interface PreviewState {
  title: string;
  description: string;
  affectedCount: number;
  rows: any[];
  columns: string[];
  onApply: () => void;
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
  const [operationMessage, setOperationMessage] = useState('');
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);
  const [replaceColumn, setReplaceColumn] = useState('');
  const [replaceFindValue, setReplaceFindValue] = useState('');
  const [replaceWithValue, setReplaceWithValue] = useState('');
  const [removeEmptyColumn, setRemoveEmptyColumn] = useState('all');
  const [caseColumn, setCaseColumn] = useState('');
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'default' | 'asc' | 'desc' }>({
    column: '',
    direction: 'default'
  });
  const replaceColumnRef = useRef('');
  const replaceFindValueRef = useRef('');
  const replaceWithValueRef = useRef('');
  const removeEmptyColumnRef = useRef('all');
  const caseColumnRef = useRef('');
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentData = steps[currentStepIndex].data;

  const addStep = (stepName: string, transformFn: (data: any[]) => any[], precomputedData?: any[]) => {
    const newData = precomputedData ?? transformFn(currentData);
    const newSteps = steps.slice(0, currentStepIndex + 1);
    newSteps.push({ name: stepName, data: newData });
    setSteps(newSteps);
    setCurrentStepIndex(newSteps.length - 1);
  };

  const showOperationMessage = (message: string) => {
    setOperationMessage(message);
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      setOperationMessage('');
    }, 3000);
  };

  const isMissingValue = (value: any) => value === null || value === undefined || value === '';

  const countMissingCells = (data: any[]) => {
    const columns = Object.keys(data[0] || {});
    let count = 0;
    data.forEach(row => {
      columns.forEach(col => {
        const val = row[col];
        if (isMissingValue(val)) {
          count += 1;
        }
      });
    });
    return count;
  };

  const countStringChanges = (data: any[], transform: (value: string) => string) => {
    let count = 0;
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (typeof value === 'string') {
          const next = transform(value);
          if (next !== value) {
            count += 1;
          }
        }
      });
    });
    return count;
  };

  const countStringChangesInColumn = (data: any[], column: string, transform: (value: string) => string) => {
    if (!column) return 0;
    let count = 0;
    data.forEach(row => {
      const value = row[column];
      if (typeof value === 'string') {
        const next = transform(value);
        if (next !== value) {
          count += 1;
        }
      }
    });
    return count;
  };

  const countNumericConversions = (data: any[]) => {
    let count = 0;
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (typeof value === 'string' && value !== '') {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            count += 1;
          }
        }
      });
    });
    return count;
  };

  const getReplacePreview = (data: any[], column: string, findValue: string) => {
    if (!column) {
      return { rows: [] as any[], affectedCount: 0, columns: [] as string[] };
    }
    const matches = data.filter(row => String(row[column] ?? '') === findValue);
    const previewRows = matches.slice(0, 10);
    const previewColumns = Object.keys(previewRows[0] || data[0] || {});
    return { rows: previewRows, affectedCount: matches.length, columns: previewColumns };
  };

  const getEmptyRowMatches = (data: any[], column: string) => {
    const columns = Object.keys(data[0] || {});
    if (column === 'all') {
      return data.filter(row => {
        return columns.some(col => isMissingValue(row[col]));
      });
    }
    return data.filter(row => isMissingValue(row[column]));
  };

  const getRemoveEmptyPreview = (data: any[], column: string) => {
    const matches = getEmptyRowMatches(data, column);
    const previewRows = matches.slice(0, 10);
    const previewColumns = Object.keys(previewRows[0] || data[0] || {});
    return { rows: previewRows, affectedCount: matches.length, columns: previewColumns };
  };

  const updateRemoveEmptyPreview = (nextColumn: string) => {
    setPreviewState((prev) => {
      if (!prev) return prev;
      const preview = getRemoveEmptyPreview(currentData, nextColumn);
      return {
        ...prev,
        rows: preview.rows,
        affectedCount: preview.affectedCount,
        columns: preview.columns
      };
    });
  };

  const getCasePreview = (data: any[], column: string, transform: (value: string) => string) => {
    if (!column) {
      return { rows: [] as any[], affectedCount: 0, columns: [] as string[] };
    }
    const matches = data.filter(row => {
      const value = row[column];
      return typeof value === 'string' && transform(value) !== value;
    });
    const previewRows = matches.slice(0, 10);
    const previewColumns = Object.keys(previewRows[0] || data[0] || {});
    return { rows: previewRows, affectedCount: matches.length, columns: previewColumns };
  };

  const updateCasePreview = (nextColumn: string, transform: (value: string) => string) => {
    setPreviewState((prev) => {
      if (!prev) return prev;
      const preview = getCasePreview(currentData, nextColumn, transform);
      return {
        ...prev,
        rows: preview.rows,
        affectedCount: preview.affectedCount,
        columns: preview.columns
      };
    });
  };

  const updateReplacePreview = (nextColumn: string, nextFindValue: string) => {
    setPreviewState((prev) => {
      if (!prev) return prev;
      const preview = getReplacePreview(currentData, nextColumn, nextFindValue);
      return {
        ...prev,
        rows: preview.rows,
        affectedCount: preview.affectedCount,
        columns: preview.columns
      };
    });
  };

  const openPreview = (config: {
    title: string;
    description: string;
    rows: any[];
    affectedCount: number;
    onApply: () => void;
  }) => {
    const previewRows = config.rows.slice(0, 10);
    const previewColumns = Object.keys(previewRows[0] || currentData[0] || {});
    setPreviewState({
      title: config.title,
      description: config.description,
      affectedCount: config.affectedCount,
      rows: previewRows,
      columns: previewColumns,
      onApply: config.onApply
    });
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
    const transform = (data: any[]) => {
      const seen = new Set();
      return data.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    const seen = new Set<string>();
    const duplicates = currentData.filter(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
    const removed = duplicates.length;
    openPreview({
      title: 'Remove Duplicates',
      description: 'Duplicate rows that will be removed.',
      rows: duplicates,
      affectedCount: removed,
      onApply: () => {
        if (removed === 0) return;
        const newData = transform(currentData);
        showOperationMessage(`${removed} duplicate rows removed`);
        addStep('Removed Duplicates', transform, newData);
      }
    });
  };

  const handleRemoveMissingRows = () => {
    setRemoveEmptyColumn('all');
    removeEmptyColumnRef.current = 'all';
    const preview = getRemoveEmptyPreview(currentData, 'all');
    openPreview({
      title: 'Remove Empty Rows',
      description: 'Rows with empty values in the selected column will be removed.',
      rows: preview.rows,
      affectedCount: preview.affectedCount,
      onApply: () => {
        const targetColumn = removeEmptyColumnRef.current;
        const removed = getEmptyRowMatches(currentData, targetColumn).length;
        if (removed === 0) return;
        const transform = (data: any[]) => {
          const cols = Object.keys(data[0] || {});
          if (targetColumn === 'all') {
            return data.filter(row => cols.every(col => !isMissingValue(row[col])));
          }
          return data.filter(row => !isMissingValue(row[targetColumn]));
        };
        const newData = transform(currentData);
        showOperationMessage(`${removed} empty rows removed${targetColumn === 'all' ? '' : ` from ${targetColumn}`}`);
        addStep('Removed Empty Rows', transform, newData);
      }
    });
  };

  const handleFillMissing = () => {
    const columns = Object.keys(currentData[0] || {});
    const missingRows = currentData.filter(row => {
      return columns.some(col => isMissingValue(row[col]));
    });
    const filled = countMissingCells(currentData);
    openPreview({
      title: 'Fill Missing',
      description: 'Missing values will be filled automatically (0 for numbers, N/A for text).',
      rows: missingRows,
      affectedCount: missingRows.length,
      onApply: () => {
        if (filled === 0) return;
        const columnTypes = columns.reduce((acc, col) => {
          acc[col] = getColumnType(col);
          return acc;
        }, {} as Record<string, string>);
        const transform = (data: any[]) => {
          const cols = Object.keys(data[0] || {});
          return data.map(row => {
            const newRow = { ...row } as any;
            cols.forEach(col => {
              if (isMissingValue(newRow[col])) {
                newRow[col] = columnTypes[col] === 'number' ? 0 : 'N/A';
              }
            });
            return newRow;
          });
        };
        const newData = transform(currentData);
        showOperationMessage(`${filled} missing values filled (0 for numbers, N/A for text)`);
        addStep('Filled Missing Values', transform, newData);
      }
    });
  };

  const handleReplaceValues = () => {
    const columns = Object.keys(currentData[0] || {});
    const defaultColumn = columns[0] || '';
    setReplaceColumn(defaultColumn);
    setReplaceFindValue('');
    setReplaceWithValue('');
    replaceColumnRef.current = defaultColumn;
    replaceFindValueRef.current = '';
    replaceWithValueRef.current = '';
    const preview = getReplacePreview(currentData, defaultColumn, '');
    openPreview({
      title: 'Replace Values',
      description: 'Select a column and values to replace.',
      rows: preview.rows,
      affectedCount: preview.affectedCount,
      onApply: () => {
        const column = replaceColumnRef.current;
        const findValue = replaceFindValueRef.current;
        const replaceValue = replaceWithValueRef.current;
        if (!column || findValue === '') return;
        const affected = getReplacePreview(currentData, column, findValue).affectedCount;
        if (affected === 0) return;
        const transform = (data: any[]) => {
          return data.map(row => {
            const newRow = { ...row } as any;
            if (String(newRow[column] ?? '') === findValue) {
              newRow[column] = replaceValue;
            }
            return newRow;
          });
        };
        const newData = transform(currentData);
        showOperationMessage(`${affected} values replaced in ${column}`);
        addStep('Replaced Values', transform, newData);
      }
    });
  };

  const handleTrimWhitespace = () => {
    const transform = (data: any[]) => {
      return data.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          const value = row[key];
          newRow[key] = typeof value === 'string' ? value.trim() : value;
        });
        return newRow;
      });
    };
    const changedRows = currentData.filter(row => {
      return Object.keys(row).some(key => {
        const value = row[key];
        return typeof value === 'string' && value.trim() !== value;
      });
    });
    const trimmed = countStringChanges(currentData, (value) => value.trim());
    openPreview({
      title: 'Trim Text',
      description: 'Rows with text that will be trimmed.',
      rows: changedRows,
      affectedCount: changedRows.length,
      onApply: () => {
        if (trimmed === 0) return;
        const newData = transform(currentData);
        showOperationMessage(`${trimmed} text values trimmed`);
        addStep('Trimmed Text', transform, newData);
      }
    });
  };

  const handleUppercase = () => {
    const columns = Object.keys(currentData[0] || {});
    const defaultColumn = columns[0] || '';
    setCaseColumn(defaultColumn);
    caseColumnRef.current = defaultColumn;
    const transformValue = (value: string) => value.toUpperCase();
    const preview = getCasePreview(currentData, defaultColumn, transformValue);
    openPreview({
      title: 'UPPERCASE',
      description: 'Text in the selected column will be converted to uppercase.',
      rows: preview.rows,
      affectedCount: preview.affectedCount,
      onApply: () => {
        const column = caseColumnRef.current;
        if (!column) return;
        const changed = countStringChangesInColumn(currentData, column, transformValue);
        if (changed === 0) return;
        const transform = (data: any[]) => {
          return data.map(row => {
            const newRow = { ...row } as any;
            const value = newRow[column];
            if (typeof value === 'string') {
              newRow[column] = value.toUpperCase();
            }
            return newRow;
          });
        };
        const newData = transform(currentData);
        showOperationMessage(`${changed} text values uppercased in ${column}`);
        addStep('Uppercase Text', transform, newData);
      }
    });
  };

  const handleLowercase = () => {
    const columns = Object.keys(currentData[0] || {});
    const defaultColumn = columns[0] || '';
    setCaseColumn(defaultColumn);
    caseColumnRef.current = defaultColumn;
    const transformValue = (value: string) => value.toLowerCase();
    const preview = getCasePreview(currentData, defaultColumn, transformValue);
    openPreview({
      title: 'lowercase',
      description: 'Text in the selected column will be converted to lowercase.',
      rows: preview.rows,
      affectedCount: preview.affectedCount,
      onApply: () => {
        const column = caseColumnRef.current;
        if (!column) return;
        const changed = countStringChangesInColumn(currentData, column, transformValue);
        if (changed === 0) return;
        const transform = (data: any[]) => {
          return data.map(row => {
            const newRow = { ...row } as any;
            const value = newRow[column];
            if (typeof value === 'string') {
              newRow[column] = value.toLowerCase();
            }
            return newRow;
          });
        };
        const newData = transform(currentData);
        showOperationMessage(`${changed} text values lowercased in ${column}`);
        addStep('Lowercase Text', transform, newData);
      }
    });
  };

  const handleConvertTypes = () => {
    const transform = (data: any[]) => {
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
    };
    const changedRows = currentData.filter(row => {
      return Object.keys(row).some(key => {
        const value = row[key];
        return typeof value === 'string' && value !== '' && !isNaN(Number(value));
      });
    });
    const converted = countNumericConversions(currentData);
    openPreview({
      title: 'Detect Types',
      description: 'Rows with numeric text that will be converted to numbers.',
      rows: changedRows,
      affectedCount: changedRows.length,
      onApply: () => {
        if (converted === 0) return;
        const newData = transform(currentData);
        showOperationMessage(`${converted} values converted to number`);
        addStep('Changed Type', transform, newData);
      }
    });
  };

  const columns = currentData.length > 0 ? Object.keys(currentData[0]) : [];
  const missingCount = columns.reduce((acc, col) => {
    const missing = currentData.filter(row => {
      const val = row[col];
      return isMissingValue(val);
    }).length;
    return acc + missing;
  }, 0);

  const getColumnTypeForData = (data: any[], col: string) => {
    const values = data.map(row => row[col]).filter(v => !isMissingValue(v));
    if (values.length === 0) return 'text';
    const sample = values[0];
    if (!isNaN(Number(sample)) && sample !== '') return 'number';
    if (!isNaN(Date.parse(sample))) return 'date';
    return 'text';
  };

  const getColumnType = (col: string) => getColumnTypeForData(currentData, col);
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

  const getSortValue = (value: any, type: string) => {
    if (type === 'number') {
      return Number(value);
    }
    if (type === 'date') {
      const parsed = Date.parse(String(value));
      return isNaN(parsed) ? String(value).toLowerCase() : parsed;
    }
    return String(value).toLowerCase();
  };

  const sortDataByColumn = (data: any[], column: string, direction: 'default' | 'asc' | 'desc') => {
    if (!column || direction === 'default') {
      return data;
    }
    const type = getColumnTypeForData(data, column);
    const sorted = [...data].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      const aMissing = isMissingValue(aVal);
      const bMissing = isMissingValue(bVal);

      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;

      const aSort = getSortValue(aVal, type);
      const bSort = getSortValue(bVal, type);

      if (aSort < bSort) return -1;
      if (aSort > bSort) return 1;
      return 0;
    });

    return direction === 'desc' ? sorted.reverse() : sorted;
  };

  const getSortedData = (data: any[]) => {
    return sortDataByColumn(data, sortConfig.column, sortConfig.direction);
  };

  const handleSortChange = (column: string, direction: 'default' | 'asc' | 'desc') => {
    if (direction === 'default') {
      setSortConfig({ column: '', direction: 'default' });
      return;
    }
    const transform = (data: any[]) => sortDataByColumn(data, column, direction);
    const newData = transform(currentData);
    const directionLabel = direction === 'asc' ? 'Asc' : 'Desc';
    showOperationMessage(`Sorted ${column} (${directionLabel})`);
    addStep(`Sorted ${column} (${directionLabel})`, transform, newData);
    setSortConfig({ column, direction });
  };

  const isRemoveEmptyPreview = previewState?.title === 'Remove Empty Rows';
  const isReplacePreview = previewState?.title === 'Replace Values';
  const isUppercasePreview = previewState?.title === 'UPPERCASE';
  const isLowercasePreview = previewState?.title === 'lowercase';
  const isCasePreview = isUppercasePreview || isLowercasePreview;
  const displayData = getSortedData(currentData);
  const applyDisabled = previewState
    ? previewState.affectedCount === 0
      || (isReplacePreview && (replaceColumn === '' || replaceFindValue === ''))
      || (isCasePreview && caseColumn === '')
    : false;

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
                onClick={handleReplaceValues}
                className="px-4 py-2 bg-white border rounded text-sm transition-all"
                style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(109, 129, 150, 0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Replace Values
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
            {operationMessage && (
              <div
                className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#10263f' }}
              >
                {operationMessage}
              </div>
            )}
          </div>

          {/* Data Preview */}
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-white border rounded-lg overflow-x-auto" style={{ borderColor: '#D7DFEA' }}>
              <table className="min-w-max w-full text-sm">
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
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                <span style={{ color: '#4A4A4A' }}>{col}</span>
                                <div className="relative">
                                  <select
                                    value={sortConfig.column === col ? sortConfig.direction : 'default'}
                                    onChange={(e) => handleSortChange(col, e.target.value as 'default' | 'asc' | 'desc')}
                                    className="appearance-none rounded border px-2 py-1 text-[10px] uppercase tracking-wide"
                                    style={{ borderColor: '#D7DFEA', color: '#6D8196', backgroundColor: 'white' }}
                                  >
                                    <option value="default">Def</option>
                                    <option value="asc">Asc</option>
                                    <option value="desc">Desc</option>
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2" style={{ color: '#6D8196' }} />
                                </div>
                              </div>
                              <span className="text-xs" style={{ color: '#6D8196' }}>{type}</span>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((row, idx) => (
                    <tr key={idx} className="border-b transition-colors" style={{ borderColor: '#D7DFEA' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(109, 129, 150, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '';
                      }}>
                      {columns.map((col) => {
                        const value = row[col];
                        const isEmpty = isMissingValue(value);
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

      {previewState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#D7DFEA' }}>
              <div>
                <div className="text-xs uppercase" style={{ color: '#6D8196' }}>Transform Preview</div>
                <div className="text-lg font-bold" style={{ color: '#10263f' }}>{previewState.title}</div>
              </div>
              <button
                onClick={() => setPreviewState(null)}
                className="px-3 py-1.5 text-sm border rounded"
                style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
              >
                Close
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="text-sm" style={{ color: '#4A4A4A' }}>{previewState.description}</div>
              <div className="text-xs mt-1" style={{ color: '#6D8196' }}>{previewState.affectedCount} rows affected</div>

              {isRemoveEmptyPreview && (
                <div className="mt-4">
                  <label className="text-xs uppercase" style={{ color: '#6D8196' }}>Column</label>
                  <div className="relative mt-2">
                    <select
                      value={removeEmptyColumn}
                      onChange={(e) => {
                        setRemoveEmptyColumn(e.target.value);
                        removeEmptyColumnRef.current = e.target.value;
                        updateRemoveEmptyPreview(e.target.value);
                      }}
                      className="w-full appearance-none rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                    >
                      <option value="all">All columns</option>
                      {columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#6D8196' }} />
                  </div>
                </div>
              )}

              {isCasePreview && (
                <div className="mt-4">
                  <label className="text-xs uppercase" style={{ color: '#6D8196' }}>Column</label>
                  <div className="relative mt-2">
                    <select
                      value={caseColumn}
                      onChange={(e) => {
                        const nextColumn = e.target.value;
                        setCaseColumn(nextColumn);
                        caseColumnRef.current = nextColumn;
                        const transform = isUppercasePreview
                          ? (value: string) => value.toUpperCase()
                          : (value: string) => value.toLowerCase();
                        updateCasePreview(nextColumn, transform);
                      }}
                      className="w-full appearance-none rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                    >
                      {columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#6D8196' }} />
                  </div>
                </div>
              )}

              {isReplacePreview && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs uppercase" style={{ color: '#6D8196' }}>Column</label>
                    <select
                      value={replaceColumn}
                      onChange={(e) => {
                        setReplaceColumn(e.target.value);
                        replaceColumnRef.current = e.target.value;
                        updateReplacePreview(e.target.value, replaceFindValue);
                      }}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                    >
                      {columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase" style={{ color: '#6D8196' }}>Find</label>
                    <input
                      value={replaceFindValue}
                      onChange={(e) => {
                        setReplaceFindValue(e.target.value);
                        replaceFindValueRef.current = e.target.value;
                        updateReplacePreview(replaceColumn, e.target.value);
                      }}
                      placeholder="Value to find"
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase" style={{ color: '#6D8196' }}>Replace with</label>
                    <input
                      value={replaceWithValue}
                      onChange={(e) => {
                        setReplaceWithValue(e.target.value);
                        replaceWithValueRef.current = e.target.value;
                      }}
                      placeholder="New value"
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
                    />
                  </div>
                </div>
              )}

              {previewState.affectedCount === 0 ? (
                <div className="mt-4 text-sm" style={{ color: '#6D8196' }}>No rows affected.</div>
              ) : (
                <div className="mt-4 border rounded-lg overflow-hidden" style={{ borderColor: '#D7DFEA' }}>
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0" style={{ backgroundColor: 'rgba(109, 129, 150, 0.14)' }}>
                        <tr>
                          {previewState.columns.map((col) => (
                            <th key={col} className="px-3 py-2 text-left border-b" style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewState.rows.map((row, idx) => (
                          <tr key={idx} className="border-b" style={{ borderColor: '#D7DFEA' }}>
                            {previewState.columns.map((col) => {
                              const value = row[col];
                              const isEmpty = isMissingValue(value);
                              return (
                                <td key={col} className="px-3 py-2" style={{ color: '#4A4A4A' }}>
                                  {isEmpty ? (
                                    <span className="italic" style={{ color: '#10263f', backgroundColor: 'rgba(109, 129, 150, 0.16)', padding: '2px 4px', borderRadius: '4px' }}>null</span>
                                  ) : (
                                    <span>{String(value)}</span>
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

              {previewState.affectedCount > previewState.rows.length && (
                <div className="mt-2 text-xs" style={{ color: '#6D8196' }}>
                  Showing first {previewState.rows.length} rows.
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t flex items-center justify-end space-x-2" style={{ borderColor: '#D7DFEA' }}>
              <button
                onClick={() => setPreviewState(null)}
                className="px-4 py-2 text-sm border rounded"
                style={{ borderColor: '#D7DFEA', color: '#4A4A4A' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (applyDisabled) return;
                  previewState.onApply();
                  setPreviewState(null);
                }}
                className="px-4 py-2 text-sm rounded text-white"
                style={{
                  background: applyDisabled
                    ? 'rgba(109, 129, 150, 0.35)'
                    : 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)',
                  cursor: applyDisabled ? 'not-allowed' : 'pointer'
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

