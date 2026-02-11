import React, { useState, useCallback } from 'react';
import type { Floor } from './types';
import { FloorCard } from './components/FloorCard';

const App: React.FC = () => {
  const [floor, setFloor] = useState<Floor>({
    originalImage: null,
    originalImageUrl: null,
    generatedImageUrl: null,
    isLoading: false,
    error: null,
  });

  const updateFloor = useCallback((updatedFloor: Floor) => {
    setFloor(updatedFloor);
  }, []);

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

          <div className="space-y-8">
            <FloorCard floor={floor} onUpdate={updateFloor} />
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