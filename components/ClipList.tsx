import React, { useState } from 'react';
import { ClipSegment, ProcessingStatus } from '../types';
import { parseTimeStringToSeconds } from '../services/timeUtils';
import { exportClip } from '../services/videoExportService';
import { Download, Play, scissors, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface ClipListProps {
  clips: ClipSegment[];
  videoFile: File | null;
}

export const ClipList: React.FC<ClipListProps> = ({ clips, videoFile }) => {
  const [status, setStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    progress: 0,
    currentTask: '',
  });
  const [activeClipIndex, setActiveClipIndex] = useState<number | null>(null);

  const handleExport = async (clip: ClipSegment, index: number) => {
    if (!videoFile) return;

    try {
      setStatus({
        isProcessing: true,
        progress: 0,
        currentTask: `Preparing clip: ${clip.title}`,
      });
      setActiveClipIndex(index);

      const start = parseTimeStringToSeconds(clip.start);
      const end = parseTimeStringToSeconds(clip.end);

      const blob = await exportClip({
        sourceFile: videoFile,
        startTime: start,
        endTime: end,
        onProgress: (p) => setStatus(prev => ({ ...prev, progress: p, currentTask: `Encoding... ${p}%` })),
      });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clip.title.replace(/[^a-z0-9]/gi, '_')}_gemini_cut.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus({ isProcessing: false, progress: 100, currentTask: 'Done!' });
    } catch (error) {
      console.error(error);
      setStatus({
        isProcessing: false,
        progress: 0,
        currentTask: '',
        error: 'Export failed. Your browser might not support WebCodecs.',
      });
    } finally {
      setActiveClipIndex(null);
    }
  };

  if (clips.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg mt-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 w-2 h-6 rounded-full"></span>
        Viral Clips Identified ({clips.length})
      </h2>

      {status.error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-red-200">
          <AlertCircle size={20} />
          <span>{status.error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {clips.map((clip, index) => (
          <div 
            key={index} 
            className={`relative p-5 rounded-xl border transition-all duration-300 ${
              activeClipIndex === index 
                ? 'bg-gray-700/50 border-cyan-500/50 shadow-lg shadow-cyan-900/20' 
                : 'bg-gray-750 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-white line-clamp-1" title={clip.title}>
                {clip.title}
              </h3>
              <div className="flex items-center gap-1 text-xs font-mono bg-gray-900/50 px-2 py-1 rounded text-cyan-400 border border-gray-700">
                <Clock size={12} />
                {clip.start} - {clip.end}
              </div>
            </div>
            
            <p className="text-gray-400 text-sm mb-4 line-clamp-2 h-10" title={clip.description}>
              {clip.description}
            </p>

            <div className="flex items-center justify-between mt-auto">
                {activeClipIndex === index && status.isProcessing ? (
                    <div className="w-full">
                        <div className="flex justify-between text-xs text-cyan-400 mb-1">
                            <span>Processing...</span>
                            <span>{status.progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-cyan-500 transition-all duration-300"
                                style={{ width: `${status.progress}%` }}
                            ></div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => handleExport(clip, index)}
                        disabled={status.isProcessing || !videoFile}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                            !videoFile 
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-white text-gray-900 hover:bg-cyan-50 shadow hover:shadow-cyan-500/50'
                        }`}
                    >
                        {status.isProcessing ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <Download size={18} />
                        )}
                        {status.isProcessing ? 'Waiting...' : 'Export Clip'}
                    </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
