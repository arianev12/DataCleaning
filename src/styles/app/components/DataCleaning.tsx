import { useState } from 'react';
import { Check } from 'lucide-react';

interface DataCleaningProps {
  data: any[];
  onClean: (cleanedData: any[], operations: string[]) => void;
}

export function DataCleaning({ data, onClean }: DataCleaningProps) {
  const [selectedOperations, setSelectedOperations] = useState<{
    removeDuplicates: boolean;
    handleMissing: string;
    standardizeText: boolean;
    removeWhitespace: boolean;
    convertTypes: boolean;
  }>({
    removeDuplicates: false,
    handleMissing: 'none',
    standardizeText: false,
    removeWhitespace: false,
    convertTypes: false,
  });

  const handleClean = () => {
    let cleaned = [...data];
    const operations: string[] = [];

    if (selectedOperations.removeDuplicates) {
      const before = cleaned.length;
      const seen = new Set();
      cleaned = cleaned.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      operations.push(`Removed ${before - cleaned.length} duplicate rows`);
    }

    if (selectedOperations.handleMissing !== 'none') {
      const columns = Object.keys(cleaned[0] || {});

      if (selectedOperations.handleMissing === 'remove') {
        const before = cleaned.length;
        cleaned = cleaned.filter(row => {
          return columns.every(col => {
            const val = row[col];
            return val !== null && val !== undefined && val !== '';
          });
        });
        operations.push(`Removed ${before - cleaned.length} rows with missing values`);
      } else if (selectedOperations.handleMissing === 'fillZero') {
        cleaned = cleaned.map(row => {
          const newRow = { ...row };
          columns.forEach(col => {
            if (newRow[col] === null || newRow[col] === undefined || newRow[col] === '') {
              const sampleValues = cleaned.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
              if (sampleValues.length > 0 && !isNaN(Number(sampleValues[0]))) {
                newRow[col] = 0;
              } else {
                newRow[col] = 'N/A';
              }
            }
          });
          return newRow;
        });
        operations.push('Filled missing values (0 for numbers, N/A for text)');
      }
    }

    if (selectedOperations.removeWhitespace) {
      cleaned = cleaned.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          const value = row[key];
          newRow[key] = typeof value === 'string' ? value.trim() : value;
        });
        return newRow;
      });
      operations.push('Removed leading/trailing whitespace');
    }

    if (selectedOperations.standardizeText) {
      cleaned = cleaned.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          const value = row[key];
          if (typeof value === 'string') {
            newRow[key] = value.toLowerCase();
          } else {
            newRow[key] = value;
          }
        });
        return newRow;
      });
      operations.push('Standardized text to lowercase');
    }

    if (selectedOperations.convertTypes) {
      cleaned = cleaned.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          const value = row[key];
          if (typeof value === 'string' && value !== '') {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              newRow[key] = numValue;
            } else {
              newRow[key] = value;
            }
          } else {
            newRow[key] = value;
          }
        });
        return newRow;
      });
      operations.push('Converted numeric strings to numbers');
    }

    if (operations.length === 0) {
      operations.push('No cleaning operations applied');
    }

    onClean(cleaned, operations);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4">Select Cleaning Operations</h3>

        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOperations.removeDuplicates}
              onChange={(e) => setSelectedOperations({
                ...selectedOperations,
                removeDuplicates: e.target.checked
              })}
              className="w-4 h-4"
            />
            <div>
              <div>Remove Duplicate Rows</div>
              <div className="text-sm text-gray-500">Removes exact duplicate records</div>
            </div>
          </label>

          <div className="border-t pt-4">
            <div className="mb-2">Handle Missing Values</div>
            <div className="space-y-2 ml-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="missing"
                  checked={selectedOperations.handleMissing === 'none'}
                  onChange={() => setSelectedOperations({
                    ...selectedOperations,
                    handleMissing: 'none'
                  })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Keep as is</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="missing"
                  checked={selectedOperations.handleMissing === 'remove'}
                  onChange={() => setSelectedOperations({
                    ...selectedOperations,
                    handleMissing: 'remove'
                  })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Remove rows with missing values</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="missing"
                  checked={selectedOperations.handleMissing === 'fillZero'}
                  onChange={() => setSelectedOperations({
                    ...selectedOperations,
                    handleMissing: 'fillZero'
                  })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Fill with default values (0/N/A)</span>
              </label>
            </div>
          </div>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOperations.removeWhitespace}
              onChange={(e) => setSelectedOperations({
                ...selectedOperations,
                removeWhitespace: e.target.checked
              })}
              className="w-4 h-4"
            />
            <div>
              <div>Remove Extra Whitespace</div>
              <div className="text-sm text-gray-500">Trim leading and trailing spaces</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOperations.standardizeText}
              onChange={(e) => setSelectedOperations({
                ...selectedOperations,
                standardizeText: e.target.checked
              })}
              className="w-4 h-4"
            />
            <div>
              <div>Standardize Text Case</div>
              <div className="text-sm text-gray-500">Convert all text to lowercase</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOperations.convertTypes}
              onChange={(e) => setSelectedOperations({
                ...selectedOperations,
                convertTypes: e.target.checked
              })}
              className="w-4 h-4"
            />
            <div>
              <div>Convert Data Types</div>
              <div className="text-sm text-gray-500">Convert numeric strings to numbers</div>
            </div>
          </label>
        </div>

        <button
          onClick={handleClean}
          className="mt-6 px-6 py-3 text-white rounded-lg hover:shadow-lg transition-all flex items-center space-x-2" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e3350 100%)' }}
        >
          <Check className="w-4 h-4" />
          <span>Apply Cleaning Operations</span>
        </button>
      </div>
    </div>
  );
}
