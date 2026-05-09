import { useState } from 'react';
import { Upload, Database, Sparkles } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileUploadScreenProps {
  onFileLoaded: (data: any[], fileName: string, action: 'load' | 'transform') => void;
}

const headerGradient = 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)';

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
          <h1 className="text-4xl mb-2" style={{ color: '#10263f' }}>Data Cleaning & Analytics System</h1>
          <p style={{ color: '#6D8196' }}>Power BI-style data transformation and visualization</p>
        </div>

        {!uploadedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors ${
              isDragging ? 'border-[#6D8196] bg-[rgba(109,129,150,0.08)]' : 'border-[#D7DFEA] bg-white hover:border-[#6D8196]'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: headerGradient }}>
              <Upload className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl mb-2" style={{ color: '#3D3D3D' }}>Get Data</h3>
            <p className="mb-6" style={{ color: '#6D8196' }}>Upload CSV or Excel file to begin</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-8 py-3 text-white rounded-lg cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 text-lg"
              style={{ background: headerGradient }}
            >
              <Upload className="h-5 w-5" />
              Browse Files
            </label>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl mb-6">File Loaded: {uploadedFile.name}</h2>

            <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'rgba(109, 129, 150, 0.08)' }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div style={{ color: '#6D8196' }}>Total Rows</div>
                  <div className="text-2xl">{uploadedFile.data.length.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: '#6D8196' }}>Total Columns</div>
                  <div className="text-2xl">{Object.keys(uploadedFile.data[0] || {}).length}</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3">Preview (First 5 rows)</h3>
              <div className="overflow-x-auto border rounded-lg" style={{ borderColor: '#D7DFEA' }}>
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: 'rgba(109, 129, 150, 0.14)' }}>
                    <tr>
                      {Object.keys(uploadedFile.data[0] || {}).map((col) => (
                        <th key={col} className="px-4 py-2 text-left border-b" style={{ borderColor: '#D7DFEA' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFile.data.slice(0, 5).map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(109, 129, 150, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '';
                        }}
                      >
                        {Object.keys(uploadedFile.data[0] || {}).map((col) => (
                          <td key={col} className="px-4 py-2">{String(row[col] || '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center mb-4" style={{ color: '#6D8196' }}>
              Choose how to proceed with your data:
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onFileLoaded(uploadedFile.data, uploadedFile.name, 'load')}
                className="flex flex-col items-center p-6 border-2 rounded-lg transition-all duration-200 hover:shadow-md"
                style={{ borderColor: '#D7DFEA', backgroundColor: 'white' }}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: headerGradient }}>
                  <Database className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2">Load</h3>
                <p className="text-sm text-center" style={{ color: '#6D8196' }}>
                  Load data as-is and start creating visualizations
                </p>
              </button>

              <button
                onClick={() => onFileLoaded(uploadedFile.data, uploadedFile.name, 'transform')}
                className="flex flex-col items-center p-6 border-2 rounded-lg transition-all duration-200 hover:shadow-md"
                style={{ borderColor: '#6D8196', backgroundColor: 'rgba(109, 129, 150, 0.08)' }}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: headerGradient }}>
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2">Transform Data</h3>
                <p className="text-sm text-center" style={{ color: '#6D8196' }}>
                  Clean and transform your data before loading (Recommended)
                </p>
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setUploadedFile(null)}
                className="transition-colors"
                style={{ color: '#6D8196' }}
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
