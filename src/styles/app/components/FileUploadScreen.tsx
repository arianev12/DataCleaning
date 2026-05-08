import { useState } from 'react';
import { Upload, Database, Sparkles } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileUploadScreenProps {
  onFileLoaded: (data: any[], fileName: string, action: 'load' | 'transform') => void;
}

export function FileUploadScreen({ onFileLoaded }: FileUploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ data: any[], name: string } | null>(null);

  const processFile = (file: File) => {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setUploadedFile({ data: results.data, name: fileName });
        },
        error: (error) => {
          alert('Error parsing CSV: ' + error.message);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setUploadedFile({ data: jsonData, name: fileName });
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Please upload a CSV or Excel file');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2 text-gray-800">Data Cleaning & Analytics System</h1>
          <p className="text-gray-600">Power BI-style data transformation and visualization</p>
        </div>

        {!uploadedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl mb-2 text-gray-700">Get Data</h3>
            <p className="text-gray-500 mb-6">Upload CSV or Excel file to begin</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-lg"
            >
              Browse Files
            </label>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl mb-6">File Loaded: {uploadedFile.name}</h2>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Total Rows</div>
                  <div className="text-2xl">{uploadedFile.data.length.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-600">Total Columns</div>
                  <div className="text-2xl">{Object.keys(uploadedFile.data[0] || {}).length}</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3">Preview (First 5 rows)</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(uploadedFile.data[0] || {}).map((col) => (
                        <th key={col} className="px-4 py-2 text-left border-b">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFile.data.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        {Object.keys(uploadedFile.data[0] || {}).map((col) => (
                          <td key={col} className="px-4 py-2">{String(row[col] || '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center mb-4 text-gray-600">
              Choose how to proceed with your data:
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onFileLoaded(uploadedFile.data, uploadedFile.name, 'load')}
                className="flex flex-col items-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Database className="h-12 w-12 text-blue-600 mb-3" />
                <h3 className="mb-2">Load</h3>
                <p className="text-sm text-gray-600 text-center">
                  Load data as-is and start creating visualizations
                </p>
              </button>

              <button
                onClick={() => onFileLoaded(uploadedFile.data, uploadedFile.name, 'transform')}
                className="flex flex-col items-center p-6 border-2 border-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Sparkles className="h-12 w-12 text-blue-600 mb-3" />
                <h3 className="mb-2">Transform Data</h3>
                <p className="text-sm text-gray-600 text-center">
                  Clean and transform your data before loading (Recommended)
                </p>
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setUploadedFile(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Choose a different file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
