import { useEffect, useState } from 'react';
import { Database, Sparkles, BarChart3, Loader2, Package, Settings, CheckCircle } from 'lucide-react';

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 25);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #10263f 0%, #123a5a 48%, #1e3350 100%)' }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: '#6D8196', opacity: 0.2 }}></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: '#CBCBCB', opacity: 0.15, animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl animate-pulse" style={{ backgroundColor: '#FFFFE3', opacity: 0.1, animationDelay: '2s' }}></div>
      </div>

      <div className="text-center relative z-10">
        {/* Logo */}
        <div className="mb-6 relative">
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full blur-xl animate-pulse" style={{ background: 'linear-gradient(to right, #6D8196, #CBCBCB)', opacity: 0.5 }}></div>
            <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl border-2 border-white/50">
              <div className="relative">
                <Database className="w-12 h-12 animate-bounce" style={{ color: '#6D8196', animationDuration: '2s' }} />
                <Sparkles className="w-6 h-6 absolute -top-2 -right-2 animate-spin" style={{ color: '#4A4A4A', animationDuration: '3s' }} />
                <BarChart3 className="w-6 h-6 absolute -bottom-2 -left-2 animate-pulse" style={{ color: '#6D8196' }} />
              </div>
            </div>
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-xl">
          Data Analytics Pro
        </h1>
        <p className="mb-6 text-sm font-medium flex items-center justify-center space-x-2" style={{ color: '#FFFFE3' }}>
          <Sparkles className="w-4 h-4" />
          <span>Enterprise Data Management System</span>
          <Sparkles className="w-4 h-4" />
        </p>

        {/* Loading Bar */}
        <div className="w-80 mx-auto">
          <div className="rounded-full h-3 overflow-hidden shadow-md" style={{ backgroundColor: 'rgba(203, 203, 203, 0.3)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <div
              className="h-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(to right, #6D8196, #CBCBCB)'
              }}
            >
              <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(to right, transparent, rgba(255, 255, 227, 0.3), transparent)' }}></div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs font-semibold flex items-center space-x-1.5" style={{ color: '#FFFFE3' }}>
              {progress < 30 && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Initializing system...</span>
                </>
              )}
              {progress >= 30 && progress < 60 && (
                <>
                  <Package className="w-3.5 h-3.5" />
                  <span>Loading modules...</span>
                </>
              )}
              {progress >= 60 && progress < 90 && (
                <>
                  <Settings className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing workspace...</span>
                </>
              )}
              {progress >= 90 && (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Ready!</span>
                </>
              )}
            </div>
            <div className="text-xs font-bold" style={{ color: '#FFFFE3' }}>
              {progress}%
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-6 flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-1.5 text-xs" style={{ color: '#CBCBCB' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#6D8196' }}></div>
            <span>Data Cleaning</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs" style={{ color: '#CBCBCB' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#CBCBCB', animationDelay: '0.5s' }}></div>
            <span>Analytics</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs" style={{ color: '#CBCBCB' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#FFFFE3', animationDelay: '1s' }}></div>
            <span>Visualizations</span>
          </div>
        </div>

        {/* Version */}
        <div className="mt-6 text-xs font-medium" style={{ color: 'rgba(203, 203, 203, 0.5)' }}>
          InsightFlow - BAT403 - Foundations of Enterprise Data Management - Version 1.0.0
        </div>
      </div>
    </div>
  );
}
