import { useState } from 'react';
import { Upload, Clock, FileSpreadsheet, FolderOpen, Database, BarChart3, TrendingUp, CheckCircle, Layers } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface RecentFile {
  name: string;
  date: string;
  rows: number;
}

interface HomeScreenProps {
  onFileLoaded: (data: any[], fileName: string) => void;
  recentFiles: RecentFile[];
}

interface StoredFileData {
  name: string;
  data: any[];
  date: string;
  rows: number;
  sourceFiles?: string[];
}

export function HomeScreen({ onFileLoaded, recentFiles }: HomeScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const processFile = (file: File): Promise<{ data: any[], fileName: string }> => {
    return new Promise((resolve, reject) => {
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve({ data: results.data, fileName });
          },
          error: (error) => {
            reject(error);
          }
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve({ data: jsonData, fileName });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsBinaryString(file);
      } else {
        reject(new Error('Please upload a CSV or Excel file'));
      }
    });
  };

  const processMultipleFiles = async (files: File[]) => {
    try {
      const results = await Promise.all(files.map(file => processFile(file)));

      // Combine all datasets
      let combinedData: any[] = [];
      const fileNames: string[] = [];

      results.forEach(result => {
        combinedData = combinedData.concat(result.data);
        fileNames.push(result.fileName);
      });

      // Create a combined file name
      const combinedFileName = files.length === 1
        ? fileNames[0]
        : `Combined_${files.length}_files_${Date.now()}.csv`;

      // Save with source file information
      saveFileData(combinedFileName, combinedData, fileNames);
      onFileLoaded(combinedData, combinedFileName);
      setSelectedFiles([]);
    } catch (error: any) {
      alert('Error processing files: ' + error.message);
      setSelectedFiles([]);
    }
  };

  const saveFileData = (fileName: string, data: any[], sourceFiles?: string[]) => {
    try {
      const fileData: StoredFileData = {
        name: fileName,
        data: data,
        date: new Date().toISOString(),
        rows: data.length,
        sourceFiles: sourceFiles
      };
      localStorage.setItem(`fileData_${fileName}`, JSON.stringify(fileData));
    } catch (error) {
      console.warn('Unable to save file data to localStorage:', error);
    }
  };

  const handleRecentFileClick = (fileName: string) => {
    try {
      const storedData = localStorage.getItem(`fileData_${fileName}`);
      if (storedData) {
        const fileData: StoredFileData = JSON.parse(storedData);
        onFileLoaded(fileData.data, fileData.name);
      } else {
        alert('File data not found. Please upload the file again.');
      }
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Error loading file. Please upload the file again.');
    }
  };

  const getFileInfo = (fileName: string): { isCombined: boolean, sourceCount: number } => {
    try {
      const storedData = localStorage.getItem(`fileData_${fileName}`);
      if (storedData) {
        const fileData: StoredFileData = JSON.parse(storedData);
        return {
          isCombined: !!fileData.sourceFiles && fileData.sourceFiles.length > 1,
          sourceCount: fileData.sourceFiles?.length || 1
        };
      }
    } catch (error) {
      console.error('Error reading file info:', error);
    }
    return { isCombined: false, sourceCount: 1 };
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
    }
  };

  const handleCombineAndProcess = () => {
    if (selectedFiles.length > 0) {
      processMultipleFiles(selectedFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(circle at top left, rgba(242, 200, 17, 0.12), transparent 28%), radial-gradient(circle at right top, rgba(18, 58, 90, 0.12), transparent 26%), #f4f6fb' }}>
      {/* Header */}
      <div className="text-white px-6 py-8 shadow-lg" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
              <Database className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Welcome Back</h1>
          </div>
          <div className="flex items-center space-x-2 ml-11" style={{ color: '#d7dfea' }}>
            <BarChart3 className="w-4 h-4 text-white" />
            <span className="text-sm">Start analyzing your data with powerful insights</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left: Get Data */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
                  <FolderOpen className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: '#10263f' }}>Get Data</h2>
              </div>

              <div
                className="border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300"
                style={{
                  borderColor: isDragging ? '#3b82f6' : '#d7dfea',
                  backgroundColor: isDragging ? '#FFFDF7' : '#FFFFFF',
                  transform: isDragging ? 'scale(1.02)' : 'scale(1)'
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="relative inline-block mb-4">
                  <div className="relative p-4 rounded-2xl shadow-md" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
                    <Upload className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#10263f' }}>Upload Your Dataset</h3>
                <p className="mb-5 text-sm" style={{ color: '#6D8196' }}>
                  Drag and drop your files here or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                  multiple
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center space-x-2 px-6 py-3 text-white text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Browse Files</span>
                </label>
                <div className="mt-6 flex items-center justify-center space-x-2 text-xs flex-wrap gap-2">
                  <div className="px-3 py-2 rounded-lg font-medium flex items-center space-x-1.5" style={{ backgroundColor: '#f0f4f9', color: '#3b82f6' }}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </div>
                  <div className="px-3 py-2 rounded-lg font-medium flex items-center space-x-1.5" style={{ backgroundColor: '#e5e9f3', color: '#10263f' }}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Excel (.xlsx)</span>
                  </div>
                  <div className="px-3 py-2 rounded-lg font-medium flex items-center space-x-1.5" style={{ backgroundColor: '#FFFDF7', color: '#3D3D3D' }}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Excel (.xls)</span>
                  </div>
                </div>
                <p className="mt-4 text-xs font-medium flex items-center justify-center space-x-1" style={{ color: '#6D8196' }}>
                  <Layers className="w-3.5 h-3.5" />
                  <span>You can select multiple files to combine into one dataset</span>
                </p>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 bg-white rounded-xl p-4 shadow-md" style={{ border: '1px solid #d7dfea' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold flex items-center space-x-2" style={{ color: '#10263f' }}>
                      <Layers className="w-4 h-4" style={{ color: '#3b82f6' }} />
                      <span>Selected Files ({selectedFiles.length})</span>
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-auto mb-3">
                    {selectedFiles.map((file, idx) => (
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.10)' }}>
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <FileSpreadsheet className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} />
                          <span className="text-sm truncate" style={{ color: '#10263f' }}>{file.name}</span>
                          <span className="text-xs" style={{ color: '#3b82f6' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(idx)}
                          className="ml-2 text-xs font-semibold"
                          style={{ color: '#3b82f6' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleCombineAndProcess}
                    className="w-full px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                    style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Combine & Process {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Recent Files */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: '#3D3D3D' }}>Recent Files</h2>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden shadow-md" style={{ border: '1px solid #D7DFEA' }}>
                {recentFiles.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="relative inline-block mb-3">
                      <div className="relative p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
                        <FileSpreadsheet className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <p className="text-base font-semibold" style={{ color: '#10263f' }}>No recent files</p>
                    <p className="text-sm mt-2 flex items-center justify-center space-x-1.5" style={{ color: '#3b82f6' }}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Upload a file to get started</span>
                    </p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: '#d7dfea' }}>
                    {recentFiles.map((file, idx) => {
                      const fileInfo = getFileInfo(file.name);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleRecentFileClick(file.name)}
                          className="p-4 transition-all duration-200 cursor-pointer group"
                          style={{
                            background: 'rgba(255, 255, 255, 0)',
                            borderRadius: '0.5rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.10)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0)';
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-200" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
                              {fileInfo.isCombined ? (
                                <Layers className="w-5 h-5 text-white" />
                              ) : (
                                <FileSpreadsheet className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm transition-colors truncate" style={{ color: '#10263f' }}>{file.name}</h4>
                              <div className="flex items-center space-x-2 text-xs mt-1 flex-wrap" style={{ color: '#3b82f6' }}>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDate(file.date)}</span>
                                </div>
                                <span>•</span>
                                <div className="px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: 'rgba(59, 130, 246, 0.18)', color: '#10263f' }}>
                                  {file.rows.toLocaleString()} rows
                                </div>
                                {fileInfo.isCombined && (
                                  <>
                                    <span>•</span>
                                    <div className="px-2 py-0.5 rounded-md font-medium flex items-center space-x-1" style={{ backgroundColor: 'rgba(59, 130, 246, 0.16)', color: '#10263f' }}>
                                      <Layers className="w-3 h-3" />
                                      <span>{fileInfo.sourceCount} files combined</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-white rounded-xl shadow-md p-6 border transition-all duration-300 hover:shadow-lg hover:scale-105" style={{ borderColor: '#D7DFEA' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase" style={{ color: '#3b82f6' }}>Total Analyses</div>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#3b82f6' }}></div>
              </div>
              <div className="text-4xl font-bold" style={{ color: '#10263f' }}>
                {recentFiles.length}
              </div>
              <div className="mt-2 text-xs" style={{ color: '#3b82f6' }}>Files processed</div>
            </div>
            <div className="group bg-white rounded-xl shadow-md p-6 border transition-all duration-300 hover:shadow-lg hover:scale-105" style={{ borderColor: '#D7DFEA' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase" style={{ color: '#3b82f6' }}>Data Cleaned</div>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#3b82f6', animationDelay: '0.5s' }}></div>
              </div>
              <div className="text-4xl font-bold" style={{ color: '#10263f' }}>
                {recentFiles.reduce((acc, f) => acc + f.rows, 0).toLocaleString()}
              </div>
              <div className="mt-2 text-xs" style={{ color: '#3b82f6' }}>Total rows processed</div>
            </div>
            <div className="group bg-white rounded-xl shadow-md p-6 border transition-all duration-300 hover:shadow-lg hover:scale-105" style={{ borderColor: '#D7DFEA' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase" style={{ color: '#3b82f6' }}>Status</div>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#3b82f6', animationDelay: '1s' }}></div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8" style={{ color: '#3b82f6' }} />
              </div>
              <div className="mt-2 text-xs" style={{ color: '#3b82f6' }}>System operational</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

