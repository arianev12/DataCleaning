import { TrendingUp, Award, BarChart3 } from 'lucide-react';

interface InsightsGenerationProps {
  data: any[];
}

export function InsightsGeneration({ data }: InsightsGenerationProps) {
  if (!data || data.length === 0) {
    return <div className="text-[#D7DFEA]">No data available for insights</div>;
  }

  const columns = Object.keys(data[0]);

  const getColumnInsights = (columnName: string) => {
    const values = data.map(row => row[columnName]).filter(v => v !== null && v !== undefined && v !== '');

    if (values.length === 0) return null;

    const isNumeric = !isNaN(Number(values[0])) && values[0] !== '';

    if (isNumeric) {
      const numbers = values.map(Number);
      const sum = numbers.reduce((a, b) => a + b, 0);
      const mean = sum / numbers.length;
      const sorted = [...numbers].sort((a, b) => a - b);
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      const range = max - min;

      let trend = 'stable';
      if (numbers.length >= 3) {
        const firstThird = numbers.slice(0, Math.floor(numbers.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(numbers.length / 3);
        const lastThird = numbers.slice(-Math.floor(numbers.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(numbers.length / 3);
        if (lastThird > firstThird * 1.1) trend = 'increasing';
        else if (lastThird < firstThird * 0.9) trend = 'decreasing';
      }

      return {
        type: 'numeric',
        mean: mean.toFixed(2),
        median: median.toFixed(2),
        min,
        max,
        range: range.toFixed(2),
        trend,
        totalValues: values.length
      };
    } else {
      const frequency: { [key: string]: number } = {};
      values.forEach(v => {
        const key = String(v);
        frequency[key] = (frequency[key] || 0) + 1;
      });

      const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
      const mostFrequent = sorted.slice(0, 5);
      const uniqueCount = Object.keys(frequency).length;

      return {
        type: 'categorical',
        mostFrequent,
        uniqueCount,
        totalValues: values.length
      };
    }
  };

  const numericColumns = columns.filter(col => {
    const insights = getColumnInsights(col);
    return insights && insights.type === 'numeric';
  });

  const categoricalColumns = columns.filter(col => {
    const insights = getColumnInsights(col);
    return insights && insights.type === 'categorical';
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div className="text-sm text-[#10263f]">Total Records</div>
          </div>
          <div className="text-3xl text-blue-900">{data.length.toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-5 h-5 text-green-600" />
            <div className="text-sm text-[#10263f]">Numeric Fields</div>
          </div>
          <div className="text-3xl text-green-900">{numericColumns.length}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <div className="text-sm text-[#10263f]">Categorical Fields</div>
          </div>
          <div className="text-3xl text-purple-900">{categoricalColumns.length}</div>
        </div>
      </div>

      {numericColumns.length > 0 && (
        <div className="bg-white rounded-lg border border-[#D7DFEA] p-6">
          <h3 className="mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Numeric Column Insights</span>
          </h3>
          <div className="space-y-4">
            {numericColumns.map(col => {
              const insights = getColumnInsights(col);
              if (!insights || insights.type !== 'numeric') return null;

              return (
                <div key={col} className="border rounded-lg p-4">
                  <h4 className="mb-3">{col}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-[#D7DFEA]">Mean</div>
                      <div className="text-lg">{insights.mean}</div>
                    </div>
                    <div>
                        <div className="text-[#D7DFEA]">Median</div>
                      <div className="text-lg">{insights.median}</div>
                    </div>
                    <div>
                      <div className="text-[#D7DFEA]">Range</div>
                      <div className="text-lg">{insights.min} - {insights.max}</div>
                    </div>
                    <div>
                      <div className="text-[#D7DFEA]">Trend</div>
                      <div className={`text-lg ${
                        insights.trend === 'increasing' ? 'text-green-600' :
                        insights.trend === 'decreasing' ? 'text-red-600' :
                        'text-[#10263f]'
                      }`}>
                        {insights.trend === 'increasing' ? '↗ Increasing' :
                         insights.trend === 'decreasing' ? '↘ Decreasing' :
                         '→ Stable'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-[#10263f]">
                    Interpretation: This field has a mean of {insights.mean} with values ranging from {insights.min} to {insights.max}.
                    The data shows a {insights.trend} trend over the dataset.
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {categoricalColumns.length > 0 && (
        <div className="bg-white rounded-lg border border-[#D7DFEA] p-6">
          <h3 className="mb-4 flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Categorical Column Insights</span>
          </h3>
          <div className="space-y-4">
            {categoricalColumns.map(col => {
              const insights = getColumnInsights(col);
              if (!insights || insights.type !== 'categorical') return null;

              return (
                <div key={col} className="border rounded-lg p-4">
                  <h4 className="mb-3">{col}</h4>
                  <div className="mb-3">
                    <div className="text-sm text-[#D7DFEA] mb-2">
                      {insights.uniqueCount} unique values out of {insights.totalValues} records
                    </div>
                    <div className="text-sm mb-2">Most Frequent Values:</div>
                    <div className="space-y-1">
                      {insights.mostFrequent && insights.mostFrequent.length > 0 ? insights.mostFrequent.map(([value, count], idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className="flex-1 bg-[#D7DFEA] rounded-full h-6 relative">
                            <div
                              className="bg-blue-500 h-6 rounded-full flex items-center px-2 text-xs text-white"
                              style={{ width: `${(count / insights.totalValues) * 100}%` }}
                            >
                              {value}
                            </div>
                          </div>
                          <div className="text-sm w-16 text-right">{count} ({((count / insights.totalValues) * 100).toFixed(1)}%)</div>
                        </div>
                      )) : <div className="text-sm text-[#D7DFEA]">No frequency data available</div>}
                    </div>
                  </div>
                  <div className="text-sm text-[#10263f]">
                    Interpretation: This categorical field has {insights.uniqueCount} distinct values.
                    {insights.mostFrequent && insights.mostFrequent.length > 0 ? (
                      <>The most common value is "{insights.mostFrequent[0][0]}" appearing {insights.mostFrequent[0][1]} times
                      ({((insights.mostFrequent[0][1] / insights.totalValues) * 100).toFixed(1)}% of records).</>
                    ) : 'No frequency data available.'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
