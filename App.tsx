import React, { useState, useRef } from 'react';
import { GeminiIntegration } from './components/GeminiIntegration';
import { ClipList } from './components/ClipList';
import { ClipSegment } from './types';
import { Upload, Video, Code2, AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [clips, setClips] = useState<ClipSegment[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setClips([]); // Reset clips on new file
    }
  };

  const handleJsonPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonInput(val);
    setParseError(null);

    try {
      // Find JSON array in the text (Gemini sometimes adds extra text)
      const jsonMatch = val.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0 && 'start' in parsed[0]) {
          setClips(parsed);
        } else {
           // Not throwing, just waiting for valid input
        }
      }
    } catch (err) {
      // Allow user to keep typing without aggressive errors
    }
  };

  const manualParse = () => {
    try {
       // Helper to clean markdown json blocks
       let cleanJson = jsonInput;
       if (cleanJson.includes('```json')) {
         cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '');
       }
       
       const parsed = JSON.parse(cleanJson);
       if (!Array.isArray(parsed)) throw new Error("Result is not an array");
       setClips(parsed);
       setParseError(null);
    } catch (err) {
      setParseError("Invalid JSON format. Please ensure it matches the example.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-xl font-bold text-white tracking-tight">Gemini Viral Clipper</h1>
          </div>
          <div className="text-xs font-mono text-gray-500 hidden sm:block">
            Local Processing • Privacy Focused
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Step 1: Upload */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 w-2 h-6 rounded-full"></span>
            0. Upload Video
          </h2>
          
          <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors bg-gray-900/50">
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {videoFile ? (
              <div className="flex flex-col items-center gap-2">
                <Video className="w-12 h-12 text-cyan-400" />
                <p className="font-medium text-white text-lg">{videoFile.name}</p>
                <p className="text-sm text-gray-400">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="text-xs text-green-400 mt-2">Ready for processing</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload className="w-12 h-12 mb-2" />
                <p className="font-medium text-gray-300">Click or drag video here</p>
                <p className="text-xs">Supports MP4, MOV, WEBM</p>
              </div>
            )}
          </div>

          {videoUrl && (
            <div className="mt-4 rounded-lg overflow-hidden bg-black aspect-video max-h-64 mx-auto border border-gray-700">
              <video src={videoUrl} controls className="w-full h-full object-contain" />
            </div>
          )}
        </section>

        {/* Step 2: Gemini Instructions */}
        <GeminiIntegration />

        {/* Step 3: JSON Input */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="bg-gradient-to-r from-orange-400 to-red-400 w-2 h-6 rounded-full"></span>
            2. Paste AI Response
          </h2>
          
          <div className="relative">
            <textarea
              value={jsonInput}
              onChange={handleJsonPaste}
              placeholder='Paste the JSON array from Gemini here. Example: [{"title": "Wow", "start": "00:10", "end": "00:20", "description": "..."}]'
              className="w-full h-40 bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-y"
            />
            <div className="absolute top-2 right-2">
                <Code2 className="text-gray-600" size={20} />
            </div>
          </div>

          {parseError && (
            <div className="mt-2 text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {parseError}
            </div>
          )}
          
          <button 
             onClick={manualParse}
             className="mt-3 text-sm text-cyan-400 hover:text-cyan-300 underline"
          >
            Force Parse JSON
          </button>
        </section>

        {/* Step 4: Output */}
        <ClipList clips={clips} videoFile={videoFile} />

      </main>
    </div>
  );
}
