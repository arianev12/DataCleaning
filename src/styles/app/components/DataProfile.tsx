interface DataProfileProps {
  data: any[];
}

export function DataProfile({ data }: DataProfileProps) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500">No data available</div>;
  }

  const columns = Object.keys(data[0]);
  const rowCount = data.length;
  const columnCount = columns.length;

  const getColumnStats = (columnName: string) => {
    const values = data.map(row => row[columnName]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const missingCount = rowCount - nonNullValues.length;
    const missingPercentage = ((missingCount / rowCount) * 100).toFixed(1);

    let dataType = 'string';
    if (nonNullValues.length > 0) {
      const sampleValue = nonNullValues[0];
      if (!isNaN(Number(sampleValue)) && sampleValue !== '') {
        dataType = 'number';
      } else if (!isNaN(Date.parse(sampleValue))) {
        dataType = 'date';
      }
    }

    let uniqueCount = new Set(nonNullValues).size;

    let min, max, mean;
    if (dataType === 'number') {
      const numValues = nonNullValues.map(Number).filter(n => !isNaN(n));
      if (numValues.length > 0) {
        min = Math.min(...numValues);
        max = Math.max(...numValues);
        mean = (numValues.reduce((a, b) => a + b, 0) / numValues.length).toFixed(2);
      }
    }

    return {
      dataType,
      missingCount,
      missingPercentage,
      uniqueCount,
      min,
      max,
      mean,
      nonNullCount: nonNullValues.length
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-gray-600 text-sm">Total Rows</div>
          <div className="text-2xl mt-1">{rowCount.toLocaleString()}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-gray-600 text-sm">Total Columns</div>
          <div className="text-2xl mt-1">{columnCount}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-gray-600 text-sm">Data Points</div>
          <div className="text-2xl mt-1">{(rowCount * columnCount).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-gray-700">Column</th>
                <th className="px-4 py-3 text-left text-sm text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm text-gray-700">Non-Null</th>
                <th className="px-4 py-3 text-left text-sm text-gray-700">Missing</th>
                <th className="px-4 py-3 text-left text-sm text-gray-700">Unique</th>
                <th className="px-4 py-3 text-left text-sm text-gray-700">Statistics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {columns.map((column) => {
                const stats = getColumnStats(column);
                return (
                  <tr key={column} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{column}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        stats.dataType === 'number' ? 'bg-blue-100 text-blue-800' :
                        stats.dataType === 'date' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {stats.dataType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{stats.nonNullCount}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={stats.missingCount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {stats.missingCount} ({stats.missingPercentage}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{stats.uniqueCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stats.dataType === 'number' && (
                        <div className="text-xs">
                          Min: {stats.min} | Max: {stats.max} | Mean: {stats.mean}
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
    </div>
  );
}
