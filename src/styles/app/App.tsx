import { useState, useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { HomeScreen } from './components/HomeScreen';
import { DataProfileScreen } from './components/DataProfileScreen';
import { TransformDataEditor } from './components/TransformDataEditor';
import { DataComparisonScreen } from './components/DataComparisonScreen';
import { InsightsScreen } from './components/InsightsScreen';
import { ReportView } from './components/ReportView';

type AppMode = 'loading' | 'home' | 'profile' | 'transform' | 'compare' | 'insights' | 'report';

interface RecentFile {
  name: string;
  date: string;
  rows: number;
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('loading');
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [transformedData, setTransformedData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMode('home');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('recentFiles');
    if (stored) {
      setRecentFiles(JSON.parse(stored));
    }
  }, []);

  const saveRecentFile = (name: string, rows: number) => {
    const newRecent: RecentFile = {
      name,
      date: new Date().toISOString(),
      rows
    };
    const updated = [newRecent, ...recentFiles.filter(f => f.name !== name)].slice(0, 5);
    setRecentFiles(updated);
    localStorage.setItem('recentFiles', JSON.stringify(updated));
  };

  const handleFileLoaded = (data: any[], name: string) => {
    setOriginalData(data);
    setTransformedData(data);
    setFileName(name);
    saveRecentFile(name, data.length);
    setMode('profile');
  };

  const handleStartCleaning = () => {
    setMode('transform');
  };

  const handleCloseAndApply = (cleanedData: any[]) => {
    setTransformedData(cleanedData);
    setMode('compare');
  };

  const handleViewInsights = () => {
    setMode('insights');
  };

  const handleCreateReport = () => {
    setMode('report');
  };

  const handleBackToHome = () => {
    setMode('home');
    setOriginalData([]);
    setTransformedData([]);
    setFileName('');
  };

  const handleGoToTransform = () => {
    setMode('transform');
  };

  const handleGoToCompare = () => {
    setMode('compare');
  };

  const handleGoToInsights = () => {
    setMode('insights');
  };

  return (
    <div className="size-full">
      {mode === 'loading' && <LoadingScreen />}

      {mode === 'home' && (
        <HomeScreen
          onFileLoaded={handleFileLoaded}
          recentFiles={recentFiles}
        />
      )}

      {mode === 'profile' && (
        <DataProfileScreen
          data={originalData}
          fileName={fileName}
          onStartCleaning={handleStartCleaning}
          onBackToHome={handleBackToHome}
        />
      )}

      {mode === 'transform' && (
        <TransformDataEditor
          originalData={originalData}
          fileName={fileName}
          onCloseAndApply={handleCloseAndApply}
          onBackToHome={handleBackToHome}
        />
      )}

      {mode === 'compare' && (
        <DataComparisonScreen
          originalData={originalData}
          cleanedData={transformedData}
          fileName={fileName}
          onViewInsights={handleViewInsights}
          onBackToTransform={handleGoToTransform}
          onBackToHome={handleBackToHome}
        />
      )}

      {mode === 'insights' && (
        <InsightsScreen
          data={transformedData}
          fileName={fileName}
          onCreateReport={handleCreateReport}
          onBackToCompare={handleGoToCompare}
          onBackToHome={handleBackToHome}
        />
      )}

      {mode === 'report' && (
        <ReportView
          data={transformedData}
          fileName={fileName}
          onTransformData={handleGoToTransform}
          onViewInsights={handleGoToInsights}
          onBackToHome={handleBackToHome}
        />
      )}
    </div>
  );
}
