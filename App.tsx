
import React, { useState, useCallback, useRef } from 'react';
import type { Floor } from './types';
import { generate3dFloorPlan } from './services/geminiService';
import { UploadIcon } from './components/icons/UploadIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';

const ImageDisplay: React.FC<{ src: string | null; alt: string; title: string; }> = ({ src, alt, title }) => (
  <div className="w-full lg:w-1/2 aspect-square bg-brand-primary rounded-lg flex flex-col items-center justify-center p-4">
    <h3 className="text-lg font-semibold text-brand-light mb-4">{title}</h3>
    <div className="w-full h-full bg-black/20 rounded-md flex items-center justify-center overflow-hidden">
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-contain animate-fade-in" />
    ) : (
      <p className="text-brand-accent">No image available</p>
    )}
    </div>
  </div>
);

const Uploader: React.FC<{ onFileSelect: (file: File) => void; isLoading: boolean }> = ({ onFileSelect, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (isLoading) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) onFileSelect(files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    const files = e.target.files;
    if (files && files.length > 0) onFileSelect(files[0]);
  };

  return (
    <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
      <label onDragOver={handleDragOver} onDrop={handleDrop} className="w-full aspect-square bg-brand-primary rounded-lg border-2 border-dashed border-brand-accent flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:border-brand-light hover:bg-black/10 transition-colors">
        <input type="file" ref={inputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isLoading} />
        <UploadIcon />
        <p className="mt-4 text-lg font-semibold">Upload 2D Floor Plan</p>
        <p className="text-sm text-brand-light mt-1">Drag & drop or click to select a file</p>
      </label>
    </div>
  );
};


const App: React.FC = () => {
  const [floor, setFloor] = useState<Floor>({
    originalImage: null,
    originalImageUrl: null,
    generatedImageUrl: null,
    isLoading: false,
    error: null,
  });
  
  const handleFileSelect = useCallback((file: File) => {
    setFloor(f => ({
      ...f,
      originalImage: file,
      originalImageUrl: URL.createObjectURL(file),
      generatedImageUrl: null,
      error: null,
    }));
  }, []);

  const handleGenerateClick = useCallback(async () => {
    if (!floor.originalImage) {
      setFloor(f => ({ ...f, error: 'Please upload a floor plan image first.' }));
      return;
    }
    setFloor(f => ({ ...f, isLoading: true, error: null }));
    try {
      // FIX: Use a hardcoded, valid model name as per Gemini API guidelines.
      const generatedUrl = await generate3dFloorPlan(floor.originalImage, 'gemini-2.5-flash-image');
      setFloor(f => ({ ...f, isLoading: false, generatedImageUrl: generatedUrl }));
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setFloor(f => ({ ...f, isLoading: false, error: `Generation failed: ${errorMessage}` }));
    }
  }, [floor.originalImage]);

  return (
    <div className="min-h-screen bg-brand-primary text-brand-text font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto bg-brand-secondary rounded-2xl border border-brand-accent/30 shadow-2xl overflow-hidden">
        <main className="px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <header className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">
              Architectural 3D Visualizer
            </h1>
            <p className="mt-3 text-lg text-brand-light max-w-2xl mx-auto">
              Upload your 2D floor plan to generate a stunning 3D rendering.
            </p>
          </header>

          <div className="bg-brand-secondary p-6 rounded-xl shadow-inner border border-brand-accent/20">
            {/* FIX: Removed model selector dropdown as it contained an invalid model and only one valid option is supported without extra setup. */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6">
              <button onClick={handleGenerateClick} disabled={!floor.originalImage || floor.isLoading} className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-teal-500 to-cyan-600 enabled:hover:opacity-80 focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 bg-[length:200%_auto] enabled:animate-gradient-bg w-full sm:w-auto justify-center">
                {floor.isLoading ? <><SpinnerIcon /> Generating...</> : 'Generate 3D View'}
              </button>
            </div>

            {floor.error && ( <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-md mb-4 text-sm">{floor.error}</div> )}

            <div className="flex flex-col lg:flex-row gap-6">
              {floor.originalImageUrl ? <ImageDisplay src={floor.originalImageUrl} alt="Original 2D floor plan" title="2D Blueprint" /> : <Uploader onFileSelect={handleFileSelect} isLoading={floor.isLoading} />}
              {floor.isLoading ? (
                <div className="w-full lg:w-1/2 aspect-square bg-brand-primary rounded-lg flex flex-col items-center justify-center p-4">
                  <h3 className="text-lg font-semibold text-brand-light mb-4">3D Rendering</h3>
                  <div className="w-full h-full bg-black/20 rounded-md flex flex-col items-center justify-center">
                    <SpinnerIcon />
                    <p className="mt-4 text-brand-light animate-pulse-fast">Visualizing structure...</p>
                  </div>
                </div>
              ) : ( <ImageDisplay src={floor.generatedImageUrl} alt="Generated 3D floor plan" title="3D Rendering" /> )}
            </div>
          </div>

        </main>
        <footer className="text-center py-6 border-t border-brand-accent/30 text-brand-light text-sm">
          <p>Powered by Gemini API</p>
        </footer>
      </div>
    </div>
  );
};

export default App;