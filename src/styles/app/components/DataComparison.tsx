import { useState } from 'react';

interface DataComparisonProps {
  originalData: any[];
  cleanedData: any[];
  operations: string[];
}

export function DataComparison({ originalData, cleanedData, operations }: DataComparisonProps) {
  const [showOriginal, setShowOriginal] = useState(true);
  const displayData = showOriginal ? originalData : cleanedData;

  const columns = displayData.length > 0 ? Object.keys(displayData[0]) : [];
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(displayData.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentRows = displayData.slice(startIdx, endIdx);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-gray-600 text-sm">Original Dataset</div>
          <div className="text-2xl mt-1">{originalData.length} rows</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-gray-600 text-sm">Cleaned Dataset</div>
          <div className="text-2xl mt-1">{cleanedData.length} rows</div>
        </div>
      </div>

      {operations.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="mb-2">Applied Operations:</h4>
          <ul className="list-disc list-inside space-y-1">
            {operations.map((op, idx) => (
              <li key={idx} className="text-sm text-gray-700">{op}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowOriginal(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showOriginal ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Original Data
            </button>
            <button
              onClick={() => setShowOriginal(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !showOriginal ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cleaned Data
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Showing {startIdx + 1}-{Math.min(endIdx, displayData.length)} of {displayData.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-sm text-gray-700 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3 text-sm whitespace-nowrap">
                      {row[col] !== null && row[col] !== undefined && row[col] !== ''
                        ? String(row[col])
                        : <span className="text-red-400 italic">empty</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
